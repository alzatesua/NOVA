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

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    :root {
      --caja-blue: #3b82f6;
      --caja-blue-dark: #2563eb;
      --caja-blue-light: #1e3a5f;
      --caja-blue-border: #1e40af;
      --caja-text: #f9fafb;
      --caja-text-mid: #d1d5db;
      --caja-text-sub: #9ca3af;
      --caja-text-muted: #6b7280;
      --caja-border: #374151;
      --caja-surface: #1f2937;
      --caja-bg: #111827;
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

  /* Support for manual dark mode class */
  .dark {
    --caja-blue: #3b82f6;
    --caja-blue-dark: #2563eb;
    --caja-blue-light: #1e3a5f;
    --caja-blue-border: #1e40af;
    --caja-text: #f9fafb;
    --caja-text-mid: #d1d5db;
    --caja-text-sub: #9ca3af;
    --caja-text-muted: #6b7280;
    --caja-border: #374151;
    --caja-surface: #1f2937;
    --caja-bg: #111827;
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

  // Dynamic colors based on theme
  const colors = isDark ? {
    blue:       '#3b82f6',
    blueDark:   '#2563eb',
    blueLight:  '#1e3a5f',
    blueBorder: '#1e40af',
    text:       '#f9fafb',
    textMid:    '#d1d5db',
    textSub:    '#9ca3af',
    textMuted:  '#6b7280',
    border:     '#374151',
    surface:    '#1f2937',
    bg:         '#111827',
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
    { value: 'general',    label: 'Vista General'  },
    { value: 'movimientos',label: 'Movimientos'    },
    { value: 'cuadre',     label: 'Cuadre de Caja' },
    { value: 'arqueo',     label: 'Arqueo de Caja' },
    { value: 'caja_menor', label: 'Caja Menor'     },
  ];
  const filtroOptions = [
    { value: 'todos',   label: 'Todos'    },
    { value: 'entrada', label: 'Entradas' },
    { value: 'salida',  label: 'Salidas'  },
  ];

  /* ── Shared inline styles ── */
  const s = {
    page:    { fontFamily: "'Inter', -apple-system, sans-serif", background: colors.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' },

    // Header
    header:  { background: colors.surface, borderBottom: `1px solid ${colors.border}`, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
    iconBox: { width: 38, height: 38, borderRadius: 10, background: colors.blueLight, border: `1px solid ${colors.blueBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.blue, flexShrink: 0 },
    title:   { fontSize: 17, fontWeight: 700, color: colors.text, margin: 0 },
    sub:     { fontSize: 12, color: colors.textSub, margin: '2px 0 0' },

    // Controls
    controls:{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },

    // Pill (date / select inputs)
    pill:    { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, fontSize: 13, fontWeight: 600, color: colors.text, transition: 'border-color .15s, box-shadow .15s', whiteSpace: 'nowrap', cursor: 'default' },

    // Tab bar
    tabBar:  { display: 'flex', gap: 2, background: colors.bg, borderRadius: 8, padding: 3, border: `1px solid ${colors.border}` },
    tab:     (on) => ({ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all .15s', background: on ? colors.blue : 'transparent', color: on ? '#fff' : colors.textSub, boxShadow: on ? '0 1px 3px rgba(37,99,235,.2)' : 'none', fontFamily: 'inherit' }),

    // Content
    content: { flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 20 },

    // Cards
    panel:   { background: colors.surface, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,.04)' },
    panelHead: { padding: '13px 18px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    panelTitle:{ fontSize: 14, fontWeight: 600, color: colors.text, margin: 0 },

    // Grid (registro + movimientos)
    grid:    { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: 20 },

    // Filter bar
    filterBar: { padding: '12px 18px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    filterLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 5 },

    // Chips
    chip:    (on) => ({ padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, border: `1px solid ${on ? colors.blue : colors.border}`, background: on ? colors.blue : colors.surface, color: on ? '#fff' : colors.textSub, cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit' }),

    // Ghost btn
    btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'transparent', color: colors.textMid, border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit' },
  };

  return (
    <>
      <style>{STYLES}</style>
      <div style={s.page}>

        {/* ── HEADER ── */}
        <header style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={s.iconBox}><IcoCash /></div>
            <div>
              <h1 style={s.title}>Control de Caja</h1>
              <p style={s.sub}>
                {isAdmin ? 'Gestiona todos los movimientos y cuadres de caja' : 'Vista limitada a tu sucursal asignada'}
              </p>
            </div>
          </div>

          <div style={s.controls}>
            {/* Fecha */}
            <label className="caja-pill" style={s.pill}>
              <IcoCalendar />
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ color: colors.text }} />
            </label>

            {/* Sucursal (solo admin) */}
            {isAdmin && (
              <label className="caja-pill" style={s.pill}>
                <IcoBuilding />
                <select
                  value={sucursalSeleccionada || ''}
                  onChange={e => setSucursalSeleccionada(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={loadingSucursales}
                  style={{ color: colors.text }}
                >
                  <option value="">Todas las sedes</option>
                  {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
                <IcoChevron />
              </label>
            )}

            {/* Tab switcher */}
            <div style={s.tabBar}>
              {vistaOptions.map(o => (
                <button
                  key={o.value}
                  className={`caja-tab${vista === o.value ? ' caja-tab-active' : ''}`}
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
        <div style={s.content}>

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
              <div style={{ ...s.grid, marginTop: 20 }}>
                {/* Registro */}
                <div style={s.panel}>
                  <div style={s.panelHead}>
                    <p style={s.panelTitle}>Registrar Movimiento</p>
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
                <div style={s.panel}>
                  <div style={s.panelHead}>
                    <button className="caja-btn-ghost" style={s.btnGhost} onClick={handleRefresh}>
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
              <div style={s.panel}>
                <div style={s.filterBar}>
                  <span style={s.filterLabel}><IcoFilter /> Filtrar</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {filtroOptions.map(o => (
                      <button
                        key={o.value}
                        className={`caja-chip${filtroTipo === o.value ? ' caja-chip-active' : ''}`}
                        style={s.chip(filtroTipo === o.value)}
                        onClick={() => setFiltroTipo(o.value)}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <button className="caja-btn-ghost" style={{ ...s.btnGhost, marginLeft: 'auto' }} onClick={handleRefresh}>
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