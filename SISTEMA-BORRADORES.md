# Sistema de Guardado Seguro con Confirmación - Instrucciones

## ⚠️ IMPORTANTE: Protección Contra Subidas Accidentales

El editor ahora tiene **protección completa** contra subidas accidentales a Supabase:

### ✅ Cómo Funciona Ahora

1. **Autoguardado Local (Cada 5 segundos)**
   - Todo lo que escribes se guarda automáticamente en tu navegador (localStorage)
   - NO se sube a Supabase automáticamente
   - Puedes cerrar sesión y tu trabajo estará ahí cuando vuelvas
   - Indicador visual muestra la última vez que se guardó localmente

2. **Subida Manual con Confirmación**
   - Solo se sube a Supabase cuando TÚ lo confirmas
   - Diálogo de confirmación antes de cada subida
   - Dos opciones claras:
     - **"Subir como Borrador"** (naranja): Para trabajos en progreso
     - **"Subir y Publicar"** (verde): Para reseñas terminadas

## Aplicar la Migración

Para activar el sistema de borradores, necesitas aplicar la migración a tu base de datos Supabase:

1. **Opción A: Usando Supabase CLI (Recomendado)**
   ```bash
   supabase db push
   ```

2. **Opción B: Manualmente en Supabase Dashboard**
   - Ve a tu proyecto en https://supabase.com/dashboard
   - Navega a `SQL Editor`
   - Copia y pega el contenido de `supabase/migrations/20260223000000_add_review_status.sql`
   - Ejecuta la query

## ¿Qué hace la migración?

La migración añade:

1. **Campo `status`**: Nuevo campo en la tabla `reviews` con dos valores posibles:
   - `draft`: Borrador (no visible públicamente)
   - `published`: Publicada (visible para todos)

2. **Políticas RLS actualizadas**:
   - Los usuarios normales solo pueden ver reseñas con `status = 'published'`
   - Los borradores (`draft`) solo son visibles para administradores

3. **Índice de rendimiento**: Para consultas rápidas por estado

## Cómo Usar el Sistema

### Escribir una Nueva Reseña

1. **Haz clic en "Nueva Reseña"**
2. **Empieza a escribir**
   - El sistema guarda automáticamente cada 5 segundos en tu navegador
   - Verás un indicador: "Último guardado local: HH:MM:SS"
   - Puedes cerrar sesión sin perder nada

3. **Cuando quieras subir a Supabase**:
   - **Opción 1: Subir como Borrador** (no visible públicamente)
     - Haz clic en "Subir como Borrador" (botón naranja)
     - Confirma en el diálogo que aparece
     - Solo requiere título
   - **Opción 2: Subir y Publicar** (visible para todos)
     - Haz clic en "Subir y Publicar" (botón verde)
     - Confirma en el diálogo que aparece
     - Requiere título, rating e imagen

### Editar Reseñas Existentes

1. **Selecciona la reseña del menú desplegable**
   - Las reseñas con badge "Borrador" están en Supabase pero no son públicas
   - Las reseñas publicadas son visibles para todos

2. **Edita los campos**
   - Los cambios NO se guardan automáticamente en modo edición
   - Tienes control total sobre cuándo subir los cambios

3. **Guarda los cambios**:
   - Haz clic en "Subir como Borrador" o "Subir y Publicar"
   - Confirma en el diálogo

### Diálogo de Confirmación

#### Al Subir como Borrador:
```
¿Subir como Borrador?

Se subirá la reseña a Supabase con estado Borrador.

• No será visible para el público
• Solo tú podrás verla en el panel de administración
• Puedes editarla y publicarla cuando estés listo
• El guardado local se limpiará automáticamente
```

#### Al Publicar:
```
¿Publicar Reseña?

Se subirá la reseña a Supabase con estado Publicada.

• Será visible para todos los visitantes
• Aparecerá en el listado público de reseñas
• Podrás editarla en cualquier momento
• El guardado local se limpiará automáticamente
```

## Interfaz del Editor

### Indicadores de Estado

1. **Indicador de Guardado Local** (solo en nuevas reseñas):
   - 💾 "Último guardado local: HH:MM:SS"
   - Aparece en verde debajo del título
   - Se actualiza cada 5 segundos automáticamente

2. **Badges de Estado**:
   - **"Borrador"**: Reseña en Supabase pero no publicada
   - **"Publicada"**: Reseña visible públicamente

### Selector de Reseñas

- **"Nueva Reseña"**: Crea una reseña desde cero (se guarda localmente)
- **Reseñas con badge "Borrador"**: Borradores en Supabase (no públicos)
- **Reseñas publicadas**: Reseñas visibles públicamente

### Botones de Acción

1. **Exportar JSON**: Descarga la reseña como archivo JSON
2. **Subir como Borrador** (botón naranja con icono de nube):
   - Sube a Supabase sin hacer pública
   - Solo requiere título
   - Muestra diálogo de confirmación
3. **Subir y Publicar** (botón verde con icono de subida):
   - Valida todo y publica la reseña
   - Requiere título, rating e imagen
   - Muestra diálogo de confirmación

## Verificación

### Comprobar que funciona:

1. **Crear un borrador**:
   ```sql
   SELECT * FROM reviews WHERE status = 'draft';
   ```
   Deberías ver tus borradores

2. **Verificar visibilidad pública**:
   - Abre una ventana de incógnito
   - Navega a tu sitio
   - Los borradores NO deben aparecer en el listado

3. **Publicar y verificar**:
   - Publica un borrador desde el editor
   - Refresca la página pública
   - La reseña debe aparecer

## Notas Importantes

- **Reseñas existentes**: Automáticamente se marcan como `published`
- **Backup recomendado**: Haz backup antes de aplicar la migración
- **Regenerar tipos**: Después de aplicar la migración, regenera los tipos de TypeScript:
  ```bash
  supabase gen types typescript --local > src/integrations/supabase/types.ts
  ```

## Solución de Problemas

### "Column 'status' does not exist"
→ La migración no se aplicó. Ejecuta `supabase db push`

### "Los borradores aparecen públicamente"
→ Las políticas RLS no se aplicaron correctamente. Verifica en Supabase Dashboard > Authentication > Policies

### "No puedo ver mis borradores en el editor"
→ Verifica que estés autenticado como admin en el panel

## Flujo de Trabajo Recomendado

### Opción 1: Múltiples Sesiones (Autoguardado Local)

1. **Día 1**: 
   - Crea nueva reseña
   - Escribe introducción y argumento
   - Se guarda automáticamente en local
   - Cierra sesión

2. **Día 2**: 
   - Abre el editor → Tu trabajo se carga automáticamente
   - Completa gameplay y funciones
   - Se guarda automáticamente en local
   - Cierra sesión

3. **Día 3**: 
   - Abre el editor → Tu trabajo se carga automáticamente
   - Añade imágenes, videos y valoración final
   - **Haz clic en "Subir y Publicar"**
   - Confirma en el diálogo
   - ✅ La reseña se publica y el guardado local se limpia

### Opción 2: Con Borrador en Supabase

1. **Día 1**:
   - Escribe introducción y argumento
   - Haz clic en "Subir como Borrador"
   - Confirma → Se sube a Supabase (no visible públicamente)

2. **Día 2**:
   - Selecciona el borrador del menú
   - Completa más secciones
   - Haz clic en "Subir como Borrador"
   - Confirma → Se actualizan los cambios

3. **Día 3**:
   - Selecciona el borrador
   - Termina la reseña
   - **Haz clic en "Subir y Publicar"**
   - Confirma → Se publica

## Ventajas del Sistema

### ✅ Seguridad
- **No hay subidas accidentales**: Siempre necesitas confirmar
- **Diálogo de confirmación**: Sabes exactamente qué vas a hacer
- **Guardado local automático**: No pierdes trabajo si cierras el navegador

### ✅ Flexibilidad
- **Trabaja en local**: Sin necesidad de subir nada a Supabase
- **Trabaja con borradores**: Sube a Supabase sin hacer público
- **Edita cuando quieras**: Control total sobre tus reseñas

### ✅ Claridad
- **Botones con colores distintivos**: Naranja para borrador, verde para publicar
- **Iconos claros**: Nube (subir borrador), Upload (publicar)
- **Indicadores visuales**: Sabes cuándo se guardó por última vez
