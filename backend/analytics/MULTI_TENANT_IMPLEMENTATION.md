# Analytics Multi-Tenant Implementation

## Resumen de Cambios

El módulo de Analytics ha sido actualizado para soportar completamente la arquitectura multi-tenant del sistema. Ahora todas las operaciones de analytics (servicios, vistas y seeder) respetan el contexto del tenant activo.

## Arquitectura Multi-Tenant

El sistema utiliza una arquitectura **database-per-tenant** personalizada:

- **Base de datos central (`bd_madre`)**: Almacena modelos de tenant (`Tiendas`, `Dominios`)
- **Bases de datos de tenant**: Cada tienda tiene su propia base de datos PostgreSQL
- **Resolución de tenant**: Vía subdominio extraído del header HTTP Host
- **Conexión dinámica**: `conectar_db_tienda(alias, tienda)` + `Model.objects.using(alias)`

## Archivos Modificados

### 1. Services Layer

#### [analytics/services/ventas_service.py](backend/analytics/services/ventas_service.py)
- ✅ Agregado parámetro `db_alias='default'` a todos los métodos
- ✅ Actualizadas 5 consultas ORM con `.using(db_alias)`
- Métodos actualizados:
  - `obtener_ventas_totales(fecha_inicio, fecha_fin, sucursal_id=None, db_alias='default')`
  - `obtener_tendencia_ventas(dias=30, sucursal_id=None, db_alias='default')`
  - `obtener_top_productos(fecha_inicio, fecha_fin, limite=10, sucursal_id=None, db_alias='default')`
  - `obtener_ventas_por_categoria(fecha_inicio, fecha_fin, sucursal_id=None, db_alias='default')`
  - `obtener_ventas_por_sucursal(fecha_inicio, fecha_fin, db_alias='default')`

#### [analytics/services/inventario_service.py](backend/analytics/services/inventario_service.py)
- ✅ Agregado parámetro `db_alias='default'` a todos los métodos
- ✅ Actualizadas 5 consultas ORM con `.using(db_alias)`
- Métodos actualizados:
  - `obtener_resumen_inventario(sucursal_id=None, db_alias='default')`
  - `obtener_productos_stock_bajo(sucursal_id=None, limite=50, db_alias='default')`
  - `obtener_productos_sin_rotacion(dias_sin_venta=30, sucursal_id=None, db_alias='default')`
  - `obtener_existencias_por_bodega(sucursal_id=None, db_alias='default')`
  - `obtener_traslados_periodo(fecha_inicio, fecha_fin, sucursal_id=None, db_alias='default')`

#### [analytics/services/kpis_calculator.py](backend/analytics/services/kpis_calculator.py)
- ✅ Agregado parámetro `db_alias='default'` al constructor
- ✅ Actualizadas todas las llamadas a servicios para pasar `self.db_alias`
- Constructor: `__init__(self, sucursal_id=None, db_alias='default')`

### 2. Views Layer

#### [analytics/views.py](backend/analytics/views.py)
- ✅ Agregada función `_resolve_tenant_alias(request)` para resolver tenant desde el request
- ✅ Actualizados los 11 endpoints para resolver tenant y pasar `db_alias` a servicios
- ✅ Agregado manejo de errores con códigos HTTP apropiados (401, 404, 503)

**Endpoints actualizados:**
1. `GET /api/analytics/kpis/`
2. `GET /api/analytics/ventas/totales/`
3. `GET /api/analytics/ventas/tendencia/`
4. `GET /api/analytics/ventas/top-productos/`
5. `GET /api/analytics/ventas/por-categoria/`
6. `GET /api/analytics/ventas/por-sucursal/`
7. `GET /api/analytics/inventario/resumen/`
8. `GET /api/analytics/inventario/stock-bajo/`
9. `GET /api/analytics/inventario/sin-rotacion/`
10. `GET /api/analytics/inventario/por-bodega/`
11. `GET /api/analytics/comparativa-periodos/`

**Parámetros de autenticación requeridos en todos los endpoints:**
- `usuario`: Nombre de usuario del tenant (requerido)
- `token`: Token de sesión del tenant (requerido)
- `subdominio`: Subdominio del tenant (opcional si se usa subdomain en Host header)

### 3. Seeder Command

#### [analytics/management/commands/seed_analytics_data.py](backend/analytics/management/commands/seed_analytics_data.py)
- ✅ Agregado argumento `--tenant` (requerido)
- ✅ Agregado método `resolver_tenant()` para resolver tenant por ID o subdominio
- ✅ Agregado método `validar_estructura_tenant()` para verificar tablas requeridas
- ✅ Actualizadas todas las operaciones SQL para usar `connections[self.db_alias]`
- ✅ Actualizadas todas las operaciones ORM para usar `Model.objects.using(self.db_alias)`
- ✅ Agregada validación para prevenir seeding a `bd_madre`

## Uso del Sistema

### 1. Ejecutar el Seeder

```bash
# Con subdominio
python manage.py seed_analytics_data --tenant=dagi --limpiar --dias-historia=60

# Con ID de tienda
python manage.py seed_analytics_data --tenant=123 --productos=100 --facturas-por-dia=20

# Ver ayuda completa
python manage.py seed_analytics_data --help
```

**Parámetros del seeder:**
- `--tenant`: Nombre del tenant (subdominio) o ID de tienda (REQUERIDO)
- `--dias-historia`: Días de historia a generar (default: 60)
- `--sucursales`: Número de sucursales a crear (default: 3)
- `--productos`: Número de productos a crear (default: 50)
- `--facturas-por-dia`: Facturas promedio por día (default: 15)
- `--limpiar`: Eliminar datos existentes antes de generar nuevos

### 2. Consumir API Endpoints

#### Ejemplo con cURL (usando subdominio en Host):

```bash
# KPIs generales
curl -X GET "http://dagi.localhost:8000/api/analytics/kpis/?usuario=admin&token=abc123&dias=30"

# Ventas totales
curl -X GET "http://dagi.localhost:8000/api/analytics/ventas/totales/?usuario=admin&token=abc123"

# Top productos
curl -X GET "http://dagi.localhost:8000/api/analytics/ventas/top-productos/?usuario=admin&token=abc123&limite=10"
```

#### Ejemplo con cURL (usando parámetro subdominio):

```bash
# Inventario resumen
curl -X GET "http://localhost:8000/api/analytics/inventario/resumen/?subdominio=dagi&usuario=admin&token=abc123"

# Productos stock bajo
curl -X GET "http://localhost:8000/api/analytics/inventario/stock-bajo/?subdominio=dagi&usuario=admin&token=abc123&limite=20"
```

### 3. Ejemplo desde Frontend (JavaScript)

```javascript
// Usando fetch API
const fetchAnalytics = async (endpoint) => {
  const params = new URLSearchParams({
    usuario: 'admin',
    token: 'abc123',
    subdominio: 'dagi',
    dias: 30
  });

  const response = await fetch(`/api/analytics/${endpoint}/?${params}`);
  const data = await response.json();
  return data;
};

// Ejemplos de uso
const kpis = await fetchAnalytics('kpis');
const ventas = await fetchAnalytics('ventas/totales');
const inventario = await fetchAnalytics('inventario/resumen');
```

## Validación y Testing

### 1. Verificar Datos en Tenant Correcto

```python
# Abrir shell de Django
python manage.py shell

# Conectar a tenant específico
from nova.models import Tiendas
from nova.utils.db import conectar_db_tienda
from main_dashboard.models import Factura

tienda = Tiendas.objects.get(id=1)  # Usar ID correcto
conectar_db_tienda('1', tienda)

# Verificar datos en tenant
print(f"Facturas en tenant: {Factura.objects.using('1').count()}")

# Verificar que bd_madre está vacía
print(f"Facturas en bd_madre: {Factura.objects.using('default').count()}")
```

### 2. Checklist de Verificación

- [ ] Seeder requiere parámetro `--tenant`
- [ ] Seeder valida que tenant existe y está activo
- [ ] Seeder valida estructura de base de datos del tenant
- [ ] Seeder inserta datos solo en base del tenant
- [ ] Todos los endpoints de API requieren autenticación
- [ ] Endpoints retornan datos solo del tenant correcto
- [ ] Base madre (`bd_madre`) permanece limpia (sin datos de negocio)
- [ ] No hay contaminación cruzada entre tenants

### 3. Comandos de Verificación Rápida

```bash
# Listar tenants disponibles
python manage.py shell -c "from nova.models import Tiendas; [print(f'ID: {t.id}, Nombre: {t.nombre_tienda}, DB: {t.db_nombre}') for t in Tiendas.objects.all()]"

# Ejecutar seeder para tenant específico
python manage.py seed_analytics_data --tenant=dagi --limpiar --dias-historia=30

# Verificar que no hay datos en bd_madre
python manage.py shell -c "from main_dashboard.models import Factura; print(f'Facturas en bd_madre: {Factura.objects.using(\"default\").count()}')"
```

## Respuestas de Error

La API ahora retorna códigos de error apropiados:

### 401 Unauthorized
```json
{
  "error": "Error de autenticación: usuario y token son requeridos (en body o querystring)."
}
```

### 404 Not Found
```json
{
  "error": "Error de autenticación: Dominio no válido."
}
```

### 503 Service Unavailable
```json
{
  "error": "Error de conexión a base de datos del tenant: [detalle del error]"
}
```

## Seguridad

### Aislamiento de Tenant
- ✅ Resolución de tenant validada contra tabla `Dominios`
- ✅ Alias de base de datos derivado de registro de tenant validado
- ✅ Prevención de acceso cross-tenant
- ✅ SQL parametrizado (protección contra SQL injection)

### Validaciones
- ✅ Seeder rechaza inserción en `bd_madre`
- ✅ Seeder valida existencia y estado del tenant
- ✅ Seeder valida estructura de tablas requeridas
- ✅ Vistas requieren autenticación para todos los endpoints

## Consideraciones Técnicas

### Connection Pooling
La función `conectar_db_tienda()` ya implementa pooling:
```python
def conectar_db_tienda(alias, tienda):
    if alias in settings.DATABASES:
        return  # Conexión ya registrada
    # ... agregar configuración
```

### Rendimiento
- Servicios usan `.select_related()` y `.prefetch_related()` para optimización
- Conexiones se reutilizan entre requests
- No hay caché global (cada request consulta la base del tenant)

### Transacciones
El seeder no usa transacciones actualmente (aceptable para datos de prueba).
Si se requieren en el futuro:
```python
from django.db import transaction

@transaction.atomic(using=self.db_alias)
def metodo_con_transaccion(self):
    # operaciones
```

## Migración y Rollback

### Si hay problemas en producción:

1. **Revertir código**:
   ```bash
   git revert [commit-hash]
   ```

2. **Limpiar datos de prueba**:
   ```bash
   python manage.py shell
   ```

   ```python
   from nova.models import Tiendas
   from nova.utils.db import conectar_db_tienda
   from django.db import connections

   tienda = Tiendas.objects.get(id=1)  # ID del tenant
   alias = str(tienda.id)
   conectar_db_tienda(alias, tienda)

   with connections[alias].cursor() as cursor:
       cursor.execute("DELETE FROM facturacion_pago")
       cursor.execute("DELETE FROM facturacion_factura_detalle")
       cursor.execute("DELETE FROM facturacion_factura")
       cursor.execute("DELETE FROM inventario_existencia")
       cursor.execute("DELETE FROM productos")
   ```

## Próximos Pasos

1. **Testing**: Ejecutar suite de tests para verificar funcionamiento
2. **Monitoreo**: Verificar logs en busca de errores de conexión
3. **Performance**: Evaluar rendimiento con múltiples tenants
4. **Documentación**: Actualizar documentación de API para usuarios finales

## Soporte

Para problemas o preguntas:
- Revisar logs de Django: `tail -f /var/log/django/debug.log`
- Verificar conexiones de base de datos en settings
- Validar que tablas de tenant tengan estructura correcta
- Contactar al equipo de desarrollo

# Para identificar los tenant activos

source /home/dagi/nova/backend/env/bin/activate && ENVIRONMENT=development DB_HOST=localhost python /home/dagi/nova/backend/manage.py shell -c "
from nova.models import Tiendas, Dominios
print('=== TENANTS DISPONIBLES ===')
for t in Tiendas.objects.all():
    print(f'ID: {t.id} | Nombre: {t.nombre_tienda} | DB: {t.db_nombre} | Activo: {t.es_activo}')
    dominios = Dominios.objects.filter(tienda=t)
    for d in dominios:
        print(f'   └─ Dominio: {d.dominio}')
"

# Para generar datos

source /home/dagi/nova/backend/env/bin/activate && ENVIRONMENT=development DB_HOST=localhost python /home/dagi/nova/backend/manage.py seed_analytics_data --tenant=1 --limpiar --dias-historia=60 2>&1 | head -100