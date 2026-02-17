# Conección Frontend - Backend API Productos E-commerce

## Resumen de Cambios

Se ha conectado el frontend ([EcommerceView.jsx](frontend/src/components/EcommerceView.jsx)) con la nueva API multi-tenant de productos del backend ([views_productosEcomerce.py](backend/main_dashboard/views_productosEcomerce.py)).

## Cambios en el Frontend

### 1. Importación Actualizada
**Archivo**: [frontend/src/components/EcommerceView.jsx:2](frontend/src/components/EcommerceView.jsx#L2)

**Antes**:
```javascript
import { fetchProducts } from '../services/api';
```

**Ahora**:
```javascript
import { fetchProductosEcommerce } from '../services/api';
```

### 2. Función de Transformación Agregada
**Archivo**: [frontend/src/components/EcommerceView.jsx:230-252](frontend/src/components/EcommerceView.jsx#L230-L252)

Se agregó la función `transformarProducto` que convierte el formato de respuesta de la API (campos anidados) al formato que espera el componente (campos planos):

```javascript
const transformarProducto = (productoAPI) => {
  return {
    ...productoAPI,
    // Transformar campos anidados a planos
    precio_venta: productoAPI.precio,
    categoria_nombre: productoAPI.categoria?.nombre || null,
    marca_nombre: productoAPI.marca?.nombre || null,
    iva_porcentaje: productoAPI.iva?.porcentaje || null,
    descuento_porcentaje: productoAPI.descuento?.porcentaje || null,
    tipo_medida_nombre: productoAPI.tipo_medida?.nombre || null,
    imagen: productoAPI.imagen_producto || null,
  };
};
```

**Mapeo de Campos**:

| Campo API (Backend) | Campo Frontend (Componente) | Formato |
|-------------------|----------------------------|---------|
| `precio` | `precio_venta` | String decimal |
| `categoria.nombre` | `categoria_nombre` | String o null |
| `marca.nombre` | `marca_nombre` | String o null |
| `iva.porcentaje` | `iva_porcentaje` | String decimal o null |
| `descuento.porcentaje` | `descuento_porcentaje` | String decimal o null |
| `tipo_medida.nombre` | `tipo_medida_nombre` | String o null |
| `imagen_producto` | `imagen` | String o null |

### 3. useEffect de Carga de Productos Actualizado
**Archivo**: [frontend/src/components/EcommerceView.jsx:257-277](frontend/src/components/EcommerceView.jsx#L257-L277)

**Cambios**:

**Antes**:
```javascript
const { datos } = await fetchProducts({
  usuario: null,
  tokenUsuario: null,
  subdominio: subdominio,
  publico: true
});

if (datos && Array.isArray(datos) && datos.length > 0) {
  productos = datos;
}
```

**Ahora**:
```javascript
const response = await fetchProductosEcommerce({
  subdominio: subdominio
});

if (response.ok && response.data && Array.isArray(response.data) && response.data.length > 0) {
  // Transformar productos al formato que espera el componente
  productos = response.data.map(transformarProducto);
}
```

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend: EcommerceView.jsx                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ 1. Extrae subdominio del hostname
                           │    (ej: "mi-tienda" de "mi-tienda.dagi.co")
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend: fetchProductosEcommerce(api.js)                │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ 2. POST /api/productos/list/
                           │    Body: { subdominio: "mi-tienda" }
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend: Nova URL Routing                                │
│  /api/ → main_dashboard/urls.py                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend: ProductoView(SubdomainMixin, APIView)            │
│  - SubdomainMixin extrae subdominio                        │
│  - Busca en tabla Dominios                                  │
│  - Obtiene Tienda con credenciales BD                       │
│  - Conecta a BD específica de la tienda                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ 3. Query BD: SELECT * FROM productos
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend: Response JSON                                     │
│  { ok: true, data: [{ id, sku, nombre, precio, ... }] │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ 4. Transforma datos
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend: transformarProducto()                           │
│  Convierte campos anidados a planos                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend: Estado de React                                │
│  products, setProducts                                       │
└─────────────────────────────────────────────────────────────┘
```

## Archivos Modificados

### Frontend
- **[frontend/src/components/EcommerceView.jsx](frontend/src/components/EcommerceView.jsx)**
  - Línea 2: Importación cambiada de `fetchProducts` a `fetchProductosEcommerce`
  - Líneas 230-252: Función `transformarProducto` agregada
  - Líneas 257-277: useEffect actualizado para usar nueva API

### Backend
- **[backend/main_dashboard/views_productosEcomerce.py](backend/main_dashboard/views_productosEcomerce.py)** (ya creado)
  - Clase `SubdomainMixin` para multi-tenancy por subdominio
  - Clase `ProductoView` que retorna productos con ficha técnica

- **[backend/main_dashboard/urls.py:61](backend/main_dashboard/urls.py#L61)**
  - Ruta configurada: `path('productos/list/', ProductoView.as_view())`

- **[backend/nova/urls.py:30](backend/nova/urls.py#L30)**
  - Include configurado: `path('api/', include('main_dashboard.urls'))`

## URLs Configuradas

**Frontend → Backend**:

```
POST https://dagi.co/api/productos/list/
```

**Ruta completa**:
- Frontend BASE_URL: `https://dagi.co/`
- Endpoint en api.js: `api/productos/list/`
- Ruta en Django: `/api/productos/list/`
- View: `ProductoView` en `views_productosEcomerce.py`

## Formato de Respuesta de la API

### Backend Retorna (Formato Anidado)
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
      "descripcion": "Scooter eléctrico de alta autonomía...",
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

### Frontend Transforma a (Formato Plano)
```javascript
{
  id: 1,
  sku: "SKU-001",
  nombre: "Scooter Eléctrico X500",
  descripcion: "Scooter eléctrico de alta autonomía...",
  precio_venta: "1250.00",        // ← Transformado de precio
  stock: 25,
  estado: "Disponible",
  categoria_nombre: "Movilidad Eléctrica",  // ← Transformado de categoria.nombre
  marca_nombre: "EcoMotion",              // ← Transformado de marca.nombre
  tipo_medida_nombre: "Unidad",         // ← Transformado de tipo_medida.nombre
  iva_porcentaje: "19.00",             // ← Transformado de iva.porcentaje
  descuento_porcentaje: "10.00",        // ← Transformado de descuento.porcentaje
  codigo_barras: "7801234567890",
  imei: null,
  imagen: "/media/productos/scooter-x500.jpg",  // ← Transformado de imagen_producto
  atributo: "color",
  valor_atributo: "negro",
  creado_en: "2025-01-15T10:30:00Z"
}
```

## Requisitos para Funcionar

### 1. Base de Datos Default

Necesitas tener registros en las tablas de la BD `default`:

**Tabla: dominios**
```sql
INSERT INTO dominios (tienda_id, dominio, es_principal, creado_en)
VALUES (1, 'mi-tienda', true, NOW());
```

**Tabla: tiendas**
```sql
-- Debe existir previamente con credenciales BD
SELECT * FROM tiendas WHERE id = 1;
-- Resultado: db_nombre, db_usuario, db_password
```

### 2. Base de Datos de la Tienda

La base de datos específica de la tienda debe existir y tener la tabla `productos`:

```sql
-- Conectarse a la BD de la tienda
\c mi_tienda_db

-- Verificar que exista la tabla
SELECT COUNT(*) FROM productos;
```

### 3. Servidor Web Configurado

**Nginx** - Debe pasar el header `Host` correctamente:
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
}
```

## Testing

### Opción 1: Subdominio Real
```bash
# 1. Agregar entrada a /etc/hosts (solo desarrollo)
echo "127.0.0.1 mi-tienda.dagi.co" | sudo tee -a /etc/hosts

# 2. Abrir en navegador
https://mi-tienda.dagi.co/

# 3. Verificar en consola del navegador
# Debería mostrar: "✅ Productos cargados del backend (API E-commerce): X"
```

### Opción 2: Localhost con Querystring
```javascript
// En consola del navegador
localStorage.setItem('subdominio', 'mi-tienda');
location.reload();
```

### Opción 3: Curl Directo
```bash
curl -X POST https://dagi.co/api/productos/list/ \
  -H "Content-Type: application/json" \
  -d '{"subdominio": "mi-tienda"}'
```

## Troubleshooting

### Error: "Subdominio no encontrado"
**Causa**: No existe registro en tabla `dominios`
**Solución**:
```python
from nova.models import Dominios, Tiendas

# Verificar que exista
dominios = Dominios.objects.all()
print(f"Subdominios existentes: {d.dominio for d in dominios}")

# Crear si falta
tienda = Tiendas.objects.first()
Dominios.objects.create(tienda=tienda, dominio='mi-tienda', es_principal=True)
```

### Error: "Error al conectar a la base de datos"
**Causa**: La BD de la tienda no existe o las credenciales son incorrectas
**Solución**:
```bash
# Verificar que la BD exista
psql -U postgres -l
\l postgres

# Verificar BDs
\l

# Verificar que el usuario exista y tiene permisos
SELECT * FROM pg_user WHERE usename = 'db_usuario_tienda';

# Conectarse manualmente
psql -h localhost -U db_usuario_tienda -d db_nombre_tienda
```

### Error: "No hay productos en backend, usando productos de ejemplo"
**Causa**: La BD de la tienda existe pero la tabla `productos` está vacía
**Solución**:
```python
# Conectarse a la BD de la tienda y agregar productos
from django.apps import apps
from main_dashboard.models import Producto

# Usar el alias de la tienda (supongamos id=1)
alias = '1'

# Crear productos de prueba
Producto.objects.using(alias).create(
    sku='TEST-001',
    nombre='Producto de Prueba',
    descripcion='Producto para testing',
    precio=99.99,
    stock=10
)
```

### Console muestra "⚠️ Error al cargar del backend"
**Causa**: Error de red o el servidor no está respondiendo
**Solución**:
1. Verificar que el servidor Django esté corriendo: `python manage.py runserver`
2. Verificar que el puerto sea correcto (por defecto 8000)
3. Verificar logs del servidor para ver el error exacto
4. Verificar CORS si el frontend y backend están en diferentes dominios

## Ventajas de Esta Implementación

✅ **Multi-tenant automático**: Cada subdominio se conecta a su propia BD
✅ **Sin autenticación requerida**: API pública para e-commerce
✅ **Ficha técnica completa**: Incluye categorías, marcas, IVA, descuentos
✅ **Transformación automática**: Frontend adapta el formato sin cambios manuales
✅ **Escalabilidad**: Fácil agregar nuevas tiendas con sus propias BDs

## Próximos Pasos Recomendados

1. **Crear productos de prueba**: Agregar productos reales en las BDs de las tiendas
2. **Implementar cache**: Agregar Redis para cachear las consultas de productos
3. **Migrar imágenes**: Asegurar que `imagen_producto` tenga URLs válidas y accesibles
4. **Implementar paginación**: Si hay muchos productos, agregar paginación en la API
5. **Agregar filtros**: Implementar filtros por categorías, marcas, rango de precios
6. **Optimizar consultas**: Usar `select_related` correctamente (ya implementado)
7. **Error handling**: Mejorar los mensajes de error en el UI para el usuario final

## Archivos de Documentación Relacionados

- [backend/main_dashboard/API_PRODUCTOS_MULTITENANT.md](backend/main_dashboard/API_PRODUCTOS_MULTITENANT.md) - Documentación completa del sistema multi-tenant
- [backend/main_dashboard/COMO_USAR_API_PRODUCTOS.md](backend/main_dashboard/COMO_USAR_API_PRODUCTOS.md) - Guía de uso de la API
- [frontend/src/services/api.js:241-251](frontend/src/services/api.js#L241-L251) - Función `fetchProductosEcommerce`
