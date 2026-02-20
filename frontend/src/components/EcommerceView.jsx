
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { fetchProductosEcommerce, registrarUsuario, loginUsuario, activarCuenta, logout, obtenerMisCupones } from '../services/api';
import { Navbar, Nav, Form, Container, Button } from 'react-bootstrap';
import { showToast } from '../utils/toast';
import {
  House,
  Users,
  ShoppingCart,
  Phone,
  Grid3x3,
  ChevronDown,
  Moon,
  Sun,
  BookOpen,
} from 'lucide-react';
import { COLORS, DARK_COLORS } from './ecommerce/constants/colors';
import AboutSection from './ecommerce/sections/AboutSection';
import ContactSection from './ecommerce/sections/ContactSection';
import LearnSection from './ecommerce/sections/LearnSection';
import EcommerceFooter from './ecommerce/shared/EcommerceFooter';

export default function EcommerceView() {
  console.log('🚀 Componente EcommerceView renderizado - VERSIÓN VIDEO ACTUALIZADA');
  console.log('📍 Fecha de compilación:', new Date().toISOString());

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Estados para autenticación de clientes
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showActivateMode, setShowActivateMode] = useState(false);
  const [authForm, setAuthForm] = useState({
    // Registro
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    password: '',
    password_confirm: '',
    // Activación
    numero_documento: ''
  });
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);
  const videoRef = useRef(null);

  // Estados para cupones
  const [coupons, setCoupons] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [earnedCoupon, setEarnedCoupon] = useState(null);

  // Estado para modo oscuro
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Configuración de la tienda
  const nombreTienda = localStorage.getItem('nombre_tienda') || 'EcoMotion';
  const whatsappNumber = localStorage.getItem('whatsapp_number') || '573000000000';
  const subdominio = window.location.hostname.split('.')[0];

  // Cargar datos del cliente al iniciar
  useEffect(() => {
    const accessToken = localStorage.getItem('auth_access_token');
    const savedUser = localStorage.getItem('auth_usuario');
    const savedCoupons = localStorage.getItem('ecommerce_coupons');

    console.log('=== Cargando datos al iniciar ===');
    console.log('accessToken:', accessToken);
    console.log('savedUser:', savedUser);

    if (accessToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCustomerData(user);
        setIsLoggedIn(true);
        console.log('Usuario detectado, isLoggedIn = true');
      } catch (e) {
        console.error('Error parseando usuario:', e);
        localStorage.removeItem('auth_access_token');
        localStorage.removeItem('auth_refresh_token');
        localStorage.removeItem('auth_usuario');
      }
    } else {
      setIsLoggedIn(false);
      console.log('No hay usuario, isLoggedIn = false');
    }

    if (savedCoupons) {
      setCoupons(JSON.parse(savedCoupons));
    }
  }, []);

  // Cerrar dropdown del usuario cuando se hace clic fuera
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

  // Efecto para modo oscuro - guardar preferencia y aplicar clase al body
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
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

  // Función para toggle del modo oscuro
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Cerrar dropdown cuando se cambia de sección o se hace clic fuera
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [activeSection]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Asegurar que el video se reproduzca en la sección de contacto
  useLayoutEffect(() => {
    console.log('🔍 Sección actual:', activeSection);
    console.log('🎥 videoRef.current (inmediato):', videoRef.current);

    if (activeSection === 'contacto') {
      console.log('✅ Estás en la sección de contacto');

      // Verificar si el elemento video existe en el DOM después de renderizar
      // Usar múltiples timeouts para verificar en diferentes momentos
      const checkVideo = () => {
        if (videoRef.current) {
          console.log('✅ Elemento video encontrado:', videoRef.current);
          console.log('📹 Video src:', videoRef.current.currentSrc);
          console.log('📹 Video readyState:', videoRef.current.readyState);

          const video = videoRef.current;
          console.log('Intentando reproducir video de contacto...');

          // Asegurarse de que el video esté muted para autoplay
          video.muted = true;

          // Intentar reproducir
          const playPromise = video.play();

          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('✅ Video de contacto reproduciéndose correctamente');
              })
              .catch(err => {
                console.error('❌ Error al reproducir el video:', err);
                video.setAttribute('controls', '');
              });
          }
        } else {
          console.log('❌ Elemento video NO encontrado - Reintentando...');
        }
      };

      // Verificar inmediatamente
      checkVideo();

      // Verificar después de 100ms
      setTimeout(checkVideo, 100);

      // Verificar después de 500ms
      setTimeout(checkVideo, 500);

      // Verificar después de 1000ms
      setTimeout(checkVideo, 1000);
    }
  }, [activeSection]);

  // Función para transformar productos de la API al formato del componente
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

  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        let productos = [];

        // Intentar cargar productos del backend con la nueva API e-commerce
        try {
          const response = await fetchProductosEcommerce({
            subdominio: subdominio
          });

          // La nueva API retorna: { ok, mensaje, total_productos, data }
          if (response.ok && response.data && Array.isArray(response.data) && response.data.length > 0) {
            // Transformar productos al formato que espera el componente
            productos = response.data.map(transformarProducto);
            console.log('✅ Productos cargados del backend (API E-commerce):', productos.length);
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

  // Cambiar a sección de productos cuando hay una búsqueda activa
  useEffect(() => {
    if (searchQuery && searchQuery.trim() !== '' && activeSection === 'inicio') {
      setActiveSection('productos');
    }
  }, [searchQuery, activeSection]);

  // Carrito functions
  const addToCart = (product, quantity = 1) => {
    // Verificar si hay cliente logueado
    const savedCustomer = localStorage.getItem('ecommerce_customer');

    // Si NO está logueado o NO hay cliente en localStorage, abrir modal de registro
    if (!isLoggedIn || !savedCustomer) {
      // Cambiar al modo de registro
      setIsLoginMode(false);
      // Abrir el modal de autenticación
      setShowAuthModal(true);
      // Mostrar mensaje informativo
      showToast('info', '🔐 Debes registrarte o iniciar sesión para agregar productos al carrito');
      return;
    }

    // Si SÍ está logueado, agregar al carrito
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

    showToast('success', `✅ ${product.nombre} agregado al carrito`);
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

  // Debug: mostrar en consola el estado del carrito
  console.log('Cart items:', cart);
  console.log('Cart item count:', cartItemCount);

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

    // Información del cliente si está logueado
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

    message += `📋 *Productos:*\n`;

    cart.forEach((item, index) => {
      const price = parseFloat(item.precio_venta) || 0;
      const subtotal = price * item.quantity;
      message += `${index + 1}. *${item.nombre}*\n`;
      message += `   Cantidad: ${item.quantity}\n`;
      message += `   Precio: $${price.toFixed(2)}\n`;
      message += `   Subtotal: $${subtotal.toFixed(2)}\n\n`;
    });

    message += `💰 *Total: $${cartTotal.toFixed(2)}*\n\n`;

    // Agregar cupones si tiene
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

  const sendToWhatsApp = () => {
    if (cart.length === 0) {
      showToast('error', 'Tu carrito está vacío');
      return;
    }

    // Verificar si está logueado
    if (!isLoggedIn) {
      console.log('🔒 Usuario no logueado. No se puede enviar pedido.');
      return;
    }

    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  // Reseñas
  const handleSubmitReview = () => {
    if (!isLoggedIn) {
      console.log('🔒 Usuario no logueado. No se puede dejar reseña.');
      return;
    }

    if (!newReview.comment) {
      showToast('error', 'Por favor escribe tu reseña');
      return;
    }

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

    setReviews([...reviews, review]);
    setNewReview({ rating: 5, comment: '', customerName: '' });
    setCustomerPhotos([]);

    // Generar cupón de descuento
    const newCoupon = generateCoupon();
    saveCoupon(newCoupon);
    setEarnedCoupon(newCoupon);
    setShowCouponModal(true);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const photoUrls = files.map(file => URL.createObjectURL(file));
    setCustomerPhotos([...customerPhotos, ...photoUrls]);
  };

  // ==================== AUTENTICACIÓN ====================

  const resetAuthForm = () => {
    setAuthForm({
      nombre: '',
      email: '',
      telefono: '',
      direccion: '',
      password: '',
      password_confirm: '',
      numero_documento: ''
    });
  };

  const handleRegister = async () => {
    // Validar campos (usando trim para evitar espacios en blanco)
    const nombre = authForm.nombre?.trim() || '';
    const email = authForm.email?.trim() || '';
    const telefono = authForm.telefono?.trim() || '';
    const password = authForm.password || '';
    const passwordConfirm = authForm.password_confirm || '';

    if (!nombre || !email || !telefono || !password || !passwordConfirm) {
      showToast('error', 'Por favor completa todos los campos requeridos');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authForm.email)) {
      showToast('error', 'Por favor ingresa un email válido');
      return;
    }

    // Validar contraseña
    if (authForm.password.length < 8) {
      showToast('error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (authForm.password !== authForm.password_confirm) {
      showToast('error', 'Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await registrarUsuario({
        email: authForm.email,
        password: authForm.password,
        passwordConfirm: authForm.password_confirm,
        datosCliente: {
          tipo_persona: 'NAT',
          primer_nombre: authForm.nombre,
          apellidos: '',
          telefono: authForm.telefono,
          direccion: authForm.direccion
        }
      });

      // Guardar tokens y usuario
      localStorage.setItem('auth_access_token', response.access);
      localStorage.setItem('auth_refresh_token', response.refresh);
      localStorage.setItem('auth_usuario', JSON.stringify(response.user));
      localStorage.setItem('ecommerce_customer', JSON.stringify(response.user));

      setCustomerData(response.user);
      setIsLoggedIn(true);
      setShowAuthModal(false);
      resetAuthForm();

      // Cargar cupones del usuario desde el backend
      loadCouponsFromBackend();

      showToast('success', `¡Bienvenido/a ${response.user.email}! Tu cuenta ha sido creada exitosamente.`);
    } catch (error) {
      showToast('error', error.message || 'Error al registrar usuario');
    }
  };

  const handleLogin = async () => {
    // Validar campos
    if (!authForm.email || !authForm.password) {
      showToast('error', 'Por favor ingresa tu email y contraseña');
      return;
    }

    try {
      const response = await loginUsuario({
        email: authForm.email,
        password: authForm.password
      });

      // Guardar tokens y usuario
      localStorage.setItem('auth_access_token', response.access);
      localStorage.setItem('auth_refresh_token', response.refresh);
      localStorage.setItem('auth_usuario', JSON.stringify(response.user));
      localStorage.setItem('ecommerce_customer', JSON.stringify(response.user));

      setCustomerData(response.user);
      setIsLoggedIn(true);
      setShowAuthModal(false);
      resetAuthForm();

      // Cargar cupones del usuario desde el backend
      loadCouponsFromBackend();

      showToast('success', `¡Hola de nuevo ${response.user.email}!`);
    } catch (error) {
      showToast('error', error.message || 'Error al iniciar sesión');
    }
  };

  const handleActivateAccount = async () => {
    // Validar campos
    if (!authForm.email || !authForm.numero_documento ||
        !authForm.password || !authForm.password_confirm) {
      showToast('error', 'Por favor completa todos los campos');
      return;
    }

    if (authForm.password !== authForm.password_confirm) {
      showToast('error', 'Las contraseñas no coinciden');
      return;
    }

    if (authForm.password.length < 8) {
      showToast('error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      const response = await activarCuenta({
        email: authForm.email,
        numeroDocumento: authForm.numero_documento,
        password: authForm.password,
        passwordConfirm: authForm.password_confirm
      });

      // Guardar tokens y usuario
      localStorage.setItem('auth_access_token', response.access);
      localStorage.setItem('auth_refresh_token', response.refresh);
      localStorage.setItem('auth_usuario', JSON.stringify(response.user));

      setCustomerData(response.user);
      setIsLoggedIn(true);
      setShowAuthModal(false);
      setShowActivateMode(false);
      resetAuthForm();

      showToast('success', '¡Cuenta activada exitosamente! Ya puedes iniciar sesión.');
    } catch (error) {
      showToast('error', error.message || 'Error al activar cuenta');
    }
  };

  const handleLogout = async () => {
    if (confirm('¿Estás seguro/a de que quieres cerrar sesión?')) {
      try {
        await logout();
      } catch (error) {
        console.error('Error en logout:', error);
      }

      setIsLoggedIn(false);
      setCustomerData(null);

      showToast('success', 'Has cerrado sesión correctamente.');
    }
  };

  // ==================== CUPONES ====================

  const generateCoupon = () => {
    const discount = Math.floor(Math.random() * 15) + 10; // 10-25% de descuento
    const code = `DESC${Date.now().toString().slice(-6).toUpperCase()}`;

    const coupon = {
      codigo: code,
      descuento: discount,
      fechaGeneracion: new Date().toISOString(),
      estado: 'activo',
      usado: false
    };

    return coupon;
  };

  // Cargar cupones desde el backend
  const loadCouponsFromBackend = async () => {
    if (!customerData?.email) {
      console.warn('[CUPONES] No hay email del cliente para cargar cupones. customerData:', customerData);
      return;
    }

    try {
      console.log('[CUPONES] Cargando cupones del cliente:', customerData.email);
      const response = await obtenerMisCupones({ correo: customerData.email });

      console.log('[CUPONES] Respuesta del backend:', response);

      // Mostrar mensaje si existe
      if (response.mensaje) {
        console.log('[CUPONES] Mensaje del backend:', response.mensaje);
      }

      // Verificar si hay cupones en la respuesta
      console.log('[CUPONES] Cantidad de cupones en respuesta:', response.cupones?.length || 0);
      if (response.cupones && response.cupones.length > 0) {
        console.log('[CUPONES] Primer cupón (crudo):', response.cupones[0]);
      }

      // Transformar los cupones del backend al formato local
      const backendCoupons = (response.cupones || []).map((cc, idx) => {
        // El serializer retorna 'cupon_detalle' con la info completa del cupón
        const cupon = cc.cupon_detalle || cc.cupon || {};

        console.log(`[CUPONES] Procesando cupón #${idx}:`, {
          'cc.cupon_detalle': cc.cupon_detalle,
          'cc.cupon': cc.cupon,
          'cupon (merged)': cupon
        });

        // Mapear campos del backend al formato local
        const codigo = cupon.nombre || cupon.codigo || 'DESCONOCIDO';
        const descuento = parseFloat(cupon.valor || cupon.descuento || 0);

        console.log(`[CUPONES] Mapeo: nombre=${cupon.nombre} → codigo=${codigo}, valor=${cupon.valor} → descuento=${descuento}`);

        const transformed = {
          codigo: codigo,
          descuento: descuento,
          fechaGeneracion: cc.creado_en,
          usado: !cc.activo || cc.cantidad_disponible <= 0,
          cantidadDisponible: cc.cantidad_disponible,
          id: cc.id,
          generadoLocal: false, // Marcar como viene del backend
          // Datos adicionales del cupón para referencia
          tipo: cupon.tipo,
          tipo_display: cupon.tipo_display,
          fecha_vencimiento: cupon.fecha_vencimiento
        };
        console.log('[CUPONES] Cupón transformado:', transformed);
        return transformed;
      });

      console.log('[CUPONES] Cupones del backend transformados:', backendCoupons);

      // Combinar con cupones locales (generados por reseñas)
      const localCoupons = coupons.filter(c => c.generadoLocal === true);
      console.log('[CUPONES] Cupones locales:', localCoupons);

      const allCoupons = [...backendCoupons, ...localCoupons];

      setCoupons(allCoupons);
      localStorage.setItem('ecommerce_coupons', JSON.stringify(allCoupons));

      console.log(`[CUPONES] Total de cupones: ${allCoupons.length} (${backendCoupons.length} del backend, ${localCoupons.length} locales)`);
    } catch (error) {
      console.error('[CUPONES] Error cargando cupones:', error.message);
      console.error('[CUPONES] Detalle del error:', error);
      // Si falla, mantener los cupones locales
    }
  };

  const saveCoupon = (coupon) => {
    const updatedCoupons = [...coupons, coupon];
    setCoupons(updatedCoupons);
    localStorage.setItem('ecommerce_coupons', JSON.stringify(updatedCoupons));

    // Actualizar contador de reseñas del cliente
    if (customerData) {
      const updatedCustomer = {
        ...customerData,
        reseñas: (customerData.reseñas || 0) + 1
      };
      setCustomerData(updatedCustomer);
      localStorage.setItem('ecommerce_customer', JSON.stringify(updatedCustomer));
    }
  };

  const formatCouponDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
    <div className="min-h-screen" style={{
      backgroundColor: darkMode ? DARK_COLORS.background : COLORS.blanco,
      color: darkMode ? DARK_COLORS.textPrimary : COLORS.negro,
      transition: 'background-color 0.3s ease, color 0.3s ease'
    }}>
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

          @keyframes glow {
            0%, 100% {
              box-shadow: 0 0 5px rgba(255, 255, 255, 0.5),
                          0 0 10px rgba(255, 255, 255, 0.3),
                          0 0 15px rgba(255, 255, 255, 0.2);
              text-shadow: 0 0 5px rgba(255, 255, 255, 0.8),
                          0 0 10px rgba(255, 255, 255, 0.5);
            }
            50% {
              box-shadow: 0 0 10px rgba(255, 255, 255, 0.8),
                          0 0 20px rgba(255, 255, 255, 0.5),
                          0 0 30px rgba(255, 255, 255, 0.3);
              text-shadow: 0 0 10px rgba(255, 255, 255, 1),
                          0 0 20px rgba(255, 255, 255, 0.8),
                          0 0 30px rgba(255, 255, 255, 0.6);
            }
          }

          @keyframes glow-futuristic {
            0%, 100% {
              box-shadow: 0 0 20px rgba(255, 215, 0, 0.6),
                          0 0 40px rgba(255, 167, 38, 0.4),
                          inset 0 0 20px rgba(255, 255, 255, 0.3),
                          0 0 60px rgba(255, 215, 0, 0.3);
            }
            50% {
              box-shadow: 0 0 40px rgba(255, 215, 0, 1),
                          0 0 80px rgba(255, 167, 38, 0.6),
                          inset 0 0 30px rgba(255, 255, 255, 0.5),
                          0 0 100px rgba(255, 215, 0, 0.5);
            }
          }

          @keyframes shimmer {
            0% {
              background-position: -200% center;
            }
            100% {
              background-position: 200% center;
            }
          }

          @keyframes pulse-border {
            0%, 100% {
              border-color: rgba(255, 215, 0, 0.6);
              box-shadow: 0 0 20px rgba(255, 215, 0, 0.5),
                          0 0 40px rgba(255, 167, 38, 0.3);
            }
            50% {
              border-color: rgba(255, 215, 0, 1);
              box-shadow: 0 0 40px rgba(255, 215, 0, 1),
                          0 0 80px rgba(255, 167, 38, 0.8),
                          0 0 120px rgba(255, 215, 0, 0.5);
            }
          }

          /* Scrollbar hide utility */
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
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

          /* Botones del navbar con efecto futurista sobrio */
          .nav-btn-futuristic {
            position: relative !important;
            padding: 12px 24px !important;
            border-radius: 25px !important;
            background: rgba(46, 125, 50, 0.15) !important;
            backdrop-filter: blur(10px) !important;
            border: 2px solid rgba(46, 125, 50, 0.4) !important;
            color: #E8F5E9 !important;
            font-weight: 600 !important;
            font-size: 15px !important;
            cursor: pointer !important;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
            overflow: hidden !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            text-decoration: none !important;
            user-select: none !important;
            white-space: nowrap !important;
          }

          /* Asegurar que los iconos SVG sean de color blanco */
          .nav-btn-futuristic svg {
            color: #E8F5E9 !important;
            stroke: #E8F5E9 !important;
          }

          .nav-btn-futuristic::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(129, 199, 132, 0.3),
              transparent
            );
            transition: left 0.6s ease;
          }

          .nav-btn-futuristic:hover::before {
            left: 100%;
          }

          .nav-btn-futuristic:hover {
            background: rgba(46, 125, 50, 0.25) !important;
            border-color: rgba(76, 175, 80, 0.7) !important;
            box-shadow: 0 0 25px rgba(76, 175, 80, 0.4),
                        inset 0 0 20px rgba(76, 175, 80, 0.15) !important;
            transform: translateY(-2px) scale(1.03) !important;
          }

          .nav-btn-futuristic.active {
            background: rgba(76, 175, 80, 0.3) !important;
            border-color: rgba(76, 175, 80, 0.8) !important;
            box-shadow: 0 0 20px rgba(76, 175, 80, 0.4),
                        inset 0 0 15px rgba(76, 175, 80, 0.2) !important;
            transform: scale(1.05) !important;
          }

          /* Dropdown futurista */
          .nav-dropdown-futuristic {
            background: rgba(27, 94, 32, 0.98) !important;
            backdrop-filter: blur(20px) !important;
            border: 2px solid rgba(76, 175, 80, 0.5) !important;
            border-radius: 12px !important;
            transition: all 0.3s ease !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
                        0 0 15px rgba(76, 175, 80, 0.3) !important;
          }

          .dropdown-item {
            color: #FFF !important;
            font-weight: 500 !important;
            transition: all 0.3s ease !important;
            border-radius: 10px !important;
            margin: 4px 8px !important;
          }

          .dropdown-item:hover {
            background: linear-gradient(135deg, ${COLORS.acentoNaranja}, ${COLORS.acentoTurquesa}) !important;
            color: #000 !important;
            transform: translateX(10px) !important;
            box-shadow: 0 0 15px rgba(255, 167, 38, 0.6) !important;
          }

          .dropdown-divider {
            border-color: rgba(255, 215, 0, 0.5) !important;
            margin: 8px 0 !important;
          }

          /* Video de fondo para sección de contacto */
          .contact-background-video {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            z-index: 0 !important;
            background-color: #1a1a1a !important;
          }

          .contact-overlay {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background-color: rgba(0, 0, 0, 0.5) !important;
            z-index: 1 !important;
            pointer-events: none !important;
          }

          .contact-content {
            position: relative !important;
            z-index: 10 !important;
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

          /* Responsive improvements */
          @media (min-width: 992px) {
            /* Better spacing on large screens */
            .navbar > .container-fluid {
              display: flex;
              align-items: center;
            }

            .navbar-collapse {
              flex: 1;
              display: flex !important;
            }
          }

          @media (min-width: 768px) and (max-width: 1199px) {
            /* Medium screens - adjust button size and search */
            .nav-btn-futuristic {
              padding: 8px 14px !important;
              font-size: 13px !important;
            }

            .navbar .form-control {
              width: 140px !important;
            }
          }

          @media (max-width: 991px) {
            .navbar-collapse {
              max-height: 85vh;
              overflow-y: auto;
              padding: 15px 0;
            }

            .nav-btn-futuristic {
              padding: 10px 18px !important;
              font-size: 14px !important;
            }

            /* Centrar contenedor en móvil */
            .navbar-collapse > div {
              justify-content: center !important;
            }

            /* Search bar y carrito centrados */
            .navbar-collapse .d-flex {
              width: 100%;
              justify-content: center !important;
            }

            .navbar .form-control {
              width: 180px !important;
            }
          }

          @media (max-width: 768px) {
            /* Modal responsive */
            .modal-content-custom {
              margin: 10px;
              max-height: calc(100vh - 100px) !important;
            }

            /* Navbar adjustments */
            .navbar-brand {
              font-size: 1.1rem !important;
            }

            .navbar-brand span {
              font-size: 16px !important;
            }

            /* Botones más pequeños en móvil */
            .nav-btn-futuristic {
              padding: 8px 14px !important;
              font-size: 13px !important;
            }

            .nav-btn-futuristic svg {
              width: 16px !important;
              height: 16px !important;
            }

            /* Contenedor de búsqueda y carrito en móvil */
            .navbar-collapse .d-flex.flex-column {
              width: 100%;
              padding: 10px 0;
            }

            .navbar .form-control {
              width: 100% !important;
              max-width: 200px !important;
            }

            /* Hero responsive text */
            .hero-title {
              font-size: 2rem !important;
            }

            /* Categorías responsive */
            .category-card {
              padding: 12px !important;
            }

            /* Productos grid responsive */
            .product-card h3 {
              font-size: 14px !important;
            }
          }

          @media (max-width: 576px) {
            /* Extra small screens */
            .navbar-brand {
              font-size: 1rem !important;
            }

            .nav-btn-futuristic {
              padding: 7px 12px !important;
              font-size: 12px !important;
            }

            .nav-btn-futuristic svg {
              width: 14px !important;
              height: 14px !important;
            }

            /* Ajustar formulario de búsqueda */
            .navbar .form-control {
              font-size: 13px !important;
              padding: 6px 10px !important;
            }

            /* Hero más pequeño */
            .hero-title {
              font-size: 1.6rem !important;
            }

            /* Productos */
            .grid-cols-2 {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 8px !important;
            }

            .product-card p.text-2xl {
              font-size: 1.2rem !important;
            }
          }

          /* ==================== MODO OSCURO ==================== */
          ${darkMode ? `
            body {
              background-color: ${DARK_COLORS.background} !important;
              color: ${DARK_COLORS.textPrimary} !important;
            }

            /* Navbar en modo oscuro */
            .navbar {
              background: linear-gradient(135deg, #1a1a1a99, #2d2d2dCC) !important;
            }

            /* Main container */
            .min-h-screen {
              background-color: ${DARK_COLORS.background} !important;
            }

            /* Cards y contenedores */
            .card,
            .product-card,
            .category-card {
              background-color: ${DARK_COLORS.cardBackground} !important;
              color: ${DARK_COLORS.textPrimary} !important;
              border-color: ${DARK_COLORS.borderColor} !important;
            }

            /* Botones del navbar en modo oscuro */
            .nav-btn-futuristic {
              background: rgba(76, 175, 80, 0.2) !important;
              border-color: rgba(76, 175, 80, 0.5) !important;
              color: #ffffff !important;
            }

            .nav-btn-futuristic:hover {
              background: rgba(76, 175, 80, 0.3) !important;
              border-color: rgba(76, 175, 80, 0.8) !important;
            }

            .nav-btn-futuristic.active {
              background: rgba(76, 175, 80, 0.35) !important;
              border-color: rgba(76, 175, 80, 0.9) !important;
            }

            /* Dropdowns en modo oscuro */
            .nav-dropdown-futuristic,
            .dropdown-menu {
              background-color: ${DARK_COLORS.cardBackground} !important;
              border-color: ${DARK_COLORS.borderColor} !important;
            }

            /* Inputs y formularios */
            input,
            textarea,
            select,
            .form-control {
              background-color: ${DARK_COLORS.inputBackground} !important;
              color: ${DARK_COLORS.textPrimary} !important;
              border-color: ${DARK_COLORS.borderColor} !important;
            }

            input::placeholder,
            textarea::placeholder {
              color: ${DARK_COLORS.textSecondary} !important;
            }

            /* Modal en modo oscuro */
            .modal-content,
            .bg-white {
              background-color: ${DARK_COLORS.cardBackground} !important;
              color: ${DARK_COLORS.textPrimary} !important;
            }

            /* Textos secundarios */
            .text-muted,
            .text-secondary {
              color: ${DARK_COLORS.textSecondary} !important;
            }

            /* Footer en modo oscuro */
            footer {
              background-color: ${DARK_COLORS.navbarBackground} !important;
              color: ${DARK_COLORS.textPrimary} !important;
            }

            /* Animaciones y efectos */
            .animated-bg {
              opacity: 0.9;
            }
          ` : ''}
        `}
      </style>

      {/* Header con Bootstrap Navbar */}
      <Navbar bg="success" variant="dark" expand="lg" className="sticky-top shadow-lg" style={{
        background: `linear-gradient(135deg, ${COLORS.verdePrincipal}99, ${COLORS.verdeOscuro}CC) !important`,
        backdropFilter: 'blur(20px)',
        boxShadow: `0 4px 30px rgba(0, 0, 0, 0.3), 0 0 20px ${COLORS.acentoNaranja}66`
      }}>
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
            {/* Todos los elementos en una línea centrada */}
            <div className="d-flex align-items-center justify-content-lg-center w-100 gap-2 gap-lg-3">
              {/* Botones de navegación - Todos en una línea */}
              <Nav className="d-flex justify-content-center align-items-center gap-2 gap-lg-3 flex-wrap flex-row">
                <button
                  onClick={() => setActiveSection('inicio')}
                  className={`nav-btn-futuristic ${activeSection === 'inicio' ? 'active' : ''}`}
                >
                  <House size={18} strokeWidth={2} />
                  <span>Inicio</span>
                </button>

                <button
                  onClick={() => setActiveSection('nosotros')}
                  className={`nav-btn-futuristic ${activeSection === 'nosotros' ? 'active' : ''}`}
                >
                  <Users size={18} strokeWidth={2} />
                  <span>Nosotros</span>
                </button>

                <button
                  onClick={() => setActiveSection('productos')}
                  className={`nav-btn-futuristic ${activeSection === 'productos' ? 'active' : ''}`}
                >
                  <ShoppingCart size={18} strokeWidth={2} />
                  <span>Productos</span>
                </button>

                <button
                  onClick={() => setActiveSection('contacto')}
                  className={`nav-btn-futuristic ${activeSection === 'contacto' ? 'active' : ''}`}
                >
                  <Phone size={18} strokeWidth={2} />
                  <span>Contacto</span>
                </button>

                <button
                  onClick={() => setActiveSection('informate')}
                  className={`nav-btn-futuristic ${activeSection === 'informate' ? 'active' : ''}`}
                >
                  <BookOpen size={18} strokeWidth={2} />
                  <span>Infórmate</span>
                </button>

                <button
                  onClick={() => setActiveSection('infórmate')}
                  className={`nav-btn-futuristic ${activeSection === 'infórmate' ? 'active' : ''}`}
                >
                  <BookOpen size={18} strokeWidth={2} />
                  <span>Infórmate</span>
                </button>

                {/* Dropdown de Categorías */}
                {categories.length > 0 && (
                  <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`nav-btn-futuristic ${isDropdownOpen ? 'active' : ''}`}
                    >
                      <Grid3x3 size={18} strokeWidth={2} />
                      <span>Categorías</span>
                      <ChevronDown
                        size={16}
                        strokeWidth={2.5}
                        style={{
                          transition: 'transform 0.3s ease',
                          transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}
                      />
                    </button>
                    {isDropdownOpen && (
                      <div className="nav-dropdown-futuristic" style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginTop: '10px',
                        padding: '8px',
                        minWidth: '200px',
                        zIndex: 1000,
                        animation: 'fadeIn 0.2s ease-out'
                      }}>
                        <div
                          onClick={() => { setActiveSection('productos'); setActiveCategory(null); setIsDropdownOpen(false); }}
                          style={{
                            padding: '10px 15px',
                            color: '#E8F5E9',
                            fontWeight: '500',
                            borderRadius: '8px',
                            margin: '2px 4px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(76, 175, 80, 0.2)';
                            e.currentTarget.style.transform = 'translateX(5px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.transform = 'translateX(0)';
                          }}
                        >
                          ✨ Todas
                        </div>
                        <div style={{ borderColor: 'rgba(76, 175, 80, 0.3)', margin: '6px 8px', borderBottom: '1px solid' }}></div>
                        {categories.map((category) => (
                          <div
                            key={category}
                            onClick={() => { setActiveSection('productos'); setActiveCategory(category); setIsDropdownOpen(false); }}
                            style={{
                              padding: '10px 15px',
                              color: '#E8F5E9',
                              fontWeight: '500',
                              borderRadius: '8px',
                              margin: '2px 4px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(76, 175, 80, 0.2)';
                              e.currentTarget.style.transform = 'translateX(5px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.transform = 'translateX(0)';
                            }}
                          >
                            {getCategoryEmoji(category)} {category}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Nav>

              {/* Separador visual - Solo en desktop */}
              <div className="d-none d-lg-block" style={{ width: '1px', height: '40px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '0 10px' }}></div>

              {/* Carrito y Búsqueda - Alineados */}
              <div className="d-flex align-items-center gap-2 gap-lg-3">
                {/* Carrito - Enviar directamente a WhatsApp */}
                <div className="position-relative flex-shrink-0" style={{ padding: '5px', marginRight: '5px' }}>
                  <button
                    className={`nav-btn-futuristic position-relative ${!isLoggedIn ? 'opacity-50' : ''}`}
                    style={{
                      padding: '10px 15px',
                      cursor: !isLoggedIn ? 'not-allowed' : 'pointer'
                    }}
                  onClick={() => {
                    if (cart.length > 0) {
                      // Verificar autenticación ANTES de enviar a WhatsApp
                      if (!isLoggedIn) {
                        console.log('Botón carrito - Usuario NO logueado');
                        return;
                      }
                      console.log('Botón carrito - Usuario logueado, enviando a WhatsApp');
                      sendToWhatsApp();
                    } else {
                      showToast('error', 'Tu carrito está vacío');
                    }
                  }}
                  title={!isLoggedIn ? 'Inicia sesión para completar tu pedido' : 'Completar pedido por WhatsApp'}
                >
                  <svg
                    style={{ width: '24px', height: '24px' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartItemCount > 0 && (
                    <span
                      className="badge rounded-pill"
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        backgroundColor: '#DC2626',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        minWidth: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 5px',
                        border: '2px solid white',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                        zIndex: 9999
                      }}
                    >
                      {cartItemCount}
                    </span>
                  )}
                  </button>
                </div>

                {/* Botón de Modo Oscuro */}
                <button
                  className="nav-btn-futuristic flex-shrink-0"
                  onClick={toggleDarkMode}
                  title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                  {darkMode ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
                </button>

                {/* Usuario / Cuenta */}
                {isLoggedIn ? (
                  <div style={{ position: 'relative', display: 'inline-block' }} ref={userDropdownRef}>
                    <button
                      className="nav-btn-futuristic position-relative flex-shrink-0"
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      title={`Hola, ${customerData?.nombre}`}
                    >
                      <svg
                        style={{ width: '18px', height: '18px' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {coupons.length > 0 && (
                        <span
                          className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                          style={{ backgroundColor: COLORS.acentoNaranja }}
                        >
                          {coupons.length}
                        </span>
                      )}
                    </button>
                    <small className="d-block text-center text-white" style={{ fontSize: '10px' }}>
                      {customerData?.nombre?.split(' ')[0]}
                    </small>

                    {/* Dropdown Menu */}
                    {showUserDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '10px',
                        minWidth: '200px',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        zIndex: 1000,
                        overflow: 'hidden',
                        animation: 'fadeIn 0.2s ease-out'
                      }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
                          <p style={{ margin: 0, fontWeight: 'bold', color: COLORS.verdeOscuro }}>
                            {customerData?.nombre}
                          </p>
                          <p style={{ margin: 0, fontSize: '12px', color: COLORS.grisMedio }}>
                            {customerData?.email}
                          </p>
                        </div>

                        <button
                          onClick={async () => {
                            setShowUserDropdown(false);
                            // Cargar cupones frescos del backend antes de mostrar el modal
                            await loadCouponsFromBackend();
                            setShowCouponModal(true);
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '14px',
                            color: COLORS.grisOscuro,
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          🎁 Mis Cupones ({coupons.length})
                        </button>

                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            handleLogout();
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '14px',
                            color: '#d32f2f',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffebee'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          🚪 Cerrar Sesión
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    className="nav-btn-futuristic flex-shrink-0"
                    onClick={() => setShowAuthModal(true)}
                    title="Iniciar sesión / Registrarse"
                  >
                    <svg
                      style={{ width: '18px', height: '18px' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </button>
                )}

                {/* Barra de búsqueda */}
                <Form className="d-flex">
                  <Form.Control
                    type="search"
                    placeholder="Buscar..."
                    className="me-1"
                    aria-label="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '200px',
                      height: '45px',
                      fontSize: '14px'
                    }}
                  />
                  <Button
                    variant="outline-light"
                    style={{ height: '45px', padding: '0 12px' }}
                  >
                    🔍
                  </Button>
                </Form>
              </div>
            </div>
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
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-white"
                    style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.3)' }}
                  >
                    Bienvenidos
                  </h1>

                  {/* Subtítulo con gradiente */}
                  <p
                    className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-8 text-white"
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
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                    <button
                      onClick={() => setActiveSection('productos')}
                      className="px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-white text-base sm:text-lg md:text-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
                      style={{
                        backgroundColor: 'rgba(46, 125, 50, 0.15)',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(46, 125, 50, 0.4)'
                      }}
                    >
                      ⚡ Ver Productos
                    </button>
                    <button
                      onClick={() => setActiveSection('nosotros')}
                      className="px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-white text-base sm:text-lg md:text-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
                      style={{
                        backgroundColor: 'rgba(46, 125, 50, 0.15)',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(46, 125, 50, 0.4)'
                      }}
                    >
                      🌱 Conoce Más
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="mt-8 sm:mt-12 grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-3xl mx-auto px-4">
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
                        8+
                      </div>
                      <div className="text-white/90 text-xs sm:text-sm">Productos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
                        100%
                      </div>
                      <div className="text-white/90 text-xs sm:text-sm">Ecológico</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
                        60km
                      </div>
                      <div className="text-white/90 text-xs sm:text-sm">Autonomía</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Categorías destacadas */}
            <div className="mb-8 md:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center" style={{ color: COLORS.verdeOscuro }}>
                Categorías Destacadas
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-2">
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
                    <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">{getCategoryEmoji(category)}</div>
                    <h3 className="font-semibold text-sm sm:text-base" style={{ color: COLORS.verdeOscuro }}>{category}</h3>
                  </button>
                ))}
              </div>
            </div>

            {/* Productos destacados */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center" style={{ color: COLORS.verdeOscuro }}>
                Productos Destacados
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 px-2">
                {products.slice(0, 3).map((product, index) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowProductModal(true);
                    }}
                    className="product-card rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all transform hover:scale-105"
                    style={{
                      backgroundColor: darkMode ? DARK_COLORS.cardBackground : COLORS.blanco,
                      animationDelay: `${index * 0.2}s`
                    }}
                  >
                    <div
                      className="w-full h-36 sm:h-40 md:h-48 flex items-center justify-center"
                      style={{ backgroundColor: darkMode ? DARK_COLORS.inputBackground : COLORS.grisClaro }}
                    >
                      {product.imagen ? (
                        <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl sm:text-5xl md:text-6xl">{getCategoryEmoji(product.categoria_nombre)}</span>
                      )}
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="font-bold text-base sm:text-lg mb-2" style={{ color: darkMode ? DARK_COLORS.textPrimary : COLORS.verdeOscuro }}>
                        {product.nombre}
                      </h3>
                      <p className="text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2" style={{ color: darkMode ? DARK_COLORS.textSecondary : COLORS.grisMedio }}>
                        {product.descripcion}
                      </p>
                      <p className="text-xl sm:text-2xl font-bold" style={{ color: COLORS.verdePrincipal }}>
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
        <AboutSection activeSection={activeSection} nombreTienda={nombreTienda} darkMode={darkMode} />

        {/* Sección PRODUCTOS */}
        {activeSection === 'productos' && (
          <div>
            {/* Filtros de categoría */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 px-2 scrollbar-hide">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold whitespace-nowrap transition-all ${
                    activeCategory === null
                      ? 'text-white shadow-lg'
                      : 'bg-white hover:shadow-md'
                  }`}
                  style={{
                    backgroundColor: activeCategory === null ? COLORS.verdePrincipal : COLORS.blanco,
                    color: activeCategory === null ? COLORS.blanco : COLORS.verdePrincipal,
                    fontSize: '13px'
                  }}
                >
                  Todas
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold whitespace-nowrap transition-all ${
                      activeCategory === category
                        ? 'text-white shadow-lg'
                        : 'bg-white hover:shadow-md'
                    }`}
                    style={{
                      backgroundColor: activeCategory === category ? COLORS.verdePrincipal : COLORS.blanco,
                      color: activeCategory === category ? COLORS.blanco : COLORS.verdePrincipal,
                      fontSize: '13px'
                    }}
                  >
                    {getCategoryEmoji(category)} {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de productos */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-2">
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
                      <span className="text-4xl sm:text-5xl md:text-6xl">{getCategoryEmoji(product.categoria_nombre)}</span>
                    )}
                  </div>
                  <div className="p-2 sm:p-3 md:p-4">
                    {product.categoria_nombre && (
                      <span className="inline-block px-2 py-0.5 text-[10px] sm:text-xs rounded-full mb-1 sm:mb-2 text-white" style={{ backgroundColor: COLORS.verdePrincipal }}>
                        {product.categoria_nombre}
                      </span>
                    )}
                    <h3 className="font-bold text-xs sm:text-sm md:text-base mb-1 sm:mb-2 line-clamp-2" style={{ color: COLORS.verdeOscuro }}>
                      {product.nombre}
                    </h3>
                    <p className="text-[10px] sm:text-xs md:text-sm mb-2 sm:mb-3 line-clamp-1 sm:line-clamp-2" style={{ color: COLORS.grisMedio }}>
                      {product.descripcion}
                    </p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: COLORS.verdePrincipal }}>
                      ${parseFloat(product.precio_venta || 0).toFixed(2)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="w-full mt-2 sm:mt-3 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-white shadow-md transition-all text-xs sm:text-sm hover:shadow-lg"
                      style={{ backgroundColor: COLORS.acentoNaranja }}
                    >
                      {isLoggedIn ? '🛒 Agregar al Carrito' : '🔐 Regístrate para comprar'}
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
        <ContactSection activeSection={activeSection} whatsappNumber={whatsappNumber} darkMode={darkMode} />

        {/* Sección INFÓRMATE - Legislación Colombia */}
        <LearnSection activeSection={activeSection} darkMode={darkMode} />
      </main>

      {/* Modal del Producto con Ficha Técnica */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ paddingTop: '60px' }}>
          <div className="flex items-start justify-center min-h-screen px-2 sm:px-4 py-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowProductModal(false)}
              style={{ paddingTop: '60px' }}
            />

            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto my-4 overflow-hidden modal-content-custom" style={{ maxHeight: 'calc(100vh - 100px)' }}>
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-3 sm:p-4 md:p-6 z-10">
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  <h2 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-bold" style={{ color: COLORS.verdeOscuro }}>
                    {selectedProduct.nombre}
                  </h2>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-3 sm:p-4 md:p-6 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 60px)' }}>
                <div className="grid md:grid-cols-2 gap-3 sm:gap-4 md:gap-8">
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
                      <div className="w-full h-48 sm:h-64 md:h-80 flex items-center justify-center">
                        <span className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl">{getCategoryEmoji(selectedProduct.categoria_nombre)}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    {selectedProduct.categoria_nombre && (
                      <span className="inline-block px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full mb-3 sm:mb-4 text-white" style={{ backgroundColor: COLORS.verdePrincipal }}>
                        {selectedProduct.categoria_nombre}
                      </span>
                    )}

                    <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6 leading-relaxed" style={{ color: COLORS.grisOscuro }}>
                      {selectedProduct.descripcion || 'Producto de alta calidad para movilidad eléctrica.'}
                    </p>

                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6" style={{ color: COLORS.verdePrincipal }}>
                      ${parseFloat(selectedProduct.precio_venta || 0).toFixed(2)}
                    </p>

                    {/* Ficha Técnica */}
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl" style={{ backgroundColor: COLORS.beigeCrema }}>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 text-center" style={{ color: COLORS.verdeOscuro }}>
                        📋 Ficha Técnica
                      </h3>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-1">
                          <span style={{ color: COLORS.grisMedio }}>Categoría:</span>
                          <span className="font-semibold text-center" style={{ color: COLORS.verdeOscuro }}>
                            {selectedProduct.categoria_nombre || 'N/A'}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-1">
                          <span style={{ color: COLORS.grisMedio }}>Stock:</span>
                          <span className="font-semibold text-center" style={{ color: COLORS.verdeOscuro }}>
                            {selectedProduct.stock || 'Disponible'}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-1">
                          <span style={{ color: COLORS.grisMedio }}>SKU:</span>
                          <span className="font-semibold text-center" style={{ color: COLORS.verdeOscuro }}>
                            {selectedProduct.codigo_barras || 'N/A'}
                          </span>
                        </div>
                        {selectedProduct.marca_nombre && (
                          <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-1">
                            <span style={{ color: COLORS.grisMedio }}>Marca:</span>
                            <span className="font-semibold text-center" style={{ color: COLORS.verdeOscuro }}>
                              {selectedProduct.marca_nombre}
                            </span>
                          </div>
                        )}
                        {selectedProduct.iva_porcentaje && (
                          <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-1">
                            <span style={{ color: COLORS.grisMedio }}>IVA:</span>
                            <span className="font-semibold text-center" style={{ color: COLORS.verdeOscuro }}>
                              {selectedProduct.iva_porcentaje}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:gap-4">
                      <button
                        onClick={() => {
                          addToCart(selectedProduct);
                          setShowProductModal(false);
                        }}
                        className="flex-1 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 rounded-xl font-bold text-white text-sm sm:text-base md:text-lg shadow-lg transition-all hover:shadow-xl"
                        style={{ backgroundColor: COLORS.acentoNaranja }}
                      >
                        🛒 {isLoggedIn ? 'Agregar al Carrito' : '🔐 Regístrate para comprar'}
                      </button>
                      <button
                        onClick={() => {
                          addToCart(selectedProduct);
                          setShowProductModal(false);
                          setShowCart(true);
                        }}
                        className="flex-1 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 rounded-xl font-bold text-white text-sm sm:text-base md:text-lg shadow-lg transition-all hover:shadow-xl"
                        style={{ backgroundColor: COLORS.verdePrincipal }}
                      >
                        ⚡ {isLoggedIn ? 'Comprar Ahora' : '🔐 Regístrate aquí'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sección de Reseñas */}
                <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t">
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: COLORS.verdeOscuro }}>
                    ⭐ Reseñas de Clientes
                  </h3>

                  {/* Formulario para agregar reseña */}
                  <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl" style={{ backgroundColor: COLORS.grisClaro }}>
                    <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: COLORS.verdePrincipal }}>
                      Comparte tu experiencia
                    </h4>
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: COLORS.grisOscuro }}>
                          Tu Nombre
                        </label>
                        <input
                          type="text"
                          value={newReview.customerName}
                          onChange={(e) => setNewReview({ ...newReview, customerName: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 rounded-lg border-2 focus:outline-none text-sm sm:text-base"
                          style={{ borderColor: COLORS.verdeMenta }}
                          placeholder="Tu nombre"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: COLORS.grisOscuro }}>
                          Calificación
                        </label>
                        {renderStars(newReview.rating, true, (rating) => setNewReview({ ...newReview, rating }))}
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: COLORS.grisOscuro }}>
                          Tu Reseña
                        </label>
                        <textarea
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 rounded-lg border-2 focus:outline-none text-sm sm:text-base"
                          style={{ borderColor: COLORS.verdeMenta }}
                          rows="3"
                          placeholder="Cuéntanos tu experiencia..."
                        ></textarea>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: COLORS.grisOscuro }}>
                          Sube tus fotos (opcional)
                        </label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="w-full px-3 sm:px-4 py-2 rounded-lg border-2 text-xs sm:text-sm"
                          style={{ borderColor: COLORS.verdeMenta }}
                        />
                        {customerPhotos.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {customerPhotos.map((photo, index) => (
                              <img key={index} src={photo} alt={`Preview ${index}`} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg" />
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleSubmitReview}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
                        style={{ backgroundColor: COLORS.verdePrincipal }}
                      >
                        Publicar Reseña
                      </button>
                    </div>
                  </div>

                  {/* Lista de reseñas */}
                  <div className="space-y-3 sm:space-y-4">
                    {reviews.length === 0 ? (
                      <p className="text-center py-6 sm:py-8 text-sm sm:text-base" style={{ color: COLORS.grisMedio }}>
                        ¡Sé el primero en dejar una reseña!
                      </p>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="p-3 sm:p-4 rounded-xl" style={{ backgroundColor: COLORS.beigeCrema }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <div
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base"
                                style={{ backgroundColor: COLORS.verdePrincipal }}
                              >
                                {review.customerName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-sm sm:text-base" style={{ color: COLORS.verdeOscuro }}>
                                  {review.customerName}
                                </p>
                                <p className="text-xs sm:text-sm" style={{ color: COLORS.grisMedio }}>{review.date}</p>
                              </div>
                            </div>
                            <div className="transform scale-75 sm:scale-100">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          <p className="mb-2 sm:mb-3 text-sm sm:text-base" style={{ color: COLORS.grisOscuro }}>{review.comment}</p>
                          {review.photos && review.photos.length > 0 && (
                            <div className="flex gap-2">
                              {review.photos.map((photo, index) => (
                                <img key={index} src={photo} alt={`Review ${index}`} className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-lg" />
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

            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold" style={{ color: COLORS.verdeOscuro }}>🛒 Tu Carrito</h2>
                  <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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
                <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-6 space-y-4">
                  <div className="flex items-center justify-between text-2xl font-bold">
                    <span style={{ color: COLORS.verdeOscuro }}>Total:</span>
                    <span style={{ color: COLORS.verdePrincipal }}>${cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={sendToWhatsApp}
                    disabled={!isLoggedIn}
                    className={`w-full py-4 rounded-lg font-bold text-white text-lg shadow-lg transition-all flex items-center justify-center space-x-3 ${!isLoggedIn ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}`}
                    style={{ backgroundColor: COLORS.verdePrincipal }}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span>{isLoggedIn ? 'Completar Pedido por WhatsApp' : '🔒 Inicia sesión para comprar'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <EcommerceFooter
        nombreTienda={nombreTienda}
        whatsappNumber={whatsappNumber}
        onNavigate={setActiveSection}
      />

      {/* ==================== MODALES ==================== */}
      {/* MODAL DE AUTENTICACIÓN */}
      {showAuthModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{
          zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.7)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden relative" style={{
            backgroundColor: darkMode ? DARK_COLORS.cardBackground : COLORS.blanco,
            maxHeight: '95vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Botón de cerrar (X) */}
            <button
              onClick={() => {
                setShowAuthModal(false);
                resetAuthForm();
              }}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xl transition-all"
              style={{ zIndex: 10 }}
              title="Cerrar"
            >
              ✕
            </button>

            {/* Header */}
            <div className="p-6 text-center relative" style={{ backgroundColor: COLORS.verdePrincipal }}>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {isLoginMode ? '🔐 Iniciar Sesión' : '📝 Registrarse'}
              </h2>
              <p className="text-white/90 text-sm">
                {isLoginMode
                  ? 'Inicia sesión para comprar y dejar reseñas'
                  : 'Crea tu cuenta y obtén cupones de descuento'}
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto" style={{
              maxHeight: 'calc(95vh - 200px)' // Altura máxima menos header y footer
            }}>
              {!isLoginMode && (
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: darkMode ? DARK_COLORS.textPrimary : COLORS.verdeOscuro }}>
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={authForm.nombre}
                    onChange={(e) => setAuthForm({ ...authForm, nombre: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                    style={{
                      borderColor: COLORS.verdeMenta,
                      backgroundColor: darkMode ? DARK_COLORS.inputBackground : COLORS.blanco,
                      color: darkMode ? DARK_COLORS.textPrimary : COLORS.negro
                    }}
                    placeholder="Tu nombre"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: darkMode ? DARK_COLORS.textPrimary : COLORS.verdeOscuro }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                  style={{ borderColor: COLORS.verdeMenta }}
                  placeholder="tu@email.com"
                />
              </div>

              {!isLoginMode && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.verdeOscuro }}>
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={authForm.telefono}
                      onChange={(e) => setAuthForm({ ...authForm, telefono: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                      style={{ borderColor: COLORS.verdeMenta }}
                      placeholder="+57 300 000 0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.verdeOscuro }}>
                      Dirección (opcional)
                    </label>
                    <input
                      type="text"
                      value={authForm.direccion}
                      onChange={(e) => setAuthForm({ ...authForm, direccion: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                      style={{ borderColor: COLORS.verdeMenta }}
                      placeholder="Tu dirección"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.verdeOscuro }}>
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                  style={{ borderColor: COLORS.verdeMenta }}
                  placeholder="••••••••"
                />
              </div>

              {!isLoginMode && (
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.verdeOscuro }}>
                    Confirmar Contraseña *
                  </label>
                  <input
                    type="password"
                    value={authForm.password_confirm}
                    onChange={(e) => setAuthForm({ ...authForm, password_confirm: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                    style={{ borderColor: COLORS.verdeMenta }}
                    placeholder="••••••••"
                  />
                </div>
              )}

              {/* Info de cupones */}
              {!isLoginMode && (
                <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.beigeCrema }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: COLORS.verdeOscuro }}>
                    🎁 ¡Gana Cupones con tus Reseñas!
                  </p>
                  <p className="text-xs" style={{ color: COLORS.grisMedio }}>
                    Cada vez que dejes una reseña de un producto, recibirás un cupón de descuento entre 10% y 25% para tu próxima compra.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 space-y-3">
              <button
                onClick={isLoginMode ? handleLogin : handleRegister}
                className="w-full py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all"
                style={{ backgroundColor: COLORS.verdePrincipal }}
              >
                {isLoginMode ? '🚀 Iniciar Sesión' : '🎉 Crear Cuenta'}
              </button>

              <button
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="w-full py-2 text-sm font-semibold"
                style={{ color: COLORS.verdePrincipal }}
              >
                {isLoginMode
                  ? '¿No tienes cuenta? Regístrate aquí'
                  : '¿Ya tienes cuenta? Inicia sesión'}
              </button>

              <button
                onClick={() => {
                  setShowAuthModal(false);
                  resetAuthForm();
                }}
                className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL DE CUPÓN GANADO ==================== */}
      {showCouponModal && earnedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden text-center">
            {/* Header con confeti */}
            <div className="p-8 relative overflow-hidden" style={{ backgroundColor: 'linear-gradient(135deg, #FFA726 0%, #FF6F00 100%)' }}>
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <h2 className="text-3xl font-bold text-white mb-2">
                ¡Felicidades!
              </h2>
              <p className="text-white/90">
                Has ganado un cupón por tu reseña
              </p>
            </div>

            {/* Cuerpo del cupón */}
            <div className="p-6">
              <div className="border-2 border-dashed rounded-xl p-6 mb-6" style={{ borderColor: COLORS.acentoNaranja }}>
                <p className="text-sm font-semibold mb-2" style={{ color: COLORS.grisMedio }}>
                  Tu código de descuento:
                </p>
                <div className="text-3xl font-bold mb-2" style={{ color: COLORS.verdePrincipal, fontFamily: 'monospace', letterSpacing: '2px' }}>
                  {earnedCoupon.codigo}
                </div>
                <div className="text-4xl font-bold" style={{ color: COLORS.acentoNaranja }}>
                  {earnedCoupon.descuento}% OFF
                </div>
                <p className="text-xs mt-2" style={{ color: COLORS.grisMedio }}>
                  Válido para tu próxima compra
                </p>
              </div>

              <div className="space-y-2 text-sm" style={{ color: COLORS.grisOscuro }}>
                <p>📅 Generado: {formatCouponDate(earnedCoupon.fechaGeneracion)}</p>
                <p>✅ Estado: Activo</p>
                <p>💡 Muestra este código al momento de comprar</p>
              </div>

              {/* Lista de cupones acumulados */}
              {coupons.length > 1 && (
                <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: COLORS.grisClaro }}>
                  <p className="font-semibold mb-2" style={{ color: COLORS.verdeOscuro }}>
                    Tus cupones acumulados: {coupons.length}
                  </p>
                  <div className="space-y-2 text-xs">
                    {coupons.slice().reverse().slice(0, 3).map((coupon, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span style={{ fontFamily: 'monospace' }}>{coupon.codigo}</span>
                        <span className="font-bold" style={{ color: COLORS.verdePrincipal }}>
                          {coupon.descuento}% OFF
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 space-y-3">
              <button
                onClick={() => {
                  // Copiar código al portapapeles
                  navigator.clipboard.writeText(earnedCoupon.codigo);
                  showToast('success', 'Código copiado: ' + earnedCoupon.codigo);
                }}
                className="w-full py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all"
                style={{ backgroundColor: COLORS.acentoNaranja }}
              >
                📋 Copiar Código
              </button>

              <button
                onClick={() => setShowCouponModal(false)}
                className="w-full py-3 rounded-xl font-semibold border-2 hover:shadow-lg transition-all"
                style={{ borderColor: COLORS.verdePrincipal, color: COLORS.verdePrincipal }}
              >
                Continuar Comprando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL DE MIS CUPONES ==================== */}
      {showCouponModal && !earnedCoupon && coupons.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden">
            {/* Header */}
            <div className="p-6 text-center" style={{ backgroundColor: COLORS.verdePrincipal }}>
              <div className="text-4xl mb-2">🎁</div>
              <h2 className="text-2xl font-bold text-white mb-2">Mis Cupones</h2>
              <p className="text-white/90 text-sm">Tienes {coupons.length} cupón(es) disponible(s)</p>
            </div>

            {/* Lista de cupones */}
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {coupons.slice().reverse().map((coupon, index) => (
                <div key={index} className="border rounded-xl p-4" style={{ borderColor: COLORS.verdeMenta }}>
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="text-2xl font-bold mb-1" style={{ color: COLORS.verdePrincipal, fontFamily: 'monospace' }}>
                        {coupon.codigo}
                      </div>
                      <div className="text-xs" style={{ color: COLORS.grisMedio }}>
                        {formatCouponDate(coupon.fechaGeneracion)}
                      </div>
                      {coupon.cantidadDisponible !== undefined && coupon.cantidadDisponible > 1 && (
                        <div className="text-xs mt-1 px-2 py-1 inline-block rounded" style={{ backgroundColor: COLORS.verdeClaro, color: COLORS.verdeOscuro }}>
                          {coupon.cantidadDisponible} disponible(s)
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-3xl font-bold" style={{ color: COLORS.acentoNaranja }}>
                        {coupon.descuento}%
                      </div>
                      <div className="text-xs font-semibold" style={{
                        color: coupon.usado ? COLORS.grisMedio : COLORS.verdePrincipal
                      }}>
                        {coupon.usado ? 'Usado' : 'Activo'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 space-y-3">
              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.beigeCrema }}>
                <p className="text-sm font-semibold mb-1" style={{ color: COLORS.verdeOscuro }}>
                  👤 {customerData?.nombre}
                </p>
                <p className="text-xs" style={{ color: COLORS.grisMedio }}>
                  {customerData?.email}
                </p>
                <p className="text-xs mt-1" style={{ color: COLORS.grisMedio }}>
                  Reseñas publicadas: {customerData?.reseñas || 0}
                </p>
              </div>

              <button
                onClick={() => setShowCouponModal(false)}
                className="w-full py-3 rounded-xl font-bold text-white shadow-lg"
                style={{ backgroundColor: COLORS.verdePrincipal }}
              >
                Cerrar
              </button>

              <button
                onClick={() => {
                  setShowCouponModal(false);
                  handleLogout();
                }}
                className="w-full py-2 rounded-xl font-semibold border-2 text-sm"
                style={{ borderColor: '#d32f2f', color: '#d32f2f' }}
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 