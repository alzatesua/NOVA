# SISTEMA DE BODEGAS - DOCUMENTACIÓN TÉCNICA COMPLETA

## Índice
1. [Arquitectura General](#1-arquitectura-general)
2. [Modelos de Base de Datos](#2-modelos-de-base-de-datos)
3. [API Endpoints](#3-api-endpoints)
4. [Componentes del Frontend](#4-componentes-del-frontend)
5. [Flujo Completo de Traslados](#5-flujo-completo-de-traslados)
6. [Servicios API del Frontend](#6-servicios-api-del-frontend)
7. [Configuración de URLs](#7-configuración-de-urls)
8. [Validaciones y Reglas de Negocio](#8-validaciones-y-reglas-de-negocio)
9. [Características Especiales](#9-características-especiales)

---

## 1. Arquitectura General

### 1.1 Stack Tecnológico

**Backend:**
- Django REST Framework
- PostgreSQL con multi-tenancy (diferentes databases por tenant)
- Docker Compose para contenerización

**Frontend:**
- React 18 con Hooks
- Vite como bundler
- TailwindCSS para estilos
- Heroicons para iconografía

**Arquitectura Multi-Tenant:**
- Cada tienda tiene su propia base de datos
- Resolución de alias por subdominio
- Aislamiento completo de datos entre tiendas

---

## 2. Modelos de Base de Datos

### 2.1 Modelo Bodega
**Tabla:** `inventario_bodega`

```python
class Bodega(models.Model):
    TIPO_CHOICES = [
        ('ALM', 'Almacén central'),
        ('SUC', 'Bodega de sucursal'),
        ('TRN', 'En tránsito'),
        ('CON', 'Consignación'),
        ('3PL', 'Operador logístico'),
    ]

    sucursal = models.ForeignKey(Sucursales, on_delete=models.PROTECT, related_name='bodegas')
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=20, blank=True, null=True)
    tipo = models.CharField(max_length=4, choices=TIPO_CHOICES, default='SUC')
    direccion = models.CharField(max_length=255, blank=True, null=True)
    es_predeterminada = models.BooleanField(default=False)
    estatus = models.BooleanField(default=True)
    responsable = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    notas = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventario_bodega'
        unique_together = [['sucursal', 'nombre'], ['sucursal', 'codigo']]
```

**Relaciones:**
- `sucursal` → Sucursales (una bodega pertenece a una sucursal)
- `responsable` → User (usuario responsable de la bodega)
- `bodegas` ← Existencia (existencias en esta bodega)
- `traslados_origen` ← Traslado (traslados que salen de aquí)
- `traslados_destino` ← Traslado (traslados que llegan aquí)

**Campos Clave:**
- `tipo`: Define el tipo de bodega (almacén central, sucursal, tránsito, etc.)
- `es_predeterminada`: Solo UNA por sucursal puede ser True
- `estatus`: Si está activa o inactiva

---

### 2.2 Modelo Existencia
**Tabla:** `inventario_existencia`

```python
class Existencia(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT, related_name='existencias')
    bodega = models.ForeignKey(Bodega, on_delete=models.PROTECT, related_name='existencias')
    cantidad = models.IntegerField(default=0)      # Stock disponible en bodega
    reservado = models.IntegerField(default=0)     # Stock comprometido en pedidos
    minimo = models.IntegerField(default=0)        # Stock mínimo para alertas
    maximo = models.IntegerField(null=True, blank=True)  # Stock máximo
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    @property
    def disponible(self):
        """Stock realmente disponible para venta"""
        return self.cantidad - self.reservado

    class Meta:
        db_table = 'inventario_existencia'
        unique_together = [['producto', 'bodega']]
```

**Relaciones:**
- `producto` → Producto (producto de esta existencia)
- `bodega` → Bodega (bodega donde está esta existencia)
- `existencias` ← Producto.existencias (todas las existencias del producto)

**Campos Clave:**
- `cantidad`: Stock físico en la bodega
- `reservado`: Stock reservado en pedidos abiertos
- `disponible`: Stock realmente disponible (cantidad - reservado)
- `minimo`/`maximo`: Umbrales para alertas de stock

**Propiedad Calculada Importante:**
```python
@property
def disponible(self):
    """Retorna el stock realmente disponible (no reservado)"""
    return self.cantidad - self.reservado
```

---

### 2.3 Modelo Traslado
**Tabla:** `inventario_traslado`

```python
class Traslado(models.Model):
    ESTADOS = [
        ('BOR', 'Borrador'),      # Estado inicial
        ('ENV', 'Enviado'),       # Enviado a tránsito
        ('REC', 'Recibido'),      # Recibido en destino
        ('CAN', 'Cancelado'),     # Cancelado
    ]

    bodega_origen = models.ForeignKey(Bodega, on_delete=models.PROTECT, related_name='traslados_origen')
    bodega_destino = models.ForeignKey(Bodega, on_delete=models.PROTECT, related_name='traslados_destino')
    estado = models.CharField(max_length=3, choices=ESTADOS, default='BOR')
    usar_bodega_transito = models.BooleanField(default=True)
    observaciones = models.TextField(blank=True, null=True)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    enviado_en = models.DateTimeField(blank=True, null=True)
    recibido_en = models.DateTimeField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventario_traslado'
        ordering = ['-creado_en']
```

**Relaciones:**
- `bodega_origen` → Bodega (de donde sale el stock)
- `bodega_destino` → Bodega (a donde llega el stock)
- `creado_por` → User (usuario que creó el traslado)
- `lineas` ← TrasladoLinea (productos del traslado)

**Estados y Flujo:**
```
BOR (Borrador) → ENV (Enviado) → REC (Recibido)
                    ↓
                  CAN (Cancelado)
```

---

### 2.4 Modelo TrasladoLinea
**Tabla:** `inventario_traslado_linea`

```python
class TrasladoLinea(models.Model):
    traslado = models.ForeignKey(Traslado, on_delete=models.CASCADE, related_name='lineas')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT, related_name='lineas_traslado')
    cantidad = models.PositiveIntegerField()           # Cantidad enviada
    cantidad_recibida = models.PositiveIntegerField(default=0)  # Cantidad recibida

    @property
    def pendiente_por_recibir(self):
        """Cantidad que falta por recibir"""
        return self.cantidad - self.cantidad_recibida

    class Meta:
        db_table = 'inventario_traslado_linea'
        unique_together = [['traslado', 'producto']]
```

**Propiedad Calculada Importante:**
```python
@property
def pendiente_por_recibir(self):
    """Cantidad que falta por recibir en destino"""
    return self.cantidad - self.cantidad_recibida
```

---

### 2.5 Modelo Producto (Relacionado)
**Tabla:** `productos`

```python
class Producto(models.Model):
    nombre = models.CharField(max_length=255)
    sku = models.CharField(max_length=50, unique=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)  # CACHE: suma de stock en todas las bodegas

    bodega = models.ForeignKey('Bodega', on_delete=models.SET_NULL, null=True, blank=True)

    @property
    def stock_total(self):
        """Suma real de (cantidad - reservado) en todas las bodegas"""
        from django.db.models import Sum
        total = (self.existencias.aggregate(
            total=Sum('cantidad') - Sum('reservado')
        )['total'] or 0)
        return total

    class Meta:
        db_table = 'productos'
```

**Propiedades de Inventario:**
- `stock`: Campo cacheado (legado, se mantiene por compatibilidad)
- `stock_total`: Propiedad calculada que suma existencias reales
- `existencias`: Relación inversa a Existencia

---

## 3. API Endpoints

### 3.1 Endpoints de Bodegas
**Base URL:** `/api/bodegas/`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/bodegas/` | Listar todas las bodegas |
| POST | `/bodegas/` | Crear nueva bodega |
| GET | `/bodegas/<id>/` | Obtener detalle de una bodega |
| PUT | `/bodegas/<id>/` | Actualizar bodega completa |
| PATCH | `/bodegas/<id>/` | Actualización parcial de bodega |
| DELETE | `/bodegas/<id>/` | Eliminar bodega |

**Respuesta de Listado:**
```json
{
  "id": 1,
  "sucursal": 1,
  "nombre": "Bodega Principal",
  "codigo": "BOD-001",
  "tipo": "SUC",
  "direccion": "Av. Principal #123",
  "es_predeterminada": true,
  "estatus": true,
  "responsable": 1,
  "fecha_creacion": "2026-01-01T00:00:00Z"
}
```

---

### 3.2 Endpoints de Existencias
**Base URL:** `/api/existencias/`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/existencias/` | Listar todas las existencias |
| POST | `/existencias/` | Crear nueva existencia |
| GET | `/existencias/<id>/` | Obtener detalle de existencia |
| PUT | `/existencias/<id>/` | Actualizar existencia |
| PATCH | `/existencias/<id>/` | Actualización parcial |
| DELETE | `/existencias/<id>/` | Eliminar existencia |
| POST | `/existencias/ajustar/` | **Ajustar stock (+/-)** |
| POST | `/existencias/productos-por-bodega/` | **Obtener productos de una bodega** |

**Endpoint: Ajustar Existencia**
```http
POST /api/existencias/ajustar/
Content-Type: application/json

{
  "usuario": "juanperez",
  "token": "JWT_TOKEN",
  "subdominio": "mi-tienda",
  "producto": 123,
  "bodega": 5,
  "delta": 10
}
```

**Endpoint: Productos por Bodega**
```http
POST /api/existencias/productos-por-bodega/
Content-Type: application/json

{
  "usuario": "juanperez",
  "token": "JWT_TOKEN",
  "subdominio": "mi-tienda",
  "bodega_id": 5,
  "solo_con_stock": true
}
```

**Respuesta:**
```json
{
  "datos": [
    {
      "id": 123,
      "nombre": "Producto Ejemplo",
      "sku": "PROD-001",
      "precio": 99.99,
      "imagen_producto": "urlImagen",
      "stock_bodega": 50,
      "reservado_bodega": 5,
      "disponible_bodega": 45,
      "stock_total": 150,
      "id_categoria": 10,
      "id_marca": 3,
      "id_iva": 1,
      "sucursal_id": 1,
      "bodega_id": 5,
      "existencia_id": 789
    }
  ]
}
```

---

### 3.3 Endpoints de Traslados
**Base URL:** `/api/traslados/`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/traslados/` | Listar todos los traslados |
| POST | `/traslados/` | Crear nuevo traslado |
| GET | `/traslados/<id>/` | Obtener detalle de traslado |
| PUT | `/traslados/<id>/` | Actualizar traslado (solo BOR) |
| PATCH | `/traslados/<id>/` | Actualización parcial |
| DELETE | `/traslados/<id>/` | Eliminar traslado (solo BOR) |
| POST | `/traslados/<id>/enviar/` | **Enviar traslado (BOR→ENV)** |
| POST | `/traslados/<id>/recibir/` | **Recibir traslado (ENV→REC)** |
| POST | `/traslados/<id>/cancelar/` | **Cancelar traslado** |
| POST | `/traslados/por-destino/` | **Filtrar por bodega destino** |

---

#### Endpoint: Crear Traslado
```http
POST /api/traslados/
Content-Type: application/json

{
  "usuario": "juanperez",
  "token": "JWT_TOKEN",
  "subdominio": "mi-tienda",
  "bodega_origen": 1,
  "bodega_destino": 2,
  "observaciones": "Traslado de reposición",
  "usar_bodega_transito": true,
  "lineas": [
    {
      "producto": 123,
      "cantidad": 10
    },
    {
      "producto": 456,
      "cantidad": 5
    }
  ]
}
```

---

#### Endpoint: Enviar Traslado
```http
POST /api/traslados/42/enviar/
Content-Type: application/json

{
  "usuario": "juanperez",
  "token": "JWT_TOKEN",
  "subdominio": "mi-tienda"
}
```

**Qué hace:**
1. Valida que el traslado esté en estado BOR
2. Valida que tenga líneas de productos
3. **RESTA** stock de bodega_origen
4. Si `usar_bodega_transito=True`, **SUMA** a bodega TRN
5. Cambia estado a ENV
6. Registra fecha de envío

---

#### Endpoint: Recibir Traslado
```http
POST /api/traslados/42/recibir/
Content-Type: application/json

{
  "usuario": "juanperez",
  "token": "JWT_TOKEN",
  "subdominio": "mi-tienda",
  "cantidades": [
    {
      "producto": 123,
      "cantidad": 10
    },
    {
      "producto": 456,
      "cantidad": 3
    }
  ]
}
```

**Qué hace:**
1. Valida que el traslado esté en estado ENV
2. Si `usar_bodega_transito=True`, **RESTA** de bodega TRN
3. **SUMA** a bodega_destino
4. Actualiza `cantidad_recibida` en cada línea
5. Si todo recibido, cambia estado a REC
6. Registra fecha de recepción

---

#### Endpoint: Cancelar Traslado
```http
POST /api/traslados/42/cancelar/
Content-Type: application/json

{
  "usuario": "juanperez",
  "token": "JWT_TOKEN",
  "subdominio": "mi-tienda"
}
```

**Qué hace:**
- **BOR**: Elimina sin afectar stock
- **ENV**: Revierte pendiente hacia origen
- **REC**: No permitido

---

#### Endpoint: Filtrar por Destino
```http
POST /api/traslados/por-destino/
Content-Type: application/json

{
  "usuario": "juanperez",
  "token": "JWT_TOKEN",
  "subdominio": "mi-tienda",
  "bodega_destino_id": 2,
  "estado": "ENV"
}
```

---

## 4. Componentes del Frontend

### 4.1 Estructura de Carpetas
```
frontend/src/components/bodegas/
├── BodegasHeader.jsx          # Header con navegación de secciones
├── BodegasModal.jsx           # Modal reutilizable para formularios
├── constants/
│   └── secciones.js           # Definición de secciones disponibles
└── sections/
    ├── Administrar.jsx        # Centro de administración
    ├── CrearBodega.jsx         # Formulario para crear bodegas
    ├── AjustarExistencia.jsx   # Ajuste de inventario
    ├── RealizarTraslado.jsx    # Creación de traslados
    ├── EnviarTraslado.jsx      # Envío de traslados
    └── RecibirTraslado.jsx     # Recepción de traslados
```

---

### 4.2 Componentes Principales

#### BodegasHeader.jsx
**Propósito:** Navegación principal entre secciones

**Características:**
- Muestra todas las secciones disponibles
- Iconografía clara con Heroicons
- Indicador de sección activa
- Responsive design

**Secciones Disponibles:**
1. **Administrar** - Centro de control
2. **Crear bodega** - Formulario de alta
3. **Ajuste de inventario** - Ajustes de stock
4. **Realizar traslado** - Creación de traslados
5. **Enviar traslado** - Envío de borradores
6. **Recibir traslado** - Recepción de envíos

---

#### sections/Administrar.jsx
**Propósito:** Centro de administración principal

**Funcionalidades:**
- Resumen de estadísticas
- Accesos directos a operaciones
- Indicadores de estado
- Cards con acciones principales

---

#### sections/CrearBodega.jsx
**Propósito:** Formulario para crear nuevas bodegas

**Campos del Formulario:**
- Sucursal (select)
- Nombre de bodega
- Código (opcional)
- Tipo de bodega (ALM, SUC, TRN, CON, 3PL)
- Dirección
- ¿Es predeterminada? (checkbox)
- Estatus (activo/inactivo)
- Responsable (select de usuarios)
- Notas (textarea)

**Validaciones:**
- Unicidad de nombre por sucursal
- Unicidad de código por sucursal
- Solo una bodega predeterminada por sucursal
- Origen y destino deben ser diferentes

---

#### sections/AjustarExistencia.jsx
**Propósito:** Ajustar stock de productos en bodegas

**Características:**
- Búsqueda de productos por SKU con debounce
- Selección de bodega
- Ingreso de cantidad (+/-)
- Motivo del ajuste
- Confirmación con preview de cambios

**Flujo:**
1. Usuario escanea o busca producto por SKU
2. Selecciona bodega
3. Ingresa cantidad (positiva o negativa)
4. Confirma ajuste
5. Llama a `/api/existencias/ajustar/`

---

#### sections/RealizarTraslado.jsx
**Propósito:** Crear nuevos traslados entre bodegas

**Modos de Operación:**
- **Creación:** Crear nuevo traslado desde cero
- **Recepción:** Modo para recibir traslados

**Pasos:**
1. Seleccionar bodega origen
2. Seleccionar bodega destino
3. Configurar si usa bodega en tránsito
4. Agregar productos:
   - Búsqueda por SKU o código de barras
   - Ingreso de cantidad
   - Validación de stock disponible
5. Guardar como borrador

**Validaciones:**
- Origen y destino deben ser diferentes
- Stock suficiente en origen
- Cantidades positivas

---

#### sections/EnviarTraslado.jsx
**Propósito:** Enviar traslados en estado Borrador

**Características:**
- Lista de traslados en estado BOR
- Vista previa de líneas
- Envío individual o masivo
- Validación de stock antes de enviar

**Flujo:**
1. Usuario ve traslados pendientes
2. Revisa productos y cantidades
3. Selecciona traslado(s) a enviar
4. Confirma envío
5. Sistema actualiza inventario

---

#### sections/RecibirTraslado.jsx
**Propósito:** Recibir traslados en estado Enviado

**Características:**
- Lista de traslados en estado ENV
- Recepción parcial o total
- Edición de cantidades recibidas
- Confirmación de diferencias

**Flujo:**
1. Usuario ve traslados por recibir
2. Revisa productos enviados
3. Ingresa cantidades recibidas (puede diferir)
4. Confirma recepción
5. Sistema actualiza inventario destino

---

### 4.3 Componentes de UI

#### BodegasModal.jsx
**Propósito:** Modal reutilizable para formularios

**Props:**
```javascript
{
  isOpen: boolean,           // Si el modal está abierto
  onClose: function,         // Callback al cerrar
  title: string,             // Título del modal
  children: ReactNode,       // Contenido del modal
  size?: 'sm' | 'md' | 'lg'  // Tamaño (opcional)
}
```

---

## 5. Flujo Completo de Traslados

### 5.1 Estados del Traslado

```
┌──────────┐
│   BOR    │  Borrador - Sin efecto en inventario
│ (Borrador)│
└─────┬────┘
      │
      ├─── enviar()
      │
      ▼
┌──────────┐
│   ENV    │  Enviado - Stock movido a tránsito
│(Enviado) │
└─────┬────┘
      │
      ├─── recibir()
      │
      ▼
┌──────────┐
│   REC    │  Recibido - Stock en destino
│(Recibido)│
└──────────┘

      │
      └─── cancelar() (desde BOR o ENV)
           │
           ▼
      ┌──────────┐
      │   CAN    │  Cancelado
      │(Cancelado)│
      └──────────┘
```

---

### 5.2 Flujo Paso a Paso

#### Paso 1: Creación de Traslado (BOR)
```
Usuario crea traslado
    ↓
Selecciona origen y destino
    ↓
Agrega productos y cantidades
    ↓
Guarda como borrador
    ↓
Estado: BOR
Inventario: NO AFECTADO
```

**API:**
```http
POST /api/traslados/
{
  "bodega_origen": 1,
  "bodega_destino": 2,
  "usar_bodega_transito": true,
  "lineas": [
    {"producto": 123, "cantidad": 10}
  ]
}
```

---

#### Paso 2: Envío de Traslado (BOR → ENV)
```
Usuario envía traslado
    ↓
Sistema valida stock en origen
    ↓
RESTA de bodega_origen
    ↓
SI usar_bodega_transito:
    SUMA a bodega TRN
    ↓
Estado: ENV
Fecha envío: timestamp
```

**API:**
```http
POST /api/traslados/42/enviar/
```

**Cambios en Inventario:**
```python
# Si usar_bodega_transito = TRUE
origen.cantidad -= 10
transito.cantidad += 10

# Si usar_bodega_transito = FALSE
origen.cantidad -= 10
# Stock queda "en el aire" hasta recibir
```

---

#### Paso 3: Recepción de Traslado (ENV → REC)
```
Usuario recibe traslado
    ↓
Ingresa cantidades recibidas
(puede ser parcial)
    ↓
SI usar_bodega_transito:
    RESTA de bodega TRN
    ↓
SUMA a bodega_destino
    ↓
Actualiza cantidad_recibida
    ↓
SI todo recibido:
    Estado: REC
Fecha recepción: timestamp
```

**API:**
```http
POST /api/traslados/42/recibir/
{
  "cantidades": [
    {"producto": 123, "cantidad": 8}
  ]
}
```

**Cambios en Inventario:**
```python
# Si usar_bodega_transito = TRUE
transito.cantidad -= 8
destino.cantidad += 8
linea.cantidad_recibida = 8

# Si usar_bodega_transito = FALSE
# Solo se suma a destino
destino.cantidad += 8
linea.cantidad_recibida = 8
```

---

#### Paso 4: Cancelación de Traslado
```
Estado BOR:
    Se elimina sin afectar inventario

Estado ENV:
    Se revierte stock
    - RESTA de tránsito
    - SUMA a origen
    Estado: CAN

Estado REC:
    NO se puede cancelar
    (usar devolución)
```

**API:**
```http
POST /api/traslados/42/cancelar/
```

---

### 5.3 Ejemplo Completo con Datos

**Escenario:** Traslado de 10 productos de Bodega A a Bodega B

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Bodega A   │         │   Tránsito  │         │  Bodega B   │
│  (Origen)   │         │  (Temporal) │         │ (Destino)   │
└─────────────┘         └─────────────┘         └─────────────┘

1. ESTADO INICIAL
   Producto X: 50 unidades

2. CREAR TRASLADO (BOR)
   Sin cambios en inventario

3. ENVIAR TRASLADO (ENV)
   Bodega A: 50 - 10 = 40
   Tránsito: 0 + 10 = 10

4. RECIBIR TRASLADO (REC) - Recepción completa
   Tránsito: 10 - 10 = 0
   Bodega B: 20 + 10 = 30

5. ESTADO FINAL
   Bodega A: 40
   Tránsito: 0
   Bodega B: 30
   Total: 70 (sin cambios, solo redistribuido)
```

---

## 6. Servicios API del Frontend

### 6.1 Ubicación
`frontend/src/services/api.js`

---

### 6.2 Funciones de Bodegas

#### fetchBodegas
```javascript
export async function fetchBodegas({
  tokenUsuario,
  usuario,
  subdominio
}) {
  const token = tokenUsuario;
  return get(
    'api/bodegas/',
    { usuario, subdominio },
    token
  );
}
```

**Uso:**
```javascript
const bodegas = await fetchBodegas({
  tokenUsuario: user.token,
  usuario: user.username,
  subdominio: tenant.subdominio
});
```

---

#### crearBodega
```javascript
export function crearBodega({
  token,
  usuario,
  subdominio,
  sucursal,
  nombre,
  tipo,
  es_predeterminada,
  estatus
}) {
  return post(
    'api/bodegas/',
    {
      usuario,
      subdominio,
      sucursal,
      nombre,
      tipo,
      es_predeterminada,
      estatus
    },
    token
  );
}
```

---

#### obtenerBodegasPorSucursal
```javascript
export function obtenerBodegasPorSucursal({
  usuario,
  token,
  subdominio,
  sucursal_id
}) {
  return post(
    'api/bodegas/por-sucursal/',
    { usuario, subdominio, sucursal_id },
    token
  );
}
```

---

### 6.3 Funciones de Existencias

#### ajustarExistencia
```javascript
export function ajustarExistencia({
  token,
  usuario,
  subdominio,
  producto,
  bodega,
  delta
}) {
  return post(
    'api/existencias/ajustar/',
    {
      usuario,
      subdominio,
      producto,
      bodega,
      delta
    },
    token
  );
}
```

**Parámetros:**
- `producto`: ID del producto
- `bodega`: ID de la bodega
- `delta`: Cantidad a ajustar (+/-)

---

#### obtenerExistenciasPorBodega
```javascript
export function obtenerExistenciasPorBodega({
  usuario,
  tokenUsuario,
  subdominio,
  bodega_id
}) {
  const token = tokenUsuario;
  return post(
    'api/existencias/por-bodega/',
    { usuario, subdominio, bodega_id },
    token
  );
}
```

---

#### obtenerProductosPorBodega
```javascript
export function obtenerProductosPorBodega({
  usuario,
  tokenUsuario,
  subdominio,
  bodega_id,
  solo_con_stock = true
}) {
  const token = tokenUsuario;
  return post(
    'api/existencias/productos-por-bodega/',
    { usuario, subdominio, bodega_id, solo_con_stock },
    token
  );
}
```

**Respuesta:**
```javascript
{
  datos: [
    {
      id: 123,
      nombre: "Producto",
      sku: "SKU-001",
      precio: 99.99,
      stock_bodega: 50,
      disponible_bodega: 45,
      stock_total: 150
    }
  ]
}
```

---

### 6.4 Funciones de Traslados

#### crearTraslado
```javascript
export function crearTraslado({
  token,
  usuario,
  subdominio,
  bodega_origen,
  bodega_destino,
  observaciones,
  usar_bodega_transito,
  lineas
}) {
  return post(
    'api/traslados/',
    {
      usuario,
      subdominio,
      bodega_origen,
      bodega_destino,
      observaciones,
      usar_bodega_transito,
      lineas
    },
    token
  );
}
```

**Ejemplo de uso:**
```javascript
await crearTraslado({
  token: user.token,
  usuario: user.username,
  subdominio: tenant.subdominio,
  bodega_origen: 1,
  bodega_destino: 2,
  observaciones: "Reposición quincenal",
  usar_bodega_transito: true,
  lineas: [
    { producto: 123, cantidad: 10 },
    { producto: 456, cantidad: 5 }
  ]
});
```

---

#### listarTrasladosPorBodegaDestino
```javascript
export function listarTrasladosPorBodegaDestino({
  token,
  usuario,
  subdominio,
  bodega_destino_id,
  estado
}) {
  return post(
    'api/traslados/por-destino/',
    {
      usuario,
      subdominio,
      bodega_destino_id,
      estado
    },
    token
  );
}
```

---

#### enviarTraslado
```javascript
export function enviarTraslado({
  token,
  usuario,
  subdominio,
  traslado_id
}) {
  return post(
    `api/traslados/${traslado_id}/enviar/`,
    { usuario, subdominio },
    token
  );
}
```

---

#### recibirTraslado
```javascript
export function recibirTraslado({
  token,
  usuario,
  subdominio,
  traslado_id,
  cantidades = []
}) {
  return post(
    `api/traslados/${traslado_id}/recibir/`,
    {
      usuario,
      subdominio,
      cantidades
    },
    token
  );
}
```

**Ejemplo de recepción parcial:**
```javascript
await recibirTraslado({
  token: user.token,
  usuario: user.username,
  subdominio: tenant.subdominio,
  traslado_id: 42,
  cantidades: [
    { producto: 123, cantidad: 8 },  // Se envió 10
    { producto: 456, cantidad: 5 }   // Se envió 5
  ]
});
```

---

#### fetchAllProductsTraslado
```javascript
export function fetchAllProductsTraslado({
  usuario,
  tokenUsuario,
  subdominio
}) {
  const token = tokenUsuario;
  return get(
    'api/traslados/',
    { usuario, subdominio },
    token
  );
}
```

---

## 7. Configuración de URLs

### 7.1 Backend: main_dashboard/urls.py
```python
from django.urls import path
from .views import (
    obtener_info_tienda,
    buscar_en_tabla,
    ProductoExistenciasView
)

urlpatterns = [
    path('info-tienda/', obtener_info_tienda, name='info_tienda'),
    path('info-tienda-columna/', buscar_en_tabla, name='buscar_en_tabla'),
    path('productos-existencias/list/', ProductoExistenciasView.as_view()),
]
```

---

### 7.2 Backend: main_dashboard/urls_traslados.py
```python
from django.urls import path
from .views import (
    BodegaViewSet,
    ExistenciaViewSet,
    TrasladoViewSet,
    debug_inventario
)

# ViewSet bindings
bodega_list = BodegaViewSet.as_view({'get': 'list', 'post': 'create'})
bodega_detail = BodegaViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

existencia_list = ExistenciaViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
existencia_detail = ExistenciaViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
existencia_ajustar = ExistenciaViewSet.as_view({'post': 'ajustar'})

traslado_list = TrasladoViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
traslado_detail = TrasladoViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
traslado_enviar = TrasladoViewSet.as_view({'post': 'enviar'})
traslado_recibir = TrasladoViewSet.as_view({'post': 'recibir'})
traslado_cancelar = TrasladoViewSet.as_view({'post': 'cancelar'})
por_destino = TrasladoViewSet.as_view({'post': 'por_destino'})

urlpatterns = [
    # Bodegas
    path('bodegas/', bodega_list, name='bodega_list'),
    path('bodegas/<int:pk>/', bodega_detail, name='bodega_detail'),

    # Existencias
    path('existencias/', existencia_list, name='existencia_list'),
    path('existencias/<int:pk>/', existencia_detail, name='existencia_detail'),
    path('existencias/ajustar/', existencia_ajustar, name='existencia_ajustar'),

    # Traslados
    path('traslados/', traslado_list, name='traslado_list'),
    path('traslados/<int:pk>/', traslado_detail, name='traslado_detail'),
    path('traslados/<int:pk>/enviar/', traslado_enviar, name='traslado_enviar'),
    path('traslados/<int:pk>/recibir/', traslado_recibir, name='traslado_recibir'),
    path('traslados/<int:pk>/cancelar/', traslado_cancelar, name='traslado_cancelar'),
    path('traslados/por-destino/', por_destino, name='traslado_por_destino'),

    # Debug
    path('debug/inventario/', debug_inventario),
]
```

---

### 7.3 URLs Principales (nova/urls.py)
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
# ... router registrations ...

urlpatterns = [
    # URLs específicas de la app
    path('api/obtener/datos/', include('main_dashboard.urls')),
    path('api/actualizar/datos/', include('main_dashboard.urls')),
    path('api/crear/datos/', include('main_dashboard.urls')),
    path('api/crear/nuevos/', include('main_dashboard.urls')),
    path('api/subir/', include('main_dashboard.urls')),

    # Router y módulos específicos
    path('api/', include(router.urls)),
    path('api/', include('main_dashboard.urls_traslados')),
    path('api/facturacion/', include('main_dashboard.urls_facturacion')),
]
```

---

## 8. Validaciones y Reglas de Negocio

### 8.1 Validaciones de Modelo

#### Bodega
- **Unicidad:** No puede haber dos bodegas con el mismo nombre en la misma sucursal
- **Código único:** No puede haber dos bodegas con el mismo código en la misma sucursal
- **Predeterminada:** Solo UNA bodega puede ser predeterminada por sucursal
- **Estatus:** Las bodegas inactivas no pueden seleccionarse en traslados

---

#### Existencia
- **Unicidad:** Solo puede haber una existencia por (producto, bodega)
- **Stock no negativo:** `cantidad` no puede ser negativa
- **Reservado válido:** `reservado` no puede ser mayor que `cantidad`
- **Disponible:** `cantidad - reservado >= 0`

---

#### Traslado
- **Origen ≠ Destino:** Las bodegas deben ser diferentes
- **Solo editar BOR:** Solo se puede modificar si está en estado BOR
- **Líneas requeridas:** Debe tener al menos una línea para enviarse
- **Stock suficiente:** Debe haber stock disponible en origen

---

### 8.2 Validaciones de Vista

#### Enviar Traslado
```python
def validar_envio(traslado):
    # 1. Estado debe ser BOR
    if traslado.estado != 'BOR':
        raise ValidationError("Solo se pueden enviar traslados en borrador")

    # 2. Debe tener líneas
    if not traslado.lineas.exists():
        raise ValidationError("El traslado no tiene productos")

    # 3. Validar stock en origen
    for linea in traslado.lineas.all():
        existencia = Existencia.objects.get(
            producto=linea.producto,
            bodega=traslado.bodega_origen
        )
        if existencia.disponible < linea.cantidad:
            raise ValidationError(
                f"Stock insuficiente para {linea.producto.nombre}. "
                f"Disponible: {existencia.disponible}, Requerido: {linea.cantidad}"
            )
```

---

#### Recibir Traslado
```python
def validar_recepcion(traslado, cantidades):
    # 1. Estado debe ser ENV
    if traslado.estado != 'ENV':
        raise ValidationError("Solo se pueden recibir traslados enviados")

    # 2. Validar cantidades
    for item in cantidades:
        linea = TrasladoLinea.objects.get(
            traslado=traslado,
            producto=item['producto']
        )

        # No puede recibir más de lo enviado
        if item['cantidad'] > linea.cantidad:
            raise ValidationError(
                f"No se puede recibir más de lo enviado para {linea.producto.nombre}"
            )

        # Validar que no sea menor que lo ya recibido
        if item['cantidad'] < linea.cantidad_recibida:
            raise ValidationError(
                f"La cantidad recibida no puede ser menor a la ya recibida"
            )
```

---

### 8.3 Reglas de Inventario

#### Ajuste de Stock
```python
def ajustar_stock(producto_id, bodega_id, delta):
    """
    Ajusta el stock de un producto en una bodega.

    Args:
        producto_id: ID del producto
        bodega_id: ID de la bodega
        delta: Cantidad a ajustar (+ o -)

    Raises:
        ValidationError: Si el resultado sería negativo
    """
    existencia = Existencia.objects.get(
        producto=producto_id,
        bodega=bodega_id
    )

    nuevo_stock = existencia.cantidad + delta

    if nuevo_stock < 0:
        raise ValidationError("Stock no puede ser negativo")

    existencia.cantidad = nuevo_stock
    existencia.save()

    # Actualizar cache en Producto
    _actualizar_cache_stock_producto(producto_id)
```

---

#### Actualización de Cache
```python
def _actualizar_cache_stock_producto(producto_id):
    """
    Actualiza el campo cache stock en Producto.
    Suma el total de stock en todas las bodegas.
    """
    from django.db.models import Sum

    total = Existencia.objects.filter(
        producto=producto_id
    ).aggregate(
        total=Sum('cantidad')
    )['total'] or 0

    Producto.objects.filter(
        id=producto_id
    ).update(stock=total)
```

---

## 9. Características Especiales

### 9.1 Multi-Tenancy

#### Resolución de Alias
```python
class TenantMixin:
    def _resolve_alias(self, request):
        """
        Resuelve el alias de base de datos basado en el subdominio.
        """
        from main_dashboard.models import Tenant

        subdominio = request.data.get('subdominio')

        if not subdominio:
            raise ValidationError("subdominio es requerido")

        try:
            tenant = Tenant.objects.get(subdominio=subdominio)
            return tenant.db_alias
        except Tenant.DoesNotExist:
            raise ValidationError("Tenant no encontrado")
```

#### Uso en Views
```python
class BodegaViewSet(TenantMixin, viewsets.ModelViewSet):
    def get_queryset(self):
        alias = self._resolve_alias(self.request)
        return Bodega.objects.using(alias).all()

    def perform_create(self, serializer):
        alias = self._resolve_alias(self.request)
        serializer.save(using=alias)
```

---

### 9.2 Bodega en Tránsito

#### Concepto
La bodega en tránsito es una bodega temporal (tipo TRN) que se usa para:
- Rastrear stock que está "en camino"
- Mantener integridad contable
- Permitir recepciones parciales

#### Función de Helper
```python
def _get_bodega_transito_para(bodega_origen):
    """
    Obtiene o crea la bodega de tránsito para una sucursal.
    """
    sucursal = bodega_origen.sucursal

    # Buscar bodega de tránsito existente
    transito, created = Bodega.objects.using(
        bodega_origen._state.db
    ).get_or_create(
        sucursal=sucursal,
        tipo='TRN',
        defaults={
            'nombre': f'Tránsito - {sucursal.nombre}',
            'codigo': f'TRN-{sucursal.id}',
            'estatus': True
        }
    )

    return transito
```

#### Flujo con Tránsito
```
1. ENVÍO:
   - Resta de origen
   - Suma a tránsito
   - Estado: ENV

2. RECEPCIÓN:
   - Resta de tránsito
   - Suma a destino
   - Estado: REC

3. CANCELACIÓN:
   - Resta de tránsito
   - Suma a origen
   - Estado: CAN
```

---

### 9.3 Búsqueda por Código de Barras

#### Frontend con Debounce
```javascript
const [busqueda, setBusqueda] = useState('');
const [resultados, setResultados] = useState([]);
const debouncedBusqueda = useDebounce(busqueda, 300);

useEffect(() => {
  if (debouncedBusqueda.length >= 2) {
    buscarProducto(debouncedBusqueda);
  }
}, [debouncedBusqueda]);

async function buscarProducto(query) {
  const resultados = await buscarProductosPorCodigo({
    codigo_barras: query,
    // ...otros params
  });
  setResultados(resultados);
}
```

---

### 9.4 Recepción Parcial

El sistema soporta recepciones parciales de traslados:

```javascript
// Traslado original: 10 unidades
await recibirTraslado({
  traslado_id: 42,
  cantidades: [
    { producto: 123, cantidad: 8 }  // Solo se recibieron 8
  ]
});

// Resultado:
// - linea.cantidad_recibida = 8
// - linea.pendiente_por_recibir = 2
// - Estado sigue siendo ENV (no completo)
```

Cuando se completa la recepción:
```javascript
await recibirTraslado({
  traslado_id: 42,
  cantidades: [
    { producto: 123, cantidad: 2 }  // Recibir los 2 restantes
  ]
});

// Resultado:
// - linea.cantidad_recibida = 10 (total)
// - linea.pendiente_por_recibir = 0
// - Estado cambia a REC
```

---

### 9.5 Indicadores Visuales

#### Estados con Colores
```javascript
const ESTADO_COLORS = {
  'BOR': 'bg-gray-100 text-gray-800',   // Gris - Borrador
  'ENV': 'bg-blue-100 text-blue-800',   // Azul - Enviado
  'REC': 'bg-green-100 text-green-800', // Verde - Recibido
  'CAN': 'bg-red-100 text-red-800'      // Rojo - Cancelado
};
```

#### Iconos por Tipo de Bodega
```javascript
const BODEGA_ICONS = {
  'ALM': BuildingOffice2Icon,  // Almacén central
  'SUC': BuildingStorefrontIcon, // Bodega de sucursal
  'TRN': ArrowPathIcon,          // En tránsito
  'CON': ArchiveBoxIcon,         // Consignación
  '3PL': TruckIcon              // Operador logístico
};
```

---

## 10. Buenas Prácticas

### 10.1 Frontend

#### Manejo de Errores
```javascript
try {
  await crearTraslado(datos);
  toast.success('Traslado creado exitosamente');
} catch (error) {
  if (error.response?.data?.detail) {
    toast.error(error.response.data.detail);
  } else {
    toast.error('Error al crear traslado');
  }
  console.error('Error:', error);
}
```

#### Loading States
```javascript
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async () => {
  setIsLoading(true);
  try {
    await crearTraslado(datos);
  } finally {
    setIsLoading(false);
  }
};
```

---

### 10.2 Backend

#### Transacciones para Integridad
```python
from django.db import transaction

@transaction.atomic
def enviar_traslado_alias(alias, traslado_id):
    """
    Envía un traslado dentro de una transacción.
    Si algo falla, todo se revierte.
    """
    # 1. Obtener traslado con lock
    traslado = Traslado.objects.using(alias).select_for_update().get(id=traslado_id)

    # 2. Validar
    if traslado.estado != 'BOR':
        raise ValidationError("Solo se pueden enviar traslados en borrador")

    # 3. Restar stock origen
    for linea in traslado.lineas.all():
        ajustar_stock(alias, linea.producto_id, traslado.bodega_origen_id, -linea.cantidad)

    # 4. Si usa tránsito, sumar
    if traslado.usar_bodega_transito:
        transito = _get_bodega_transito_para(traslado.bodega_origen)
        for linea in traslado.lineas.all():
            ajustar_stock(alias, linea.producto_id, transito.id, linea.cantidad)

    # 5. Actualizar estado
    traslado.estado = 'ENV'
    traslado.enviado_en = timezone.now()
    traslado.save(using=alias)

    return traslado
```

---

## 11. Troubleshooting Común

### 11.1 Errores Frecuentes

#### Error: "Stock no puede ser negativo"
**Causa:** Intentando restar más stock del disponible
**Solución:** Validar stock antes de la operación
```python
disponible = existencia.disponible
if disponible < cantidad:
    raise ValidationError(f"Stock insuficiente. Disponible: {disponible}")
```

---

#### Error: "Solo se pueden editar traslados en estado BOR"
**Causa:** Intentando modificar un traslado ya enviado
**Solución:** Crear un nuevo traslado o cancelar y volver a crear

---

#### Error: "Object of type Categoria is not JSON serializable"
**Causa:** Accediendo a objetos relacionados en lugar de IDs
**Solución:** Usar `.pk` para obtener el ID
```python
# INCORRECTO
'id_categoria': producto.categoria_id  # Retorna objeto Categoria

# CORRECTO
'id_categoria': producto.categoria_id.pk  # Retorna ID
```

---

### 11.2 Debug Mode

#### Endpoint de Debug
```python
@csrf_exempt
def debug_inventario(request):
    """
    Endpoint temporal para debug de inventario.
    """
    alias = request.GET.get('alias', 'default')

    data = {
        'bodegas': list(Bodega.objects.using(alias).values()),
        'existencias': list(Existencia.objects.using(alias).values()),
        'traslados': list(Traslado.objects.using(alias).values()),
    }

    return JsonResponse(data, safe=False)
```

**Uso:**
```bash
curl "http://localhost:8000/api/debug/inventario/?alias=tenant1"
```

---

## 12. Resumen de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  React + Vite + TailwindCSS                                │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ BodegasHeader│  │   Sections   │  │  Modals      │     │
│  │              │  │              │  │              │     │
│  │ - Navegación │  │ - Administrar│  │ - CrearBodega│     │
│  │ - Secciones  │  │ - RealizarTx │  │ - AjustarStock│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         │ JSON
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                             │
│  Django REST Framework + PostgreSQL                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    ViewSets                           │  │
│  │                                                       │  │
│  │  BodegaViewSet  │  ExistenciaViewSet │ TrasladoViewSet │ │
│  └──────────────────────────────────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Models                             │  │
│  │                                                       │  │
│  │  Bodega │ Existencia │ Traslado │ TrasladoLinea      │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Multi-Tenant Database Layer              │  │
│  │                                                       │  │
│  │  tenant1_db │ tenant2_db │ tenant3_db │ ...          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 13. Flujos de Usuario

### 13.1 Flujo: Crear y Enviar Traslado

```
USUARIO: Gerente de Sucursal
┌───────────────────────────────────────────────────────────┐
│ 1. Ingresa al módulo de Bodegas                           │
│ 2. Selecciona "Realizar traslado"                         │
│ 3. Selecciona bodega origen (Bodega A)                    │
│ 4. Selecciona bodega destino (Bodega B)                   │
│ 5. Marca "Usar bodega en tránsito"                        │
│ 6. Escanea productos:                                     │
│    - SKU001: 10 unidades                                 │
│    - SKU002: 5 unidades                                  │
│ 7. Revisa el resumen                                      │
│ 8. Guarda como borrador (Estado: BOR)                     │
│ 9. Va a "Enviar traslado"                                 │
│ 10. Selecciona el traslado creado                         │
│ 11. Confirma envío                                        │
│ 12. Sistema actualiza inventario:                         │
│     - Bodega A: -15 unidades                             │
│     - Tránsito: +15 unidades                             │
│ 13. Estado cambia a ENV                                   │
│ 14. Notificación: "Traslado enviado exitosamente"        │
└───────────────────────────────────────────────────────────┘
```

---

### 13.2 Flujo: Recibir Traslado

```
USUARIO: Recepcionista
┌───────────────────────────────────────────────────────────┐
│ 1. Notificación: "Tienes 2 traslados por recibir"        │
│ 2. Ingresa a "Recibir traslado"                          │
│ 3. Ve lista de traslados en estado ENV                   │
│ 4. Selecciona Traslado #42                               │
│ 5. Revisa productos enviados:                            │
│    - SKU001: 10 unidades                                 │
│    - SKU002: 5 unidades                                  │
│ 6. Recibe fisicamente los productos                      │
│ 7. Ingresa cantidades recibidas:                         │
│    - SKU001: 10 unidades (completo)                      │
│    - SKU002: 4 unidades (falto 1, dañado)                │
│ 8. Confirma recepción                                    │
│ 9. Sistema actualiza inventario:                         │
│     - Tránsito: -14 unidades                             │
│     - Bodega B: +14 unidades                             │
│ 10. Estado sigue siendo ENV (recepción parcial)          │
│ 11. Nota: "Falta recibir 1 unidad de SKU002"            │
│ 12. Más tarde, recibe la unidad faltante                 │
│ 13. Estado cambia a REC (completo)                       │
└───────────────────────────────────────────────────────────┘
```

---

## 14. Conclusión

Este sistema de gestión de bodegas proporciona:

1. **Multi-Tenancy Completo:** Aislamiento total de datos entre tiendas
2. **Gestión de Inventario Robusta:** Control de stock por bodega con reservas
3. **Sistema de Traslados Flexible:** Soporte para tránsito, recepciones parciales, cancelaciones
4. **API RESTful:** Endpoints claros y documentados
5. **Frontend Moderno:** React con experiencia de usuario intuitiva
6. **Validaciones Complejas:** Protección de integridad de datos en todas las operaciones
7. **Auditoría:** Registro de fechas y usuarios en todas las operaciones críticas

El sistema está diseñado para escalabilidad y mantenibilidad, siguiendo las mejores prácticas de Django y React.

---

**Documento creado:** 2026-02-05
**Versión:** 1.0
**Autor:** Sistema de Documentación Automática
