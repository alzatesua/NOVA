/**
 * Cuadre de Caja - Balance diario y desglose de movimientos
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchCuadreCaja, realizarArqueoCaja } from '../../services/api';
import { showToast } from '../../utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import Modal from '../Modal';

// ── Iconos ──────────────────────────────────────────────────────
const PrinterIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const CheckIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function CuadreCaja({ fecha, isAdmin, idSucursal }) {
  const { usuario, tokenUsuario, subdominio } = useAuth();
  const authData = { usuario, tokenUsuario, subdominio };

  const [loading, setLoading] = useState(false);
  const [cuadre, setCuadre] = useState(null);
  const [mostrarModalArqueo, setMostrarModalArqueo] = useState(false);
  const [montoArqueo, setMontoArqueo] = useState('');
  const [submittingArqueo, setSubmittingArqueo] = useState(false);
  const [vistaArqueo, setVistaArqueo] = useState('simple'); // 'simple' o 'detallado'

  // Estados para arqueo detallado
  const [denominaciones, setDenominaciones] = useState({
    billetes: {
      100000: { cantidad: '', valor: 100000 },
      50000: { cantidad: '', valor: 50000 },
      20000: { cantidad: '', valor: 20000 },
      10000: { cantidad: '', valor: 10000 },
      5000: { cantidad: '', valor: 5000 },
      2000: { cantidad: '', valor: 2000 },
      1000: { cantidad: '', valor: 1000 },
    },
    monedas: {
      1000: { cantidad: '', valor: 1000 },
      500: { cantidad: '', valor: 500 },
      200: { cantidad: '', valor: 200 },
      100: { cantidad: '', valor: 100 },
    }
  });
  const [otrosMetodos, setOtrosMetodos] = useState({
    targeta_regalo: '',
    comprobantes_pago: ''
  });

  useEffect(() => {
    cargarCuadre();
  }, [fecha, isAdmin, idSucursal]);

  const cargarCuadre = async () => {
    setLoading(true);
    try {
      const params = {
        token: authData.tokenUsuario,
        usuario: authData.usuario,
        subdominio: authData.subdominio,
        fecha: fecha,
      };

      // Solo agregar id_sucursal si tiene un valor válido
      if (idSucursal) {
        params.id_sucursal = idSucursal;
      }


      const response = await fetchCuadreCaja(params);

      if (response.success) {
        setCuadre(response.data);
      } else {
        console.error('❌ Error en respuesta:', response);
      }
    } catch (error) {
      // Si es un error de sesión expirada, no mostrar toast (el hook useSessionExpired se encarga)
      if (error?.isAuthError || error?.message === 'SESSION_EXPIRED') {
        console.warn('Sesión expirada, redirigiendo al login...');
        return;
      }

      console.error('Error al cargar cuadre de caja:', error);
      showToast('error', error?.message || 'Error al cargar el cuadre de caja');
    } finally {
      setLoading(false);
    }
  };

  // Calcular total del arqueo detallado
  const calcularTotalArqueoDetallado = () => {
    let total = 0;

    // Sumar billetes
    Object.entries(denominaciones.billetes).forEach(([denom, data]) => {
      const cantidad = parseInt(data.cantidad) || 0;
      total += cantidad * data.valor;
    });

    // Sumar monedas
    Object.entries(denominaciones.monedas).forEach(([denom, data]) => {
      const cantidad = parseInt(data.cantidad) || 0;
      total += cantidad * data.valor;
    });

    // Sumar otros métodos
    const targetaRegalo = parseFloat(otrosMetodos.targeta_regalo) || 0;
    const comprobantes = parseFloat(otrosMetodos.comprobantes_pago) || 0;
    total += targetaRegalo + comprobantes;

    return total;
  };

  const actualizarDenominacion = (tipo, denominacion, valor) => {
    setDenominaciones(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [denominacion]: {
          ...prev[tipo][denominacion],
          cantidad: valor
        }
      }
    }));
  };

  const actualizarOtroMetodo = (metodo, valor) => {
    setOtrosMetodos(prev => ({
      ...prev,
      [metodo]: valor
    }));
  };

  const limpiarArqueoDetallado = () => {
    setDenominaciones({
      billetes: {
        100000: { cantidad: '', valor: 100000 },
        50000: { cantidad: '', valor: 50000 },
        20000: { cantidad: '', valor: 20000 },
        10000: { cantidad: '', valor: 10000 },
        5000: { cantidad: '', valor: 5000 },
        2000: { cantidad: '', valor: 2000 },
        1000: { cantidad: '', valor: 1000 },
      },
      monedas: {
        1000: { cantidad: '', valor: 1000 },
        500: { cantidad: '', valor: 500 },
        200: { cantidad: '', valor: 200 },
        100: { cantidad: '', valor: 100 },
      }
    });
    setOtrosMetodos({
      targeta_regalo: '',
      comprobantes_pago: ''
    });
  };

  const realizarArqueo = async () => {
    let montoFinal = 0;

    if (vistaArqueo === 'simple') {
      if (!montoArqueo || parseFloat(montoArqueo) < 0) {
        showToast('error', 'Por favor ingresa un monto válido');
        return;
      }
      montoFinal = parseFloat(montoArqueo);
    } else {
      // Arqueo detallado
      montoFinal = calcularTotalArqueoDetallado();
      if (montoFinal <= 0) {
        showToast('error', 'Por favor ingresa al menos una denominación');
        return;
      }
    }

    setSubmittingArqueo(true);
    try {
      const params = {
        token: authData.tokenUsuario,
        usuario: authData.usuario,
        subdominio: authData.subdominio,
        fecha: fecha,
        monto_contado: montoFinal,
      };

      // Solo agregar id_sucursal si tiene un valor válido
      if (idSucursal) {
        params.id_sucursal = idSucursal;
      }

      const response = await realizarArqueoCaja(params);

      if (response.success) {
        showToast('success', 'Arqueo realizado exitosamente');
        setMostrarModalArqueo(false);
        setMontoArqueo('');
        limpiarArqueoDetallado();
        cargarCuadre();
      } else {
        showToast(response.message || 'Error al realizar el arqueo', 'error');
      }
    } catch (error) {
      // Si es un error de sesión expirada, no mostrar toast (el hook useSessionExpired se encarga)
      if (error?.isAuthError || error?.message === 'SESSION_EXPIRED') {
        console.warn('Sesión expirada, redirigiendo al login...');
        return;
      }

      console.error('Error al realizar arqueo:', error);
      showToast('error', error?.message || 'Error al realizar el arqueo');
    } finally {
      setSubmittingArqueo(false);
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

  const imprimirCuadre = () => {
    const contenido = `
      <html>
        <head>
          <title>Cuadre de Caja - ${fecha}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; background-color: #f9f9f9; }
            .diferencia { font-weight: bold; }
            .positivo { color: green; }
            .negativo { color: red; }
          </style>
        </head>
        <body>
          <h1>Cuadre de Caja</h1>
          <p><strong>Fecha:</strong> ${fecha}</p>
          <p><strong>Usuario:</strong> ${usuario?.nombre || 'N/A'}</p>
          <p><strong>Impreso:</strong> ${new Date().toLocaleString('es-CO')}</p>

          <h2>Resumen</h2>
          <table>
            <tr>
              <th>Concepto</th>
              <th>Monto</th>
            </tr>
            <tr>
              <td>Saldo Inicial</td>
              <td>${formatCurrency(cuadre?.saldo_inicial)}</td>
            </tr>
            <tr>
              <td>Total Entradas</td>
              <td style="color: green;">+${formatCurrency(cuadre?.total_entradas)}</td>
            </tr>
            <tr>
              <td>Total Salidas</td>
              <td style="color: red;">-${formatCurrency(cuadre?.total_salidas)}</td>
            </tr>
            <tr class="total">
              <td>Saldo Esperado</td>
              <td>${formatCurrency(cuadre?.saldo_esperado)}</td>
            </tr>
            ${cuadre?.monto_arqueo ? `
            <tr>
              <td>Monto Contado (Arqueo)</td>
              <td>${formatCurrency(cuadre.monto_arqueo)}</td>
            </tr>
            <tr class="total diferencia">
              <td>Diferencia</td>
              <td class="${cuadre.diferencia >= 0 ? 'positivo' : 'negativo'}">
                ${cuadre.diferencia >= 0 ? '+' : ''}${formatCurrency(cuadre.diferencia)}
              </td>
            </tr>
            ` : ''}
          </table>

          <h2>Desglose por Método de Pago</h2>
          <table>
            <tr>
              <th>Método de Pago</th>
              <th>Entradas</th>
              <th>Salidas</th>
              <th>Neto</th>
            </tr>
            ${cuadre?.por_metodo?.map(m => `
              <tr>
                <td>${m.metodo}</td>
                <td style="color: green;">+${formatCurrency(m.entradas)}</td>
                <td style="color: red;">-${formatCurrency(m.salidas)}</td>
                <td><strong>${formatCurrency(m.neto)}</strong></td>
              </tr>
            `).join('') || ''}
          </table>

          <h2>Resumen de Transacciones</h2>
          <table>
            <tr>
              <th>Métrica</th>
              <th>Cantidad</th>
            </tr>
            <tr>
              <td>Total Transacciones</td>
              <td>${cuadre?.total_transacciones || 0}</td>
            </tr>
            <tr>
              <td>Entradas</td>
              <td>${cuadre?.cantidad_entradas || 0}</td>
            </tr>
            <tr>
              <td>Salidas</td>
              <td>${cuadre?.cantidad_salidas || 0}</td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Crear un Blob con el contenido HTML
    const blob = new Blob([contenido], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Abrir la nueva ventana con el contenido
    const ventana = window.open(url, '_blank');

    // Liberar la URL del objeto después de abrir la ventana
    if (ventana) {
      ventana.print();

      // Limpiar la URL después de imprimir
      ventana.addEventListener('afterprint', () => {
        URL.revokeObjectURL(url);
      }, { once: true });
    } else {
      // Si el popup fue bloqueado, limpiar la URL inmediatamente
      URL.revokeObjectURL(url);
      showToast('error', 'El popup fue bloqueado. Por favor permite los popups para esta función.');
    }
  };

  return (
    <>
      <style>{`
        /* ─── Responsive Design para CuadreCaja ──────────────────────────── */

        /* ─── Desktop & Large Screens (≥ 1024px) ─────────────────────────── */
        @media (min-width: 1024px) {
          .cuadre-resumen-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .cuadre-transacciones-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        /* ─── Tablet (768px - 1023px) ──────────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          .cuadre-resumen-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 14px !important;
          }
          .cuadre-transacciones-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .cuadre-metodo-item {
            padding: 12px !important;
          }
        }

        /* ─── Mobile & Tablet Landscape (481px - 767px) ──────────────────── */
        @media (min-width: 481px) and (max-width: 767px) {
          .cuadre-resumen-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .cuadre-arqueo-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .cuadre-transacciones-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 12px !important;
          }
          .cuadre-resumen-card {
            padding: 12px !important;
          }
          .cuadre-title {
            font-size: 16px !important;
          }
          .cuadre-subtitle {
            font-size: 14px !important;
          }
          .cuadre-amount {
            font-size: 20px !important;
          }
          .cuadre-metodo-item {
            padding: 10px !important;
          }
          .cuadre-trans-amount {
            font-size: 18px !important;
          }
          .cuadre-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .cuadre-header-btn {
            width: 100% !important;
          }
        }

        /* ─── Mobile Portrait (≤ 480px) ──────────────────────────────────── */
        @media (max-width: 480px) {
          .cuadre-resumen-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .cuadre-arqueo-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .cuadre-transacciones-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
          }
          .cuadre-resumen-card {
            padding: 12px !important;
          }
          .cuadre-title {
            font-size: 15px !important;
          }
          .cuadre-subtitle {
            font-size: 13px !important;
          }
          .cuadre-amount {
            font-size: 18px !important;
          }
          .cuadre-arqueo-card {
            padding: 10px !important;
          }
          .cuadre-metodo-item {
            padding: 10px !important;
          }
          .cuadre-metodo-name {
            font-size: 13px !important;
          }
          .cuadre-metodo-amounts {
            font-size: 11px !important;
          }
          .cuadre-trans-amount {
            font-size: 16px !important;
          }
          .cuadre-trans-label {
            font-size: 10px !important;
          }
          .cuadre-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }
          .cuadre-header-btn {
            width: 100% !important;
          }
        }

        /* ─── Very small mobile (≤ 380px) ────────────────────────────────── */
        @media (max-width: 380px) {
          .cuadre-resumen-grid {
            gap: 8px !important;
          }
          .cuadre-resumen-card {
            padding: 10px !important;
          }
          .cuadre-title {
            font-size: 14px !important;
          }
          .cuadre-subtitle {
            font-size: 12px !important;
          }
          .cuadre-amount {
            font-size: 16px !important;
          }
          .cuadre-transacciones-grid {
            gap: 6px !important;
          }
          .cuadre-trans-amount {
            font-size: 14px !important;
          }
          .cuadre-metodo-item {
            padding: 8px !important;
          }
        }

        /* ─── Extra small mobile (≤ 340px) ──────────────────────────────── */
        @media (max-width: 340px) {
          .cuadre-transacciones-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .cuadre-trans-amount {
            font-size: 16px !important;
          }
        }
      `}</style>

      <Card>
        <CardHeader>
          <div className="cuadre-header flex items-center justify-between">
            <CardTitle>Cuadre de Caja</CardTitle>
            <div className="cuadre-header-btn flex gap-2">

              <Button
                variant="outline"
                size="sm"
                onClick={imprimirCuadre}
                disabled={!cuadre}
                className="w-full sm:w-auto"
              >
                <PrinterIcon className="mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : cuadre ? (
            <div className="space-y-6">
              {/* Resumen General */}
              <div className="space-y-3">
                <h3 className="cuadre-title font-semibold text-lg">Resumen del Día</h3>
                <div className="cuadre-resumen-grid grid grid-cols-2 gap-4">
                  <div className="cuadre-resumen-card p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                    <p className="cuadre-amount text-2xl font-bold">{formatCurrency(cuadre.saldo_inicial)}</p>
                  </div>
                  <div className={`cuadre-resumen-card p-4 rounded-lg ${cuadre.total_entradas > 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-muted/50'}`}>
                    <p className="text-sm text-muted-foreground">Total Entradas</p>
                    <p className="cuadre-amount text-2xl font-bold text-green-600 dark:text-green-400">
                      +{formatCurrency(cuadre.total_entradas)}
                    </p>
                  </div>
                  <div className={`cuadre-resumen-card p-4 rounded-lg ${cuadre.total_salidas > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-muted/50'}`}>
                    <p className="text-sm text-muted-foreground">Total Salidas</p>
                    <p className="cuadre-amount text-2xl font-bold text-red-600 dark:text-red-400">
                      -{formatCurrency(cuadre.total_salidas)}
                    </p>
                  </div>
                  <div className="cuadre-resumen-card p-4 rounded-lg bg-primary/10">
                    <p className="text-sm text-muted-foreground">Saldo Esperado</p>
                    <p className="cuadre-amount text-2xl font-bold">{formatCurrency(cuadre.saldo_esperado)}</p>
                  </div>
                </div>
              </div>

              {/* Información de Arqueo si existe */}
              {cuadre.monto_arqueo && (
                <div className="space-y-3 p-4 rounded-lg border">
                  <h3 className="cuadre-subtitle font-semibold text-lg">Resultado del Arqueo</h3>
                  <div className="cuadre-arqueo-grid grid grid-cols-2 gap-4">
                    <div className="cuadre-arqueo-card p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Monto Contado</p>
                      <p className="cuadre-amount text-xl font-bold">{formatCurrency(cuadre.monto_arqueo)}</p>
                    </div>
                    <div className={`cuadre-arqueo-card p-3 rounded-lg ${
                      cuadre.diferencia === 0
                        ? 'bg-green-50 dark:bg-green-950'
                        : cuadre.diferencia > 0
                          ? 'bg-blue-50 dark:bg-blue-950'
                          : 'bg-red-50 dark:bg-red-950'
                    }`}>
                      <p className="text-sm text-muted-foreground">Diferencia</p>
                      <p className={`cuadre-amount text-xl font-bold ${
                        cuadre.diferencia === 0
                          ? 'text-green-600 dark:text-green-400'
                          : cuadre.diferencia > 0
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}>
                        {cuadre.diferencia >= 0 ? '+' : ''}{formatCurrency(cuadre.diferencia)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Desglose por método de pago */}
              {cuadre.por_metodo && cuadre.por_metodo.length > 0 && (
                <div className="space-y-3">
                  <h3 className="cuadre-subtitle font-semibold text-lg">Por Método de Pago</h3>
                  <div className="space-y-2">
                    {cuadre.por_metodo.map((item, index) => (
                      <div key={index} className="cuadre-metodo-item flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <p className="cuadre-metodo-name font-medium">{item.metodo}</p>
                          <p className="cuadre-metodo-amounts text-sm text-muted-foreground">
                            <span className="text-green-600 dark:text-green-400">+{formatCurrency(item.entradas)}</span>
                            {' / '}
                            <span className="text-red-600 dark:text-red-400">-{formatCurrency(item.salidas)}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(item.neto)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen de transacciones */}
              <div className="cuadre-transacciones-grid grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="cuadre-trans-amount text-2xl font-bold">{cuadre.total_transacciones || 0}</p>
                  <p className="cuadre-trans-label text-sm text-muted-foreground">Total Transacciones</p>
                </div>
                <div className="text-center">
                  <p className="cuadre-trans-amount text-2xl font-bold text-green-600 dark:text-green-400">
                    {cuadre.cantidad_entradas || 0}
                  </p>
                  <p className="cuadre-trans-label text-sm text-muted-foreground">Entradas</p>
                </div>
                <div className="text-center">
                  <p className="cuadre-trans-amount text-2xl font-bold text-red-600 dark:text-red-400">
                    {cuadre.cantidad_salidas || 0}
                  </p>
                  <p className="cuadre-trans-label text-sm text-muted-foreground">Salidas</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos para mostrar
            </div>
          )}
        </CardContent>
      </Card>

     
    </>
  );
}
