// src/components/FacturacionView.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchBodegas, fetchSucursales, fetchVentasHoy } from '../services/api';
import FacturaForm from './facturacion/FacturaForm';
import FacturaTicket from './facturacion/FacturaTicket';
import { 
  PrinterIcon, 
  ChartBarIcon, 
  ShoppingCartIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function FacturacionView() {
  const { rol, tokenUsuario, usuario, subdominio } = useAuth();

  const [activeTab, setActiveTab] = useState('pos');
  const [pasoActual, setPasoActual] = useState(1); // Para el wizard
  const [sucursales, setSucursales] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [bodegas, setBodegas] = useState([]);
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState(null);
  const [ultimaFactura, setUltimaFactura] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    total_facturado: 0,
    cantidad: 0,
    promedio: 0
  });
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(false);

  // Definir los pasos del wizard
  const pasos = [
    { 
      numero: 1, 
      titulo: 'Configuración', 
      descripcion: 'Selecciona sucursal y bodega',
      completado: sucursalSeleccionada && bodegaSeleccionada 
    },
    { 
      numero: 2, 
      titulo: 'Facturación', 
      descripcion: 'Crea la factura',
      completado: ultimaFactura !== null 
    },
    { 
      numero: 3, 
      titulo: 'Ticket', 
      descripcion: 'Revisa e imprime',
      completado: false 
    }
  ];

  useEffect(() => {
    cargarSucursales();
    cargarEstadisticas();
  }, []);

  const cargarSucursales = async () => {
    if (rol !== 'admin') {
      const sucursalId = localStorage.getItem('id_sucursal');
      if (sucursalId) {
        setSucursalSeleccionada(Number(sucursalId));
      }
      return;
    }

    try {
      const response = await fetchSucursales({
        rol,
        tokenUsuario,
        usuario,
        subdominio
      });
      const sucursalesActivas = response?.datos || [];
      setSucursales(sucursalesActivas);
    } catch (error) {
      console.error('Error cargando sucursales:', error);
    }
  };

  useEffect(() => {
    if (sucursalSeleccionada) {
      cargarBodegas();
    }
  }, [sucursalSeleccionada]);

  const cargarBodegas = async () => {
    if (!sucursalSeleccionada) return;

    try {
      const response = await fetchBodegas({
        rol,
        tokenUsuario,
        usuario,
        subdominio
      });
      const bodegasActivas = response.datos?.filter(b => b.estatus) || [];
      setBodegas(bodegasActivas);

      const predeterminada = bodegasActivas.find(b => b.es_predeterminada);
      if (predeterminada) {
        setBodegaSeleccionada(predeterminada.id);
      } else if (bodegasActivas.length > 0) {
        setBodegaSeleccionada(bodegasActivas[0].id);
      }
    } catch (error) {
      console.error('Error cargando bodegas:', error);
    }
  };

  const cargarEstadisticas = async () => {
    setLoadingEstadisticas(true);
    try {
      const response = await fetchVentasHoy({
        token: tokenUsuario,
        usuario,
        subdominio
      });
      setEstadisticas(response);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoadingEstadisticas(false);
    }
  };

  const handleFacturaCreada = (factura) => {
    setUltimaFactura(factura);
    cargarEstadisticas();
    setPasoActual(3); // Avanzar automáticamente al ticket
  };

  const handleImprimir = () => {
    window.print();
  };

  const handleNuevaVenta = () => {
    setUltimaFactura(null);
    setPasoActual(2);
  };

  const puedeAvanzar = () => {
    if (pasoActual === 1) {
      return sucursalSeleccionada && bodegaSeleccionada;
    }
    return true;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Sistema de Facturación
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Gestiona tus ventas de manera eficiente
        </p>
      </div>

      {/* Tabs principales */}
      <div className="flex space-x-2 mb-6 border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'pos', label: 'Punto de Venta', icono: ShoppingCartIcon },
          { id: 'estadisticas', label: 'Estadísticas', icono: ChartBarIcon }
        ].map(tab => {
          const Icono = tab.icono;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 font-semibold rounded-t-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icono className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido */}
      <div>
        {activeTab === 'pos' && (
          <div className="space-y-6">
            {/* Indicador de pasos - Wizard horizontal */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                {pasos.map((paso, index) => {
                  const esActivo = pasoActual === paso.numero;
                  const estaCompletado = paso.completado;
                  const yaVisitado = pasoActual > paso.numero;

                  return (
                    <React.Fragment key={paso.numero}>
                      {/* Paso */}
                      <div className="flex flex-col items-center flex-1">
                        <button
                          onClick={() => {
                            if (paso.numero === 1 || (paso.numero === 2 && puedeAvanzar()) || paso.numero === 3) {
                              setPasoActual(paso.numero);
                            }
                          }}
                          disabled={paso.numero === 2 && !puedeAvanzar()}
                          className={`
                            w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg
                            transition-all duration-300 mb-2 relative
                            ${esActivo 
                              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50 scale-110' 
                              : estaCompletado || yaVisitado
                              ? 'bg-green-500 text-white cursor-pointer hover:scale-105'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            }
                            ${paso.numero === 2 && !puedeAvanzar() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          {estaCompletado && !esActivo ? (
                            <CheckCircleIcon className="h-7 w-7" />
                          ) : (
                            <span>{paso.numero}</span>
                          )}
                        </button>
                        <div className="text-center">
                          <p className={`
                            text-sm font-semibold
                            ${esActivo 
                              ? 'text-blue-600 dark:text-blue-400' 
                              : 'text-slate-600 dark:text-slate-400'
                            }
                          `}>
                            {paso.titulo}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            {paso.descripcion}
                          </p>
                        </div>
                      </div>

                      {/* Línea conectora */}
                      {index < pasos.length - 1 && (
                        <div className={`
                          h-1 flex-1 mx-2 rounded-full transition-all duration-300 mb-8
                          ${yaVisitado || estaCompletado
                            ? 'bg-green-500'
                            : 'bg-slate-200 dark:bg-slate-700'
                          }
                        `} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Contenido según el paso */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Paso 1: Configuración de Sucursal y Bodega */}
              {pasoActual === 1 && (
                <div className="lg:col-span-3">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 border border-slate-200 dark:border-slate-800">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                        Configuración Inicial
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        Selecciona la sucursal y bodega donde realizarás las ventas
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* Sucursal */}
                      {rol === 'admin' && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Sucursal
                          </label>
                          <select
                            value={sucursalSeleccionada || ''}
                            onChange={(e) => {
                              const value = Number(e.target.value) || null;
                              setSucursalSeleccionada(value);
                              setBodegaSeleccionada(null);
                            }}
                            className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-colors duration-200"
                          >
                            <option value="">Seleccionar sucursal...</option>
                            {sucursales.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Bodega */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Bodega de Venta
                        </label>
                        <select
                          value={bodegaSeleccionada || ''}
                          onChange={(e) => setBodegaSeleccionada(parseInt(e.target.value))}
                          className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-colors duration-200"
                          disabled={!sucursalSeleccionada}
                          required
                        >
                          <option value="">Seleccionar bodega...</option>
                          {bodegas
                            .filter(b =>
                              Number(b.sucursal_id ?? b.id_sucursal ?? b.sucursal) ===
                              Number(sucursalSeleccionada)
                            )
                            .map(b => (
                              <option key={b.id} value={b.id}>
                                {b.nombre} {b.es_predeterminada && '(Predeterminada)'}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Botón de continuar */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => setPasoActual(2)}
                        disabled={!puedeAvanzar()}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all shadow-lg"
                      >
                        Continuar a Facturación
                        <ArrowRightIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 2: Formulario de Factura - CENTRADO */}
              {pasoActual === 2 && bodegaSeleccionada && (
                <div className="lg:col-span-3">
                  <div className="max-w-5xl mx-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                        <h3 className="text-xl font-bold text-white">
                          Nueva Factura
                        </h3>
                        <p className="text-blue-100 text-sm">
                          Completa los datos de la venta
                        </p>
                      </div>
                      <div className="p-6">
                        <FacturaForm
                          bodegaId={bodegaSeleccionada}
                          sucursalId={sucursalSeleccionada}
                          onFacturaCreada={handleFacturaCreada}
                        />
                      </div>
                    </div>

                    {/* Resumen de última venta (si existe) - Abajo del formulario */}
                    {ultimaFactura && (
                      <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-bold text-white">Última Venta Completada</h3>
                            <p className="text-green-100 text-sm">Click para ver detalles o imprimir</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPasoActual(3)}
                              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white text-sm font-semibold"
                            >
                              Ver Ticket
                            </button>
                            <button
                              onClick={handleImprimir}
                              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                              title="Imprimir"
                            >
                              <PrinterIcon className="h-5 w-5 text-white" />
                            </button>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">Factura #{ultimaFactura.numero_factura}</p>
                              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                ${parseFloat(ultimaFactura.total).toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {ultimaFactura.detalles?.length || 0} {ultimaFactura.detalles?.length === 1 ? 'producto' : 'productos'}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-500">
                                {ultimaFactura.cliente_nombre || 'Consumidor Final'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Paso 3: Ticket final */}
              {pasoActual === 3 && ultimaFactura && (
                <div className="lg:col-span-3">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
                      <div className="flex items-center gap-4">
                        <CheckCircleIcon className="h-12 w-12 text-white" />
                        <div>
                          <h3 className="text-2xl font-bold text-white">
                            ¡Venta Completada!
                          </h3>
                          <p className="text-green-100">
                            La factura se ha generado correctamente
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="max-w-2xl mx-auto">
                        <FacturaTicket factura={ultimaFactura} />
                      </div>

                      <div className="flex gap-4 justify-center mt-8">
                        <button
                          onClick={handleImprimir}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                        >
                          <PrinterIcon className="h-5 w-5" />
                          Imprimir Ticket
                        </button>
                        <button
                          onClick={handleNuevaVenta}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                        >
                          <ShoppingCartIcon className="h-5 w-5" />
                          Nueva Venta
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botones de navegación del wizard */}
            {pasoActual > 1 && pasoActual < 3 && (
              <div className="flex justify-between">
                <button
                  onClick={() => setPasoActual(pasoActual - 1)}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  Volver
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab de Estadísticas */}
        {activeTab === 'estadisticas' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  Estadísticas de Hoy
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Resumen de ventas del día
                </p>
              </div>
              <button
                onClick={cargarEstadisticas}
                className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors font-semibold"
              >
                Actualizar
              </button>
            </div>

            {loadingEstadisticas ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-500 dark:text-slate-400 mt-4">Cargando estadísticas...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 dark:from-blue-900/30 to-blue-100 dark:to-blue-800/30 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                    Total Facturado
                  </h4>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    ${parseFloat(estadisticas.total_facturado).toFixed(2)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 dark:from-emerald-900/30 to-emerald-100 dark:to-emerald-800/30 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                    Total Facturas
                  </h4>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {estadisticas.cantidad}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 dark:from-purple-900/30 to-purple-100 dark:to-purple-800/30 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                  <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                    Promedio
                  </h4>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    ${parseFloat(estadisticas.promedio).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}