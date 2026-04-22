# Nova - Sistema de Gestión Comercial Multi-Tenant

**Nova** es un sistema ERP/comercial completo diseñado para la gestión integral de tiendas y puntos de venta, con arquitectura **multi-tenant** que permite a cada tienda operar con su base de datos independiente de forma totalmente aislada.

## Características Principales

### Gestión de Inventario y Bodegas
- **Múltiples bodegas y sucursales** - Gestión completa de ubicaciones de inventario
- **Traslados entre bodegas** - Transferencia de productos con control de stock
- **Control de stock en tiempo real** - Actualización inmediata de existencias
- **Kardex de movimientos** - Historial completo de movimientos de productos
- **Interfaz responsive** - Optimizado para móviles, tablets y desktop

### Facturación POS (Punto de Venta)
- **Facturación electrónica completa** - Sistema POS robusto
- **Múltiples formas de pago** - Efectivo, tarjeta crédito/débito, transferencias
- **Gestión de clientes** - Personas naturales y jurídicas
- **Control de IVA** - Cálculo automático de impuestos
- **Impresión de tickets** - Formatos térmicos (58mm/80mm)
- **Anulación de facturas** - Con reversión automática de stock

### Gestión Multi-Tenant
- **Aislamiento completo** - Cada tienda con su propia base de datos
- **Subdominios por tienda** - Identificación automática del tenant
- **Usuarios y permisos** - Control de acceso por tienda

### Autenticación y Seguridad
- **JWT tokens** - Con renovación automática
- **Historial de login** - Auditoría de accesos
- **Middleware de seguridad** - Protección XSS
- **Validaciones robustas** - Prevención de SQL injection

### Dashboard y Analíticas
- **Métricas de ventas** - Datos en tiempo real
- **Gráficos interactivos** - Visualización de datos
- **Exportación de datos** - Excel/PDF

## Arquitectura Técnica

### Backend
- **Framework:** Django 5.1.5 + Django REST Framework
- **Base de Datos:** PostgreSQL 15 (BD madre + múltiples BD por tienda)
- **Caché:** Redis para optimización
- **Servidor:** Gunicorn (3 instancias para balanceo de carga)
- **Reverse Proxy:** Nginx optimizado para alta concurrencia

### Frontend
- **Framework:** React 19 + Vite
- **Estilos:** TailwindCSS + Bootstrap 5
- **Navegación:** React Router
- **Gráficos:** Chart.js, Recharts
- **Diseño:** Mobile-first responsive (320px - 4K)

### Infraestructura
- **Orquestación:** Docker Compose
- **SSL:** Certificados Let's Encrypt
- **Alta disponibilidad:** Múltiples instancias backend
- **Capacidad:** Optimizado para 65,000 peticiones simultáneas

## Módulos del Sistema

| Módulo | Descripción |
|--------|-------------|
| **Login/Auth** | Registro, login, recuperación de contraseña, historial |
| **Dashboard** | Vista principal con métricas y KPIs |
| **Facturación** | Sistema POS completo |
| **Bodegas** | Gestión de inventario y traslados |
| **Proveedores** | Gestión de proveedores |
| **Abonos** | Pagos a cuenta |
| **Caja** | Movimientos de caja |
| **Cupones** | Sistema de descuentos |
| **Contacto** | Gestión de contactos |
| **E-commerce** | Productos para tienda online |

## Tecnologías Utilizadas

### Backend
```
- Django 5.1.5
- Django REST Framework
- PostgreSQL 15
- Redis 7
- Gunicorn
- Nginx
```

### Frontend
```
- React 19
- Vite 6
- TailwindCSS 3
- Bootstrap 5
- React Router 7
- Chart.js 4
```

### DevOps
```
- Docker
- Docker Compose
- Let's Encrypt (SSL)
```

## Instalación

### Requisitos Previos
- Docker y Docker Compose
- PostgreSQL 15
- Nginx
- Dominio configurado para SSL

### Configuración

1. **Clonar el repositorio**
   ```bash
   git clone <repositorio>
   cd nova
   ```

2. **Configurar variables de entorno**
   ```bash
   # Editar backend/.env
   cp backend/.env.example backend/.env
   ```

3. **Levant servicios con Docker**
   ```bash
   docker-compose up -d
   ```

4. **Ejecutar migraciones**
   ```bash
   docker-compose exec backend1 python manage.py migrate
   ```

5. **Crear superusuario**
   ```bash
   docker-compose exec backend1 python manage.py createsuperuser
   ```

6. **Acceder a la aplicación**
   ```
   URL: https://nova.dagi.co
   ```

## 🔧 Variables de Entorno Principales

```bash
# Backend
SECRET_KEY=<django-secret-key>
DEBUG=False
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://redis:6379/1

# Frontend
VITE_API_URL=https://nova.dagi.co/api
```

## Estructura del Proyecto

```
nova/
├── backend/                 # Django backend
│   ├── nova/               # Configuración Django
│   ├── main_dashboard/     # App principal
│   ├── login/              # Autenticación
│   ├── analytics/          # Analíticas
│   └── media/              # Archivos multimedia
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── services/      # API services
│   │   ├── styles/        # Estilos globales
│   │   └── utils/         # Utilidades
│   └── public/            # Archivos estáticos
├── nginx/                 # Configuración Nginx
├── docker-compose.yml     # Orquestación Docker
└── README.md             # Este archivo
```

## API Endpoints

### Autenticación
- `POST /api/auth/login/` - Iniciar sesión
- `POST /api/auth/logout/` - Cerrar sesión
- `POST /api/auth/register/` - Registro

### Facturación
- `POST /api/facturacion/clientes/` - Crear cliente
- `POST /api/facturacion/facturas/crear/` - Crear factura
- `POST /api/facturacion/facturas/{id}/anular/` - Anular factura

### Bodegas
- `GET /api/bodegas/` - Listar bodegas
- `POST /api/traslados/crear/` - Crear traslado
- `POST /api/traslados/{id}/recibir/` - Recibir traslado

## Características Técnicas Destacadas

### Multi-Tenant Database Architecture
- Cada tienda tiene su propia base de datos PostgreSQL
- Router dinámico de conexiones según subdominio
- Aislamiento completo de datos entre tenants

### Responsive Design
- Breakpoints: 320px → 4K
- Mobile-first approach
- Touch targets optimizados (mínimo 44px)
- Tipografía fluida con CSS clamp()

### Performance
- Cache Redis para optimización
- Balanceo de carga con 3 instancias backend
- Nginx optimizado para alta concurrencia
- Compresión de assets estáticos

### Seguridad
- JWT tokens con expiración
- Renovación automática de tokens
- Middleware de seguridad XSS
- Validaciones a nivel backend
- Transacciones atómicas

## Testing

### Ejecutar tests backend
```bash
docker-compose exec backend1 python manage.py test
```

### Ejecutar tests frontend
```bash
cd frontend
npm test
```

## Métricas de Rendimiento

- **Capacidad simultánea:** 65,000 usuarios
- **Tiempo de respuesta:** < 200ms (promedio)
- **Uptime:** 99.9%
- **Disponibilidad:** Alta disponibilidad con múltiples instancias

## Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/NuevaFeature`)
3. Commit cambios (`git commit -m 'Agregar nueva feature'`)
4. Push a la rama (`git push origin feature/NuevaFeature`)
5. Abrir Pull Request

## Licencia

Este proyecto es software propietario. Todos los derechos reservados.

## Autores

- **Equipo Nova** - Desarrollo inicial

## Soporte

Para soporte técnico, contactar:
- Email: support@nova.dagi.co
- Web: https://nova.dagi.co

---

**Última actualización:** Abril 2026  
**Versión:** 1.0.0
