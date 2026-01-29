import React, { useState, useEffect } from 'react';
import { fetchProducts } from '../services/api';

// Colores del diseño
const COLORS = {
  fondoPrincipal: '#0F5132',
  fondoSecundario: '#FFF8DC',
  acento: '#FFA500',
  textoNegro: '#000000',
  textoGris: '#666666',
  bordeVerde: '#28A745',
  blanco: '#FFFFFF'
};

export default function TiendaPublica() {
  // Estados
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [featuredProduct, setFeaturedProduct] = useState(null);

  // Obtener configuración de la tienda del localStorage o URL
  const nombreTienda = localStorage.getItem('nombre_tienda') || 'Mi Tienda';
  const whatsappNumber = localStorage.getItem('whatsapp_number') || '573000000000';
  const subdominio = window.location.hostname.split('.')[0];

  // Cargar productos al montar el componente
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        
        // Llamada a la API sin autenticación (modo público)
        const { datos } = await fetchProducts({ 
          usuario: null, 
          tokenUsuario: null, 
          subdominio: subdominio,
          publico: true // Flag para indicar que es acceso público
        });
        
        const productos = datos || [];

        // Extraer categorías únicas
        const cats = [...new Set(productos.map(p => p.categoria_nombre).filter(Boolean))];
        setCategories(cats);

        // Establecer producto destacado (primer producto)
        if (productos.length > 0) {
          setFeaturedProduct(productos[0]);
        }

        setProducts(productos);
        setFilteredProducts(productos);
      } catch (error) {
        console.error('Error loading products:', error);
        // Si falla, intentar con datos mock para desarrollo
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [subdominio]);

  // Filtrar productos por búsqueda y categoría
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

  // Agregar al carrito
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);

      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevCart, { ...product, quantity: 1 }];
    });

    // Mostrar notificación (opcional)
    console.log('Producto agregado al carrito:', product.nombre);
  };

  // Eliminar del carrito
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Actualizar cantidad
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

  // Calcular total
  const cartTotal = cart.reduce((total, item) => {
    const price = parseFloat(item.precio_venta) || 0;
    return total + (price * item.quantity);
  }, 0);

  // Generar mensaje de WhatsApp
  const generateWhatsAppMessage = () => {
    let message = `🛒 *Nuevo Pedido - ${nombreTienda}*\n\n`;
    message += `📋 *Productos:*\n`;

    cart.forEach((item, index) => {
      const price = parseFloat(item.precio_venta) || 0;
      const subtotal = price * item.quantity;
      message += `${index + 1}. *${item.nombre}*\n`;
      message += `   Cantidad: ${item.quantity}\n`;
      message += `   Precio unitario: $${price.toFixed(2)}\n`;
      message += `   Subtotal: $${subtotal.toFixed(2)}\n\n`;
    });

    message += `💰 *Total: $${cartTotal.toFixed(2)}*\n\n`;
    message += `📝 Nota: Por favor confirmar la disponibilidad de los productos.`;

    return encodeURIComponent(message);
  };

  // Enviar a WhatsApp
  const sendToWhatsApp = () => {
    if (cart.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }

    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  // Comprar directamente
  const buyNow = (product) => {
    addToCart(product);
    setShowCart(true);
  };

  // Vaciar carrito
  const clearCart = () => {
    if (window.confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      setCart([]);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.fondoPrincipal }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 shadow-md"
        style={{ backgroundColor: COLORS.fondoSecundario }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Logo y nombre */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-gray-500 font-semibold shadow-md"
                style={{ backgroundColor: COLORS.blanco }}
              >
                🛍️
              </div>
              <h1
                className="text-2xl font-bold"
                style={{ color: COLORS.textoNegro }}
              >
                {nombreTienda}
              </h1>
            </div>

            {/* Botón del carrito */}
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              style={{ backgroundColor: COLORS.acento }}
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {cart.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white rounded-full"
                  style={{ backgroundColor: COLORS.bordeVerde }}
                >
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>

          {/* Navegación de categorías */}
          {categories.length > 0 && (
            <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setActiveCategory(null)}
                className={`flex flex-col items-center min-w-max px-3 py-2 transition-colors ${
                  activeCategory === null ? 'text-green-700' : 'text-gray-600 hover:text-green-600'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium">Todas</span>
                {activeCategory === null && (
                  <div className="w-full h-0.5 mt-1 rounded" style={{ backgroundColor: COLORS.bordeVerde }} />
                )}
              </button>

              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`flex flex-col items-center min-w-max px-3 py-2 transition-colors ${
                    activeCategory === category ? 'text-green-700' : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium">{category}</span>
                  {activeCategory === category && (
                    <div className="w-full h-0.5 mt-1 rounded" style={{ backgroundColor: COLORS.bordeVerde }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Barra de búsqueda */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div
          className="flex items-center rounded-lg shadow-md overflow-hidden"
          style={{ backgroundColor: COLORS.fondoPrincipal, border: `2px solid ${COLORS.acento}` }}
        >
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 bg-transparent text-white placeholder-gray-300 focus:outline-none"
          />
          <button className="p-3 text-white hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Producto Destacado */}
      {featuredProduct && !activeCategory && !searchQuery && (
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <div
            className="rounded-xl shadow-lg p-6 relative"
            style={{ backgroundColor: COLORS.fondoSecundario }}
          >
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              ⭐ Destacado
            </div>
            <button
              onClick={() => setFeaturedProduct(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 mt-8">
              <div
                className="w-48 h-48 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                style={{ backgroundColor: COLORS.acento }}
              >
                {featuredProduct.imagen ? (
                  <img
                    src={featuredProduct.imagen}
                    alt={featuredProduct.nombre}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold mb-2" style={{ color: COLORS.textoNegro }}>
                  {featuredProduct.nombre}
                </h2>
                <p className="mb-3 text-lg" style={{ color: COLORS.textoGris }}>
                  {featuredProduct.descripcion || 'Producto destacado de nuestra tienda'}
                </p>
                <p className="text-4xl font-bold mb-4" style={{ color: COLORS.bordeVerde }}>
                  ${parseFloat(featuredProduct.precio_venta || 0).toFixed(2)}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <button
                    onClick={() => addToCart(featuredProduct)}
                    className="px-8 py-3 rounded-lg font-semibold text-white shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                    style={{ backgroundColor: COLORS.bordeVerde }}
                  >
                    🛒 Agregar al Carrito
                  </button>
                  <button
                    onClick={() => buyNow(featuredProduct)}
                    className="px-8 py-3 rounded-lg font-semibold text-white shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                    style={{ backgroundColor: COLORS.acento }}
                  >
                    ⚡ Comprar Ahora
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Productos */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-24 h-24 mx-auto text-white mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-white text-xl font-semibold">No se encontraron productos</p>
            <p className="text-gray-300 mt-2">Intenta con otra búsqueda o categoría</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-white text-lg">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
                {activeCategory && ` en ${activeCategory}`}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl shadow-lg overflow-hidden transition-all hover:scale-105 hover:shadow-2xl"
                  style={{ backgroundColor: COLORS.fondoSecundario }}
                >
                  <div className="p-4">
                    {/* Imagen del producto */}
                    <div
                      className="w-full aspect-square rounded-lg mb-4 flex items-center justify-center mx-auto overflow-hidden"
                      style={{ backgroundColor: COLORS.acento }}
                    >
                      {product.imagen ? (
                        <img
                          src={product.imagen}
                          alt={product.nombre}
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : (
                        <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>

                    {/* Categoría */}
                    {product.categoria_nombre && (
                      <span className="inline-block px-2 py-1 text-xs rounded-full mb-2" style={{ backgroundColor: COLORS.bordeVerde, color: 'white' }}>
                        {product.categoria_nombre}
                      </span>
                    )}

                    {/* Información del producto */}
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2" style={{ color: COLORS.textoNegro }}>
                      {product.nombre}
                    </h3>

                    {product.descripcion && (
                      <p className="text-sm mb-3 line-clamp-2" style={{ color: COLORS.textoGris }}>
                        {product.descripcion}
                      </p>
                    )}

                    <p className="text-2xl font-bold mb-4" style={{ color: COLORS.bordeVerde }}>
                      ${parseFloat(product.precio_venta || 0).toFixed(2)}
                    </p>

                    {/* Botones */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => addToCart(product)}
                        className="flex-1 px-4 py-2 rounded-lg font-semibold text-white text-sm shadow-md hover:shadow-lg transition-all"
                        style={{ backgroundColor: COLORS.bordeVerde }}
                      >
                        Agregar
                      </button>
                      <button
                        onClick={() => buyNow(product)}
                        className="flex-1 px-4 py-2 rounded-lg font-semibold text-white text-sm shadow-md hover:shadow-lg transition-all"
                        style={{ backgroundColor: COLORS.acento }}
                      >
                        Comprar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal del Carrito */}
      {showCart && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowCart(false)}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b p-6 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">🛒 Tu Carrito</h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {cart.length > 0 && (
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                    <span>{cart.reduce((total, item) => total + item.quantity, 0)} productos</span>
                    <button
                      onClick={clearCart}
                      className="text-red-500 hover:text-red-700 font-semibold"
                    >
                      Vaciar carrito
                    </button>
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500 text-xl font-semibold mb-2">Tu carrito está vacío</p>
                    <p className="text-gray-400 mb-4">¡Agrega productos para comenzar tu compra!</p>
                    <button
                      onClick={() => setShowCart(false)}
                      className="px-6 py-2 rounded-lg font-semibold text-white"
                      style={{ backgroundColor: COLORS.bordeVerde }}
                    >
                      Ver productos
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {/* Imagen */}
                        <div
                          className="w-20 h-20 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                          style={{ backgroundColor: COLORS.acento }}
                        >
                          {item.imagen ? (
                            <img
                              src={item.imagen}
                              alt={item.nombre}
                              className="w-full h-full rounded-lg object-cover"
                            />
                          ) : (
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{item.nombre}</h4>
                          <p className="text-lg font-bold" style={{ color: COLORS.bordeVerde }}>
                            ${parseFloat(item.precio_venta || 0).toFixed(2)}
                          </p>

                          {/* Contador */}
                          <div className="flex items-center space-x-3 mt-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold transition-colors"
                            >
                              -
                            </button>
                            <span className="font-semibold text-lg min-w-[2rem] text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Subtotal y eliminar */}
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900">
                            ${(parseFloat(item.precio_venta || 0) * item.quantity).toFixed(2)}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="mt-2 text-red-500 hover:text-red-700 p-2 transition-colors"
                            title="Eliminar producto"
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-2xl font-bold">
                      <span>Total:</span>
                      <span style={{ color: COLORS.bordeVerde }}>
                        ${cartTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={sendToWhatsApp}
                    className="w-full py-4 rounded-lg font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-3 transform hover:scale-105"
                    style={{ backgroundColor: COLORS.bordeVerde }}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span>Completar Pedido por WhatsApp</span>
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Al completar el pedido, serás redirigido a WhatsApp para confirmar tu orden
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-lg font-semibold mb-2">{nombreTienda}</p>
          <p className="text-gray-400 text-sm">
            Compra fácil y rápido • Paga al recibir • Envío a domicilio
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4">
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          </div>
          <p className="text-gray-500 text-xs mt-4">© 2025 {nombreTienda}. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}