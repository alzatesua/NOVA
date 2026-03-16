/**
 * Vista principal de Caja - Integra todos los componentes de control de caja
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import CajaDashboard from './caja/CajaDashboard';
import MovimientosTable from './caja/MovimientosTable';
import RegistroMovimiento from './caja/RegistroMovimiento';
import CuadreCaja from './caja/CuadreCaja';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { fetchSucursalesCaja } from '../services/api';
import { showToast } from '../utils/toast';

// ── Iconos ──────────────────────────────────────────────────────
const CalendarIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CashRegisterIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

export default function CajaView() {
  const { isAdmin, idSucursal, usuario, tokenUsuario, subdominio } = useAuth();
  const { theme } = useTheme();

  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [vista, setVista] = useState('general'); // 'general', 'movimientos', 'cuadre'
  const [refreshKey, setRefreshKey] = useState(0);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null); // null = todas (solo admin)
  const [sucursales, setSucursales] = useState([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);

  useEffect(() => {
    cargarSucursales(); // el endpoint maneja el rol internamente
  }, [isAdmin, idSucursal]);

  const cargarSucursales = async () => {
    setLoadingSucursales(true);
    try {
      const response = await fetchSucursalesCaja({
        token: tokenUsuario,
        usuario: usuario,
        subdominio: subdominio,
      });

      if (response?.success) {
        setSucursales(response.data);

        // Si no es admin, fijar su sucursal automáticamente
        if (!isAdmin && response.sucursal_asignada) {
          setSucursalSeleccionada(response.sucursal_asignada);
        }
      } else {
        showToast('Error al cargar las sucursales', 'error');
      }
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
      showToast('Error al cargar las sucursales', 'error');
    } finally {
      setLoadingSucursales(false);
    }
  };

  const handleRegistroExitoso = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Determinar el ID de sucursal a pasar a los componentes hijos
  const getSucursalFilter = () => {
    if (isAdmin) {
      // Admin: puede filtrar por sucursal seleccionada o null (todas)
      return sucursalSeleccionada;
    } else {
      // No-admin: siempre su sucursal asignada
      return idSucursal;
    }
  };

  const vistaOptions = [
    { value: 'general', label: 'Vista General' },
    { value: 'movimientos', label: 'Movimientos' },
    { value: 'cuadre', label: 'Cuadre de Caja' },
  ];

  const filtroOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'entrada', label: 'Entradas' },
    { value: 'salida', label: 'Salidas' },
  ];

  return (
    <>
      <style>{`
        .caja-root {
          font-family: 'Sora', sans-serif;
        }
      `}</style>

      <div className="caja-root" style={{ paddingTop: '16px' }}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              theme === 'dark'
                ? 'bg-slate-800 text-sky-400'
                : 'bg-sky-100 text-sky-700'
            }`}>
              <CashRegisterIcon />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Control de Caja</h1>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? 'Gestiona todos los movimientos y cuadres de caja' : 'Vista limitada a tu sucursal asignada'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de fecha */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-background">
              <CalendarIcon className={theme === 'dark' ? 'text-sky-400' : 'text-sky-600'} />
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-medium"
              />
            </div>

            {/* Selector de sucursal (solo para admin) */}
            {isAdmin && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-background">
                <select
                  value={sucursalSeleccionada || ''}
                  onChange={(e) => setSucursalSeleccionada(e.target.value ? parseInt(e.target.value) : null)}
                  className="bg-transparent border-none outline-none text-sm font-medium"
                  disabled={loadingSucursales}
                >
                  <option value="">Todas las sedes</option>
                  {sucursales.map(sucursal => (
                    <option key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector de vista */}
            <div className="flex gap-2">
              {vistaOptions.map(option => (
                <Button
                  key={option.value}
                  variant={vista === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVista(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Vista General */}
        {vista === 'general' && (
          <div className="space-y-6" key={`general-${refreshKey}`}>
            {/* Dashboard con métricas */}
            <CajaDashboard
              fecha={fecha}
              isAdmin={isAdmin}
              idSucursal={getSucursalFilter()}
              onRefresh={handleRefresh}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulario de registro - ocupa 1 columna */}
              <div className="lg:col-span-1">
                <RegistroMovimiento
                  isAdmin={isAdmin}
                  idSucursal={getSucursalFilter()}
                  onRegistroExitoso={handleRegistroExitoso}
                />
              </div>

              {/* Movimientos recientes - ocupa 2 columnas */}
              <div className="lg:col-span-2">
                <MovimientosTable
                  fecha={fecha}
                  filtroTipo={filtroTipo}
                  isAdmin={isAdmin}
                  idSucursal={getSucursalFilter()}
                  onRefresh={handleRefresh}
                />
              </div>
            </div>
          </div>
        )}

        {/* Vista de Movimientos */}
        {vista === 'movimientos' && (
          <div className="space-y-6" key={`movimientos-${refreshKey}`}>
            {/* Filtros */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-sm font-medium">Filtrar por:</span>
                  <div className="flex gap-2">
                    {filtroOptions.map(option => (
                      <Button
                        key={option.value}
                        variant={filtroTipo === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFiltroTipo(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de movimientos */}
            <MovimientosTable
              fecha={fecha}
              filtroTipo={filtroTipo}
              isAdmin={isAdmin}
              idSucursal={getSucursalFilter()}
              onRefresh={handleRefresh}
            />
          </div>
        )}

        {/* Vista de Cuadre */}
        {vista === 'cuadre' && (
          <div className="space-y-6" key={`cuadre-${refreshKey}`}>
            <CuadreCaja
              fecha={fecha}
              isAdmin={isAdmin}
              idSucursal={getSucursalFilter()}
            />
          </div>
        )}
      </div>
    </>
  );
}
