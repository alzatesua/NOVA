# Funcionalidades y Lógica de Negocio - EcommerceView

Documentación completa de las funciones y lógica de negocio implementada en el componente EcommerceView.

## Tabla de Contenidos

- [Sistema de Autenticación](#sistema-de-autenticación)
- [Sistema de Carrito](#sistema-de-carrito-de-compras)
- [Sistema de Cupones](#sistema-de-cupones-y-descuentos)
- [Sistema de Reseñas](#sistema-de-reseñas)
- [Integración WhatsApp](#integración-whatsapp)
- [Carga de Productos](#carga-de-productos)
- [Gestión de Modo Oscuro](#gestión-de-modo-oscuro)

---

## Sistema de Autenticación

### Estados Principales

```javascript
// Estados de autenticación
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [customerData, setCustomerData] = useState(null);
const [showAuthModal, setShowAuthModal] = useState(false);
const [isLoginMode, setIsLoginMode] = useState(true);

// Formulario de autenticación
const [authForm, setAuthForm] = useState({
  nombre: '',
  email: '',
  telefono: '',
  direccion: '',
  password: ''
});
```

#### Descripción de Estados

| Estado | Tipo | Descripción |
|---------|-------|-------------|
| `isLoggedIn` | `boolean` | Indica si hay un usuario logueado |
| `customerData` | `object \| null` | Datos completos del cliente logueado |
| `showAuthModal` | `boolean` | Controla visibilidad del modal de auth |
| `isLoginMode` | `boolean` | `true` = login, `false` = registro |
| `authForm` | `object` | Datos del formulario actual |

### Funciones Principales

#### `handleRegister()`

Procesa el registro de nuevos usuarios.

```javascript
const handleRegister = () => {
  // 1. Validar campos requeridos
  if (!authForm.nombre || !authForm.email || !authForm.telefono || !authForm.password) {
    alert('Por favor completa todos los campos requeridos');
    return;
  }

  // 2. Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(authForm.email)) {
    alert('Por favor ingresa un email válido');
    return;
  }

  // 3. Crear objeto de cliente
  const customer = {
    id: Date.now(),
    nombre: authForm.nombre,
    email: authForm.email,
    telefono: authForm.telefono,
    direccion: authForm.direccion || '',
    fechaRegistro: new Date().toISOString(),
    totalCompras: 0,
    reseñas: 0
  };

  // 4. Guardar en localStorage
  localStorage.setItem('ecommerce_customer', JSON.stringify(customer));

  // 5. Actualizar estados
  setCustomerData(customer);
  setIsLoggedIn(true);
  setShowAuthModal(false);
  setAuthForm({ nombre: '', email: '', telefono: '', direccion: '', password: '' });

  // 6. Mostrar confirmación
  alert(`¡Bienvenido/a ${customer.nombre}! 🎉\n\nTu cuenta ha sido creada exitosamente.`);
};
```

#### `handleLogin()`

Procesa el inicio de sesión de usuarios existentes.

```javascript
const handleLogin = () => {
  // 1. Validar campos
  if (!authForm.email || !authForm.password) {
    alert('Por favor ingresa tu email y contraseña');
    return;
  }

  // 2. Buscar cliente en localStorage
  const savedCustomer = localStorage.getItem('ecommerce_customer');

  if (!savedCustomer) {
    alert('No se encontró una cuenta con ese email. Por favor regístrate.');
    setIsLoginMode(false);
    return;
  }

  const customer = JSON.parse(savedCustomer);

  // 3. Verificar email (sistema real también verificaría password)
  if (customer.email !== authForm.email) {
    alert('Email o contraseña incorrectos');
    return;
  }

  // 4. Actualizar estados
  setCustomerData(customer);
  setIsLoggedIn(true);
  setShowAuthModal(false);
  setAuthForm({ nombre: '', email: '', telefono: '', direccion: '', password: '' });

  // 5. Mostrar confirmación
  alert(`¡Hola de nuevo ${customer.nombre}! 👋\n\nBienvenido/a de nuevo.`);
};
```

#### `handleLogout()`

Cierra la sesión del usuario actual.

```javascript
const handleLogout = () => {
  if (confirm('¿Estás seguro/a de que quieres cerrar sesión?')) {
    setIsLoggedIn(false);
    setCustomerData(null);
    // NOTA: No eliminamos los cupones guardados
    alert('Has cerrado sesión correctamente. Tus cupones se han mantenido guardados.');
  }
};
```

### Hooks de Efecto

```javascript
// Cargar datos del cliente al iniciar
useEffect(() => {
  const savedCustomer = localStorage.getItem('ecommerce_customer');
  const savedCoupons = localStorage.getItem('ecommerce_coupons');

  if (savedCustomer) {
    setCustomerData(JSON.parse(savedCustomer));
    setIsLoggedIn(true);
  }

  if (savedCoupons) {
    setCoupons(JSON.parse(savedCoupons));
  }
}, []);

// Cerrar dropdown del usuario al click fuera
useEffect(() => {
  const handleClickOutside = (event) => {
    if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
      setShowUserDropdown(false);
    }
  };

  if (showUserDropdown) {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }
}, [showUserDropdown]);
```

---

## Sistema de Carrito de Compras

### Estados

```javascript
const [cart, setCart] = useState([]);
const [showCart, setShowCart] = useState(false);
```

### Funciones

#### `addToCart(product, quantity = 1)`

Agrega un producto al carrito con validación de autenticación.

```javascript
const addToCart = (product, quantity = 1) => {
  // 1. Verificar si hay cliente logueado
  const savedCustomer = localStorage.getItem('ecommerce_customer');

  // 2. Si NO está logueado, mostrar modal de autenticación
  if (!isLoggedIn || !savedCustomer) {
    setShowAuthModal(true);
    return;
  }

  // 3. Si SÍ está logueado, agregar al carrito
  setCart(prevCart => {
    const existingItem = prevCart.find(item => item.id === product.id);

    if (existingItem) {
      // 3a. Si ya existe, incrementar cantidad
      return prevCart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    }

    // 3b. Si no existe, agregar nuevo item
    return [...prevCart, { ...product, quantity }];
  });

  // 4. Mostrar confirmación
  alert(`✅ ${product.nombre} agregado al carrito`);
};
```

#### `removeFromCart(productId)`

Elimina un producto del carrito.

```javascript
const removeFromCart = (productId) => {
  setCart(prevCart => prevCart.filter(item => item.id !== productId));
};
```

#### `updateQuantity(productId, newQuantity)`

Actualiza la cantidad de un producto en el carrito.

```javascript
const updateQuantity = (productId, newQuantity) => {
  // 1. Si cantidad es 0 o menos, eliminar producto
  if (newQuantity <= 0) {
    removeFromCart(productId);
    return;
  }

  // 2. Actualizar cantidad
  setCart(prevCart =>
    prevCart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    )
  );
};
```

#### `cartTotal`

Calcula el total del carrito.

```javascript
const cartTotal = cart.reduce((total, item) => {
  const price = parseFloat(item.precio_venta) || 0;
  return total + (price * item.quantity);
}, 0);
```

#### `cartItemCount`

Cuenta el total de items en el carrito.

```javascript
const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
```

---

## Sistema de Cupones y Descuentos

### Estados

```javascript
const [coupons, setCoupons] = useState([]);
const [showCouponModal, setShowCouponModal] = useState(false);
const [earnedCoupon, setEarnedCoupon] = useState(null);
```

### Funciones

#### `generateCoupon()`

Genera un cupón aleatorio con descuento entre 10% y 25%.

```javascript
const generateCoupon = () => {
  // 1. Generar descuento aleatorio (10-25%)
  const discount = Math.floor(Math.random() * 15) + 10;

  // 2. Generar código único
  const code = `DESC${Date.now().toString().slice(-6).toUpperCase()}`;

  // 3. Crear objeto de cupón
  const coupon = {
    codigo: code,
    descuento: discount,
    fechaGeneracion: new Date().toISOString(),
    estado: 'activo',
    usado: false
  };

  return coupon;
};
```

#### `saveCoupon(coupon)`

Guarda un cupón en localStorage y actualiza el estado.

```javascript
const saveCoupon = (coupon) => {
  // 1. Agregar cupón al array
  const updatedCoupons = [...coupons, coupon];
  setCoupons(updatedCoupons);

  // 2. Guardar en localStorage
  localStorage.setItem('ecommerce_coupons', JSON.stringify(updatedCoupons));

  // 3. Actualizar contador de reseñas del cliente
  if (customerData) {
    const updatedCustomer = {
      ...customerData,
      reseñas: (customerData.reseñas || 0) + 1
    };
    setCustomerData(updatedCustomer);
    localStorage.setItem('ecommerce_customer', JSON.stringify(updatedCustomer));
  }
};
```

#### `formatCouponDate(dateString)`

Formatea la fecha de generación del cupón.

```javascript
const formatCouponDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
```

### Mecánica de Ganar Cupones

Los usuarios ganan cupones al dejar reseñas de productos:

1. Usuario compra un producto
2. Usuario deja reseña
3. Sistema genera cupón automáticamente
4. Cupón se guarda en localStorage
5. Usuario puede ver cupones en dropdown del carrito
6. Usuario puede aplicar cupón en próxima compra

---

## Sistema de Reseñas

### Estados

```javascript
const [reviews, setReviews] = useState([]);
const [newReview, setNewReview] = useState({ rating: 5, comment: '', customerName: '' });
const [customerPhotos, setCustomerPhotos] = useState([]);
```

### Funciones

#### `handleSubmitReview()`

Procesa y guarda una nueva reseña de producto.

```javascript
const handleSubmitReview = () => {
  // 1. Verificar autenticación
  if (!isLoggedIn) {
    alert('Debes iniciar sesión para dejar una reseña y ganar cupones de descuento');
    setShowAuthModal(true);
    return;
  }

  // 2. Validar comentario
  if (!newReview.comment) {
    alert('Por favor escribe tu reseña');
    return;
  }

  // 3. Crear objeto de reseña
  const review = {
    id: Date.now(),
    productId: selectedProduct?.id,
    productName: selectedProduct?.nombre,
    rating: newReview.rating,
    comment: newReview.comment,
    customerName: customerData.nombre,
    customerEmail: customerData.email,
    date: new Date().toLocaleDateString('es-ES'),
    photos: [...customerPhotos]
  };

  // 4. Guardar reseña
  setReviews([...reviews, review]);

  // 5. Limpiar formulario
  setNewReview({ rating: 5, comment: '', customerName: '' });
  setCustomerPhotos([]);

  // 6. Generar y guardar cupón de descuento
  const newCoupon = generateCoupon();
  saveCoupon(newCoupon);
  setEarnedCoupon(newCoupon);
  setShowCouponModal(true);
};
```

#### `handlePhotoUpload(e)`

Maneja la subida de fotos de clientes.

```javascript
const handlePhotoUpload = (e) => {
  const files = Array.from(e.target.files);
  // Crear URLs temporales con blob:URL.createObjectURL
  const photoUrls = files.map(file => URL.createObjectURL(file));
  setCustomerPhotos([...customerPhotos, ...photoUrls]);
};
```

#### `renderStars(rating, interactive, onRate)`

Renderiza estrellas de calificación.

```javascript
const renderStars = (rating, interactive = false, onRate = null) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onRate && onRate(star)}
          className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
        >
          ★
        </button>
      ))}
    </div>
  );
};
```

---

## Integración WhatsApp

### Funciones

#### `generateWhatsAppMessage()`

Genera el mensaje formateado para enviar el pedido por WhatsApp.

```javascript
const generateWhatsAppMessage = () => {
  let message = `🛒 *Pedido - ${nombreTienda}*\n\n`;

  // 1. Información del cliente si está logueado
  if (isLoggedIn && customerData) {
    message += `👤 *Datos del Cliente:*\n`;
    message += `Nombre: ${customerData.nombre}\n`;
    message += `Email: ${customerData.email}\n`;
    message += `Teléfono: ${customerData.telefono}\n`;
    if (customerData.direccion) {
      message += `Dirección: ${customerData.direccion}\n`;
    }
    message += `\n`;
  }

  // 2. Lista de productos
  message += `📋 *Productos:*\n`;
  cart.forEach((item, index) => {
    const price = parseFloat(item.precio_venta) || 0;
    const subtotal = price * item.quantity;
    message += `${index + 1}. *${item.nombre}*\n`;
    message += `   Cantidad: ${item.quantity}\n`;
    message += `   Precio: $${price.toFixed(2)}\n`;
    message += `   Subtotal: $${subtotal.toFixed(2)}\n\n`;
  });

  // 3. Total
  message += `💰 *Total: $${cartTotal.toFixed(2)}*\n\n`;

  // 4. Cupones si tiene
  if (coupons.length > 0) {
    message += `🎁 *Cupones Disponibles:*\n`;
    coupons.forEach((coupon, index) => {
      if (!coupon.usado) {
        message += `${index + 1}. ${coupon.codigo} - ${coupon.descuento}% OFF\n`;
      }
    });
    message += `\n`;
  }

  return encodeURIComponent(message);
};
```

#### `sendToWhatsApp()`

Abre WhatsApp con el mensaje del carrito.

```javascript
const sendToWhatsApp = () => {
  // 1. Validar carrito
  if (cart.length === 0) {
    alert('Tu carrito está vacío');
    return;
  }

  // 2. Verificar autenticación
  if (!isLoggedIn) {
    setShowAuthModal(true);
    return;
  }

  // 3. Generar mensaje y abrir WhatsApp
  const message = generateWhatsAppMessage();
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
  window.open(whatsappUrl, '_blank');
};
```

---

## Carga de Productos

### Lógica de Backend con Fallback

```javascript
useEffect(() => {
  const loadProducts = async () => {
    try {
      setLoading(true);
      let productos = [];

      // 1. Intentar cargar del backend
      try {
        const { datos } = await fetchProducts({
          usuario: null,
          tokenUsuario: null,
          subdominio: subdominio,
          publico: true
        });

        // 2. Usar productos del backend si existen
        if (datos && Array.isArray(datos) && datos.length > 0) {
          productos = datos;
        }
      } catch (apiError) {
        // 3. Ignorar error del backend
      }

      // 4. Fallback a productos de ejemplo si no hay datos
      if (productos.length === 0) {
        productos = [
          {
            id: 1,
            nombre: 'Scooter Eléctrico Urban X500',
            descripcion: 'Scooter eléctrico de alta autonomía...',
            precio_venta: 1299.99,
            categoria_nombre: 'Scooters',
            stock: 15,
            // ... más campos
          },
          // ... más productos de ejemplo
        ];
      }

      // 5. Extraer categorías y actualizar estados
      const cats = [...new Set(productos.map(p => p.categoria_nombre).filter(Boolean))];
      setCategories(cats);
      setProducts(productos);
      setFilteredProducts(productos);

    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  loadProducts();
}, [subdominio]);
```

### Filtrado de Productos

```javascript
useEffect(() => {
  let filtered = products;

  // 1. Filtrar por categoría
  if (activeCategory) {
    filtered = filtered.filter(p => p.categoria_nombre === activeCategory);
  }

  // 2. Filtrar por búsqueda
  if (searchQuery) {
    filtered = filtered.filter(p =>
      p.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  setFilteredProducts(filtered);
}, [activeCategory, searchQuery, products]);
```

---

## Gestión de Modo Oscuro

### Estado

```javascript
const [darkMode, setDarkMode] = useState(() => {
  const saved = localStorage.getItem('darkMode');
  return saved ? JSON.parse(saved) : false;
});
```

### Función Toggle

```javascript
const toggleDarkMode = () => {
  setDarkMode(!darkMode);
};
```

### Hook de Efecto

```javascript
useEffect(() => {
  // 1. Guardar preferencia en localStorage
  localStorage.setItem('darkMode', JSON.stringify(darkMode));

  // 2. Aplicar clase al body
  if (darkMode) {
    document.body.classList.add('dark-mode');
    document.body.style.backgroundColor = DARK_COLORS.background;
    document.body.style.color = DARK_COLORS.textPrimary;
  } else {
    document.body.classList.remove('dark-mode');
    document.body.style.backgroundColor = COLORS.blanco;
    document.body.style.color = COLORS.negro;
  }
}, [darkMode]);
```

---

## Utilidades

### `getCategoryEmoji(category)`

Retorna el emoji correspondiente a una categoría.

```javascript
const getCategoryEmoji = (category) => {
  const emojis = {
    'Scooters': '🛴',
    'Bicicletas': '🚲',
    'Monopatines': '🛹',
    'Hoverboards': '⚡',
    'Accesorios': '🔧',
    'Patinetes': '🛴',
    'default': '⚡'
  };
  return emojis[category] || emojis['default'];
};
```

---

[← Volver a README](./README.md) | [Ver secciones →](./secciones.md) | [Ver estilos →](./estilos.md)
