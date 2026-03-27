# Fix: URL sin /api/ en endpoints de exportación

## Problema Identificado

**Error CORS:**
```
Access to fetch at 'https://dagi.co/caja/historial_arqueos/export/excel/'
from origin 'https://dagi-4a4487.dagi.co' has been blocked by CORS policy
```

**Causa Raíz:**
Los endpoints en `exportHistorialArqueos.js` estaban construyendo URLs **sin el prefijo `/api/`**.

```javascript
// ❌ INCORRECTO - URL sin /api/
postDownload('caja/historial_arqueos/export/excel/', {...})

// Resultado: https://dagi.co/caja/historial_arqueos/export/excel/
// Error: No existe esta ruta, nginx la rechaza con CORS error
```

## Solución Aplicada

**Archivo:** `/home/dagi/nova/frontend/src/utils/exportHistorialArqueos.js`

**Cambios:**

### 1. Endpoint Excel (línea 26)
```javascript
// ❌ Antes:
const { blob, headers } = await postDownload('caja/historial_arqueos/export/excel/', {

// ✅ Después:
const { blob, headers } = await postDownload('api/caja/historial_arqueos/export/excel/', {
```

### 2. Endpoint PDF (línea 75)
```javascript
// ❌ Antes:
const { blob, headers } = await postDownload('caja/historial_arqueos/export/pdf/', {

// ✅ Después:
const { blob, headers } = await postDownload('api/caja/historial_arqueos/export/pdf/', {
```

## Por qué este Fix Funciona

**Patrón correcto en api.js (línea 48):**
```javascript
const BASE_URL = 'https://dagi.co/';
fetch(`${BASE_URL}api/auth/refresh/`, ...)
// Resultado: https://dagi.co/api/auth/refresh/ ✅
```

**Ahora nuestro helper sigue el mismo patrón:**
```javascript
const BASE_URL = 'https://dagi.co/';
fetch(`${BASE_URL}api/caja/historial_arqueos/export/excel/`, ...)
// Resultado: https://dagi.co/api/caja/historial_arqueos/export/excel/ ✅
```

## Flujo de la Petición (Arquitectura Docker)

```
Browser (https://dagi-4a4487.dagi.co)
  ↓ POST https://dagi.co/api/caja/historial_arqueos/export/excel/
  ↓
Nginx (nova-nginx-1:443)
  ↓ Proxy pass to backend
  ↓
Gunicorn (nova-backend-1:8000)
  ↓ Django: /api/caja/historial_arqueos/export/excel/
  ↓
views_caja.exportar_historial_arqueos_excel()
  ↓
Excel file (StreamingHttpResponse)
```

## Verificación

**URL correctas después del fix:**

1. **Excel:**
   ```
   https://dagi.co/api/caja/historial_arqueos/export/excel/
   ```

2. **PDF:**
   ```
   https://dagi.co/api/caja/historial_arqueos/export/pdf/
   ```

**Ambas con:**
- ✅ Prefijo `/api/`
- ✅ CORS headers configurados
- ✅ @csrf_exempt decorator
- ✅ StreamingHttpResponse

## Frontend Rebuild

```bash
docker restart nova-frontend-1
```

Esto reinicia el contenedor y reconstruye el frontend con el código corregido.

## Testing

Desde el navegador:
1. Abrir: https://dagi-4a4487.dagi.co/caja/historial-arqueos
2. Aplicar filtros de fecha (opcional)
3. Click en botón "Excel" (verde)
4. Click en botón "PDF" (rojo)
5. Verificar en DevTools (F12 → Network):
   - URL: `https://dagi.co/api/caja/...` ✅
   - Status: 200 OK ✅
   - Response: archivo binario (xlsx/pdf) ✅

## Nota Importante

La configuración CORS en `backend/nova/settings/base.py` **SIEMPRE fue correcta**.

El problema NO era CORS, sino que las URLs estaban mal construidas (sin `/api/`), por lo que:
1. Nginx no encontraba la ruta
2. Retornaba 404 o error
3. El browser interpretaba esto como error de CORS

---

**Fecha de fix:** 2026-03-27
**Versión:** 1.0
**Archivos modificados:**
- `/home/dagi/nova/frontend/src/utils/exportHistorialArqueos.js` (líneas 26, 75)
