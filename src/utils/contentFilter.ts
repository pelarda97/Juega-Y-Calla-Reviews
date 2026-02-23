// Lista de palabras y términos prohibidos
// Incluye groserías, insultos, contenido racista, homófobo, etc.
const FORBIDDEN_WORDS = [
  // Groserías y vulgaridades comunes (español)
  'puta', 'puto', 'zorra', 'cabron', 'cabrón', 'coño', 'joder', 'mierda', 'cagar', 'verga',
  'pendejo', 'pendeja', 'chingar', 'pinche', 'culero', 'culera', 'mamón', 'mamona',
  'idiota', 'imbécil', 'estúpido', 'estúpida', 'retrasado', 'retrasada', 'mogólico', 'mogólica',
  
  // Términos sexuales ofensivos
  'cipote', 'polla', 'chocho', 'chocha', 'teta', 'tetas', 'culo', 'culos', 'rabo',
  'pene', 'vagina', 'follar', 'folla', 'sexo oral', 'mamada', 'corrida',
  
  // Términos racistas
  'negro de mierda', 'sudaca', 'moro', 'panchito', 'chino de mierda', 'gitano', 'gitana',
  
  // Términos homófobos
  'maricón', 'maricon', 'marica', 'gay de mierda', 'bollera', 'tortillera', 'travelo',
  'sidoso', 'sidosa', 'trolo', 'puto marica',
  
  // Términos misóginos y sexistas
  'feminazi', 'guarra', 'perra', 'furcia', 'ramera', 'golfa',
  
  // Amenazas y violencia explícita
  'te mato', 'te voy a matar', 'ojalá te mueras', 'ojalá mueras', 'suicídate', 'muérete',
  'violación', 'violar', 'te voy a violar',
  
  // Groserías en inglés (comunes en gaming)
  'fuck', 'shit', 'bitch', 'asshole', 'nigger', 'faggot', 'cunt', 'dick', 'pussy',
  'motherfucker', 'retard', 'retarded',
];

// Patrones regex para detectar variaciones (números en lugar de letras, espacios, etc.)
const FORBIDDEN_PATTERNS = [
  /p[u\*0]t[a@4]/gi,              // puta, put@, p0ta, etc.
  /m[a@4]r[i1!]c[o0\*]/gi,        // maricon, mar1con, etc.
  /c[a@4]br[o0\*]n/gi,            // cabron, c@bron, etc.
  /j[o0]d[e3\*]r/gi,              // joder, j0d3r, etc.
  /m[i1!][e3\*]rd[a@4]/gi,        // mierda, mi3rd@, etc.
  /n[i1!]gg[a@4e3\*]r/gi,         // nigger, n1gg3r, etc.
  /f[a@4]gg[o0\*]t/gi,            // faggot, f@gg0t, etc.
  /r[e3\*]tr[a@4]s[a@4]d[o0\*]/gi, // retrasado, r3tras@do, etc.
  /c[i1!]p[o0\*]t[e3\*]/gi,       // cipote, c1p0te, etc.
  /p[o0\*]ll[a@4]/gi,             // polla, p0ll@, etc.
  /f[o0\*]ll[a@4]r/gi,            // follar, f0llar, etc.
];

/**
 * Valida el contenido de un comentario para detectar palabras ofensivas
 * @param content - El texto del comentario a validar
 * @returns { isValid: boolean, reason?: string }
 */
export const validateCommentContent = (content: string): { isValid: boolean; reason?: string } => {
  if (!content || content.trim().length === 0) {
    return { isValid: false, reason: 'El comentario no puede estar vacío' };
  }

  const contentLower = content.toLowerCase();

  // Verificar palabras prohibidas exactas
  for (const word of FORBIDDEN_WORDS) {
    if (contentLower.includes(word)) {
      return {
        isValid: false,
        reason: 'Tu comentario contiene lenguaje inapropiado. Por favor, mantén un tono respetuoso.'
      };
    }
  }

  // Verificar patrones regex (variaciones de palabras ofensivas)
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isValid: false,
        reason: 'Tu comentario contiene lenguaje inapropiado. Por favor, mantén un tono respetuoso.'
      };
    }
  }

  // Verificar longitud mínima (evitar spam de caracteres)
  if (content.trim().length < 3) {
    return { isValid: false, reason: 'El comentario debe tener al menos 3 caracteres' };
  }

  // Verificar longitud máxima
  if (content.length > 300) {
    return { isValid: false, reason: 'El comentario no puede superar los 300 caracteres' };
  }

  // Detectar spam de caracteres repetidos (aaaaaaaa, !!!!!!!, etc.)
  const repeatedCharsPattern = /(.)\1{9,}/; // 10 o más caracteres iguales consecutivos
  if (repeatedCharsPattern.test(content)) {
    return { isValid: false, reason: 'Por favor, evita repetir caracteres excesivamente' };
  }

  // Detectar comentarios que son solo mayúsculas (gritar)
  const wordsInUpperCase = content.split(/\s+/).filter(word => 
    word.length > 2 && word === word.toUpperCase() && /[A-Z]/.test(word)
  );
  const upperCaseRatio = wordsInUpperCase.length / content.split(/\s+/).length;
  if (upperCaseRatio > 0.7) {
    return { isValid: false, reason: 'Por favor, evita escribir todo en mayúsculas' };
  }

  return { isValid: true };
};

/**
 * Valida específicamente nombres de autor con reglas más estrictas
 * @param authorName - El nombre del autor a validar
 * @returns { isValid: boolean, reason?: string }
 */
export const validateAuthorName = (authorName: string): { isValid: boolean; reason?: string } => {
  if (!authorName || authorName.trim().length === 0) {
    return { isValid: false, reason: 'El nombre no puede estar vacío' };
  }

  // Validar longitud mínima y máxima
  if (authorName.trim().length < 2) {
    return { isValid: false, reason: 'El nombre debe tener al menos 2 caracteres' };
  }

  if (authorName.length > 50) {
    return { isValid: false, reason: 'El nombre no puede superar los 50 caracteres' };
  }

  const nameLower = authorName.toLowerCase();
  
  // Lista de nombres específicamente prohibidos (palabras ofensivas comunes usadas como nombres)
  const BANNED_NAMES = [
    'cipote', 'polla', 'puta', 'puto', 'cabron', 'cabrón', 'coño', 'joder', 
    'mierda', 'verga', 'maricón', 'maricon', 'marica', 'follar', 'folla'
  ];
  
  // Verificar nombres completos prohibidos (palabra completa, con límites de palabra)
  for (const bannedName of BANNED_NAMES) {
    // Crear regex para palabra completa: \b bannedName \b
    const wordBoundaryRegex = new RegExp(`\\b${bannedName}\\b`, 'i');
    if (wordBoundaryRegex.test(nameLower)) {
      return {
        isValid: false,
        reason: 'Este nombre no está permitido. Por favor, elige un nombre apropiado.'
      };
    }
  }
  
  // Detectar patrones como "H a r r y  C i p o t e" (espacios entre letras)
  const nameWithoutSpaces = authorName.replace(/\s+/g, '').toLowerCase();
  for (const bannedName of BANNED_NAMES) {
    if (nameWithoutSpaces === bannedName || nameWithoutSpaces.includes(bannedName)) {
      return {
        isValid: false,
        reason: 'Este nombre no está permitido. Por favor, elige un nombre apropiado.'
      };
    }
  }

  // Verificar patrones regex (para variaciones con números/símbolos)
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(nameLower) || pattern.test(nameWithoutSpaces)) {
      return {
        isValid: false,
        reason: 'Este nombre no está permitido. Por favor, elige un nombre apropiado.'
      };
    }
  }

  return { isValid: true };
};

/**
 * Sanitiza el contenido eliminando espacios extra y caracteres especiales innecesarios
 * @param content - El texto a sanitizar
 * @returns El contenido sanitizado
 */
export const sanitizeContent = (content: string): string => {
  return content
    .trim()
    .replace(/\s+/g, ' ')  // Múltiples espacios a uno solo
    .replace(/\n{3,}/g, '\n\n');  // Múltiples saltos de línea a máximo 2
};
