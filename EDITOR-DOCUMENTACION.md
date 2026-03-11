# Editor de Reseñas - Documentación Técnica

## Descripción General

El `ReviewEditor` es un componente React integrado en el panel de administración (`/admin`) que permite crear, editar y publicar reseñas directamente desde la interfaz web, sin necesidad de modificar archivos JSON manualmente ni acceder directamente a la base de datos.

**Archivo:** `src/components/ReviewEditor.tsx`
**Líneas de código:** ~950
**Dependencias:** shadcn/ui, Supabase Client, Edge Functions

---

## Campos del Formulario

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `title` | texto | ✅ Siempre | Título de la reseña |
| `slug` | texto | ✅ Siempre | URL amigable (auto-generado desde título) |
| `game_title` | texto | ✅ Publicar | Título del juego (auto-rellena desde título) |
| `genre` | texto | ❌ | Género del juego |
| `rating` | número 0-5 | ✅ Publicar | Puntuación |
| `publish_date` | texto | ✅ Publicar | Fecha de publicación (auto-rellena con hoy) |
| `author` | texto | ✅ Publicar | Autor (defecto: "Juega Y Calla") |
| `image_url` | URL | ✅ Publicar | Imagen de portada |
| `introduccion` | textarea | ❌ | Introducción de la reseña |
| `argumento` | textarea | ❌ | Análisis del argumento/historia |
| `gameplay` | textarea | ❌ | Análisis del gameplay |
| `funciones` | textarea | ❌ | Funciones y características del juego |
| `duracion` | textarea | ❌ | Duración del juego |
| `valoracion_personal` | textarea | ❌ | Valoración personal/veredicto |
| `imagenes` | array URLs | ❌ | Screenshots (añadir/quitar dinámicamente) |
| `video_url` | array URLs | ❌ | URLs de vídeos (añadir/quitar dinámicamente) |
| `status` | draft/published | ✅ Siempre | Estado de la reseña |

---

## Funcionalidades

### 1. Modos de Operación

**Modo Crear (`create`):**
- Formulario vacío listo para nueva reseña
- Auto-genera `slug` desde el `title`
- Autoguardado local activado
- Al subir con éxito: limpia formulario y localStorage

**Modo Editar (`edit`):**
- Carga todos los datos de una reseña existente desde Supabase
- Incluye el `id` de base de datos para identificar la fila a actualizar
- No usa autoguardado local (los datos están en Supabase)
- Permite cambiar el `status` de `draft` a `published` o viceversa

### 2. Selector de Reseña

Desplegable en la parte superior que muestra:
- **"Nueva reseña"** — resetea el formulario
- Todas las reseñas existentes (ordenadas: borradores primero, luego por fecha)
- Badge de estado (`draft` / `published`) junto a cada reseña

### 3. Autoguardado Local

- **Activado en modo `create`** cuando el título no está vacío
- **Intervalo:** cada 5 segundos (`AUTOSAVE_INTERVAL = 5000`)
- **Almacenamiento:** `localStorage` con clave `juega-y-calla-draft-review`
- **Formato guardado:** `{ data: ReviewData, timestamp: ISO string }`
- **Recuperación automática:** Al abrir el editor, si hay borrador guardado lo carga
- **Limpieza automática:** Al subir con éxito a Supabase
- **Botón manual:** "Borrar borrador local" con confirmación

### 4. Sistema de Confirmación (Anti-accidente)

Antes de cualquier subida a Supabase, aparece un `AlertDialog` con:
- Descripción de la acción que se va a realizar
- Qué implica (visible/no visible públicamente)
- Botón "Cancelar" y botón de confirmación

**Validación antes del diálogo:**
- **Borrador:** Solo requiere `title` no vacío
- **Publicar:** Requiere `title`, `rating` (0-5) e `image_url`

### 5. Subida a Supabase (vía Edge Function)

El proceso al confirmar:

```
1. Obtiene admin_token de sessionStorage
2. Verifica que el token existe
3. Limpia arrays vacíos (imagenes, video_url)
4. Determina acción: 'create' (modo nuevo) o 'update' (modo editar)
5. Llama a Edge Function con: action + reviewData + adminToken
6. Procesa respuesta (éxito o error)
7. Si éxito en create: limpia localStorage, resetea formulario
```

### 6. Exportar JSON

Botón "Exportar JSON" que descarga el formulario actual como archivo `.json` al ordenador, útil para hacer backup antes de subir.

### 7. Generación Automática de Slug

Al escribir el título:
- Convierte a minúsculas
- Elimina acentos (normalización NFD)
- Elimina caracteres especiales
- Reemplaza espacios por guiones
- Elimina guiones duplicados

**Ejemplo:** "Resident Evil 7: Biohazard" → `resident-evil-7-biohazard`

---

## Arquitectura de Seguridad

### Flujo de una Subida

```
ReviewEditor (frontend)
  ↓
1. Valida campos del formulario
2. Muestra confirmación al admin
3. Obtiene admin_token de sessionStorage
  ↓
Edge Function: admin-manage-review (servidor Supabase)
  ↓
4. Valida admin_token === ADMIN_PASSWORD_HASH (env secret)
5. Si inválido → 401 Unauthorized
6. Si válido → usa SUPABASE_SERVICE_ROLE_KEY
  ↓
Base de Datos PostgreSQL
  ↓
7. INSERT o UPDATE en tabla reviews
8. Devuelve resultado
```

### Por qué no se accede directamente a Supabase

Las RLS (Row Level Security) policies están configuradas como **restrictivas**:

```sql
-- Bloquea TODOS los INSERT directos
CREATE POLICY "Reviews INSERT restricted" AS RESTRICTIVE
FOR INSERT WITH CHECK (false);

-- Bloquea TODOS los UPDATE directos  
CREATE POLICY "Reviews UPDATE restricted" AS RESTRICTIVE
FOR UPDATE USING (false);
```

Esto significa que **ningún cliente con ANON_KEY puede crear o editar reseñas**, aunque tenga acceso al código. Solo la Edge Function con SERVICE_ROLE_KEY puede hacerlo.

### Credenciales y sus ubicaciones

| Credencial | Dónde vive | Visible en navegador |
|------------|-----------|----------------------|
| `VITE_SUPABASE_URL` | `.env` | ✅ Sí (no es sensible) |
| `VITE_SUPABASE_ANON_KEY` | `.env` | ✅ Sí (protegida por RLS) |
| `VITE_ADMIN_PASSWORD_HASH` | `.env` | ✅ Sí (hash SHA-256 irreversible) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Secrets | ❌ Nunca |
| `ADMIN_PASSWORD_HASH` | Supabase Secrets | ❌ Nunca |
| Contraseña real del admin | Solo tu cabeza | ❌ Nunca |

---

## Edge Function: `admin-manage-review`

**Archivo:** `supabase/functions/admin-manage-review/index.ts`
**Runtime:** Deno (servidor de Supabase)
**URL:** `https://nfqlspoluvzvcjkcxsoq.supabase.co/functions/v1/admin-manage-review`

### Request esperado

```typescript
{
  action: 'create' | 'update',
  reviewData: {
    id?: string,          // requerido solo en 'update'
    title: string,        // requerido
    game_title?: string,  // requerido (acepta game_title o game)
    slug: string,         // requerido
    // ...resto de campos opcionales
    status: 'draft' | 'published'
  },
  adminToken: string      // hash SHA-256 de la contraseña admin
}
```

### Respuestas posibles

| Status | Código | Descripción |
|--------|--------|-------------|
| 200 | `success: true` | Operación correcta |
| 400 | `VALIDATION_ERROR` | Faltan campos obligatorios |
| 401 | `INVALID_TOKEN` | Token de admin no válido |
| 500 | `DATABASE_ERROR` | Error en la base de datos |
| 500 | `INTERNAL_ERROR` | Error interno de la función |

### Secrets configurados

| Secret | Descripción | Configurado por |
|--------|-------------|-----------------|
| `ADMIN_PASSWORD_HASH` | Hash SHA-256 de la contraseña admin | Manual (Supabase Dashboard) |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave maestra de Supabase | Automático (Supabase) |
| `SUPABASE_URL` | URL del proyecto | Automático (Supabase) |

---

## Generación del Hash de Admin

El hash se genera con el script `generate-admin-hash.ps1`:

```powershell
$password = "tu_contraseña"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($password)
$hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
$hashString = ($hash | ForEach-Object { $_.ToString("x2") }) -join ""
```

El mismo hash se almacena en dos lugares:
1. **`.env`** como `VITE_ADMIN_PASSWORD_HASH` → para que el login en `useAuth.ts` funcione
2. **Supabase Secrets** como `ADMIN_PASSWORD_HASH` → para que la Edge Function valide

Ambos deben ser idénticos. Si cambias la contraseña, actualiza los dos.

---

## Sistema de Autenticación (useAuth.ts)

El editor solo es accesible desde el panel admin (`/admin`), que requiere autenticación previa.

**Características de la autenticación:**
- Contraseña hasheada con **SHA-256** antes de comparar
- **Rate limiting:** máximo 5 intentos fallidos
- **Lockout:** 15 minutos de bloqueo tras 5 intentos fallidos
- **Session timeout:** 15 minutos de inactividad cierra sesión
- **Activity tracking:** mousemove, keypress, click, scroll resetean el timer
- **Storage:** `sessionStorage` (se borra al cerrar pestaña)
- **Token guardado:** `admin_token` en sessionStorage (hash SHA-256)

---

## Sistema de Borradores

### Borrador Local (localStorage)
- Guardado: automáticamente cada 5 segundos mientras se escribe
- Recuperado: automáticamente al abrir el editor
- Borrado: automáticamente al subir a Supabase, o manualmente con el botón

### Borrador en Supabase (status: 'draft')
- No visible en la web pública (RLS filtra por `status = 'published'`)
- Visible en el panel admin (selector de reseñas)
- Se puede editar y publicar desde el editor
- Se puede ver en Supabase Dashboard → Table Editor → reviews

---

## Cómo Usar el Editor

### Crear una nueva reseña

1. Accede a `/admin` e inicia sesión
2. El editor estará en modo "Nueva reseña"
3. Escribe el título (el slug se genera automáticamente)
4. Rellena los campos deseados
5. El trabajo se guarda localmente cada 5 segundos
6. Cuando estés listo:
   - **"Subir como borrador"**: sube sin publicar (invisible para usuarios)
   - **"Publicar"**: sube y publica (visible para todos)
7. Confirma la acción en el diálogo

### Editar una reseña existente

1. En el desplegable superior, selecciona la reseña
2. Los datos se cargan automáticamente
3. Modifica lo que necesites
4. Usa "Subir como borrador" o "Publicar" para guardar los cambios

### Publicar un borrador existente

1. Selecciona el borrador en el desplegable (aparece primero con badge "draft")
2. Haz click en "Publicar"
3. Confirma en el diálogo

---

## Notas de Mantenimiento

### Si cambias tu contraseña de admin

1. Edita `generate-admin-hash.ps1` con la nueva contraseña
2. Ejecuta `.\generate-admin-hash.ps1`
3. Copia el nuevo hash
4. Actualiza `.env`: `VITE_ADMIN_PASSWORD_HASH=nuevo_hash`
5. Actualiza Supabase Secret: Dashboard → Project Settings → Edge Functions → Secrets → `ADMIN_PASSWORD_HASH`
6. Redespliega la Edge Function en Supabase

### Si la Edge Function da errores

1. Dashboard → Edge Functions → admin-manage-review → Logs
2. Busca mensajes de error en los logs
3. Errores comunes:
   - `ADMIN_PASSWORD_HASH not configured`: el secret no está configurado o hay que redesplegar
   - `Database error`: problema con los datos enviados o la tabla
   - `SUPABASE_SERVICE_ROLE_KEY not configured`: contactar soporte Supabase

### Borrar reseñas

Las reseñas se borran directamente desde:
**Supabase Dashboard → Table Editor → reviews → seleccionar fila → Delete**

No hay botón de borrar en el panel admin (decisión deliberada para evitar borrados accidentales).
