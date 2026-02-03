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
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <PaperAirplaneIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold">Enviar Traslado</h3>
            <p className="text-blue-100 mt-1">
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
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por ID, estado, bodega o observaciones..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
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
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FunnelIcon className="w-4 h-4" />
              Opciones de filtrado
            </h4>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soloBorradores}
                  onChange={(e) => setSoloBorradores(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex items-center gap-1">
                  <DocumentDuplicateIcon className="w-4 h-4" />
                  Solo borradores (BOR)
                </span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soloMios}
                  onChange={(e) => setSoloMios(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex items-center gap-1">
                  <UserIcon className="w-4 h-4" />
                  Solo mis traslados
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">{trasladosFiltrados.length}</div>
            <div className="text-sm text-blue-600">Traslados encontrados</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="text-2xl font-bold text-green-600">
              {trasladosFiltrados.filter(t => String(t.estado) === 'BOR').length}
            </div>
            <div className="text-sm text-green-600">Borradores disponibles</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="text-2xl font-bold text-purple-600">
              {trasladosFiltrados.filter(t => esReciente(t.creado_en)).length}
            </div>
            <div className="text-sm text-purple-600">Creados recientemente</div>
          </div>
        </div>

        {/* Tabla de traslados */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {isLoadingProductos ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
                <span className="text-gray-600">Cargando traslados...</span>
              </div>
            </div>
          ) : errorProductos ? (
            <div className="p-8 text-center">
              <div className="text-red-600 bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-semibold mb-2">Error al cargar traslados</h4>
                <p className="text-sm">
                  {typeof errorProductos === 'string' ? errorProductos : 'Ocurrió un error inesperado.'}
                </p>
              </div>
            </div>
          ) : !trasladosFiltrados.length ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">
                <DocumentDuplicateIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <h4 className="font-medium mb-2">No se encontraron traslados</h4>
                <p className="text-sm">Intenta ajustar los filtros o crear un nuevo traslado.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left">
                    <th className="px-6 py-4 font-semibold text-gray-700">ID</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Bodega Origen</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Bodega Destino</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Estado</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Observaciones</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Fecha Creación</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trasladosFiltrados.map((traslado) => {
                    const estaEnviando = enviarLoading && String(enviarForm?.trasladoId) === String(traslado.id);
                    const rowRef = trasladoMasReciente && traslado.id === trasladoMasReciente.id ? lastRowRef : null;
                    const reciente = esReciente(traslado.creado_en);
                    
                    return (
                      <tr
                        ref={rowRef}
                        key={String(traslado.id)}
                        className={`hover:bg-gray-50 transition-colors ${
                          reciente ? 'bg-amber-50/50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-gray-900">
                              {traslado.id ?? '—'}
                            </span>
                            {reciente && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-200">
                                Nuevo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {traslado.bodega_origen_id ?? '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {traslado.bodega_destino_id ?? '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${obtenerEstadoBadge(traslado.estado)}`}>
                            {traslado.estado ?? '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 max-w-xs">
                          <div className="truncate" title={traslado.observaciones}>
                            {traslado.observaciones ?? '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {traslado.creado_en ? (
                            <div className="space-y-1">
                              <div className="text-sm">
                                {new Date(traslado.creado_en).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
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
                            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
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
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-gray-700 font-medium bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
          >
            Cerrar
          </button>
        </div>
      </form>
    </div>
  );
}