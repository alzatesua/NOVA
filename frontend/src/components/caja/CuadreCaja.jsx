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

      console.log('💰 Respuesta cuadre:', response);

      if (response.success) {
        console.log('✅ Datos del cuadre recibidos:', response.data);
        setCuadre(response.data);
      } else {
        console.error('❌ Error en respuesta:', response);
      }
    } catch (error) {
      console.error('Error al cargar cuadre de caja:', error);
      showToast('Error al cargar el cuadre de caja', 'error');
    } finally {
      setLoading(false);
    }
  };

  const realizarArqueo = async () => {
    if (!montoArqueo || parseFloat(montoArqueo) < 0) {
      showToast('Por favor ingresa un monto válido', 'error');
      return;
    }

    setSubmittingArqueo(true);
    try {
      const params = {
        token: authData.tokenUsuario,
        usuario: authData.usuario,
        subdominio: authData.subdominio,
        fecha: fecha,
        monto_contado: parseFloat(montoArqueo),
      };

      // Solo agregar id_sucursal si tiene un valor válido
      if (idSucursal) {
        params.id_sucursal = idSucursal;
      }

      const response = await realizarArqueoCaja(params);

      if (response.success) {
        showToast('Arqueo realizado exitosamente', 'success');
        setMostrarModalArqueo(false);
        setMontoArqueo('');
        cargarCuadre();
      } else {
        showToast(response.message || 'Error al realizar el arqueo', 'error');
      }
    } catch (error) {
      console.error('Error al realizar arqueo:', error);
      showToast('Error al realizar el arqueo', 'error');
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

    const ventana = window.open('', '_blank');
    ventana.document.write(contenido);
    ventana.document.close();
    ventana.print();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cuadre de Caja</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarModalArqueo(true)}
              >
                <CheckIcon className="mr-2" />
                Realizar Arqueo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={imprimirCuadre}
                disabled={!cuadre}
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
                <h3 className="font-semibold text-lg">Resumen del Día</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                    <p className="text-2xl font-bold">{formatCurrency(cuadre.saldo_inicial)}</p>
                  </div>
                  <div className={`p-4 rounded-lg ${cuadre.total_entradas > 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-muted/50'}`}>
                    <p className="text-sm text-muted-foreground">Total Entradas</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      +{formatCurrency(cuadre.total_entradas)}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${cuadre.total_salidas > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-muted/50'}`}>
                    <p className="text-sm text-muted-foreground">Total Salidas</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      -{formatCurrency(cuadre.total_salidas)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10">
                    <p className="text-sm text-muted-foreground">Saldo Esperado</p>
                    <p className="text-2xl font-bold">{formatCurrency(cuadre.saldo_esperado)}</p>
                  </div>
                </div>
              </div>

              {/* Información de Arqueo si existe */}
              {cuadre.monto_arqueo && (
                <div className="space-y-3 p-4 rounded-lg border">
                  <h3 className="font-semibold text-lg">Resultado del Arqueo</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Monto Contado</p>
                      <p className="text-xl font-bold">{formatCurrency(cuadre.monto_arqueo)}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      cuadre.diferencia === 0
                        ? 'bg-green-50 dark:bg-green-950'
                        : cuadre.diferencia > 0
                          ? 'bg-blue-50 dark:bg-blue-950'
                          : 'bg-red-50 dark:bg-red-950'
                    }`}>
                      <p className="text-sm text-muted-foreground">Diferencia</p>
                      <p className={`text-xl font-bold ${
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
                  <h3 className="font-semibold text-lg">Por Método de Pago</h3>
                  <div className="space-y-2">
                    {cuadre.por_metodo.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium">{item.metodo}</p>
                          <p className="text-sm text-muted-foreground">
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
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold">{cuadre.total_transacciones || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Transacciones</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {cuadre.cantidad_entradas || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Entradas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {cuadre.cantidad_salidas || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Salidas</p>
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

      {/* Modal para realizar arqueo */}
      {mostrarModalArqueo && (
        <Modal onClose={() => setMostrarModalArqueo(false)}>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Realizar Arqueo de Caja</h2>
            <p className="text-muted-foreground">
              Ingresa el monto real que tienes en caja. El sistema calculará la diferencia.
            </p>

            <div className="space-y-2">
              <label htmlFor="montoArqueo" className="text-sm font-medium">
                Monto Contado *
              </label>
              <input
                id="montoArqueo"
                type="number"
                placeholder="0.00"
                value={montoArqueo}
                onChange={(e) => setMontoArqueo(e.target.value)}
                min="0"
                step="0.01"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {cuadre && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between">
                  <span>Saldo Esperado:</span>
                  <span className="font-bold">{formatCurrency(cuadre.saldo_esperado)}</span>
                </div>
                {montoArqueo && (
                  <div className="flex justify-between">
                    <span>Diferencia:</span>
                    <span className={`font-bold ${
                      (parseFloat(montoArqueo) - cuadre.saldo_esperado) >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {(parseFloat(montoArqueo) - cuadre.saldo_esperado) >= 0 ? '+' : ''}
                      {formatCurrency(parseFloat(montoArqueo) - cuadre.saldo_esperado)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setMostrarModalArqueo(false);
                  setMontoArqueo('');
                }}
                disabled={submittingArqueo}
              >
                Cancelar
              </Button>
              <Button
                onClick={realizarArqueo}
                disabled={submittingArqueo || !montoArqueo}
              >
                {submittingArqueo ? 'Guardando...' : 'Confirmar Arqueo'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
