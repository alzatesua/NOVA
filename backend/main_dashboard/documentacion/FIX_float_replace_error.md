# Fix: Error float.replace() en Exportador Excel

## Problema Identificado

**Error:**
```python
AttributeError: 'float' object has no attribute 'replace'
```

**Ubicación:**
`/app/main_dashboard/exportadores.py`, línea 230

**Traceback:**
```python
File "/app/main_dashboard/exportadores.py", line 230, in exportar
    diff_val = float(value.replace('$', '').replace('.', ''))
                     ^^^^^^^^^^^^^
AttributeError: 'float' object has no attribute 'replace'
```

## Causa Raíz

En el DataFrame, la columna "Diferencia" se está guardando como `float`:

```python
# Línea 108 - Datos guardados como float
'Diferencia': float(arqueo.diferencia or 0),
```

Pero luego, al intentar aplicar color en el Excel, el código asume que es un `string` con formato de moneda:

```python
# Línea 230 - Intentando hacer .replace() en un float ❌
if value != '-' and value != '$0':
    diff_val = float(value.replace('$', '').replace('.', ''))
```

Esto falla porque:
- `value` es `float` (ej: `5000.0` o `-250.0`)
- Los `float` no tienen método `.replace()`
- El método `.replace()` solo existe en `str`

## Solución Aplicada

**Archivo:** `/home/dagi/nova/backend/main_dashboard/exportadores.py` (línea 228-234)

### Antes (Incorrecto)
```python
# Color de diferencia
if col_num == 8:  # Columna Diferencia
    if value != '-' and value != '$0':
        diff_val = float(value.replace('$', '').replace('.', ''))  # ❌ Error si value es float
        if diff_val > 0:
            cell.font = Font(color="008000")  # Verde
        elif diff_val < 0:
            cell.font = Font(color="FF0000")  # Rojo
```

### Después (Corregido)
```python
# Color de diferencia
if col_num == 8:  # Columna Diferencia
    # value ya es float desde el DataFrame
    if isinstance(value, (int, float)) and value != 0:
        if value > 0:
            cell.font = Font(color="008000")  # Verde
        elif value < 0:
            cell.font = Font(color="FF0000")  # Rojo
```

## Cambios Realizados

1. **Eliminada conversión innecesaria:**
   - ❌ Antes: `float(value.replace('$', '').replace('.', ''))`
   - ✅ Después: `value` (ya es float)

2. **Validación de tipo:**
   - ❌ Antes: `if value != '-' and value != '$0'`
   - ✅ Después: `if isinstance(value, (int, float)) and value != 0`

3. **Comparación directa:**
   - `value > 0` → diferencia positiva (verde)
   - `value < 0` → diferencia negativa (rojo)

## Por Qué Esto Funciona

### Tipos de Datos en el DataFrame

```python
data.append({
    'Diferencia': float(arqueo.diferencia or 0),  # ← Ya es float
    # ...
})
```

Cuando pandas/escribe esto en Excel:
- **Sin formato**: `5000.0` (número)
- **Con formato numérico**: `5,000.00` (número formateado)

Pero `value` sigue siendo un `float` de Python, no un string.

### Validación con isinstance()

```python
isinstance(value, (int, float)) and value != 0
```

Esto verifica:
1. ✅ `value` es un número (int o float)
2. ✅ `value` no es cero
3. ✅ Evita errores si por alguna razón hay un string

### Colores Condicionales

```python
if value > 0:
    cell.font = Font(color="008000")  # Verde - sobrante
elif value < 0:
    cell.font = Font(color="FF0000")  # Rojo - faltante
```

- **Verde** (`008000`): La caja tiene más dinero del esperado
- **Rojo** (`FF0000`): La caja tiene menos dinero del esperado
- **Negro** (default): La caja está exacta (diferencia = 0)

## Ejemplo de Datos

### Valor Positivo (Verde)
```python
value = 5000.0  # float
# isinstance(value, (int, float)) → True
# value != 0 → True
# value > 0 → True
# Resultado: Fuente verde ✅
```

### Valor Negativo (Rojo)
```python
value = -250.0  # float
# isinstance(value, (int, float)) → True
# value != 0 → True
# value < 0 → True
# Resultado: Fuente roja ✅
```

### Valor Cero (Sin color)
```python
value = 0.0  # float
# isinstance(value, (int, float)) → True
# value != 0 → False
# Resultado: No se aplica color ✅
```

## Backend Rebuild

```bash
docker restart nova-backend-1
```

Logs:
```
[2026-03-27 19:49:30 +0000] [1] [INFO] Starting gunicorn 23.0.0
[2026-03-27 19:49:30 +0000] [1] [INFO] Listening at: http://0.0.0.0:8000 (1)
[2026-03-27 19:49:30 +0000] [14] [INFO] Booting worker with pid: 14
```

## Testing

### Escenario 1: Diferencia Positiva
```
Saldo Esperado: $1,000,000
Monto Contado: $1,005,000
Diferencia: $5,000

Resultado en Excel:
- Valor: 5000.0
- Color: Verde ✅
```

### Escenario 2: Diferencia Negativa
```
Saldo Esperado: $1,000,000
Monto Contado: $997,500
Diferencia: -$2,500

Resultado en Excel:
- Valor: -2500.0
- Color: Rojo ✅
```

### Escenario 3: Caja Exacta
```
Saldo Esperado: $1,000,000
Monto Contado: $1,000,000
Diferencia: $0

Resultado en Excel:
- Valor: 0.0
- Color: Negro (default) ✅
```

## Verificación Visual del Excel

Al abrir el archivo Excel generado:

| Columna | Valor | Color | Significado |
|---------|-------|-------|-------------|
| Diferencia | 5000 | 🟢 Verde | Sobrante de caja |
| Diferencia | -2500 | 🔴 Rojo | Faltante de caja |
| Diferencia | 0 | ⚫ Negro | Caja exacta |

## Lecciones Aprendidas

1. **DataFrame data types son preservados:**
   - Si guardas como `float()`, sigue siendo `float` en el loop
   - No asumas que es un string formateado

2. **Validación de tipo es importante:**
   - `isinstance(value, (int, float))` previene errores
   - Mejor que asumir el tipo del dato

3. **No sobre-complicar:**
   - Si el dato ya es `float`, úsalo directamente
   - No necesitas hacer `replace()` de formato de moneda

4. **openpyxl maneja números correctamente:**
   - Los `float` se escriben como números en Excel
   - No necesitan conversión a string

---

**Fecha de fix:** 2026-03-27
**Versión:** 1.0
**Archivos modificados:**
- `/home/dagi/nova/backend/main_dashboard/exportadores.py` (líneas 228-234)

**Resultado:**
- ✅ No más AttributeError con float.replace()
- ✅ Colores correctos para diferencias (verde/rojo)
- ✅ Validación de tipo con isinstance()
- ✅ Código más simple y mantenible
