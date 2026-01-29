import React, { useState, useEffect } from 'react';
import { fetchProducts } from '../services/api';
import { useAuth } from '../hooks/useAuth';

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

export default function CatalogoView() {
  const { usuario, tokenUsuario, subdominio } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const { datos } = await fetchProducts({ usuario, tokenUsuario, subdominio });
        const productos = datos || [];

        // Extraer categorías únicas
        const cats = [...new Set(productos.map(p => p.categoria_nombre).filter(Boolean))];
        setCategories(cats);

        setProducts(productos);
        setFilteredProducts(productos);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [usuario, tokenUsuario, subdominio]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando catálogo...</p>
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
                Logo
              </div>
              <h1
                className="text-2xl font-bold"
                style={{ color: COLORS.textoNegro }}
              >
                {localStorage.getItem('nombre_tienda') || 'Mi Tienda'}
              </h1>
            </div>
          </div>

          {/* Navegación de categorías */}
          {categories.length > 0 && (
            <div className="flex items-center space-x-4 overflow-x-auto pb-2">
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
          style={{ backgroundColor: COLORS.fondoPrincipal }}
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

      {/* Grid de Productos */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white text-lg">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105"
                style={{ backgroundColor: COLORS.fondoSecundario }}
              >
                <div className="p-4">
                  {/* Imagen del producto */}
                  <div
                    className="w-full aspect-square rounded-lg mb-4 flex items-center justify-center mx-auto"
                    style={{ backgroundColor: COLORS.acento, maxWidth: '200px' }}
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

                  {/* Información del producto */}
                  <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.textoNegro }}>
                    {product.nombre}
                  </h3>

                  {product.descripcion && (
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: COLORS.textoGris }}>
                      {product.descripcion}
                    </p>
                  )}

                  <p className="text-2xl font-bold" style={{ color: COLORS.textoNegro }}>
                    ${parseFloat(product.precio_venta || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
