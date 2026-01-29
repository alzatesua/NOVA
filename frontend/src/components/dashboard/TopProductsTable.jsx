/**
 * Tabla de productos más vendidos
 */
import React from 'react';

export default function TopProductsTable({ products = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Top Productos Más Vendidos
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Ventas
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr key={product.producto_id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index < 3 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {product.producto_nombre}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {product.producto_sku}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {product.cantidad_vendida}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-green-600">
                      ${Number(product.total_ventas || 0).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
