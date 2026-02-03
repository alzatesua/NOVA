// src/components/FacturacionView.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchBodegas, fetchSucursales, fetchVentasHoy } from '../services/api';
import FacturaForm from './facturacion/FacturaForm';
import FacturaTicket from './facturacion/FacturaTicket';
import { PrinterIcon } from '@heroicons/react/24/outline';

export default function FacturacionView() {
  const { rol, tokenUsuario, usuario, subdominio } = useAuth();

  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'historial' | 'estadisticas'
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

  useEffect(() => {
    cargarSucursales();
    cargarEstadisticas();
  }, []);

  const cargarSucursales = async () => {
    if (rol !== 'admin') {
      // Si no es admin, usar sucursal del localStorage
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

      // Seleccionar bodega predeterminada
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
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-800 dark:!text-slate-100 mb-6 transition-colors duration-200">Facturación POS</h2>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-slate-200 dark:!border-slate-800 transition-colors duration-200">
        {[
          { id: 'pos', label: 'Punto de Venta', icon: '🖥️' },
          { id: 'estadisticas', label: 'Estadísticas', icon: '📊' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-3 font-semibold rounded-t-lg transition transition-colors duration-200 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:!bg-slate-800 text-slate-700 dark:!text-slate-300 hover:bg-slate-200 dark:hover:!bg-slate-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div>
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Seleccionar sucursal y bodega */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sucursal */}
              {rol === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-2 transition-colors duration-200">
                    Sucursal
                  </label>
                  <select
                    value={sucursalSeleccionada || ''}
                    onChange={(e) => {
                      const value = Number(e.target.value) || null;
                      setSucursalSeleccionada(value);
                      setBodegaSeleccionada(null); // Reset bodega al cambiar sucursal
                    }}
                    className="w-full px-4 py-2 border border-slate-300 dark:!border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 transition-colors duration-200"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bodega de Venta
                </label>
                <select
                  value={bodegaSeleccionada || ''}
                  onChange={(e) => setBodegaSeleccionada(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Formulario de factura */}
            {bodegaSeleccionada && (
              <div className="lg:col-span-2">
                <FacturaForm
                  bodegaId={bodegaSeleccionada}
                  sucursalId={sucursalSeleccionada}
                  onFacturaCreada={handleFacturaCreada}
                />
              </div>
            )}

            {/* Ticket de última factura */}
            <div className="lg:col-span-1">
              {ultimaFactura ? (
                <div className="sticky top-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:!text-slate-100 transition-colors duration-200">Última Venta</h3>
                    <button
                      onClick={handleImprimir}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:!bg-slate-800 rounded-lg transition-colors duration-200"
                      title="Imprimir"
                    >
                      <PrinterIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <FacturaTicket factura={ultimaFactura} />
                </div>
              ) : (
                <div className="bg-slate-50 dark:!bg-slate-900 p-6 rounded-lg text-center text-slate-500 dark:!text-slate-400 border border-slate-200 dark:!border-slate-800 transition-colors duration-200">
                  <p>No hay ventas recientes</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'estadisticas' && (
          <div className="bg-white dark:!bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:!border-slate-800 transition-colors duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-slate-800 dark:!text-slate-100 transition-colors duration-200">Estadísticas de Hoy</h3>
              <button
                onClick={cargarEstadisticas}
                className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:!bg-slate-800 rounded-lg transition-colors duration-200"
              >
                Actualizar
              </button>
            </div>

            {loadingEstadisticas ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-500 dark:!text-slate-400 mt-4 transition-colors duration-200">Cargando estadísticas...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 dark:from-blue-900/30 to-blue-100 dark:to-blue-800/30 p-6 rounded-lg border border-blue-200 dark:!border-blue-800 transition-colors duration-200">
                  <h4 className="text-sm font-medium text-slate-600 dark:!text-slate-300 mb-2">Total Facturado</h4>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    ${parseFloat(estadisticas.total_facturado).toFixed(2)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 dark:from-emerald-900/30 to-emerald-100 dark:to-emerald-800/30 p-6 rounded-lg border border-emerald-200 dark:!border-emerald-800 transition-colors duration-200">
                  <h4 className="text-sm font-medium text-slate-600 dark:!text-slate-300 mb-2">Total Facturas</h4>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {estadisticas.cantidad}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 dark:from-purple-900/30 to-purple-100 dark:to-purple-800/30 p-6 rounded-lg border border-purple-200 dark:!border-purple-800 transition-colors duration-200">
                  <h4 className="text-sm font-medium text-slate-600 dark:!text-slate-300 mb-2">Promedio</h4>
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
