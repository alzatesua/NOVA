# Resumen de Cambios en EcommerceView.jsx - Conección API Productos

## Fecha: 2025-02-14

### Cambios Realizados

#### 1. Importación Actualizada (Línea 2)
**Antes:**
```javascript
import { fetchProducts } from '../services/api';
```

**Ahora:**
```javascript
import { fetchProductosEcommerce } from '../services/api';
```

**Razón:** Usar la nueva API multi-tenant de e-commerce en lugar de la API anterior que requiere autenticación.

---

#### 2. Función de Transformación Agregada (Líneas 229-243)

**Propósito:** Convertir el formato de respuesta de la API (campos anidados) al formato que espera el componente (campos planos).

**Función:**
```javascript
const transformarProducto = (productoAPI) => {
  return {
    // Campos básicos
    id: productoAPI.id,
    sku: productoAPI.sku,
    nombre: productoAPI.nombre,
    descripcion: productoAPI.descripcion,
    stock: productoAPI.stock,
    estado: productoAPI.estado,

    // Campos transformados (anidados → planos)
    precio_venta: productoAPI.precio,
    categoria_nombre: productoAPI.categoria?.nombre || null,
    marca_nombre: productoAPI.marca?.nombre || null,
    iva_porcentaje: productoAPI.iva?.porcentaje || null,
    descuento_porcentaje: productoAPI.descuento?.porcentaje || null,
    tipo_medida_nombre: productoAPI.tipo_medida?.nombre || null,

    // Campos adicionales
    codigo_barras: productoAPI.codigo_barras,
    imei: productoAPI.imei,
    imagen: productoAPI.imagen_producto || null,
    atributo: productoAPI.atributo,
    valor_atributo: productoAPI.valor_atributo,
    creado_en: productoAPI.creado_en,
  };
};
```

**Mapeo de Campos:**

| Campo API Backend | Campo Frontend | Transformación |
|-------------------|----------------|---------------|
| `precio` | `precio_venta` | String decimal |
| `categoria.nombre` | `categoria_nombre` | Extrae nombre de objeto anidado |
| `marca.nombre` | `marca_nombre` | Extrae nombre de objeto anidado |
| `iva.porcentaje` | `iva_porcentaje` | Extrae porcentaje de objeto anidado |
| `descuento.porcentaje` | `descuento_porcentaje` | Extrae porcentaje de objeto anidado |
| `tipo_medida.nombre` | `tipo_medida_nombre` | Extrae nombre de objeto anidado |
| `imagen_producto` | `imagen` | Renombra para compatibilidad |

---

#### 3. useEffect de Carga de Productos Actualizado (Líneas 246-400)

**Antes:**
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

**Ahora:**
```javascript
const response = await fetchProductosEcommerce({
  subdominio: subdominio
});

// La nueva API retorna: { ok, mensaje, total_productos, data }
if (response.ok && response.data && Array.isArray(response.data) && response.data.length > 0) {
  // Transformar productos al formato que espera el componente
  productos = response.data.map(transformarProducto);
} else {
  console.log('No hay productos en backend, usando productos de ejemplo');
}
```

**Cambios Clave:**
1. ✅ Usa `fetchProductosEcommerce` en lugar de `fetchProducts`
2. ✅ Extrae `response.data` en lugar de `datos`
3. ✅ Aplica función `transformarProducto` a cada producto
4. ✅ Mantiene fallback a productos de ejemplo si API falla o no tiene datos

---

## Flujo de Datos Actual

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend: EcommerceView.jsx                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ 1. Extrae subdominio del hostname
                           │    (ej: "mi-tienda")
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
│  Backend: SubdomainMixin → views_productosEcomerce.py │
│  - Busca en tabla Dominios                              │
│  - Obtiene Tienda con credenciales BD                    │
│  - Conecta a BD específica de la tienda                    │
│  - Ejecuta query productos                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ 3. Retorna JSON con campos anidados
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend: transformarProducto()                           │
│  - Convierte anidados a planos                           │
│  - Renombra campos para compatibilidad                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend: Estado de React                              │
│  products, setProducts                                   │
│  filteredProducts, setFilteredProducts                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend: UI Rendering                                  │
│  - Muestra productos en cards                             │
│  - Filtra por categoría, búsqueda                         │
│  - Carrito de compras                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Problemas Visuales Conocidos

### ⚠️ Posibles Problemas:

1. **Typos en código**
   - El archivo tiene typos como `ategoria`, `marca`, `descuento`, `medida`
   - Estos están en el código original, NO fueron introducidos por mí

2. **Formato de Datos**
   - Si la API no retorna datos o hay error, se usan productos de ejemplo
   - Los productos de ejemplo pueden tener formato diferente

3. **Contraseñas de Campos**
   - La API retorna strings para valores numéricos (`precio`, `porcentaje`)
   - El componente espera strings (usa `parseFloat()`)

4. **Subdominio No Encontrado**
   - Si el subdominio no existe en BD, la API retorna error 401
   - Esto puede causar que no se vean productos

---

## Necesito Tu Ayuda

Para poder identificar y corregir el problema visual específico, necesito que me proporciones:

1. **Captura de pantalla** del problema visual que ves
2. **Consola del navegador** (F12) con algún error JavaScript
3. **Descripción específica** de qué se ve mal:
   - ¿Los productos no se muestran?
   - ¿Los productos se muestran pero mal formateados?
   - ¿Faltan datos (precio, stock, etc.)?
   - ¿El diseño/estilos están rotos?

4. **URL exacta** que estás usando para probar:
   ```
   https://dagi.co/
   o
   https://mi-tienda.nova.dagi.co/ (si existe)
   ```

---

## Cómo Verificar si la API Funciona

### Opción 1: Console del Navegador
```javascript
// Abrir https://dagi.co/
// Presionar F12 (DevTools)
// Ir a pestaña Console
// Ejecutar:

fetch('/api/productos/list/', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({subdominio: 'mi-tienda'})
})
.then(r => r.json())
.then(data => {
  console.log('Respuesta API:', data);
  console.log('Productos:', data.data);
  console.log('Primer producto:', data.data[0]);
})
.catch(err => console.error('Error:', err));
```

### Opción 2: Curl (Terminal)
```bash
curl -X POST https://dagi.co/api/productos/list/ \
  -H 'Content-Type: application/json' \
  -d '{"subdominio": "mi-tienda"}' | jq
```

---

## Archivos Modificados

1. **[frontend/src/components/EcommerceView.jsx](frontend/src/components/EcommerceView.jsx)**
   - Línea 2: Importación actualizada
   - Líneas 229-243: Función transformarProducto
   - Líneas 246-400: useEffect actualizado

2. **[frontend/src/services/api.js](frontend/src/services/api.js)**
   - Líneas 241-251: Función fetchProductosEcommerce existente (creada previamente)

3. **[backend/main_dashboard/views_productosEcomerce.py](backend/main_dashboard/views_productosEcomerce.py)**
   - Líneas 16-82: SubdomainMixin
   - Líneas 85-171: ProductoView

---

## Próximos Pasos

Con tu ayuda identificando el problema visual específico, podré:

1. ✅ Mantener la conexión a la API (SÍ conservar esto)
2. ✅ Corregir el problema visual que identifiques
3. ✅ Asegurar que todo funcione correctamente

Por favor, proporcióname la información solicitada arriba para poder ayudarte mejor.
