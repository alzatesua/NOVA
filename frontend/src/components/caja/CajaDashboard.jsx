/**
 * Dashboard de Caja — Diseño Profesional
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchEstadisticasCaja } from '../../services/api';
import { showToast } from '../../utils/toast';

/* ─── Paleta ─────────────────────────────────────────────────────────── */
const C = {
  blue:        '#2563eb',
  blueLight:   '#eff6ff',
  blueBorder:  '#bfdbfe',
  text:        '#111827',
  textSub:     '#6b7280',
  textMuted:   '#9ca3af',
  border:      '#e5e7eb',
  surface:     '#ffffff',
  bg:          '#f9fafb',
  green:       '#2563eb',
  greenLight:  '#f0fdf4',
  greenBorder: '#bbf7d0',
  red:         '#dc2626',
  redLight:    '#fef2f2',
  redBorder:   '#fecaca',
  amber:       '#d97706',
  amberLight:  '#fffbeb',
  amberBorder: '#fde68a',
  // Dark mode - IGUAL QUE PROVEEDORESVIEW
  dark: {
    blue:        '#3b82f6',
    blueLight:   '#1e3a5f',
    blueBorder:  '#1e40af',
    text:        '#ffffff',
    textSub:     '#cbd5e1',
    textMuted:   '#94a3b8',
    border:      '#334155',
    surface:     '#0f172a',
    bg:          '#020617',
    green:       '#22c55e',
    greenLight:  '#14532d',
    greenBorder: '#166534',
    red:         '#ef4444',
    redLight:    '#450a0a',
    redBorder:   '#7f1d1d',
  }
};

/* ─── Formatter ───────────────────────────────────────────────────────── */
const fmt = (val) => {
  if (val == null) return '$0';
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
};

/* ─── Iconos ──────────────────────────────────────────────────────────── */
const IconWallet = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} width="18" height="18" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
  </svg>
);
const IconArrowUp = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} width="18" height="18" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 11l5-5m0 0l5 5m-5-5v12"/>
  </svg>
);
const IconArrowDown = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} width="18" height="18" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 13l-5 5m0 0l-5-5m5 5V6"/>
  </svg>
);
const IconBalance = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} width="18" height="18" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);
const IconTrendUp = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" width="10" height="10" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12l4-4 3 3 5-6"/>
  </svg>
);
const IconTrendDown = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" width="10" height="10" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l4 4 3-3 5 6"/>
  </svg>
);

/* ─── Skeleton ────────────────────────────────────────────────────────── */
const Skeleton = ({ w = '60%', h = 28, radius = 6 }) => (
  <div style={{
    width: w, height: h, borderRadius: radius,
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '400px 100%',
    animation: 'cd-shimmer 1.5s infinite linear',
  }} />
);

/* ─── MetricCard ──────────────────────────────────────────────────────── */
function MetricCard({ label, amount, icon, iconBg, iconColor, accentColor, badge, badgeUp, badgeNeutral, footerText, loading, delay = 0, colors = C, isDark = false }) {
  return (
    <div
      className="bg-white dark:!bg-slate-900 ring-1 ring-slate-200 dark:!ring-slate-700"
      style={{
        borderRadius: 12,
        borderLeft: `3px solid ${accentColor}`,
        padding: '18px 20px',
        boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,.04)',
        transition: 'box-shadow .15s, transform .15s',
        animation: `cd-slidein .3s ease ${delay}s both`,
        cursor: 'default',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,.04)'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted }} className="dark:!text-slate-400">
          {label}
        </span>
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {React.cloneElement(icon, { color: iconColor })}
        </div>
      </div>

      {/* Amount */}
      {loading ? (
        <>
          <Skeleton w="65%" h={30} radius={6} />
          <div style={{ marginTop: 10 }}><Skeleton w="100px" h={22} radius={20} /></div>
        </>
      ) : (
        <>
          <div style={{
            fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px',
            color: accentColor, lineHeight: 1.1, marginBottom: 10,
          }}>
            {amount}
          </div>

          {/* Footer badge + text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {badge && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999,
                background: badgeNeutral
                  ? colors.blueLight
                  : badgeUp ? colors.greenLight : colors.redLight,
                color: badgeNeutral
                  ? colors.blue
                  : badgeUp ? colors.green : colors.red,
              }}>
                {!badgeNeutral && (badgeUp ? <IconTrendUp /> : <IconTrendDown />)}
                {badge}
              </span>
            )}
            {footerText && (
              <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500 }} className="dark:!text-slate-400">{footerText}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── CajaDashboard ───────────────────────────────────────────────────── */
export default function CajaDashboard({ fecha, isAdmin, idSucursal, isDark = false }) {
  const { usuario, tokenUsuario, subdominio } = useAuth();
  const [loading,      setLoading]      = useState(true);
  const [estadisticas, setEstadisticas] = useState(null);

  // Dynamic colors
  const colors = isDark ? C.dark : C;

  useEffect(() => { cargarEstadisticas(); }, [fecha, isAdmin, idSucursal]);

  const cargarEstadisticas = async () => {
    setLoading(true);
    try {
      const params = { token: tokenUsuario, usuario, subdominio, fecha };
      if (idSucursal) params.id_sucursal = idSucursal;
      const response = await fetchEstadisticasCaja(params);
      if (response?.success) setEstadisticas(response.data);
    } catch (error) {
      // Si es un error de sesión expirada, no mostrar toast (el hook useSessionExpired se encarga)
      if (error?.isAuthError || error?.message === 'SESSION_EXPIRED') {
        console.warn('Sesión expirada, redirigiendo al login...');
        return;
      }

      // Para otros errores, mostrar el toast
      showToast('error', error?.message || 'Error al cargar las estadísticas de caja');
      setEstadisticas({ saldo_inicial: 0, total_entradas: 0, total_salidas: 0, saldo_actual: 0 });
    } finally {
      setLoading(false);
    }
  };

  const saldoActual  = parseFloat(estadisticas?.saldo_actual  ?? 0);
  const saldoInicial = parseFloat(estadisticas?.saldo_inicial ?? 0);
  const diferencia   = saldoActual - saldoInicial;
  const saldoSubida  = diferencia >= 0;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @keyframes cd-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        @keyframes cd-slidein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 20,
      }}>

        {/* Saldo Inicial */}
        <MetricCard
          label="Saldo Inicial"
          amount={fmt(estadisticas?.saldo_inicial)}
          icon={<IconWallet />}
          iconBg={colors.blueLight}
          iconColor={colors.blue}
          accentColor={colors.blue}
          badge="Apertura"
          badgeNeutral
          footerText="del día"
          loading={loading}
          delay={0}
          colors={colors}
          isDark={isDark}
        />

        {/* Total Entradas */}
        <MetricCard
          label="Total Entradas"
          amount={fmt(estadisticas?.total_entradas)}
          icon={<IconArrowUp />}
          iconBg={colors.greenLight}
          iconColor={colors.green}
          accentColor={colors.green}
          badge={loading ? '' : `+${fmt(estadisticas?.total_entradas)}`}
          badgeUp
          footerText="ingresos"
          loading={loading}
          delay={0.07}
          colors={colors}
          isDark={isDark}
        />

        {/* Total Salidas */}
        <MetricCard
          label="Total Salidas"
          amount={fmt(estadisticas?.total_salidas)}
          icon={<IconArrowDown />}
          iconBg={colors.redLight}
          iconColor={colors.red}
          accentColor={colors.red}
          badge={loading ? '' : `-${fmt(estadisticas?.total_salidas)}`}
          badgeUp={false}
          footerText="egresos"
          loading={loading}
          delay={0.14}
          colors={colors}
          isDark={isDark}
        />

        {/* Saldo Actual */}
        <MetricCard
          label="Saldo Actual"
          amount={fmt(estadisticas?.saldo_actual)}
          icon={<IconBalance />}
          iconBg={saldoSubida ? colors.greenLight : colors.redLight}
          iconColor={saldoSubida ? colors.green : colors.red}
          accentColor={saldoSubida ? colors.green : colors.red}
          badge={loading ? '' : (saldoSubida ? `+${fmt(diferencia)}` : fmt(diferencia))}
          badgeUp={saldoSubida}
          footerText="vs apertura"
          loading={loading}
          delay={0.21}
          colors={colors}
          isDark={isDark}
        />

      </div>
    </div>
  );
}