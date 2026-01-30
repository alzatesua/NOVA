import React, { useState, useEffect } from 'react';
import { fetchProducts } from '../services/api';
import { Navbar, Nav, NavDropdown, Form, Container, Button } from 'react-bootstrap';

// Paleta de colores ecológica para movilidad eléctrica
const COLORS = {
  verdePrincipal: '#2E7D32',      // Forest Green
  verdeSecundario: '#4CAF50',     // Green
  verdeMenta: '#81C784',          // Light Green
  verdeOscuro: '#1B5E20',         // Dark Green
  beigeCrema: '#FFF8E1',          // Cream
  blanco: '#FFFFFF',
  grisClaro: '#F5F5F5',
  grisMedio: '#757575',
  grisOscuro: '#424242',
  negro: '#212121',
  acentoNaranja: '#FFA726',       // Orange para CTAs
  acentoTurquesa: '#26A69A',      // Turquoise para detalles
};

export default function EcommerceView() {
  // Estados principales
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  // Estados para reseñas
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', customerName: '' });
  const [customerPhotos, setCustomerPhotos] = useState([]);

  // Estados para secciones
  const [activeSection, setActiveSection] = useState('inicio');

  // Configuración de la tienda
  const nombreTienda = localStorage.getItem('nombre_tienda') || 'EcoMotion';
  const whatsappNumber = localStorage.getItem('whatsapp_number') || '573000000000';
  const subdominio = window.location.hostname.split('.')[0];

  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        let productos = [];

        // Intentar cargar productos del backend
        try {
          const { datos } = await fetchProducts({
            usuario: null,
            tokenUsuario: null,
            subdominio: subdominio,
            publico: true
          });

          // Solo usar productos del backend si existen y tienen datos
          if (datos && Array.isArray(datos) && datos.length > 0) {
            productos = datos;
            console.log('✅ Productos cargados del backend:', productos.length);
          } else {
            console.log('⚠️ No hay productos en backend, usando productos de ejemplo');
          }
        } catch (apiError) {
          console.log('⚠️ Error al cargar del backend, usando productos de ejemplo:', apiError);
        }

        // Si no hay productos válidos del backend, usar productos de ejemplo
        if (productos.length === 0) {
          productos = [
            {
              id: 1,
              nombre: 'Scooter Eléctrico Urban X500',
              descripcion: 'Scooter eléctrico de alta autonomía para ciudad. Batería de litio con 60km de autonomía, velocidad máxima 45km/h, tiempo de carga 4-6 horas.',
              precio_venta: 1299.99,
              categoria_nombre: 'Scooters',
              stock: 15,
              codigo_barras: 'SCO001',
              marca_nombre: 'EcoMotion',
              iva_porcentaje: 19,
              imagen: null
            },
            {
              id: 2,
              nombre: 'Bicicleta Eléctrica Mountain Pro',
              descripcion: 'Bicicleta eléctrica de montaña con motor de 500W, suspensión completa, batería extraíble de 48V 14Ah, autonomía hasta 80km.',
              precio_venta: 1899.99,
              categoria_nombre: 'Bicicletas',
              stock: 20,
              codigo_barras: 'BIC002',
              marca_nombre: 'EcoRide',
              iva_porcentaje: 19,
              imagen: null
            },
            {
              id: 3,
              nombre: 'Monopatín Eléctrico Fold S3',
              descripcion: 'Monopatín eléctrico plegable ultraligero (8.5kg), 25km de autonomía, velocidad 25km/h, perfecto para commuting urbano.',
              precio_venta: 459.99,
              categoria_nombre: 'Monopatines',
              stock: 30,
              codigo_barras: 'MON003',
              marca_nombre: 'UrbanGlide',
              iva_porcentaje: 19,
              imagen: null
            },
            {
              id: 4,
              nombre: 'Hoverboard Off-Road X7',
              descripcion: 'Hovercard todo terreno con ruedas de 8.5", motor dual 400W, autonomía 20km, Bluetooth app y control remoto.',
              precio_venta: 399.99,
              categoria_nombre: 'Hoverboards',
              stock: 25,
              codigo_barras: 'HOV004',
              marca_nombre: 'TechGlide',
              iva_porcentaje: 19,
              imagen: null
            },
            {
              id: 5,
              nombre: 'Bicicleta Eléctrica Plegable City',
              descripcion: 'Bicicleta eléctrica plegable urbana con motor de 250W, batería 36V 10Ah, 16 velocidades, ideal para ciudad.',
              precio_venta: 899.99,
              categoria_nombre: 'Bicicletas',
              stock: 18,
              codigo_barras: 'BIC005',
              marca_nombre: 'CityEco',
              iva_porcentaje: 19,
              imagen: null
            },
            {
              id: 6,
              nombre: 'Kit de Conversión Eléctrico',
              descripcion: 'Convierte tu bicicleta tradicional en eléctrica. Motor de 250W, batería 36V 12Ah, controlador y pantalla LCD incluidos.',
              precio_venta: 349.99,
              categoria_nombre: 'Accesorios',
              stock: 40,
              codigo_barras: 'ACC006',
              marca_nombre: 'EcoKits',
              iva_porcentaje: 19,
              imagen: null
            },
            {
              id: 7,
              nombre: 'Cascota Eléctrico Sport',
              descripcion: 'Scooter eléctrico deportivo con diseño ergonómico, motor 2000W, autonomía 70km, velocidad máxima 55km/h, frenos de disco.',
              precio_venta: 2499.99,
              categoria_nombre: 'Scooters',
              stock: 10,
              codigo_barras: 'SCO007',
              marca_nombre: 'EcoMotion',
              iva_porcentaje: 19,
              imagen: null
            },
            {
              id: 8,
              nombre: 'Batería Extra 48V 20Ah',
              descripcion: 'Batería adicional de litio 48V 20Ah para extender autonomía. Compatible con bicicletas y scooters eléctricos.',
              precio_venta: 599.99,
              categoria_nombre: 'Accesorios',
              stock: 50,
              codigo_barras: 'BAT008',
              marca_nombre: 'PowerCell',
              iva_porcentaje: 19,
              imagen: null
            }
          ];
          console.log('✅ Cargados', productos.length, 'productos de ejemplo de movilidad eléctrica');
        }

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

  // Filtrar productos
  useEffect(() => {
    let filtered = products;

    if (activeCategory) {
      filtered = filtered.filter(p => p.categoria_nombre === activeCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [activeCategory, searchQuery, products]);

  // Carrito functions
  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);

      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prevCart, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const cartTotal = cart.reduce((total, item) => {
    const price = parseFloat(item.precio_venta) || 0;
    return total + (price * item.quantity);
  }, 0);

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Función para obtener emoji según categoría
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

  // WhatsApp
  const generateWhatsAppMessage = () => {
    let message = `🛒 *Pedido - ${nombreTienda}*\n\n`;
    message += `📋 *Productos:*\n`;

    cart.forEach((item, index) => {
      const price = parseFloat(item.precio_venta) || 0;
      const subtotal = price * item.quantity;
      message += `${index + 1}. *${item.nombre}*\n`;
      message += `   Cantidad: ${item.quantity}\n`;
      message += `   Precio: $${price.toFixed(2)}\n`;
      message += `   Subtotal: $${subtotal.toFixed(2)}\n\n`;
    });

    message += `💰 *Total: $${cartTotal.toFixed(2)}*`;
    return encodeURIComponent(message);
  };

  const sendToWhatsApp = () => {
    if (cart.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }

    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  // Reseñas
  const handleSubmitReview = () => {
    if (!newReview.comment || !newReview.customerName) {
      alert('Por favor completa todos los campos');
      return;
    }

    const review = {
      id: Date.now(),
      ...newReview,
      date: new Date().toLocaleDateString('es-ES'),
      photos: [...customerPhotos]
    };

    setReviews([...reviews, review]);
    setNewReview({ rating: 5, comment: '', customerName: '' });
    setCustomerPhotos([]);
    alert('¡Gracias por tu reseña!');
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const photoUrls = files.map(file => URL.createObjectURL(file));
    setCustomerPhotos([...customerPhotos, ...photoUrls]);
  };

  const renderStars = (rating, interactive = false, onRate = null) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRate && onRate(star)}
            className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} ${
              interactive ? 'hover:scale-110 transition-transform' : ''
            }`}
            disabled={!interactive}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: COLORS.grisClaro }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mb-4 mx-auto" style={{ borderColor: COLORS.verdePrincipal }}></div>
          <p style={{ color: COLORS.grisMedio }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.blanco }}>
      {/* Estilos CSS para el fondo animado */}
      <style>
        {`
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.1; }
            50% { transform: translateY(-20px) rotate(180deg); opacity: 0.3; }
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.1); opacity: 0.5; }
          }

          @keyframes drift {
            0% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(30px, -30px) rotate(120deg); }
            66% { transform: translate(-20px, 20px) rotate(240deg); }
            100% { transform: translate(0, 0) rotate(360deg); }
          }

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

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .animated-bg {
            background: linear-gradient(
              -45deg,
              ${COLORS.verdePrincipal},
              ${COLORS.verdeSecundario},
              ${COLORS.verdeMenta},
              ${COLORS.acentoTurquesa},
              ${COLORS.verdeOscuro}
            );
            background-size: 400% 400%;
            animation: gradientShift 15s ease infinite;
          }

          .floating-shape {
            position: absolute;
            border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
            animation: float 6s ease-in-out infinite;
          }

          .floating-circle {
            position: absolute;
            border-radius: 50%;
            animation: pulse 4s ease-in-out infinite;
          }

          .floating-bolt {
            position: absolute;
            animation: drift 20s linear infinite;
            opacity: 0.15;
          }

          .category-card {
            animation: slideUp 0.6s ease-out forwards;
            opacity: 0;
          }

          .product-card {
            animation: fadeIn 0.8s ease-out forwards;
            opacity: 0;
          }
        `}
      </style>

      {/* Header con Bootstrap Navbar */}
      <Navbar bg="success" variant="dark" expand="lg" className="sticky-top shadow-lg" style={{ backgroundColor: COLORS.verdePrincipal + ' !important' }}>
        <Container fluid>
          {/* Logo */}
          <Navbar.Brand
            onClick={() => setActiveSection('inicio')}
            style={{ cursor: 'pointer' }}
            className="d-flex align-items-center"
          >
            <div
              className="rounded-circle d-flex align-items-center justify-center me-2"
              style={{ backgroundColor: COLORS.blanco, width: '40px', height: '40px' }}
            >
              <span style={{ fontSize: '24px' }}>⚡</span>
            </div>
            <span className="fw-bold">{nombreTienda}</span>
          </Navbar.Brand>

          {/* Botón toggler móvil */}
          <Navbar.Toggle aria-controls="navbarSupportedContent" />

          {/* Contenido colapsable */}
          <Navbar.Collapse id="navbarSupportedContent">
            <Nav className="flex-grow-1 justify-content-center">
              <Nav.Link
                active={activeSection === 'inicio'}
                onClick={() => setActiveSection('inicio')}
                className={`mx-3 ${activeSection === 'inicio' ? 'fw-bold' : ''}`}
              >
                Inicio
              </Nav.Link>
              <Nav.Link
                active={activeSection === 'nosotros'}
                onClick={() => setActiveSection('nosotros')}
                className={`mx-3 ${activeSection === 'nosotros' ? 'fw-bold' : ''}`}
              >
                Nosotros
              </Nav.Link>
              <Nav.Link
                active={activeSection === 'productos'}
                onClick={() => setActiveSection('productos')}
                className={`mx-3 ${activeSection === 'productos' ? 'fw-bold' : ''}`}
              >
                Productos
              </Nav.Link>
              <Nav.Link
                active={activeSection === 'contacto'}
                onClick={() => setActiveSection('contacto')}
                className={`mx-3 ${activeSection === 'contacto' ? 'fw-bold' : ''}`}
              >
                Contacto
              </Nav.Link>

              {/* Dropdown de Categorías */}
              {categories.length > 0 && (
                <NavDropdown title="Categorías" id="categoriesDropdown" className="mx-3">
                  <NavDropdown.Item onClick={() => { setActiveSection('productos'); setActiveCategory(null); }}>
                    Todas
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  {categories.map((category) => (
                    <NavDropdown.Item
                      key={category}
                      onClick={() => { setActiveSection('productos'); setActiveCategory(category); }}
                    >
                      {category}
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
              )}
            </Nav>

            {/* Barra de búsqueda */}
            <Form className="d-flex me-3">
              <Form.Control
                type="search"
                placeholder="Buscar productos..."
                className="me-2"
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ maxWidth: '200px' }}
              />
              <Button variant="outline-light">🔍</Button>
            </Form>

            {/* Carrito - Enviar directamente a WhatsApp */}
            <Button
              variant="light"
              className="position-relative"
              onClick={() => {
                if (cart.length > 0) {
                  sendToWhatsApp();
                } else {
                  alert('Tu carrito está vacío');
                }
              }}
              style={{ color: COLORS.verdePrincipal }}
              title="Completar pedido por WhatsApp"
            >
              <svg
                style={{ width: '20px', height: '20px' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartItemCount > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                  style={{ backgroundColor: COLORS.acentoNaranja }}
                >
                  {cartItemCount}
                </span>
              )}
            </Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Sección INICIO */}
        {activeSection === 'inicio' && (
          <div>
            {/* Hero Section con Fondo Animado */}
            <div
              className="animated-bg rounded-3xl shadow-2xl overflow-hidden mb-12 relative"
              style={{ minHeight: '500px', position: 'relative', overflow: 'hidden' }}
            >
              {/* Formas flotantes animadas */}
              <div className="floating-shape" style={{
                width: '80px',
                height: '80px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                top: '10%',
                left: '5%',
                animationDelay: '0s'
              }}></div>
              <div className="floating-shape" style={{
                width: '120px',
                height: '120px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                top: '60%',
                right: '10%',
                animationDelay: '2s'
              }}></div>
              <div className="floating-circle" style={{
                width: '60px',
                height: '60px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                bottom: '20%',
                left: '20%',
                animationDelay: '1s'
              }}></div>
              <div className="floating-circle" style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                top: '30%',
                right: '30%',
                animationDelay: '3s'
              }}></div>

              {/* Rayos/Relámpagos flotantes */}
              <div className="floating-bolt" style={{
                fontSize: '40px',
                top: '15%',
                left: '15%',
                animationDelay: '0s'
              }}>⚡</div>
              <div className="floating-bolt" style={{
                fontSize: '30px',
                top: '70%',
                right: '20%',
                animationDelay: '5s'
              }}>⚡</div>
              <div className="floating-bolt" style={{
                fontSize: '35px',
                bottom: '25%',
                left: '10%',
                animationDelay: '8s'
              }}>⚡</div>
              <div className="floating-bolt" style={{
                fontSize: '25px',
                top: '40%',
                right: '8%',
                animationDelay: '3s'
              }}>⚡</div>

              {/* Contenido */}
              <div className="relative z-10 py-16 px-8">
                <div className="max-w-4xl mx-auto text-center">
                  {/* Badge */}
                  <div className="inline-block mb-6">
                    <span
                      className="px-6 py-2 rounded-full text-white font-semibold text-sm shadow-lg"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', border: '2px solid rgba(255, 255, 255, 0.3)' }}
                    >
                      🌱 100% Sostenible
                    </span>
                  </div>

                  {/* Título Principal */}
                  <h1
                    className="text-6xl md:text-7xl font-extrabold mb-6 text-white"
                    style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.3)' }}
                  >
                    Bienvenidos
                  </h1>

                  {/* Subtítulo con gradiente */}
                  <p
                    className="text-2xl md:text-3xl font-semibold mb-8 text-white"
                    style={{ textShadow: '1px 1px 4px rgba(0, 0, 0, 0.3)' }}
                  >
                    Tu destino para{' '}
                    <span style={{ color: '#FFD700' }}>movilidad eléctrica</span>
                  </p>

                  {/* Descripción */}
                  <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed" style={{ textShadow: '1px 1px 3px rgba(0, 0, 0, 0.3)' }}>
                    Encuentra los mejores scooters, bicicletas eléctricas y accesorios eco-friendly.
                    Contribuye al planeta mientras te mueves con libertad y estilo.
                  </p>

                  {/* Botones CTA */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => setActiveSection('productos')}
                      className="px-10 py-4 rounded-full font-bold text-white text-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
                      style={{
                        backgroundColor: COLORS.blanco,
                        color: COLORS.verdePrincipal,
                        border: '3px solid rgba(255, 255, 255, 0.5)'
                      }}
                    >
                      ⚡ Ver Productos
                    </button>
                    <button
                      onClick={() => setActiveSection('nosotros')}
                      className="px-10 py-4 rounded-full font-bold text-white text-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(10px)',
                        border: '3px solid rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      🌱 Conoce Más
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="mt-12 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white mb-1" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
                        8+
                      </div>
                      <div className="text-white/90 text-sm">Productos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white mb-1" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
                        100%
                      </div>
                      <div className="text-white/90 text-sm">Ecológico</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white mb-1" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
                        60km
                      </div>
                      <div className="text-white/90 text-sm">Autonomía</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Categorías destacadas */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: COLORS.verdeOscuro }}>
                Categorías Destacadas
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {categories.slice(0, 4).map((category, index) => (
                  <button
                    key={category}
                    onClick={() => {
                      setActiveSection('productos');
                      setActiveCategory(category);
                    }}
                    className="category-card p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
                    style={{
                      backgroundColor: COLORS.blanco,
                      border: `2px solid ${COLORS.verdeMenta}`,
                      animationDelay: `${index * 0.15}s`
                    }}
                  >
                    <div className="text-4xl mb-2">{getCategoryEmoji(category)}</div>
                    <h3 className="font-semibold" style={{ color: COLORS.verdeOscuro }}>{category}</h3>
                  </button>
                ))}
              </div>
            </div>

            {/* Productos destacados */}
            <div>
              <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: COLORS.verdeOscuro }}>
                Productos Destacados
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.slice(0, 3).map((product, index) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowProductModal(true);
                    }}
                    className="product-card rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all transform hover:scale-105"
                    style={{
                      backgroundColor: COLORS.blanco,
                      animationDelay: `${index * 0.2}s`
                    }}
                  >
                    <div
                      className="w-full h-48 flex items-center justify-center"
                      style={{ backgroundColor: COLORS.grisClaro }}
                    >
                      {product.imagen ? (
                        <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-6xl">{getCategoryEmoji(product.categoria_nombre)}</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2" style={{ color: COLORS.verdeOscuro }}>
                        {product.nombre}
                      </h3>
                      <p className="text-sm mb-3 line-clamp-2" style={{ color: COLORS.grisMedio }}>
                        {product.descripcion}
                      </p>
                      <p className="text-2xl font-bold" style={{ color: COLORS.verdePrincipal }}>
                        ${parseFloat(product.precio_venta || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sección NOSOTROS */}
        {activeSection === 'nosotros' && (
          <div className="py-12">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl font-bold mb-8 text-center" style={{ color: COLORS.verdeOscuro }}>
                Sobre Nosotros
              </h1>

              <div className="rounded-2xl shadow-xl p-8 mb-8" style={{ backgroundColor: COLORS.beigeCrema }}>
                <h2 className="text-3xl font-bold mb-4" style={{ color: COLORS.verdePrincipal }}>
                  Nuestra Misión
                </h2>
                <p className="text-lg leading-relaxed mb-6" style={{ color: COLORS.grisOscuro }}>
                  En {nombreTienda}, estamos comprometidos con revolucionar la forma en que las personas se mueven.
                  Nuestra misión es proporcionar soluciones de movilidad eléctrica accesibles, sostenibles y de alta calidad
                  que contribuyan a un futuro más limpio y verde para todos.
                </p>

                <h2 className="text-3xl font-bold mb-4" style={{ color: COLORS.verdePrincipal }}>
                  Por Qué Elegirnos
                </h2>
                <div className="grid md:grid-cols-3 gap-6 mt-6">
                  <div className="text-center p-4">
                    <div className="text-5xl mb-2">🌱</div>
                    <h3 className="font-bold text-lg mb-2" style={{ color: COLORS.verdeOscuro }}>100% Ecológico</h3>
                    <p className="text-sm" style={{ color: COLORS.grisMedio }}>
                      Todos nuestros productos son cero emisiones
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="text-5xl mb-2">⚡</div>
                    <h3 className="font-bold text-lg mb-2" style={{ color: COLORS.verdeOscuro }}>Alta Potencia</h3>
                    <p className="text-sm" style={{ color: COLORS.grisMedio }}>
                      Baterías de larga duración y rendimiento
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="text-5xl mb-2">🛡️</div>
                    <h3 className="font-bold text-lg mb-2" style={{ color: COLORS.verdeOscuro }}>Garantía Premium</h3>
                    <p className="text-sm" style={{ color: COLORS.grisMedio }}>
                      Soporte técnico y garantía extendida
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl shadow-xl p-8" style={{ backgroundColor: COLORS.verdeMenta + '20' }}>
                <h2 className="text-3xl font-bold mb-4" style={{ color: COLORS.verdePrincipal }}>
                  Nuestro Compromiso Ambiental
                </h2>
                <p className="text-lg leading-relaxed" style={{ color: COLORS.grisOscuro }}>
                  Cada producto que vendemos ayuda a reducir la huella de carbono. Trabajamos directamente con
                  fabricantes que utilizan materiales reciclables y procesos de producción sostenibles.
                  Además, donamos el 5% de nuestras utilidades a organizaciones dedicadas a la reforestación
                  y conservación del medio ambiente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sección PRODUCTOS */}
        {activeSection === 'productos' && (
          <div>
            {/* Filtros de categoría */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 overflow-x-auto pb-2">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-all ${
                    activeCategory === null
                      ? 'text-white shadow-lg'
                      : 'bg-white hover:shadow-md'
                  }`}
                  style={{
                    backgroundColor: activeCategory === null ? COLORS.verdePrincipal : COLORS.blanco,
                    color: activeCategory === null ? COLORS.blanco : COLORS.verdePrincipal
                  }}
                >
                  Todas
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-all ${
                      activeCategory === category
                        ? 'text-white shadow-lg'
                        : 'bg-white hover:shadow-md'
                    }`}
                    style={{
                      backgroundColor: activeCategory === category ? COLORS.verdePrincipal : COLORS.blanco,
                      color: activeCategory === category ? COLORS.blanco : COLORS.verdePrincipal
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de productos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer"
                  style={{ backgroundColor: COLORS.blanco }}
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowProductModal(true);
                  }}
                >
                  <div
                    className="w-full aspect-square flex items-center justify-center"
                    style={{ backgroundColor: COLORS.grisClaro }}
                  >
                    {product.imagen ? (
                      <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl">{getCategoryEmoji(product.categoria_nombre)}</span>
                    )}
                  </div>
                  <div className="p-4">
                    {product.categoria_nombre && (
                      <span className="inline-block px-2 py-1 text-xs rounded-full mb-2 text-white" style={{ backgroundColor: COLORS.verdePrincipal }}>
                        {product.categoria_nombre}
                      </span>
                    )}
                    <h3 className="font-bold text-lg mb-2 line-clamp-2" style={{ color: COLORS.verdeOscuro }}>
                      {product.nombre}
                    </h3>
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: COLORS.grisMedio }}>
                      {product.descripcion}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: COLORS.verdePrincipal }}>
                      ${parseFloat(product.precio_venta || 0).toFixed(2)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="w-full mt-3 px-4 py-2 rounded-lg font-semibold text-white shadow-md hover:shadow-lg transition-all"
                      style={{ backgroundColor: COLORS.acentoNaranja }}
                    >
                      Agregar al Carrito
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <span className="text-6xl mb-4 block">🔍</span>
                <p className="text-xl font-semibold" style={{ color: COLORS.grisMedio }}>
                  No se encontraron productos
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sección CONTACTO */}
        {activeSection === 'contacto' && (
          <div className="py-12">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl font-bold mb-12 text-center" style={{ color: COLORS.verdeOscuro }}>
                Contáctanos
              </h1>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="rounded-2xl shadow-xl p-8" style={{ backgroundColor: COLORS.beigeCrema }}>
                  <h2 className="text-2xl font-bold mb-6" style={{ color: COLORS.verdePrincipal }}>
                    Información de Contacto
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📍</span>
                      <p style={{ color: COLORS.grisOscuro }}>Calle Principal #123, Ciudad</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📞</span>
                      <p style={{ color: COLORS.grisOscuro }}>Tel: {whatsappNumber}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">✉️</span>
                      <p style={{ color: COLORS.grisOscuro }}>info@ecomotion.com</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">⏰</span>
                      <p style={{ color: COLORS.grisOscuro }}>Lun-Sáb: 9:00 AM - 7:00 PM</p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-xl font-bold mb-4" style={{ color: COLORS.verdeOscuro }}>
                      Síguenos en Redes
                    </h3>
                    <div className="flex space-x-4">
                      <a
                        href={`https://wa.me/${whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
                        style={{ backgroundColor: '#25D366' }}
                      >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </a>
                      <a
                        href="https://facebook.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
                        style={{ backgroundColor: '#1877F2' }}
                      >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                      <a
                        href="https://instagram.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
                        style={{ backgroundColor: '#E4405F' }}
                      >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                      <a
                        href="https://youtube.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
                        style={{ backgroundColor: '#FF0000' }}
                      >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl shadow-xl p-8" style={{ backgroundColor: COLORS.blanco }}>
                  <h2 className="text-2xl font-bold mb-6" style={{ color: COLORS.verdePrincipal }}>
                    Envíanos un Mensaje
                  </h2>
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.grisOscuro }}>
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2"
                        style={{ borderColor: COLORS.verdeMenta }}
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.grisOscuro }}>
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2"
                        style={{ borderColor: COLORS.verdeMenta }}
                        placeholder="tu@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.grisOscuro }}>
                        Mensaje
                      </label>
                      <textarea
                        rows="4"
                        className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2"
                        style={{ borderColor: COLORS.verdeMenta }}
                        placeholder="¿En qué podemos ayudarte?"
                      ></textarea>
                    </div>
                    <button
                      type="button"
                      className="w-full px-6 py-3 rounded-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all"
                      style={{ backgroundColor: COLORS.verdePrincipal }}
                    >
                      Enviar Mensaje
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal del Producto con Ficha Técnica */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowProductModal(false)}
            />

            <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b p-6 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold" style={{ color: COLORS.verdeOscuro }}>
                    {selectedProduct.nombre}
                  </h2>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Imagen */}
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ backgroundColor: COLORS.grisClaro }}
                  >
                    {selectedProduct.imagen ? (
                      <img
                        src={selectedProduct.imagen}
                        alt={selectedProduct.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-80 flex items-center justify-center">
                        <span className="text-9xl">{getCategoryEmoji(selectedProduct.categoria_nombre)}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    {selectedProduct.categoria_nombre && (
                      <span className="inline-block px-3 py-1 text-sm rounded-full mb-4 text-white" style={{ backgroundColor: COLORS.verdePrincipal }}>
                        {selectedProduct.categoria_nombre}
                      </span>
                    )}

                    <p className="text-lg mb-6 leading-relaxed" style={{ color: COLORS.grisOscuro }}>
                      {selectedProduct.descripcion || 'Producto de alta calidad para movilidad eléctrica.'}
                    </p>

                    <p className="text-4xl font-bold mb-6" style={{ color: COLORS.verdePrincipal }}>
                      ${parseFloat(selectedProduct.precio_venta || 0).toFixed(2)}
                    </p>

                    {/* Ficha Técnica */}
                    <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: COLORS.beigeCrema }}>
                      <h3 className="text-xl font-bold mb-3" style={{ color: COLORS.verdeOscuro }}>
                        📋 Ficha Técnica
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span style={{ color: COLORS.grisMedio }}>Categoría:</span>
                          <span className="font-semibold" style={{ color: COLORS.verdeOscuro }}>
                            {selectedProduct.categoria_nombre || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: COLORS.grisMedio }}>Stock:</span>
                          <span className="font-semibold" style={{ color: COLORS.verdeOscuro }}>
                            {selectedProduct.stock || 'Disponible'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: COLORS.grisMedio }}>SKU:</span>
                          <span className="font-semibold" style={{ color: COLORS.verdeOscuro }}>
                            {selectedProduct.codigo_barras || 'N/A'}
                          </span>
                        </div>
                        {selectedProduct.marca_nombre && (
                          <div className="flex justify-between">
                            <span style={{ color: COLORS.grisMedio }}>Marca:</span>
                            <span className="font-semibold" style={{ color: COLORS.verdeOscuro }}>
                              {selectedProduct.marca_nombre}
                            </span>
                          </div>
                        )}
                        {selectedProduct.iva_porcentaje && (
                          <div className="flex justify-between">
                            <span style={{ color: COLORS.grisMedio }}>IVA:</span>
                            <span className="font-semibold" style={{ color: COLORS.verdeOscuro }}>
                              {selectedProduct.iva_porcentaje}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          addToCart(selectedProduct);
                          setShowProductModal(false);
                        }}
                        className="flex-1 px-6 py-4 rounded-xl font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all"
                        style={{ backgroundColor: COLORS.acentoNaranja }}
                      >
                        🛒 Agregar al Carrito
                      </button>
                      <button
                        onClick={() => {
                          addToCart(selectedProduct);
                          setShowProductModal(false);
                          setShowCart(true);
                        }}
                        className="flex-1 px-6 py-4 rounded-xl font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all"
                        style={{ backgroundColor: COLORS.verdePrincipal }}
                      >
                        ⚡ Comprar Ahora
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sección de Reseñas */}
                <div className="mt-8 pt-8 border-t">
                  <h3 className="text-2xl font-bold mb-6" style={{ color: COLORS.verdeOscuro }}>
                    ⭐ Reseñas de Clientes
                  </h3>

                  {/* Formulario para agregar reseña */}
                  <div className="mb-8 p-6 rounded-xl" style={{ backgroundColor: COLORS.grisClaro }}>
                    <h4 className="text-lg font-semibold mb-4" style={{ color: COLORS.verdePrincipal }}>
                      Comparte tu experiencia
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.grisOscuro }}>
                          Tu Nombre
                        </label>
                        <input
                          type="text"
                          value={newReview.customerName}
                          onChange={(e) => setNewReview({ ...newReview, customerName: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none"
                          style={{ borderColor: COLORS.verdeMenta }}
                          placeholder="Tu nombre"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.grisOscuro }}>
                          Calificación
                        </label>
                        {renderStars(newReview.rating, true, (rating) => setNewReview({ ...newReview, rating }))}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.grisOscuro }}>
                          Tu Reseña
                        </label>
                        <textarea
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none"
                          style={{ borderColor: COLORS.verdeMenta }}
                          rows="3"
                          placeholder="Cuéntanos tu experiencia..."
                        ></textarea>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.grisOscuro }}>
                          Sube tus fotos (opcional)
                        </label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="w-full px-4 py-2 rounded-lg border-2"
                          style={{ borderColor: COLORS.verdeMenta }}
                        />
                        {customerPhotos.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {customerPhotos.map((photo, index) => (
                              <img key={index} src={photo} alt={`Preview ${index}`} className="w-20 h-20 object-cover rounded-lg" />
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleSubmitReview}
                        className="px-6 py-3 rounded-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all"
                        style={{ backgroundColor: COLORS.verdePrincipal }}
                      >
                        Publicar Reseña
                      </button>
                    </div>
                  </div>

                  {/* Lista de reseñas */}
                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <p className="text-center py-8" style={{ color: COLORS.grisMedio }}>
                        ¡Sé el primero en dejar una reseña!
                      </p>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="p-4 rounded-xl" style={{ backgroundColor: COLORS.beigeCrema }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: COLORS.verdePrincipal }}
                              >
                                {review.customerName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold" style={{ color: COLORS.verdeOscuro }}>
                                  {review.customerName}
                                </p>
                                <p className="text-sm" style={{ color: COLORS.grisMedio }}>{review.date}</p>
                              </div>
                            </div>
                            {renderStars(review.rating)}
                          </div>
                          <p className="mb-3" style={{ color: COLORS.grisOscuro }}>{review.comment}</p>
                          {review.photos && review.photos.length > 0 && (
                            <div className="flex gap-2">
                              {review.photos.map((photo, index) => (
                                <img key={index} src={photo} alt={`Review ${index}`} className="w-24 h-24 object-cover rounded-lg" />
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal del Carrito - TEMPORALMENTE DESHABILITADO */}
      {false && showCart && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowCart(false)}
            />

            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b p-6 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold" style={{ color: COLORS.verdeOscuro }}>🛒 Tu Carrito</h2>
                  <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">🛒</span>
                    <p className="text-xl font-semibold mb-2" style={{ color: COLORS.grisMedio }}>Tu carrito está vacío</p>
                    <p className="text-sm" style={{ color: COLORS.grisMedio }}>¡Agrega productos para comenzar!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 rounded-xl" style={{ backgroundColor: COLORS.grisClaro }}>
                        <div className="w-20 h-20 rounded-lg flex items-center justify-center overflow-hidden" style={{ backgroundColor: COLORS.beigeCrema }}>
                          {item.imagen ? (
                            <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl">🛴</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate" style={{ color: COLORS.verdeOscuro }}>{item.nombre}</h4>
                          <p className="text-lg font-bold" style={{ color: COLORS.verdePrincipal }}>
                            ${parseFloat(item.precio_venta || 0).toFixed(2)}
                          </p>
                          <div className="flex items-center space-x-3 mt-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                              style={{ backgroundColor: COLORS.verdeMenta }}
                            >
                              -
                            </button>
                            <span className="font-semibold text-lg min-w-[2rem] text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                              style={{ backgroundColor: COLORS.verdeMenta }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg" style={{ color: COLORS.verdeOscuro }}>
                            ${(parseFloat(item.precio_venta || 0) * item.quantity).toFixed(2)}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="mt-2 text-red-500 hover:text-red-700 p-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {cart.length > 0 && (
                <div className="sticky bottom-0 bg-white border-t p-6 space-y-4">
                  <div className="flex items-center justify-between text-2xl font-bold">
                    <span style={{ color: COLORS.verdeOscuro }}>Total:</span>
                    <span style={{ color: COLORS.verdePrincipal }}>${cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={sendToWhatsApp}
                    className="w-full py-4 rounded-lg font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-3"
                    style={{ backgroundColor: COLORS.verdePrincipal }}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span>Completar Pedido por WhatsApp</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12">
        <div className="grid md:grid-cols-3 gap-8 p-8 text-white" style={{ backgroundColor: COLORS.grisOscuro }}>
          {/* Columna 1: Dirección */}
          <div>
            <h3 className="text-lg font-bold mb-4 uppercase">📍 {nombreTienda}</h3>
            <div className="space-y-2 text-sm" style={{ color: COLORS.grisClaro }}>
              <p>Calle Principal #123</p>
              <p>Cudad, País</p>
              <p>Tel: {whatsappNumber}</p>
              <p>Email: info@ecomotion.com</p>
            </div>
          </div>

          {/* Columna 2: Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 uppercase">🔗 Links Útiles</h3>
            <div className="space-y-2 text-sm">
              <button
                onClick={() => setActiveSection('nosotros')}
                className="block hover:underline"
                style={{ color: COLORS.grisClaro }}
              >
                ¿Quiénes Somos?
              </button>
              <button className="block hover:underline" style={{ color: COLORS.grisClaro }}>
                Política de Envíos
              </button>
              <button className="block hover:underline" style={{ color: COLORS.grisClaro }}>
                Términos y Condiciones
              </button>
              <button className="block hover:underline" style={{ color: COLORS.grisClaro }}>
                Garantías
              </button>
            </div>
          </div>

          {/* Columna 3: Redes Sociales */}
          <div>
            <h3 className="text-lg font-bold mb-4 uppercase">🌐 Síguenos</h3>
            <div className="flex space-x-3">
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                style={{ backgroundColor: '#25D366' }}
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                style={{ backgroundColor: '#1877F2' }}
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                style={{ backgroundColor: '#E4405F' }}
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                style={{ backgroundColor: '#FF0000' }}
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="py-4 text-center text-white text-sm" style={{ backgroundColor: COLORS.negro }}>
          <p>© 2025 {nombreTienda}. Todos los derechos reservados. | Movilidad Eléctrica Sostenible</p>
        </div>
      </footer>
    </div>
  );
}
