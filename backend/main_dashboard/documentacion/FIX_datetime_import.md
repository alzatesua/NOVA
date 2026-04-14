# Fix: Missing datetime Import

## Problema Identificado

**Error:**
```python
NameError: name 'datetime' is not defined
```

**Ubicación:**
`/app/main_dashboard/views_caja.py`, línea 1774

**Traceback:**
```python
File "/app/main_dashboard/views_caja.py", line 1774, in exportar_historial_arqueos_pdf
    fecha_desde = datetime.datetime.strptime(fecha_desde, '%Y-%m-%d').date()
                  ^^^^^^^^
NameError: name 'datetime' is not defined. Did you forget to import 'datetime'
```

**Contexto:**
- Funciona **sin** filtros de fecha
- Falla **con** filtros de fecha (fecha_desde, fecha_hasta)

## Causa Raíz

El código usa `datetime.datetime.strptime()` pero el módulo `datetime` no está importado.

### Código Problemático (línea 1774)

```python
# ❌ datetime no está importado
fecha_desde = datetime.datetime.strptime(fecha_desde, '%Y-%m-%d').date()
fecha_hasta = datetime.datetime.strptime(fecha_hasta, '%Y-%m-%d').date()
```

### Imports Actuales (líneas 1-13)

```python
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Q, Sum, Count
from django.utils import timezone  # ✅ Importado
from django.db import transaction
from decimal import Decimal
# ❌ Falta: import datetime
```

## Solución Aplicada

**Archivo:** `/home/dagi/nova/backend/main_dashboard/views_caja.py` (línea 13)

### Agregar Import

```python
# Antes (líneas 1-13)
from rest_framework import status
# ... otros imports ...
from decimal import Decimal

# Después (líneas 1-14)
from rest_framework import status
# ... otros imports ...
from decimal import Decimal
import datetime  # ✅ AGREGADO
```

## Código de Conversión de Fechas

### Endpoint Excel (líneas 1620-1623)

```python
# Convertir fechas a objetos date si son strings
if fecha_desde:
    fecha_desde = datetime.datetime.strptime(fecha_desde, '%Y-%m-%d').date()
if fecha_hasta:
    fecha_hasta = datetime.datetime.strptime(fecha_hasta, '%Y-%m-%d').date()
```

### Endpoint PDF (líneas 1773-1776)

```python
# Convertir fechas
if fecha_desde:
    fecha_desde = datetime.datetime.strptime(fecha_desde, '%Y-%m-%d').date()
if fecha_hasta:
    fecha_hasta = datetime.datetime.strptime(fecha_hasta, '%Y-%m-%d').date()
```

## Por Qué Funciona Sin Filtros

Cuando **NO** se envían fechas:
```python
fecha_desde = request.data.get('fecha_desde')  # → None
fecha_hasta = request.data.get('fecha_hasta')  # → None

if fecha_desde:  # → False, no se ejecuta
    fecha_desde = datetime.datetime.strptime(...)  # ❌ No se llega aquí
```

Cuando **SÍ** se envían fechas:
```python
fecha_desde = request.data.get('fecha_desde')  # → '2024-01-01'
fecha_hasta = request.data.get('fecha_hasta')  # → '2024-01-31'

if fecha_desde:  # → True, se ejecuta
    fecha_desde = datetime.datetime.strptime(fecha_desde, '%Y-%m-%d').date()  # ❌ NameError
```

## Backend Rebuild

```bash
docker restart nova-backend-1
```

Logs:
```
[2026-03-27 19:56:48 +0000] [1] [INFO] Starting gunicorn 23.0.0
[2026-03-27 19:56:48 +0000] [1] [INFO] Listening at: http://0.0.0.0:8000 (1)
[2026-03-27 19:56:48 +0000] [14] [INFO] Booting worker with pid: 14
```

## Testing

### Escenario 1: Sin Filtros de Fecha
```
1. Abrir: https://dagi-4a4487.nova.dagi.co/caja/historial-arqueos
2. NO seleccionar fechas
3. Click en "Excel"
Resultado: ✅ Funciona (no se ejecuta conversión de fechas)
```

### Escenario 2: Con Filtros de Fecha (Antes del Fix)
```
1. Seleccionar: Fecha Desde = 2024-01-01
2. Seleccionar: Fecha Hasta = 2024-01-31
3. Click en "PDF"
Resultado: ❌ NameError: name 'datetime' is not defined
```

### Escenario 3: Con Filtros de Fecha (Después del Fix)
```
1. Seleccionar: Fecha Desde = 2024-01-01
2. Seleccionar: Fecha Hasta = 2024-01-31
3. Click en "Excel"
Resultado: ✅ Funciona (datetime está importado)
```

### Escenario 4: Rango de Fechas Válido
```
Fecha Desde: 2026-03-01
Fecha Hasta: 2026-03-27

Conversión:
- '2026-03-01' → datetime.date(2026, 3, 1) ✅
- '2026-03-27' → datetime.date(2026, 3, 27) ✅

QuerySet:
ArqueoCaja.objects.filter(
    fecha__gte=datetime.date(2026, 3, 1),
    fecha__lte=datetime.date(2026, 3, 27)
) ✅
```

## Formato de Fechas

### Input (desde frontend)
```javascript
// HTML input type="date" devuelve: 'YYYY-MM-DD'
const fechaDesde = '2026-03-01';
const fechaHasta = '2026-03-27';
```

### Backend (recepción)
```python
# Django request.data recibe: str
fecha_desde = '2026-03-01'  # str
fecha_hasta = '2026-03-27'  # str
```

### Conversión
```python
# str → datetime.datetime → datetime.date
fecha_desde = datetime.datetime.strptime('2026-03-01', '%Y-%m-%d').date()
# → datetime.date(2026, 3, 1)
```

### QuerySet
```python
ArqueoCaja.objects.filter(
    fecha__gte=datetime.date(2026, 3, 1),  # ✅ Objeto date
    fecha__lte=datetime.date(2026, 3, 27)  # ✅ Objeto date
)
```

## Diferencia: datetime vs timezone

```python
# ❌ INCORRECTO - timezone.now() retorna datetime, no date
if fecha_desde:
    fecha_desde = timezone.now().date()  # Funciona, pero no es lo que necesitamos

# ✅ CORRECTO - datetime.strptime convierte string a date
if fecha_desde:
    fecha_desde = datetime.datetime.strptime(fecha_desde, '%Y-%m-%d').date()
```

## Alternativa: Usar dateutil (opcional)

```python
from dateutil import parser

# Más flexible pero requiere librería adicional
fecha_desde = parser.parse(fecha_desde).date()
```

Nosotros usamos `datetime.datetime.strptime()` que es parte de la librería estándar.

## Nota Importante: Formato de Fecha

El formato `'%Y-%m-%d'` es crítico:

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| `%Y` | Año 4 dígitos | 2026 |
| `%m` | Mes 2 dígitos | 03 |
| `%d` | Día 2 dígitos | 27 |

**Entrada válida:** `'2026-03-27'` ✅
**Entrada inválida:** `'27-03-2026'` ❌ (formato DD-MM-YYYY)
**Entrada inválida:** `'2026/03/27'` ❌ (separador /)

El frontend usa `<input type="date">` que siempre retorna `YYYY-MM-DD`, por lo que el formato es consistente.

## Verificación de Logs

```bash
docker logs nova-backend-1 -f | grep -E "(PDF exportado|Excel exportado)"
```

**Output esperado:**
```
INFO 2026-03-27 14:53:07 views_caja ✅ PDF exportado extra={'records': 3, 'user': 'admin', 'sucursal': 'Matriz', 'file_name': 'historial_arqueos_20260327_145307.pdf'}
```

**Sin errores:**
```
❌ NameError: name 'datetime' is not defined
```

## Lecciones Aprendidas

1. **Siempre importa lo que usas:**
   - Si usas `datetime.datetime`, importa `datetime`
   - Si usas `timezone.now`, importa `django.utils.timezone`

2. **Python NameError es claro:**
   - El mensaje dice exactamente qué falta
   - "Did you forget to import 'datetime'" → Sí, olvidé importarlo

3. **Prueba con Y SIN parámetros:**
   - El código funcionó sin fechas porque el bloque `if` no se ejecutaba
   - Solo falló cuando se enviaron fechas

4. **date() vs datetime:**
   - `datetime.datetime.strptime(...).date()` → extrae solo la fecha
   - Los filtros `__gte` y `__lte` en Django necesitan objetos `date` para campos `DateField`

---

**Fecha de fix:** 2026-03-27
**Versión:** 1.0
**Archivos modificados:**
- `/home/dagi/nova/backend/main_dashboard/views_caja.py` (línea 13 - import agregado)

**Resultado:**
- ✅ datetime importado correctamente
- ✅ Conversión de fechas funciona
- ✅ Exportación con filtros de fecha funciona
- ✅ No más NameError
