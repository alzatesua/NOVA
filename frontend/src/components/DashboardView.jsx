/**
 * DashboardView - Componente principal del dashboard de analytics
 * Muestra KPIs, gráficas y métricas importantes del negocio
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  fetchKPIsGenerales,
  fetchTendenciaVentas,
  fetchTopProductos,
  fetchInventarioResumen,
  fetchComparativaPeriodos,
} from '../services/analyticsApi';
import StatCard from './dashboard/StatCard';
import TrendChart from './dashboard/TrendChart';
import TopProductsTable from './dashboard/TopProductsTable';

// Iconos SVG
const MoneyIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShoppingCartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const PackageIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const InventoryIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

export default function DashboardView() {
  const { usuario, tokenUsuario, subdominio } = useAuth();
  const authData = { usuario, tokenUsuario, subdominio };

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [tendencia, setTendencia] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [inventario, setInventario] = useState(null);
  const [comparativa, setComparativa] = useState(null);

  const [dias, setDias] = useState(30);

  useEffect(() => {
    loadDashboardData();
  }, [dias]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Cargar datos en paralelo
      const [kpisData, tendenciaData, topData, inventarioData, comparativaData] =
        await Promise.all([
          fetchKPIsGenerales(authData, { dias }),
          fetchTendenciaVentas(authData, { dias }),
          fetchTopProductos(authData, { dias, limite: 10 }),
          fetchInventarioResumen(authData),
          fetchComparativaPeriodos(authData, { dias_actual: dias, dias_anterior: dias }),
        ]);

      setKpis(kpisData);
      setTendencia(tendenciaData || []);
      setTopProductos(topData || []);
      setInventario(inventarioData);
      setComparativa(comparativaData);
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      // Setear valores por defecto en caso de error
      setKpis({
        ventas: { total_ventas: 0, cantidad_facturas: 0 },
        inventario: { total_productos: 0, total_unidades: 0 },
        alertas: { productos_stock_bajo: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('es-CO').format(value);
  };

  return (
    <div className="space-y-6 mt-8">
      {/* Header con selector de período */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Período:</label>
          <select
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className="px-3 py-2 border border-slate-300 dark:!border-slate-700 rounded-lg text-sm bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
          >
            <option value={7}>Últimos 7 días</option>
            <option value={15}>Últimos 15 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={60}>Últimos 60 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>
        </div>
      </div>

      {/* Tarjeta de acceso a la Tienda E-commerce */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-2xl font-bold">Mi Tienda Online</h3>
            </div>
            <p className="text-emerald-100 text-sm mb-4">
              Accede a tu tienda e-commerce para ver cómo la ven tus clientes
            </p>
            <div className="text-sm bg-emerald-900 bg-opacity-30 dark:bg-opacity-50 rounded-lg p-3 inline-block">
              <span className="font-mono">{window.location.origin}/tienda</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <a
              href="/tienda"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white dark:!bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-lg font-semibold hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors shadow-md text-center"
            >
              Ver Tienda
            </a>
            <button
              onClick={() => {
                const url = `${window.location.origin}/tienda`;
                navigator.clipboard.writeText(url).then(() => {
                  alert('URL copiada:\n' + url);
                });
              }}
              className="px-6 py-3 bg-emerald-700 dark:bg-emerald-800 text-white rounded-lg font-semibold hover:bg-emerald-800 dark:hover:bg-emerald-900 transition-colors text-center"
            >
              Copiar URL
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventas Totales"
          value={formatCurrency(kpis?.ventas?.total_ventas)}
          icon={<MoneyIcon />}
          color="blue"
          trend={comparativa?.variacion?.ventas_porcentual}
          trendUp={comparativa?.variacion?.ventas_porcentual >= 0}
          loading={loading}
        />
        <StatCard
          title="Facturas"
          value={formatNumber(kpis?.ventas?.cantidad_facturas)}
          icon={<ShoppingCartIcon />}
          color="green"
          trend={comparativa?.variacion?.facturas_porcentual}
          trendUp={comparativa?.variacion?.facturas_porcentual >= 0}
          loading={loading}
        />
        <StatCard
          title="Productos"
          value={formatNumber(inventario?.total_productos)}
          icon={<PackageIcon />}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Unidades en Stock"
          value={formatNumber(inventario?.total_unidades)}
          icon={<InventoryIcon />}
          color="orange"
          loading={loading}
        />
      </div>

      {/* Gráfico de tendencia */}
      <TrendChart data={tendencia} loading={loading} />

      {/* Tabla de top productos */}
      <TopProductsTable products={topProductos} loading={loading} />

      {/* Alertas */}
      {kpis?.alertas?.productos_stock_bajo > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-amber-600 dark:text-amber-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-amber-800 dark:text-amber-200">
              <span className="font-semibold">Alerta:</span> Tienes {kpis.alertas.productos_stock_bajo} productos con stock bajo
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
