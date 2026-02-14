import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, CubeIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { buscarProductosPOS } from '../../services/api';

export default function ProductoSelectorPOS({
  bodegaId,
  onProductoSelect,
  productosAgregados = []
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const tokenUsuario = localStorage.getItem('token_usuario');
  const usuario = localStorage.getItem('usuario');
  const subdominio = window.location.hostname.split('.')[0];

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2 && bodegaId) {
        setLoading(true);
        try {
          const response = await buscarProductosPOS({
            token: tokenUsuario,
            usuario,
            subdominio,
            bodega_id: bodegaId,
            query: searchQuery,
            incluir_sin_stock: false
          });
          setSearchResults(response.productos || []);
        } catch (error) {
          console.error('Error buscando productos:', error);
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, bodegaId]);

  const handleSelectProducto = (producto) => {
    const yaAgregado = productosAgregados.find(p => p.id === producto.id);
    if (yaAgregado) {
      onProductoSelect({ ...producto, cantidad: yaAgregado.cantidad + 1 });
    } else {
      onProductoSelect({ ...producto, cantidad: 1 });
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleKeyDown = (e, producto) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSelectProducto(producto);
    }
  };

  const getStockColor = (stock) => {
    if (stock <= 0) return 'text-red-600 bg-red-50';
    if (stock <= 5) return 'text-orange-600 bg-orange-50';
    return 'text-sky-600 bg-sky-50';
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">Agregar Producto</label>

      {/* Buscador */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por SKU, nombre o código de barras..."
          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg text-gray-900 placeholder-gray-400 shadow-sm"
          autoFocus
        />
        {searchQuery && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
              Enter para seleccionar
            </span>
          </div>
        )}
      </div>

      {/* Resultados */}
      {searchResults.length > 0 && (
        <div className="absolute z-30 w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
          {searchResults.map((p, index) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectProducto(p)}
              onKeyDown={(e) => handleKeyDown(e, p)}
              className="w-full text-left px-5 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all border-b border-gray-100 last:border-b-0 focus:outline-none focus:from-blue-50 focus:to-transparent"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Info del producto */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-900 text-lg truncate">{p.nombre}</p>
                    {p.requiere_imei && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-orange-100 text-orange-800 flex-shrink-0">
                        ⚠️ IMEI
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-mono text-xs">
                      <CubeIcon className="h-3 w-3" />
                      {p.sku}
                    </span>
                    {p.marca && (
                      <span className="text-gray-500">{p.marca}</span>
                    )}
                    {p.categoria && (
                      <span className="text-gray-400">•</span>
                    )}
                    {p.categoria && (
                      <span className="text-gray-500">{p.categoria}</span>
                    )}
                  </div>
                </div>

                {/* Right: Precio y Stock */}
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-2xl text-blue-600">
                    ${parseFloat(p.precio).toFixed(2)}
                  </p>
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold mt-1 ${getStockColor(p.disponible)}`}>
                    <ShoppingBagIcon className="h-4 w-4" />
                    Stock: {p.disponible}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-3 font-medium">Buscando productos...</p>
        </div>
      )}

      {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <ShoppingBagIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No se encontraron productos</p>
          <p className="text-sm text-gray-400 mt-1">Intenta con otro término de búsqueda</p>
        </div>
      )}

      {/* Productos agregados */}
      {productosAgregados.length > 0 && !searchQuery && (
        <div className="mt-4 p-4 bg-gradient-to-r from-sky-50 to-cyan-50 rounded-xl border-2 border-sky-200">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBagIcon className="h-5 w-5 text-sky-600" />
            <p className="font-semibold text-sky-800">
              {productosAgregados.length} producto{productosAgregados.length !== 1 ? 's' : ''} en el carrito
            </p>
          </div>
          <div className="space-y-2">
            {productosAgregados.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm bg-white p-2 rounded-lg">
                <span className="font-medium text-gray-700 truncate">{p.nombre}</span>
                <span className="font-bold text-sky-600">x{p.cantidad}</span>
              </div>
            ))}
            {productosAgregados.length > 3 && (
              <p className="text-xs text-sky-600 text-center">
                +{productosAgregados.length - 3} más
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
