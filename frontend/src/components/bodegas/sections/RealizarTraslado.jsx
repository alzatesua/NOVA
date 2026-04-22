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
import '../../../styles/bodegas-responsive.css';

export default function RealizarTraslado({
  showTrasladosForm, setShowTrasladosForm,
  newProducts, setNewProducts,
  usarTransito, setUsarTransito,
  onRealizarTraslado, trasladoLoading,
  bodegas, isLoadingBodegas,
  bodegasTodas = [],  // ✅ TODAS las bodegas de la sucursal (para origen)
  bodegasOtrasSucursales = [],  // ✅ Bodegas de OTRAS sucursales (para destino)
  productos, isLoadingProductos,
  errorBodegas, onRetryBodegas,
  sucursalSel,
  // PROPS para recibir traslados (OPCIONALES)
  trasladosDisponibles = [],
  isLoadingTraslados = false,
  onCargarTraslados = null,
  onRecibirTraslado = null,
  // NUEVA PROP: productos filtrados por bodega
  onCargarProductosPorBodega = null,
}) {
  const { tokenUsuario, subdominio } = useAuth();
  const usuario = typeof localStorage !== 'undefined' ? localStorage.getItem('usuario') : null;

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
    <div className="rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border shadow-xl w-full" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-5 lg:mb-6">
        <div className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl" style={{
          width: 'clamp(2.5rem, 6vw, 3.5rem)',
          height: 'clamp(2.5rem, 6vw, 3.5rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <ArrowPathRoundedSquareIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg md:text-xl font-bold leading-tight" style={{ color: '#e2e8f0', marginTop: '20px' }}>
            {mostrarOpcionRecibir ? 'Gestión de Traslados' : 'Realizar Traslado'}
          </h3>
          <p className="text-xs sm:text-sm line-clamp-2" style={{ color: '#94a3b8' }}>
            {mostrarOpcionRecibir
              ? 'Crea nuevos traslados entre bodegas o recibe traslados pendientes'
              : 'Transfiere productos entre bodegas con control de stock'
            }
          </p>
        </div>
      </div>

      {!showTrasladosForm ? (
        <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
          {mostrarOpcionRecibir ? (
            // Selector de modo responsive (crear o recibir)
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-full">
              {/* Opción: Crear Traslado */}
              <button
                onClick={() => {
                  setModo('crear');
                  setShowTrasladosForm(true);
                }}
                className="group relative overflow-hidden rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8 border-2 hover:shadow-xl hover:-translate-y-1 text-left transition-all duration-300 touch-target hover:border-slate-600 active:scale-[0.98]"
                style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl"></div>
                <div className="relative">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <ArrowPathRoundedSquareIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2" style={{ color: '#e2e8f0' }}>
                    Crear Nuevo Traslado
                  </h4>
                  <p className="text-xs sm:text-sm" style={{ color: '#94a3b8' }}>
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
                className="group relative overflow-hidden rounded-2xl p-4 sm:p-6 md:p-8 border-2 hover:shadow-xl hover:-translate-y-1 text-left transition-all duration-300 touch-target hover:border-slate-600"
                style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl"></div>
                <div className="relative">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <ArchiveBoxArrowDownIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2" style={{ color: '#e2e8f0' }}>
                    Recibir Traslados
                  </h4>
                  <p className="text-xs sm:text-sm" style={{ color: '#94a3b8' }}>
                    Acepta traslados pendientes enviados a esta bodega
                  </p>
                  {trasladosDisponibles.length > 0 && (
                    <div className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>
                      <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      {trasladosDisponibles.length} pendiente{trasladosDisponibles.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </button>
            </div>
          ) : (
            // Botón simple para crear traslado (sin opción de recibir)
            <div className="text-center py-8 sm:py-12">
              <div className="rounded-2xl p-4 sm:p-6 md:p-8 border max-w-md mx-auto" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
                <ArrowPathRoundedSquareIcon className="w-12 h-12 sm:w-14 sm:w-16 sm:h-14 sm:h-16 mx-auto mb-3 sm:mb-4" style={{ color: '#f97316' }} />
                <h4 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2" style={{ color: '#e2e8f0' }}>Configurar Nuevo Traslado</h4>
                <p className="text-xs sm:text-sm mb-4 sm:mb-6" style={{ color: '#94a3b8' }}>Selecciona productos y configura el traslado entre bodegas</p>
                <button
                  onClick={() => {
                    setModo('crear');
                    setShowTrasladosForm(true);
                  }}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 touch-target"
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
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h4 className="text-base sm:text-lg font-semibold" style={{ color: '#e2e8f0' }}>
              Traslados Pendientes
            </h4>
            <button
              onClick={() => setShowTrasladosForm(false)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors touch-target hover:text-slate-200"
              style={{ color: '#94a3b8' }}
            >
              ← Volver
            </button>
          </div>

          {isLoadingTraslados ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 rounded-full animate-spin mx-auto mb-3 sm:mb-4" style={{ borderColor: '#334155', borderTopColor: '#22c55e' }}></div>
              <p className="text-xs sm:text-sm" style={{ color: '#94a3b8' }}>Cargando traslados disponibles...</p>
            </div>
          ) : trasladosDisponibles.length === 0 ? (
            <div className="text-center py-8 sm:py-12 rounded-2xl border-2 border-dashed" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
              <ArchiveBoxArrowDownIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" style={{ color: '#475569' }} />
              <h5 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2" style={{ color: '#cbd5e1' }}>
                No hay traslados pendientes
              </h5>
              <p className="text-xs sm:text-sm mb-3 sm:mb-4" style={{ color: '#64748b' }}>
                No tienes traslados enviados esperando ser recibidos
              </p>
              <button
                onClick={() => setShowTrasladosForm(false)}
                className="px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors touch-target hover:bg-slate-700"
                style={{ backgroundColor: '#334155', color: '#cbd5e1' }}
              >
                Volver al inicio
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {trasladosDisponibles.map((traslado) => {
                const seleccionado = trasladoSeleccionado?.id === traslado.id;

                return (
                  <div
                    key={traslado.id}
                    onClick={() => setTrasladoSeleccionado(traslado)}
                    className={`relative p-3 sm:p-4 md:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 touch-target ${
                      seleccionado ? 'shadow-lg' : 'hover:shadow-md hover:border-slate-600'
                    }`}
                    style={{
                      backgroundColor: seleccionado ? 'rgba(34, 197, 94, 0.1)' : '#1e293b',
                      borderColor: seleccionado ? '#22c55e' : '#334155'
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
                            seleccionado ? 'bg-green-500' : 'bg-slate-500'
                          }`}></div>
                          <h5 className="text-sm sm:text-base lg:text-lg font-semibold truncate" style={{ color: '#e2e8f0' }}>
                            #{traslado.id}
                          </h5>
                          <span className="px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs font-medium rounded-full flex-shrink-0" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>
                            {traslado.estado}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-[10px] sm:text-xs md:text-sm mb-2 sm:mb-3">
                          <div>
                            <span style={{ color: '#64748b' }}>Origen:</span>
                            <span className="ml-1 sm:ml-2 font-medium" style={{ color: '#cbd5e1' }}>
                              {traslado.bodega_origen ?? traslado.bodega_origen_id}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: '#64748b' }}>Destino:</span>
                            <span className="ml-1 sm:ml-2 font-medium" style={{ color: '#cbd5e1' }}>
                              {traslado.bodega_destino ?? traslado.bodega_destino_id}
                            </span>
                          </div>
                        </div>

                        {traslado.observaciones && (
                          <p className="text-[10px] sm:text-xs italic truncate" style={{ color: '#94a3b8' }}>
                            "{traslado.observaciones}"
                          </p>
                        )}

                        <div className="flex items-center gap-2 sm:gap-4 mt-1.5 sm:mt-3 text-[9px] sm:text-xs" style={{ color: '#64748b' }}>
                          <span>Creado {toRelative(traslado.creado_en)}</span>
                          {traslado.enviado_en && (
                            <span>• Enviado {toRelative(traslado.enviado_en)}</span>
                          )}
                        </div>
                      </div>

                      {seleccionado && (
                        <CheckCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" style={{ color: '#22c55e' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Botones de acción responsive */}
          {trasladosDisponibles.length > 0 && (
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4 pt-4 sm:pt-6 border-t" style={{ borderColor: '#1e293b' }}>
              <button
                onClick={() => setShowTrasladosForm(false)}
                className="px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium rounded-xl border-2 transition-all touch-target hover:bg-slate-700 hover:border-slate-600"
                style={{ color: '#cbd5e1', borderColor: '#334155', backgroundColor: 'transparent' }}
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
                className="px-5 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all touch-target"
              >
                {trasladoLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Recibiendo...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <ArchiveBoxArrowDownIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Recibir Traslado</span>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        // ========================================
        // MODO: CREAR TRASLADO (responsive)
        // ========================================
        <div className="space-y-6 sm:space-y-8">
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
            className="space-y-6 sm:space-y-8"
          >
            <div className="space-y-4 sm:space-y-6">
              {newProducts.map((product, index) => (
                <div key={index} className="rounded-2xl p-3 sm:p-4 md:p-6 border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white text-xs sm:text-sm font-bold">{index + 1}</span>
                        </div>
                        <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-400 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base md:text-lg font-bold" style={{ color: '#e2e8f0' }}>Traslado {index + 1}</h4>
                        <p className="text-[10px] sm:text-xs" style={{ color: '#64748b' }}>Configuración de traslado</p>
                      </div>
                    </div>

                    {newProducts.length > 1 && (
                      <button type="button" onClick={() => removeLine(index)} className="group p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:scale-110 transition-all duration-200 touch-target hover:bg-rose-500/20" style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}>
                        <XCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" />
                      </button>
                    )}
                  </div>

                  {/* Identificación y Ubicaciones responsive */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                      <h5 className="text-xs sm:text-sm font-semibold uppercase tracking-wider" style={{ color: '#cbd5e1' }}>Identificación y Ubicaciones</h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {/* Bodega Origen */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: '#cbd5e1' }}>📤 Origen <span style={{ color: '#f43f5e' }}>*</span></label>
                        <div className="relative">
                          <select
                            required
                            value={product.bodega_origen ?? ""}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : "";
                              updateLine(index, "bodega_origen", val);
                              updateLine(index, "producto_id", "");
                            }}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md appearance-none touch-target"
                            style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }}
                          >
                            <option value="">Seleccionar origen...</option>
                            {isLoadingBodegas ? (
                              <option disabled>⏳ Cargando...</option>
                            ) : (
                              bodegasTodas.length > 0 ? (
                                bodegasTodas
                                  .filter(b => Number(b.sucursal_id ?? b.id_sucursal ?? b.sucursal) === Number(sucursalSel?.id))
                                  .map(b => (
                                    <option key={b.id} value={b.id}>🏪 {b.nombre}</option>
                                  ))
                              ) : (
                                bodegas
                                  .filter(b => Number(b.sucursal_id ?? b.id_sucursal ?? b.sucursal) === Number(sucursalSel?.id))
                                  .map(b => (
                                    <option key={b.id} value={b.id}>🏪 {b.nombre}</option>
                                  ))
                              )
                            )}
                          </select>
                        </div>
                        <p className="text-[9px] sm:text-xs mt-1" style={{ color: '#64748b' }}>Todas las bodegas de {sucursalSel?.nombre}</p>
                      </div>

                      {/* Bodega Destino */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: '#cbd5e1' }}>📥 Destino (otra sucursal) <span style={{ color: '#f43f5e' }}>*</span></label>
                        <div className="relative">
                          <select
                            required
                            value={product.bodega_destino ?? ""}
                            onChange={(e) => updateLine(index, "bodega_destino", e.target.value ? Number(e.target.value) : "")}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md appearance-none touch-target"
                            style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }}
                          >
                            <option value="">Seleccionar destino...</option>
                            {isLoadingBodegas ? (
                              <option disabled>⏳ Cargando...</option>
                            ) : bodegasOtrasSucursales.length === 0 ? (
                              <option disabled>No hay bodegas disponibles</option>
                            ) : (
                              bodegasOtrasSucursales.map(bodega => {
                                const nombreSucursal = bodega.sucursal?.nombre || bodega.sucursal_nombre || `Sucursal ${bodega.sucursal_id || bodega.id_sucursal}`;
                                return (
                                  <option key={bodega.id} value={bodega.id}>
                                    🏪 {bodega.nombre} <span style={{fontSize: '10px', color: '#94a3b8'}}> - {nombreSucursal}</span>
                                  </option>
                                );
                              })
                            )}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                        <p className="text-[9px] sm:text-xs mt-1" style={{ color: '#64748b' }}>({bodegasOtrasSucursales.length} disponibles)</p>
                      </div>
                    </div>

                    {errorBodegas && (
                      <div className="mt-3 sm:mt-4 p-2 sm:p-3 rounded-lg" style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] sm:text-xs" style={{ color: '#f43f5e' }}>❌ Error al cargar las bodegas</p>
                          <button
                            type="button"
                            onClick={onRetryBodegas}
                            className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded-lg transition-colors duration-200 touch-target hover:bg-rose-500/30"
                            style={{ backgroundColor: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e' }}
                          >
                            🔄 Reintentar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Líneas de productos (dinámicas) */}
                  <div className="space-y-4 sm:space-y-6 rounded-xl p-3 sm:p-4 md:p-6 shadow-sm" style={{ border: '1px solid #334155' }}>
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm sm:text-base font-semibold flex items-center gap-2" style={{ color: '#cbd5e1' }}>
                        <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-blue-600 to-blue-500 rounded-full"></div>
                        Productos del Traslado
                      </h5>
                      <span className="text-[10px] sm:text-xs px-2 py-1 rounded-full" style={{ color: '#94a3b8', backgroundColor: '#1e293b' }}>
                        {product.lineas?.length || 0} prod(s)
                      </span>
                    </div>

                    {product.lineas?.map((linea, lIndex) => (
                      <div key={lIndex} className="relative rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-200" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>

                        {/* Header de la línea */}
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0">
                              {lIndex + 1}
                            </div>
                            <span className="text-[10px] sm:text-xs font-medium" style={{ color: '#94a3b8' }}>Producto {lIndex + 1}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const nuevo = (product.lineas || []).filter((_, i) => i !== lIndex);
                              updateLine(index, "lineas", nuevo);
                            }}
                            className="group w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 touch-target hover:bg-rose-500/20"
                            style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}
                          >
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                          {/* Código de barras */}
                          <div className="mb-3 lg:mb-0">
                            <label className="block text-[10px] sm:text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: '#cbd5e1' }}>
                              Código de barras (opcional)
                            </label>
                            <input
                              ref={(el) => (barcodeRefs.current[lIndex] = el)}
                              type="text"
                              className="w-full px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md touch-target"
                              style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
                              value={linea.codigo ?? ""}
                              placeholder="Escanea o escribe..."
                              onChange={(e) => onBarcodeChange(index, lIndex, e.target.value)}
                            />
                          </div>

                          {/* Cantidad */}
                          <div>
                            <label className="block text-[10px] sm:text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: '#cbd5e1' }}>
                              Cantidad <span style={{ color: '#f43f5e' }}>*</span>
                            </label>
                            <input
                              type="number"
                              min={1}
                              placeholder="0"
                              className="w-full px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md touch-target"
                              style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
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
                          <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>
                            Seleccionar Producto <span style={{ color: '#f43f5e' }}>*</span>
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
                            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 appearance-none"
                            style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
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
                        <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl" style={{ background: 'linear-gradient(to right, #334155, #475569)' }}>
                          {linea.producto_id && linea.cantidad && (
                            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-t-2xl transition-all duration-500"></div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Botón agregar línea */}
                    <div className="pt-1.5 sm:pt-2">
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
                        className="group w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm font-medium rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-[1.02] touch-target hover:bg-indigo-500/20 hover:border-indigo-600 hover:text-indigo-500"
                        style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '2px dashed #4f46e5', color: '#6366f1' }}
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                          <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <span className="hidden xs:inline">Agregar Otro Producto</span>
                        <span className="xs:hidden">Agregar Producto</span>
                      </button>
                    </div>
                  </div>

                  {/* Observaciones / Tránsito responsive */}
                  <div className="border-t pt-4 sm:pt-6" style={{ borderColor: '#1e293b' }}>
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                      <h5 className="text-[10px] sm:text-xs sm:text-sm font-semibold uppercase tracking-wider" style={{ color: '#cbd5e1' }}>Configuraciones Adicionales</h5>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-[10px] sm:text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: '#cbd5e1' }}>📝 Observaciones</label>
                        <textarea
                          rows={3}
                          placeholder="Notas adicionales..."
                          className="w-full px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md resize-none touch-target"
                          style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
                          value={product.observaciones || ""}
                          onChange={(e) => updateLine(index, "observaciones", e.target.value)}
                        />
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        {index === 0 && (
                          <div className="p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl" style={{ background: 'linear-gradient(to right, rgba(245, 158, 11, 0.1), rgba(249, 115, 22, 0.1))', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <input
                                  type="checkbox"
                                  id="usar-transito"
                                  className="w-4 h-4 sm:w-5 sm:h-5 rounded focus:ring-2 transition-all duration-200"
                                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                                  checked={usarTransito}
                                  onChange={(e) => setUsarTransito(e.target.checked)}
                                />
                              </div>
                              <div>
                                <label htmlFor="usar-transito" className="text-[10px] sm:text-xs sm:text-sm font-medium cursor-pointer block" style={{ color: '#d97706' }}>🚛 Utilizar Bodega de Tránsito</label>
                                <p className="text-[9px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: '#b45309' }}>Los productos pasarán por una bodega intermedia</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl shadow-sm" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                          <h5 className="text-[10px] sm:text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2" style={{ color: '#e2e8f0' }}>
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-500 rounded-full"></span>
                            Estado del Traslado
                          </h5>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-[9px] sm:text-xs">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span style={{ color: '#94a3b8' }}>Destino:</span>
                              {product.bodega_destino ? (
                                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-xs font-medium rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                  ✅ Sí
                                </span>
                              ) : (
                                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-xs font-medium rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                                  ⏳ No
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span style={{ color: '#94a3b8' }}>Origen:</span>
                              {product.bodega_origen ? (
                                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-xs font-medium rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                  ✅ Sí
                                </span>
                              ) : (
                                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-xs font-medium rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                                  ⏳ No
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span style={{ color: '#94a3b8' }}>Obs:</span>
                              {product.observaciones ? (
                                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-xs font-medium rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                  ✅ Sí
                                </span>
                              ) : (
                                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-xs font-medium rounded-lg" style={{ backgroundColor: 'rgba(51, 65, 85, 0.5)', color: '#64748b' }}>
                                  ⚪ No
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

              <div className="text-center py-3 sm:py-4">
                <button
                  type="button"
                  onClick={addEmptyLine}
                  className="group inline-flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg transform hover:-translate-y-1 touch-target"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                    <PlusIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  </div>
                  <span>Agregar Nuevo Producto</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4 pt-4 sm:pt-6 border-t" style={{ borderColor: '#1e293b' }}>
              <button type="button" onClick={() => setShowTrasladosForm(false)} className="px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium rounded-xl border-2 transition-all duration-200 touch-target hover:bg-slate-700 hover:border-slate-600" style={{ color: '#cbd5e1', borderColor: '#334155', backgroundColor: 'transparent' }}>
                Cancelar
              </button>
              <button
                type="submit"
                disabled={trasladoLoading}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-5 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 transition-all duration-200 touch-target"
              >
                {trasladoLoading ? (
                  <>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creando traslado...</span>
                  </>
                ) : (
                  <>
                    <ArrowPathRoundedSquareIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Crear traslado</span>
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