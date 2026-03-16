# Sección de Caja - Control de Caja

## 📋 Descripción General

La sección de caja es una funcionalidad completa para gestionar todos los movimientos de caja, incluyendo entradas, salidas, cuadre diario y arqueo de caja.

## 📁 Estructura de Archivos

```
frontend/src/components/caja/
├── CajaDashboard.jsx       # Dashboard con métricas principales
├── MovimientosTable.jsx     # Tabla de historial de movimientos
├── RegistroMovimiento.jsx   # Formulario para registrar entradas/salidas
├── CuadreCaja.jsx           # Balance diario y arqueo de caja
└── README.md               # Esta documentación

frontend/src/components/
└── CajaView.jsx            # Vista principal que integra todos los componentes
```

## 🎯 Funcionalidades por Componente

### 1. **CajaDashboard.jsx**
Muestra las métricas principales de caja:
- Saldo inicial del día
- Total de entradas
- Total de salidas
- Saldo actual
- Actualización automática al cambiar la fecha

### 2. **MovimientosTable.jsx**
Historial completo de movimientos:
- Listado paginado de movimientos
- Filtros por tipo (todos, entradas, salidas)
- Información detallada de cada movimiento:
  - Fecha y hora
  - Tipo (entrada/salida)
  - Descripción
  - Método de pago
  - Monto
  - Usuario que registró
- Paginación de resultados

### 3. **RegistroMovimiento.jsx**
Formulario para registrar movimientos:
- Toggle entre entrada/salida
- Campos del formulario:
  - Monto (requerido)
  - Categoría (requerida)
  - Método de pago
  - Descripción (requerida)
- Categorías predefinidas para entradas y salidas
- Validaciones antes de enviar
- Limpieza del formulario después de registro exitoso

### 4. **CuadreCaja.jsx**
Balance y arqueo de caja:
- Resumen del día:
  - Saldo inicial
  - Total entradas
  - Total salidas
  - Saldo esperado
- Desglose por método de pago
- Contador de transacciones
- Funcionalidad de arqueo:
  - Modal para ingresar monto contado
  - Cálculo automático de diferencias
  - Registro del arqueo
- Impresión de reporte de cuadre

### 5. **CajaView.jsx**
Vista principal integradora:
- Selector de fecha
- Tres vistas:
  1. **Vista General**: Dashboard + registro rápido + movimientos recientes
  2. **Movimientos**: Tabla completa con filtros
  3. **Cuadre de Caja**: Balance y arqueo
- Actualización automática de datos

## 🔌 Endpoints del Backend Necesarios

### Base URL
```
/caja
```

### Endpoints Requeridos

#### 1. **Obtener Estadísticas de Caja**
```http
POST /caja/estadisticas
Content-Type: application/json

{
  "fecha": "2024-01-15"  // YYYY-MM-DD
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "saldo_inicial": 1000000,
    "total_entradas": 5000000,
    "total_salidas": 2000000,
    "saldo_actual": 4000000,
    "total_transacciones": 25
  }
}
```

#### 2. **Obtener Movimientos de Caja**
```http
POST /caja/movimientos
Content-Type: application/json

{
  "fecha": "2024-01-15",
  "tipo": "todos",  // "todos", "entrada", "salida"
  "pagina": 1,
  "por_pagina": 20
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "movimientos": [
      {
        "id": 1,
        "fecha_hora": "2024-01-15T10:30:00",
        "tipo": "entrada",
        "descripcion": "Venta de productos",
        "metodo_pago": "efectivo",
        "monto": 150000,
        "usuario_nombre": "Juan Pérez"
      }
    ],
    "total_paginas": 3
  }
}
```

#### 3. **Registrar Movimiento de Caja**
```http
POST /caja/registrar_movimiento
Content-Type: application/json

{
  "tipo": "entrada",  // "entrada" o "salida"
  "monto": 150000,
  "descripcion": "Venta de productos",
  "metodo_pago": "efectivo",
  "categoria": "venta"
}
```

**Categorías de entrada:**
- `venta`: Venta
- `abono`: Abono
- `reembolso`: Reembolso
- `ajuste_positivo`: Ajuste Positivo
- `otra_entrada`: Otra Entrada

**Categorías de salida:**
- `compra`: Compra
- `gasto`: Gasto
- `retiro`: Retiro
- `devolucion`: Devolución
- `ajuste_negativo`: Ajuste Negativo
- `otra_salida`: Otra Salida

**Métodos de pago:**
- `efectivo`: Efectivo
- `transferencia`: Transferencia
- `nequi`: Nequi
- `daviplata`: Daviplata
- `tarjeta`: Tarjeta
- `otro`: Otro

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Movimiento registrado exitosamente",
  "data": {
    "id": 123,
    "fecha_hora": "2024-01-15T10:30:00",
    // ... demás datos del movimiento
  }
}
```

#### 4. **Obtener Cuadre de Caja**
```http
POST /caja/cuadre
Content-Type: application/json

{
  "fecha": "2024-01-15"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "saldo_inicial": 1000000,
    "total_entradas": 5000000,
    "total_salidas": 2000000,
    "saldo_esperado": 4000000,
    "monto_arqueo": 3950000,  // null si no se ha realizado
    "diferencia": -50000,
    "total_transacciones": 25,
    "cantidad_entradas": 15,
    "cantidad_salidas": 10,
    "por_metodo": [
      {
        "metodo": "Efectivo",
        "entradas": 3000000,
        "salidas": 1500000,
        "neto": 1500000
      },
      {
        "metodo": "Transferencia",
        "entradas": 2000000,
        "salidas": 500000,
        "neto": 1500000
      }
    ]
  }
}
```

#### 5. **Realizar Arqueo de Caja**
```http
POST /caja/realizar_arqueo
Content-Type: application/json

{
  "fecha": "2024-01-15",
  "monto_contado": 3950000
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Arqueo realizado exitosamente",
  "data": {
    "monto_arqueo": 3950000,
    "diferencia": -50000,
    "fecha_hora": "2024-01-15T18:30:00"
  }
}
```

## 🎨 Estilos y Diseño

Todos los componentes utilizan:
- **TailwindCSS** para estilos principales
- **Componentes UI reutilizables** (Card, Button, Input, etc.)
- **Soporte para modo oscuro** automático
- **Diseño responsive** para móviles y desktop
- **Iconos SVG** inline para mejor rendimiento
- **Animaciones sutiles** para mejor UX

## 🔐 Autenticación

Todos los endpoints requieren autenticación mediante:
- Token de usuario (JWT)
- Subdominio de la tienda
- Usuario autenticado

Los componentes utilizan el hook `useAuth()` para obtener:
```javascript
const { usuario, tokenUsuario, subdominio } = useAuth();
const authData = { usuario, tokenUsuario, subdominio };
```

## 📱 Responsive Design

- **Desktop (1024px+)**: Layout de 3-4 columnas
- **Tablet (768px-1023px)**: Layout de 2 columnas
- **Mobile (<768px)**: Layout de 1 columna

## 🔄 Flujo de Trabajo

### 1. Vista General (Default)
```
Usuario accede → Vista General
├── Ve métricas principales (Dashboard)
├── Puede registrar movimientos rápidos (Registro)
└── Ve movimientos recientes (Tabla)
```

### 2. Vista Movimientos
```
Usuario hace clic en "Movimientos"
├── Ve tabla completa de movimientos
├── Puede filtrar por tipo
├── Paginar resultados
└── Actualizar datos
```

### 3. Vista Cuadre
```
Usuario hace clic en "Cuadre de Caja"
├── Ve resumen completo del día
├── Puede realizar arqueo
├── Imprimir reporte
└── Ver diferencias
```

## 🛠️ Mantenimiento

### Agregar Nueva Categoría
Editar `RegistroMovimiento.jsx`:
```javascript
const categorias = {
  entrada: [
    // ... existentes
    { value: 'nueva_categoria', label: 'Nueva Categoría' },
  ],
  salida: [
    // ... existentes
  ]
};
```

### Modificar Colores de StatCards
Editar `CajaDashboard.jsx`:
```javascript
<StatCard
  // ...
  color="blue"  // blue, green, purple, orange, red
/>
```

### Agregar Nuevo Método de Pago
Editar `RegistroMovimiento.jsx`:
```javascript
const metodosPago = [
  // ... existentes
  { value: 'nuevo_metodo', label: 'Nuevo Método' },
];
```

## 📊 Reportes

El sistema de cuadre incluye un reporte imprimible con:
- Encabezado con fecha y usuario
- Resumen de movimientos
- Desglose por método de pago
- Resultado del arqueo
- Formato optimizado para impresión

## 🚀 Próximas Mejoras Sugeridas

1. **Exportar a Excel/PDF**: Funcionalidad para exportar movimientos
2. **Gráficos**: Agregar gráficos de tendencias de caja
3. **Alertas**: Notificaciones de discrepancias en arqueos
4. **Histórico**: Comparación con días anteriores
5. **Múltiples cajas**: Soporte para manejar múltiples cajas simultáneas
6. **Cierre de caja**: Funcionalidad formal de cierre/apertura de caja
7. **Auditoría**: Log completo de cambios y quien los realizó

## 📞 Soporte

Para problemas o sugerencias, contactar al equipo de desarrollo.
