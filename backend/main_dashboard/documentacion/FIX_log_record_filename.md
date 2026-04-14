# Fix: LogRecord 'filename' Conflict

## Problema Identificado

**Error:**
```python
KeyError: "Attempt to overwrite 'filename' in LogRecord"
```

**Ubicación:**
`/usr/local/lib/python3.12/logging/__init__.py`, línea 1656

**Traceback:**
```python
File "/usr/local/lib/python3.12/logging/__init__.py", line 1656, in makeRecord
    raise KeyError("Attempt to overwrite %r in LogRecord" % key)
KeyError: "Attempt to overwrite 'filename' in LogRecord"
```

## Causa Raíz

Python's `logging.LogRecord` tiene atributos reservados que **NO pueden ser sobrescritos** en el parámetro `extra`:

### Atributos Reservados de LogRecord

```python
LogRecord(name, level, pathname, lineno, msg, args, exc_info, func=None, sinfo=None)
```

Atributos reservados incluidos automáticamente:
- `name` - nombre del logger
- `level` - nivel de log (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- `pathname` - ruta completa del archivo
- `filename` - **nombre del archivo** (RESERVADO)
- `lineno` - número de línea
- `msg` - mensaje de log
- `args` - argumentos del mensaje
- `exc_info` - info de excepción
- `func` - nombre de la función
- `sinfo` - stack info

### Código Problemático

**Archivo:** `/home/dagi/nova/backend/main_dashboard/views_caja.py`

```python
# ❌ INCORRECTO - 'filename' es reservado
logger.info(
    "✅ Excel exportado",
    extra={
        "records": len(arqueos_qs),
        "user": user.usuario,
        "sucursal": sucursal_nombre,
        "filename": filename  # ❌ Conflicto con LogRecord.filename
    }
)
```

Esto falla porque Python intenta crear un `LogRecord` que ya tiene el atributo `filename`
(seteado automáticamente al archivo donde se hace el log), y luego intenta sobrescribirlo
con el valor de `extra={"filename": ...}`.

## Solución Aplicada

Cambiar `"filename"` por `"file_name"` en ambos endpoints de exportación.

### 1. Endpoint Excel (líneas 1652-1660)

**Antes:**
```python
logger.info(
    "✅ Excel exportado",
    extra={
        "records": len(arqueos_qs),
        "user": user.usuario,
        "sucursal": sucursal_nombre,
        "filename": filename  # ❌
    }
)
```

**Después:**
```python
logger.info(
    "✅ Excel exportado",
    extra={
        "records": len(arqueos_qs),
        "user": user.usuario,
        "sucursal": sucursal_nombre,
        "file_name": filename  # ✅
    }
)
```

### 2. Endpoint PDF (líneas 1801-1809)

**Antes:**
```python
logger.info(
    "✅ PDF exportado",
    extra={
        "records": len(arqueos_qs),
        "user": user.usuario,
        "sucursal": sucursal_nombre,
        "filename": filename  # ❌
    }
)
```

**Después:**
```python
logger.info(
    "✅ PDF exportado",
    extra={
        "records": len(arqueos_qs),
        "user": user.usuario,
        "sucursal": sucursal_nombre,
        "file_name": filename  # ✅
    }
)
```

## Lista Completa de Atributos Reservados

**NUNCA uses estos nombres en `extra`:**

| Atributo | Descripción | Ejemplo de valor |
|----------|-------------|------------------|
| `name` | Nombre del logger | `'main_dashboard.views_caja'` |
| `level` | Nivel de log | `20` (INFO) |
| `pathname` | Ruta completa del archivo | `'/app/main_dashboard/views_caja.py'` |
| `filename` | **Nombre del archivo** | `'views_caja.py'` |
| `lineno` | Número de línea | `1652` |
| `msg` | Mensaje de log | `'✅ Excel exportado'` |
| `args` | Argumentos del mensaje | `()` |
| `exc_info` | Info de excepción | `None` o tuple |
| `func` | Nombre de función | `'exportar_historial_arqueos_excel'` |
| `sinfo` | Stack info | `None` o string |

## Nombres Alternativos Seguros

Si necesitas loggear información de archivos, usa estos nombres:

| Campo reservado | Nombre alternativo | Ejemplo |
|----------------|-------------------|---------|
| `filename` | `file_name` | `'historial_arqueos_20260327.xlsx'` |
| `pathname` | `file_path` | `'/app/main_dashboard/views_caja.py'` |
| `func` | `function_name` | `'exportar_historial_arqueos_excel'` |
| `lineno` | `line_number` | `1652` |
| `msg` | `message` | `'✅ Excel exportado'` |

## Backend Rebuild

```bash
docker restart nova-backend-1
```

Logs:
```
[2026-03-27 19:51:57 +0000] [1] [INFO] Starting gunicorn 23.0.0
[2026-03-27 19:51:57 +0000] [1] [INFO] Listening at: http://0.0.0.0:8000 (1)
[2026-03-27 19:51:57 +0000] [14] [INFO] Booting worker with pid: 14
```

## Logging Estructurado Correcto

### ✅ CORRECTO

```python
logger.info(
    "✅ Excel exportado",
    extra={
        "report_id": str(report_id),
        "records": total_registros,
        "user": user.usuario,
        "sucursal": sucursal_nombre,
        "file_name": filename,  # ✅ No es reservado
        "file_size_bytes": os.path.getsize(file_path)
    }
)
```

### ❌ INCORRECTO

```python
logger.info(
    "✅ Excel exportado",
    extra={
        "filename": filename,  # ❌ RESERVADO
        "lineno": 100,         # ❌ RESERVADO
        "func": "exportar",    # ❌ RESERVADO
        "msg": "listo"         # ❌ RESERVADO
    }
)
```

## Output de Logs Corregido

**Formato JSON (ejemplo):**
```json
{
  "name": "main_dashboard.views_caja",
  "level": "INFO",
  "filename": "views_caja.py",  // ← Automático (archivo del log)
  "lineno": 1652,                // ← Automático (línea del log)
  "func": "exportar_historial_arqueos_excel",  // ← Automático (función)
  "msg": "✅ Excel exportado",
  "report_id": "550e8400-e29b-41d4-a716-446655440000",
  "records": 150,
  "user": "admin",
  "sucursal": "Matriz",
  "file_name": "historial_arqueos_20260327_195157.xlsx"  // ← Custom (archivo exportado)
}
```

## Testing

### Escenario 1: Exportar Excel
```
1. Click en botón "Excel"
2. Backend genera archivo
3. logger.info() con extra={"file_name": "..."}
Resultado: ✅ Log exitoso sin KeyError
```

### Escenario 2: Exportar PDF
```
1. Click en botón "PDF"
2. Backend genera archivo
3. logger.info() con extra={"file_name": "..."}
Resultado: ✅ Log exitoso sin KeyError
```

## Verificación de Logs

```bash
docker logs nova-backend-1 -f | grep "Excel exportado"
```

**Output esperado:**
```
[2026-03-27 19:51:57 +0000] INFO ✅ Excel exportado extra={'records': 150, 'user': 'admin', 'sucursal': 'Matriz', 'file_name': 'historial_arqueos_20260327_195157.xlsx'}
```

## Lecciones Aprendidas

1. **LogRecord tiene atributos reservados:**
   - No puedes usar `filename`, `lineno`, `func`, `msg`, etc. en `extra`
   - Python los setea automáticamente

2. **Usa snake_case alternativo:**
   - `filename` → `file_name`
   - `pathname` → `file_path`
   - `lineno` → `line_number`
   - `func` → `function_name`

3. **Siempre verifica la lista de atributos:**
   - Lee la documentación de logging.LogRecord
   - O prueba con try/except KeyError

4. **Logging estructurado es poderoso:**
   - Pero respeta las reglas de Python
   - Usa nombres custom para datos custom

---

**Fecha de fix:** 2026-03-27
**Versión:** 1.0
**Archivos modificados:**
- `/home/dagi/nova/backend/main_dashboard/views_caja.py` (líneas 1658, 1807)

**Resultado:**
- ✅ No más KeyError con 'filename'
- ✅ Logging estructurado funcional
- ✅ Logs con metadata de exportación
- ✅ Observabilidad completa

**Referencia:**
- [Python logging.LogRecord documentation](https://docs.python.org/3/library/logging.html#logrecord-objects)
