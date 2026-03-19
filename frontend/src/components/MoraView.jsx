/**
 * Vista de Gestión de Mora
 * Muestra lista de clientes en mora, clientes con deuda y permite gestionar abonos
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { listarClientesMora, crearAbono, resumenMoraCliente, quitarMoraCliente, listarClientesConDeuda, resumenDeudaCliente } from '../services/api';
import { showToast } from '../utils/toast';
import {
  ExclamationTriangleIcon,
  UserIcon,
  XMarkIcon,
  CheckIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UsersIcon,
  EyeIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

export default function MoraView() {
  const { usuario, tokenUsuario, subdominio } = useAuth();

  // Tab activa: 'mora' o 'deuda'
  const [tabActiva, setTabActiva] = useState('mora');

  const [clientesEnMora, setClientesEnMora] = useState([]);
  const [clientesConDeuda, setClientesConDeuda] = useState([]);
  const [resumenDeuda, setResumenDeuda] = useState(null);

  const [loading, setLoading] = useState(true);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [resumenCliente, setResumenCliente] = useState(null);
  const [mostrarModalAbono, setMostrarModalAbono] = useState(false);
  const [mostrarModalSoporte, setMostrarModalSoporte] = useState(false);
  const [soporteSeleccionado, setSoporteSeleccionado] = useState(null);
  const [procesando, setProcesando] = useState(false);

  // Estado del formulario de abono
  const [formularioAbono, setFormularioAbono] = useState({
    monto: '',
    metodo_pago: 'efectivo',
    referencia: '',
    observaciones: '',
    soporte_pago: null
  });

  useEffect(() => {
    if (tabActiva === 'mora') {
      cargarClientesEnMora();
    } else {
      cargarClientesConDeuda();
    }
  }, [tabActiva]);

  const cargarClientesEnMora = async () => {
    setLoading(true);
    try {
      const response = await listarClientesMora({
        token: tokenUsuario,
        usuario,
        subdominio
      });

      if (response.success) {
        setClientesEnMora(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando clientes en mora:', error);
      showToast('error', 'Error al cargar clientes en mora');
    } finally {
      setLoading(false);
    }
  };

  const cargarClientesConDeuda = async () => {
    setLoading(true);
    try {
      const response = await listarClientesConDeuda({
        token: tokenUsuario,
        usuario,
        subdominio,
        solo_mora: false
      });

      if (response.success) {
        setClientesConDeuda(response.data || []);
        setResumenDeuda(response.resumen || null);
      }
    } catch (error) {
      console.error('Error cargando clientes con deuda:', error);
      showToast('error', 'Error al cargar clientes con deuda');
    } finally {
      setLoading(false);
    }
  };

  const verDetallesCliente = async (cliente) => {
    setClienteSeleccionado(cliente);
    setResumenCliente(null);

    try {
      const response = await resumenDeudaCliente({
        token: tokenUsuario,
        usuario,
        subdominio,
        cliente_id: cliente.cliente_id
      });

      if (response.success) {
        // Mezclar la respuesta del resumen con los productos fiados del cliente original
        setResumenCliente({
          ...response,
          // Si la respuesta no tiene productos fiados, usar los del cliente seleccionado
          productos_fiados: response.productos_fiados || cliente.productos_fiados || []
        });
      }
    } catch (error) {
      console.error('Error cargando resumen del cliente:', error);
      showToast('error', 'Error al cargar detalles del cliente');
      // En caso de error, al menos mostrar los datos del cliente con sus productos
      setResumenCliente({
        cliente: cliente,
        deuda: {
          deuda_total: cliente.deuda_total,
          total_facturas_credito: cliente.total_facturas_credito,
          total_abonos: cliente.total_abonos
        },
        productos_fiados: cliente.productos_fiados || [],
        abonos: []
      });
    }
  };

  const cerrarDetalles = () => {
    setClienteSeleccionado(null);
    setResumenCliente(null);
  };

  const handleCrearAbono = async (e) => {
    e.preventDefault();

    if (!formularioAbono.monto || parseFloat(formularioAbono.monto) <= 0) {
      showToast('error', 'Ingresa un monto válido');
      return;
    }

    // Validar que el monto no supere la deuda total
    const deudaTotal = resumenCliente?.deuda?.deuda_total ? parseFloat(resumenCliente.deuda.deuda_total) : 0;
    const montoAbono = parseFloat(formularioAbono.monto);

    if (montoAbono > deudaTotal) {
      showToast('error', `El monto del abono no puede superar la deuda total de ${formatCurrency(deudaTotal)}`);
      return;
    }

    // Validar que se suba soporte para métodos digitales
    const metodosDigitales = ['transferencia', 'nequi', 'tarjeta'];
    if (metodosDigitales.includes(formularioAbono.metodo_pago) && !formularioAbono.soporte_pago) {
      showToast('error', 'Debes adjuntar el soporte de pago para este método de pago');
      return;
    }

    setProcesando(true);
    try {
      const response = await crearAbono({
        token: tokenUsuario,
        usuario,
        subdominio,
        cliente_id: clienteSeleccionado.cliente_id,
        monto: formularioAbono.monto,
        metodo_pago: formularioAbono.metodo_pago,
        referencia: formularioAbono.referencia,
        observaciones: formularioAbono.observaciones,
        soporte_pago: formularioAbono.soporte_pago
      });

      if (response.success) {
        showToast('success', 'Abono registrado exitosamente');

        // Actualizar resumen del cliente
        await verDetallesCliente(clienteSeleccionado);

        // Recargar lista actual
        if (tabActiva === 'mora') {
          await cargarClientesEnMora();
        } else {
          await cargarClientesConDeuda();
        }

        // Limpiar formulario y cerrar modal
        setFormularioAbono({
          monto: '',
          metodo_pago: 'efectivo',
          referencia: '',
          observaciones: '',
          soporte_pago: null
        });
        setMostrarModalAbono(false);
      }
    } catch (error) {
      console.error('Error creando abono:', error);
      showToast('error', error.message || 'Error al registrar abono');
    } finally {
      setProcesando(false);
    }
  };

  const handleQuitarMora = async () => {
    if (!confirm('¿Estás seguro de quitar a este cliente de la lista de mora?')) {
      return;
    }

    setProcesando(true);
    try {
      const response = await quitarMoraCliente({
        token: tokenUsuario,
        usuario,
        subdominio,
        cliente_id: clienteSeleccionado.cliente_id,
        observaciones: 'Saldo de mora cancelado manualmente'
      });

      if (response.success) {
        showToast('success', 'Cliente quitado de lista negra');
        await cargarClientesEnMora();
        cerrarDetalles();
      }
    } catch (error) {
      console.error('Error quitando mora:', error);
      showToast('error', error.message || 'Error al quitar mora');
    } finally {
      setProcesando(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '$0';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:!text-slate-100">Gestión de Crédito y Mora</h2>
          <p className="text-slate-500 dark:!text-slate-400 text-sm">Administra clientes en mora y control de deuda</p>
        </div>
        <button
          onClick={() => tabActiva === 'mora' ? cargarClientesEnMora() : cargarClientesConDeuda()}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
        >
          <DocumentTextIcon className="h-5 w-5" />
          Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-slate-200 dark:!border-slate-700">
          <button
            onClick={() => setTabActiva('mora')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${
              tabActiva === 'mora'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-slate-500 hover:text-slate-700 dark:!text-slate-400 dark:hover:!text-slate-200'
            }`}
          >
            <ExclamationTriangleIcon className="h-5 w-5" />
            Clientes en Mora
            {clientesEnMora.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 dark:!bg-red-900/30 text-red-600 dark:!text-red-400 rounded-full text-xs">
                {clientesEnMora.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTabActiva('deuda')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${
              tabActiva === 'deuda'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700 dark:!text-slate-400 dark:hover:!text-slate-200'
            }`}
          >
            <ChartBarIcon className="h-5 w-5" />
            Deuda General
            {clientesConDeuda.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:!bg-blue-900/30 text-blue-600 dark:!text-blue-400 rounded-full text-xs">
                {clientesConDeuda.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Resumen de deuda (solo en tab deuda) */}
      {tabActiva === 'deuda' && resumenDeuda && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <UsersIcon className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-blue-100 text-sm">Clientes con Deuda</p>
                <p className="text-2xl font-bold">{resumenDeuda.total_clientes_con_deuda}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <CurrencyDollarIcon className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-purple-100 text-sm">Deuda Total</p>
                <p className="text-2xl font-bold">{formatCurrency(resumenDeuda.total_deuda_general)}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-red-100 text-sm">Deuda en Mora</p>
                <p className="text-lg font-bold">{formatCurrency(resumenDeuda.total_deuda_mora)}</p>
                <p className="text-xs text-red-200">{resumenDeuda.clientes_en_mora} clientes</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <CheckIcon className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-green-100 text-sm">Crédito Vigente</p>
                <p className="text-lg font-bold">{formatCurrency(resumenDeuda.total_deuda_credito_vigente)}</p>
                <p className="text-xs text-green-200">{resumenDeuda.clientes_con_credito_vigente} clientes</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Clientes */}
        <div className={`lg:col-span-${clienteSeleccionado ? '2' : '3'}`}>
          <div className={`bg-white dark:!bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:!border-slate-800`}>
            <div className={`bg-gradient-to-r ${
              tabActiva === 'mora' ? 'from-red-600 to-orange-600' : 'from-blue-600 to-blue-700'
            } px-6 py-4 rounded-t-xl`}>
              <div className="flex items-center gap-3">
                {tabActiva === 'mora' ? (
                  <ExclamationTriangleIcon className="h-8 w-8 text-white" />
                ) : (
                  <ChartBarIcon className="h-8 w-8 text-white" />
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {tabActiva === 'mora' ? 'Clientes en Mora' : 'Clientes con Deuda'}
                  </h3>
                  <p className={`${tabActiva === 'mora' ? 'text-red-100' : 'text-blue-100'} text-sm`}>
                    {tabActiva === 'mora'
                      ? `${clientesEnMora.length} clientes pendientes`
                      : `${clientesConDeuda.length} clientes con deuda`
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
                    tabActiva === 'mora' ? 'border-red-600' : 'border-blue-600'
                  } mx-auto mb-4`}></div>
                  <p className="text-slate-600 dark:!text-slate-400">Cargando clientes...</p>
                </div>
              ) : (tabActiva === 'mora' ? clientesEnMora : clientesConDeuda).length === 0 ? (
                <div className="text-center py-8">
                  <ExclamationTriangleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-slate-600 dark:!text-slate-400">
                    {tabActiva === 'mora' ? '¡No hay clientes en mora!' : '¡No hay clientes con deuda!'}
                  </p>
                  <p className="text-sm text-slate-500 dark:!text-slate-500">
                    {tabActiva === 'mora' ? 'Todos los clientes están al día' : 'Todos los clientes han pagado'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(tabActiva === 'mora' ? clientesEnMora : clientesConDeuda).map((cliente) => (
                    <div
                      key={cliente.cliente_id}
                      onClick={() => verDetallesCliente(cliente)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        clienteSeleccionado?.cliente_id === cliente.cliente_id
                          ? 'border-blue-500 bg-blue-50 dark:!bg-blue-900/20'
                          : 'border-slate-200 dark:!border-slate-700 hover:border-red-300 dark:hover:!border-red-800 hover:bg-red-50 dark:hover:!bg-red-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <UserIcon className={`h-5 w-5 ${tabActiva === 'mora' ? 'text-red-600' : 'text-blue-600'}`} />
                            <h4 className="font-bold text-slate-900 dark:!text-slate-100">{cliente.nombre}</h4>
                            {cliente.en_mora && (
                              <span className="px-2 py-0.5 bg-red-100 dark:!bg-red-900/30 text-red-600 dark:!text-red-400 rounded-full text-xs font-semibold">
                                MORA
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:!text-slate-400 mb-2">
                            {cliente.numero_documento}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            {tabActiva === 'mora' ? (
                              <>
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-4 w-4 text-orange-600" />
                                  <span className="font-semibold text-orange-600">{cliente.dias_mora} días</span>
                                </div>
                                {cliente.fecha_ultimo_pago && (
                                  <span className="text-slate-500 dark:!text-slate-400">
                                    Último pago: {formatDate(cliente.fecha_ultimo_pago)}
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-1">
                                  <CurrencyDollarIcon className="h-4 w-4 text-blue-600" />
                                  <span className="font-bold text-blue-600">{formatCurrency(cliente.deuda_total)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500 dark:!text-slate-400">
                                  {cliente.total_facturas_credito !== '0' && (
                                    <span>Facturas: {formatCurrency(cliente.total_facturas_credito)}</span>
                                  )}
                                  {cliente.total_productos_fiados > 0 && (
                                    <span className="px-2 py-0.5 bg-purple-100 dark:!bg-purple-900/30 text-purple-700 dark:!text-purple-400 rounded-full font-semibold">
                                      {cliente.total_productos_fiados} productos
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        {tabActiva === 'mora' ? (
                          <ExclamationTriangleIcon className={`h-6 w-6 ${
                            cliente.dias_mora > 60 ? 'text-red-600' : 'text-orange-500'
                          }`} />
                        ) : (
                          <ChartBarIcon className="h-6 w-6 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel de Detalles del Cliente */}
        {clienteSeleccionado && resumenCliente && (
          <div className="lg:col-span-1">
            <div className="bg-white dark:!bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:!border-slate-800 sticky top-4">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Detalles del Cliente</h3>
                  <button
                    onClick={cerrarDetalles}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Información del Cliente */}
                <div className="bg-slate-50 dark:!bg-slate-800 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-900 dark:!text-slate-100 mb-2">
                    {resumenCliente.cliente.nombre}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-600 dark:!text-slate-400">
                      <span className="font-medium">Documento:</span> {resumenCliente.cliente.numero_documento}
                    </p>
                    {resumenCliente.cliente.dias_mora !== undefined && (
                      <p className="text-slate-600 dark:!text-slate-400">
                        <span className="font-medium">Días en mora:</span>{' '}
                        <span className={resumenCliente.cliente.dias_mora > 30 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                          {resumenCliente.cliente.dias_mora} días
                        </span>
                      </p>
                    )}
                    {resumenCliente.deuda && (
                      <>
                        <p className="text-slate-600 dark:!text-slate-400">
                          <span className="font-medium">Deuda Total:</span>{' '}
                          <span className="text-blue-600 font-bold">{formatCurrency(resumenCliente.deuda.deuda_total)}</span>
                        </p>
                        <p className="text-slate-600 dark:!text-slate-400">
                          <span className="font-medium">Total Facturas Crédito:</span> {formatCurrency(resumenCliente.deuda.total_facturas_credito)}
                        </p>
                        <p className="text-slate-600 dark:!text-slate-400">
                          <span className="font-medium">Total Abonos:</span> {formatCurrency(resumenCliente.deuda.total_abonos)}
                        </p>
                      </>
                    )}
                    {resumenCliente.cliente.fecha_ultimo_pago && (
                      <p className="text-slate-600 dark:!text-slate-400">
                        <span className="font-medium">Último pago:</span>{' '}
                        {formatDate(resumenCliente.cliente.fecha_ultimo_pago)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setMostrarModalAbono(true)}
                    disabled={procesando}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CurrencyDollarIcon className="h-5 w-5" />
                    Registrar Abono
                  </button>
                  {tabActiva === 'mora' && resumenCliente.cliente.dias_mora > 30 && (
                    <button
                      onClick={handleQuitarMora}
                      disabled={procesando}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckIcon className="h-5 w-5" />
                      Quitar Mora
                    </button>
                  )}
                </div>

                {/* Historial de Abonos */}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:!text-slate-100 mb-3">
                    Historial de Abonos
                  </h4>
                  {resumenCliente.abonos && resumenCliente.abonos.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {resumenCliente.abonos.map((abono) => (
                        <div key={abono.abono_id || abono.id} className="bg-green-50 dark:!bg-green-900/20 border border-green-200 dark:!border-green-800 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-green-800 dark:!text-green-300">
                                {formatCurrency(abono.monto)}
                              </p>
                              <p className="text-xs text-green-600 dark:!text-green-500">
                                {formatDate(abono.fecha_abono)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 bg-green-200 dark:!bg-green-900 text-green-800 dark:!text-green-300 rounded-full">
                                {abono.metodo_pago}
                              </span>
                              {abono.soporte_pago && (
                                <button
                                  onClick={() => {
                                    setSoporteSeleccionado(abono.soporte_pago);
                                    setMostrarModalSoporte(true);
                                  }}
                                  className="p-1.5 bg-blue-100 dark:!bg-blue-900 text-blue-600 dark:!text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:!bg-blue-800 transition-colors"
                                  title="Ver soporte de pago"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          {abono.observaciones && (
                            <p className="text-xs text-slate-600 dark:!text-slate-400 italic">
                              "{abono.observaciones}"
                            </p>
                          )}
                          {abono.registrado_por && (
                            <p className="text-xs text-slate-500 dark:!text-slate-500 mt-1">
                              Registrado por: {abono.registrado_por}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-slate-50 dark:!bg-slate-800 rounded-lg">
                      <p className="text-sm text-slate-500 dark:!text-slate-400">Sin abonos registrados</p>
                    </div>
                  )}
                </div>

                {/* Productos Fiados */}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:!text-slate-100 mb-3">
                    Productos Adquiridos a Crédito
                  </h4>
                  {resumenCliente.productos_fiados && resumenCliente.productos_fiados.length > 0 ? (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {resumenCliente.productos_fiados.map((producto, idx) => (
                        <div key={`${producto.factura_id}-${idx}`} className="bg-blue-50 dark:!bg-blue-900/20 border border-blue-200 dark:!border-blue-800 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-bold text-blue-900 dark:!text-blue-300 text-sm">
                                {producto.producto_nombre}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-blue-700 dark:!text-blue-400">
                                <span>SKU: {producto.producto_sku || 'N/A'}</span>
                                <span>Cant: {producto.cantidad}</span>
                                <span>{formatCurrency(producto.valor_unitario)} c/u</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-blue-800 dark:!text-blue-300">
                                {formatCurrency(producto.valor_total)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-600 dark:!text-slate-400 border-t border-blue-200 dark:!border-blue-800 pt-2 mt-2">
                            <div className="flex items-center gap-2">
                              <DocumentTextIcon className="h-3 w-3" />
                              <span>Factura: {producto.numero_factura}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-3 w-3" />
                              <span>{formatDate(producto.fecha_venta)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-slate-50 dark:!bg-slate-800 rounded-lg">
                      <p className="text-sm text-slate-500 dark:!text-slate-400">Sin productos fiados registrados</p>
                    </div>
                  )}
                </div>

                {/* Total Abonado */}
                {resumenCliente.total_abonado && resumenCliente.total_abonado !== '0' && (
                  <div className="bg-green-100 dark:!bg-green-900/30 border-2 border-green-500 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-green-800 dark:!text-green-300">Total Abonado:</span>
                      <span className="font-bold text-xl text-green-700 dark:!text-green-400">
                        {formatCurrency(resumenCliente.total_abonado)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para Registrar Abono */}
      {mostrarModalAbono && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:!bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CurrencyDollarIcon className="h-8 w-8 text-white" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Registrar Abono</h3>
                    <p className="text-green-100 text-sm">
                      {clienteSeleccionado?.nombre || 'Cliente'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMostrarModalAbono(false)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleCrearAbono} className="p-6 space-y-4">
              {/* Info de deuda actual */}
              <div className="bg-blue-50 dark:!bg-blue-900/20 border border-blue-200 dark:!border-blue-800 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-blue-800 dark:!text-blue-300">Deuda Total:</span>
                  <span className="text-lg font-bold text-blue-900 dark:!text-blue-200">
                    {formatCurrency(resumenCliente?.deuda?.deuda_total || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:!text-slate-300 mb-2">
                  Monto del Abono *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={resumenCliente?.deuda?.deuda_total || ''}
                  value={formularioAbono.monto}
                  onChange={(e) => setFormularioAbono({...formularioAbono, monto: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:!border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100"
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-slate-500 dark:!text-slate-400 mt-1">
                  Máximo: {formatCurrency(resumenCliente?.deuda?.deuda_total || 0)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:!text-slate-300 mb-2">
                  Método de Pago
                </label>
                <select
                  value={formularioAbono.metodo_pago}
                  onChange={(e) => {
                    setFormularioAbono({...formularioAbono, metodo_pago: e.target.value, soporte_pago: null});
                  }}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:!border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="nequi">Nequi</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {/* Campo para subir soporte (solo para métodos digitales) */}
              {['transferencia', 'nequi', 'tarjeta', 'otro'].includes(formularioAbono.metodo_pago) && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:!text-slate-300 mb-2">
                    Soporte de Pago *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          // Validar tamaño del archivo (máximo 5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            showToast('error', 'El archivo no puede superar los 5MB');
                            e.target.value = '';
                            return;
                          }
                          setFormularioAbono({...formularioAbono, soporte_pago: file});
                        }
                      }}
                      className="w-full px-4 py-3 border-2 border-slate-200 dark:!border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      required
                    />
                  </div>
                  {formularioAbono.soporte_pago && (
                    <p className="text-xs text-green-600 dark:!text-green-400 mt-1 flex items-center gap-1">
                      <CheckIcon className="h-3 w-3" />
                      Archivo seleccionado: {formularioAbono.soporte_pago.name}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 dark:!text-slate-400 mt-1">
                    Formatos: JPG, PNG, PDF (Máx. 5MB)
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:!text-slate-300 mb-2">
                  Referencia (opcional)
                </label>
                <input
                  type="text"
                  value={formularioAbono.referencia}
                  onChange={(e) => setFormularioAbono({...formularioAbono, referencia: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:!border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100"
                  placeholder="Número de recibo o referencia"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:!text-slate-300 mb-2">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={formularioAbono.observaciones}
                  onChange={(e) => setFormularioAbono({...formularioAbono, observaciones: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:!border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 resize-none"
                  rows={2}
                  placeholder="Notas sobre el abono..."
                />
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModalAbono(false)}
                  disabled={procesando}
                  className="flex-1 px-6 py-3 bg-slate-200 dark:!bg-slate-700 text-slate-700 dark:!text-slate-200 font-semibold rounded-xl hover:bg-slate-300 dark:hover:!bg-slate-600 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {procesando ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Procesando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <CheckIcon className="h-5 w-5" />
                      Registrar Abono
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver Soporte de Pago */}
      {mostrarModalSoporte && soporteSeleccionado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:!bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scaleIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PhotoIcon className="h-8 w-8 text-white" />
                <div>
                  <h3 className="text-xl font-bold text-white">Soporte de Pago</h3>
                  <p className="text-blue-100 text-sm">Comprobante del abono</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMostrarModalSoporte(false);
                  setSoporteSeleccionado(null);
                }}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Body - Preview del archivo */}
            <div className="p-6 flex-1 overflow-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              {soporteSeleccionado.toLowerCase().endsWith('.pdf') ? (
                // Para PDF, usar iframe o object
                <div className="w-full h-full flex items-center justify-center">
                  <object
                    data={soporteSeleccionado}
                    type="application/pdf"
                    className="w-full h-full rounded-lg border border-slate-200 dark:!border-slate-700"
                    style={{ minHeight: '500px' }}
                  >
                    <div className="text-center p-8">
                      <p className="text-slate-600 dark:!text-slate-400 mb-4">
                        No se puede previsualizar el PDF directamente
                      </p>
                      <a
                        href={soporteSeleccionado}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        <DocumentTextIcon className="h-5 w-5" />
                        Abrir PDF en nueva pestaña
                      </a>
                    </div>
                  </object>
                </div>
              ) : (
                // Para imágenes, mostrar directamente
                <div className="flex items-center justify-center">
                  <img
                    src={soporteSeleccionado}
                    alt="Soporte de pago"
                    className="max-w-full max-h-full rounded-lg shadow-lg border border-slate-200 dark:!border-slate-700"
                    onError={(e) => {
                      e.target.src = '/placeholder-image.png';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 dark:!bg-slate-800 px-6 py-4 flex gap-3 justify-end">
              <a
                href={soporteSeleccionado}
                download={`soporte_pago_${new Date().getTime()}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
              >
                <DocumentTextIcon className="h-5 w-5" />
                Descargar
              </a>
              <button
                onClick={() => {
                  setMostrarModalSoporte(false);
                  setSoporteSeleccionado(null);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 dark:!bg-slate-700 text-slate-700 dark:!text-slate-200 font-semibold rounded-xl hover:bg-slate-300 dark:hover:!bg-slate-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
