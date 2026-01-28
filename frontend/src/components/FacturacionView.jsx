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
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Facturación POS</h2>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200">
        {[
          { id: 'pos', label: 'Punto de Venta', icon: '🖥️' },
          { id: 'estadisticas', label: 'Estadísticas', icon: '📊' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-3 font-semibold rounded-t-lg transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sucursal
                  </label>
                  <select
                    value={sucursalSeleccionada || ''}
                    onChange={(e) => {
                      const value = Number(e.target.value) || null;
                      setSucursalSeleccionada(value);
                      setBodegaSeleccionada(null); // Reset bodega al cambiar sucursal
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <h3 className="text-lg font-semibold">Última Venta</h3>
                    <button
                      onClick={handleImprimir}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Imprimir"
                    >
                      <PrinterIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <FacturaTicket factura={ultimaFactura} />
                </div>
              ) : (
                <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
                  <p>No hay ventas recientes</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'estadisticas' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Estadísticas de Hoy</h3>
              <button
                onClick={cargarEstadisticas}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                Actualizar
              </button>
            </div>

            {loadingEstadisticas ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Cargando estadísticas...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Total Facturado</h4>
                  <p className="text-3xl font-bold text-blue-600">
                    ${parseFloat(estadisticas.total_facturado).toFixed(2)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Total Facturas</h4>
                  <p className="text-3xl font-bold text-green-600">
                    {estadisticas.cantidad}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Promedio</h4>
                  <p className="text-3xl font-bold text-purple-600">
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
