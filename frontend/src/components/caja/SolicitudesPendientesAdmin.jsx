/**
 * Componente para que los administradores vean y gestionen las solicitudes de apertura de caja
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { listarSolicitudesPendientes, aprobarSolicitud, rechazarSolicitud } from '../../services/api';
import { showToast } from '../../utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

// ── Iconos ──────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

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

export default function SolicitudesPendientesAdmin() {
  const { usuario, tokenUsuario, subdominio } = useAuth();
  const authData = { usuario, tokenUsuario, subdominio };

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [procesando, setProcesando] = useState({});
  const [mostrarRechazoModal, setMostrarRechazoModal] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [observacionesRechazo, setObservacionesRechazo] = useState('');

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

      const response = await listarSolicitudesPendientes(params);

      if (response.success) {
        setSolicitudes(response.solicitudes || []);
      }
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      showToast('error', error?.message || 'Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const manejarAprobar = async (solicitudId) => {
    setProcesando(prev => ({ ...prev, [solicitudId]: 'aprobando' }));
    try {
      const params = {
        token: authData.tokenUsuario,
        usuario: authData.usuario,
        subdominio: authData.subdominio,
        solicitud_id: solicitudId,
      };

      const response = await aprobarSolicitud(params);

      if (response.success) {
        showToast('success', 'Solicitud aprobada y caja abierta exitosamente');
        // Remover la solicitud de la lista
        setSolicitudes(prev => prev.filter(s => s.id !== solicitudId));
      } else {
        showToast('error', response.message || 'Error al aprobar la solicitud');
      }
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
      showToast('error', error?.message || 'Error al aprobar la solicitud');
    } finally {
      setProcesando(prev => ({ ...prev, [solicitudId]: null }));
    }
  };

  const manejarRechazar = async () => {
    if (!solicitudSeleccionada) return;

    setProcesando(prev => ({ ...prev, [solicitudSeleccionada.id]: 'rechazando' }));
    try {
      const params = {
        token: authData.tokenUsuario,
        usuario: authData.usuario,
        subdominio: authData.subdominio,
        solicitud_id: solicitudSeleccionada.id,
        observaciones: observacionesRechazo,
      };

      const response = await rechazarSolicitud(params);

      if (response.success) {
        showToast('success', 'Solicitud rechazada');
        // Remover la solicitud de la lista
        setSolicitudes(prev => prev.filter(s => s.id !== solicitudSeleccionada.id));
        setMostrarRechazoModal(false);
        setSolicitudSeleccionada(null);
        setObservacionesRechazo('');
      } else {
        showToast('error', response.message || 'Error al rechazar la solicitud');
      }
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      showToast('error', error?.message || 'Error al rechazar la solicitud');
    } finally {
      setProcesando(prev => ({ ...prev, [solicitudSeleccionada.id]: null }));
    }
  };

  const abrirModalRechazo = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setMostrarRechazoModal(true);
  };

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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Solicitudes de Apertura de Caja</CardTitle>
              {solicitudes.length > 0 && (
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full text-sm font-medium">
                  {solicitudes.length} pendiente{solicitudes.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <ClockIcon className="mx-auto mb-2 w-12 h-12 opacity-50" />
              <p>No hay solicitudes pendientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {solicitudes.map((solicitud) => (
                <div
                  key={solicitud.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">
                          {solicitud.sucursal_nombre}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">•</span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {formatearFecha(solicitud.fecha)}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p><strong>Solicitante:</strong> {solicitud.solicitante_nombre} ({solicitud.solicitante_email})</p>
                        <p><strong>Motivo:</strong> {solicitud.motivo}</p>
                        <p className="text-xs mt-1">
                          Solicitado el: {formatearFechaHora(solicitud.creada_en)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => manejarAprobar(solicitud.id)}
                        disabled={procesando[solicitud.id] === 'aprobando'}
                        className="border-green-500 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-400"
                      >
                        {procesando[solicitud.id] === 'aprobando' ? (
                          'Procesando...'
                        ) : (
                          <>
                            <CheckIcon className="mr-1" />
                            Aprobar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => abrirModalRechazo(solicitud)}
                        disabled={procesando[solicitud.id] === 'rechazando'}
                        className="border-red-500 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400"
                      >
                        {procesando[solicitud.id] === 'rechazando' ? (
                          'Procesando...'
                        ) : (
                          <>
                            <XIcon className="mr-1" />
                            Rechazar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de rechazo */}
      {mostrarRechazoModal && solicitudSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Rechazar Solicitud</h3>
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
              <p className="text-sm"><strong>Sucursal:</strong> {solicitudSeleccionada.sucursal_nombre}</p>
              <p className="text-sm"><strong>Fecha:</strong> {formatearFecha(solicitudSeleccionada.fecha)}</p>
              <p className="text-sm"><strong>Solicitante:</strong> {solicitudSeleccionada.solicitante_nombre}</p>
              <p className="text-sm mt-2"><strong>Motivo:</strong> {solicitudSeleccionada.motivo}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Observaciones (opcional)
              </label>
              <textarea
                value={observacionesRechazo}
                onChange={(e) => setObservacionesRechazo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows="3"
                placeholder="Describe por qué rechazas esta solicitud..."
                disabled={procesando[solicitudSeleccionada.id] === 'rechazando'}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setMostrarRechazoModal(false);
                  setSolicitudSeleccionada(null);
                  setObservacionesRechazo('');
                }}
                disabled={procesando[solicitudSeleccionada.id] === 'rechazando'}
              >
                Cancelar
              </Button>
              <Button
                onClick={manejarRechazar}
                disabled={procesando[solicitudSeleccionada.id] === 'rechazando'}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {procesando[solicitudSeleccionada.id] === 'rechazando' ? 'Procesando...' : 'Rechazar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
