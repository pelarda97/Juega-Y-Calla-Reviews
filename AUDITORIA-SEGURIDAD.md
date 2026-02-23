# 🔒 Auditoría de Seguridad - Juega Y Calla Reviews
**Fecha**: 23 de Febrero de 2026  
**Estado**: ⚠️ VULNERABILIDADES CRÍTICAS ENCONTRADAS

---

## 📊 Resumen Ejecutivo

| Categoría | Estado | Nivel de Riesgo |
|-----------|--------|-----------------|
| Claves API | ⚠️ Parcial | MEDIO |
| Autenticación Admin | ✅ Seguro | BAJO |
| RLS Policies | ❌ CRÍTICO | ALTO |
| Validación Input | ✅ Seguro | BAJO |
| Exposición de Datos | ✅ Seguro | BAJO |
| XSS/Injection | ✅ Protegido | BAJO |

---

## 🚨 VULNERABILIDADES CRÍTICAS

### ❌ CRÍTICO #1: Editor de Reseñas NO puede funcionar con RLS actual

**Problema**:
El archivo `20260110000003_restrictive_policies.sql` contiene políticas que **BLOQUEAN COMPLETAMENTE** las operaciones INSERT/UPDATE/DELETE en la tabla `reviews`:

```sql
CREATE POLICY "Reviews INSERT restricted"
ON public.reviews
AS RESTRICTIVE
FOR INSERT
WITH CHECK (false);  -- ❌ SIEMPRE RECHAZA

CREATE POLICY "Reviews UPDATE restricted"
ON public.reviews
AS RESTRICTIVE
FOR UPDATE
USING (false);  -- ❌ SIEMPRE RECHAZA
```

**Impacto**:
- ❌ El `ReviewEditor.tsx` NO puede insertar nuevas reseñas
- ❌ El `ReviewEditor.tsx` NO puede actualizar reseñas existentes
- ❌ El sistema de borradores no funcionará en producción

**Evidencia**:
```typescript
// En ReviewEditor.tsx líneas 411-428
const { error } = await supabase
  .from('reviews')
  .update(cleanedData)  // ❌ SERÁ RECHAZADO POR RLS
  .eq('slug', formData.slug);

const { error } = await supabase
  .from('reviews')
  .insert(cleanedData);  // ❌ SERÁ RECHAZADO POR RLS
```

**Solución URGENTE**:
Necesitas crear una nueva migración que permita operaciones desde un rol específico de admin:

```sql
-- Eliminar políticas restrictivas actuales
DROP POLICY IF EXISTS "Reviews INSERT restricted" ON public.reviews;
DROP POLICY IF EXISTS "Reviews UPDATE restricted" ON public.reviews;

-- Crear nueva política para authenticated users con rol admin
CREATE POLICY "Allow admin to manage reviews"
ON public.reviews
FOR ALL
USING (
  auth.role() = 'authenticated' 
  AND auth.jwt()->>'email' = 'tu-email-admin@dominio.com'
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND auth.jwt()->>'email' = 'tu-email-admin@dominio.com'
);
```

**O usar Service Role Key** (más seguro):
El editor debería usar el Service Role Key en un backend endpoint protegido, NO directamente desde el frontend.

---

### ⚠️ MEDIO #2: Anon Key expuesta en el código

**Problema**:
En `src/integrations/supabase/client.ts` línea 9:

```typescript
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcWxzcG9sdXZ6dmNqa2N4c29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMzI3MzksImV4cCI6MjA3MTcwODczOX0.okCUK0r02cFBIDk0Y0HwhT7U8mRSatFTvyyw7tZPZ6Q";
```

**Nivel de Riesgo**: MEDIO (pero aceptable si RLS está bien configurado)

**Por qué es aceptable**:
- ✅ El Anon Key está **diseñado** para ser público
- ✅ Supabase documenta que es seguro exponerlo
- ✅ La seguridad real viene de las RLS policies

**Por qué sigue siendo un riesgo**:
- ⚠️ Está hardcodeada como fallback en el código
- ⚠️ Si el .env no se carga, usa esta clave directamente
- ⚠️ La clave está en el repositorio de GitHub

**Recomendación**:
```typescript
// Cambiar a:
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('VITE_SUPABASE_ANON_KEY no está configurada');
}
```

---

### ⚠️ MEDIO #3: URL de Supabase expuesta

Similar al punto anterior, la URL está hardcodeada:
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 
  "https://nfqlspoluvzvcjkcxsoq.supabase.co";
```

**Riesgo**: BAJO-MEDIO
- La URL es necesariamente pública para que el frontend funcione
- Pero exponerla facilita ataques dirigidos

**Recomendación**: Misma que el punto #2, forzar uso de variables de entorno.

---

## ✅ ASPECTOS SEGUROS

### 1. Autenticación del Admin Panel ✅

**Implementación**: `src/hooks/useAuth.ts`

**Protecciones**:
- ✅ **SHA-256 hashing** de contraseñas
- ✅ **Rate limiting**: Delay progresivo (1s, 2s, 3s...)
- ✅ **Lockout**: 5 intentos fallidos = bloqueo de 15 minutos
- ✅ **Session timeout**: 15 minutos de inactividad
- ✅ **Activity tracking**: Renueva sesión con interacción
- ✅ **sessionStorage** (no localStorage): Se borra al cerrar pestaña

**Código relevante**:
```typescript
// Hash con SHA-256
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Verificación con rate limiting
if (attempts.count > 0) {
  await new Promise(resolve => setTimeout(resolve, attempts.count * 1000));
}
```

**Nota**: La contraseña está en `VITE_ADMIN_PASSWORD_HASH` (variable de entorno), NO en el código.

---

### 2. Validación de Entrada ✅

**Comentarios** (`src/utils/contentFilter.ts`):
```typescript
// Límite de longitud
if (content.length > 300) return invalid;

// Profanity filter
const lowerContent = content.toLowerCase();
for (const word of bannedWords) {
  if (lowerContent.includes(word)) return invalid;
}

// Spam detection
const urlCount = (content.match(/https?:\/\//gi) || []).length;
if (urlCount > 2) return invalid;
```

---

### 3. Protección XSS ✅

**React automáticamente escapa** todo el contenido renderizado:
```tsx
// Seguro por defecto
<p>{review.introduccion}</p>
```

No se usa `dangerouslySetInnerHTML` en ningún lugar del código ✅

---

### 4. .gitignore Correcto ✅

```ignore
# Protección de credenciales
.env
.env.local
.env.production
.env.development
```

**Verificado**: No hay archivos `.env` en el repositorio ✅

---

### 5. Sin Service Role Key expuesta ✅

**Búsqueda exhaustiva**: NO se encontró `service_role` en el código ✅

Esto es **crítico y correcto**: El Service Role Key tiene acceso total y **NUNCA** debe estar en el frontend.

---

## 🔧 RECOMENDACIONES INMEDIATAS

### 🚨 URGENTE: Arreglar RLS Policies

**Archivo**: Crear `supabase/migrations/20260223000001_fix_admin_access.sql`

**Opción 1: Backend API protegido** (MÁS SEGURO)
```sql
-- Mantener políticas restrictivas
-- Crear un backend (Supabase Edge Function o API externa)
-- que use Service Role Key para modificar reviews
```

**Opción 2: Authenticated user con email específico**
```sql
-- Eliminar restrictive policies
DROP POLICY IF EXISTS "Reviews INSERT restricted" ON public.reviews;
DROP POLICY IF EXISTS "Reviews UPDATE restricted" ON public.reviews;
DROP POLICY IF EXISTS "Reviews DELETE restricted" ON public.reviews;

-- Permitir solo a usuario admin autenticado
CREATE POLICY "Admin can insert reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt()->>'email' = 'tu-email-admin@ejemplo.com'
);

CREATE POLICY "Admin can update reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (
  auth.jwt()->>'email' = 'tu-email-admin@ejemplo.com'
)
WITH CHECK (
  auth.jwt()->>'email' = 'tu-email-admin@ejemplo.com'
);

CREATE POLICY "Admin can delete reviews"
ON public.reviews
FOR DELETE
TO authenticated
USING (
  auth.jwt()->>'email' = 'tu-email-admin@ejemplo.com'
);
```

**Opción 3: Service Role desde backend** (RECOMENDADO)
Crear Edge Functions en Supabase:
```typescript
// supabase/functions/admin-create-review/index.ts
import { createClient } from '@supabase/supabase-js'

export async function handler(req: Request) {
  // Validar token admin del request
  const adminToken = req.headers.get('admin-token');
  if (adminToken !== hashedAdminPassword) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Usar Service Role para insertar
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // ✅ Seguro, solo en backend
  );

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .insert(reviewData);

  return new Response(JSON.stringify(data), { status: 200 });
}
```

---

### ⚠️ IMPORTANTE: Eliminar claves hardcodeadas

**Archivo**: `src/integrations/supabase/client.ts`

**Antes**:
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://xxx";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJ...";
```

**Después**:
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Las credenciales de Supabase no están configuradas. Revisa tu archivo .env');
}
```

---

### 📋 OPCIONAL: Mejoras adicionales

1. **Rate limiting a nivel de Supabase**
   - Configurar en Dashboard > Settings > API > Rate Limiting
   - Limitar requests por IP/anon key

2. **CAPTCHA en formularios públicos**
   - Añadir reCAPTCHA v3 en el formulario de comentarios
   - Prevenir spam automatizado

3. **Monitoreo y alertas**
   - Configurar alertas de Supabase para:
     - Intentos fallidos de autenticación
     - Picos de tráfico inusuales
     - Errores de RLS

4. **Backup automático**
   - Configurar backups diarios de Supabase
   - Mantener copias en almacenamiento externo

5. **Content Security Policy (CSP)**
   - Añadir headers CSP en `index.html`:
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; 
                  script-src 'self' 'unsafe-inline'; 
                  style-src 'self' 'unsafe-inline'; 
                  img-src 'self' data: https:;">
   ```

---

## 📝 CHECKLIST DE ACCIÓN INMEDIATA

- [ ] **CRÍTICO**: Arreglar políticas RLS para permitir INSERT/UPDATE de admin
- [ ] **IMPORTANTE**: Probar ReviewEditor después de arreglar RLS
- [ ] **RECOMENDADO**: Eliminar fallbacks hardcodeados de claves
- [ ] **OPCIONAL**: Regenerar Anon Key en Supabase y actualizar .env
- [ ] **OPCIONAL**: Configurar rate limiting en Supabase Dashboard
- [ ] **OPCIONAL**: Añadir backup automático

---

## 🎯 Conclusión

**Estado actual**: ⚠️ **PRODUCCIÓN NO RECOMENDADA**

**Motivo**: El ReviewEditor no puede funcionar debido a las políticas RLS restrictivas.

**Próximos pasos**:
1. Decidir arquitectura: ¿Backend con Service Role o authenticated user?
2. Aplicar migración correspondiente
3. Testear ReviewEditor en producción
4. Opcional: Implementar mejoras adicionales

**Tiempo estimado de corrección**: 30-60 minutos

---

## 📧 Contacto

Si necesitas ayuda implementando las correcciones, consulta:
- [Documentación de RLS de Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
