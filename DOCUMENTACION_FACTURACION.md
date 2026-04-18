# 📋 Documentación Completa - APIs de Facturación POS

Este documento describe la implementación completa del módulo de facturación POS (Punto de Venta) en el sistema Nova.

---

## 📁 Archivos Creados/Modificados

### Backend

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `backend/main_dashboard/views.py` | ✏️ Modificado | Se agregaron 8 nuevas vistas para facturación |
| `backend/main_dashboard/urls_facturacion.py` | ✨ Creado | Rutas específicas de facturación |
| `backend/main_dashboard/urls.py` | ✏️ Modificado | Importaciones actualizadas |
| `backend/main_dashboard/models.py` | 📦 Existente | Modelos de facturación ya existían |
| `backend/main_dashboard/serializers.py` | 📦 Existente | Serializers ya existían |

### Frontend

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `frontend/src/services/api.js` | ✏️ Modificado | Ruta de `crearFactura` actualizada |
| `frontend/src/components/FacturacionView.jsx` | 📦 Existente | Vista principal de facturación |
| `frontend/src/components/facturacion/FacturaForm.jsx` | ✏️ Modificado | Corregido uso de `response.formas_pago` |
| `frontend/src/components/facturacion/ClienteSelector.jsx` | ✏️ Modificado | Corregido uso de `response.clientes` |
| `frontend/src/components/facturacion/ProductoSelectorPOS.jsx` | ✏️ Modificado | Corregido uso de `response.productos` |
| `frontend/src/components/facturacion/FacturaTicket.jsx` | 📦 Existente | Componente de ticket de impresión |

---

## 🔌 Endpoints Implementados

### 1. Clientes

#### Buscar Clientes
```
POST /api/facturacion/clientes/buscar/
```

**Body:**
```json
{
  "usuario": "juanprueba",
  "token": "jwt_token",
  "subdominio": "tienda-abc123",
  "query": "juan o 123456789"
}
```

**Respuesta:**
```json
{
  "ok": true,
  "cantidad": 3,
  "clientes": [
    {
      "id": 1,
      "tipo_persona": "NAT",
      "primer_nombre": "Juan",
      "apellidos": "Pérez",
      "numero_documento": "123456789",
      "nombre_completo": "Juan Pérez"
    }
  ]
}
```

#### Crear Cliente
```
POST /api/facturacion/clientes/
```

**Body (Persona Natural):**
```json
{
  "usuario": "juanprueba",
  "token": "jwt_token",
  "subdominio": "tienda-abc123",
  "tipo_persona": "NAT",
  "tipo_documento": "CC",
  "numero_documento": "123456789",
  "primer_nombre": "Juan",
  "segundo_nombre": "Carlos",
  "apellidos": "Pérez",
  "correo": "juan@example.com",
  "telefono": "3001234567",
  "direccion": "Calle 123 #45-67",
  "ciudad": "Bogotá"
}
```

**Body (Persona Jurídica):**
```json
{
  "usuario": "juanprueba",
  "token": "jwt_token",
  "subdominio": "tienda-abc123",
  "tipo_persona": "JUR",
  "tipo_documento": "NIT",
  "numero_documento": "900123456-7",
  "razon_social": "Empresa SAS",
  "correo": "contacto@empresa.com",
  "telefono": "6011234567",
  "direccion": "Carrera 7 #14-21",
  "ciudad": "Bogotá"
}
```

**Respuesta:**
```json
{
  "ok": true,
  "mensaje": "Cliente creado exitosamente",
  "cliente": {
    "id": 2,
    "tipo_persona": "NAT",
    "primer_nombre": "Juan",
    "apellidos": "Pérez",
    "numero_documento": "123456789",
    "nombre_completo": "Juan Pérez",
    "estatus": true,
    "creado_en": "2026-02-04T21:45:00Z"
  }
}
```

---

### 2. Formas de Pago

#### Obtener Formas de Pago Activas
```
POST /api/facturacion/formas-pago/
```

**Body:**
```json
{
  "usuario": "juanprueba",
  "token": "jwt_token",
  "subdominio": "tienda-abc123"
}
```

**Respuesta:**
```json
{
  "ok": true,
  "formas_pago": [
    {"id": 1, "codigo": "EFE", "nombre": "Efectivo", "activo": true, "permite_cambio": true},
    {"id": 2, "codigo": "TDC", "nombre": "Tarjeta de Crédito", "activo": true, "requiere_referencia": true},
    {"id": 3, "codigo": "TDE", "nombre": "Tarjeta de Débito", "activo": true, "requiere_referencia": true},
    {"id": 4, "codigo": "TRF", "nombre": "Transferencia", "activo": true, "requiere_referencia": true}
  ]
}
```

---

### 3. Productos para POS

#### Buscar Productos por Bodega
```
POST /api/facturacion/facturas/productos-pos/
```

**Body:**
```json
{
  "usuario": "juanprueba",
  "token": "jwt_token",
  "subdominio": "tienda-abc123",
  "bodega_id": 5,
  "query": "iPhone o SKU123",
  "incluir_sin_stock": false
}
```

**Respuesta:**
```json
{
  "ok": true,
  "cantidad": 2,
  "productos": [
    {
      "id": 10,
      "nombre": "iPhone 15 Pro",
      "sku": "SKU123",
      "precio": "999.99",
      "stock": 50,
      "stock_disponible": 48,
      "iva_porcentaje": 16.0,
      "disponible": 48,
      "existencia_id": 15
    }
  ]
}
```

---

### 4. Facturas

#### Crear Factura
```
POST /api/facturacion/facturas/crear/
```

**Body:**
```json
{
  "usuario": "juanprueba",
  "token": "jwt_token",
  "subdominio": "tienda-abc123",
  "cliente": 2,
  "vendedor": 5,
  "sucursal": 3,
  "bodega": 5,
  "subtotal": 100.00,
  "total_descuento": 0.00,
  "total_iva": 16.00,
  "total": 116.00,
  "total_pagado": 120.00,
  "cambio": 4.00,
  "observaciones": "Venta mostrador",
  "detalles": [
    {
      "producto": 10,
      "producto_nombre": "iPhone 15 Pro",
      "producto_sku": "SKU123",
      "cantidad": 1,
      "precio_unitario": 100.00,
      "descuento_porcentaje": 0,
      "descuento_valor": 0,
      "iva_porcentaje": 16.0,
      "iva_valor": 16.00,
      "subtotal": 100.00,
      "total": 116.00
    }
  ],
  "pagos": [
    {
      "forma_pago": 1,
      "monto": 120.00,
      "referencia": null,
      "autorizacion": null
    }
  ]
}
```

**Respuesta:**
```json
{
  "ok": true,
  "mensaje": "Factura creada exitosamente",
  "factura": {
    "id": 100,
    "numero_factura": "FACT-000001",
    "estado": "PAG",
    "fecha_venta": "2026-02-04T22:00:00Z",
    "subtotal": 100.00,
    "total_iva": 16.00,
    "total": 116.00,
    "cliente_nombre": "Juan Pérez",
    "detalles": [...],
    "pagos": [...]
  }
}
```

#### Anular Factura
```
POST /api/facturacion/facturas/{id}/anular/
```

**Body:**
```json
{
  "usuario": "juanprueba",
  "token": "jwt_token",
  "subdominio": "tienda-abc123",
  "motivo": "Producto defectuoso"
}
```

**Respuesta:**
```json
{
  "ok": true,
  "mensaje": "Factura anulada exitosamente",
  "factura": {
    "id": 100,
    "estado": "ANU",
    "fecha_anulacion": "2026-02-04T22:30:00Z",
    "motivo_anulacion": "Producto defectuoso"
  }
}
```

#### Listar Facturas
```
POST /api/facturacion/facturas/
```

**Body:**
```json
{
  "usuario": "juanprueba",
  "token": "jwt_token",
  "subdominio": "tienda-abc123",
  "fecha_inicio": "2026-01-01",
  "fecha_fin": "2026-12-31",
  "estado": "PAG"
}
```

**Respuesta:**
```json
{
  "ok": true,
  "cantidad": 50,
  "facturas": [
    {
      "id": 100,
      "numero_factura": "FACT-000001",
      "estado": "PAG",
      "fecha_venta": "2026-02-04T22:00:00Z",
      "total": 116.00
    }
  ]
}
```

---

### 5. Estadísticas

#### Ventas de Hoy
```
POST /api/facturacion/facturas/ventas-hoy/
```

**Body:**
```json
{
  "usuario": "juanprueba",
  "token": "jwt_token",
  "subdominio": "tienda-abc123"
}
```

**Respuesta:**
```json
{
  "ok": true,
  "fecha": "2026-02-04",
  "total_facturado": 15800.50,
  "cantidad": 25,
  "promedio": 632.02
}
```

---

## 🗄️ Modelos de Base de Datos

### Cliente (`facturacion_cliente`)
```python
tipo_persona: NAT | JUR
primer_nombre: string (opcional)
segundo_nombre: string (opcional)
apellidos: string (opcional)
razon_social: string (opcional)
tipo_documento: CC | NIT | CE | TI | PP
numero_documento: string (único)
correo: email
telefono: string
direccion: string
ciudad: string
limite_credito: decimal
dias_credito: integer
estatus: boolean
```

### FormaPago (`facturacion_forma_pago`)
```python
codigo: string (único) - EFE, TDC, TDE, TRF, CDP
nombre: string
activo: boolean
requiere_referencia: boolean
permite_cambio: boolean
```

### Factura (`facturacion_factura`)
```python
numero_factura: string (único)
estado: BOR | PAG | ANU
cliente: FK → Cliente (opcional)
vendedor: FK → User
sucursal: FK → Sucursales
bodega: FK → Bodega
fecha_venta: datetime
fecha_anulacion: datetime (opcional)
subtotal: decimal
total_descuento: decimal
total_iva: decimal
total: decimal
total_pagado: decimal
cambio: decimal
observaciones: text
motivo_anulacion: text (opcional)
```

### FacturaDetalle (`facturacion_factura_detalle`)
```python
factura: FK → Factura
producto: FK → Producto
producto_nombre: string
producto_sku: string
producto_imei: string (opcional)
cantidad: integer
precio_unitario: decimal
descuento_porcentaje: decimal
descuento_valor: decimal
iva_porcentaje: decimal
iva_valor: decimal
subtotal: decimal
total: decimal
cantidad_devuelta: integer
```

### Pago (`facturacion_pago`)
```python
factura: FK → Factura
forma_pago: FK → FormaPago
monto: decimal
referencia: string (opcional)
autorizacion: string (opcional)
```

---

## 🔐 Autenticación y Autorización

Todas las APIs requieren:
1. **Usuario** válido en la base de datos del tenant
2. **Token JWT** válido y no expirado
3. **Subdominio** para identificar el tenant

### Flujo de Autenticación
```python
# 1. Validar usuario existe en BD del tenant
LoginUsuario.objects.using(alias).get(usuario=usuario)

# 2. Validar token JWT
jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])

# 3. Si el token expiró, generarlo automáticamente
if ExpiredSignatureError:
    nuevo_token = generar_token_jwt(usuario)
    user.token = nuevo_token
    user.save(using=alias)
```

---

## 💾 Gestión de Base de Datos Multi-Tenant

### Conexión Dinámica
```python
# Resolver tenant desde subdominio
dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
tienda = dominio_obj.tienda
alias = str(tienda.id)

# Conectar a BD del tenant
conectar_db_tienda(alias, tienda)

# Usar el alias en todas las consultas
Cliente.objects.using(alias).create(**datos)
```

---

## 🔄 Transacciones y Stock

### Creación de Factura (Transacción Atómica)
```python
with transaction.atomic(using=alias):
    # 1. Generar número de factura
    # 2. Crear factura
    # 3. Para cada detalle:
    #    - Validar stock disponible
    #    - Reservar stock (+reservado)
    #    - Crear detalle
    # 4. Crear pagos
    # 5. Confirmar reserva:
    #    - Restar de cantidad
    #    - Restar de reservado
    #    - Actualizar cache de stock del producto
```

### Anulación de Factura (Reversión de Stock)
```python
with transaction.atomic(using=alias):
    # 1. Validar estado no es ANU
    # 2. Para cada detalle:
    #    - Sumar cantidad a existencia.cantidad
    #    - Actualizar cache de stock
    # 3. Actualizar estado a ANU
    # 4. Guardar motivo y fecha de anulación
```

---

## 🎨 Componentes Frontend

### ClienteSelector
**Ubicación:** `frontend/src/components/facturacion/ClienteSelector.jsx`

**Funcionalidades:**
- Búsqueda de clientes por documento, nombre, teléfono o correo
- Creación rápida de nuevos clientes (modal)
- Soporte para personas naturales y jurídicas
- Validación de campos obligatorios

**Uso:**
```jsx
<ClienteSelector 
  cliente={cliente} 
  onClienteChange={setCliente} 
/>
```

### ProductoSelectorPOS
**Ubicación:** `frontend/src/components/facturacion/ProductoSelectorPOS.jsx`

**Funcionalidades:**
- Búsqueda de productos por SKU, nombre o código de barras
- Filtrado por bodega
- Validación de stock disponible
- Autocomplete con debounce (300ms)

**Uso:**
```jsx
<ProductoSelectorPOS
  bodegaId={bodegaSeleccionada}
  onProductoSelect={agregarProducto}
  productosAgregados={productos}
/>
```

### FacturaForm
**Ubicación:** `frontend/src/components/facturacion/FacturaForm.jsx`

**Funcionalidades:**
- Selección de cliente
- Agregado de productos
- Múltiples formas de pago
- Cálculo automático de: subtotal, IVA, total, cambio
- Validación de stock antes de crear

**Uso:**
```jsx
<FacturaForm
  bodegaId={bodegaSeleccionada}
  sucursalId={sucursalSeleccionada}
  onFacturaCreada={handleFacturaCreada}
/>
```

### FacturaTicket
**Ubicación:** `frontend/src/components/facturacion/FacturaTicket.jsx`

**Funcionalidades:**
- Muestra el ticket de impresión
- Formatos: 58mm o 80mm
- Información de empresa, cliente, productos, totales
- Soporte para impresión (Ctrl+P)

**Uso:**
```jsx
<FacturaTicket 
  factura={ultimaFactura} 
  formato="80mm" 
/>
```

---

## 📡 Servicios API (Frontend)

### ClienteService
```javascript
import { buscarCliente, crearCliente } from '@/services/api';

// Buscar cliente
const resultados = await buscarCliente({
  query: "juan",
  token: tokenUsuario,
  usuario: "juanprueba",
  subdominio: "mi-tienda"
});
// → { clientes: [...] }

// Crear cliente
const respuesta = await crearCliente({
  token: tokenUsuario,
  usuario: "juanprueba",
  subdominio: "mi-tienda",
  datos: {
    tipo_persona: "NAT",
    primer_nombre: "Juan",
    // ...
  }
});
// → { cliente: {...} }
```

### ProductoService
```javascript
import { buscarProductosPOS } from '@/services/api';

const resultados = await buscarProductosPOS({
  token: tokenUsuario,
  usuario: "juanprueba",
  subdominio: "mi-tienda",
  bodega_id: 5,
  query: "iPhone",
  incluir_sin_stock: false
});
// → { productos: [...] }
```

### FacturaService
```javascript
import { crearFactura, anularFactura } from '@/services/api';

// Crear factura
const respuesta = await crearFactura({
  token: tokenUsuario,
  usuario: "juanprueba",
  subdominio: "mi-tienda",
  datos_factura: {
    cliente: 2,
    bodega: 5,
    // ...
  }
});
// → { factura: {...} }

// Anular factura
await anularFactura({
  token: tokenUsuario,
  usuario: "juanprueba",
  subdominio: "mi-tienda",
  factura_id: 100,
  motivo: "Error en producto"
});
```

---

## ✅ Validaciones Implementadas

### Cliente
- [x] `tipo_persona` debe ser "NAT" o "JUR"
- [x] `numero_documento` único por tenant
- [x] `correo` debe ser email válido
- [x] Campos obligatorios según tipo de persona
  - NAT: `primer_nombre`, `apellidos`
  - JUR: `razon_social`

### Producto
- [x] Stock disponible antes de agregar
- [x] Cantidad máxima = stock disponible
- [x] Búsqueda por SKU, nombre o código de barras

### Factura
- [x] Al menos un producto obligatorio
- [x] Total pagado >= total de factura
- [x] Stock suficientes en bodega
- [x] Transacción atómica (todo o nada)

### Pago
- [x] Al menos una forma de pago
- [x] Monto total pagado >= total factura
- [x] Referencia obligatoria si forma_pago la requiere

---

## 🐛 Solución de Problemas Comunes

### 404 en endpoints de facturación
**Problema:** `Not Found: /api/facturacion/clientes/`

**Solución aplicada:**
1. Crear archivo `backend/main_dashboard/urls_facturacion.py`
2. Eliminar rutas duplicadas de `main_dashboard/urls.py`
3. Incluir en `nova/urls.py`: `path('api/facturacion/', include('main_dashboard.urls_facturacion'))`

### Respuestas incorrectas
**Problema:** Los componentes esperaban `response.datos` pero la API retornaba `response.clientes`

**Solución aplicada:**
- Actualizar `ClienteSelector.jsx` → `response.clientes`
- Actualizar `ProductoSelectorPOS.jsx` → `response.productos`
- Actualizar `FacturaForm.jsx` → `response.formas_pago`

### Error tipo_persona
**Problema:** Enviar `"2"` en lugar de `"NAT"` o `"JUR"`

**Solución:**
El formulario frontend ya envía los valores correctos ("NAT", "JUR")

---

## 🧪 Pruebas Manuales

### Probar Creación de Cliente
```bash
curl -X POST https://dagi.co/api/facturacion/clientes/ \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "juanprueba",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "subdominio": "dagi-4a4487",
    "tipo_persona": "NAT",
    "primer_nombre": "Juan",
    "apellidos": "Pérez",
    "tipo_documento": "CC",
    "numero_documento": "123456789",
    "correo": "juan@example.com",
    "telefono": "3001234567",
    "direccion": "Calle 123"
  }'
```

### Probar Creación de Factura
```bash
curl -X POST https://dagi.co/api/facturacion/facturas/crear/ \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "juanprueba",
    "token": "...",
    "subdominio": "dagi-4a4487",
    "sucursal": 1,
    "bodega": 1,
    "subtotal": 100,
    "total_iva": 16,
    "total": 116,
    "total_pagado": 120,
    "cambio": 4,
    "detalles": [
      {
        "producto": 1,
        "producto_nombre": "Producto Test",
        "producto_sku": "TEST001",
        "cantidad": 1,
        "precio_unitario": 100,
        "descuento_porcentaje": 0,
        "descuento_valor": 0,
        "iva_porcentaje": 16,
        "iva_valor": 16,
        "subtotal": 100,
        "total": 116
      }
    ],
    "pagos": [
      {
        "forma_pago": 1,
        "monto": 120
      }
    ]
  }'
```

---

## 📊 Flujos de Trabajo

### Flujo de Venta POS

1. **Seleccionar Bodega**
   - Admin: Selecciona sucursal → bodega
   - No-admin: Bodega asignada automáticamente

2. **Buscar Cliente (Opcional)**
   - Escribir documento o nombre
   - Seleccionar de resultados
   - O crear nuevo cliente (+)

3. **Agregar Productos**
   - Buscar por SKU/nombre/código
   - Cantidad se ajusta con stock disponible
   - Se pueden agregar múltiples productos

4. **Definir Pagos**
   - Seleccionar forma(s) de pago
   - Ingresar montos
   - Cambio se calcula automáticamente

5. **Completar Venta**
   - Validación de stock
   - Creación atómica de factura
   - Actualización de inventario
   - Ticket de impresión

### Flujo de Anulación

1. Usuario con permiso solicita anular
2. Ingresa motivo obligatorio
3. Sistema valida estado != 'ANU'
4. Reversión automática de stock
5. Actualización de estado a 'ANU'
6. Registro de fecha y usuario que anuló

---

## 🔒 Seguridad

### Validaciones de Seguridad
- [x] Autenticación JWT obligatoria
- [x] Token expirado se renueva automáticamente
- [x] Validación de tenant por subdominio
- [x] SQL injection prevention (queries parametrizadas)
- [x] Validación de datos con serializers DRF
- [x] Transacciones atómicas para operaciones críticas

### Permisos por Rol
- **admin**: Puede ver todas las bodegas y sucursales
- **vendedor/operario**: Solo ve su sucursal asignada

---

## 📈 Características Avanzadas

### Gestión de Stock
- Reserva durante creación de factura
- Confirmación automática
- Reversión en anulación
- Cache de stock en `Producto.stock`

### Múltiples Formas de Pago
- Combinación de efectivo + tarjeta
- Cada pago con su referencia
- Cálculo automático de cambio

### Búsqueda Inteligente
- Búsqueda por SKU, nombre, código de barras
- Búsqueda de cliente por documento o nombre
- Debounce para optimizar peticiones

### Impresión de Ticket
- Formato térmico (58mm / 80mm)
- Información completa de venta
- Soporte para navegador (Ctrl+P)

---

## 🚀 Despliegue

### Requisitos Previos
1. Servidor Django corriendo
2. Base de datos configurada
3. Archivo `urls_facturacion.py` creado
4. Migraciones ejecutadas

### Pasos para Activar
1. **Reiniciar servidor Django:**
   ```bash
   cd /home/dagi/nova/backend
   python manage.py runserver
   ```

2. **Verificar rutas:**
   ```bash
   # Debería ver las rutas de facturación
   curl -X POST https://dagi.co/api/facturacion/formas-pago/ \
     -H "Content-Type: application/json" \
     -d '{"usuario":"u","token":"t","subdominio":"s"}'
   ```

3. **Probar frontend:**
   - Navegar a `/facturacion`
   - Probar crear cliente
   - Probar crear venta

---

## 📝 Notas Importantes

1. **Tokens expiran** pero se renuevan automáticamente
2. **Stock se valida** antes de crear factura
3. **Anulación revierte** stock automáticamente
4. **Transacciones son atómicas** (todo o nada)
5. **Multi-tenant** - cada tienda tiene su BD separada
6. **Subdominio** identifica la tienda automáticamente

---

## 🎓 Referencias Técnicas

### Django REST Framework
- [ViewSets](https://www.django-rest-framework.org/api-guide/viewsets/)
- [Serializers](https://www.django-rest-framework.org/api-guide/serializers/)
- [Authentication](https://www.django-rest-framework.org/api-guide/authentication/)

### Django Patterns
- [Multi-tenancy](https://docs.djangoproject.com/en/stable/topics/db/multi-database/)
- [Transactions](https://docs.djangoproject.com/en/stable/topics/db/transactions/)

### React Patterns
- [Hooks](https://react.dev/reference/react)
- [Form Handling](https://react.dev/reference/react-dom/components)

---

**Última actualización:** 2026-02-04
**Versión:** 1.0.0
**Autor:** Sistema Nova - Facturación POS
