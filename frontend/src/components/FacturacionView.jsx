// src/components/FacturacionView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchBodegas, fetchSucursales, fetchFacturas } from '../services/api';
import FacturaForm from './facturacion/FacturaForm';
import FacturaTicket from './facturacion/FacturaTicket';
import {
  PrinterIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function FacturacionView() {
  const { rol, tokenUsuario, usuario, subdominio, tienda } = useAuth();

  const [pasoActual, setPasoActual] = useState(1); // Para el wizard
  const [sucursales, setSucursales] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [bodegas, setBodegas] = useState([]);
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState(null);
  const [ultimaFactura, setUltimaFactura] = useState(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [facturas, setFacturas] = useState([]);
  const [cargandoFacturas, setCargandoFacturas] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [filtros, setFiltros] = useState({
    estado: '',
    cliente: '',
    numero_factura: '',
    fecha_inicio: '',
    fecha_fin: ''
  });
  const [paginacion, setPaginacion] = useState({
    page: 1,
    page_size: 30,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_previous: false
  });
  const inicializadoRef = useRef(false);

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

  useEffect(() => {
    if (mostrarHistorial && !inicializadoRef.current) {
      inicializadoRef.current = true;
      cargarFacturas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarHistorial]);

  useEffect(() => {
    if (mostrarHistorial && inicializadoRef.current) {
      cargarFacturas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginacion.page]);

  const cargarBodegas = async () => {
    if (!sucursalSeleccionada) return;

    try {
      const response = await fetchBodegas({
        rol,
        tokenUsuario,
        usuario,
        subdominio,
        sucursalId: sucursalSeleccionada  // ✅ Pasar la sucursal seleccionada
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

  const cargarFacturas = async () => {
    setCargandoFacturas(true);
    try {
      const response = await fetchFacturas({
        token: tokenUsuario,
        usuario,
        subdominio,
        page: paginacion.page,
        page_size: paginacion.page_size,
        estado: filtros.estado || undefined,
        cliente: filtros.cliente || undefined,
        numero_factura: filtros.numero_factura || undefined,
        fecha_inicio: filtros.fecha_inicio || undefined,
        fecha_fin: filtros.fecha_fin || undefined
      });
      setFacturas(response.datos || []);
      setPaginacion({
        page: response.page,
        page_size: response.page_size,
        total: response.total,
        total_pages: response.total_pages,
        has_next: response.has_next,
        has_previous: response.has_previous
      });
    } catch (error) {
      console.error('Error cargando facturas:', error);
    } finally {
      setCargandoFacturas(false);
    }
  };

  const handleAbrirHistorial = () => {
    inicializadoRef.current = false;
    setMostrarHistorial(true);
  };

  const handleCerrarHistorial = () => {
    setMostrarHistorial(false);
    setFacturaSeleccionada(null);
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
    <div className="w-full px-4 pb-8">
      {/* Header */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:!text-slate-100 transition-colors duration-200">Sistema de Facturación</h2>
          <p className="text-slate-500 dark:!text-slate-400 text-sm transition-colors duration-200">Factura ordenadamente tus ventas</p>
        </div>
        <button
          onClick={handleAbrirHistorial}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
        >
          <DocumentTextIcon className="h-5 w-5" />
          Ver Facturas
        </button>
      </div>

      {/* Contenido */}
      <div className="space-y-4 flex-1 flex flex-col">
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
                  <div className="bg-white dark:!bg-slate-900 rounded-xl shadow-md p-5 border border-slate-200 dark:!border-slate-800" style={{ minHeight: 'calc(100vh - 200px)' }}>
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
                  <div className="w-full">
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
                      <div className="flex justify-center">
                        <FacturaTicket
                          factura={ultimaFactura}
                          empresaInfo={empresaInfo}
                        />
                      </div>

                      <div className="flex gap-3 justify-center mt-5 pt-4 border-t border-slate-200 dark:!border-slate-700 no-print">
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

            {/* Modal de Historial de Facturas */}
            {mostrarHistorial && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCerrarHistorial}></div>
                <div className="relative bg-white dark:!bg-slate-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <DocumentTextIcon className="h-6 w-6 text-white" />
                      <h3 className="text-lg font-bold text-white">Historial de Facturas</h3>
                    </div>
                    <button onClick={handleCerrarHistorial} className="text-white hover:text-slate-200">
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="px-6 py-4 overflow-y-auto flex-1">
                    {!facturaSeleccionada ? (
                      <>
                        {/* Filtros */}
                        <div className="mb-4 bg-slate-50 dark:!bg-slate-800 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:!text-slate-300 mb-1">N Factura</label>
                              <input
                                type="text"
                                value={filtros.numero_factura}
                                onChange={(e) => setFiltros({...filtros, numero_factura: e.target.value})}
                                placeholder="FACT-000001"
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:!border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:!bg-slate-700 text-slate-900 dark:!text-slate-100"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:!text-slate-300 mb-1">Cliente</label>
                              <input
                                type="text"
                                value={filtros.cliente}
                                onChange={(e) => setFiltros({...filtros, cliente: e.target.value})}
                                placeholder="Nombre o documento"
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:!border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:!bg-slate-700 text-slate-900 dark:!text-slate-100"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:!text-slate-300 mb-1">Estado</label>
                              <select
                                value={filtros.estado}
                                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:!border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:!bg-slate-700 text-slate-900 dark:!text-slate-100"
                              >
                                <option value="">Todos</option>
                                <option value="PAG">Pagada</option>
                                <option value="ANU">Anulada</option>
                                <option value="BOR">Borrador</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:!text-slate-300 mb-1">Fecha Desde</label>
                              <input
                                type="date"
                                value={filtros.fecha_inicio}
                                onChange={(e) => setFiltros({...filtros, fecha_inicio: e.target.value})}
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:!border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:!bg-slate-700 text-slate-900 dark:!text-slate-100"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:!text-slate-300 mb-1">Fecha Hasta</label>
                              <input
                                type="date"
                                value={filtros.fecha_fin}
                                onChange={(e) => setFiltros({...filtros, fecha_fin: e.target.value})}
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:!border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:!bg-slate-700 text-slate-900 dark:!text-slate-100"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button onClick={cargarFacturas} className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md">
                              <DocumentTextIcon className="h-4 w-4" /> Buscar
                            </button>
                            <button onClick={() => {setFiltros({estado: '', cliente: '', numero_factura: '', fecha_inicio: '', fecha_fin: ''}); setPaginacion({...paginacion, page: 1});}} className="px-4 py-2 text-sm bg-slate-200 dark:!bg-slate-700 text-slate-700 dark:!text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:!bg-slate-600 transition-colors">
                              Limpiar
                            </button>
                            {paginacion.total > 0 && (
                              <span className="ml-auto text-sm text-slate-600 dark:!text-slate-400 self-center">Total: {paginacion.total} facturas</span>
                            )}
                          </div>
                        </div>

                        {/* Lista de facturas */}
                        {cargandoFacturas ? (
                          <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                            <p className="mt-4 text-slate-600 dark:!text-slate-400">Cargando facturas...</p>
                          </div>
                        ) : facturas.length === 0 ? (
                          <div className="text-center py-8">
                            <DocumentTextIcon className="h-16 w-16 text-slate-300 dark:!text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-600 dark:!text-slate-400">No hay facturas registradas</p>
                          </div>
                        ) : (
                          <>
                            <div className="hidden md:block overflow-x-auto">
                              <table className="min-w-full divide-y divide-slate-200 dark:!divide-slate-700">
                                <thead className="bg-slate-50 dark:!bg-slate-800">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:!text-slate-400 uppercase tracking-wider">N Factura</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:!text-slate-400 uppercase tracking-wider">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:!text-slate-400 uppercase tracking-wider">Cliente</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:!text-slate-400 uppercase tracking-wider">Total</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:!text-slate-400 uppercase tracking-wider">Estado</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:!text-slate-400 uppercase tracking-wider">Acciones</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white dark:!bg-slate-900 divide-y divide-slate-200 dark:!divide-slate-700">
                                  {facturas.map((factura) => (
                                    <tr key={factura.id} className="hover:bg-slate-50 dark:hover:!bg-slate-800 transition-colors">
                                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:!text-slate-100">#{factura.numero_factura || factura.id}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:!text-slate-400">
                                        {factura.fecha_venta ? new Date(factura.fecha_venta).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'N/A'}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-600 dark:!text-slate-400">
                                        <div className="max-w-[200px] truncate" title={factura.cliente_nombre || 'Consumidor Final'}>
                                          {factura.cliente_nombre || 'Consumidor Final'}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-900 dark:!text-slate-100">${parseFloat(factura.total || 0).toFixed(2)}</td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:!bg-green-900 dark:!text-green-200">
                                          {factura.estado === 'PAG' ? 'Pagada' : factura.estado === 'ANU' ? 'Anulada' : factura.estado === 'BOR' ? 'Borrador' : factura.estado || 'N/A'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => setFacturaSeleccionada(factura)} className="text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300 transition-colors flex items-center gap-1 ml-auto">
                                          <PrinterIcon className="h-4 w-4" /> Ver Recibo
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Paginación */}
                            {paginacion.total_pages > 1 && (
                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:!border-slate-700">
                                <button onClick={() => setPaginacion({...paginacion, page: paginacion.page - 1})} disabled={!paginacion.has_previous} className="px-3 py-2 text-sm bg-slate-200 dark:!bg-slate-700 text-slate-700 dark:!text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:!bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1">
                                  <ArrowLeftIcon className="h-4 w-4" /> Anterior
                                </button>
                                <span className="text-sm text-slate-600 dark:!text-slate-400">Página {paginacion.page} de {paginacion.total_pages}</span>
                                <button onClick={() => setPaginacion({...paginacion, page: paginacion.page + 1})} disabled={!paginacion.has_next} className="px-3 py-2 text-sm bg-slate-200 dark:!bg-slate-700 text-slate-700 dark:!text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:!bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1">
                                  Siguiente <ArrowRightIcon className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="mb-4 print:hidden">
                          <button onClick={() => setFacturaSeleccionada(null)} className="flex items-center gap-2 text-sm text-slate-600 dark:!text-slate-400 hover:text-slate-800 dark:hover:!text-slate-200 transition-colors">
                            <ArrowLeftIcon className="h-4 w-4" /> Volver a la lista
                          </button>
                        </div>
                        <div className="bg-white dark:!bg-slate-800 rounded-lg p-6 border border-slate-200 dark:!border-slate-700">
                          <div className="flex justify-center">
                            <FacturaTicket
                              factura={facturaSeleccionada}
                              empresaInfo={empresaInfo}
                            />
                          </div>
                        </div>
                        <div className="flex justify-center gap-3 mt-4">
                          <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                          >
                            <PrinterIcon className="h-4 w-4" />
                            Imprimir Ticket
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
      </div>
    </div>
  );
}