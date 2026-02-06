# Variables de Entorno para Vercel

## ⚠️ IMPORTANTE: Variables para Funciones API

Las funciones API de Vercel (archivos en `/api/`) **NO tienen acceso** a las variables con prefijo `VITE_`. 

Necesitas añadir las variables **SIN el prefijo** para que las funciones serverless funcionen.

---

## 📋 Variables a Añadir en Vercel

Ve a: **Vercel Dashboard → Tu Proyecto → Settings → Environment Variables**

### Variables FRONTEND (con prefijo VITE_):
- ✅ `VITE_ADMIN_PASSWORD_HASH` = `e950ef1798c1425ead54cf31c44d62837ded6b28429966690af46e94abd24a4c`
- ✅ `VITE_SUPABASE_URL` = `https://nfqlspoluvzvcjkcxsoq.supabase.co`
- ✅ `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcWxzcG9sdXZ6dmNqa2N4c29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMzI3MzksImV4cCI6MjA3MTcwODczOX0.okCUK0r02cFBIDk0Y0HwhT7U8mRSatFTvyyw7tZPZ6Q`

### Variables API/BACKEND (sin prefijo VITE_):
- ⚠️ `ADMIN_PASSWORD_HASH` = `e950ef1798c1425ead54cf31c44d62837ded6b28429966690af46e94abd24a4c`
- ⚠️ `SUPABASE_URL` = `https://nfqlspoluvzvcjkcxsoq.supabase.co`
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcWxzcG9sdXZ6dmNqa2N4c29xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjEzMjczOSwiZXhwIjoyMDcxNzA4NzM5fQ.iS544OVTNAQZWXQ9cKXJpv1N9x8itFij4BEGSiFSBWs`

---

## 🎯 Entornos a Marcar

Para cada variable, marca:
- ✅ **Production** (producción)
- ✅ **Preview** (ramas de prueba como fix/admin-panel-secure)
- ❌ **Development** (NO, porque en local usas .env.local)

---

## 🔄 Después de Añadir las Variables

1. Vercel te preguntará si quieres redesplegar
2. Click en **"Redeploy"** para aplicar los cambios
3. Espera 1-2 minutos
4. Prueba de nuevo eliminar un comentario

---

## ✅ Verificación

Las funciones API ahora intentan leer las variables en este orden:
1. `SUPABASE_URL` (sin prefijo, para Vercel)
2. `VITE_SUPABASE_URL` (con prefijo, fallback)

Esto asegura compatibilidad tanto en desarrollo local como en producción.
