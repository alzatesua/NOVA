# API de Productos Multi-Tenant por Subdominio

## Resumen

La API de productos ahora funciona con un sistema **multi-tenant basado en subdominios**. No requiere autenticación de usuario/token, solo usa el subdominio para identificar la tienda y conectar a su base de datos específica.

## Flujo de Funcionamiento

```
1. Cliente hace request → API productos
         ↓
2. SubdomainMixin extrae subdominio del Host o querystring
         ↓
3. Busca en tabla Dominios por ese subdominio
         ↓
4. Obtiene la Tienda asociada con sus credenciales BD
         ↓
5. Conecta dinámicamente a la BD de esa tienda
         ↓
6. Retorna productos de esa BD específica
```

## Modelo de Datos

### Tabla: Dominios
```python
class Dominios(models.Model):
    tienda = models.ForeignKey(Tiendas, on_delete=models.CASCADE, related_name='dominios')
    dominio = models.CharField(max_length=255, unique=True, blank=True)  # Subdominio
    es_principal = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True)
```

### Tabla: Tiendas
```python
class Tiendas(models.Model):
    nombre_tienda = models.CharField(max_length=100)
    db_nombre = models.CharField(max_length=150, unique=True)  # Nombre BD
    db_usuario = models.CharField(max_length=100)  # Usuario BD
    db_password = models.CharField(max_length=100)  # Password BD
    # ... otros campos
```

## Uso de la API

### Método 1: Subdominio en el Host HTTP

**Request:**
```bash
POST https://mi-tienda.midominio.com/api/productos/list/
```

**Cómo funciona:**
- El mixin extrae `mi-tienda` del Host
- Busca `dominio='mi-tienda'` en tabla Dominios
- Obtiene credenciales de la tienda asociada
- Conecta a esa BD y retorna productos

### Método 2: Subdominio por Querystring

**Request:**
```bash
POST https://midominio.com/api/productos/list/?subdominio=mi-tienda
```

**o por body JSON:**
```bash
POST https://midominio.com/api/productos/list/
Content-Type: application/json

{
    "subdominio": "mi-tienda"
}
```

## Respuesta Exitosa

**Status:** 200 OK

```json
{
    "ok": true,
    "mensaje": "Listado de productos con ficha técnica",
    "total_productos": 150,
    "data": [
        {
            "id": 1,
            "sku": "SKU-001",
            "nombre": "Scooter Eléctrico X500",
            "descripcion": "Scooter eléctrico con autonomía de 50km",
            "precio": "1250.00",
            "stock": 25,
            "estado": "Disponible",
            "categoria": {
                "id": 5,
                "nombre": "Movilidad Eléctrica"
            },
            "marca": {
                "id": 2,
                "nombre": "EcoMotion"
            },
            "tipo_medida": {
                "id": 1,
                "nombre": "Unidad"
            },
            "iva": {
                "id": 1,
                "porcentaje": "19.00"
            },
            "descuento": {
                "id": 3,
                "porcentaje": "10.00"
            },
            "codigo_barras": "7801234567890",
            "imei": null,
            "imagen_producto": "/media/productos/scooter-x500.jpg",
            "atributo": "color",
            "valor_atributo": "negro",
            "creado_en": "2025-01-15T10:30:00Z"
        }
    ]
}
```

## Respuestas de Error

### Subdominio no encontrado

**Status:** 401 Unauthorized

```json
{
    "ok": false,
    "detail": "Subdominio 'mi-tienda' no encontrado en tabla Dominios."
}
```

### Error de conexión a BD

**Status:** 401 Unauthorized

```json
{
    "ok": false,
    "detail": "Error al conectar a la base de datos: connection refused"
}
```

### No se pudo determinar subdominio

**Status:** 401 Unauthorized

```json
{
    "ok": false,
    "detail": "No se pudo determinar el subdominio desde el request."
}
```

## Componentes Implementados

### SubdomainMixin ([views_productosEcomerce.py:15-81](backend/main_dashboard/views_productosEcomerce.py#L15-L81))

Mixin personalizado que:
- Extrae subdominio del Host HTTP o querystring/body
- Busca en tabla `Dominios`
- Obtiene `Tienda` con credenciales BD
- Usa `conectar_db_tienda()` para conexión dinámica
- Retorna alias para queries multi-tenant

```python
class SubdomainMixin:
    permission_classes = []  # Sin autenticación requerida
    db_alias = None
    _tenant_tienda = None

    def _resolve_alias(self, request):
        # Lógica de resolución de subdominio
        # Retorna alias de BD
```

### ProductoView ([views_productosEcomerce.py:84-170](backend/main_dashboard/views_productosEcomerce.py#L84-L170))

Vista que:
- Hereda de `SubdomainMixin`
- Resuelve alias BD automáticamente
- Retorna productos con ficha técnica completa
- Incluye relaciones (categoría, marca, IVA, descuento)

```python
class ProductoView(SubdomainMixin, APIView):
    def post(self, request):
        alias = self._resolve_alias(request)
        productos_qs = Producto.objects.using(alias).select_related(...)
        # Retorna JSON con productos
```

## Configuración Requerida

### 1. Asegurar que Dominios y Tiendas estén en BD default

```bash
python manage.py migrate
```

### 2. Crear Tienda y Dominio

```python
from nova.models import Tiendas, Dominios, Direccion, Documento, TipoDocumento

# Crear dirección
direccion = Direccion.objects.create(
    calle_numero="Calle 123 #45-67",
    ciudad_estado="Bogotá",
    codigo_postal="110001",
    pais="Colombia"
)

# Crear tienda
tienda = Tiendas.objects.create(
    nombre_tienda="Mi Tienda",
    nit="900123456-7",
    nombre_completo="Mi Tienda SAS",
    telefono="+57 1 123 4567",
    direccion=direccion,
    usuario="admin@mitienda.com",
    correo_usuario="admin@mitienda.com"
)

# Crear dominio/subdominio
dominio = Dominios.objects.create(
    tienda=tienda,
    dominio="mi-tienda",  # Este será el subdominio
    es_principal=True
)
```

## Ventajas del Nuevo Sistema

1. **Sin Autenticación Requerida:** El e-commerce público no necesita token JWT
2. **Aislamiento Completo:** Cada tienda tiene su propia BD
3. **Escalabilidad:** Fácil agregar nuevas tiendas
4. **Seguridad:** Credenciales BD separadas por tienda
5. **Flexibilidad:** Soporta subdominio o querystring

## Comparación con TenantMixin Original

| Característica | TenantMixin (Anterior) | SubdomainMixin (Nuevo) |
|----------------|------------------------|-------------------------|
| Autenticación | Requiere usuario + token JWT | No requiere autenticación |
| Uso ideal | Endpoints privados/admin | E-commerce público |
| Subdominio | Opcional | Requerido |
| Validaciones | Verifica usuario en BD tienda | Solo verifica dominio |
| Performance | Más lento (valida usuario) | Más rápido (solo dominio) |

## Logs de Debug

El mixin incluye logs informativos:

```python
logger.info(f"✅ SubdomainMixin: Conectado a BD '{tienda.db_nombre}' (alias: {alias}) via subdominio '{subdom}'")
```

## Testing

```bash
# Test con subdominio válido
curl -X POST https://mi-tienda.midominio.com/api/productos/list/

# Test con querystring
curl -X POST https://midominio.com/api/productos/list/?subdominio=mi-tienda

# Test con body
curl -X POST https://midominio.com/api/productos/list/ \
  -H "Content-Type: application/json" \
  -d '{"subdominio": "mi-tienda"}'
```

## Seguridad

- ✅ Cada tienda tiene credenciales BD únicas
- ✅ Subdominio validado contra tabla Dominios
- ✅ Conexión dinámica por alias (id tienda)
- ✅ No expone credenciales en responses
- ⚠️ Considerar implementar rate limiting por IP
- ⚠️ Considerar implementar CORS restrictions

## Archivos Modificados

1. **[backend/main_dashboard/views_productosEcomerce.py](backend/main_dashboard/views_productosEcomerce.py)**
   - Agregado `SubdomainMixin`
   - Modificado `ProductoView` para usar `SubdomainMixin` en lugar de `TenantMixin`
   - Importado modelo `Producto`
   - Importado utilidades `conectar_db_tienda`

## Próximos Pasos

1. Probar la API con diferentes tiendas
2. Configurar DNS para apuntar subdominios al servidor
3. Configurar nginx/Apache para pasar Host header correctamente
4. Implementar cache de conexiones BD por alias
5. Considerar agregar endpoint público de categorías, marcas, etc.
