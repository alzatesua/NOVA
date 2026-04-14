# Cómo Usar la API de Productos E-commerce

## Ruta de la API

```
POST /api/main_dashboard/api/productos/list/
```

## Requisitos Previos

### 1. Tener una Tienda creada en la base de datos default

```python
from nova.models import Tiendas, Dominios, Direccion

# Crear dirección
direccion = Direccion.objects.create(
    calle_numero="Calle 123 #45-67",
    ciudad_estado="Bogotá",
    codigo_postal="110001",
    pais="Colombia"
)

# Crear tienda
tienda = Tiendas.objects.create(
    nombre_tienda="Mi Tienda Deportiva",
    nit="900123456-7",
    nombre_completo="Mi Tienda Deportiva SAS",
    telefono="+57 1 123 4567",
    direccion=direccion,
    usuario="admin@mitienda.com",
    correo_usuario="admin@mitienda.com"
)
```

### 2. Tener un Dominio/Subdominio creado

```python
# Crear dominio
dominio = Dominios.objects.create(
    tienda=tienda,
    dominio="mi-tienda-deportiva",  # Este será el subdominio
    es_principal=True
)
```

## Formas de Usar la API

### Opción 1: Subdominio en el Host HTTP (Recomendado)

**Ejemplo con curl:**
```bash
curl -X POST https://mi-tienda-deportiva.midominio.com/api/main_dashboard/api/productos/list/ \
  -H "Content-Type: application/json"
```

**Ejemplo con JavaScript (Frontend):**
```javascript
const response = await fetch('https://mi-tienda-deportiva.midominio.com/api/main_dashboard/api/productos/list/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({})
});

const data = await response.json();
console.log(data);
```

### Opción 2: Querystring en la URL

**Ejemplo con curl:**
```bash
curl -X POST "https://midominio.com/api/main_dashboard/api/productos/list/?subdominio=mi-tienda-deportiva" \
  -H "Content-Type: application/json"
```

**Ejemplo con JavaScript:**
```javascript
const response = await fetch('https://midominio.com/api/main_dashboard/api/productos/list/?subdominio=mi-tienda-deportiva', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
});
```

### Opción 3: Subdominio en el Body JSON

**Ejemplo con curl:**
```bash
curl -X POST https://midominio.com/api/main_dashboard/api/productos/list/ \
  -H "Content-Type: application/json" \
  -d '{"subdominio": "mi-tienda-deportiva"}'
```

**Ejemplo con JavaScript:**
```javascript
const response = await fetch('https://midominio.com/api/main_dashboard/api/productos/list/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    subdominio: 'mi-tienda-deportiva'
  })
});
```

## Respuesta Exitosa (200 OK)

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
        // ... más productos
    ]
}
```

## Respuestas de Error

### Subdominio no encontrado (401 Unauthorized)

```json
{
    "ok": false,
    "detail": "Subdominio 'mi-tienda-inexistente' no encontrado en tabla Dominios."
}
```

### Error de conexión a BD (401 Unauthorized)

```json
{
    "ok": false,
    "detail": "Error al conectar a la base de datos: connection refused"
}
```

### No se pudo determinar subdominio (401 Unauthorized)

```json
{
    "ok": false,
    "detail": "No se pudo determinar el subdominio desde el request."
}
```

## Integración en React/Frontend

### Ejemplo con fetch:

```javascript
import React, { useState, useEffect } from 'react';

function ProductList() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Opción 1: Subdominio desde el Host
        const response = await fetch('/api/main_dashboard/api/productos/list/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Opción 2: Subdominio por querystring
        // const response = await fetch(`/api/main_dashboard/api/productos/list/?subdominio=${subdominio}`, {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        // });

        // Opción 3: Subdominio en el body
        // const response = await fetch('/api/main_dashboard/api/productos/list/', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({ subdominio: 'mi-tienda-deportiva' })
        // });

        const data = await response.json();

        if (data.ok) {
          setProductos(data.data);
        } else {
          setError(data.detail);
        }
      } catch (err) {
        setError('Error al cargar productos: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div>Cargando productos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="product-grid">
      {productos.map(producto => (
        <div key={producto.id} className="product-card">
          <h3>{producto.nombre}</h3>
          <p>Precio: ${producto.precio}</p>
          <p>Stock: {producto.stock}</p>
          <p>Estado: {producto.estado}</p>
          {producto.imagen_producto && (
            <img src={producto.imagen_producto} alt={producto.nombre} />
          )}
        </div>
      ))}
    </div>
  );
}

export default ProductList;
```

### Ejemplo con Axios:

```javascript
import axios from 'axios';
import { useState, useEffect } from 'react';

function ProductList() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Configurar Axios
        const response = await axios.post(
          '/api/main_dashboard/api/productos/list/',
          {}, // body vacío si usas subdominio del Host
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        if (response.data.ok) {
          setProductos(response.data.data);
        }
      } catch (error) {
        console.error('Error:', error.response?.data?.detail || error.message);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div>
      <h2>Productos ({productos.length})</h2>
      {productos.map(p => (
        <div key={p.id}>
          <h4>{p.nombre}</h4>
          <p>Precio: ${p.precio}</p>
          <p>Stock: {p.stock} - {p.estado}</p>
        </div>
      ))}
    </div>
  );
}
```

## Configuración de Nginx/Apache

Para que el subdominio funcione correctamente, tu servidor web debe pasar el header `Host` original:

### Nginx:
```nginx
server {
    listen 80;
    server_name .midominio.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Apache:
```apache
<VirtualHost *:80>
    ServerName midominio.com
    ServerAlias *.midominio.com

    ProxyPreserveHost On
    ProxyPass /api/ http://127.0.0.1:8000/api/
    ProxyPassReverse /api/ http://127.0.0.1:8000/api/
</VirtualHost>
```

## Testing Local

Para probar localmente con subdominios, agrega a tu `/etc/hosts`:

```bash
# Para Linux/Mac
echo "127.0.0.1 mi-tienda-deportiva.localhost" | sudo tee -a /etc/hosts

# Para Windows (ejecutar como administrador en CMD)
echo 127.0.0.1 mi-tienda-deportiva.localhost >> C:\Windows\System32\drivers\etc\hosts
```

Luego puedes hacer:
```bash
curl -X POST http://mi-tienda-deportiva.localhost:8000/api/main_dashboard/api/productos/list/
```

## Logs y Debug

Para ver logs de conexión:

```bash
# En desarrollo
tail -f /path/to/django/debug.log

# O ver logs específicos
grep "SubdomainMixin" /path/to/django/debug.log
```

## Notas Importantes

1. **No requiere autenticación**: Esta API es pública para el e-commerce
2. **Solo POST**: La ruta solo acepta método POST por seguridad
3. **Multi-tenant automático**: Cada tienda tiene su propia BD
4. **Cache de conexiones**: Django mantiene la conexión por alias (id tienda)
5. **Headers necesarios**: `Content-Type: application/json` si envías body

## Troubleshooting

### Error: "Subdominio no encontrado"
- Verifica que el dominio exista en tabla `Dominios`
- Verifica que esté asociado a una `Tienda`
- Verifica que la `Tienda` tenga credenciales BD válidas

### Error: "Error al conectar a la base de datos"
- Verifica que la BD de la tienda exista
- Verifica que las credenciales (`db_usuario`, `db_password`, `db_nombre`) sean correctas
- Verifica que PostgreSQL esté corriendo y acepte conexiones

### Error: "No se pudo determinar el subdominio"
- Verifica que el header `Host` esté llegando al servidor
- Verifica la configuración de Nginx/Apache
- Usa querystring como alternativa: `?subdominio=valor`

## Archivos Relacionados

- **Vista**: [main_dashboard/views_productosEcomerce.py](backend/main_dashboard/views_productosEcomerce.py)
- **URLs**: [main_dashboard/urls.py](backend/main_dashboard/urls.py) (línea 60)
- **Mixin**: `SubdomainMixin` en views_productosEcomerce.py (líneas 16-82)
- **Documentación**: [API_PRODUCTOS_MULTITENANT.md](backend/main_dashboard/API_PRODUCTOS_MULTITENANT.md)
