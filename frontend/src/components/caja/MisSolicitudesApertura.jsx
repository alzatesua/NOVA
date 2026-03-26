/**
 * Componente para que los usuarios vean el estado de sus solicitudes de apertura de caja
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { listarMisSolicitudes } from '../../services/api';
import { showToast } from '../../utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

// ── Iconos ──────────────────────────────────────────────────────
const RefreshIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ClockIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function MisSolicitudesApertura() {
  const { usuario, tokenUsuario, subdominio } = useAuth();
  const authData = { usuario, tokenUsuario, subdominio };

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todas'); // todas, pendiente, aprobada, rechazada

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const params = {
        token: authData.tokenUsuario,
        usuario: authData.usuario,
        subdominio: authData.subdominio,
      };

      const response = await listarMisSolicitudes(params);

      if (response.success) {
        setSolicitudes(response.solicitudes || []);
      }
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      showToast('error', error?.message || 'Error al cargar tus solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const solicitudesFiltradas = solicitudes.filter(s => {
    if (filtroEstado === 'todas') return true;
    return s.estado === filtroEstado;
  });

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearFechaHora = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleString('es-CO');
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
            <ClockIcon className="w-3 h-3" />
            Pendiente
          </span>
        );
      case 'aprobada':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            <CheckCircleIcon className="w-3 h-3" />
            Aprobada
          </span>
        );
      case 'rechazada':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
            <XCircleIcon className="w-3 h-3" />
            Rechazada
          </span>
        );
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">{estado}</span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Mis Solicitudes de Apertura</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={cargarSolicitudes}
            disabled={loading}
          >
            <RefreshIcon className="mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={filtroEstado === 'todas' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroEstado('todas')}
          >
            Todas ({solicitudes.length})
          </Button>
          <Button
            variant={filtroEstado === 'pendiente' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroEstado('pendiente')}
            className="filtroEstado === 'pendiente' ? 'bg-yellow-500' : ''"
          >
            Pendientes ({solicitudes.filter(s => s.estado === 'pendiente').length})
          </Button>
          <Button
            variant={filtroEstado === 'aprobada' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroEstado('aprobada')}
          >
            Aprobadas ({solicitudes.filter(s => s.estado === 'aprobada').length})
          </Button>
          <Button
            variant={filtroEstado === 'rechazada' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroEstado('rechazada')}
          >
            Rechazadas ({solicitudes.filter(s => s.estado === 'rechazada').length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : solicitudesFiltradas.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <ClockIcon className="mx-auto mb-2 w-12 h-12 opacity-50" />
            <p>
              {filtroEstado === 'todas'
                ? 'No tienes solicitudes registradas'
                : `No tienes solicitudes ${filtroEstado}s`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {solicitudesFiltradas.map((solicitud) => (
              <div
                key={solicitud.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">
                        {solicitud.sucursal_nombre}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">•</span>
                      <span className="text-gray-600 dark:text-gray-300">
                        {formatearFecha(solicitud.fecha)}
                      </span>
                      {getEstadoBadge(solicitud.estado)}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p><strong>Motivo:</strong> {solicitud.motivo}</p>
                      <p className="text-xs mt-1">
                        Solicitado el: {formatearFechaHora(solicitud.creada_en)}
                      </p>

                      {solicitud.estado === 'pendiente' && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                          ⏳ Tu solicitud está siendo revisada por un administrador
                        </p>
                      )}

                      {solicitud.estado === 'aprobada' && (
                        <>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                            ✅ Tu solicitud fue aprobada. La caja ya está abierta.
                          </p>
                          {solicitud.aprobado_por_nombre && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Aprobado por: {solicitud.aprobado_por_nombre}
                            </p>
                          )}
                          {solicitud.fecha_procesamiento && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Procesado el: {formatearFechaHora(solicitud.fecha_procesamiento)}
                            </p>
                          )}
                        </>
                      )}

                      {solicitud.estado === 'rechazada' && (
                        <>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                            ❌ Tu solicitud fue rechazada
                          </p>
                          {solicitud.aprobado_por_nombre && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Rechazado por: {solicitud.aprobado_por_nombre}
                            </p>
                          )}
                          {solicitud.observaciones_admin && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                              <strong>Observaciones:</strong> {solicitud.observaciones_admin}
                            </p>
                          )}
                          {solicitud.fecha_procesamiento && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Procesado el: {formatearFechaHora(solicitud.fecha_procesamiento)}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
