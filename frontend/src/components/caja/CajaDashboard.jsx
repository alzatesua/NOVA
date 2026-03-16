/**
 * Dashboard de Caja - Muestra las métricas principales de caja
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import StatCard from '../dashboard/StatCard';
import { fetchEstadisticasCaja } from '../../services/api';
import { showToast } from '../../utils/toast';

// ── Iconos ──────────────────────────────────────────────────────
const CashIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 22, height: 22 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const InIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 22, height: 22 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
  </svg>
);

const OutIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 22, height: 22 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
  </svg>
);

export default function CajaDashboard({ fecha, isAdmin, idSucursal }) {
  const { usuario, tokenUsuario, subdominio } = useAuth();
  const authData = { usuario, tokenUsuario, subdominio };

  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState(null);

  useEffect(() => {
    console.log('🎯 CajaDashboard montado con fecha:', fecha);
    console.log('👤 Auth data:', authData);
    console.log('🔒 isAdmin:', isAdmin, 'idSucursal:', idSucursal);
    cargarEstadisticas();
  }, [fecha, isAdmin, idSucursal]);

  const cargarEstadisticas = async () => {
    console.log('🔄 Cargando estadísticas para fecha:', fecha);
    setLoading(true);
    try {
      const params = {
        token: authData.tokenUsuario,
        usuario: authData.usuario,
        subdominio: authData.subdominio,
        fecha: fecha,
      };

      // Solo agregar id_sucursal si tiene un valor válido
      if (idSucursal) {
        params.id_sucursal = idSucursal;
      }

      const response = await fetchEstadisticasCaja(params);

      console.log('📊 Respuesta estadísticas:', response);

      if (response.success) {
        console.log('✅ Datos recibidos:', response.data);
        setEstadisticas(response.data);
      } else {
        console.error('❌ Error en respuesta:', response);
      }
    } catch (error) {
      console.error('❌ Error al cargar estadísticas de caja:', error);
      showToast('Error al cargar las estadísticas de caja', 'error');
      // Set default values on error
      setEstadisticas({
        saldo_inicial: 0,
        total_entradas: 0,
        total_salidas: 0,
        saldo_actual: 0,
        total_transacciones: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '$0';
    // Convertir string a número si viene como string del backend
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Saldo Inicial"
        value={formatCurrency(estadisticas?.saldo_inicial)}
        icon={<CashIcon />}
        color="blue"
        loading={loading}
      />
      <StatCard
        title="Total Entradas"
        value={formatCurrency(estadisticas?.total_entradas)}
        icon={<InIcon />}
        color="green"
        loading={loading}
      />
      <StatCard
        title="Total Salidas"
        value={formatCurrency(estadisticas?.total_salidas)}
        icon={<OutIcon />}
        color="red"
        loading={loading}
      />
      <StatCard
        title="Saldo Actual"
        value={formatCurrency(estadisticas?.saldo_actual)}
        icon={<CashIcon />}
        color="purple"
        loading={loading}
      />
    </div>
  );
}
