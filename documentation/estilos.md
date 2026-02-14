# Estilos y Paleta de Colores - EcommerceView

Documentación completa de estilos, colores y configuraciones visuales del componente EcommerceView.

## Tabla de Contenidos

- [Paleta de Colores Principal](#paleta-de-colores-principal)
- [Paleta de Modo Oscuro](#paleta-de-modo-oscuro)
- [Estilos por Componente](#estilos-por-componente)
- [Emojis por Categoría](#emojis-por-categoría)
- [Animaciones y Transiciones](#animaciones-y-transiciones)

---

## Paleta de Colores Principal

La paleta está diseñada para una marca de movilidad eléctrica, usando colores que evocan sostenibilidad y tecnología.

```javascript
const COLORS = {
  // COLORES PRIMARIOS (Verdes - Sostenibilidad)
  verdePrincipal: '#2E7D32',      // Forest Green - Color principal de marca
  verdeSecundario: '#4CAF50',     // Green - Estados hover
  verdeMenta: '#81C784',          // Light Green - Acentos suaves
  verdeOscuro: '#1B5E20',         // Dark Green - Textos importantes

  // COLORES NEUTROS
  beigeCrema: '#FFF8E1',          // Cream - Fondos cálidos
  blanco: '#FFFFFF',                // White - Fondos limpios
  grisClaro: '#F5F5F5',          // Light Gray - Fondos sutiles
  grisMedio: '#757575',           // Medium Gray - Textos secundarios
  grisOscuro: '#424242',          // Dark Gray - Textos principales
  negro: '#212121',                // Near Black - Contraste máximo

  // COLORES DE ACENTO
  acentoNaranja: '#FFA726',       // Orange - CTAs principales
  acentoTurquesa: '#26A69A',      // Turquoise - Detalles técnicos
};
```

### Descripción de Colores

| Color | Hex | Uso Principal | Ejemplo |
|-------|-----|---------------|----------|
| `verdePrincipal` | #2E7D32 | Botones principales, headers, navbar | |
| `verdeSecundario` | #4CAF50 | Hover states, elementos activos | |
| `verdeMenta` | #81C784 | Fondos suaves, badges | |
| `verdeOscuro` | #1B5E20 | Títulos importantes, links | |
| `beigeCrema` | #FFF8E1 | Cards con tono cálido | |
| `blanco` | #FFFFFF | Fondos limpios, cards | |
| `grisClaro` | #F5F5F5 | Fondos sutiles, separadores | |
| `grisMedio` | #757575 | Textos secundarios, placeholders | |
| `grisOscuro` | #424242 | Textos principales | |
| `negro` | #212121 | Contraste máximo | |
| `acentoNaranja` | #FFA726 | Botones CTA, alerts | |
| `acentoTurquesa` | #26A69A | Iconos técnicos, detalles | |

---

## Paleta de Modo Oscuro

```javascript
const DARK_COLORS = {
  background: '#1a1a1a',        // Fondo principal
  cardBackground: '#2d2d2d',     // Fondos de cards
  textPrimary: '#ffffff',          // Texto principal
  textSecondary: '#b0b0b0',      // Texto secundario
  borderColor: '#404040',        // Bordes de inputs
  navbarBackground: '#212121',    // Background del navbar
  inputBackground: '#3d3d3d',     // Fondos de inputs
};
```

### Transición entre Modos

```javascript
// Clase aplicada al body
document.body.classList.toggle('dark-mode');

// Transición suave
body {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

---

## Estilos por Componente

### Navbar

#### Estilo Base
```css
.navbar {
  background: linear-gradient(135deg, #2E7D3299, #1B5E20CC);
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
}
```

#### Botones de Navegación (.nav-btn-futuristic)

```css
.nav-btn-futuristic {
  position: relative;
  padding: 12px 24px;
  border-radius: 25px;
  background: rgba(46, 125, 50, 0.15);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(46, 125, 50, 0.4);
  color: #E8F5E9;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

/* Iconos SVG */
.nav-btn-futuristic svg {
  color: #E8F5E9;
  stroke: #E8F5E9;
}

/* Efecto shimmer en hover */
.nav-btn-futuristic::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(129, 199, 132, 0.3), transparent);
  transition: left 0.6s ease;
}

.nav-btn-futuristic:hover::before {
  left: 100%;
}

.nav-btn-futuristic:hover {
  background: rgba(46, 125, 50, 0.25);
  border-color: rgba(76, 175, 80, 0.7);
  box-shadow: 0 0 25px rgba(76, 175, 80, 0.4);
  transform: translateY(-2px) scale(1.03);
}

/* Estado activo */
.nav-btn-futuristic.active {
  background: rgba(76, 175, 80, 0.3);
  border-color: rgba(76, 175, 80, 0.8);
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.4);
  transform: scale(1.05);
}
```

#### Dropdown (.nav-dropdown-futuristic)

```css
.nav-dropdown-futuristic {
  background: rgba(27, 94, 32, 0.98);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(76, 175, 80, 0.5);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 15px rgba(76, 175, 80, 0.3);
}

.dropdown-item {
  color: #FFF;
  transition: all 0.3s ease;
  border-radius: 10px;
  margin: 4px 8px;
  padding: 10px 15px;
}

.dropdown-item:hover {
  background: linear-gradient(135deg, #FFA726, #26A69A);
  transform: translateX(10px);
  box-shadow: 0 0 15px rgba(255, 167, 38, 0.6);
}
```

### Cards de Productos

```css
.product-card {
  background-color: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #F5F5F5;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.product-card:hover {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-5px);
}

/* Modo oscuro */
.dark-mode .product-card {
  background-color: #2d2d2d;
  border-color: #404040;
  color: #ffffff;
}
```

### Botones y CTAs

#### Botón Primario
```css
.btn-primary {
  background-color: #2E7D32;
  color: #FFFFFF;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #1B5E20;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.4);
}
```

#### Botón CTA (Acento Naranja)
```css
.btn-cta {
  background-color: #FFA726;
  color: #FFFFFF;
  padding: 14px 28px;
  border-radius: 8px;
  font-weight: 700;
  transition: all 0.3s ease;
}

.btn-cta:hover {
  background-color: #FB8C00;
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(255, 167, 38, 0.5);
}
```

### Formularios

#### Inputs
```css
.form-control {
  background-color: #F5F5F5;
  color: #424242;
  border: 2px solid #81C784;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.form-control::placeholder {
  color: #757575;
}

/* Modo oscuro */
.dark-mode .form-control {
  background-color: #3d3d3d;
  color: #ffffff;
  border-color: #404040;
}
```

### Hero Section (Inicio)

```css
.hero-bg {
  background: linear-gradient(-45deg,
    #2E7D32,
    #4CAF50,
    #81C784,
    #26A69A,
    #1B5E20
  );
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

### Footer

```css
footer {
  position: relative;
  overflow: hidden;
  background-color: #424242;
}

/* Video de fondo */
footer video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

/* Overlay */
footer-overlay {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1;
  pointer-events: none;
}

/* Contenido */
footer-content {
  position: relative;
  z-index: 2;
}
```

---

## Emojis por Categoría

```javascript
const CATEGORY_EMOJIS = {
  'Scooters': '🛴',
  'Bicicletas': '🚲',
  'Monopatines': '🛹',
  'Hoverboards': '⚡',
  'Accesorios': '🔧',
  'Patinetes': '🛴',
  'default': '⚡'
};
```

### Uso en Código

```jsx
// En botones de categoría
<button>
  {getCategoryEmoji(category)} {category}
</button>

// En cards de producto
<div className="product-icon">
  {product.imagen ? (
    <img src={product.imagen} alt={product.nombre} />
  ) : (
    <span className="text-5xl">
      {getCategoryEmoji(product.categoria_nombre)}
    </span>
  )}
</div>
```

---

## Animaciones y Transiciones

### Keyframes Definidos

```css
/* Gradiente animado */
@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Formas flotantes */
@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.1;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.3;
  }
}

/* Círculos pulsantes */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.5;
  }
}

/* Desplazamiento diagonal */
@keyframes drift {
  0% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(30px, -30px) rotate(120deg); }
  66% { transform: translate(-20px, 20px) rotate(240deg); }
  100% { transform: translate(0, 0) rotate(360deg); }
}

/* Slide hacia arriba */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Glow futurista */
@keyframes glow-futuristic {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.6),
                0 0 40px rgba(255, 167, 38, 0.4),
                inset 0 0 20px rgba(255, 255, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(255, 215, 0, 1),
                0 0 80px rgba(255, 167, 38, 0.6),
                inset 0 0 30px rgba(255, 255, 255, 0.5);
  }
}
```

### Aplicación de Animaciones

```css
/* Categorías */
.category-card {
  animation: slideUp 0.6s ease-out forwards;
  opacity: 0; /* Comienza invisible */
}

/* Productos */
.product-card {
  animation: fadeIn 0.8s ease-out forwards;
  opacity: 0; /* Comienza invisible */
}

/* Formas flotantes en hero */
.floating-shape {
  animation: float 6s ease-in-out infinite;
}

.floating-circle {
  animation: pulse 4s ease-in-out infinite;
}

.floating-bolt {
  animation: drift 20s linear infinite;
  opacity: 0.15;
}
```

### Transiciones Generales

```css
/* Transiciones suaves */
* {
  transition-timing-function: ease-in-out;
  transition-duration: 0.3s;
}

/* Hover effects */
button, a {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Focus states */
input:focus, textarea:focus {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
```

---

## Responsive Breakpoints

```css
/* Extra small devices (phones, less than 576px) */
@media (max-width: 576px) {
  .nav-btn-futuristic {
    padding: 7px 12px;
    font-size: 12px;
  }

  .grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}

/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) {
  .product-card h3 {
    font-size: 14px;
  }
}

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .category-card {
    padding: 12px;
  }
}

/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) {
  .navbar-collapse {
    flex: 1;
    display: flex;
  }

  .nav-btn-futuristic {
    padding: 12px 24px;
  }
}

/* Extra large devices (large desktops, 1200px and up) */
@media (min-width: 1200px) {
  .container {
    max-width: 1140px;
  }
}
```

---

## Clases CSS Dinámicas

```jsx
<style>
  {`
    .dark-mode {
      background-color: ${DARK_COLORS.background} !important;
      color: ${DARK_COLORS.textPrimary} !important;
    }

    .dark-mode .navbar {
      background: linear-gradient(135deg, #1a1a1a99, #2d2d2dCC) !important;
    }

    .dark-mode .card {
      background-color: ${DARK_COLORS.cardBackground} !important;
      color: ${DARK_COLORS.textPrimary} !important;
    }

    /* Animaciones personalizadas */
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }

    .nav-btn-futuristic {
      animation: shimmer 2s infinite;
      background-image: linear-gradient(
        90deg,
        transparent,
        rgba(129, 199, 132, 0.3),
        transparent
      );
      background-size: 200% 100%;
    }
  `}
</style>
```

---

[← Volver a README](./README.md) | [Ver secciones →](./secciones.md) | [Ver funcionalidades →](./funcionalidades.md)
