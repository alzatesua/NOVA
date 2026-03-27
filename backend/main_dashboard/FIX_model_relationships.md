# Fix: Relaciones de Modelo en Exportadores

## Problema Identificado

**Error:**
```python
AttributeError: 'ArqueoCaja' object has no attribute 'usuario_nombre'
```

**Ubicación:**
- `/app/main_dashboard/exportadores.py`, línea 110 (Excel)
- `/app/main_dashboard/exportadores.py`, línea 349 (PDF)

**Causa Raíz:**
El exportador intentaba acceder a campos que solo existen en el **serializer**, no en el **modelo**.

## Contexto: Modelo vs Serializer

### Modelo `ArqueoCaja` (Relaciones reales)
```python
class ArqueoCaja(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # → nova.LoginUsuario
        on_delete=models.SET_NULL,
        null=True,
        related_name='arqueos_caja'
    )

    sucursal = models.ForeignKey(
        'Sucursales',
        on_delete=models.SET_NULL,
        null=True,
        related_name='arqueos_caja'
    )
```

### Serializer `ArqueoCajaSerializer` (Campos calculados)
```python
class ArqueoCajaSerializer(DbAliasModelSerializer):
    # ✅ Estos campos SOLO existen en el serializer
    usuario_nombre = serializers.CharField(source='usuario.usuario', read_only=True)
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True)
```

## El Error

```python
# ❌ INCORRECTO - Campos del serializer, no del modelo
'Usuario': arqueo.usuario_nombre or '-',
'Sucursal': arqueo.sucursal_nombre or '-',
```

Esto falla porque cuando accedes directamente al modelo (no a través del serializer),
estos campos **no existen**.

## Solución Aplicada

### 1. Exportador Excel (líneas 110-111)

**Antes:**
```python
'Usuario': arqueo.usuario_nombre or '-',
'Sucursal': arqueo.sucursal_nombre or '-',
```

**Después:**
```python
'Usuario': arqueo.usuario.usuario if arqueo.usuario else '-',
'Sucursal': arqueo.sucursal.nombre if arqueo.sucursal else '-',
```

### 2. Exportador PDF (líneas 349-350)

**Antes:**
```python
arqueo.usuario_nombre or '-',
arqueo.sucursal_nombre or '-'
```

**Después:**
```python
arqueo.usuario.usuario if arqueo.usuario else '-',
arqueo.sucursal.nombre if arqueo.sucursal else '-'
```

## Relaciones Correctas del Modelo

| Relación | Ruta de acceso | Descripción |
|----------|----------------|-------------|
| Usuario | `arqueo.usuario.usuario` | `arqueo.usuario` → FK a LoginUsuario, `.usuario` → campo nombre |
| Sucursal | `arqueo.sucursal.nombre` | `arqueo.sucursal` → FK a Sucursales, `.nombre` → campo nombre |

## Por Qué `if arqueo.usuario else '-'`

Las ForeignKeys pueden ser `NULL` en la base de datos:
```python
usuario = models.ForeignKey(..., null=True, blank=True)
sucursal = models.ForeignKey(..., null=True, blank=True)
```

Si intentas acceder a `arqueo.usuario.usuario` cuando `arqueo.usuario` es `None`,
obtienes un `AttributeError`.

Por eso usamos:
```python
arqueo.usuario.usuario if arqueo.usuario else '-'
#        ↑              ↑         ↑
#        |              |         Valor default si None
#        |              Campo "usuario" de LoginUsuario
#        FK a LoginUsuario (puede ser None)
```

## select_related() Optimization

El exportador ya usa `select_related()` correctamente:
```python
for arqueo in self.arqueos_qs.select_related(
    'usuario',      # ✅ Optimiza FK a LoginUsuario
    'sucursal',     # ✅ Optimiza FK a Sucursales
    'cerrado_por'   # ✅ Optimiza FK a LoginUsuario (quien cerró)
).iterator():
```

Esto hace **JOIN SQL** y evita el problema N+1 queries:
- ❌ Sin `select_related`: 1 query por arqueo (1000 arqueos = 1001 queries)
- ✅ Con `select_related`: 1 query total (JOIN con usuario, sucursal, cerrado_por)

## Backend Rebuild

```bash
docker restart nova-backend-1
```

Logs:
```
[2026-03-27 19:46:23 +0000] [1] [INFO] Starting gunicorn 23.0.0
[2026-03-27 19:46:23 +0000] [1] [INFO] Listening at: http://0.0.0.0:8000 (1)
[2026-03-27 19:46:23 +0000] [14] [INFO] Booting worker with pid: 14
```

## Testing

### Escenario 1: Exportar con datos
```
1. Abrir: https://dagi-4a4487.dagi.co/caja/historial-arqueos
2. Aplicar filtros de fecha
3. Click en "Excel"
Resultado: ✅ Archivo descargado con nombres de usuario y sucursal
```

### Escenario 2: Exportar con usuario NULL
```
Si arqueo.usuario = None:
'Usuario': '-'  ✅ (no lanza AttributeError)
```

### Escenario 3: Exportar con sucursal NULL
```
Si arqueo.sucursal = None:
'Sucursal': '-'  ✅ (no lanza AttributeError)
```

## Verificación de Archivo Generado

**Excel - Hoja "Detalle":**
| Fecha | Hora | Saldo Esp. | Contado | Diferencia | Estado | Usuario | Sucursal |
|-------|------|------------|---------|------------|--------|---------|----------|
| 27/03/2026 | 14:30 | $1,000,000 | $1,000,000 | $0 | Cerrada | admin | Matriz |

✅ Usuario: nombre del usuario (no objeto ForeignKey)
✅ Sucursal: nombre de la sucursal (no objeto ForeignKey)

**PDF - Tabla de datos:**
```
Fecha       Hora       Saldo Esp.  Contado     Diferencia  Estado     Usuario    Sucursal
27/03/2026  14:30      $1,000,000  $1,000,000  $0          Cerrada    admin      Matriz
```

✅ Sin errores de AttributeError
✅ Nombres legibles (no objetos)

## Diferencias: Serializer vs Modelo Directo

### A través de Serializer (API endpoints)
```python
serializer = ArqueoCajaSerializer(arqueo)
data = serializer.data
# ✅ Puedes usar: data['usuario_nombre'], data['sucursal_nombre']
```

### Acceso Directo al Modelo (Exportadores)
```python
# ❌ NO puedes usar: arqueo.usuario_nombre
# ✅ DEBES usar: arqueo.usuario.usuario
```

## Lecciones Aprendidas

1. **Serializer fields ≠ Model fields**
   - Los campos del serializer son solo para API responses
   - Cuando accedes directamente al modelo, debes usar las relaciones reales

2. **ForeignKeys pueden ser NULL**
   - Siempre verifica: `if arqueo.usuario else '-'`
   - Esto previene AttributeError cuando la FK es None

3. **select_related() es obligatorio**
   - Sin esto, cada acceso a `arqueo.usuario.usuario` genera una query adicional
   - Con esto, haces JOIN y obtienes todos los datos en 1 query

---

**Fecha de fix:** 2026-03-27
**Versión:** 1.0
**Archivos modificados:**
- `/home/dagi/nova/backend/main_dashboard/exportadores.py` (líneas 110-111, 349-350)

**Resultado:**
- ✅ Exportadores usan relaciones correctas del modelo
- ✅ No más AttributeError
- ✅ Manejo correcto de FKs NULL
- ✅ Optimización con select_related()
