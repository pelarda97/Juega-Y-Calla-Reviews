# Guía de Testing Paso a Paso - Editor de Reseñas

## 🎯 Objetivo del Testing

Verificar que el sistema de guardado local, confirmación de subida y gestión de borradores funciona correctamente sin subidas accidentales a Supabase.

---

## 📋 Pre-requisitos

### 1. Aplicar la Migración (CRÍTICO)

**Sin este paso, el sistema NO funcionará**

Opción A - CLI (Recomendado):
```powershell
supabase db push
```

Opción B - Dashboard:
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Navega a `SQL Editor`
4. Copia el contenido de `supabase/migrations/20260223000000_add_review_status.sql`
5. Pega y ejecuta la query

✅ **Verificación**: En Supabase Dashboard > Table Editor > reviews, debe aparecer una columna `status`

### 2. Iniciar el Servidor de Desarrollo

```powershell
npm run dev
```

✅ **Verificación**: Abre http://localhost:5173 y verifica que carga sin errores en consola (F12)

### 3. Acceder al Panel Admin

1. Navega a `/admin` (o la ruta de tu panel de administración)
2. Inicia sesión con tu cuenta de administrador
3. Ve a la pestaña "Subir Reseña" (o donde esté el ReviewEditor)

---

## 🧪 Baterías de Pruebas

### TEST 1: Autoguardado Local ✅

**Objetivo**: Verificar que el trabajo se guarda automáticamente en el navegador

**Pasos**:
1. ✅ En el selector, confirma que está en "Nueva Reseña"
2. ✅ Escribe en el campo "Título": `Test Autoguardado`
3. ✅ Espera 5 segundos SIN hacer nada
4. ✅ Debajo del título debe aparecer: "Último guardado local: HH:MM:SS" en verde
5. ✅ Escribe en "Introducción": `Esta es una prueba de autoguardado`
6. ✅ Espera otros 5 segundos
7. ✅ La hora del indicador debe actualizarse

**Resultado Esperado**:
- ✅ Indicador verde aparece
- ✅ Hora se actualiza cada 5 segundos cuando hay cambios
- ✅ NO se sube nada a Supabase (verificar en Dashboard)

---

### TEST 2: Recuperación tras Recargar Página 🔄

**Objetivo**: Verificar que el trabajo no se pierde al cerrar el navegador

**Pasos**:
1. ✅ Continúa con la reseña del TEST 1 (o crea una nueva)
2. ✅ Escribe más contenido en varios campos:
   - Título: `Test Recuperación`
   - Género: `Acción`
   - Rating: `4.5`
   - Introducción: `Contenido de prueba largo...`
3. ✅ Espera 5 segundos (verifica que se guardó localmente)
4. ✅ **Refresca la página** (F5 o Ctrl+R)
5. ✅ Navega de nuevo al editor
6. ✅ Debe aparecer un toast: "Borrador recuperado"

**Resultado Esperado**:
- ✅ Toast verde: "Borrador recuperado"
- ✅ Todos los campos tienen el contenido que escribiste
- ✅ Indicador de guardado local muestra la hora
- ✅ NO se subió nada a Supabase

---

### TEST 3: Botón Borrar Borrador Local 🗑️

**Objetivo**: Verificar que puedes eliminar el borrador local manualmente

**Pasos**:
1. ✅ Asegúrate de tener un borrador guardado localmente
2. ✅ Localiza el botón rojo "Borrar borrador local" junto al indicador verde
3. ✅ Haz clic en "Borrar borrador local"
4. ✅ Debe aparecer un diálogo de confirmación nativo del navegador
5. ✅ Haz clic en "Aceptar"
6. ✅ Debe aparecer toast: "Borrador eliminado"

**Resultado Esperado**:
- ✅ Todos los campos se vacían
- ✅ El indicador verde desaparece
- ✅ No hay contenido guardado en localStorage
- ✅ Puedes empezar una nueva reseña desde cero

**Cancelar la Acción**:
1. ✅ Repite los pasos 1-4
2. ✅ Haz clic en "Cancelar" en el diálogo
3. ✅ El borrador NO se borra, todo sigue igual

---

### TEST 4: Protección - Sin Confirmación = Sin Subida 🔒

**Objetivo**: Verificar que NO se sube nada sin confirmación explícita

**Pasos**:
1. ✅ Crea una reseña con título: `Test Protección Subida`
2. ✅ Rellena algunos campos más
3. ✅ Espera que se guarde localmente (5 segundos)
4. ✅ Haz clic en "Subir como Borrador" (botón naranja)
5. ✅ Debe aparecer un **DIÁLOGO DE CONFIRMACIÓN**
6. ✅ Lee el contenido del diálogo (debe explicar qué pasará)
7. ✅ **Haz clic en "Cancelar"**
8. ✅ Ve a Supabase Dashboard > Table Editor > reviews
9. ✅ Busca "Test Protección Subida"

**Resultado Esperado**:
- ✅ El diálogo aparece y es claro
- ✅ Al cancelar, NO se sube nada
- ✅ En Supabase NO existe esa reseña
- ✅ El borrador sigue en localStorage

---

### TEST 5: Subir como Borrador a Supabase ☁️

**Objetivo**: Verificar que puedes subir un borrador que NO sea público

**Pasos**:
1. ✅ Crea una reseña con título: `Test Borrador Supabase`
2. ✅ Rellena **solo el título** (no completes todo)
3. ✅ Haz clic en "Subir como Borrador" (botón naranja)
4. ✅ Lee el diálogo de confirmación:
   ```
   ¿Subir como Borrador?
   
   Se subirá la reseña a Supabase con estado Borrador.
   • No será visible para el público
   • Solo tú podrás verla en el panel de administración
   • Puedes editarla y publicarla cuando estés listo
   • El guardado local se limpiará automáticamente
   ```
5. ✅ Haz clic en "Subir Borrador"
6. ✅ Debe aparecer toast: "Borrador subido"

**Verificaciones**:

**En el Editor**:
- ✅ El indicador verde desaparece (localStorage limpio)
- ✅ El selector de reseñas se actualiza
- ✅ Aparece "Test Borrador Supabase" con badge "Borrador"

**En Supabase Dashboard**:
- ✅ Tabla `reviews` > busca "Test Borrador Supabase"
- ✅ Campo `status` debe ser: `draft`
- ✅ Solo tiene el campo `title` relleno

**En el Sitio Público**:
- ✅ Abre una ventana de incógnito
- ✅ Navega a tu sitio (http://localhost:5173)
- ✅ Va a la página de reseñas
- ✅ **"Test Borrador Supabase" NO debe aparecer**

---

### TEST 6: Editar Borrador Existente ✏️

**Objetivo**: Verificar que puedes cargar y editar un borrador de Supabase

**Pasos**:
1. ✅ En el selector, busca "Test Borrador Supabase" (debe tener badge "Borrador")
2. ✅ Selecciónalo
3. ✅ Debe cargar el título que escribiste
4. ✅ El título debe mostrar: "Editar Reseña" con badge "Borrador"
5. ✅ Completa más campos:
   - Rating: `3.8`
   - Género: `RPG`
   - Introducción: `Texto de prueba`
6. ✅ Haz clic en "Subir como Borrador"
7. ✅ Confirma en el diálogo

**Resultado Esperado**:
- ✅ Toast: "Borrador subido"
- ✅ En Supabase, los campos se actualizan
- ✅ Sigue con `status = 'draft'`
- ✅ Sigue sin ser visible públicamente

---

### TEST 7: Publicar Borrador (Hacerlo Público) 🚀

**Objetivo**: Verificar que puedes publicar un borrador y hacerlo visible

**Pasos**:
1. ✅ Carga el borrador "Test Borrador Supabase"
2. ✅ Completa **TODOS** los campos obligatorios:
   - Título: (ya está)
   - Rating: `4.2`
   - Imagen de portada: `https://via.placeholder.com/400`
   - (Los demás campos son opcionales pero rellena algunos)
3. ✅ Haz clic en "Subir y Publicar" (botón verde)
4. ✅ Lee el diálogo de confirmación:
   ```
   ¿Publicar Reseña?
   
   Se subirá la reseña a Supabase con estado Publicada.
   • Será visible para todos los visitantes
   • Aparecerá en el listado público de reseñas
   • Podrás editarla en cualquier momento
   • El guardado local se limpiará automáticamente
   ```
5. ✅ Haz clic en "Publicar"
6. ✅ Debe aparecer toast: "Reseña publicada"

**Verificaciones**:

**En el Editor**:
- ✅ El badge cambia a "Publicada"
- ✅ En el selector, ya no tiene badge "Borrador"

**En Supabase Dashboard**:
- ✅ Campo `status` cambió a: `published`

**En el Sitio Público**:
- ✅ Abre/refresca la ventana de incógnito
- ✅ Ve a la página de reseñas
- ✅ **Ahora SÍ debe aparecer "Test Borrador Supabase"**
- ✅ Haz clic y verifica que se muestra correctamente

---

### TEST 8: Publicar Directamente (Sin Borrador Previo) 🎯

**Objetivo**: Verificar que puedes crear y publicar en un solo paso

**Pasos**:
1. ✅ Selecciona "Nueva Reseña" en el selector
2. ✅ Rellena **TODOS** los campos obligatorios:
   - Título: `Test Publicación Directa`
   - Rating: `4.7`
   - Imagen: `https://via.placeholder.com/500`
   - Introducción: `Texto de prueba para publicación directa`
   - (Rellena otros campos opcionales)
3. ✅ **NO hagas clic en "Subir como Borrador"**
4. ✅ Haz clic directamente en "Subir y Publicar" (verde)
5. ✅ Confirma en el diálogo
6. ✅ Toast: "Reseña publicada"

**Verificaciones**:

**En Supabase**:
- ✅ Existe "Test Publicación Directa"
- ✅ `status = 'published'`

**En el Sitio Público**:
- ✅ Aparece inmediatamente en el listado
- ✅ Es accesible y se muestra correctamente

**En el Editor**:
- ✅ Se resetea a "Nueva Reseña" vacía
- ✅ No hay borrador local guardado

---

### TEST 9: Validación de Campos Obligatorios ⚠️

**Objetivo**: Verificar que no puedes publicar sin completar campos requeridos

**Pasos para Borrador** (solo requiere título):
1. ✅ Nueva reseña
2. ✅ **NO escribas nada**
3. ✅ Haz clic en "Subir como Borrador"
4. ✅ Debe mostrar toast ERROR: "El título es obligatorio"
5. ✅ No se abre el diálogo de confirmación
6. ✅ Escribe un título: `Test Validación`
7. ✅ Ahora haz clic en "Subir como Borrador"
8. ✅ Ahora SÍ se abre el diálogo

**Pasos para Publicar** (requiere título, rating, imagen):
1. ✅ Nueva reseña
2. ✅ Solo escribe título: `Test Validación 2`
3. ✅ Haz clic en "Subir y Publicar"
4. ✅ Debe mostrar toast ERROR sobre campos faltantes
5. ✅ Añade rating: `4.0`
6. ✅ Haz clic en "Subir y Publicar"
7. ✅ Debe seguir mostrando error (falta imagen)
8. ✅ Añade imagen: `https://via.placeholder.com/600`
9. ✅ Ahora haz clic en "Subir y Publicar"
10. ✅ Ahora SÍ se abre el diálogo

**Resultado Esperado**:
- ✅ No puede subir borradores sin título
- ✅ No puede publicar sin título, rating e imagen
- ✅ Los mensajes de error son claros
- ✅ No se abre diálogo hasta que la validación pasa

---

### TEST 10: Cambiar de Publicada a Borrador 🔄

**Objetivo**: Verificar que puedes despublicar una reseña

**Pasos**:
1. ✅ Carga "Test Publicación Directa" (está publicada)
2. ✅ Verifica que tiene badge "Publicada"
3. ✅ Haz clic en "Subir como Borrador" (naranja)
4. ✅ Confirma en el diálogo
5. ✅ Toast: "Borrador subido"

**Verificaciones**:

**En el Editor**:
- ✅ Badge cambia a "Borrador"

**En Supabase**:
- ✅ `status = 'draft'`

**En el Sitio Público**:
- ✅ Refresca la ventana de incógnito
- ✅ "Test Publicación Directa" YA NO aparece
- ✅ Ha sido ocultada del público

---

### TEST 11: Exportar JSON 📄

**Objetivo**: Verificar que puedes descargar la reseña como archivo JSON

**Pasos**:
1. ✅ Crea o carga una reseña con varios campos rellenos
2. ✅ Haz clic en "Exportar JSON"
3. ✅ Se debe descargar un archivo `.json`
4. ✅ Abre el archivo con un editor de texto
5. ✅ Verifica que contiene todos los campos en formato JSON válido

**Resultado Esperado**:
- ✅ Archivo descargado correctamente
- ✅ Nombre del archivo: `[slug].json`
- ✅ Contenido es JSON válido
- ✅ Tiene todos los campos del editor

---

### TEST 12: Campos Múltiples (Imágenes y Videos) 🖼️

**Objetivo**: Verificar que puedes añadir/eliminar múltiples imágenes y videos

**Pasos**:
1. ✅ Nueva reseña
2. ✅ Título: `Test Arrays`
3. ✅ En la sección "Imágenes Adicionales":
   - ✅ El primer campo está vacío
   - ✅ Escribe: `https://via.placeholder.com/100`
   - ✅ Haz clic en el botón "+"
   - ✅ Aparece un segundo campo
   - ✅ Escribe: `https://via.placeholder.com/200`
   - ✅ Haz clic en el botón "+" de nuevo
   - ✅ Aparece un tercer campo
   - ✅ Haz clic en el botón "X" del segundo campo
   - ✅ El segundo campo desaparece
4. ✅ Repite con la sección "URLs de Videos"
5. ✅ Sube como borrador y verifica en Supabase

**Resultado Esperado**:
- ✅ Puedes añadir campos con el botón "+"
- ✅ Puedes eliminar campos con el botón "X"
- ✅ Los arrays se guardan correctamente en Supabase
- ✅ Los campos vacíos no se guardan

---

### TEST 13: Generación Automática de Slug 🔗

**Objetivo**: Verificar que el slug se genera automáticamente del título

**Pasos**:
1. ✅ Nueva reseña
2. ✅ Escribe título: `The Last of Us: Part II`
3. ✅ Observa el campo "Slug"
4. ✅ Debe generarse automáticamente: `the-last-of-us-part-ii`
5. ✅ Prueba con caracteres especiales: `¡Héroes & Villanos! (2024)`
6. ✅ Slug debe ser: `heroes-villanos-2024`

**Resultado Esperado**:
- ✅ Slug se genera automáticamente al escribir título
- ✅ Todo minúsculas
- ✅ Espacios convertidos a guiones
- ✅ Acentos eliminados
- ✅ Caracteres especiales eliminados
- ✅ Campo slug es de solo lectura

---

### TEST 14: Manejo de Sesiones Múltiples 👥

**Objetivo**: Verificar comportamiento con múltiples pestañas

**Pasos**:
1. ✅ Pestaña 1: Crea reseña `Test Múltiple`
2. ✅ Espera que se guarde localmente
3. ✅ Abre nueva pestaña (Pestaña 2) en el mismo navegador
4. ✅ Navega al editor
5. ✅ Debe cargar el mismo borrador "Test Múltiple"
6. ✅ En Pestaña 2: Modifica el título a `Test Múltiple EDITADO`
7. ✅ Espera 5 segundos (guardado local)
8. ✅ En Pestaña 1: Refresca
9. ✅ Debe cargar "Test Múltiple EDITADO"

**Resultado Esperado**:
- ✅ localStorage se comparte entre pestañas
- ✅ El último guardado prevalece
- ✅ No hay conflictos

---

### TEST 15: Limpieza después de Publicar ✨

**Objetivo**: Verificar que el sistema limpia el localStorage tras publicar

**Pasos**:
1. ✅ Nueva reseña con título `Test Limpieza`
2. ✅ Rellena campos obligatorios
3. ✅ Espera guardado local (indicador verde aparece)
4. ✅ Haz clic en "Subir y Publicar"
5. ✅ Confirma
6. ✅ Toast: "Reseña publicada"
7. ✅ El formulario se resetea a "Nueva Reseña"
8. ✅ El indicador verde desaparece
9. ✅ En DevTools (F12) > Application > Local Storage
10. ✅ Busca la key: `juega-y-calla-draft-review`
11. ✅ NO debe existir

**Resultado Esperado**:
- ✅ localStorage se limpia tras publicar
- ✅ Formulario vacío y listo para nueva reseña
- ✅ No hay "contaminación" de datos previos

---

## ✅ Checklist Final

Marca cuando completes cada batería:

- [ ] TEST 1: Autoguardado Local
- [ ] TEST 2: Recuperación tras Recargar
- [ ] TEST 3: Botón Borrar Borrador Local
- [ ] TEST 4: Protección - Sin Confirmación
- [ ] TEST 5: Subir como Borrador
- [ ] TEST 6: Editar Borrador
- [ ] TEST 7: Publicar Borrador
- [ ] TEST 8: Publicar Directamente
- [ ] TEST 9: Validación de Campos
- [ ] TEST 10: Cambiar a Borrador
- [ ] TEST 11: Exportar JSON
- [ ] TEST 12: Campos Múltiples
- [ ] TEST 13: Generación de Slug
- [ ] TEST 14: Sesiones Múltiples
- [ ] TEST 15: Limpieza después de Publicar

---

## 🐛 Reporte de Errores

Si encuentras algún problema, anota:

1. **Test que falló**: (número y nombre)
2. **Comportamiento esperado**: (qué debería pasar)
3. **Comportamiento actual**: (qué pasó realmente)
4. **Pasos para reproducir**: (paso exacto donde falló)
5. **Errores en consola**: (F12 > Console, copia el error)
6. **Navegador y versión**: (Chrome 120, Firefox 121, etc.)

---

## 🎉 Testing Completado

Si todos los tests pasaron:

✅ El sistema está funcionando correctamente
✅ No hay subidas accidentales a Supabase
✅ El autoguardado local protege tu trabajo
✅ Los diálogos de confirmación son claros
✅ La separación draft/published funciona
✅ El sistema está listo para producción

**Siguiente paso**: Considera hacer commit de los cambios o desplegar a producción.
