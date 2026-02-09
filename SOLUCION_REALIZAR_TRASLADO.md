# Solución - Filtro de Productos en RealizarTraslado

## Problema
Cuando se filtraba productos por bodega en `ProductosView` y luego se intentaba crear un traslado, **no aparecían productos en el select** porque el filtro comparaba la propiedad `bodega` del producto (que podía ser diferente a la bodega filtrada).

## Causa
En `RealizarTraslado.jsx` línea 598 (antes):
```javascript
productos
  .filter(p => Number(p.bodega ?? p.bodega_id ?? p.id_bodega) === Number(product.bodega_origen))
```

Cuando los productos venían de `obtenerProductosPorBodega`:
- `p.bodega_id` = ID de la bodega de la que se obtuvieron los datos
- `p.bodega` = Bodega "asignada" del producto (podría ser diferente)
- El filtro fallaba si no coincidían

## Solución Implementada

### 1. Importación del API
```javascript
import { obtenerProductosPorBodega } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
```

### 2. Estados para Productos por Bodega
```javascript
const [productosPorBodegaOrigen, setProductosPorBodegaOrigen] = useState({});
const [isLoadingProductosBodega, setIsLoadingProductosBodega] = useState(false);
```

### 3. Función Mejorada `sameBodega`
```javascript
const sameBodega = (p, bodegaOrigen) => {
  // Si el producto viene de productosPorBodega, tiene bodega_id
  if (p.bodega_id !== undefined && p.bodega_id !== null) {
    return Number(p.bodega_id) === Number(bodegaOrigen);
  }
  // Si no, usar las propiedades normales
  return Number(p.bodega ?? p.bodega_id ?? p.id_bodega) === Number(bodegaOrigen);
};
```

### 4. Carga Automática de Productos por Bodega
```javascript
useEffect(() => {
  newProducts.forEach((product) => {
    if (product.bodega_origen && !productosPorBodegaOrigen[product.bodega_origen]) {
      cargarProductosParaBodega(product.bodega_origen);
    }
  });
}, [newProducts.map(p => p.bodega_origen).join(','), subdominio, usuario, tokenUsuario]);
```

### 5. Select Inteligente
Ahora el select de productos:
1. **Primero** intenta usar productos específicos de la bodega de origen (`productosPorBodegaOrigen`)
2. **Segundo** hace fallback a productos generales con filtro `sameBodega`
3. Muestra stock disponible (`disponible_bodega`) cuando está disponible
4. Muestra indicador de carga cuando está obteniendo productos

## Archivos Modificados
1. `/home/dagi/nova/frontend/src/components/bodegas/sections/RealizarTraslado.jsx`
   - Import de `obtenerProductosPorBodega`
   - Import de `useAuth`
   - Estados `productosPorBodegaOrigen` e `isLoadingProductosBodega`
   - Función `cargarProductosParaBodega`
   - Función `sameBodega` mejorada
   - Select de productos actualizado

## Flujo de Uso

### Caso 1: Usuario Filtra por Bodega Primero
1. Usuario filtra por "Bodega 1" en ProductosView
2. Usuario va a realizar traslado
3. Selecciona "Bodega 1" como origen
4. ** Sistema automáticamente carga productos de Bodega 1** ✅
5. Select muestra todos los productos de Bodega 1

### Caso 2: Usuario NO Filtra por Bodega
1. Usuario va a realizar traslado
2. Selecciona "Bodega 1" como origen
3. ** Sistema carga productos de Bodega 1** ✅
4. Select muestra todos los productos de Bodega 1

## Logs de Debugging
El sistema ahora muestra logs en la consola:
```
[RealizarTraslado] Cargando productos para bodega: 1
[RealizarTraslado] Productos recibidos para bodega: 1 17
```

## Resultado
✅ **Los productos ahora aparecen correctamente en el select**
✅ **Funciona tanto si se filtra por bodega primero como si no**
✅ **Carga automática de productos por bodega**
✅ **Muestra stock disponible real de la bodega**
