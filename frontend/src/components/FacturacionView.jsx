// src/components/FacturacionView.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchBodegas, fetchSucursales } from '../services/api';
import FacturaForm from './facturacion/FacturaForm';
import FacturaTicket from './facturacion/FacturaTicket';
import {
  PrinterIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

export default function FacturacionView() {
  const { rol, tokenUsuario, usuario, subdominio, tienda } = useAuth();

  const [pasoActual, setPasoActual] = useState(1); // Para el wizard
  const [sucursales, setSucursales] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [bodegas, setBodegas] = useState([]);
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState(null);
  const [ultimaFactura, setUltimaFactura] = useState(null);

  // Obtener información de la tienda desde localStorage
  const nombreSucursal = localStorage.getItem('nombre_sucursal');
  const subdominioTienda = window.location.hostname.split('.')[0];

  // Construir empresaInfo para el ticket
  const empresaInfo = {
    nombre: tienda || nombreSucursal || 'MI TIENDA',
    nit: localStorage.getItem('nit_tienda') || 'N/P',
    direccion: localStorage.getItem('direccion_tienda') || 'Dirección no disponible',
    ciudad: localStorage.getItem('ciudad_tienda') || 'Colombia',
    telefono: localStorage.getItem('telefono_tienda') || 'N/P',
    email: localStorage.getItem('email_tienda') || 'ventas@mitienda.com',
    regimen: localStorage.getItem('regimen_tienda') || 'Régimen Simplificado',
  };

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

  const handleFacturaCreada = (factura) => {
    setUltimaFactura(factura);
    setPasoActual(3); // Avanzar automáticamente al ticket
  };

  const handleImprimir = () => {
    window.print();
  };

  const handleNuevaVenta = () => {
    setUltimaFactura(null);
    setPasoActual(2);
  };

  const puedeIrAPaso = (numeroPaso) => {
    // Paso 1: Siempre accesible
    if (numeroPaso === 1) return true;

    // Paso 2: Requiere sucursal y bodega seleccionadas
    if (numeroPaso === 2) {
      return sucursalSeleccionada && bodegaSeleccionada;
    }

    // Paso 3: Requiere que exista una factura creada
    if (numeroPaso === 3) {
      return ultimaFactura !== null;
    }

    return false;
  };

  const puedeAvanzar = () => {
    return puedeIrAPaso(pasoActual + 1);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:!text-slate-100">
          Sistema de Facturación
        </h2>
      </div>

      {/* Contenido */}
      <div className="space-y-4">
            {/* Indicador de pasos - Wizard horizontal compacto */}
            <div className="bg-white dark:!bg-slate-900 rounded-xl shadow-md p-3 border border-slate-200 dark:!border-slate-800">
              <div className="flex items-center justify-between">
                {pasos.map((paso, index) => {
                  const esActivo = pasoActual === paso.numero;
                  const estaCompletado = paso.completado;
                  const yaVisitado = pasoActual > paso.numero;

                  return (
                    <React.Fragment key={paso.numero}>
                      <div className="flex flex-col items-center flex-1">
                        <button
                          onClick={() => {
                            if (puedeIrAPaso(paso.numero)) {
                              setPasoActual(paso.numero);
                            }
                          }}
                          disabled={!puedeIrAPaso(paso.numero)}
                          className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                            transition-all duration-200 relative
                            ${esActivo
                              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50 scale-105'
                              : estaCompletado || yaVisitado
                              ? 'bg-sky-400 text-white cursor-pointer hover:scale-105'
                              : 'bg-slate-200 dark:!bg-slate-700 text-slate-500 dark:!text-slate-400'
                            }
                            ${!puedeIrAPaso(paso.numero) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          {estaCompletado && !esActivo ? (
                            <CheckCircleIcon className="h-5 w-5" />
                          ) : (
                            <span>{paso.numero}</span>
                          )}
                        </button>
                        <p className={`text-xs font-medium mt-1 ${esActivo ? 'text-blue-600 dark:!text-blue-400' : 'text-slate-600 dark:!text-slate-400'}`}>
                          {paso.titulo}
                        </p>
                      </div>

                      {index < pasos.length - 1 && (
                        <div className={`
                          h-0.5 flex-1 mx-1 rounded-full transition-all duration-200 mt-[-12px]
                          ${yaVisitado || estaCompletado
                            ? 'bg-sky-400'
                            : 'bg-slate-200 dark:!bg-slate-700'
                          }
                        `} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Contenido según el paso */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Paso 1: Configuración de Sucursal y Bodega */}
              {pasoActual === 1 && (
                <div className="lg:col-span-3">
                  <div className="bg-white dark:!bg-slate-900 rounded-xl shadow-md p-5 border border-slate-200 dark:!border-slate-800">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-slate-800 dark:!text-slate-100">
                        Configuración Inicial
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Sucursal */}
                      {rol === 'admin' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:!text-slate-300 mb-2">
                            Sucursal
                          </label>
                          <div className="relative">
                            <select
                              value={sucursalSeleccionada || ''}
                              onChange={(e) => {
                                const value = Number(e.target.value) || null;
                                setSucursalSeleccionada(value);
                                setBodegaSeleccionada(null);
                              }}
                              className="w-full px-4 py-2.5 pl-3 pr-10 text-sm font-medium
                                border-2 border-slate-200 dark:!border-slate-700
                                rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                bg-white dark:!bg-slate-800
                                text-slate-900 dark:!text-slate-100
                                appearance-none cursor-pointer
                                transition-all duration-200
                                hover:border-slate-300 dark:hover:border-slate-600
                                shadow-sm hover:shadow-md"
                            >
                              <option value="">Seleccionar sucursal...</option>
                              {sucursales.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.nombre}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <ChevronDownIcon className="h-5 w-5 text-slate-400 dark:!text-slate-500" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bodega */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:!text-slate-300 mb-2">
                          Bodega de Venta
                        </label>
                        <div className="relative">
                          <select
                            value={bodegaSeleccionada || ''}
                            onChange={(e) => setBodegaSeleccionada(parseInt(e.target.value))}
                            className="w-full px-4 py-2.5 pl-3 pr-10 text-sm font-medium
                              border-2 border-slate-200 dark:!border-slate-700
                              rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                              bg-white dark:!bg-slate-800
                              text-slate-900 dark:!text-slate-100
                              appearance-none cursor-pointer
                              transition-all duration-200
                              hover:border-slate-300 dark:hover:border-slate-600
                              shadow-sm hover:shadow-md
                              disabled:opacity-50 disabled:cursor-not-allowed"
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
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <ChevronDownIcon className="h-5 w-5 text-slate-400 dark:!text-slate-500" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botón de continuar */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => setPasoActual(2)}
                        disabled={!puedeAvanzar()}
                        className="flex items-center gap-2 px-5 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all shadow-md"
                      >
                        Continuar
                        <ArrowRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 2: Formulario de Factura - CENTRADO */}
              {pasoActual === 2 && bodegaSeleccionada && (
                <div className="lg:col-span-3">
                  <div className="max-w-5xl mx-auto">
                    <div className="bg-white dark:!bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:!border-slate-800 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                        <h3 className="text-base font-bold text-white">
                          Nueva Factura
                        </h3>
                      </div>
                      <div className="p-4">
                        <FacturaForm
                          bodegaId={bodegaSeleccionada}
                          sucursalId={sucursalSeleccionada}
                          onFacturaCreada={handleFacturaCreada}
                        />
                      </div>
                    </div>

                    {/* Resumen de última venta (si existe) - Abajo del formulario */}
                    {ultimaFactura && (
                      <div className="mt-4 bg-white dark:!bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:!border-slate-800 overflow-hidden">
                        <div className="bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2 flex justify-between items-center">
                          <div>
                            <h3 className="text-sm font-bold text-white">Última Venta Completada</h3>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPasoActual(3)}
                              className="px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white font-semibold"
                            >
                              Ver Ticket
                            </button>
                            <button
                              onClick={handleImprimir}
                              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                              title="Imprimir"
                            >
                              <PrinterIcon className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 dark:!bg-slate-800">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-slate-600 dark:!text-slate-400">Factura #{ultimaFactura.numero_factura}</p>
                              <p className="text-base font-bold text-slate-900 dark:!text-slate-100">
                                ${parseFloat(ultimaFactura.total).toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-600 dark:!text-slate-400">
                                {ultimaFactura.detalles?.length || 0} {ultimaFactura.detalles?.length === 1 ? 'producto' : 'productos'}
                              </p>
                              <p className="text-xs text-slate-500 dark:!text-slate-500">
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
                  <div className="bg-white dark:!bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:!border-slate-800 overflow-hidden">
                    <div className="bg-gradient-to-r from-sky-400 to-cyan-400 px-5 py-3">
                      <div className="flex items-center gap-3">
                        <CheckCircleIcon className="h-8 w-8 text-white" />
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            ¡Venta Completada!
                          </h3>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="max-w-2xl mx-auto">
                        <FacturaTicket factura={ultimaFactura} />
                      </div>

                      <div className="flex gap-3 justify-center mt-5">
                        <button
                          onClick={handleImprimir}
                          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                        >
                          <PrinterIcon className="h-4 w-4" />
                          Imprimir Ticket
                        </button>
                        <button
                          onClick={handleNuevaVenta}
                          className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-sky-400 to-cyan-400 text-white font-semibold rounded-lg hover:from-sky-500 hover:to-cyan-500 transition-all shadow-md"
                        >
                          <ShoppingCartIcon className="h-4 w-4" />
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
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-200 dark:!bg-slate-700 text-slate-700 dark:!text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:!bg-slate-600 transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Volver
                </button>
              </div>
            )}
      </div>
    </div>
  );
}