import { useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  lastActivity: number;
}

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes (reduced for security)
const STORAGE_KEY = 'admin_session';
const ATTEMPTS_KEY = 'login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Hash password using SHA-256
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Check if user is locked out
  const isLockedOut = (): boolean => {
    const attempts = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{"count": 0, "timestamp": 0}');
    if (attempts.count >= MAX_ATTEMPTS) {
      const timeSinceLockout = Date.now() - attempts.timestamp;
      if (timeSinceLockout < LOCKOUT_TIME) {
        return true;
      } else {
        // Reset attempts after lockout period
        localStorage.removeItem(ATTEMPTS_KEY);
      }
    }
    return false;
  };

  // Record failed login attempt
  const recordFailedAttempt = () => {
    const attempts = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{"count": 0, "timestamp": 0}');
    attempts.count += 1;
    attempts.timestamp = Date.now();
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  };

  // Reset attempts on successful login
  const resetAttempts = () => {
    localStorage.removeItem(ATTEMPTS_KEY);
  };

  // Check session validity
  const checkSession = () => {
    const sessionData = sessionStorage.getItem(STORAGE_KEY);
    if (!sessionData) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      const session: AuthState = JSON.parse(sessionData);
      const timeSinceActivity = Date.now() - session.lastActivity;

      if (timeSinceActivity > SESSION_TIMEOUT) {
        // Session expired
        logout();
      } else {
        // Update last activity
        updateActivity();
        setIsAuthenticated(true);
      }
    } catch (error) {
      logout();
    }
    setIsLoading(false);
  };

  // Update last activity timestamp
  const updateActivity = () => {
    const session: AuthState = {
      isAuthenticated: true,
      lastActivity: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  };

  // Login function
  const login = async (password: string): Promise<{ success: boolean; message: string }> => {
    // Check if locked out
    if (isLockedOut()) {
      const attempts = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{"count": 0, "timestamp": 0}');
      const remainingTime = Math.ceil((LOCKOUT_TIME - (Date.now() - attempts.timestamp)) / 60000);
      return {
        success: false,
        message: `Demasiados intentos fallidos. Bloqueado por ${remainingTime} minutos.`,
      };
    }

    // Delay to prevent brute force
    const attempts = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{"count": 0}');
    if (attempts.count > 0) {
      await new Promise(resolve => setTimeout(resolve, attempts.count * 1000));
    }

    // Hash and verify password
    const hashedPassword = await hashPassword(password);
    const correctHash = import.meta.env.VITE_ADMIN_PASSWORD_HASH;

    if (hashedPassword === correctHash) {
      const session: AuthState = {
        isAuthenticated: true,
        lastActivity: Date.now(),
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      // Guardar el hash para usarlo en peticiones API
      sessionStorage.setItem('admin_token', hashedPassword);
      resetAttempts();
      setIsAuthenticated(true);
      return { success: true, message: 'Login exitoso' };
    } else {
      recordFailedAttempt();
      const remainingAttempts = MAX_ATTEMPTS - (attempts.count + 1);
      return {
        success: false,
        message: remainingAttempts > 0 
          ? `Contraseña incorrecta. ${remainingAttempts} intentos restantes.`
          : 'Demasiados intentos fallidos. Bloqueado por 15 minutos.',
      };
    }
  };

  // Logout function
  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('admin_token');
    setIsAuthenticated(false);
  };

  // Check session on mount and set up activity listener
  useEffect(() => {
    checkSession();

    // Update activity on user interaction
    const handleActivity = () => {
      if (isAuthenticated) {
        updateActivity();
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Check session periodically
    const interval = setInterval(checkSession, 60000); // Check every minute

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
};
