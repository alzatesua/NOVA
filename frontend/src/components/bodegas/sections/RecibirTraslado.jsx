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
    <div className="rounded-2xl shadow-xl border overflow-hidden" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
      {/* Header */}
      <div className="p-6 text-white" style={{ background: 'linear-gradient(to right, #2563eb, #3b82f6)' }}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <ArchiveBoxArrowDownIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold">Recibir Traslado</h3>
            <p className="mt-1" style={{ color: 'rgba(219, 234, 254, 0.8)' }}>
              Acepta y procesa traslados que han sido enviados a tu bodega
            </p>
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={manejarEnvio} className="p-6 space-y-6">

        {/* Selector de modo */}
        <div className="flex gap-2 p-1 rounded-xl" style={{ backgroundColor: '#1e293b' }}>
          <button
            type="button"
            onClick={() => setModoSeleccion('manual')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              modoSeleccion === 'manual'
                ? 'shadow-sm'
                : ''
            }`}
            style={{
              backgroundColor: modoSeleccion === 'manual' ? '#0f172a' : 'transparent',
              color: modoSeleccion === 'manual' ? '#e2e8f0' : '#94a3b8'
            }}
            onMouseEnter={(e) => {if(modoSeleccion !== 'manual') e.currentTarget.style.backgroundColor = '#334155';}}
            onMouseLeave={(e) => {if(modoSeleccion !== 'manual') e.currentTarget.style.backgroundColor = 'transparent';}}
          >
            <DocumentTextIcon className="w-4 h-4" />
            Ingreso Manual
          </button>
          <button
            type="button"
            onClick={() => setModoSeleccion('lista')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              modoSeleccion === 'lista'
                ? 'shadow-sm'
                : ''
            }`}
            style={{
              backgroundColor: modoSeleccion === 'lista' ? '#0f172a' : 'transparent',
              color: modoSeleccion === 'lista' ? '#e2e8f0' : '#94a3b8'
            }}
            onMouseEnter={(e) => {if(modoSeleccion !== 'lista') e.currentTarget.style.backgroundColor = '#334155';}}
            onMouseLeave={(e) => {if(modoSeleccion !== 'lista') e.currentTarget.style.backgroundColor = 'transparent';}}
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            Seleccionar de Lista
          </button>
        </div>

        {modoSeleccion === 'manual' ? (
          /* Modo Manual */
          <div className="space-y-4">
            <div className="rounded-xl p-4 border" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="w-5 h-5 mt-0.5" style={{ color: '#3b82f6' }} />
                <div>
                  <h4 className="font-semibold mb-1" style={{ color: '#1e40af' }}>Ingreso Manual</h4>
                  <p className="text-sm" style={{ color: '#1d4ed8' }}>
                    Ingresa manualmente el ID del traslado que deseas recibir.
                    Asegúrate de que el traslado haya sido enviado previamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold" style={{ color: '#cbd5e1' }}>
                ID del Traslado *
              </label>
              <input
                type="text"
                value={recibirForm?.trasladoId || ''}
                onChange={(e) => manejarSeleccionTraslado(e.target.value)}
                placeholder="Ejemplo: 12345"
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{ backgroundColor: '#1e293b', border: '2px solid #334155', color: '#e2e8f0' }}
                required
              />
              <p className="text-xs" style={{ color: '#64748b' }}>
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
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#64748b' }} />
                <input
                  type="text"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Buscar por ID, bodega, producto..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all"
                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
                />
                {filtro && (
                  <button
                    type="button"
                    onClick={() => setFiltro('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    style={{ color: '#64748b' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#94a3b8'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                  >
                    <XCircleIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={toggleSeleccionMultiple}
                className="px-4 py-3 rounded-xl border-2 font-medium transition-all flex items-center gap-2"
                style={{
                  backgroundColor: seleccionandoMultiple ? 'rgba(168, 85, 247, 0.1)' : '#0f172a',
                  borderColor: seleccionandoMultiple ? '#a855f7' : '#334155',
                  color: seleccionandoMultiple ? '#a855f7' : '#cbd5e1'
                }}
                onMouseEnter={(e) => {
                  if(!seleccionandoMultiple) {
                    e.currentTarget.style.backgroundColor = '#1e293b';
                    e.currentTarget.style.borderColor = '#475569';
                  }
                }}
                onMouseLeave={(e) => {
                  if(!seleccionandoMultiple) {
                    e.currentTarget.style.backgroundColor = '#0f172a';
                    e.currentTarget.style.borderColor = '#334155';
                  }
                }}
              >
                <Squares2X2Icon className="w-5 h-5" />
                {seleccionandoMultiple ? 'Múltiple' : 'Simple'}
              </button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg p-4 border" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                <div className="text-2xl font-bold" style={{ color: '#3b82f6' }}>{trasladosParaRecibir.length}</div>
                <div className="text-sm" style={{ color: '#60a5fa' }}>Disponibles</div>
              </div>
              <div className="rounded-lg p-4 border" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                <div className="text-2xl font-bold" style={{ color: '#3b82f6' }}>
                  {trasladosParaRecibir.filter(t => esReciente(t.enviado_en || t.creado_en)).length}
                </div>
                <div className="text-sm" style={{ color: '#60a5fa' }}>Recientes</div>
              </div>
              <div className="rounded-lg p-4 border" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
                <div className="text-2xl font-bold" style={{ color: '#a855f7' }}>{totalSeleccionados}</div>
                <div className="text-sm" style={{ color: '#c084fc' }}>Seleccionados</div>
              </div>
            </div>

            {/* Lista de traslados */}
            <div className="border rounded-xl overflow-hidden max-h-[500px] overflow-y-auto" style={{ borderColor: '#1e293b' }}>
              {isLoadingTraslados ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center gap-3">
                    <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#334155', borderTopColor: '#22c55e' }}></div>
                    <span style={{ color: '#94a3b8' }}>Cargando traslados disponibles...</span>
                  </div>
                </div>
              ) : errorTraslados ? (
                <div className="p-8 text-center">
                  <div className="rounded-lg p-4 border" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#dc2626' }}>
                    <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2" />
                    <h4 className="font-semibold mb-2">Error al cargar traslados</h4>
                    <p className="text-sm">
                      {typeof errorTraslados === 'string' ? errorTraslados : 'Ocurrió un error inesperado.'}
                    </p>
                  </div>
                </div>
              ) : !trasladosParaRecibir.length ? (
                <div className="p-8 text-center">
                  <div style={{ color: '#64748b' }}>
                    <ArchiveBoxArrowDownIcon className="w-12 h-12 mx-auto mb-3" style={{ color: '#475569' }} />
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
                <div className="divide-y" style={{ borderColor: '#1e293b' }}>
                  {trasladosParaRecibir.map((traslado) => {
                    const estadoInfo = obtenerEstadoVisual(traslado.estado);
                    const fechaEnvio = traslado.enviado_en || traslado.creado_en;
                    const reciente = esReciente(fechaEnvio);
                    const seleccionado = seleccionandoMultiple
                      ? trasladosSeleccionados.includes(traslado.id)
                      : String(recibirForm?.trasladoId) === String(traslado.id);

                    const totalProductos = traslado.lineas?.length || 0;
                    const totalCantidad = traslado.lineas?.reduce((sum, l) => sum + (l.cantidad || 0), 0) || 0;

                    const getEstadoStyle = (estado) => {
                      const styles = {
                        'BOR': { backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', borderColor: 'rgba(234, 179, 8, 0.2)' },
                        'ENV': { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.2)' },
                        'REC': { backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.2)' }
                      };
                      return styles[estado] || { backgroundColor: 'rgba(107, 114, 128, 0.1)', color: '#6b7280', borderColor: 'rgba(107, 114, 128, 0.2)' };
                    };

                    const estadoStyle = getEstadoStyle(traslado.estado);

                    return (
                      <div
                        key={String(traslado.id)}
                        className="transition-colors"
                        style={{ borderBottom: '1px solid #1e293b' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div
                          onClick={() => manejarSeleccionTraslado(traslado.id)}
                          className={`p-4 cursor-pointer ${seleccionado ? 'border-l-4' : ''} ${reciente ? '' : ''}`}
                          style={{
                            borderLeftColor: seleccionado ? '#22c55e' : 'transparent',
                            backgroundColor: seleccionado ? 'rgba(59, 130, 246, 0.1)' : (reciente ? 'rgba(59, 130, 246, 0.05)' : 'transparent')
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {seleccionandoMultiple ? (
                                <input
                                  type="checkbox"
                                  checked={seleccionado}
                                  onChange={() => manejarSeleccionTraslado(traslado.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1.5 w-4 h-4 rounded focus:ring-2"
                                  style={{ backgroundColor: '#1e293b', border: '2px solid #334155' }}
                                />
                              ) : (
                                <div
                                  className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0`}
                                  style={{ backgroundColor: seleccionado ? '#3b82f6' : '#475569' }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold" style={{ color: '#e2e8f0' }}>
                                    Traslado #{traslado.id}
                                  </span>
                                  {reciente && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                                      Reciente
                                    </span>
                                  )}
                                  {traslado.usar_bodega_transito && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
                                      Con tránsito
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm mt-1" style={{ color: '#cbd5e1' }}>
                                  <span className="font-medium">{obtenerNombreBodega(traslado.bodega_origen_id)}</span>
                                  <span className="mx-2">→</span>
                                  <span className="font-medium">{obtenerNombreBodega(traslado.bodega_destino_id)}</span>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <div className="flex items-center gap-1" style={{ color: '#cbd5e1' }}>
                                    <CubeIcon className="w-4 h-4" />
                                    <span>{totalProductos} producto{totalProductos !== 1 ? 's' : ''}</span>
                                  </div>
                                  <div style={{ color: '#94a3b8' }}>
                                    Total: {totalCantidad} unidad{totalCantidad !== 1 ? 'es' : ''}
                                  </div>
                                </div>
                                {traslado.observaciones && (
                                  <div className="text-sm mt-1 truncate" style={{ color: '#94a3b8' }}>
                                    {traslado.observaciones}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-4 flex-shrink-0 flex flex-col gap-2">
                              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border" style={estadoStyle}>
                                <estadoInfo.icono className="w-3 h-3" />
                                {estadoInfo.texto}
                              </div>
                              {fechaEnvio && (
                                <div className="text-xs" style={{ color: '#94a3b8' }}>
                                  {toRelative(fechaEnvio)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Detalles expandibles */}
                        {mostrarDetalles === traslado.id && traslado.lineas?.length > 0 && (
                          <div className="px-4 pb-4 border-t" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
                            <div className="text-xs font-semibold mb-2 mt-3" style={{ color: '#cbd5e1' }}>
                              Productos en este traslado:
                            </div>
                            <div className="space-y-1">
                              {traslado.lineas.map((linea, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm py-1">
                                  <span style={{ color: '#e2e8f0' }}>{linea.producto_nombre || `Producto ${linea.producto}`}</span>
                                  <div className="flex items-center gap-3" style={{ color: '#cbd5e1' }}>
                                    <span>Cantidad: {linea.cantidad}</span>
                                    <span style={{ color: '#f59e0b' }}>Pendiente: {linea.pendiente_por_recibir || 0}</span>
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
                            className="w-full px-4 py-2 text-xs transition-colors border-t"
                            style={{ color: '#94a3b8', borderColor: '#1e293b' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
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
              <div className="rounded-lg p-4 border" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5" style={{ color: '#3b82f6' }} />
                    <span className="text-sm font-medium" style={{ color: '#3b82f6' }}>
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
                      className="text-xs underline transition-colors"
                      style={{ color: '#2563eb' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#1d4ed8'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#2563eb'}
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
        <div className="flex justify-end gap-3 pt-6 border-t" style={{ borderColor: '#1e293b' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 font-medium border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
            style={{ color: '#cbd5e1', backgroundColor: 'transparent', borderColor: '#334155' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#334155'; e.currentTarget.style.borderColor = '#475569'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#334155'; }}
          >
            Cerrar
          </button>
          <button
            type="submit"
            disabled={recibirLoading || totalSeleccionados === 0}
            className="px-8 py-3 text-white font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ background: 'linear-gradient(to right, #2563eb, #3b82f6)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #16a34a, #22c55e)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #3b82f6)'}
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