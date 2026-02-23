# 🚀 Guía de Deploy: Edge Functions para Administración Segura

Este documento explica cómo deployar las Edge Functions que permiten la gestión segura de reseñas desde el panel admin usando el Service Role Key del lado del servidor.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener:

1. **Supabase CLI instalado**
   ```powershell
   npm install -g supabase
   ```

2. **Acceso al Dashboard de Supabase**
   - URL: https://supabase.com/dashboard
   - Ten a mano tu Project ID (visible en Settings > General)

3. **Tu contraseña de administrador**
   - Necesitas generar el hash SHA-256 de tu contraseña

---

## 🔐 Paso 1: Generar Hash de Contraseña Admin

Necesitas el hash SHA-256 de tu contraseña de administrador. **Usa la misma contraseña que usas para iniciar sesión en el panel admin**.

### Opción A: PowerShell (Windows)
```powershell
$password = "tu_contraseña_aqui"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($password)
$hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
$hashString = ($hash | ForEach-Object { $_.ToString("x2") }) -join ""
Write-Host "Tu hash SHA-256:" $hashString
```

### Opción B: OpenSSL (Linux/Mac)
```bash
echo -n "tu_contraseña_aqui" | openssl dgst -sha256
```

### Opción C: Online (menos seguro)
Visita: https://emn178.github.io/online-tools/sha256.html
- Pega tu contraseña
- Copia el hash resultante

⚠️ **IMPORTANTE**: Guarda este hash, lo necesitarás en el siguiente paso.

---

## 📡 Paso 2: Configurar Supabase CLI

### 2.1 Login en Supabase
```powershell
supabase login
```
- Se abrirá tu navegador
- Autoriza el acceso
- Verás "Logged in successfully" en la terminal

### 2.2 Link con tu Proyecto
```powershell
supabase link --project-ref tu-project-id
```

Ejemplo:
```powershell
supabase link --project-ref nfqlspoluvzvcjkcxsoq
```

- Te pedirá la contraseña de tu base de datos
- Puedes encontrarla en: Dashboard > Settings > Database > Database Password

---

## ☁️ Paso 3: Deploy de la Edge Function

### 3.1 Verificar que el archivo existe
```powershell
Get-Content "supabase\functions\admin-manage-review\index.ts"
```

Deberías ver el código de la función. Si no existe o hay error, verifica la estructura de carpetas.

### 3.2 Deploy
```powershell
supabase functions deploy admin-manage-review
```

Verás algo como:
```
Deploying function admin-manage-review...
Function URL: https://nfqlspoluvzvcjkcxsoq.supabase.co/functions/v1/admin-manage-review
✓ Deployed successfully
```

⚠️ **IMPORTANTE**: Copia la URL de la función, aunque no la necesitarás manualmente (el código ya la construye automáticamente).

---

## 🔑 Paso 4: Configurar Secrets (Variables de Entorno)

Las Edge Functions necesitan el hash de la contraseña admin para validar las peticiones.

### 4.1 Set del Secret
```powershell
supabase secrets set ADMIN_PASSWORD_HASH=tu-hash-sha256-aqui
```

Ejemplo:
```powershell
supabase secrets set ADMIN_PASSWORD_HASH=5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8
```

### 4.2 Verificar Secrets Configurados
```powershell
supabase secrets list
```

Deberías ver:
```
ADMIN_PASSWORD_HASH
SUPABASE_URL (automatically provided)
SUPABASE_SERVICE_ROLE_KEY (automatically provided)
```

✅ Los últimos dos son provistos automáticamente por Supabase, no los configures manualmente.

---

## 🧪 Paso 5: Probar la Edge Function

### 5.1 Test desde PowerShell

Primero, inicia sesión en el panel admin para obtener el token:
1. Abre http://localhost:5173/admin (o tu URL de desarrollo)
2. Inicia sesión
3. Abre DevTools (F12) > Console
4. Ejecuta: `sessionStorage.getItem('admin_token')`
5. Copia el hash resultante

Luego, prueba la función:
```powershell
$token = "tu-admin-token-aqui"
$url = "https://nfqlspoluvzvcjkcxsoq.supabase.co/functions/v1/admin-manage-review"
$body = @{
    action = "create"
    reviewData = @{
        title = "Test Review"
        game = "Test Game"
        slug = "test-review-123"
        author = "Test Author"
        date = "1 de enero de 2025"
        rating = 8.5
        excerpt = "Test excerpt"
        analysis = "Test analysis"
        gameplay = "Test gameplay"
        graphics = "Test graphics"
        story = "Test story"
        verdict = "Test verdict"
        pros = @("Pro 1", "Pro 2")
        cons = @("Con 1")
        coverImage = "https://example.com/image.jpg"
        screenshots = @()
        status = "draft"
    }
    adminToken = $token
} | ConvertTo-Json -Depth 10

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer tu-anon-key-aqui"
}

Invoke-RestMethod -Uri $url -Method POST -Body $body -Headers $headers
```

### 5.2 Respuesta Esperada

✅ **Éxito:**
```json
{
  "success": true,
  "data": { ...review data... },
  "message": "Review created successfully"
}
```

❌ **Error de autenticación:**
```json
{
  "error": "Unauthorized: Invalid admin token",
  "code": "INVALID_TOKEN"
}
```

---

## 🔍 Troubleshooting

### Error: "Function not found"
- Verifica que el deploy fue exitoso
- Comprueba el nombre: `admin-manage-review` (con guiones)
- Espera 10-30 segundos después del deploy

### Error: "ADMIN_PASSWORD_HASH not configured"
- Verifica que configuraste el secret correctamente
- Ejecuta: `supabase secrets list` para verificar
- Si no aparece, vuelve a ejecutar `supabase secrets set`

### Error: "Unauthorized: Invalid admin token"
- Verifica que el hash en sessionStorage sea correcto
- El hash debe coincidir con `ADMIN_PASSWORD_HASH`
- Intenta logout y login de nuevo en el panel admin

### Error: "Missing required fields"
- Verifica que reviewData incluya al menos: title, game, slug
- Revisa la estructura de datos en el test

### Error: "SUPABASE_SERVICE_ROLE_KEY not configured"
- **NO configures esta variable manualmente**
- Es provista automáticamente por Supabase
- Si aparece este error, contacta con soporte de Supabase

---

## 📊 Verificación en Dashboard

Después de un deploy exitoso:

1. **Ve a Edge Functions**
   - Dashboard > Edge Functions
   - Deberías ver `admin-manage-review` listada
   - Status: "Active" en verde

2. **Verifica Logs**
   - Click en la función
   - Tab "Logs"
   - Verás requests en tiempo real al usarla

3. **Verifica Secrets**
   - Settings > Edge Functions > Secrets
   - Debes ver `ADMIN_PASSWORD_HASH`
   - NO debes ver el valor del secret (oculto por seguridad)

---

## 🔄 Actualizar la Edge Function

Si haces cambios en el código:

```powershell
# Deploy de nuevo
supabase functions deploy admin-manage-review

# No necesitas reconfigurar secrets si no cambiaron
```

---

## 🛡️ Seguridad Post-Deploy

### ✅ Checklist de Seguridad

- [ ] `ADMIN_PASSWORD_HASH` configurado correctamente
- [ ] Service Role Key NUNCA expuesta en frontend
- [ ] Edge Function valida admin token antes de operar
- [ ] RLS policies restrictivas siguen activas
- [ ] `.env` en `.gitignore`
- [ ] Logs de Edge Functions monitoreados periódicamente

### 🔐 Mejores Prácticas

1. **Rota contraseñas periódicamente**
   - Genera nuevo hash
   - Actualiza secret: `supabase secrets set ADMIN_PASSWORD_HASH=nuevo-hash`

2. **Monitorea logs regularmente**
   - Busca intentos de acceso no autorizados
   - Verifica errores inesperados

3. **Backups de configuración**
   - Guarda tu hash SHA-256 en un gestor de contraseñas
   - Documenta tu configuración de secrets

4. **Rate Limiting**
   - Considera implementar rate limiting adicional en Edge Functions
   - Supabase tiene rate limiting básico por defecto

---

## 📚 Recursos Adicionales

- [Documentación de Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Service Role Key Docs](https://supabase.com/docs/guides/api/api-keys#the-service_role-key)

---

## ✅ Resumen del Proceso

1. ✅ Instalar Supabase CLI
2. ✅ Generar hash SHA-256 de contraseña admin
3. ✅ Login y link con proyecto
4. ✅ Deploy Edge Function
5. ✅ Configurar ADMIN_PASSWORD_HASH secret
6. ✅ Probar la función
7. ✅ Verificar en Dashboard
8. ✅ Monitorear logs

**Tiempo estimado**: 10-15 minutos

---

## 🆘 ¿Necesitas Ayuda?

Si encuentras problemas:
1. Verifica logs: `supabase functions logs admin-manage-review`
2. Revisa Dashboard > Edge Functions > Logs
3. Verifica que todos los secrets estén configurados
4. Comprueba que el hash de contraseña sea correcto

¡Listo! Tu sistema de administración ahora está **prácticamente blindado** 🛡️
