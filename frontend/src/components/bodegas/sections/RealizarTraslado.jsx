// src/components/bodegas/sections/RealizarTraslado.jsx
// VERSIÓN COMPLETA con Crear y Recibir Traslados

import { 
  ArrowPathRoundedSquareIcon, 
  PlusIcon, 
  XCircleIcon,
  ArchiveBoxArrowDownIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';

import React, { useState, useEffect, useRef } from "react";
import { obtenerProductosPorBodega } from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";

// Hook simple para "debouncear"
function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function RealizarTraslado({
  showTrasladosForm, setShowTrasladosForm,
  newProducts, setNewProducts,
  usarTransito, setUsarTransito,
  onRealizarTraslado, trasladoLoading,
  bodegas, isLoadingBodegas,
  productos, isLoadingProductos,
  errorBodegas, onRetryBodegas,
  sucursalSel,
  // PROPS para recibir traslados (OPCIONALES)
  trasladosDisponibles = [],
  isLoadingTraslados = false,
  onCargarTraslados = null,
  onRecibirTraslado = null,
  // NUEVA PROP: productos filtrados por bodega
  productosPorBodega = {},
}) {
  const { tokenUsuario, subdominio } = useAuth();
  const usuario = typeof localStorage !== 'undefined' ? localStorage.getItem('usuario') : null;

  const barcodeTimers = useRef({});
  const barcodeRefs = useRef([]);

  // Estado para el modo (crear o recibir)
  const [modo, setModo] = useState('crear');
  const [trasladoSeleccionado, setTrasladoSeleccionado] = useState(null);

  // Estado para productos filtrados por bodega de origen
  const [productosPorBodegaOrigen, setProductosPorBodegaOrigen] = useState({});
  const [isLoadingProductosBodega, setIsLoadingProductosBodega] = useState(false);

  // Cargar productos por bodega de origen cuando se selecciona
  useEffect(() => {
    newProducts.forEach((product) => {
      if (product.bodega_origen && !productosPorBodegaOrigen[product.bodega_origen]) {
        cargarProductosParaBodega(product.bodega_origen);
      }
    });
  }, [newProducts.map(p => p.bodega_origen).join(','), subdominio, usuario, tokenUsuario]);

  const cargarProductosParaBodega = async (bodegaId) => {
    if (!bodegaId || !subdominio || !usuario) return;

    console.log('[RealizarTraslado] Cargando productos para bodega:', bodegaId);

    setIsLoadingProductosBodega(true);
    try {
      const response = await obtenerProductosPorBodega({
        usuario,
        tokenUsuario,
        subdominio,
        bodega_id: bodegaId,
        solo_con_stock: false  // Traer todos, incluidos los que no tienen stock
      });

      if (response && response.datos) {
        console.log('[RealizarTraslado] Productos recibidos para bodega:', bodegaId, response.datos.length);
        setProductosPorBodegaOrigen(prev => ({
          ...prev,
          [bodegaId]: response.datos
        }));
      }
    } catch (error) {
      console.error('[RealizarTraslado] Error cargando productos para bodega:', error);
    } finally {
      setIsLoadingProductosBodega(false);
    }
  };

  // Cargar traslados disponibles cuando se cambia a modo recibir
  useEffect(() => {
    if (modo === 'recibir' && onCargarTraslados && sucursalSel?.bodega_id) {
      onCargarTraslados();
    }
  }, [modo, sucursalSel, onCargarTraslados]);

  const updateLine = (index, field, value) => {
    setNewProducts(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeLine = (index) => setNewProducts(prev => prev.filter((_, i) => i !== index));
  
  const addEmptyLine = () =>
    setNewProducts(prev => [...prev, { 
      producto_id: "", 
      cantidad: "", 
      bodega_origen: "", 
      bodega_destino: "", 
      observaciones: "" 
    }]);

  const addEmptyLineProduct = () =>
    setNewProducts(prev => [...prev, { producto_id: "", cantidad: ""}]);

  const sameBodega = (p, bodegaOrigen) => {
    // Si el producto viene de productosPorBodega, tiene bodega_id
    if (p.bodega_id !== undefined && p.bodega_id !== null) {
      return Number(p.bodega_id) === Number(bodegaOrigen);
    }
    // Si no, usar las propiedades normales
    return Number(p.bodega ?? p.bodega_id ?? p.id_bodega) === Number(bodegaOrigen);
  };

  const getBarcode = (p) =>
    String(p.codigo_barras ?? p.codigo_barra ?? p.barcode ?? p.codigo ?? p.sku ?? "").trim();

  const onBarcodeChange = (prodIndex, lIndex, raw) => {
    const code = String(raw || "").trim();
    setNewProducts(prev => {
      const copy = [...prev];
      const prod = copy[prodIndex];
      const lineas = prod.lineas || [];

      copy[prodIndex] = {
        ...prod,
        lineas: lineas.map((ln, i) => (i === lIndex ? { ...ln, codigo: raw } : ln))
      };

      if (!prod?.bodega_origen || !code) {
        copy[prodIndex].lineas[lIndex] = {
          ...copy[prodIndex].lineas[lIndex],
          producto_id: "",
          cantidad: "",
        };
        return copy;
      }

      const candidates = (productos || []).filter(p => sameBodega(p, prod.bodega_origen));
      const found = candidates.find(p => getBarcode(p) === code);

      if (!found) {
        console.warn('[RealizarTraslado] Producto no encontrado:', {
          code,
          bodegaOrigen: prod.bodega_origen,
          candidatesCount: candidates.length
        });
        copy[prodIndex].lineas[lIndex] = {
          ...copy[prodIndex].lineas[lIndex],
          producto_id: "",
          cantidad: "",
        };
        return copy;
      }

      const currentQty = Number((lineas[lIndex]?.cantidad ?? 0));
      copy[prodIndex].lineas[lIndex] = {
        ...copy[prodIndex].lineas[lIndex],
        producto_id: found.id,
        cantidad: currentQty > 0 ? currentQty : 1,
      };

      return copy;
    });
  };

  const toRelative = (iso) => {
    if (!iso) return '—';
    const ms = Date.now() - new Date(iso).getTime();
    const abs = Math.max(ms, 0);
    const m = Math.floor(abs / 60000);
    if (m < 1) return 'hace segundos';
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    return `hace ${d} d`;
  };

  // Determinar si mostrar opción de recibir
  const mostrarOpcionRecibir = onRecibirTraslado && onCargarTraslados;

  return (
    <div className="bg-white/80 dark:!bg-slate-900/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:!border-slate-800 shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl">
          <ArrowPathRoundedSquareIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:!text-slate-100 dark:!text-slate-100">
            {mostrarOpcionRecibir ? 'Gestión de Traslados' : 'Realizar Traslado'}
          </h3>
          <p className="text-sm text-slate-600 dark:!text-slate-400 dark:!text-slate-400">
            {mostrarOpcionRecibir
              ? 'Crea nuevos traslados o recibe traslados pendientes'
              : 'Transfiere productos entre bodegas de manera eficiente'
            }
          </p>
        </div>
      </div>

      {!showTrasladosForm ? (
        <div className="space-y-6">
          {mostrarOpcionRecibir ? (
            // Selector de modo (crear o recibir)
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Opción: Crear Traslado */}
              <button
                onClick={() => {
                  setModo('crear');
                  setShowTrasladosForm(true);
                }}
                className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 border-2 border-blue-100 dark:!border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-left"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <ArrowPathRoundedSquareIcon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-800 dark:!text-slate-100 mb-2">
                    Crear Nuevo Traslado
                  </h4>
                  <p className="text-sm text-slate-600 dark:!text-slate-400">
                    Transfiere productos entre bodegas de forma manual
                  </p>
                </div>
              </button>

              {/* Opción: Recibir Traslado */}
              <button
                onClick={() => {
                  setModo('recibir');
                  setShowTrasladosForm(true);
                }}
                className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 border-2 border-blue-100 dark:!border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-left"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <ArchiveBoxArrowDownIcon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-800 dark:!text-slate-100 mb-2">
                    Recibir Traslados
                  </h4>
                  <p className="text-sm text-slate-600 dark:!text-slate-400">
                    Acepta traslados pendientes enviados a esta bodega
                  </p>
                  {trasladosDisponibles.length > 0 && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      <ClockIcon className="w-4 h-4" />
                      {trasladosDisponibles.length} pendiente{trasladosDisponibles.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </button>
            </div>
          ) : (
            // Botón simple para crear traslado (sin opción de recibir)
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl p-8 border border-blue-100 max-w-md mx-auto">
                <ArrowPathRoundedSquareIcon className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-800 dark:!text-slate-100 mb-2">Configurar Nuevo Traslado</h4>
                <p className="text-sm text-slate-600 dark:!text-slate-400 mb-6">Selecciona productos y configura el traslado entre bodegas</p>
                <button
                  onClick={() => {
                    setModo('crear');
                    setShowTrasladosForm(true);
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 transition-all duration-200"
                >
                  Iniciar traslado
                </button>
              </div>
            </div>
          )}
        </div>
      ) : modo === 'recibir' ? (
        // ========================================
        // MODO: RECIBIR TRASLADOS
        // ========================================
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-slate-800 dark:!text-slate-100">
              Traslados Pendientes de Recibir
            </h4>
            <button
              onClick={() => setShowTrasladosForm(false)}
              className="px-4 py-2 text-slate-600 dark:!text-slate-400 hover:text-slate-800 dark:!text-slate-100 font-medium transition-colors"
            >
              ← Volver
            </button>
          </div>

          {isLoadingTraslados ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 dark:!text-slate-400">Cargando traslados disponibles...</p>
            </div>
          ) : trasladosDisponibles.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:!bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:!border-slate-700">
              <ArchiveBoxArrowDownIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h5 className="text-lg font-semibold text-slate-700 mb-2">
                No hay traslados pendientes
              </h5>
              <p className="text-sm text-slate-500 mb-4">
                No tienes traslados enviados esperando ser recibidos en esta bodega
              </p>
              <button
                onClick={() => setShowTrasladosForm(false)}
                className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:!text-slate-300 font-medium rounded-xl transition-colors"
              >
                Volver al inicio
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {trasladosDisponibles.map((traslado) => {
                const seleccionado = trasladoSeleccionado?.id === traslado.id;
                
                return (
                  <div
                    key={traslado.id}
                    onClick={() => setTrasladoSeleccionado(traslado)}
                    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                      seleccionado
                        ? 'bg-green-50 border-green-500 shadow-lg'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-3 h-3 rounded-full ${
                            seleccionado ? 'bg-green-500' : 'bg-slate-300'
                          }`}></div>
                          <h5 className="text-lg font-semibold text-slate-800 dark:!text-slate-100">
                            Traslado #{traslado.id}
                          </h5>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            {traslado.estado}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-slate-500">Origen:</span>
                            <span className="ml-2 font-medium text-slate-700">
                              Bodega {traslado.bodega_origen ?? traslado.bodega_origen_id}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Destino:</span>
                            <span className="ml-2 font-medium text-slate-700">
                              Bodega {traslado.bodega_destino ?? traslado.bodega_destino_id}
                            </span>
                          </div>
                        </div>

                        {traslado.observaciones && (
                          <p className="text-sm text-slate-600 dark:!text-slate-400 italic">
                            "{traslado.observaciones}"
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                          <span>Creado {toRelative(traslado.creado_en)}</span>
                          {traslado.enviado_en && (
                            <span>• Enviado {toRelative(traslado.enviado_en)}</span>
                          )}
                        </div>
                      </div>

                      {seleccionado && (
                        <CheckCircleIcon className="w-8 h-8 text-green-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Botones de acción */}
          {trasladosDisponibles.length > 0 && (
            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200 dark:!border-slate-700">
              <button
                onClick={() => setShowTrasladosForm(false)}
                className="px-6 py-3 text-slate-700 font-medium rounded-xl border-2 border-slate-200 dark:!border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (trasladoSeleccionado && onRecibirTraslado) {
                    onRecibirTraslado(trasladoSeleccionado.id);
                  }
                }}
                disabled={!trasladoSeleccionado || trasladoLoading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
              >
                {trasladoLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Recibiendo...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ArchiveBoxArrowDownIcon className="w-5 h-5" />
                    Recibir Traslado
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        // ========================================
        // MODO: CREAR TRASLADO (código completo original)
        // ========================================
        <div className="space-y-8">
          <form
            onSubmit={(e) =>
              onRealizarTraslado(e, {
                newProducts,
                usarTransito,
                close: () => setShowTrasladosForm(false),
                resetLines: () => setNewProducts([{
                  producto_id: "", cantidad: "", bodega_origen: "", bodega_destino: "", observaciones: ""
                }]),
              })
            }
            className="space-y-8"
          >
            <div className="space-y-6">
              {newProducts.map((product, index) => (
                <div key={index} className="bg-white/90 dark:!bg-slate-900/90 backdrop-blur-md rounded-2xl p-6 border border-slate-200/50 dark:!border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white text-sm font-bold">{index + 1}</span>
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-800 dark:!text-slate-100">Traslado {index + 1}</h4>
                        <p className="text-xs text-slate-500">Configuración de traslado</p>
                      </div>
                    </div>

                    {newProducts.length > 1 && (
                      <button type="button" onClick={() => removeLine(index)} className="group p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 transition-all duration-200 hover:scale-110">
                        <XCircleIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                      </button>
                    )}
                  </div>

                  {/* Identificación y Ubicaciones */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                      <h5 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Identificación y Ubicaciones</h5>

                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Bodega Origen */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">📤 Bodega Origen <span className="text-rose-400">*</span></label>
                        <div className="relative">
                          <select
                            required
                            value={product.bodega_origen ?? ""}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : "";
                              updateLine(index, "bodega_origen", val);
                              updateLine(index, "producto_id", "");
                            }}
                            className="w-full px-4 py-3 bg-white dark:!bg-slate-800 border border-slate-300 dark:!border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md appearance-none"
                          >
                            <option value="">Seleccionar origen...</option>
                            {isLoadingBodegas ? (
                              <option disabled>⏳ Cargando bodegas...</option>
                            ) : (
                              bodegas.map(b => (
                                <option key={b.id} value={b.id}>🏪 {b.nombre}</option>
                              ))
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Bodega Destino */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">📥 Bodega Destino <span className="text-rose-400">*</span></label>
                        <div className="relative">
                          <select
                            required
                            value={product.bodega_destino ?? ""}
                            onChange={(e) => updateLine(index, "bodega_destino", e.target.value ? Number(e.target.value) : "")}
                            className="w-full px-4 py-3 bg-white dark:!bg-slate-800 border border-slate-300 dark:!border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md appearance-none"
                          >
                            <option value="">Seleccionar destino...</option>
                            {isLoadingBodegas ? (
                              <option disabled>⏳ Cargando bodegas...</option>
                            ) : (
                              bodegas
                                .filter(b => Number(b.sucursal_id ?? b.id_sucursal ?? b.sucursal) === Number(sucursalSel?.id))
                                .map(bodega => (
                                  <option key={bodega.id} value={bodega.id} disabled={String(bodega.id) === String(product.bodega_origen)}>
                                    🏪 {bodega.nombre}
                                  </option>
                                ))
                            )}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </div>


                    </div>

                    {errorBodegas && (
                      <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-rose-600">❌ Error al cargar las bodegas</p>
                          <button
                            type="button"
                            onClick={onRetryBodegas}
                            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-600 text-sm font-medium rounded-lg transition-colors duration-200"
                          >
                            🔄 Reintentar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Líneas de productos (dinámicas) */}
                  <div className="space-y-6 border border-slate-300 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h5 className="text-base font-semibold text-slate-700 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-500 rounded-full"></div>
                        Productos del Traslado
                      </h5>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        {product.lineas?.length || 0} producto(s)
                      </span>
                    </div>

                    {product.lineas?.map((linea, lIndex) => (
                      <div key={lIndex} className="relative bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                        
                        {/* Header de la línea */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {lIndex + 1}
                            </div>
                            <span className="text-sm font-medium text-slate-600 dark:!text-slate-400">Producto {lIndex + 1}</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const nuevo = (product.lineas || []).filter((_, i) => i !== lIndex);
                              updateLine(index, "lineas", nuevo);
                            }}
                            className="group w-8 h-8 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                          >
                            <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* Código de barras */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Código de barras (opcional)
                            </label>
                            <input
                              ref={(el) => (barcodeRefs.current[lIndex] = el)}
                              type="text"
                              className="w-full px-4 py-3 bg-white dark:!bg-slate-800 border border-slate-300 dark:!border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm hover:shadow-md"
                              value={linea.codigo ?? ""}
                              placeholder="Escanea o escribe un código..."
                              onChange={(e) => onBarcodeChange(index, lIndex, e.target.value)}
                            />
                          </div>

                          {/* Cantidad */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Cantidad <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="number"
                              min={1}
                              placeholder="0"
                              className="w-full px-4 py-3 bg-white dark:!bg-slate-800 border border-slate-300 dark:!border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm hover:shadow-md"
                              value={linea.cantidad ?? ""}
                              onChange={(e) => {
                                const v = e.target.value === "" ? "" : Math.max(1, Number(e.target.value));
                                const next = (product.lineas || []).map((ln, i) =>
                                  i === lIndex ? { ...ln, cantidad: v } : ln
                                );
                                updateLine(index, "lineas", next);
                              }}
                            />
                          </div>
                        </div>

                        {/* Seleccionar Producto */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Seleccionar Producto <span className="text-rose-400">*</span>
                          </label>
                          <select
                            required
                            disabled={!product.bodega_origen}
                            value={linea.producto_id ?? ""}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : "";
                              const next = (product.lineas || []).map((ln, i) =>
                                i === lIndex ? { ...ln, producto_id: val } : ln
                              );
                              updateLine(index, "lineas", next);
                            }}
                            className="w-full px-4 py-3 bg-white dark:!bg-slate-800 border border-slate-300 dark:!border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-slate-50 disabled:text-slate-400"
                          >
                            <option value="">
                              {product.bodega_origen ? "Buscar producto..." : "Selecciona primero la bodega de origen"}
                            </option>
                            {isLoadingProductosBodega && productosPorBodegaOrigen[product.bodega_origen] === undefined ? (
                              <option disabled>Cargando productos de bodega...</option>
                            ) : (
                              <>
                                {/* Primero: Productos específicos de la bodega de origen */}
                                {productosPorBodegaOrigen[product.bodega_origen] && (
                                  <>
                                    {productosPorBodegaOrigen[product.bodega_origen].length === 0 ? (
                                      <option disabled>No hay productos en esta bodega</option>
                                    ) : (
                                      productosPorBodegaOrigen[product.bodega_origen].map(p => (
                                        <option key={p.id} value={p.id}>
                                          {p.nombre} • Disp: {p.disponible_bodega || 0}
                                        </option>
                                      ))
                                    )}
                                  </>
                                )}
                                {/* Segundo: Productos del listado general (fallback) */}
                                {(!productosPorBodegaOrigen[product.bodega_origen] || productosPorBodegaOrigen[product.bodega_origen]?.length === 0) && (
                                  <>
                                    {isLoadingProductos ? (
                                      <option disabled>Cargando productos...</option>
                                    ) : (
                                      productos
                                        .filter(p => sameBodega(p, product.bodega_origen))
                                        .map(p => (
                                          <option key={p.id} value={p.id}>
                                            {p.nombre} {p.disponible_bodega !== undefined ? `• Disp: ${p.disponible_bodega}` : typeof p.stock !== "undefined" ? ` • Stock: ${p.stock}` : ""}
                                          </option>
                                        ))
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </select>
                        </div>

                        {/* Indicador visual */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-200 to-slate-300 rounded-t-2xl">
                          {linea.producto_id && linea.cantidad && (
                            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-t-2xl transition-all duration-500"></div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Botón agregar línea */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newLineIndex = (product.lineas?.length || 0);
                          updateLine(index, "lineas", [...(product.lineas || []), { producto_id: "", cantidad: "" }]);
                          setTimeout(() => {
                            if (barcodeRefs.current[newLineIndex]) {
                              barcodeRefs.current[newLineIndex].focus();
                            }
                          }, 0);
                        }}
                        className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-2 border-dashed border-indigo-300 hover:border-indigo-400 text-indigo-600 hover:text-indigo-700 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-[1.02]"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <span>Agregar Otro Producto</span>
                      </button>
                    </div>
                  </div>

                  {/* Observaciones / Tránsito */}
                  <div className="border-t border-slate-200 dark:!border-slate-700 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                      <h5 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Configuraciones Adicionales</h5>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">📝 Observaciones</label>
                        <textarea
                          rows={4}
                          placeholder="Notas adicionales del traslado..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 shadow-sm hover:shadow-md resize-none"
                          value={product.observaciones || ""}
                          onChange={(e) => updateLine(index, "observaciones", e.target.value)}
                        />
                      </div>

                      <div className="space-y-4">
                        {index === 0 && (
                          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <input
                                  type="checkbox"
                                  id="usar-transito"
                                  className="w-5 h-5 text-amber-500 bg-white border-amber-300 rounded focus:ring-amber-400 focus:ring-2 transition-all duration-200"
                                  checked={usarTransito}
                                  onChange={(e) => setUsarTransito(e.target.checked)}
                                />
                              </div>
                              <div>
                                <label htmlFor="usar-transito" className="text-sm font-medium text-amber-800 cursor-pointer block">🚛 Utilizar Bodega de Tránsito</label>
                                <p className="text-xs text-amber-600 mt-1">Los productos pasarán por una bodega intermedia</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                          <h5 className="text-sm font-semibold text-slate-800 dark:!text-slate-100 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            Estado del Traslado
                          </h5>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-600 dark:!text-slate-400">Destino:</span>
                              {product.bodega_destino ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-lg bg-emerald-100 text-emerald-700">
                                  ✅ Seleccionado
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium rounded-lg bg-amber-100 text-amber-700">
                                  ⏳ Pendiente
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-slate-600 dark:!text-slate-400">Origen:</span>
                              {product.bodega_origen ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-lg bg-emerald-100 text-emerald-700">
                                  ✅ Seleccionado
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium rounded-lg bg-amber-100 text-amber-700">
                                  ⏳ Pendiente
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-slate-600 dark:!text-slate-400">Observación:</span>
                              {product.observaciones ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-lg bg-emerald-100 text-emerald-700">
                                  ✅ Incluida
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-500">
                                  ⚪ Sin observaciones
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="text-center py-4">
                <button
                  type="button"
                  onClick={addEmptyLine}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg transform hover:-translate-y-1"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                    <PlusIcon className="w-5 h-5" />
                  </div>
                  <span>Agregar Nuevo Producto</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200 dark:!border-slate-700/60">
              <button type="button" onClick={() => setShowTrasladosForm(false)} className="px-6 py-3 text-slate-700 font-medium rounded-xl border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={trasladoLoading}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 transition-all duration-200"
              >
                {trasladoLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creando traslado...
                  </>
                ) : (
                  <>
                    <ArrowPathRoundedSquareIcon className="w-5 h-5" />
                    Crear traslado
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}