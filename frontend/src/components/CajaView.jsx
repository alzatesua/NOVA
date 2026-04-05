/**
 * Vista principal de Caja — Diseño Profesional (mismo estilo que MoraView)
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import CajaDashboard from './caja/CajaDashboard';
import MovimientosTable from './caja/MovimientosTable';
import RegistroMovimiento from './caja/RegistroMovimiento';
import CuadreCaja from './caja/CuadreCaja';
import ArqueoCaja from './caja/ArqueoCaja';
import HistorialArqueos from './caja/HistorialArqueos';
import CajaMenor from './caja/CajaMenor';
import { fetchSucursalesCaja } from '../services/api';
import { showToast } from '../utils/toast';

/* ─── Paleta ─────────────────────────────────────────────────────────── */
const C = {
  blue:       '#2563eb',
  blueDark:   '#1d4ed8',
  blueLight:  '#eff6ff',
  blueBorder: '#bfdbfe',
  text:       '#111827',
  textMid:    '#374151',
  textSub:    '#6b7280',
  textMuted:  '#9ca3af',
  border:     '#e5e7eb',
  surface:    '#ffffff',
  bg:         '#f9fafb',
  // Dark mode colors
  dark: {
    text:       '#f9fafb',
    textMid:    '#d1d5db',
    textSub:    '#9ca3af',
    textMuted:  '#6b7280',
    border:     '#374151',
    surface:    '#1f2937',
    bg:         '#111827',
    blueLight:  '#1e3a5f',
    blueBorder: '#1e40af',
  }
};

/* ─── Iconos SVG inline ───────────────────────────────────────────────── */
const IcoCash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
  </svg>
);
const IcoCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
  </svg>
);
const IcoBuilding = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
  </svg>
);
const IcoChevron = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" width="11" height="11" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6l4 4 4-4"/>
  </svg>
);
const IcoRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="13" height="13" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
  </svg>
);
const IcoFilter = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="13" height="13" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
  </svg>
);

/* ─── Estilos globales mínimos (solo lo que inline no puede hacer) ────── */
const STYLES = `
  @keyframes fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .caja-section { animation: fadein .25s ease both; }
  .caja-tab:hover:not(.caja-tab-active) { background: var(--caja-blue-light, #eff6ff); color: var(--caja-blue, #2563eb); }
  .caja-tab-active { background: var(--caja-blue, #2563eb); color: #fff; }
  .caja-pill:focus-within { border-color: var(--caja-blue, #2563eb); box-shadow: 0 0 0 3px rgba(37,99,235,0.13); }
  .caja-chip:hover:not(.caja-chip-active) { border-color: var(--caja-blue, #2563eb); color: var(--caja-blue, #2563eb); background: var(--caja-blue-light, #eff6ff); }
  .caja-chip-active { background: var(--caja-blue, #2563eb); border-color: var(--caja-blue, #2563eb); color: #fff; }
  .caja-btn-ghost:hover { background: var(--caja-blue-light, #eff6ff); border-color: var(--caja-blue, #2563eb); color: var(--caja-blue, #2563eb); }
  .caja-pill input[type="date"], .caja-pill select { background: transparent; border: none; outline: none; font-family: inherit; font-size: 13px; font-weight: 600; color: var(--caja-text, #111827); cursor: pointer; padding: 0; appearance: none; -webkit-appearance: none; }
  .caja-pill select { padding-right: 2px; }

  /* Ring effect IGUAL QUE PROVEEDORESVIEW */
  .caja-panel {
    position: relative;
  }
  .caja-panel::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(to bottom, rgba(226, 232, 240, 0.5), rgba(226, 232, 240, 0.2));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
  .dark .caja-panel::before {
    background: linear-gradient(to bottom, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.1));
  }
  .dark .caja-header::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(to bottom, rgba(148, 163, 184, 0.15), rgba(148, 163, 184, 0.05));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    border-bottom: 1px solid rgba(51, 65, 85, 0.5);
  }

  /* Responsive grid layouts */
  @media (min-width: 769px) {
    .caja-grid-desktop {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) !important;
      gap: clamp(12px, 2vw, 20px);
    }
  }

  @media (max-width: 768px) {
    .caja-grid-desktop {
      display: flex;
      flex-direction: column;
      gap: clamp(12px, 2vw, 20px);
    }
    .caja-header {
      flex-direction: column;
      align-items: flex-start !important;
    }
    .caja-controls {
      width: 100%;
      justify-content: flex-start;
    }
    .caja-tab-bar {
      width: 100%;
      overflow-x: auto;
      justify-content: flex-start;
    }
    .caja-tab {
      flex: 0 0 auto;
      min-width: max-content;
    }
  }

  /* Dark mode support - IGUALES QUE PROVEEDORESVIEW */
  @media (prefers-color-scheme: dark) {
    :root {
      --caja-blue: #3b82f6;
      --caja-blue-dark: #2563eb;
      --caja-blue-light: #1e3a5f;
      --caja-blue-border: #1e40af;
      --caja-text: #ffffff;
      --caja-text-mid: #e2e8f0;
      --caja-text-sub: #cbd5e1;
      --caja-text-muted: #94a3b8;
      --caja-border: #334155;
      --caja-surface: #0f172a;
      --caja-bg: #020617;
    }
  }

  @media (prefers-color-scheme: light) {
    :root {
      --caja-blue: #2563eb;
      --caja-blue-dark: #1d4ed8;
      --caja-blue-light: #eff6ff;
      --caja-blue-border: #bfdbfe;
      --caja-text: #111827;
      --caja-text-mid: #374151;
      --caja-text-sub: #6b7280;
      --caja-text-muted: #9ca3af;
      --caja-border: #e5e7eb;
      --caja-surface: #ffffff;
      --caja-bg: #f9fafb;
    }
  }

  /* Support for manual dark mode class - IGUALES QUE PROVEEDORESVIEW */
  .dark {
    --caja-blue: #3b82f6;
    --caja-blue-dark: #2563eb;
    --caja-blue-light: #1e3a5f;
    --caja-blue-border: #1e40af;
    --caja-text: #ffffff;
    --caja-text-mid: #e2e8f0;
    --caja-text-sub: #cbd5e1;
    --caja-text-muted: #94a3b8;
    --caja-border: #334155;
    --caja-surface: #0f172a;
    --caja-bg: #020617;
  }
`;

export default function CajaView() {
  const { isAdmin, idSucursal, usuario, tokenUsuario, subdominio } = useAuth();


  const [fecha,                setFecha]                = useState(new Date().toISOString().split('T')[0]);
  const [filtroTipo,           setFiltroTipo]           = useState('todos');
  const [vista,                setVista]                = useState('general');
  const [refreshKey,           setRefreshKey]           = useState(0);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [sucursales,           setSucursales]           = useState([]);
  const [loadingSucursales,    setLoadingSucursales]    = useState(false);
  const [isDark,               setIsDark]               = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDark = () => {
      const isDarkMode = document.documentElement.classList.contains('dark') ||
                        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(isDarkMode);
    };

    checkDark();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDark);

    // Observer for class changes on html element
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      mediaQuery.removeEventListener('change', checkDark);
      observer.disconnect();
    };
  }, []);

  useEffect(() => { cargarSucursales(); }, [isAdmin, idSucursal]);

  const cargarSucursales = async () => {
    setLoadingSucursales(true);
    try {
      const response = await fetchSucursalesCaja({ token: tokenUsuario, usuario, subdominio });
      if (response?.success) {
        setSucursales(response.data);
        if (!isAdmin && response.sucursal_asignada) setSucursalSeleccionada(response.sucursal_asignada);
      } else { showToast('Error al cargar las sucursales', 'error'); }
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED' || err.isAuthError) {
        showToast('Tu sesión ha expirado. Por favor inicia sesión nuevamente.', 'error');
      } else {
        showToast('Error al cargar las sucursales', 'error');
      }
    } finally { setLoadingSucursales(false); }
  };

  // Para usuarios no-admin, siempre usar su sucursal asignada
  // Para admin, usar la sucursal seleccionada o null para ver todas
  const getSucursalFilter     = () => {
    if (isAdmin) {
      return sucursalSeleccionada || null; // Admin puede ver todas o filtrar
    }
    return idSucursal; // No-admin solo ve su sucursal
  };
  const handleRegistroExitoso = () => setRefreshKey(k => k + 1);
  const handleRefresh         = () => setRefreshKey(k => k + 1);

  // Dynamic colors based on theme - IGUALES QUE PROVEEDORESVIEW
  const colors = isDark ? {
    blue:       '#3b82f6',
    blueDark:   '#2563eb',
    blueLight:  '#1e3a5f',
    blueBorder: '#1e40af',
    text:       '#ffffff',
    textMid:    '#e2e8f0',
    textSub:    '#cbd5e1',
    textMuted:  '#94a3b8',
    border:     '#334155',
    surface:    '#0f172a',
    bg:         '#020617',
  } : {
    blue:       '#2563eb',
    blueDark:   '#1d4ed8',
    blueLight:  '#eff6ff',
    blueBorder: '#bfdbfe',
    text:       '#111827',
    textMid:    '#374151',
    textSub:    '#6b7280',
    textMuted:  '#9ca3af',
    border:     '#e5e7eb',
    surface:    '#ffffff',
    bg:         '#f9fafb',
  };

  const vistaOptions  = [
    { value: 'general',         label: 'Vista General'     },
    { value: 'movimientos',     label: 'Movimientos'       },
    { value: 'cuadre',          label: 'Cuadre de Caja'    },
    { value: 'arqueo',          label: 'Arqueo de Caja'    },
    { value: 'historial_arqueos', label: 'Historial Arqueos' },
    { value: 'caja_menor',      label: 'Caja Menor'        },
  ];
  const filtroOptions = [
    { value: 'todos',   label: 'Todos'    },
    { value: 'entrada', label: 'Entradas' },
    { value: 'salida',  label: 'Salidas'  },
  ];

  /* ── Shared inline styles ── */
  const s = {
    page:    {
      fontFamily: "'Inter', -apple-system, sans-serif",
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: '100vw',
      overflow: 'hidden',
      boxSizing: 'border-box'
    },

    // Header - responsive padding
    header:  {
      padding: 'clamp(12px, 2vw, 14px) clamp(16px, 3vw, 28px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
      position: 'relative',
    },
    iconBox: {
      width: 38,
      height: 38,
      borderRadius: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    title:   { fontSize: 'clamp(16px, 2vw, 17px)', fontWeight: 700, margin: 0 },
    sub:     { fontSize: 'clamp(11px, 1.5vw, 12px)', margin: '2px 0 0' },

    // Controls - responsive gap and flex
    controls:{
      display: 'flex',
      alignItems: 'center',
      gap: 'clamp(6px, 1vw, 8px)',
      flexWrap: 'wrap',
      flex: '1 1 auto',
      justifyContent: 'flex-end'
    },

    // Pill (date / select inputs) - responsive
    pill:    {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: 'clamp(6px, 1vw, 7px) clamp(10px, 2vw, 12px)',
      borderRadius: 8,
      fontSize: 'clamp(12px, 1.5vw, 13px)',
      fontWeight: 600,
      transition: 'border-color .15s, box-shadow .15s',
      whiteSpace: 'nowrap',
      cursor: 'default',
    },

    // Tab bar - responsive
    tabBar:  {
      display: 'flex',
      gap: 2,
      borderRadius: 8,
      padding: 3,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    tab:     (on) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      padding: 'clamp(6px, 1vw, 7px) clamp(10px, 2vw, 14px)',
      borderRadius: 6,
      border: 'none',
      cursor: 'pointer',
      fontSize: 'clamp(11px, 1.5vw, 13px)',
      fontWeight: 600,
      transition: 'all .15s',
      boxShadow: on ? '0 1px 3px rgba(37,99,235,.2)' : 'none',
      fontFamily: 'inherit',
      flex: '1 1 auto',
      textAlign: 'center',
      justifyContent: 'center',
      minWidth: 'min-content'
    }),

    // Content - responsive padding
    content: {
      flex: 1,
      padding: 'clamp(12px, 2vw, 20px) clamp(16px, 3vw, 28px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      maxWidth: '100%',
      overflow: 'hidden'
    },

    // Cards - IGUALES QUE PROVEEDORESVIEW: ring-1 ring-slate-200 dark:!ring-slate-700
    panel:   {
      borderRadius: 12,
      border: `1px solid ${colors.border}`,
      overflow: 'hidden',
      boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,.04)',
      boxSizing: 'border-box',
      position: 'relative',
    },
    panelBefore: {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 12,
      padding: '1px',
      background: isDark ? 'linear-gradient(to bottom, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.1))' : 'linear-gradient(to bottom, rgba(226, 232, 240, 0.5), rgba(226, 232, 240, 0.2))',
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      maskComposite: 'exclude',
      pointerEvents: 'none',
    },
    panelHead: {
      padding: 'clamp(10px, 2vw, 13px) clamp(14px, 3vw, 18px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8
    },
    panelTitle:{
      fontSize: 'clamp(13px, 1.5vw, 14px)',
      fontWeight: 600,
      margin: 0
    },

    // Grid (registro + movimientos) - responsive columns
    grid:    {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: 'clamp(12px, 2vw, 20px)'
    },

    // Grid for desktop only
    gridDesktop: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)',
      gap: 'clamp(12px, 2vw, 20px)'
    },

    // Filter bar - responsive
    filterBar: {
      padding: 'clamp(10px, 2vw, 12px) clamp(14px, 3vw, 18px)',
      display: 'flex',
      alignItems: 'center',
      gap: 'clamp(6px, 1vw, 10px)',
      flexWrap: 'wrap'
    },
    filterLabel: {
      fontSize: 'clamp(10px, 1.2vw, 11px)',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      display: 'flex',
      alignItems: 'center',
      gap: 5
    },

    // Chips - responsive
    chip:    (on) => ({
      padding: 'clamp(4px, 1vw, 5px) clamp(10px, 2vw, 14px)',
      borderRadius: 999,
      fontSize: 'clamp(11px, 1.3vw, 12px)',
      fontWeight: 600,
      border: `1px solid ${on ? colors.blue : colors.border}`,
      background: on ? colors.blue : colors.surface,
      color: on ? '#fff' : colors.textSub,
      cursor: 'pointer',
      transition: 'all .15s',
      fontFamily: 'inherit',
      whiteSpace: 'nowrap'
    }),

    // Ghost btn - responsive
    btnGhost: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: 'clamp(5px, 1vw, 6px) clamp(10px, 2vw, 12px)',
      background: 'transparent',
      borderRadius: 7,
      fontSize: 'clamp(11px, 1.3vw, 12px)',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all .15s',
      fontFamily: 'inherit'
    },
  };

  return (
    <>
      <style>{STYLES}</style>
      <div style={s.page} className="dark:!bg-slate-950">

        {/* ── HEADER ── */}
        <header style={s.header} className="caja-header bg-white dark:!bg-slate-900 border-b border-gray-200 dark:!border-slate-700">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 auto' }}>
            <div style={s.iconBox} className="bg-blue-50 dark:!bg-blue-900/30 border border-blue-200 dark:!border-blue-700 text-blue-600 dark:!text-blue-400"><IcoCash /></div>
            <div>
              <h1 style={s.title} className="text-gray-900 dark:!text-white">Control de Caja</h1>
              <p style={s.sub} className="text-gray-600 dark:!text-slate-400">
                {isAdmin ? 'Gestiona todos los movimientos y cuadres de caja' : 'Vista limitada a tu sucursal asignada'}
              </p>
            </div>
          </div>

          <div style={s.controls} className="caja-controls">
            {/* Fecha */}
            <label className="caja-pill ring-1 ring-slate-200 dark:!ring-slate-700 bg-white dark:!bg-slate-800" style={s.pill}>
              <IcoCalendar />
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="text-gray-900 dark:!text-white" />
            </label>

            {/* Sucursal (solo admin) */}
            {isAdmin && (
              <label className="caja-pill ring-1 ring-slate-200 dark:!ring-slate-700 bg-white dark:!bg-slate-800" style={s.pill}>
                <IcoBuilding />
                <select
                  value={sucursalSeleccionada || ''}
                  onChange={e => setSucursalSeleccionada(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={loadingSucursales}
                  className="text-gray-900 dark:!text-white"
                >
                  <option value="">Todas las sedes</option>
                  {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
                <IcoChevron />
              </label>
            )}

            {/* Tab switcher */}
            <div style={s.tabBar} className="caja-tab-bar bg-gray-50 dark:!bg-slate-800 border border-gray-200 dark:!border-slate-700">
              {vistaOptions.map(o => (
                <button
                  key={o.value}
                  className={`caja-tab${vista === o.value ? ' caja-tab-active' : ''} text-gray-600 dark:!text-slate-300`}
                  style={s.tab(vista === o.value)}
                  onClick={() => setVista(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ── CONTENT ── */}
        <div style={s.content} className="bg-gray-50 dark:!bg-slate-950">

          {/* Vista General */}
          {vista === 'general' && (
            <div className="caja-section" key={`general-${refreshKey}`}>
              <CajaDashboard
                fecha={fecha}
                isAdmin={isAdmin}
                idSucursal={getSucursalFilter()}
                onRefresh={handleRefresh}
                isDark={isDark}
              />
              <div style={{ ...s.gridDesktop, marginTop: 20 }} className="caja-grid-desktop">
                {/* Registro */}
                <div style={s.panel} className="caja-panel bg-white dark:!bg-slate-900 ring-1 ring-slate-200 dark:!ring-slate-700">
                  <div style={s.panelHead} className="border-b border-gray-200 dark:!border-slate-700">
                    <p style={s.panelTitle} className="dark:!text-white">Registrar Movimiento</p>
                  </div>
                  <div style={{ padding: 18 }}>
                    <RegistroMovimiento
                      idSucursal={getSucursalFilter()}
                      onRegistroExitoso={handleRegistroExitoso}
                      isDark={isDark}
                    />
                  </div>
                </div>

                {/* Movimientos */}
                <div style={s.panel} className="caja-panel bg-white dark:!bg-slate-900 ring-1 ring-slate-200 dark:!ring-slate-700">
                  <div style={s.panelHead} className="border-b border-gray-200 dark:!border-slate-700">
                    <button className="caja-btn-ghost text-gray-700 dark:!text-slate-300 border border-gray-300 dark:!border-slate-600 hover:bg-blue-50 dark:hover:!bg-slate-800 hover:border-blue-500 dark:hover:!border-slate-500 hover:text-blue-600 dark:hover:!text-white" style={s.btnGhost} onClick={handleRefresh}>
                      <IcoRefresh /> Actualizar
                    </button>
                  </div>
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

          {/* Movimientos */}
          {vista === 'movimientos' && (
            <div className="caja-section" key={`movimientos-${refreshKey}`}>
              <div style={s.panel} className="bg-white dark:!bg-slate-900 ring-1 ring-slate-200 dark:!ring-slate-700">
                <div style={s.filterBar} className="border-b border-gray-200 dark:!border-slate-700">
                  <span style={s.filterLabel} className="text-gray-500 dark:!text-slate-400"><IcoFilter /> Filtrar</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {filtroOptions.map(o => (
                      <button
                        key={o.value}
                        className={`caja-chip${filtroTipo === o.value ? ' caja-chip-active' : ''} dark:!text-slate-300`}
                        style={s.chip(filtroTipo === o.value)}
                        onClick={() => setFiltroTipo(o.value)}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <button className="caja-btn-ghost text-gray-700 dark:!text-slate-300 border border-gray-300 dark:!border-slate-600 hover:bg-blue-50 dark:hover:!bg-slate-800 hover:border-blue-500 dark:hover:!border-slate-500 hover:text-blue-600 dark:hover:!text-white" style={{ ...s.btnGhost, marginLeft: 'auto' }} onClick={handleRefresh}>
                    <IcoRefresh /> Actualizar
                  </button>
                </div>
                <MovimientosTable
                  fecha={fecha}
                  filtroTipo={filtroTipo}
                  isAdmin={isAdmin}
                  idSucursal={getSucursalFilter()}
                  onRefresh={handleRefresh}
                />
              </div>
            </div>
          )}

          {/* Cuadre de Caja */}
          {vista === 'cuadre' && (
            <div className="caja-section" key={`cuadre-${refreshKey}`}>
              <CuadreCaja
                fecha={fecha}
                isAdmin={isAdmin}
                idSucursal={getSucursalFilter()}
              />
            </div>
          )}

          {/* Arqueo de Caja */}
          {vista === 'arqueo' && (
            <div className="caja-section" key={`arqueo-${refreshKey}`}>
              <ArqueoCaja
                fecha={fecha}
                isAdmin={isAdmin}
                idSucursal={getSucursalFilter()}
              />
            </div>
          )}

          {/* Historial de Arqueos */}
          {vista === 'historial_arqueos' && (
            <div className="caja-section" key={`historial_arqueos-${refreshKey}`}>
              <HistorialArqueos
                idSucursal={getSucursalFilter()}
              />
            </div>
          )}

          {/* Caja Menor */}
          {vista === 'caja_menor' && (
            <div className="caja-section" key={`caja_menor-${refreshKey}`}>
              <CajaMenor
                fecha={fecha}
                idSucursal={getSucursalFilter()}
                onRefresh={handleRefresh}
                isDark={isDark}
              />
            </div>
          )}

        </div>
      </div>
    </>
  );
}