// src/components/bodegas/sections/RecibirTraslado.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';

import { 
  ArchiveBoxArrowDownIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  XCircleIcon,
  Squares2X2Icon,
  CubeIcon
} from '@heroicons/react/24/solid';

export default function RecibirTraslado({ 
  recibirForm, 
  setRecibirForm, 
  recibirLoading, 
  onRecibirTraslado, 
  onClose,
  bodegas = [],
  productos = [],
  trasladosDisponibles = [],
  isLoadingProductos = false,
  isLoadingBodegas = false,
  isLoadingTraslados = false,
  errorTraslados = null,
  currentUserId = null,
  // Props para selección múltiple
  trasladosSeleccionados = [],
  setTrasladosSeleccionados,
  seleccionandoMultiple = false,
  setSeleccionandoMultiple,
}) {
  const [modoSeleccion, setModoSeleccion] = useState('lista');
  const [filtro, setFiltro] = useState('');
  const [mostrarDetalles, setMostrarDetalles] = useState(null);
  const formRef = useRef(null);

  // Función para formatear tiempo relativo
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

  // Función para obtener nombre de bodega
  const obtenerNombreBodega = (bodegaId) => {
    const bodega = bodegas.find(b => b.id === bodegaId);
    return bodega?.nombre || `Bodega ${bodegaId}`;
  };

  // Normalizar y filtrar traslados disponibles para recibir
  const trasladosParaRecibir = useMemo(() => {
    if (!Array.isArray(trasladosDisponibles)) return [];
    
    const textoBusqueda = (filtro || '').trim().toLowerCase();
    
    // Normalizar datos
    let lista = trasladosDisponibles
      .map((t) => ({
        id: t.id ?? t.traslado_id ?? t.trasladoId ?? null,
        bodega_origen_id: t.bodega_origen ?? t.bodega_origen_id ?? t.bodegaOrigenId ?? null,
        bodega_destino_id: t.bodega_destino ?? t.bodega_destino_id ?? t.bodegaDestinoId ?? null,
        estado: t.estado ?? t.status ?? null,
        observaciones: t.observaciones ?? t.obs ?? null,
        creado_en: t.creado_en ?? t.creadoEn ?? t.created_at ?? t.createdAt ?? null,
        enviado_en: t.enviado_en ?? t.enviadoEn ?? t.sent_at ?? null,
        creado_por_id: t.creado_por ?? t.creado_por_id ?? t.creadoPorId ?? t.user_id ?? null,
        usar_bodega_transito: t.usar_bodega_transito ?? false,
        lineas: t.lineas ?? t.productos ?? [],
        _raw: t,
      }))
      // Filtrar traslados que están en borrador o enviados (listos para recibir)
      .filter((t) => ['BOR', 'ENV'].includes(String(t.estado)))
      // Ordenar por fecha de creación/envío más reciente
      .sort((a, b) => {
        const fechaA = a.enviado_en || a.creado_en;
        const fechaB = b.enviado_en || b.creado_en;
        const timeA = fechaA ? new Date(fechaA).getTime() : 0;
        const timeB = fechaB ? new Date(fechaB).getTime() : 0;
        return timeB - timeA;
      });

    // Aplicar búsqueda de texto
    if (textoBusqueda) {
      lista = lista.filter((t) => {
        const nombreOrigen = obtenerNombreBodega(t.bodega_origen_id).toLowerCase();
        const nombreDestino = obtenerNombreBodega(t.bodega_destino_id).toLowerCase();
        const productosTexto = t.lineas.map(l => l.producto_nombre || '').join(' ').toLowerCase();
        
        return [
          String(t.id),
          String(t.bodega_origen_id),
          String(t.bodega_destino_id),
          nombreOrigen,
          nombreDestino,
          t.observaciones || '',
          productosTexto
        ]
          .map((v) => String(v).toLowerCase())
          .some((s) => s.includes(textoBusqueda));
      });
    }
    
    return lista;
  }, [trasladosDisponibles, filtro, bodegas]);

  const manejarSeleccionTraslado = (idTraslado) => {
    if (seleccionandoMultiple) {
      // Modo múltiple: agregar/quitar de array
      setTrasladosSeleccionados(prev => {
        if (prev.includes(idTraslado)) {
          return prev.filter(id => id !== idTraslado);
        } else {
          return [...prev, idTraslado];
        }
      });
    } else {
      // Modo simple: solo uno
      setRecibirForm((prev) => ({ ...(prev || {}), trasladoId: idTraslado }));
    }
  };

  const toggleSeleccionMultiple = () => {
    setSeleccionandoMultiple(!seleccionandoMultiple);
    // Limpiar selecciones al cambiar modo
    setRecibirForm({ trasladoId: null });
    setTrasladosSeleccionados([]);
  };

  const manejarEnvio = (e) => {
    e.preventDefault();
    onRecibirTraslado(e);
  };

  const obtenerEstadoVisual = (estado) => {
    const estados = {
      'BOR': {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icono: ClockIcon,
        texto: 'Borrador'
      },
      'ENV': {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icono: ClockIcon,
        texto: 'Enviado'
      },
      'REC': {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icono: CheckCircleIcon,
        texto: 'Recibido'
      }
    };
    
    return estados[estado] || {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icono: InformationCircleIcon,
      texto: estado || '—'
    };
  };

  const esReciente = (iso) => {
    if (!iso) return false;
    const horas = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
    return horas <= 24;
  };

  // Calcular totales para selección múltiple
  const totalSeleccionados = seleccionandoMultiple 
    ? trasladosSeleccionados.length 
    : (recibirForm?.trasladoId ? 1 : 0);

  return (
    <div className="bg-white dark:!bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:!border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <ArchiveBoxArrowDownIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold">Recibir Traslado</h3>
            <p className="text-blue-100 mt-1">
              Acepta y procesa traslados que han sido enviados a tu bodega
            </p>
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={manejarEnvio} className="p-6 space-y-6">
        
        {/* Selector de modo */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:!bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setModoSeleccion('manual')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              modoSeleccion === 'manual'
                ? 'bg-white text-gray-900 dark:!text-slate-100 shadow-sm'
                : 'text-gray-600 dark:!text-slate-400 hover:text-gray-900 dark:!text-slate-100'
            }`}
          >
            <DocumentTextIcon className="w-4 h-4" />
            Ingreso Manual
          </button>
          <button
            type="button"
            onClick={() => setModoSeleccion('lista')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              modoSeleccion === 'lista'
                ? 'bg-white text-gray-900 dark:!text-slate-100 shadow-sm'
                : 'text-gray-600 dark:!text-slate-400 hover:text-gray-900 dark:!text-slate-100'
            }`}
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            Seleccionar de Lista
          </button>
        </div>

        {modoSeleccion === 'manual' ? (
          /* Modo Manual */
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Ingreso Manual</h4>
                  <p className="text-sm text-blue-700">
                    Ingresa manualmente el ID del traslado que deseas recibir. 
                    Asegúrate de que el traslado haya sido enviado previamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:!text-slate-300">
                ID del Traslado *
              </label>
              <input
                type="text"
                value={recibirForm?.trasladoId || ''}
                onChange={(e) => manejarSeleccionTraslado(e.target.value)}
                placeholder="Ejemplo: 12345"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
              <p className="text-xs text-gray-500 dark:text-slate-500">
                Ingresa el número de ID del traslado que quieres recibir
              </p>
            </div>
          </div>
        ) : (
          /* Modo Lista */
          <div className="space-y-4">
            {/* Barra de búsqueda y toggle múltiple */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Buscar por ID, bodega, producto..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:!bg-slate-800 border border-gray-200 dark:!border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {filtro && (
                  <button
                    type="button"
                    onClick={() => setFiltro('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:!text-slate-400"
                  >
                    <XCircleIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={toggleSeleccionMultiple}
                className={`px-4 py-3 rounded-xl border-2 font-medium transition-all flex items-center gap-2 ${
                  seleccionandoMultiple
                    ? 'bg-purple-50 border-purple-500 text-purple-700'
                    : 'bg-white border-gray-300 text-gray-700 dark:!text-slate-300 hover:border-gray-400'
                }`}
              >
                <Squares2X2Icon className="w-5 h-5" />
                {seleccionandoMultiple ? 'Múltiple' : 'Simple'}
              </button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="text-2xl font-bold text-blue-600">{trasladosParaRecibir.length}</div>
                <div className="text-sm text-blue-600">Disponibles</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="text-2xl font-bold text-blue-600">
                  {trasladosParaRecibir.filter(t => esReciente(t.enviado_en || t.creado_en)).length}
                </div>
                <div className="text-sm text-blue-600">Recientes</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <div className="text-2xl font-bold text-purple-600">{totalSeleccionados}</div>
                <div className="text-sm text-purple-600">Seleccionados</div>
              </div>
            </div>

            {/* Lista de traslados */}
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
              {isLoadingTraslados ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-gray-300 dark:!border-slate-700 border-t-green-500 rounded-full animate-spin"></div>
                    <span className="text-gray-600 dark:!text-slate-400">Cargando traslados disponibles...</span>
                  </div>
                </div>
              ) : errorTraslados ? (
                <div className="p-8 text-center">
                  <div className="text-red-600 bg-red-50 rounded-lg p-4 border border-red-200">
                    <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2" />
                    <h4 className="font-semibold mb-2">Error al cargar traslados</h4>
                    <p className="text-sm">
                      {typeof errorTraslados === 'string' ? errorTraslados : 'Ocurrió un error inesperado.'}
                    </p>
                  </div>
                </div>
              ) : !trasladosParaRecibir.length ? (
                <div className="p-8 text-center">
                  <div className="text-gray-500 dark:text-slate-500">
                    <ArchiveBoxArrowDownIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <h4 className="font-medium mb-2">No hay traslados disponibles</h4>
                    <p className="text-sm">
                      {filtro 
                        ? "No se encontraron traslados que coincidan con tu búsqueda."
                        : "No tienes traslados pendientes de recibir en este momento."
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {trasladosParaRecibir.map((traslado) => {
                    const estadoInfo = obtenerEstadoVisual(traslado.estado);
                    const fechaEnvio = traslado.enviado_en || traslado.creado_en;
                    const reciente = esReciente(fechaEnvio);
                    const seleccionado = seleccionandoMultiple
                      ? trasladosSeleccionados.includes(traslado.id)
                      : String(recibirForm?.trasladoId) === String(traslado.id);
                    
                    const totalProductos = traslado.lineas?.length || 0;
                    const totalCantidad = traslado.lineas?.reduce((sum, l) => sum + (l.cantidad || 0), 0) || 0;
                    
                    return (
                      <div key={String(traslado.id)} className="hover:bg-gray-50 transition-colors">
                        <div
                          onClick={() => manejarSeleccionTraslado(traslado.id)}
                          className={`p-4 cursor-pointer ${
                            seleccionado ? 'bg-blue-50 border-l-4 border-green-500' : ''
                          } ${reciente ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {seleccionandoMultiple ? (
                                <input
                                  type="checkbox"
                                  checked={seleccionado}
                                  onChange={() => manejarSeleccionTraslado(traslado.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                              ) : (
                                <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                                  seleccionado ? 'bg-blue-500' : 'bg-gray-300'
                                }`} />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-gray-900 dark:!text-slate-100">
                                    Traslado #{traslado.id}
                                  </span>
                                  {reciente && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-200">
                                      Reciente
                                    </span>
                                  )}
                                  {traslado.usar_bodega_transito && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800 border border-purple-200">
                                      Con tránsito
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 dark:!text-slate-400 mt-1">
                                  <span className="font-medium">{obtenerNombreBodega(traslado.bodega_origen_id)}</span>
                                  <span className="mx-2">→</span>
                                  <span className="font-medium">{obtenerNombreBodega(traslado.bodega_destino_id)}</span>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <div className="flex items-center gap-1 text-gray-600 dark:!text-slate-400">
                                    <CubeIcon className="w-4 h-4" />
                                    <span>{totalProductos} producto{totalProductos !== 1 ? 's' : ''}</span>
                                  </div>
                                  <div className="text-gray-500 dark:text-slate-500">
                                    Total: {totalCantidad} unidad{totalCantidad !== 1 ? 'es' : ''}
                                  </div>
                                </div>
                                {traslado.observaciones && (
                                  <div className="text-sm text-gray-500 dark:text-slate-500 mt-1 truncate">
                                    {traslado.observaciones}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-4 flex-shrink-0 flex flex-col gap-2">
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${estadoInfo.color}`}>
                                <estadoInfo.icono className="w-3 h-3" />
                                {estadoInfo.texto}
                              </div>
                              {fechaEnvio && (
                                <div className="text-xs text-gray-500 dark:text-slate-500">
                                  {toRelative(fechaEnvio)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Detalles expandibles */}
                        {mostrarDetalles === traslado.id && traslado.lineas?.length > 0 && (
                          <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200 dark:!border-slate-700">
                            <div className="text-xs font-semibold text-gray-700 dark:!text-slate-300 mb-2 mt-3">
                              Productos en este traslado:
                            </div>
                            <div className="space-y-1">
                              {traslado.lineas.map((linea, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm py-1">
                                  <span className="text-gray-700 dark:!text-slate-300">{linea.producto_nombre || `Producto ${linea.producto}`}</span>
                                  <div className="flex items-center gap-3 text-gray-600 dark:!text-slate-400">
                                    <span>Cantidad: {linea.cantidad}</span>
                                    <span className="text-amber-600">Pendiente: {linea.pendiente_por_recibir || 0}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Botón para ver detalles */}
                        {traslado.lineas?.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMostrarDetalles(mostrarDetalles === traslado.id ? null : traslado.id);
                            }}
                            className="w-full px-4 py-2 text-xs text-gray-600 dark:!text-slate-400 hover:text-gray-900 dark:!text-slate-100 hover:bg-gray-100 transition-colors border-t border-gray-200 dark:!border-slate-700"
                          >
                            {mostrarDetalles === traslado.id ? '▲ Ocultar productos' : '▼ Ver productos'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resumen de selección */}
            {totalSeleccionados > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {seleccionandoMultiple
                        ? `${totalSeleccionados} traslado${totalSeleccionados !== 1 ? 's' : ''} seleccionado${totalSeleccionados !== 1 ? 's' : ''}`
                        : `Traslado #${recibirForm.trasladoId} seleccionado`
                      }
                    </span>
                  </div>
                  {seleccionandoMultiple && totalSeleccionados > 0 && (
                    <button
                      type="button"
                      onClick={() => setTrasladosSeleccionados([])}
                      className="text-xs text-blue-700 hover:text-green-900 underline"
                    >
                      Limpiar selección
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer con botones */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:!border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-gray-700 dark:!text-slate-300 font-medium bg-white border-2 border-gray-300 dark:!border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-gray-400 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
          >
            Cerrar
          </button>
          <button
            type="submit"
            disabled={recibirLoading || totalSeleccionados === 0}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {recibirLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Recibiendo...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ArchiveBoxArrowDownIcon className="w-5 h-5" />
                Recibir {seleccionandoMultiple && totalSeleccionados > 1 ? `${totalSeleccionados} traslados` : 'traslado'}
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}