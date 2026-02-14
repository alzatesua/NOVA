# EcommerceView - Componente Principal de Ecommerce

## Descripción General

Componente principal de ecommerce para movilidad eléctrica que implementa una tienda online completa con múltiples funcionalidades como catálogo de productos, gestión de carrito, sistema de autenticación, cupones de descuento y reseñas de productos.

## Versión

- **Versión**: VERSIÓN VIDEO ACTUALIZADA
- **Fecha de compilación**: Dinámica (se actualiza al renderizar)
- **Branch actual**: jonathan
- **Últimos cambios**: Modificaciones en front-end para facturación y sistema de análisis de datos

## Tecnologías Utilizadas

- **React 18.x** - Biblioteca principal de UI
- **React Bootstrap** - Componentes de UI pre-construidos
- **Lucide React** - Biblioteca de iconos
- **Tailwind CSS** - Para estilos personalizados
- **JavaScript ES6+** - Lógica de negocio

## Características Principales

### Secciones del Sitio
- ✅ **Inicio** - Página de bienvenida con productos destacados
- ✅ **Nosotros** - Información sobre la empresa
- ✅ **Productos** - Catálogo completo con filtrado
- ✅ **Contacto** - Formulario de contacto con video de fondo
- ✅ **Infórmate** - Legislación de vehículos eléctricos en Colombia

### Funcionalidades del Ecommerce
- 🛒 **Sistema de carrito** completo con gestión de items
- 👤 **Autenticación de usuarios** (login/registro)
- 🎁 **Sistema de cupones** y descuentos
- ⭐ **Sistema de reseñas** con fotos de clientes
- 📱 **Integración con WhatsApp** para completar pedidos
- 🔍 **Búsqueda y filtrado** de productos en tiempo real
- 🌓 **Modo oscuro/claro** completo

### Características Técnicas
- 📱 **Diseño responsive** completo (móvil, tablet, desktop)
- ♿ **Accesibilidad** con colores de alto contraste
- 🎨 **Paleta de colores ecológica** para marca de movilidad sostenible
- 💾 **Persistencia local** con localStorage para datos de usuario y cupones
- 🔄 **Carga dinámica** de productos desde backend con fallback

## Estructura del Componente

```jsx
export default function EcommerceView() {
  // Estados principales
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  // ... más estados

  // Hooks useEffect para lógica de negocio
  // ... efectos

  // Renderizado condicional por sección
  return (
    <div>
      <Navbar />
      <main>
        {activeSection === 'inicio' && <InicioSection />}
        {activeSection === 'productos' && <ProductosSection />}
        {/* ... más secciones */}
      </main>
      <Footer />
    </div>
  );
}
```

## Configuración

### Variables de Entorno
- `nombreTienda` - Obtenido de localStorage (`nombre_tienda`)
- `whatsappNumber` - Obtenido de localStorage (`whatsapp_number`)
- `subdominio` - Obtenido del hostname actual

### Dependencias Externas
```javascript
import { fetchProducts } from '../services/api';
```

## Notas de Desarrollo

### Video de Fondo en Contacto
El video de fondo de la sección de contacto tiene configuración especial:
- Múltiples intentos de reproducción (0ms, 100ms, 500ms, 1000ms)
- Fallback a controles manuales si autoplay falla
- Console logging extensivo para debugging

### Modo Oscuro
- Implementado con clases CSS dinámicas
- Persistencia en localStorage
- Transiciones suaves entre modos

### Carrito de Compras
- Requiere autenticación para agregar productos
- Mensajes de confirmación con alert()
- Integración directa con WhatsApp API

## Archivos Relacionados

- [`secciones.md`](./secciones.md) - Documentación detallada de cada sección
- [`funcionalidades.md`](./funcionalidades.md) - Lógica de negocio y funciones
- [`estilos.md`](./estilos.md) - Paleta de colores y estilos

## Información de Soporte

Para preguntas o problemas relacionados con este componente, consulte:
- Documentación adicional en los archivos `.md` de este directorio
- Código fuente en `/home/dagi/nova/frontend/src/components/EcommerceView.jsx`
