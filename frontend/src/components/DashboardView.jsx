import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import {
  fetchKPIsGenerales,
  fetchTendenciaVentas,
  fetchTopProductos,
  fetchInventarioResumen,
  fetchComparativaPeriodos,
  fetchHistorialLogin,
} from '../services/analyticsApi';
import StatCard from './dashboard/StatCard';
import TrendChart from './dashboard/TrendChart';
import TopProductsTable from './dashboard/TopProductsTable';
import LoginHistoryChart from './dashboard/LoginHistoryChart';
import LoginHistoryTable from './dashboard/LoginHistoryTable';
import Modal from './Modal';

// ── Iconos ──────────────────────────────────────────────────────
const MoneyIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 22, height: 22 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ShoppingCartIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 22, height: 22 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);
const PackageIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 22, height: 22 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const InventoryIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 22, height: 22 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const StoreIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 28, height: 28 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const AlertIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
const CopyIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const ExternalIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);
const HistoryIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ── Skeleton loader ──────────────────────────────────────────────
const Skeleton = ({ width = '100%', height = 20, radius = 8, style = {} }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: isDark
        ? 'linear-gradient(90deg, #1e3a5f 25%, #1e4976 50%, #1e3a5f 75%)'
        : 'linear-gradient(90deg, #dbeafe 25%, #bfdbfe 50%, #dbeafe 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style
    }} />
  );
};

export default function DashboardView() {
  const { usuario, tokenUsuario, subdominio } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const authData = { usuario, tokenUsuario, subdominio };

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [tendencia, setTendencia] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [inventario, setInventario] = useState(null);
  const [comparativa, setComparativa] = useState(null);
  const [dias, setDias] = useState(30);
  const [copied, setCopied] = useState(false);

  // Login history state
  const [showLoginHistory, setShowLoginHistory] = useState(false);
  const [loginHistoryData, setLoginHistoryData] = useState(null);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);

  // Cargar datos al cambiar el período o cuando se refresca el token
  useEffect(() => { loadDashboardData(); }, [dias, tokenUsuario]);

  // Recargar datos cuando el token se refresca exitosamente
  useEffect(() => {
    const handleTokenRefreshed = () => {
      console.log('🔄 Token refrescado, recargando datos del dashboard...');
      loadDashboardData();
    };

    window.addEventListener('token:refreshed', handleTokenRefreshed);

    return () => {
      window.removeEventListener('token:refreshed', handleTokenRefreshed);
    };
  }, [tokenUsuario, dias]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [kpisData, tendenciaData, topData, inventarioData, comparativaData] =
        await Promise.all([
          fetchKPIsGenerales(authData, { dias }),
          fetchTendenciaVentas(authData, { dias }),
          fetchTopProductos(authData, { dias, limite: 20 }),
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
      setKpis({ ventas: { total_ventas: 0, cantidad_facturas: 0 }, inventario: { total_productos: 0, total_unidades: 0 }, alertas: { productos_stock_bajo: 0 } });
    } finally {
      setLoading(false);
    }
  };

  // Generar datos de prueba para tendencia si está vacía
  const getTendenciaConDatos = () => {


    if (tendencia && tendencia.length > 0) {
      return tendencia;
    }
    // Datos de prueba para los últimos 30 días
    const hoy = new Date();
    const datos = Array.from({ length: 30 }, (_, i) => {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - (29 - i));
      return {
        fecha: fecha.toISOString(),
        total_ventas: Math.floor(Math.random() * 800000 + 200000),
        cantidad_facturas: Math.floor(Math.random() * 10 + 1),
      };
    });
    return datos;
  };

  const formatCurrency = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };
  const formatNumber = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('es-CO').format(value);
  };

  const handleCopy = () => {
    const url = `${window.location.origin}/tienda`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const loadLoginHistory = async () => {
    console.log('🔄 Cargando historial de login...');
    console.log('📊 authData:', authData);
    console.log('📅 días:', dias);

    setLoginHistoryLoading(true);
    try {
      const data = await fetchHistorialLogin(authData, { dias });

      console.log('✅ Datos recibidos:', data);
      console.log('📈 Historial:', data?.historial?.length || 0, 'registros');
      console.log('📊 Gráfica:', data?.grafica?.length || 0, 'puntos');
      console.log('📈 Estadísticas:', data?.estadisticas);

      setLoginHistoryData(data);
    } catch (error) {
      console.error('❌ Error al cargar historial de login:', error);
      setLoginHistoryData({ historial: [], grafica: [], estadisticas: {} });
    } finally {
      setLoginHistoryLoading(false);
    }
  };

  // Cargar historial de login cuando se abre el modal
  useEffect(() => {
    console.log('🔍 useEffect triggered - showLoginHistory:', showLoginHistory, 'loginHistoryData:', loginHistoryData);

    if (showLoginHistory && !loginHistoryData) {
      console.log('🚀 Cargando historial de login...');
      loadLoginHistory();
    } else if (showLoginHistory && loginHistoryData && dias) {
      console.log('♻️  Recargando historial por cambio de período...');
      loadLoginHistory();
    }
  }, [showLoginHistory, dias]);

  // Bloquear scroll cuando el modal de historial está abierto
  useEffect(() => {
    if (showLoginHistory) {
      // Bloquear scroll en el body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      // Restaurar scroll
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [showLoginHistory]);

  // ── Tema tokens ──────────────────────────────────────────────
  const T = isDark ? {
    pageBg: 'transparent',
    sectionTitle: '#94a3b8',
    labelColor: '#94a3b8',
    selectBg: '#0d1f3c',
    selectBorder: 'rgba(14,165,233,0.25)',
    selectColor: '#e2e8f0',
    selectFocus: '0 0 0 2px rgba(14,165,233,0.4)',
    storeBg: 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)',
    storeBorder: 'rgba(14,165,233,0.18)',
    storeShadow: '0 8px 24px rgba(14,165,233,0.12), 0 1px 0 rgba(14,165,233,0.2)',
    storeIconBg: 'rgba(14,165,233,0.15)',
    storeIconColor: '#38bdf8',
    storeTitleColor: '#e2e8f0',
    storeSubColor: '#94a3b8',
    storeUrlBg: 'rgba(14,165,233,0.08)',
    storeUrlBorder: 'rgba(14,165,233,0.2)',
    storeUrlColor: '#38bdf8',
    btnPrimaryBg: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
    btnPrimaryColor: '#fff',
    btnPrimaryHover: 'linear-gradient(90deg, #38bdf8, #7dd3fc)',
    btnPrimaryShadow: '0 4px 14px rgba(14,165,233,0.35)',
    btnSecondaryBg: 'rgba(14,165,233,0.08)',
    btnSecondaryColor: '#38bdf8',
    btnSecondaryBorder: 'rgba(14,165,233,0.2)',
    btnSecondaryHover: 'rgba(14,165,233,0.15)',
    alertBg: 'rgba(251,191,36,0.08)',
    alertBorder: 'rgba(251,191,36,0.3)',
    alertIconColor: '#fbbf24',
    alertTextColor: '#fde68a',
    alertAccent: '#fbbf24',
    divider: 'rgba(14,165,233,0.12)',
  } : {
    pageBg: 'transparent',
    sectionTitle: '#64748b',
    labelColor: '#475569',
    selectBg: '#ffffff',
    selectBorder: 'rgba(14,165,233,0.35)',
    selectColor: '#1e293b',
    selectFocus: '0 0 0 2px rgba(14,165,233,0.3)',
    storeBg: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 50%, #f0f7ff 100%)',
    storeBorder: 'rgba(14,165,233,0.25)',
    storeShadow: '0 8px 20px rgba(14,165,233,0.12), 0 1px 0 rgba(14,165,233,0.2)',
    storeIconBg: 'rgba(14,165,233,0.12)',
    storeIconColor: '#0284c7',
    storeTitleColor: '#0c4a6e',
    storeSubColor: '#475569',
    storeUrlBg: 'rgba(255,255,255,0.8)',
    storeUrlBorder: 'rgba(14,165,233,0.25)',
    storeUrlColor: '#0284c7',
    btnPrimaryBg: 'linear-gradient(90deg, #0284c7, #0ea5e9)',
    btnPrimaryColor: '#fff',
    btnPrimaryHover: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
    btnPrimaryShadow: '0 4px 14px rgba(14,165,233,0.3)',
    btnSecondaryBg: 'rgba(255,255,255,0.8)',
    btnSecondaryColor: '#0284c7',
    btnSecondaryBorder: 'rgba(14,165,233,0.35)',
    btnSecondaryHover: 'rgba(255,255,255,1)',
    alertBg: 'rgba(254,243,199,0.8)',
    alertBorder: 'rgba(251,191,36,0.4)',
    alertIconColor: '#d97706',
    alertTextColor: '#92400e',
    alertAccent: '#d97706',
    divider: 'rgba(14,165,233,0.15)',
  };

  const periodOptions = [
    { value: 7,  label: 'Últimos 7 días' },
    { value: 15, label: 'Últimos 15 días' },
    { value: 30, label: 'Últimos 30 días' },
    { value: 60, label: 'Últimos 60 días' },
    { value: 90, label: 'Últimos 90 días' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

        .dash-root { font-family: 'Sora', sans-serif; }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dash-fade { animation: fadeUp 0.35s ease forwards; }
        .dash-fade-1 { animation: fadeUp 0.35s 0.05s ease both; }
        .dash-fade-2 { animation: fadeUp 0.35s 0.1s  ease both; }
        .dash-fade-3 { animation: fadeUp 0.35s 0.15s ease both; }
        .dash-fade-4 { animation: fadeUp 0.35s 0.2s  ease both; }

        .store-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 600;
          font-family: 'Sora', sans-serif; border: none; cursor: pointer;
          transition: all 0.2s ease; text-decoration: none; white-space: nowrap;
        }
        .store-btn:focus-visible { outline: 2px solid #0ea5e9; outline-offset: 2px; }

        .period-select {
          appearance: none; padding: 9px 36px 9px 14px; border-radius: 10px;
          font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.2s ease;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%230ea5e9' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 10px center; background-size: 16px;
        }
        .period-select:focus { outline: none; }

        /* ─── Desktop & Large Screens (≥ 1024px) ─────────────────────────── */
        @media (min-width: 1024px) {
          .dash-chart-grid { grid-template-columns: 1.8fr 2fr; }
        }

        /* ─── Tablet (768px - 1023px) ────────────────────────────────────── */
        @media (max-width: 1023px) {
          .dash-chart-grid { grid-template-columns: 1fr; }
        }

        /* ─── Mobile & Tablet Landscape (≤ 767px) ───────────────────────── */
        @media (max-width: 767px) {
          .store-card { padding: 18px 20px; }
          .store-card-inner { flex-direction: column !important; gap: 16px !important; }
          .store-info { flex-direction: column !important; align-items: center !important; text-align: center !important; gap: 12px !important; width: 100% !important; }
          .store-url-badge { width: 100% !important; display: flex !important; justify-content: center !important; }
          .store-url-badge span { font-size: 11px !important; word-break: break-all !important; white-space: normal !important; }
          .store-btn-group { flex-direction: column !important; width: 100% !important; gap: 8px !important; }
          .store-btn { width: 100% !important; justify-content: center !important; }
          .dash-chart-grid { grid-template-columns: 1fr !important; }
        }

        /* ─── Mobile Portrait (≤ 480px) ──────────────────────────────────── */
        @media (max-width: 480px) {
          .dash-root { padding-left: 10px; padding-right: 10px; }
          .store-card { padding: 16px; margin-bottom: 16px; }
          .store-card-inner { gap: 14px; }
          .store-icon { width: 48px; height: 48px; }
          .store-title { font-size: 16px; }
          .store-description { font-size: 12px; }
          .store-btn { font-size: 12px; padding: 11px 14px; }
        }

        /* Evitar scroll horizontal en todos los dispositivos */
        * {
          box-sizing: border-box;
        }
        .dash-root,
        .dash-root > div,
        .dash-root > div > div {
          max-width: 100% !important;
          overflow-x: hidden !important;
          box-sizing: border-box !important;
        }
        @media (max-width: 768px) {
          .dash-root {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .dash-root > div {
            padding-left: clamp(8px, 2vw, 12px) !important;
            padding-right: clamp(8px, 2vw, 12px) !important;
          }
        }

        /* ─── Responsive: Login History Modal ───────────────────────── */
        /* Estadísticas rápidas - 4 columnas desktop, 2 tablet, 1 móvil */
        @media (min-width: 768px) {
          .login-stats-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        @media (min-width: 481px) and (max-width: 767px) {
          .login-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {DashboardView
          .login-stats-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* Gráfico y Tabla - 2 columnas desktop, 1 móvil/tablet */
        @media (min-width: 1024px) {
          .login-chart-grid {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          }
        }
        @media (max-width: 1023px) {
          .login-chart-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="dash-root" style={{
        paddingTop: '16px',
        width: '100%',
        maxWidth: '100%',
        marginLeft: '0',
        marginRight: '0',
        paddingLeft: '0',
        paddingRight: '0',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>

        {/* ── Header / Período ──────────────────────────── */}
        <div className="dash-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: T.labelColor, letterSpacing: '0.02em' }}>
              Período:
            </label>
            <select
              value={dias}
              onChange={e => setDias(Number(e.target.value))}
              className="period-select"
              style={{
                background: T.selectBg,
                border: `1px solid ${T.selectBorder}`,
                color: T.selectColor,
              }}
              onFocus={e => e.currentTarget.style.boxShadow = T.selectFocus}
              onBlur={e => e.currentTarget.style.boxShadow = 'none'}
            >
              {periodOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setShowLoginHistory(true);
              if (!loginHistoryData) {
                loadLoginHistory();
              }
            }}
            className="store-btn"
            style={{
              background: T.btnSecondaryBg,
              color: T.btnSecondaryColor,
              border: `1px solid ${T.btnSecondaryBorder}`,
              padding: '9px 16px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = T.btnSecondaryHover;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = T.btnSecondaryBg;
            }}
          >
            <HistoryIcon />
            Historial de Login
          </button>
        </div>

        {/* ── Modal de Historial de Login ─────────────────────────── */}
        {showLoginHistory && (
          <Modal onClose={() => setShowLoginHistory(false)}>
            <div style={{ color: '#e2e8f0', marginTop: '8px' }}>
              {/* Título */}
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  marginBottom: '8px',
                  background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Historial de Inicios de Sesión
                </h2>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                  Últimos 30 días de actividad de usuarios
                </p>
              </div>

              {/* Estadísticas rápidas */}
              {loginHistoryData?.estadisticas && (
                <div className="login-stats-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  marginBottom: '24px',
                }}>
                  <div style={{
                    background: 'rgba(14,165,233,0.08)',
                    border: '1px solid rgba(14,165,233,0.2)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Total Logins</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#38bdf8' }}>
                      {loginHistoryLoading ? '...' : loginHistoryData.estadisticas.total_logins}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Exitosos</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>
                      {loginHistoryLoading ? '...' : loginHistoryData.estadisticas.logins_exitosos}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Fallidos</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                      {loginHistoryLoading ? '...' : loginHistoryData.estadisticas.logins_fallidos}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(168,85,247,0.08)',
                    border: '1px solid rgba(168,85,247,0.2)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Sesiones Activas</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#a855f7' }}>
                      {loginHistoryLoading ? '...' : loginHistoryData.estadisticas.sesiones_activas}
                    </div>
                  </div>
                </div>
              )}

              {/* Gráfica y Tabla */}
              <div className="login-chart-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px' }}>
                <div style={{ minWidth: 0, width: '100%' }}>
                  <LoginHistoryChart
                    data={loginHistoryData?.grafica || []}
                    loading={loginHistoryLoading}
                    showMockIfEmpty={false}
                  />
                </div>
                <div style={{ minWidth: 0, width: '100%', maxHeight: '400px', overflowY: 'auto' }}>
                  <LoginHistoryTable
                    data={loginHistoryData?.historial || []}
                    loading={loginHistoryLoading}
                  />
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* ── Tienda E-commerce ─────────────────────────── */}
        <div
          className="dash-fade-1 store-card"
          style={{
            background: T.storeBg,
            border: `1px solid ${T.storeBorder}`,
            borderRadius: '16px',
            boxShadow: T.storeShadow,
            padding: '24px 28px',
            marginBottom: '24px',
          }}
        >
          <div className="store-card-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
            {/* Info */}
            <div className="store-info" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, minWidth: 0 }}>
              <div className="store-icon" style={{
                width: 52, height: 52, borderRadius: '12px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: T.storeIconBg,
                color: T.storeIconColor,
                border: `1px solid ${T.storeBorder}`,
              }}>
                <StoreIcon />
              </div>
              <div className="store-content" style={{ minWidth: 0 }}>
                <h3 className="store-title" style={{ color: T.storeTitleColor, fontWeight: 800, fontSize: '18px', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>
                  Mi Tienda Online
                </h3>
                <p className="store-description" style={{ color: T.storeSubColor, fontSize: '13px', margin: '0 0 12px 0', fontWeight: 500 }}>
                  Accede a tu tienda e-commerce y comparte la URL con tus clientes
                </p>
                <div className="store-url-badge" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: T.storeUrlBg,
                  border: `1px solid ${T.storeUrlBorder}`,
                  borderRadius: '8px', padding: '7px 14px',
                  maxWidth: '100%', overflow: 'hidden',
                }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '13px', color: T.storeUrlColor, fontWeight: 600, letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {window.location.origin}/tienda
                  </span>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="store-btn-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
              <a
                href="/tienda"
                target="_blank"
                rel="noopener noreferrer"
                className="store-btn"
                style={{ background: T.btnPrimaryBg, color: T.btnPrimaryColor, boxShadow: T.btnPrimaryShadow }}
                onMouseEnter={e => e.currentTarget.style.background = T.btnPrimaryHover}
                onMouseLeave={e => e.currentTarget.style.background = T.btnPrimaryBg}
              >
                <ExternalIcon /> Ver Tienda
              </a>
              <button
                onClick={handleCopy}
                className="store-btn"
                style={{
                  background: T.btnSecondaryBg,
                  color: T.btnSecondaryColor,
                  border: `1px solid ${T.btnSecondaryBorder}`,
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.btnSecondaryHover}
                onMouseLeave={e => e.currentTarget.style.background = T.btnSecondaryBg}
              >
                <CopyIcon />
                {copied ? '¡Copiado!' : 'Copiar URL'}
              </button>
            </div>
          </div>
        </div>

        {/* ── KPIs ─────────────────────────────────────────── */}
        <div
          className="kpi-grid dash-fade-2"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}
        >
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

        {/* ── Gráfico y Top Productos ───────────────────────── */}
        <div className="dash-chart-grid dash-fade-3" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px', marginBottom: '20px' }}>
          {/* ── Gráfico de tendencia ───────────────────────── */}
          <div style={{ minWidth: 0, width: '100%' }}>
            <TrendChart data={getTendenciaConDatos()} loading={loading} showMockIfEmpty={false} />
          </div>

          {/* ── Top Productos ──────────────────────────────── */}
          <div style={{ minWidth: 0, width: '100%' }}>
            <TopProductsTable products={topProductos} loading={loading} />
          </div>
        </div>

        {/* ── Alerta stock bajo ──────────────────────────── */}
        {kpis?.alertas?.productos_stock_bajo > 0 && (
          <div
            className="dash-fade"
            style={{
              background: T.alertBg,
              border: `1px solid ${T.alertBorder}`,
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '8px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(251,191,36,0.15)',
              color: T.alertIconColor,
            }}>
              <AlertIcon />
            </div>
            <p style={{ color: T.alertTextColor, fontSize: '14px', margin: 0, fontWeight: 500 }}>
              <span style={{ fontWeight: 700, color: T.alertAccent }}>Atención: </span>
              Tienes{' '}
              <span style={{ fontWeight: 700, color: T.alertAccent }}>
                {kpis.alertas.productos_stock_bajo} productos
              </span>{' '}
              con stock bajo. Revisa tu inventario pronto.
            </p>
          </div>
        )}

      </div>
    </>
  );
}