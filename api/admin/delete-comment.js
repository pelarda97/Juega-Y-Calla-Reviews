import { createClient } from '@supabase/supabase-js';

// Esta función se ejecuta en el servidor (Vercel)
// La Service Role Key nunca llega al cliente
export default async function handler(req, res) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { commentId, adminToken } = req.body;

    // Validar que se envió el comentario ID
    if (!commentId) {
      return res.status(400).json({ error: 'commentId es requerido' });
    }

    // Validar sesión de admin (verificar el hash de la contraseña)
    // Usar la variable ya cargada arriba
    const expectedHash = adminPasswordHash;
    
    if (!adminToken || adminToken !== expectedHash) {
      return res.status(401).json({ error: 'No autorizado - Token de admin inválido' });
    }

    // Crear cliente de Supabase con Service Role Key (solo en servidor)
    // En Vercel las variables NO usan el prefijo VITE_ para las funciones API
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || process.env.VITE_ADMIN_PASSWORD_HASH;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Variables de entorno no configuradas');
      console.error('SUPABASE_URL:', supabaseUrl ? 'Configurada' : 'Faltante');
      console.error('SERVICE_ROLE_KEY:', serviceRoleKey ? 'Configurada' : 'Faltante');
      return res.status(500).json({ 
        error: 'Error de configuración del servidor',
        details: 'Variables de entorno faltantes'
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Eliminar comentario usando Service Role Key (ignora RLS)
    const { data, error } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('id', commentId)
      .select();

    if (error) {
      console.error('❌ Error al eliminar comentario:', error);
      return res.status(500).json({ 
        error: 'Error al eliminar comentario',
        details: error.message 
      });
    }

    console.log('✅ Comentario eliminado exitosamente:', commentId);

    return res.status(200).json({ 
      success: true, 
      message: 'Comentario eliminado correctamente',
      data 
    });

  } catch (error) {
    console.error('❌ Error en API delete-comment:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}
