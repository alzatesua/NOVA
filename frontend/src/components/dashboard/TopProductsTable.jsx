/**
 * Tabla de productos más vendidos
 */
import React from 'react';

export default function TopProductsTable({ products = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-white dark:!bg-slate-900 rounded-lg shadow p-6 animate-pulse transition-colors duration-200">
        <div className="h-64 bg-slate-200 dark:!bg-slate-800 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:!bg-slate-900 rounded-lg shadow p-6 border border-slate-200 dark:!border-slate-800 transition-colors duration-200">
      <h3 className="text-lg font-semibold text-slate-900 dark:!text-slate-100 mb-4">
        Top Productos Más Vendidos
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:!bg-slate-950">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:!text-slate-400 uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:!text-slate-400 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:!text-slate-400 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:!text-slate-400 uppercase tracking-wider">
                Cantidad
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:!text-slate-400 uppercase tracking-wider">
                Total Ventas
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:!bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
            {products.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-slate-500 dark:!text-slate-400">
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr key={product.producto_id} className="hover:bg-slate-50 dark:hover:!bg-slate-700/50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index < 3
                          ? 'bg-blue-100 dark:!bg-blue-900/50 text-blue-800 dark:text-blue-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:!text-slate-300'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900 dark:!text-slate-100">
                      {product.producto_nombre}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-500 dark:!text-slate-400">
                      {product.producto_sku}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-slate-900 dark:!text-slate-100">
                      {product.cantidad_vendida}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
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
