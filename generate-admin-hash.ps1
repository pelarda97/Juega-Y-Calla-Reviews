# GENERA TU HASH SHA-256
# =====================
# Reemplaza "TuContraseñaActual" con tu contraseña del panel admin
# El hash se mostrará en la terminal

$password = "TU_CONTRASENA_AQUI"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($password)
$hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
$hashString = ($hash | ForEach-Object { $_.ToString("x2") }) -join ""
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Tu Hash SHA-256:" -ForegroundColor Yellow
Write-Host $hashString -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANTE: Copia este hash, lo necesitarás en el paso 3" -ForegroundColor Yellow
