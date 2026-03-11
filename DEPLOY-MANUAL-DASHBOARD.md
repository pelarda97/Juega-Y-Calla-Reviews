# 🚀 Deploy Manual de Edge Function (sin CLI)

## Por favor, sigue estos pasos en tu navegador:

---

## 📍 **PASO 1: Generar Hash de Contraseña**

1. **Edita el archivo** `generate-admin-hash.ps1`
2. **Reemplaza** `"TuContraseñaActual"` con tu contraseña del panel admin (línea 6)
3. **Ejecuta en terminal:**
   ```powershell
   .\generate-admin-hash.ps1
   ```
4. **Copia el hash SHA-256** que aparece en color cyan (lo necesitarás en el Paso 4)

---

## 🌐 **PASO 2: Acceder a Dashboard de Supabase**

1. Abre: https://supabase.com/dashboard/project/nfqlspoluvzvcjkcxsoq
2. Inicia sesión si no lo estás

---

## ⚡ **PASO 3: Crear Edge Function desde Dashboard**

1. En el menú izquierdo, busca **"Edge Functions"** (icono de rayo ⚡)
2. Click en **"Create a new function"**
3. En el campo **"Function name"**, escribe:
   ```
   admin-manage-review
   ```
4. Click en **"Create function"**

---

## 📝 **PASO 4: Copiar Código de la Función**

1. Se abrirá un editor de código en el Dashboard
2. **BORRA** todo el código de ejemplo que aparece
3. **COPIA** el código del archivo: `supabase/functions/admin-manage-review/index.ts`
4. **PEGA** el código en el editor del Dashboard
5. Click en **"Deploy"** (o "Save and Deploy")
6. Espera a que termine el deploy (verás un mensaje de éxito)

---

## 🔐 **PASO 5: Configurar Secret (ADMIN_PASSWORD_HASH)**

1. En el menú izquierdo, ve a **"Project Settings"** (⚙️ engranaje)
2. En el menú de settings, busca **"Edge Functions"**
3. Verás una sección **"Secrets"** o **"Environment Variables"**
4. Click en **"Add new secret"**
5. Configura:
   - **Name:** `ADMIN_PASSWORD_HASH`
   - **Value:** [pega aquí el hash SHA-256 del Paso 1]
6. Click en **"Save"** o **"Add secret"**

---

## ✅ **PASO 6: Verificar Deploy**

1. Regresa a **"Edge Functions"** en el menú izquierdo
2. Deberías ver **"admin-manage-review"** con estado **"Active"** (verde)
3. Click en la función para ver detalles
4. Copia la **URL** de la función (algo como: `https://nfqlspoluvzvcjkcxsoq.supabase.co/functions/v1/admin-manage-review`)

---

## 🧪 **PASO 7: Probar la Edge Function**

### Opción A: Probar desde tu Panel Admin

1. Abre tu aplicación en desarrollo: http://localhost:5173
2. Inicia sesión en el panel admin
3. Intenta crear una reseña de prueba como borrador
4. Si se sube correctamente, ¡la Edge Function funciona! ✅

### Opción B: Probar con Postman o Thunder Client (VS Code Extension)

Si quieres probar antes:

**URL:** `https://nfqlspoluvzvcjkcxsoq.supabase.co/functions/v1/admin-manage-review`

**Method:** POST

**Headers:**
```
Content-Type: application/json
Authorization: Bearer [tu-anon-key]
```

**Body:**
```json
{
  "action": "create",
  "adminToken": "[tu-hash-sha256]",
  "reviewData": {
    "title": "Test Review",
    "game": "Test Game",
    "slug": "test-review-999",
    "author": "Test Author",
    "date": "23 de febrero de 2026",
    "rating": 8.5,
    "excerpt": "Test excerpt",
    "analysis": "Test analysis",
    "gameplay": "Test gameplay",
    "graphics": "Test graphics",
    "story": "Test story",
    "verdict": "Test verdict",
    "pros": ["Pro 1", "Pro 2"],
    "cons": ["Con 1"],
    "coverImage": "https://example.com/image.jpg",
    "screenshots": [],
    "status": "draft"
  }
}
```

---

## 📊 **RESUMEN DE LO QUE ESTÁS HACIENDO**

- ✅ **Edge Function:** Código server-side que usa Service Role Key de forma segura
- ✅ **Secret:** Hash de tu contraseña para validar que eres admin
- ✅ **Sin CLI:** Todo desde el navegador, más simple
- ✅ **Seguro:** Service Role Key nunca sale del servidor de Supabase

---

## ❓ **Problemas Comunes**

### "Invalid admin token"
- Verifica que el hash en el secret sea idéntico al hash en sessionStorage
- Ejecuta de nuevo `generate-admin-hash.ps1` si tienes dudas

### "Function not found"
- Espera 30 segundos después del deploy
- Verifica que el nombre sea exactamente `admin-manage-review` (con guiones)

### "ADMIN_PASSWORD_HASH not configured"
- Verifica que creaste el secret en Project Settings > Edge Functions > Secrets
- El nombre DEBE ser exactamente `ADMIN_PASSWORD_HASH` (en mayúsculas)

### "Missing required fields"
- Verifica que reviewData incluya al menos: title, game, slug

---

## 🎯 **Una vez completado todo:**

Tu sistema estará 100% funcional y seguro. Podrás:
- Crear reseñas desde el panel admin
- Guardar como borrador o publicar directamente
- Editar reseñas existentes
- Todo con máxima seguridad (Service Role Key protegido)

---

**Tiempo estimado:** 10-15 minutos

**¿Necesitas ayuda?** Avísame en qué paso estás y te ayudo.
