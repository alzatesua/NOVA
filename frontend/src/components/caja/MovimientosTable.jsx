/**
 * Tabla de Movimientos de Caja - Muestra el historial de movimientos
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchMovimientosCaja } from '../../services/api';
import { showToast } from '../../utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

// ── Iconos ──────────────────────────────────────────────────────
const RefreshIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ViewIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const CloseIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function MovimientosTable({ fecha, filtroTipo, isAdmin, idSucursal }) {
  const { usuario, tokenUsuario, subdominio } = useAuth();
  const authData = { usuario, tokenUsuario, subdominio };

  const [loading, setLoading] = useState(true);
  const [movimientos, setMovimientos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [modalComprobante, setModalComprobante] = useState({ open: false, url: null });

  useEffect(() => {
    cargarMovimientos();
  }, [fecha, filtroTipo, pagina, isAdmin, idSucursal]);

  const cargarMovimientos = async () => {
    setLoading(true);
    try {
      const params = {
        token: authData.tokenUsuario,
        usuario: authData.usuario,
        subdominio: authData.subdominio,
        fecha: fecha,
        tipo: filtroTipo,
        pagina: pagina,
        por_pagina: 20,
      };

      // Solo agregar id_sucursal si tiene un valor válido
      if (idSucursal) {
        params.id_sucursal = idSucursal;
      }

      const response = await fetchMovimientosCaja(params);

      if (response.success) {
        setMovimientos(response.data.movimientos);
        setTotalPaginas(response.data.total_paginas);
      } else {
        console.error('❌ Error en respuesta:', response);
      }
    } catch (error) {
      // Si es un error de sesión expirada, no mostrar toast (el hook useSessionExpired se encarga)
      if (error?.isAuthError || error?.message === 'SESSION_EXPIRED') {
        console.warn('Sesión expirada, redirigiendo al login...');
        return;
      }

      console.error('Error al cargar movimientos:', error);
      showToast('error', error?.message || 'Error al cargar los movimientos');
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '$0';
    // Convertir string a número si viene como string del backend
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  };

  const getTipoBadge = (tipo) => {
    const baseClass = "px-2 py-1 rounded-full text-xs font-semibold";
    if (tipo === 'entrada') {
      return `${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
    } else if (tipo === 'salida') {
      return `${baseClass} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
    }
    return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200`;
  };

  const getTipoTexto = (tipo) => {
    const tipoMap = {
      'entrada': 'Entrada',
      'salida': 'Salida',
      'venta': 'Venta',
      'compra': 'Compra',
      'ajuste': 'Ajuste',
      'arqueo': 'Arqueo',
    };
    return tipoMap[tipo] || tipo;
  };

  return (
    <>
      <style>{`
        /* ─── Responsive Design para MovimientosTable ─────────────────────── */

        /* ─── Desktop & Large Screens (≥ 1024px) ─────────────────────────── */
        @media (min-width: 1024px) {
          .movimientos-table-wrapper {
            overflow-x: visible !important;
          }
        }

        /* ─── Tablet & Small Desktop (768px - 1023px) ──────────────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          .movimientos-table {
            min-width: 900px !important;
          }
          /* Hide Usuario column */
          .movimientos-table th:nth-child(7),
          .movimientos-table td:nth-child(7) {
            display: none;
          }
        }

        /* ─── Mobile & Tablet Landscape (481px - 767px) ──────────────────── */
        @media (min-width: 481px) and (max-width: 767px) {
          .movimientos-table-wrapper {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .movimientos-table {
            min-width: 700px !important;
            font-size: 13px !important;
          }
          .movimientos-table th,
          .movimientos-table td {
            padding: 10px 12px !important;
            font-size: 12px !important;
          }
          /* Hide Usuario and Descripción columns */
          .movimientos-table th:nth-child(3),
          .movimientos-table td:nth-child(3),
          .movimientos-table th:nth-child(7),
          .movimientos-table td:nth-child(7) {
            display: none;
          }
          .movimientos-pagination {
            flex-direction: column !important;
            gap: 10px !important;
          }
          .movimientos-btn {
            width: 100% !important;
          }
        }

        /* ─── Mobile Portrait (≤ 480px) ──────────────────────────────────── */
        @media (max-width: 480px) {
          .movimientos-table-wrapper {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .movimientos-table {
            min-width: 550px !important;
            font-size: 12px !important;
          }
          .movimientos-table th,
          .movimientos-table td {
            padding: 8px 10px !important;
            font-size: 11px !important;
          }
          .movimientos-table th {
            font-size: 10px !important;
            padding: 8px 10px !important;
          }
          /* Hide Método, Descripción and Usuario columns */
          .movimientos-table th:nth-child(3),
          .movimientos-table td:nth-child(3),
          .movimientos-table th:nth-child(4),
          .movimientos-table td:nth-child(4),
          .movimientos-table th:nth-child(7),
          .movimientos-table td:nth-child(7) {
            display: none;
          }
          .movimientos-badge {
            font-size: 9px !important;
            padding: 2px 6px !important;
          }
          .movimientos-amount {
            font-size: 11px !important;
          }
          .movimientos-btn-comprobante {
            padding: 4px 8px !important;
            font-size: 10px !important;
          }
          .movimientos-pagination {
            flex-direction: column !important;
            gap: 8px !important;
          }
          .movimientos-btn {
            width: 100% !important;
            font-size: 12px !important;
            padding: 8px 12px !important;
          }
          .movimientos-page-info {
            font-size: 11px !important;
          }
          .movimientos-modal {
            padding: 16px !important;
            margin: 8px !important;
          }
          .movimientos-modal-title {
            font-size: 16px !important;
          }
          .movimientos-modal-content {
            padding: 12px !important;
          }
        }

        /* ─── Very small mobile (≤ 380px) ────────────────────────────────── */
        @media (max-width: 380px) {
          .movimientos-table {
            min-width: 480px !important;
          }
          .movimientos-table th,
          .movimientos-table td {
            padding: 6px 8px !important;
            font-size: 10px !important;
          }
          .movimientos-table th {
            font-size: 9px !important;
            padding: 6px 8px !important;
          }
          .movimientos-badge {
            font-size: 8px !important;
            padding: 2px 5px !important;
          }
          .movimientos-amount {
            font-size: 10px !important;
          }
        }
      `}</style>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Movimientos de Caja</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : movimientos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay movimientos para mostrar
            </div>
          ) : (
            <div className="movimientos-table-wrapper overflow-x-auto">
              <table className="movimientos-table w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Fecha/Hora</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Tipo</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Descripción</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Método</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">Monto</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm">Comprobante</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((mov, index) => (
                    <tr key={mov.id || index} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-sm">{formatDateTime(mov.fecha_hora)}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`movimientos-badge ${getTipoBadge(mov.tipo)}`}>
                          {getTipoTexto(mov.tipo)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{mov.descripcion || '-'}</td>
                      <td className="py-3 px-4 text-sm">{mov.metodo_pago || '-'}</td>
                      <td className={`movimientos-amount py-3 px-4 text-sm text-right font-semibold ${
                        mov.tipo === 'entrada' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {mov.tipo === 'entrada' ? '+' : '-'}{formatCurrency(mov.monto)}
                      </td>
                      <td className="py-3 px-4 text-sm text-center">
                        {mov.soporte_pago_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setModalComprobante({ open: true, url: mov.soporte_pago_url })}
                            className="movimientos-btn-comprobante inline-flex items-center gap-1"
                          >
                            <ViewIcon />
                            Ver
                          </Button>
                        ) : mov.metodo_pago !== 'efectivo' ? (
                          <span className="text-yellow-600 dark:text-yellow-400 text-xs">Pendiente</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">{mov.usuario_nombre || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {!loading && totalPaginas > 1 && (
            <div className="movimientos-pagination flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="movimientos-btn"
              >
                Anterior
              </Button>
              <span className="movimientos-page-info text-sm text-muted-foreground">
                Página {pagina} de {totalPaginas}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="movimientos-btn"
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>

      {/* Modal para ver comprobante */}
      {modalComprobante.open && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setModalComprobante({ open: false, url: null })}
        >
          <div
            className="movimientos-modal bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="movimientos-modal-title text-lg font-semibold">Comprobante de Pago</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalComprobante({ open: false, url: null })}
              >
                <CloseIcon />
              </Button>
            </div>
            <div className="movimientos-modal-content p-4 overflow-auto max-h-[calc(90vh-80px)]">
              <img
                src={modalComprobante.url}
                alt="Comprobante de pago"
                className="max-w-full h-auto rounded"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
    </>
  );
}
