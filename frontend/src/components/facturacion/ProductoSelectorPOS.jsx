import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
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
  const subdominio = localStorage.getItem('slug');

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
          setSearchResults(response.datos || []);
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
    // Validar si ya está agregado
    const yaAgregado = productosAgregados.find(p => p.id === producto.id);
    if (yaAgregado) {
      // Incrementar cantidad
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

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Agregar Producto</label>

      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por SKU, nombre o código de barras..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          autoFocus
        />
        <MagnifyingGlassIcon className="absolute left-3 top-4 h-6 w-6 text-gray-400" />
      </div>

      {/* Resultados */}
      {searchResults.length > 0 && (
        <div className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {searchResults.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectProducto(p)}
              onKeyDown={(e) => handleKeyDown(e, p)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{p.nombre}</p>
                  <p className="text-sm text-gray-500">SKU: {p.sku}</p>
                  {p.requiere_imei && (
                    <p className="text-xs text-orange-600 mt-1">⚠️ Requiere IMEI</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-lg text-gray-900">
                    ${parseFloat(p.precio).toFixed(2)}
                  </p>
                  <p className={`text-sm ${p.disponible > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Stock: {p.disponible}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Buscando productos...</p>
        </div>
      )}

      {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p>No se encontraron productos</p>
        </div>
      )}
    </div>
  );
}
