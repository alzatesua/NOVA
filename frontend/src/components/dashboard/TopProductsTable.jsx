/**
 * Tabla de productos más vendidos
 */
import React from 'react';

export default function TopProductsTable({ products = [], loading = false }) {
  const formatCurrency = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  if (loading) {
    return (
      <div className="bg-white dark:!bg-slate-900 rounded-lg shadow p-6 animate-pulse transition-colors duration-200">
        <div className="h-64 bg-slate-200 dark:!bg-slate-800 rounded"></div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .top-products-table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .top-products-table {
          width: 100%;
          min-width: 450px;
          border-collapse: collapse;
          font-size: 12px;
        }

        .top-products-table th,
        .top-products-table td {
          padding: 8px 10px;
        }

        /* ─── Tablet & Small Desktop (≤ 767px) ────────────────────────────── */
        @media (max-width: 767px) {
          .top-products-table {
            min-width: 400px;
            font-size: 11px;
          }

          .top-products-table th,
          .top-products-table td {
            padding: 6px 8px;
          }

          .top-products-table th {
            font-size: 10px;
            padding: 6px 8px;
          }

          .product-rank {
            width: 24px !important;
            height: 24px !important;
            font-size: 11px !important;
          }
        }

        /* ─── Mobile Portrait (≤ 480px) ──────────────────────────────────── */
        @media (max-width: 480px) {
          .top-products-table {
            min-width: 320px;
            font-size: 10px;
          }

          .top-products-table th,
          .top-products-table td {
            padding: 4px 6px !important;
          }

          .top-products-table th {
            font-size: 8px !important;
            padding: 4px 6px !important;
          }

          /* Hide SKU column on mobile */
          .top-products-table th:nth-child(3),
          .top-products-table td:nth-child(3) {
            display: none;
          }

          .product-rank {
            width: 20px !important;
            height: 20px !important;
            font-size: 9px !important;
          }
        }

        /* ─── Very small mobile (≤ 380px) ────────────────────────────────── */
        @media (max-width: 380px) {
          .top-products-table {
            min-width: 280px;
            font-size: 9px;
          }

          .top-products-table th,
          .top-products-table td {
            padding: 3px 5px !important;
          }

          .product-rank {
            width: 18px !important;
            height: 18px !important;
            font-size: 8px !important;
          }
        }
      `}</style>

      <div className="bg-white dark:!bg-slate-900 rounded-lg shadow p-6 border border-slate-200 dark:!border-slate-800 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-slate-900 dark:!text-slate-100 mb-4 text-center">
          Top Productos Más Vendidos
        </h3>

        <div className="top-products-table-wrapper">
          <table className="top-products-table divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:!bg-slate-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:!text-slate-400 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:!text-slate-400 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:!text-slate-400 uppercase tracking-wider">
                  Codigo
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
                        <div className={`product-rank flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
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
                        {formatCurrency(product.total_ventas)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
