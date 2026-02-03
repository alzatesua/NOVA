# Guía del Management Command: Seed Analytics Data

## 📋 Descripción General

El management command `seed_analytics_data` genera datos de simulación realistas para probar el dashboard de Analytics del sistema POS. Estos datos permiten visualizar y probar todos los endpoints de analítica sin necesidad de tener datos reales de producción.

## 🎯 Qué hace este comando

Este comando crea automáticamente:

### Datos Maestros
- **Categorías**: Electrónicos, Ropa, Hogar, Deportes, Juguetes, Alimentos, Bebidas, Librería, Calzado, Accesorios
- **Marcas**: TechBrand, SportMax, HomeStyle, FashionPro, KidsWorld, FoodCorp, DrinkCo, OfficePlus
- **Impuestos (IVA)**: 19%, 0%, 5%
- **Formas de pago**: Efectivo, Tarjeta de Crédito, Tarjeta Débito, Transferencia

### Estructura Organizacional
- **Sucursales** (configurable, default: 3)
- **Bodegas** por sucursal (1 principal + 1 almacén)
- **Clientes** (personas naturales y jurídicas, default: 30)

### Productos e Inventario
- **Productos** (configurable, default: 50)
  - ConSKU único, nombre, descripción, precio
  - Asignados a categorías y marcas
  - Con IVA y descuentos aplicados
- **Existencias** en bodegas
  - Stock aleatorio (10-200 unidades)
  - Nivel mínimo de reorden (5-20 unidades)
  - Productos con stock bajo generados automáticamente

### Ventas Históricas
- **Facturas** distribuidas en el tiempo
  - Estado: PAG (Pagadas)
  - Distribución: 10-20 facturas por día
  - Período configurable (default: 60 días)
- **Detalles de factura**: 1-5 productos por factura
- **Pagos**: Una o múltiples formas de pago por factura

## 🚀 Uso

### Sintaxis Básica

```bash
docker compose exec backend python manage.py seed_analytics_data
```

### Opciones Disponibles

| Opción | Descripción | Default | Ejemplo |
|--------|-------------|---------|---------|
| `--dias-historia` | Días de historia a generar | 60 | `--dias-historia 90` |
| `--sucursales` | Número de sucursales a crear | 3 | `--sucursales 5` |
| `--productos` | Número de productos a crear | 50 | `--productos 100` |
| `--facturas-por-dia` | Facturas promedio por día | 15 | `--facturas-por-dia 20` |
| `--limpiar` | Eliminar datos existentes antes de generar | False | `--limpiar` |

### Ejemplos de Uso

#### 1. Generar datos con valores por defecto
```bash
docker compose exec backend python manage.py seed_analytics_data
```

#### 2. Limpiar datos anteriores y regenerar
```bash
docker compose exec backend python manage.py seed_analytics_data --limpiar
```

#### 3. Generar más datos (90 días, 5 sucursales, 100 productos)
```bash
docker compose exec backend python manage.py seed_analytics_data \
  --limpiar \
  --dias-historia 90 \
  --sucursales 5 \
  --productos 100 \
  --facturas-por-dia 25
```

#### 4. Generar datos ligeros para pruebas rápidas
```bash
docker compose exec backend python manage.py seed_analytics_data \
  --limpiar \
  --dias-historia 15 \
  --sucursales 2 \
  --productos 20 \
  --facturas-por-dia 10
```

## 📊 Endpoints que se pueden probar

Después de generar los datos, puedes probar los siguientes endpoints del dashboard de Analytics:

### KPIs Generales
```
GET /api/analytics/kpis/?dias=30
```
 Retorna: Ventas totales, cantidad de facturas, ticket promedio, resumen de inventario, alertas

### Ventas
```
GET /api/analytics/ventas/totales/?fecha_inicio=2026-01-01&fecha_fin=2026-01-31
GET /api/analytics/ventas/tendencia/?dias=30
GET /api/analytics/ventas/top-productos/?dias=30&limite=10
GET /api/analytics/ventas/por-categoria/?dias=30
GET /api/analytics/ventas/por-sucursal/?dias=30
```

### Inventario
```
GET /api/analytics/inventario/resumen/
GET /api/analytics/inventario/stock-bajo/?limite=50
GET /api/analytics/inventario/sin-rotacion/?dias=30
GET /api/analytics/inventario/por-bodega/
```

### Comparativa
```
GET /api/analytics/comparativa-periodos/?dias_actual=30&dias_anterior=30
```

## 🔧 Funcionamiento Técnico

### Problemas Resueltos

#### 1. Modelo Producto con `managed=False`
El modelo `Producto` tiene `managed = False` y usa SQL directo porque:
- La tabla real tiene una estructura diferente al modelo
- El campo `bodega_id` no existe en la tabla real (solo `sucursal_id`)
- Se usa SQL directo para insertar productos para evitar errores de mapeo

#### 2. Campo `fecha_venta` con `auto_now_add=True`
El modelo `Factura` tiene `fecha_venta = models.DateTimeField(auto_now_add=True)`:
- Django siempre usa la fecha actual, ignorando el valor pasado
- Solución: Usar SQL directo para insertar facturas con fechas históricas

#### 3. Zonas Horarias
- Los servicios usaban `datetime.now()` (sin zona horaria)
- Las facturas tenían timestamps con zona horaria
- Solución: Cambiar a `timezone.now()` en todos los servicios

### Estructura de Datos Generados

```sql
-- Jerarquía de datos
Tiendas → Sucursales → Bodegas → Productos
                              ↓
                         Existencias (stock por bodega)

Facturas → FacturaDetalle (productos) → Pagos
   ↓
Cliente (opcional)
```

## 🗑️ Limpiar Datos Generados

### Opción 1: Usar el comando --limpiar
```bash
docker compose exec backend python manage.py seed_analytics_data --limpiar
```

### Opción 2: Limpieza manual completa
```bash
docker compose exec backend python manage.py shell
```

```python
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("DELETE FROM facturacion_pago")
    cursor.execute("DELETE FROM facturacion_factura_detalle")
    cursor.execute("DELETE FROM facturacion_factura")
    cursor.execute("DELETE FROM inventario_existencia")
    cursor.execute("DELETE FROM productos")
    cursor.execute("DELETE FROM inventario_bodega")
    cursor.execute("DELETE FROM facturacion_cliente")
    cursor.execute("DELETE FROM facturacion_forma_pago")
    cursor.execute("DELETE FROM main_dashboard_sucursales")
    cursor.execute("DELETE FROM main_dashboard_categoria")
    cursor.execute("DELETE FROM main_dashboard_marca")
```

## 📈 Datos Generados Por Defecto

Con los valores por defecto (`--dias-historia 60 --sucursales 3 --productos 50 --facturas-por-dia 15`):

- **~900 facturas** distribuidas en 60 días
- **~2,600 detalles** de factura
- **50 productos** con precios entre $10,000 y $500,000 COP
- **3 sucursales** con 2 bodegas cada una
- **30 clientes** (mix de personas naturales y jurídicas)
- **10,000+ unidades** de inventario total

## ⚠️ Consideraciones Importantes

1. **Datos de Prueba**: Este comando genera datos ficticios para desarrollo/testing. NO usar en producción.

2. **IDs Autogenerados**: Los IDs de productos, facturas, etc. son autogenerados por PostgreSQL y variarán en cada ejecución.

3. **Relaciones con Datos Reales**: Si ya tienes datos reales en la base de datos, usa `--limpiar` con precaución ya que eliminará TODOS los datos existentes.

4. **Performance**: Generar muchos datos (ej: 1000 productos, 365 días) puede tomar varios minutos.

5. **Consistencia**: Los datos generados son aleatorios pero consistentes con las reglas del negocio (precios positivos, stock suficiente, estados válidos, etc.).

## 🐛 Solución de Problemas Comunes

### Los endpoints devuelven 0 ventas
**Problema**: Zona horaria incorrecta en los servicios
**Solución**: Ya está arreglado en el código actual usando `timezone.now()`

### Error "column productos.bodega_id does not exist"
**Problema**: El modelo Django no coincide con la tabla real
**Solución**: Ya está arreglado usando SQL directo para productos

### Error "name 'Decimal' is not defined"
**Problema**: Falta el import en views.py
**Solución**: Ya está arreglado agregando `from decimal import Decimal`

## 📞 Soporte

Para más información o problemas:
- Revisar el código fuente: `backend/analytics/management/commands/seed_analytics_data.py`
- Ver logs del backend: `docker compose logs backend --tail=100`
- Documentación de APIs: Ver la lista de endpoints arriba

---
**Versión**: 1.0
**Fecha Creación**: 2026-02-03
**Última Actualización**: 2026-02-03
