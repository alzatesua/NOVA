/**
 * Historial de Arqueos de Caja
 * Muestra el listado de arqueos realizados con filtros
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchHistorialArqueos } from '../../services/api';
import { showToast } from '../../utils/toast';
import { exportarHistorialExcel, exportarHistorialPDF } from '../../utils/exportHistorialArqueos';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

// ── Iconos ──────────────────────────────────────────────────────
const CalendarIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5 text-green-500">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LockClosedIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5 text-red-500">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const LockOpenIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5 text-green-500">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
  </svg>
);

const RefreshIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default function HistorialArqueos({ idSucursal }) {
  const { usuario, tokenUsuario, subdominio, idSucursal: idSucursalAuth } = useAuth();
  const authData = { usuario, tokenUsuario, subdominio };

  const [loading, setLoading] = useState(false);
  const [arqueos, setArqueos] = useState([]);
  const [total, setTotal] = useState(0);

  // Filtros
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [limite, setLimite] = useState(50);

  // Exportación
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState(null); // 'excel' | 'pdf' | null

  useEffect(() => {
    cargarHistorial();
  }, [idSucursal]);

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const sucursalToUse = idSucursal || idSucursalAuth;
      const params = {
        token: authData.tokenUsuario,
        usuario: authData.usuario,
        subdominio: authData.subdominio,
        id_sucursal: sucursalToUse,
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        limite,
      };

      const response = await fetchHistorialArqueos(params);

      if (response.success) {
        setArqueos(response.arqueos);
        setTotal(response.total);
      } else {
        showToast('error', response.message || 'Error al cargar el historial');
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
      showToast('error', error?.message || 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '$0';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDiferenciaColor = (diferencia) => {
    const diff = parseFloat(diferencia);
    if (diff === 0) return 'text-green-600 dark:text-green-400';
    if (diff > 0) return 'text-blue-600 dark:text-blue-400';
    return 'text-red-600 dark:text-red-400';
  };

  const limpiarFiltros = () => {
    setFechaDesde('');
    setFechaHasta('');
    setLimite(50);
  };

  const handleExport = async (type) => {
    if (arqueos.length === 0 && !fechaDesde && !fechaHasta) {
      showToast('warn', 'No hay datos para exportar. Aplica filtros primero.');
      return;
    }

    setExporting(true);
    setExportType(type);

    try {
      const sucursalToUse = idSucursal || idSucursalAuth;

      const params = {
        token: authData.tokenUsuario,
        usuario: authData.usuario,
        subdominio: authData.subdominio,
        id_sucursal: sucursalToUse,
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
      };

      const result = type === 'excel'
        ? await exportarHistorialExcel(params)
        : await exportarHistorialPDF(params);

      if (!result.success) {
        showToast('error', result.error || 'Error al exportar');
      }
    } catch (error) {
      console.error('Error en exportación:', error);
      showToast('error', error.message || 'Error al exportar');
    } finally {
      setExporting(false);
      setExportType(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon />
            Historial de Arqueos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={cargarHistorial}
              disabled={loading || exporting}
            >
              <RefreshIcon className="mr-2" />
              Actualizar
            </Button>

            {/* Botones de exportación */}
            <Button
              onClick={() => handleExport('excel')}
              disabled={exporting}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
              title="Exportar a Excel (sin límite de registros)"
            >
              {exporting && exportType === 'excel' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Excel
                </>
              )}
            </Button>

            <Button
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="sm"
              title="Exportar a PDF (sin límite de registros)"
            >
              {exporting && exportType === 'pdf' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-4">
          <h3 className="font-semibold text-sm">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Límite
              </label>
              <select
                value={limite}
                onChange={(e) => setLimite(parseInt(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="20">Últimos 20</option>
                <option value="50">Últimos 50</option>
                <option value="100">Últimos 100</option>
                <option value="200">Últimos 200</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={cargarHistorial}
                disabled={loading}
                className="flex-1"
              >
                Filtrar
              </Button>
              <Button
                variant="outline"
                onClick={limpiarFiltros}
                disabled={loading}
              >
                Limpiar
              </Button>
            </div>
          </div>
        </div>

        {/* Tabla de historial */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : arqueos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay arqueos registrados con los filtros actuales.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Hora</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Saldo Esperado</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Monto Contado</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Diferencia</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm">Estado</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm">Usuario</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm">Sucursal</th>
                </tr>
              </thead>
              <tbody>
                {arqueos.map((arqueo) => (
                  <tr key={arqueo.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm">
                      {formatDate(arqueo.fecha)}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {formatDateTime(arqueo.fecha_hora_registro)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium">
                      {formatCurrency(arqueo.saldo_esperado)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium">
                      {formatCurrency(arqueo.monto_contado)}
                    </td>
                    <td className={`py-3 px-4 text-sm text-right font-semibold ${getDiferenciaColor(arqueo.diferencia)}`}>
                      {parseFloat(arqueo.diferencia) >= 0 ? '+' : ''}{formatCurrency(arqueo.diferencia)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {arqueo.estado_caja === 'cerrada' ? (
                          <>
                            <LockClosedIcon />
                            <span className="text-xs font-medium text-red-600 dark:text-red-400">Cerrada</span>
                          </>
                        ) : (
                          <>
                            <LockOpenIcon />
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">Abierta</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-center">
                      <div className="text-xs">
                        <div className="font-medium">{arqueo.usuario_nombre || '-'}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-center">
                      <div className="text-xs">
                        <div>{arqueo.sucursal_nombre || '-'}</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Total de registros */}
        {!loading && arqueos.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Mostrando {arqueos.length} de {total} arqueos
          </div>
        )}
      </CardContent>
    </Card>
  );
}
