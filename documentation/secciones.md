# Secciones del Componente EcommerceView

Documentación detallada de las 5 secciones principales del componente de ecommerce.

## Tabla de Contenidos

- [Sección de Inicio](#sección-de-inicio)
- [Sección de Nosotros](#sección-de-nosotros)
- [Sección de Productos](#sección-de-productos)
- [Sección de Contacto](#sección-de-contacto)
- [Sección de Infórmate](#sección-de-infórmate)
- [Sistema de Navegación](#sistema-de-navegación)

---

## Sección de Inicio

**Estado activador**: `activeSection === 'inicio'`

### Contenido
- **Hero Section** con fondo animado degradado
- **Formas flotantes** animadas (círculos, rayos/relámpagos)
- **Estadísticas**: 8+ productos, 100% ecológico, 60km autonomía
- **Categorías destacadas**: Las primeras 4 categorías con emojis
- **Productos destacados**: Los primeros 3 productos del catálogo

### Características
- Badge animado "🌱 100% Sostenible"
- Título principal con sombra para legibilidad
- Dos botones CTA:
  - "⚡ Ver Productos" - Navega a sección productos
  - "🌱 Conoce Más" - Navega a sección nosotros
- Estadísticas en grid de 3 columnas
- Animaciones de entrada (slideUp, fadeIn)

### Código de Referencia
```jsx
{activeSection === 'inicio' && (
  <div>
    {/* Hero con animado degradado */}
    <div className="animated-bg rounded-3xl shadow-2xl overflow-hidden">
      {/* Formas flotantes */}
      <div className="floating-shape" />
      <div className="floating-bolt">⚡</div>
      {/* ... más formas */}

      {/* Contenido del hero */}
      <h1>Bienvenidos</h1>
      <p>Tu destino para movilidad eléctrica</p>
      <button onClick={() => setActiveSection('productos')}>
        ⚡ Ver Productos
      </button>
    </div>

    {/* Categorías destacadas */}
    <div className="grid grid-cols-2 md:grid-cols-4">
      {categories.slice(0, 4).map(category => (
        <button onClick={() => {
          setActiveSection('productos');
          setActiveCategory(category);
        }}>
          {getCategoryEmoji(category)} {category}
        </button>
      ))}
    </div>

    {/* Productos destacados */}
    <div className="grid grid-cols-1 md:grid-cols-3">
      {products.slice(0, 3).map(product => (
        <ProductCard product={product} />
      ))}
    </div>
  </div>
)}
```

---

## Sección de Nosotros

**Estado activador**: `activeSection === 'nosotros'`

### Contenido
- **Título principal**: "Sobre Nosotros"
- **Nuestra Misión**: Descripción del compromiso con movilidad sostenible
- **Por Qué Elegirnos**: 3 pilares (100% Ecológico, Alta Potencia, Garantía Premium)
- **Compromiso Ambiental**: Información sobre prácticas sostenibles

### Estructura
1. Header con título
2. Card principal con misión (beigeCrema background)
3. Grid de 3 columnas con beneficios:
   - 🌱 100% Ecológico
   - ⚡ Alta Potencia
   - 🛡️ Garantía Premium
4. Card secundario con compromiso ambiental (verdeMenta background)

### Código de Referencia
```jsx
{activeSection === 'nosotros' && (
  <div className="py-8 px-4">
    <h1>Sobre Nosotros</h1>

    {/* Misión */}
    <div style={{ backgroundColor: COLORS.beigeCrema }}>
      <h2>Nuestra Misión</h2>
      <p>En {nombreTienda}, estamos comprometidos con revolucionar...</p>
    </div>

    {/* Beneficios */}
    <div className="grid grid-cols-3 gap-6">
      <div>
        <div className="text-5xl mb-2">🌱</div>
        <h3>100% Ecológico</h3>
        <p>Todos nuestros productos son cero emisiones</p>
      </div>
      {/* ... más beneficios */}
    </div>
  </div>
)}
```

---

## Sección de Productos

**Estado activador**: `activeSection === 'productos'`

### Contenido
- **Filtros de categoría**: Botones horizontales con todas las categorías
- **Grid de productos**: Responsive (2-4 columnas según pantalla)
- **Tarjetas de producto**: Imagen, nombre, descripción, precio, botón agregar
- **Vacio state**: Mensaje cuando no hay productos que coinciden con filtros

### Estados Relacionados
- `activeCategory` - Categoría actualmente seleccionada (null = todas)
- `searchQuery` - Texto de búsqueda actual
- `filteredProducts` - Productos filtrados para mostrar

### Funcionalidades
- **Filtrado por categoría**: Actualiza `filteredProducts`
- **Búsqueda en tiempo real**: Filtra por nombre y descripción
- **Responsive grid**:
  - Móvil (<576px): 2 columnas
  - Tablet (576-991px): 2 columnas
  - Desktop (992px+): 3-4 columnas
- **Click en producto**: Abre modal con detalles

### Código de Referencia
```jsx
{activeSection === 'productos' && (
  <div>
    {/* Filtros de categoría */}
    <div className="flex gap-2 overflow-x-auto">
      <button
        onClick={() => setActiveCategory(null)}
        className={activeCategory === null ? 'active' : ''}
      >
        Todas
      </button>
      {categories.map(category => (
        <button
          key={category}
          onClick={() => setActiveCategory(category)}
          className={activeCategory === category ? 'active' : ''}
        >
          {getCategoryEmoji(category)} {category}
        </button>
      ))}
    </div>

    {/* Grid de productos */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredProducts.map(product => (
        <div key={product.id} onClick={() => {
          setSelectedProduct(product);
          setShowProductModal(true);
        }}>
          <h3>{product.nombre}</h3>
          <p>{product.descripcion}</p>
          <p>${product.precio_venta}</p>
          <button onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}>
            Agregar al Carrito
          </button>
        </div>
      ))}
    </div>
  </div>
)}
```

---

## Sección de Contacto

**Estado activador**: `activeSection === 'contacto'`

### Contenido
- **Sin video de fondo** - Diseño limpio con fondo claro
- **Título**: "Contáctanos" con color oscuro
- **Grid de 2 columnas**:
  1. **Información de contacto**:
     - 📍 Dirección
     - 📞 Teléfono
     - ✉️ Email
     - ⏰ Horario
     - Redes sociales (WhatsApp, Facebook, Instagram, YouTube)
  2. **Formulario de mensaje**:
     - Nombre completo
     - Correo electrónico
     - Mensaje
     - Botón enviar

### Características
- Fondo claro (`COLORS.grisClaro`)
- Cards con backdrop-blur (`bg-white/90`)
- Botón de envío con `COLORS.verdePrincipal`
- Iconos sociales con colores de marca

### Código de Referencia
```jsx
{activeSection === 'contacto' && (
  <div style={{ backgroundColor: COLORS.grisClaro }}>
    <h1 style={{ color: COLORS.verdeOscuro }}>Contáctanos</h1>

    <div className="grid md:grid-cols-2 gap-8">
      {/* Información de contacto */}
      <div className="rounded-2xl bg-white/90">
        <h2>Información de Contacto</h2>
        <div>
          <span>📍</span>
          <p>Calle Principal #123, Ciudad</p>
          {/* ... más info */}
        </div>

        {/* Redes sociales */}
        <div className="flex space-x-4">
          <a href={`https://wa.me/${whatsappNumber}`}>
            WhatsApp
          </a>
          {/* ... más redes */}
        </div>
      </div>

      {/* Formulario */}
      <div className="rounded-2xl bg-white/90">
        <h2>Envíanos un Mensaje</h2>
        <form>
          <input type="text" placeholder="Tu nombre" />
          <input type="email" placeholder="tu@email.com" />
          <textarea rows="4" placeholder="¿En qué podemos ayudarte?" />
          <button type="button">Enviar Mensaje</button>
        </form>
      </div>
    </div>
  </div>
)}
```

---

## Sección de Infórmate

**Estado activador**: `activeSection === 'informate'`

### Contenido
Sección informativa sobre legislación colombiana de vehículos eléctricos:

1. **Clasificación de vehículos**:
   - Bicicletas eléctricas (<250W, 25km/h)
   - Motocicletas eléctricas (>250W)
   - Scooters eléctricos
   - Monopatines eléctricos

2. **Requisitos legales**:
   - Licencia de conducción
   - Matrícula vehicular (RUNT)
   - SOAT
   - Tecnomecánica
   - Impuestos

3. **Beneficios en Colombia**:
   - Exento de IVA
   - Pico y placa flexibilizado
   - Tarifas reducidas
   - Parquederos gratuitos

4. **Normas de circulación**:
   - Uso de ciclovías
   - Carriles exclusivos
   - Elementos de seguridad

5. **Fuentes oficiales**: Enlaces a Ministerios, RUNT, DIAN

### Características
- Diseño con cards de colores (`beigeCrema`)
- Grid responsive para información
- Emojis para mejor UX
- Enlaces externos a fuentes oficiales
- Nota de advertencia sobre variaciones locales

### Código de Referencia
```jsx
{activeSection === 'informate' && (
  <div style={{ backgroundColor: COLORS.grisClaro }}>
    <h1>🇨🇴 Legislación Vehículos Eléctricos</h1>

    {/* Introducción */}
    <div className="rounded-2xl bg-white">
      <h2>¿Qué necesitas saber?</h2>
      <p>En Colombia, los vehículos eléctricos...</p>
    </div>

    {/* Clasificación */}
    <div className="grid md:grid-cols-2 gap-4">
      <div style={{ backgroundColor: COLORS.beigeCrema }}>
        <h3>Bicicletas Eléctricas</h3>
        <ul>
          <li>⚡ Potencia menor a 250W</li>
          <li>📋 NO requieren licencia</li>
          {/* ... más items */}
        </ul>
      </div>
      {/* ... más clasificaciones */}
    </div>

    {/* Requisitos */}
    <div className="rounded-2xl bg-white">
      <h2>📋 Documentos y Requisitos</h2>
      {/* ... tablas de requisitos */}
    </div>

    {/* Beneficios */}
    <div style={{ backgroundColor: COLORS.verdeMenta + '30' }}>
      <h2>🎁 Beneficios</h2>
      <div className="grid md:grid-cols-3">
        <div>💰 Exento de IVA</div>
        {/* ... más beneficios */}
      </div>
    </div>
  </div>
)}
```

---

## Sistema de Navegación

### Navbar Superior

**Componente**: Bootstrap Navbar con estilo personalizado

#### Botones de Navegación
- 🏠 **Inicio** - Icono House
- 👥 **Nosotros** - Icono Users
- 🛒 **Productos** - Icono ShoppingCart
- 📞 **Contacto** - Icono Phone
- 📖 **Infórmate** - Icono BookOpen
- 📊 **Categorías** - Icono Grid3x3 (dropdown)

#### Estilo
- Clase: `.nav-btn-futuristic`
- Background: `rgba(46, 125, 50, 0.15)` con borde
- Hover: Efecto shimmer con transición de 0.6s
- Active: Glow verde con sombra

#### Dropdown de Categorías
- Clase: `.nav-dropdown-futuristic`
- Fondo: `rgba(27, 94, 32, 0.98)` con blur
- Items con hover effect (translateX + background)
- Transición de fade-in (0.2s)

### Barra de Búsqueda
- Input de texto con placeholder "Buscar..."
- Filtrado en tiempo real
- Navegación automática a sección productos al buscar

### Carrito de Compras
- Icono con badge de cantidad
- Click abre dropdown o envía a WhatsApp
- Requiere autenticación para completar pedido

### Toggle de Modo Oscuro
- 🌙 Icono Moon para modo claro
- ☀️ Icono Sun para modo oscuro
- Persistencia en localStorage

### Menú de Usuario
- Dropdown cuando está logueado
- Muestra: "Mis Cupones", "Cerrar Sesión"
- Badge con número de cupones disponibles

#### Código de Referencia
```jsx
<Navbar bg="success" expand="lg">
  <Navbar.Brand onClick={() => setActiveSection('inicio')}>
    ⚡ {nombreTienda}
  </Navbar.Brand>

  <Navbar.Collapse>
    <Nav className="d-flex gap-3">
      <button onClick={() => setActiveSection('inicio')}
        className={activeSection === 'inicio' ? 'active' : ''}>
        <House size={18} />
        <span>Inicio</span>
      </button>
      {/* ... más botones */}

      {/* Dropdown de categorías */}
      {categories.length > 0 && (
        <div ref={dropdownRef}>
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <Grid3x3 size={18} />
            <span>Categorías</span>
            <ChevronDown />
          </button>
          {isDropdownOpen && <DropdownMenu />}
        </div>
      )}
    </Nav>

    {/* Carrito y búsqueda */}
    <div className="d-flex gap-3">
      <button onClick={handleCartClick}>
        <ShoppingCart />
        {cartItemCount > 0 && <Badge>{cartItemCount}</Badge>}
      </button>

      <button onClick={toggleDarkMode}>
        {darkMode ? <Sun /> : <Moon />}
      </button>

      <Form.Control
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Buscar..."
      />
    </div>
  </Navbar.Collapse>
</Navbar>
```

---

## Footer

### Contenido
- **3 columnas** responsive
  1. 📍 Dirección y contacto
  2. 🔗 Links útiles
  3. 🌐 Redes sociales

### Características
- **Video de fondo**: `/videos/patinetas.mp4`
- **Overlay oscuro**: `rgba(0, 0, 0, 0.7)` para legibilidad
- **Links animados**: Hover con underline y scale
- **Iconos sociales**: Colores de marca (WhatsApp verde, Facebook azul, etc.)

### Código de Referencia
```jsx
<footer style={{ position: 'relative', overflow: 'hidden' }}>
  {/* Video de fondo */}
  <video
    src="/videos/patinetas.mp4"
    autoPlay
    muted
    loop
    style={{
      position: 'absolute',
      objectFit: 'cover',
      zIndex: 0
    }}
  />

  {/* Overlay */}
  <div style={{
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1
  }} />

  {/* Contenido */}
  <div className="grid grid-cols-1 md:grid-cols-3" style={{ zIndex: 2 }}>
    {/* Columna 1: Dirección */}
    <div>
      <h3>📍 {nombreTienda}</h3>
      <p>Calle Principal #123</p>
      {/* ... más info */}
    </div>

    {/* Columna 2: Links */}
    <div>
      <h3>🔗 Links Útiles</h3>
      <button onClick={() => setActiveSection('nosotros')}>
        ¿Quiénes Somos?
      </button>
      {/* ... más links */}
    </div>

    {/* Columna 3: Redes */}
    <div>
      <h3>🌐 Síguenos</h3>
      <div className="flex gap-4">
        <a href={`https://wa.me/${whatsappNumber}`}>
          WhatsApp
        </a>
        {/* ... más redes */}
      </div>
    </div>
  </div>
</footer>
```

---

## Estados Globales de Navegación

### `activeSection`
- **Tipo**: `string`
- **Valores posibles**: `'inicio' | 'nosotros' | 'productos' | 'contacto' | 'informate'`
- **Por defecto**: `'inicio'`
- **Función**: Controla qué sección se muestra

### `isDropdownOpen`
- **Tipo**: `boolean`
- **Controla**: Visibilidad del dropdown de categorías
- **Refer**: `dropdownRef` para detectar clicks fuera

### `showUserDropdown`
- **Tipo**: `boolean`
- **Controla**: Visibilidad del dropdown de usuario
- **Refer**: `userDropdownRef` para detectar clicks fuera

## Hooks de Efecto

```jsx
// Cerrar dropdowns al cambiar sección
useEffect(() => {
  setIsDropdownOpen(false);
}, [activeSection]);

// Cerrar dropdowns al click fuera
useEffect(() => {
  const handleClickOutside = (event) => {
    if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
      setShowUserDropdown(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [showUserDropdown]);
```

---

[← Volver a README](./README.md) | [Ver funcionalidades →](./funcionalidades.md) | [Ver estilos →](./estilos.md)
