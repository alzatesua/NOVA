/**
 * Arqueo de Caja - Sistema completo de conteo de billetes y monedas
 * CON CONTROL DE ESTADO DE CAJA (Abierta/Cerrada)
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchCuadreCaja, realizarArqueoCaja, verificarEstadoCaja, abrirCaja, crearSolicitudApertura } from '../../services/api';
import { showToast } from '../../utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

// ── Iconos ──────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default function ArqueoCaja({ fecha, isAdmin, idSucursal }) {
  const { usuario, tokenUsuario, subdominio, rol, idSucursal: idSucursalAuth } = useAuth();
  const authData = { usuario, tokenUsuario, subdominio, rol };

  const [loading, setLoading] = useState(false);
  const [cuadre, setCuadre] = useState(null);
  const [submittingArqueo, setSubmittingArqueo] = useState(false);

  // Estados para control de caja
  const [estadoCaja, setEstadoCaja] = useState(null);
  const [loadingEstado, setLoadingEstado] = useState(false);
  const [abriendoCaja, setAbriendoCaja] = useState(false);

  // Estados para solicitud de apertura
  const [mostrarModalSolicitud, setMostrarModalSolicitud] = useState(false);
  const [motivoSolicitud, setMotivoSolicitud] = useState('');
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);

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
  const [otrosMetodos, setOtrosMetodos] = useState([
    { tipo: 'credito', valor: '' },
  ]);

  useEffect(() => {
    cargarCuadre();
    verificarEstado();
  }, [fecha, isAdmin, idSucursal]);

  const cargarCuadre = async () => {
    setLoading(true);
    try {
      const sucursalToUse = idSucursal || idSucursalAuth;
      const params = {
        token: authData.tokenUsuario,
        usuario: authData.usuario,
        subdominio: authData.subdominio,
        fecha: fecha,
      };

      if (sucursalToUse) {
        params.id_sucursal = sucursalToUse;
      }

      const response = await fetchCuadreCaja(params);

      if (response.success) {
        setCuadre(response.data);
      }
    } catch (error) {
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

  const verificarEstado = async () => {
    // Usar la sucursal del usuario si no se proporciona una
    const sucursalToUse = idSucursal || idSucursalAuth;

    console.log('🔍 [DEBUG] verificarEstado - idSucursal (prop):', idSucursal);
    console.log('🔍 [DEBUG] verificarEstado - idSucursalAuth (localStorage):', idSucursalAuth);
    console.log('🔍 [DEBUG] verificarEstado - sucursalToUse:', sucursalToUse);
    console.log('🔍 [DEBUG] verificarEstado - usuario:', usuario);
    console.log('🔍 [DEBUG] verificarEstado - rol:', rol);

    if (!sucursalToUse) {
      console.warn('⚠️ [DEBUG] sucursalToUse es null/undefined, asumiendo caja abierta');
      setEstadoCaja({ caja_abierta: true, estado: 'abierta' });
      return;
    }

    setLoadingEstado(true);
    try {
      const params = {
        token: authData.tokenUsuario,
        usuario: authData.usuario,
        subdominio: authData.subdominio,
        fecha: fecha,
        id_sucursal: sucursalToUse,
      };

      console.log('📤 [DEBUG] Enviando params:', params);
      const response = await verificarEstadoCaja(params);
      console.log('📥 [DEBUG] Respuesta verificarEstadoCaja:', response);

      if (response.success) {
        setEstadoCaja(response);
        console.log('✅ [DEBUG] Estado de caja actualizado:', response);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error al verificar estado de caja:', error);
      setEstadoCaja({ caja_abierta: true, estado: 'abierta' });
    } finally {
      setLoadingEstado(false);
    }
  };

  const manejarAbrirCaja = async () => {
    if (rol !== 'admin') {
      showToast('error', 'Solo los administradores pueden reabrir la caja');
      return;
    }

    if (!window.confirm('¿Estás seguro de que deseas reabrir la caja? Esto permitirá nuevos movimientos en esta fecha.')) {
      return;
    }

    setAbriendoCaja(true);
    try {
      const sucursalToUse = idSucursal || idSucursalAuth;
      const params = {
        token: authData.tokenUsuario,
        usuario: authData.usuario,
        subdominio: authData.subdominio,
        fecha: fecha,
        id_sucursal: sucursalToUse,
      };

      const response = await abrirCaja(params);

      if (response.success) {
        showToast('success', 'Caja abierta exitosamente');
        verificarEstado();
      } else {
        showToast('error', response.message || 'Error al abrir la caja');
      }
    } catch (error) {
      console.error('Error al abrir caja:', error);
      showToast('error', error?.message || 'Error al abrir la caja');
    } finally {
      setAbriendoCaja(false);
    }
  };

  const manejarSolicitudApertura = async () => {
    if (!motivoSolicitud.trim()) {
      showToast('error', 'Por favor ingresa el motivo de la solicitud');
      return;
    }

    setEnviandoSolicitud(true);
    try {
      const sucursalToUse = idSucursal || idSucursalAuth;
      const params = {
        token: authData.tokenUsuario,
        usuario: authData.usuario,
        subdominio: authData.subdominio,
        id_sucursal: sucursalToUse,
        fecha: fecha,
        motivo: motivoSolicitud,
      };

      const response = await crearSolicitudApertura(params);

      if (response.success) {
        showToast('success', 'Solicitud enviada exitosamente. Un administrador la revisará.');
        setMostrarModalSolicitud(false);
        setMotivoSolicitud('');
      } else {
        showToast('error', response.message || 'Error al enviar la solicitud');
      }
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      showToast('error', error?.message || 'Error al enviar la solicitud');
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  // Calcular total del arqueo detallado
  const calcularTotalArqueoDetallado = () => {
    let total = 0;

    // Sumar billetes
    Object.entries(denominaciones.billetes).forEach(([_, data]) => {
      const cantidad = parseInt(data.cantidad) || 0;
      total += cantidad * data.valor;
    });

    // Sumar monedas
    Object.entries(denominaciones.monedas).forEach(([_, data]) => {
      const cantidad = parseInt(data.cantidad) || 0;
      total += cantidad * data.valor;
    });

    // Sumar otros métodos
    otrosMetodos.forEach(metodo => {
      total += parseFloat(metodo.valor) || 0;
    });

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

  const actualizarOtroMetodo = (index, campo, valor) => {
    setOtrosMetodos(prev => {
      const nuevos = [...prev];
      nuevos[index][campo] = valor;
      return nuevos;
    });
  };

  const agregarOtroMetodo = () => {
    setOtrosMetodos(prev => [...prev, { tipo: 'credito', valor: '' }]);
  };

  const eliminarOtroMetodo = (index) => {
    setOtrosMetodos(prev => prev.filter((_, i) => i !== index));
  };

  const limpiarFormulario = () => {
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
    setOtrosMetodos([{ tipo: 'credito', valor: '' }]);
  };

  const realizarArqueo = async () => {
    const montoFinal = calcularTotalArqueoDetallado();

    if (montoFinal <= 0) {
      showToast('error', 'Por favor ingresa al menos una denominación');
      return;
    }

    setSubmittingArqueo(true);
    try {
      const sucursalToUse = idSucursal || idSucursalAuth;
      const params = {
        token: authData.tokenUsuario,
        usuario: authData.usuario,
        subdominio: authData.subdominio,
        fecha: fecha,
        monto_contado: montoFinal,
      };

      if (sucursalToUse) {
        params.id_sucursal = sucursalToUse;
      }

      const response = await realizarArqueoCaja(params);

      if (response.success) {
        showToast('success', 'Arqueo realizado exitosamente');
        limpiarFormulario();
        cargarCuadre();
        verificarEstado(); // Verificar el estado después del arqueo
      } else {
        showToast(response.message || 'Error al realizar el arqueo', 'error');
      }
    } catch (error) {
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
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  };

  const totalArqueo = calcularTotalArqueoDetallado();
  const diferencia = cuadre ? totalArqueo - cuadre.saldo_esperado : 0;
  const cuadraPerfectamente = cuadre && diferencia === 0;

  // Determinar si la caja está cerrada
  const cajaCerrada = estadoCaja?.estado === 'cerrada';
  const puedeReabrir = rol === 'admin';

  // DEBUG: Log para depurar botones
  console.log('🎛️ [DEBUG] Estados de botones:', {
    estadoCaja,
    cajaCerrada,
    rol,
    usuarioRol: rol,
    puedeReabrir,
    deberiaMostrarBotonAdmin: cajaCerrada && puedeReabrir,
    deberiaMostrarBotonVendedor: cajaCerrada && !puedeReabrir
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Arqueo de Caja</CardTitle>
            {/* Indicador de estado de caja */}
            {!loadingEstado && estadoCaja && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                cajaCerrada
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  cajaCerrada ? 'bg-red-500' : 'bg-green-500'
                }`}></span>
                {cajaCerrada ? 'CAJA CERRADA' : 'CAJA ABIERTA'}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {cajaCerrada && puedeReabrir && (
              <Button
                variant="outline"
                size="sm"
                onClick={manejarAbrirCaja}
                disabled={abriendoCaja}
                className="border-amber-500 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400"
              >
                {abriendoCaja ? 'Abriendo...' : 'Reabrir Caja'}
              </Button>
            )}
            {cajaCerrada && !puedeReabrir && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarModalSolicitud(true)}
                className="border-blue-500 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400"
              >
                Solicitar Apertura
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={cargarCuadre}
              disabled={loading}
            >
              <RefreshIcon className="mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
        {cajaCerrada && (
          <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
        
            {estadoCaja?.fecha_cierre && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Cerrada el: {new Date(estadoCaja.fecha_cierre).toLocaleString('es-CO')}
                {estadoCaja?.cerrado_por && ` por ${estadoCaja.cerrado_por}`}
              </p>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Información del saldo esperado */}
            {cuadre && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <h3 className="font-semibold">Saldo Esperado</h3>
                <p className="text-3xl font-bold">{formatCurrency(cuadre.saldo_esperado)}</p>
                <p className="text-sm text-muted-foreground">
                  Basado en: Saldo inicial + Entradas - Salidas
                </p>
              </div>
            )}

            {/* Alerta si la caja está cerrada */}
            {cajaCerrada && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 space-y-2">
                <h3 className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Caja Cerrada - No se pueden realizar modificaciones
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400">
                  El arqueo ha sido realizado y la caja ha sido cerrada. Los movimientos quedaron bloqueados.
                </p>
              </div>
            )}

            {/* Billetes */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Billetes
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { valor: 100000, label: '$100.000' },
                  { valor: 50000, label: '$50.000' },
                  { valor: 20000, label: '$20.000' },
                  { valor: 10000, label: '$10.000' },
                  { valor: 5000, label: '$5.000' },
                  { valor: 2000, label: '$2.000' },
                  { valor: 1000, label: '$1.000' },
                ].map((billete) => (
                  <div key={billete.valor} className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground text-center block">
                      {billete.label}
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={denominaciones.billetes[billete.valor].cantidad}
                      onChange={(e) => actualizarDenominacion('billetes', billete.valor, e.target.value)}
                      min="0"
                      disabled={cajaCerrada}
                      className={`flex h-14 w-full rounded-lg border border-input px-3 py-2 text-lg font-semibold text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        cajaCerrada
                          ? 'bg-muted cursor-not-allowed opacity-50'
                          : 'bg-background'
                      }`}
                    />
                    <p className="text-xs text-muted-foreground text-right font-medium">
                      {formatCurrency(
                        (parseInt(denominaciones.billetes[billete.valor].cantidad) || 0) * billete.valor
                      )}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <span className="font-medium">Total Billetes:</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(
                    Object.entries(denominaciones.billetes).reduce((sum, [_, data]) =>
                      sum + (parseInt(data.cantidad) || 0) * data.valor, 0
                    )
                  )}
                </span>
              </div>
            </div>

            {/* Monedas */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Monedas
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { valor: 1000, label: '$1.000' },
                  { valor: 500, label: '$500' },
                  { valor: 200, label: '$200' },
                  { valor: 100, label: '$100' },
                ].map((moneda) => (
                  <div key={moneda.valor} className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground text-center block">
                      {moneda.label}
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={denominaciones.monedas[moneda.valor].cantidad}
                      onChange={(e) => actualizarDenominacion('monedas', moneda.valor, e.target.value)}
                      min="0"
                      disabled={cajaCerrada}
                      className={`flex h-14 w-full rounded-lg border border-input px-3 py-2 text-lg font-semibold text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        cajaCerrada
                          ? 'bg-muted cursor-not-allowed opacity-50'
                          : 'bg-background'
                      }`}
                    />
                    <p className="text-xs text-muted-foreground text-right font-medium">
                      {formatCurrency(
                        (parseInt(denominaciones.monedas[moneda.valor].cantidad) || 0) * moneda.valor
                      )}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <span className="font-medium">Total Monedas:</span>
                <span className="font-bold text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(
                    Object.entries(denominaciones.monedas).reduce((sum, [_, data]) =>
                      sum + (parseInt(data.cantidad) || 0) * data.valor, 0
                    )
                  )}
                </span>
              </div>
            </div>

            {/* Otros métodos */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Otros Métodos de Pago
              </h3>
              <div className="space-y-3">
                {otrosMetodos.map((metodo, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5 space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Tipo de Método
                      </label>
                      <select
                        value={metodo.tipo}
                        onChange={(e) => actualizarOtroMetodo(index, 'tipo', e.target.value)}
                        disabled={cajaCerrada}
                        className={`flex h-11 w-full rounded-lg border border-input px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          cajaCerrada
                            ? 'bg-muted cursor-not-allowed opacity-50'
                            : 'bg-background'
                        }`}
                      >
                        <option value="credito">Crédito</option>
                        <option value="debito">Débito</option>
                        <option value="targeta_regalo">Tarjeta Regalo</option>
                      </select>
                    </div>
                    <div className="col-span-6 space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Valor
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={metodo.valor}
                        onChange={(e) => actualizarOtroMetodo(index, 'valor', e.target.value)}
                        min="0"
                        step="0.01"
                        disabled={cajaCerrada}
                        className={`flex h-11 w-full rounded-lg border border-input px-3 py-2 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          cajaCerrada
                            ? 'bg-muted cursor-not-allowed opacity-50'
                            : 'bg-background'
                        }`}
                      />
                    </div>
                    <div className="col-span-1">
                      <button
                        onClick={() => eliminarOtroMetodo(index)}
                        disabled={cajaCerrada}
                        className={`flex h-11 w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors ${
                          cajaCerrada
                            ? 'cursor-not-allowed opacity-50'
                            : ''
                        }`}
                        title="Eliminar método"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={agregarOtroMetodo}
                  disabled={cajaCerrada}
                  className="w-full"
                >
                  + Agregar Método de Pago
                </Button>
              </div>
              <div className="flex justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <span className="font-medium">Total Otros Métodos:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(
                    otrosMetodos.reduce((sum, metodo) => sum + (parseFloat(metodo.valor) || 0), 0)
                  )}
                </span>
              </div>
            </div>

            {/* Resumen del arqueo */}
            <div className="p-4 rounded-lg border-2 space-y-3">
              <h4 className="font-semibold text-lg">Resumen del Arqueo</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="font-medium">Total Contado:</span>
                  <span className="font-bold text-2xl">{formatCurrency(totalArqueo)}</span>
                </div>

                {cuadre && (
                  <>
                    <div className="flex justify-between border-t pt-2">
                      <span>Saldo Esperado:</span>
                      <span className="font-bold">{formatCurrency(cuadre.saldo_esperado)}</span>
                    </div>
                    <div className={`flex justify-between p-3 rounded-lg ${
                      cuadraPerfectamente
                        ? 'bg-green-50 dark:bg-green-950'
                        : diferencia > 0
                          ? 'bg-blue-50 dark:bg-blue-950'
                          : 'bg-red-50 dark:bg-red-950'
                    }`}>
                      <span className="font-bold">Diferencia:</span>
                      <span className={`font-bold text-xl ${
                        cuadraPerfectamente
                          ? 'text-green-600 dark:text-green-400'
                          : diferencia > 0
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}>
                        {diferencia >= 0 ? '+' : ''}{formatCurrency(diferencia)}
                      </span>
                    </div>
                    {cuadraPerfectamente && (
                      <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                        <CheckIcon />
                        <span>¡El arqueo cuadra perfectamente!</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={limpiarFormulario}
                disabled={submittingArqueo || cajaCerrada}
              >
                Limpiar Formulario
              </Button>
              <Button
                onClick={realizarArqueo}
                disabled={submittingArqueo || totalArqueo <= 0 || cajaCerrada}
                size="lg"
                className="min-w-[200px]"
              >
                {submittingArqueo ? (
                  <>Procesando...</>
                ) : (
                  <>
                    <CheckIcon className="mr-2" />
                    Confirmar Arqueo
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Modal para solicitud de apertura */}
      {mostrarModalSolicitud && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Solicitar Apertura de Caja</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Esta solicitud será enviada a un administrador para su aprobación.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Motivo de la solicitud *
              </label>
              <textarea
                value={motivoSolicitud}
                onChange={(e) => setMotivoSolicitud(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows="3"
                placeholder="Describe por qué necesitas abrir la caja..."
                disabled={enviandoSolicitud}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setMostrarModalSolicitud(false);
                  setMotivoSolicitud('');
                }}
                disabled={enviandoSolicitud}
              >
                Cancelar
              </Button>
              <Button
                onClick={manejarSolicitudApertura}
                disabled={enviandoSolicitud || !motivoSolicitud.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {enviandoSolicitud ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
