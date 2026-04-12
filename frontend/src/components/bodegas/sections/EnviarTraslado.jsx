// src/components/bodegas/sections/EnviarTraslado.jsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { 
  PaperAirplaneIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  ClockIcon,
  UserIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/solid';

export default function EnviarTraslado({
  enviarForm,
  setEnviarForm,
  enviarLoading,
  onEnviarTraslado,
  onClose,
  productosTraslados = [],
  isLoadingProductos = false,
  errorProductos = null,
  currentUserId = null,
}) {
  const [filtro, setFiltro] = useState('');
  const [soloBorradores, setSoloBorradores] = useState(true);
  const [soloMios, setSoloMios] = useState(true);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
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

  // Normalizar datos de traslados
  const trasladosNormalizados = useMemo(() => {
    const arr = Array.isArray(productosTraslados) ? productosTraslados : [];
    return arr.map((t) => ({
      id: t.id ?? t.traslado_id ?? t.trasladoId ?? null,
      bodega_origen_id: t.bodega_origen_id ?? t.bodegaOrigenId ?? null,
      bodega_destino_id: t.bodega_destino_id ?? t.bodegaDestinoId ?? null,
      estado: t.estado ?? t.status ?? null,
      observaciones: t.observaciones ?? t.obs ?? null,
      creado_en: t.creado_en ?? t.creadoEn ?? t.created_at ?? t.createdAt ?? null,
      creado_por_id: t.creado_por_id ?? t.creadoPorId ?? t.user_id ?? null,
      _raw: t,
    }));
  }, [productosTraslados]);

  // Filtrar y ordenar traslados
  const trasladosFiltrados = useMemo(() => {
    const textoBusqueda = (filtro || '').trim().toLowerCase();
    
    let lista = [...trasladosNormalizados].sort((a, b) => {
      const fechaA = a.creado_en ? new Date(a.creado_en).getTime() : 0;
      const fechaB = b.creado_en ? new Date(b.creado_en).getTime() : 0;
      return fechaB - fechaA; // Más reciente primero
    });

    // Aplicar filtros
    if (soloBorradores) {
      lista = lista.filter((t) => String(t.estado) === 'BOR');
    }
    
    if (soloMios && currentUserId != null) {
      lista = lista.filter((t) => Number(t.creado_por_id) === Number(currentUserId));
    }

    // Aplicar búsqueda de texto
    if (textoBusqueda) {
      lista = lista.filter((t) =>
        [t.id, t.estado, t.bodega_origen_id, t.bodega_destino_id, t.observaciones]
          .map((v) => (v == null ? '' : String(v).toLowerCase()))
          .some((s) => s.includes(textoBusqueda))
      );
    }
    
    return lista;
  }, [trasladosNormalizados, filtro, soloBorradores, soloMios, currentUserId]);

  // Obtener el traslado más reciente del usuario
  const trasladoMasReciente = useMemo(
    () => trasladosFiltrados.find((t) => true) || null,
    [trasladosFiltrados]
  );

  const lastRowRef = useRef(null);
  useEffect(() => {
    if (lastRowRef.current) {
      lastRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [trasladoMasReciente?.id]);

  const manejarEnvio = (idTraslado) => {
    setEnviarForm((prev) => ({ ...(prev || {}), trasladoId: idTraslado }));
    // Esperar un momento para que el estado se actualice antes de enviar el form
    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 0);
  };

  const esReciente = (iso) => {
    if (!iso) return false;
    const minutos = (Date.now() - new Date(iso).getTime()) / 60000;
    return minutos <= 30;
  };

  const obtenerEstadoBadge = (estado) => {
    const colores = {
      'BOR': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'ENV': 'bg-blue-100 text-blue-800 border-blue-200',
      'REC': 'bg-green-100 text-green-800 border-green-200',
      'CAN': 'bg-red-100 text-red-800 border-red-200',
    };
    
    return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="rounded-2xl shadow-xl border overflow-hidden" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
      {/* Header */}
      <div className="p-6 text-white" style={{ background: 'linear-gradient(to right, #2563eb, #3b82f6)' }}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <PaperAirplaneIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold">Enviar Traslado</h3>
            <p className="mt-1" style={{ color: 'rgba(219, 234, 254, 0.8)' }}>
              Selecciona un borrador de traslado y envíalo para procesamiento
            </p>
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={onEnviarTraslado} className="p-6 space-y-6">

        {/* Barra de herramientas */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">

          {/* Búsqueda */}
          <div className="relative flex-1 min-w-0">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#64748b' }} />
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por ID, estado, bodega o observaciones..."
              className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all"
              style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl transition-colors"
              style={{ backgroundColor: '#1e293b', color: '#cbd5e1' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
            >
              <FunnelIcon className="w-5 h-5" />
              Filtros
            </button>

            <button
              type="button"
              disabled={!trasladoMasReciente}
              onClick={() => trasladoMasReciente && manejarEnvio(trasladoMasReciente.id)}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ClockIcon className="w-5 h-5" />
              Enviar más reciente
            </button>
          </div>
        </div>

        {/* Panel de filtros */}
        {mostrarFiltros && (
          <div className="rounded-xl p-4 border" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
            <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#cbd5e1' }}>
              <FunnelIcon className="w-4 h-4" />
              Opciones de filtrado
            </h4>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soloBorradores}
                  onChange={(e) => setSoloBorradores(e.target.checked)}
                  className="rounded focus:ring-2"
                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <span className="text-sm flex items-center gap-1" style={{ color: '#cbd5e1' }}>
                  <DocumentDuplicateIcon className="w-4 h-4" />
                  Solo borradores (BOR)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soloMios}
                  onChange={(e) => setSoloMios(e.target.checked)}
                  className="rounded focus:ring-2"
                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <span className="text-sm flex items-center gap-1" style={{ color: '#cbd5e1' }}>
                  <UserIcon className="w-4 h-4" />
                  Solo mis traslados
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg p-4 border" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
            <div className="text-2xl font-bold" style={{ color: '#3b82f6' }}>{trasladosFiltrados.length}</div>
            <div className="text-sm" style={{ color: '#60a5fa' }}>Traslados encontrados</div>
          </div>
          <div className="rounded-lg p-4 border" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
            <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>
              {trasladosFiltrados.filter(t => String(t.estado) === 'BOR').length}
            </div>
            <div className="text-sm" style={{ color: '#4ade80' }}>Borradores disponibles</div>
          </div>
          <div className="rounded-lg p-4 border" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
            <div className="text-2xl font-bold" style={{ color: '#a855f7' }}>
              {trasladosFiltrados.filter(t => esReciente(t.creado_en)).length}
            </div>
            <div className="text-sm" style={{ color: '#c084fc' }}>Creados recientemente</div>
          </div>
        </div>

        {/* Tabla de traslados */}
        <div className="border rounded-xl overflow-hidden" style={{ borderColor: '#1e293b' }}>
          {isLoadingProductos ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-3">
                <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#334155', borderTopColor: '#6366f4' }}></div>
                <span style={{ color: '#94a3b8' }}>Cargando traslados...</span>
              </div>
            </div>
          ) : errorProductos ? (
            <div className="p-8 text-center">
              <div className="rounded-lg p-4 border" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#dc2626' }}>
                <h4 className="font-semibold mb-2">Error al cargar traslados</h4>
                <p className="text-sm">
                  {typeof errorProductos === 'string' ? errorProductos : 'Ocurrió un error inesperado.'}
                </p>
              </div>
            </div>
          ) : !trasladosFiltrados.length ? (
            <div className="p-8 text-center">
              <div style={{ color: '#64748b' }}>
                <DocumentDuplicateIcon className="w-12 h-12 mx-auto mb-3" style={{ color: '#475569' }} />
                <h4 className="font-medium mb-2">No se encontraron traslados</h4>
                <p className="text-sm">Intenta ajustar los filtros o crear un nuevo traslado.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
                  <tr className="text-left">
                    <th className="px-6 py-4 font-semibold" style={{ color: '#cbd5e1' }}>ID</th>
                    <th className="px-6 py-4 font-semibold" style={{ color: '#cbd5e1' }}>Bodega Origen</th>
                    <th className="px-6 py-4 font-semibold" style={{ color: '#cbd5e1' }}>Bodega Destino</th>
                    <th className="px-6 py-4 font-semibold" style={{ color: '#cbd5e1' }}>Estado</th>
                    <th className="px-6 py-4 font-semibold" style={{ color: '#cbd5e1' }}>Observaciones</th>
                    <th className="px-6 py-4 font-semibold" style={{ color: '#cbd5e1' }}>Fecha Creación</th>
                    <th className="px-6 py-4 font-semibold" style={{ color: '#cbd5e1' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {trasladosFiltrados.map((traslado) => {
                    const estaEnviando = enviarLoading && String(enviarForm?.trasladoId) === String(traslado.id);
                    const rowRef = trasladoMasReciente && traslado.id === trasladoMasReciente.id ? lastRowRef : null;
                    const reciente = esReciente(traslado.creado_en);

                    return (
                      <tr
                        ref={rowRef}
                        key={String(traslado.id)}
                        className={`transition-colors ${
                          reciente ? '' : ''
                        }`}
                        style={{ borderBottom: '1px solid #1e293b' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono" style={{ color: '#e2e8f0' }}>
                              {traslado.id ?? '—'}
                            </span>
                            {reciente && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                                Nuevo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4" style={{ color: '#cbd5e1' }}>
                          {traslado.bodega_origen_id ?? '—'}
                        </td>
                        <td className="px-6 py-4" style={{ color: '#cbd5e1' }}>
                          {traslado.bodega_destino_id ?? '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            traslado.estado === 'BOR' ? '' :
                            traslado.estado === 'ENV' ? '' :
                            traslado.estado === 'REC' ? '' :
                            traslado.estado === 'CAN' ? '' : ''
                          }`} style={{
                            backgroundColor: traslado.estado === 'BOR' ? 'rgba(234, 179, 8, 0.1)' :
                                           traslado.estado === 'ENV' ? 'rgba(59, 130, 246, 0.1)' :
                                           traslado.estado === 'REC' ? 'rgba(34, 197, 94, 0.1)' :
                                           traslado.estado === 'CAN' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                            color: traslado.estado === 'BOR' ? '#eab308' :
                                   traslado.estado === 'ENV' ? '#3b82f6' :
                                   traslado.estado === 'REC' ? '#22c55e' :
                                   traslado.estado === 'CAN' ? '#dc2626' : '#6b7280',
                            borderColor: traslado.estado === 'BOR' ? 'rgba(234, 179, 8, 0.2)' :
                                      traslado.estado === 'ENV' ? 'rgba(59, 130, 246, 0.2)' :
                                      traslado.estado === 'REC' ? 'rgba(34, 197, 94, 0.2)' :
                                      traslado.estado === 'CAN' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(107, 114, 128, 0.2)'
                          }}>
                            {traslado.estado ?? '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="truncate" title={traslado.observaciones} style={{ color: '#cbd5e1' }}>
                            {traslado.observaciones ?? '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {traslado.creado_en ? (
                            <div className="space-y-1">
                              <div className="text-sm" style={{ color: '#e2e8f0' }}>
                                {new Date(traslado.creado_en).toLocaleDateString()}
                              </div>
                              <div className="text-xs" style={{ color: '#64748b' }}>
                                {toRelative(traslado.creado_en)}
                              </div>
                            </div>
                          ) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          {String(traslado.estado) === 'BOR' ? (
                            <button
                              type="button"
                              onClick={() => manejarEnvio(traslado.id)}
                              disabled={enviarLoading}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              {estaEnviando ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <PaperAirplaneIcon className="w-4 h-4" />
                                  Enviar
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-xs px-3 py-1 rounded-full" style={{ color: '#64748b', backgroundColor: '#1e293b' }}>
                              No disponible
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="flex justify-end gap-3 pt-6 border-t" style={{ borderColor: '#1e293b' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 font-medium bg-white border-2 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
            style={{ color: '#cbd5e1', borderColor: '#334155', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = '#334155'; e.currentTarget.style.borderColor = '#475569';}}
            onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#334155';}}
          >
            Cerrar
          </button>
        </div>
      </form>
    </div>
  );
}