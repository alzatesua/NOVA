# Fix: BASE_URL Multitenant - Usar Dominio Actual del Navegador

## Problema Identificado

**Error:**
```
POST https://dagi.co/api/caja/historial_arqueos/export/excel/ 400 (Bad Request)
```

**Contexto:**
El usuario está en `https://dagi-4a4487.nova.dagi.co` pero las peticiones se hacen a `https://dagi.co` (dominio principal).

**Causa Raíz:**
```javascript
// ❌ HARDCODED - Siempre usa dagi.co sin importar el subdominio
const BASE_URL = 'https://dagi.co/';
```

Esto rompe la arquitectura multitenant donde cada subdominio es un tenant diferente.

## Solución Aplicada

**Archivo:** `/home/dagi/nova/frontend/src/services/api.js`

**Cambio:**
```javascript
// ❌ Antes (hardcoded)
const BASE_URL = 'https://dagi.co/';

// ✅ Después (dinámico - multitenant friendly)
const BASE_URL = window.location.origin + '/';
```

## Por Qué Esto Funciona

**`window.location.origin`** detecta automáticamente el dominio actual del navegador:

| Usuario está en | `window.location.origin` | `BASE_URL` resultante |
|----------------|-------------------------|----------------------|
| `https://dagi-4a4487.nova.dagi.co` | `https://dagi-4a4487.nova.dagi.co` | `https://dagi-4a4487.nova.dagi.co/` ✅ |
| `https://otro-subdominio.nova.dagi.co` | `https://otro-subdominio.nova.dagi.co` | `https://otro-subdominio.nova.dagi.co/` ✅ |
| `https://dagi.co` | `https://dagi.co` | `https://dagi.co/` ✅ |
| `http://localhost:3000` | `http://localhost:3000` | `http://localhost:3000/` ✅ |

## Ejemplo de Petición con el Fix

**Antes (hardcoded):**
```javascript
// Usuario en: https://dagi-4a4487.nova.dagi.co
BASE_URL = 'https://dagi.co/'
endpoint = 'api/caja/historial_arqueos/export/excel/'
URL final = 'https://dagi.co/api/caja/historial_arqueos/export/excel/' ❌
// Error: Petición al dominio equivocado
```

**Después (dinámico):**
```javascript
// Usuario en: https://dagi-4a4487.nova.dagi.co
window.location.origin = 'https://dagi-4a4487.nova.dagi.co'
BASE_URL = 'https://dagi-4a4487.nova.dagi.co/'
endpoint = 'api/caja/historial_arqueos/export/excel/'
URL final = 'https://dagi-4a4487.nova.dagi.co/api/caja/historial_arqueos/export/excel/' ✅
// Correcto: Petición al dominio actual del tenant
```

## Arquitectura Multitenant

```
┌─────────────────────────────────────────────────────────┐
│  Navegador del Usuario                                  │
│  URL actual: https://dagi-4a4487.nova.dagi.co               │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ window.location.origin
                 │ = 'https://dagi-4a4487.nova.dagi.co'
                 ↓
┌─────────────────────────────────────────────────────────┐
│  Frontend (React)                                       │
│  BASE_URL = window.location.origin + '/'                │
│  = 'https://dagi-4a4487.nova.dagi.co/'                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ POST /api/caja/historial_arqueos/export/excel/
                 ↓
┌─────────────────────────────────────────────────────────┐
│  Backend (Django) - Mismo Tenant                        │
│  Detecta subdominio: dagi-4a4487                        │
│  Usa base de datos del tenant correcto                  │
└─────────────────────────────────────────────────────────┘
```

## Ventajas del Fix

1. **✅ Verdadero Multitenant:** Cada subdominio funciona independientemente
2. **✅ Desarrollo Local:** `localhost` funciona sin cambios
3. **✅ Production Ready:** No hay hardcoded domains
4. **✅ Zero Configuration:** Detecta automáticamente el dominio
5. **✅ Future-Proof:** Agregar nuevos tenants no requiere código

## Testing

### Escenario 1: Subdominio Tenant
```
URL: https://dagi-4a4487.nova.dagi.co/caja/historial-arqueos
Acción: Click en "Excel"
Petición a: https://dagi-4a4487.nova.dagi.co/api/caja/historial_arqueos/export/excel/
Resultado: ✅ Descarga exitosa
```

### Escenario 2: Dominio Principal
```
URL: https://dagi.co/caja/historial-arqueos
Acción: Click en "PDF"
Petición a: https://dagi.co/api/caja/historial_arqueos/export/pdf/
Resultado: ✅ Descarga exitosa
```

### Escenario 3: Desarrollo Local
```
URL: http://localhost:3000/caja/historial-arqueos
Acción: Click en "Excel"
Petición a: http://localhost:3000/api/caja/historial_arqueos/export/excel/
Resultado: ✅ Descarga exitosa (si hay proxy local)
```

## Verificación en Browser DevTools

1. **Abrir DevTools** (F12)
2. **Ir a Console**
3. **Escribir:**
   ```javascript
   console.log('BASE_URL:', window.location.origin + '/');
   console.log('Full URL:', window.location.origin + '/api/caja/historial_arqueos/export/excel/');
   ```
4. **Verificar que coincide con tu dominio actual:**
   - Si estás en `dagi-4a4487.nova.dagi.co` → debe mostrar ese dominio ✅

## Impacto en Otros Endpoints

Este cambio afecta **TODAS** las peticiones del frontend, no solo exportación:

```javascript
// Auth
fetch(`${BASE_URL}api/auth/login/`, ...)
// → https://dagi-4a4487.nova.dagi.co/api/auth/login/ ✅

// Dashboard
fetch(`${BASE_URL}api/dashboard/stats/`, ...)
// → https://dagi-4a4487.nova.dagi.co/api/dashboard/stats/ ✅

// Caja
fetch(`${BASE_URL}api/caja/historial_arqueos/`, ...)
// → https://dagi-4a4487.nova.dagi.co/api/caja/historial_arqueos/ ✅

// Exportación
fetch(`${BASE_URL}api/caja/historial_arqueos/export/excel/`, ...)
// → https://dagi-4a4487.nova.dagi.co/api/caja/historial_arqueos/export/excel/ ✅
```

## Frontend Rebuild

```bash
docker restart nova-frontend-1
```

El contenedor reinicia con el nuevo código que usa `window.location.origin`.

## Notas Importantes

1. **No afecta HTTPS/HTTP:** `window.location.origin` incluye el protocolo automáticamente
2. **Incluye puerto si existe:** `http://localhost:3000` mantiene el `:3000`
3. **Compatibilidad:** Soportado por todos los navegadores modernos
4. **Seguridad:** No hay riesgo de XSS porque es solo lectura del DOM

---

**Fecha de fix:** 2026-03-27
**Versión:** 1.0
**Archivos modificados:**
- `/home/dagi/nova/frontend/src/services/api.js` (línea 4)

**Resultado:**
- ✅ Multitenant architecture soportada correctamente
- ✅ Cada subdominio hace peticiones a sí mismo
- ✅ No más hardcoded domains
- ✅ Zero configuration para nuevos tenants
