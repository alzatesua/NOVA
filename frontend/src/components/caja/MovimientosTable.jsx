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

      console.log('📋 Respuesta movimientos:', response);

      if (response.success) {
        console.log('✅ Movimientos recibidos:', response.data.movimientos);
        setMovimientos(response.data.movimientos);
        setTotalPaginas(response.data.total_paginas);
      } else {
        console.error('❌ Error en respuesta:', response);
      }
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      showToast('error', 'Error al cargar los movimientos');
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Movimientos de Caja</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPagina(1);
              cargarMovimientos();
            }}
          >
            <RefreshIcon />
            Actualizar
          </Button>
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
          <div className="overflow-x-auto">
            <table className="w-full">
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
                      <span className={getTipoBadge(mov.tipo)}>
                        {getTipoTexto(mov.tipo)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{mov.descripcion || '-'}</td>
                    <td className="py-3 px-4 text-sm">{mov.metodo_pago || '-'}</td>
                    <td className={`py-3 px-4 text-sm text-right font-semibold ${
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
                          className="inline-flex items-center gap-1"
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
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {pagina} de {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-semibold">Comprobante de Pago</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalComprobante({ open: false, url: null })}
              >
                <CloseIcon />
              </Button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
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
  );
}
