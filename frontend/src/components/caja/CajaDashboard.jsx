/**
 * Dashboard de Caja — Rediseño moderno con Dark Mode
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { fetchEstadisticasCaja } from '../../services/api';
import { showToast } from '../../utils/toast';

const DASHBOARD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .caja-dash { font-family: 'Plus Jakarta Sans', sans-serif; }

  /* ── Light tokens ── */
  .caja-dash {
    --card-bg:      #ffffff;
    --card-border:  #dbeafe;
    --card-shadow:  0 1px 3px rgba(14,165,233,.06), 0 4px 16px rgba(14,165,233,.07);
    --card-hover:   0 2px 6px rgba(14,165,233,.08), 0 8px 28px rgba(14,165,233,.13);
    --label-color:  #94a3b8;
    --amount-color: #0f172a;
    --blob-opacity: 1;
    --skeleton-a:   #e0f2fe;
    --skeleton-b:   #f0f9ff;
  }

  /* ── Dark tokens ── */
  .caja-dash[data-theme="dark"] {
    --card-bg:      #0f1f35;
    --card-border:  #1e3a5f;
    --card-shadow:  0 1px 3px rgba(0,0,0,.3), 0 4px 16px rgba(0,0,0,.25);
    --card-hover:   0 2px 8px rgba(0,0,0,.4), 0 8px 28px rgba(0,0,0,.3);
    --label-color:  #4d7fa8;
    --amount-color: #e2e8f0;
    --blob-opacity: .35;
    --skeleton-a:   #1a3352;
    --skeleton-b:   #0f2237;
  }

  .caja-dash__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  @media (max-width: 1100px) { .caja-dash__grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 580px)  { .caja-dash__grid { grid-template-columns: 1fr; } }

  .caja-metric {
    position: relative;
    background: var(--card-bg);
    border-radius: 18px;
    padding: 22px 22px 18px;
    overflow: hidden;
    border: 1.5px solid var(--card-border);
    box-shadow: var(--card-shadow);
    transition: transform .22s ease, box-shadow .22s ease;
    cursor: default;
    animation: caja-slide-up .35s ease both;
  }
  .caja-metric:hover { transform: translateY(-3px); box-shadow: var(--card-hover); }
  .caja-metric:nth-child(1) { animation-delay: .00s; }
  .caja-metric:nth-child(2) { animation-delay: .07s; }
  .caja-metric:nth-child(3) { animation-delay: .14s; }
  .caja-metric:nth-child(4) { animation-delay: .21s; }

  .caja-metric::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 3px;
    border-radius: 18px 18px 0 0;
    background: var(--metric-bar, linear-gradient(90deg,#38bdf8,#7dd3fc));
  }
  .caja-metric::after {
    content: '';
    position: absolute;
    width: 120px; height: 120px;
    border-radius: 50%;
    right: -30px; bottom: -40px;
    background: var(--metric-blob, rgba(56,189,248,.07));
    opacity: var(--blob-opacity);
    pointer-events: none;
  }

  .caja-metric--blue  { --metric-bar: linear-gradient(90deg,#38bdf8,#7dd3fc); --metric-blob: rgba(56,189,248,.08); }
  .caja-metric--green { --metric-bar: linear-gradient(90deg,#10b981,#34d399); --metric-blob: rgba(16,185,129,.08); }
  .caja-metric--rose  { --metric-bar: linear-gradient(90deg,#f43f5e,#fb7185); --metric-blob: rgba(244,63,94,.08);  }
  .caja-metric--sky   { --metric-bar: linear-gradient(90deg,#0ea5e9,#38bdf8); --metric-blob: rgba(14,165,233,.08); }

  .caja-metric__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .caja-metric__label {
    font-size: 11.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .07em;
    color: var(--label-color); line-height: 1;
  }
  .caja-metric__icon {
    width: 38px; height: 38px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .caja-metric--blue  .caja-metric__icon { background: rgba(56,189,248,.15);  color: #0ea5e9; }
  .caja-metric--green .caja-metric__icon { background: rgba(16,185,129,.15);  color: #10b981; }
  .caja-metric--rose  .caja-metric__icon { background: rgba(244,63,94,.15);   color: #f43f5e; }
  .caja-metric--sky   .caja-metric__icon { background: rgba(14,165,233,.15);  color: #0284c7; }

  .caja-metric__amount {
    font-size: 26px; font-weight: 800;
    letter-spacing: -1px;
    color: var(--amount-color);
    line-height: 1.1; margin-bottom: 10px;
  }
  .caja-metric__amount--positive { color: #10b981; }
  .caja-metric__amount--negative { color: #f43f5e; }

  .caja-metric__footer { display: flex; align-items: center; gap: 6px; }
  .caja-metric__badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 700;
    padding: 3px 9px; border-radius: 20px;
  }
  .caja-metric__badge--up      { background: rgba(16,185,129,.15);  color: #059669; }
  .caja-metric__badge--down    { background: rgba(244,63,94,.15);   color: #e11d48; }
  .caja-metric__badge--neutral { background: rgba(14,165,233,.12);  color: #0284c7; }
  .caja-dash[data-theme="dark"] .caja-metric__badge--up      { background: rgba(16,185,129,.2);  color: #34d399; }
  .caja-dash[data-theme="dark"] .caja-metric__badge--down    { background: rgba(244,63,94,.2);   color: #fb7185; }
  .caja-dash[data-theme="dark"] .caja-metric__badge--neutral { background: rgba(14,165,233,.2);  color: #38bdf8; }

  .caja-metric__footer-text { font-size: 11.5px; font-weight: 500; color: var(--label-color); }

  @keyframes caja-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
  .caja-skeleton {
    background: linear-gradient(90deg, var(--skeleton-a) 25%, var(--skeleton-b) 50%, var(--skeleton-a) 75%);
    background-size: 800px 100%;
    animation: caja-shimmer 1.6s infinite linear;
    border-radius: 8px;
  }
  .caja-skeleton--amount { height: 34px; width: 65%; margin-bottom: 10px; }
  .caja-skeleton--badge  { height: 22px; width: 100px; border-radius: 20px; }

  @keyframes caja-slide-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const IconWallet = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
  </svg>
);
const IconArrowUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M7 11l5-5m0 0l5 5m-5-5v12"/>
  </svg>
);
const IconArrowDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M17 13l-5 5m0 0l-5-5m5 5V6"/>
  </svg>
);
const IconBalance = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);
const IconTrend = ({ up }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" width="11" height="11">
    {up
      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12l4-4 3 3 5-6"/>
      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 4l4 4 3-3 5 6"/>
    }
  </svg>
);

const fmt = (val) => {
  if (val == null) return '$0';
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
};

function MetricCard({ label, amount, amountClass, icon, variant, badge, badgeVariant, footerText, loading }) {
  return (
    <div className={`caja-metric caja-metric--${variant}`}>
      <div className="caja-metric__top">
        <span className="caja-metric__label">{label}</span>
        <div className="caja-metric__icon">{icon}</div>
      </div>
      {loading ? (
        <>
          <div className="caja-skeleton caja-skeleton--amount" />
          <div className="caja-skeleton caja-skeleton--badge" />
        </>
      ) : (
        <>
          <div className={`caja-metric__amount${amountClass ? ` caja-metric__amount--${amountClass}` : ''}`}>{amount}</div>
          <div className="caja-metric__footer">
            {badge && (
              <span className={`caja-metric__badge caja-metric__badge--${badgeVariant}`}>
                <IconTrend up={badgeVariant === 'up'} />{badge}
              </span>
            )}
            {footerText && <span className="caja-metric__footer-text">{footerText}</span>}
          </div>
        </>
      )}
    </div>
  );
}

export default function CajaDashboard({ fecha, isAdmin, idSucursal }) {
  const { usuario, tokenUsuario, subdominio } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState(null);

  useEffect(() => { cargarEstadisticas(); }, [fecha, isAdmin, idSucursal]);

  const cargarEstadisticas = async () => {
    setLoading(true);
    try {
      const params = { token: tokenUsuario, usuario, subdominio, fecha };
      if (idSucursal) params.id_sucursal = idSucursal;
      const response = await fetchEstadisticasCaja(params);
      if (response?.success) setEstadisticas(response.data);
    } catch (error) {
      console.error(error);
      showToast('error', 'Error al cargar las estadísticas de caja');
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
    <div className="caja-dash" data-theme={theme}>
      <style>{DASHBOARD_STYLES}</style>
      <div className="caja-dash__grid">
        <MetricCard label="Saldo Inicial"   amount={fmt(estadisticas?.saldo_inicial)}  icon={<IconWallet />}    variant="blue"  badge="Apertura" badgeVariant="neutral" footerText="del día"    loading={loading} />
        <MetricCard label="Total Entradas"  amount={fmt(estadisticas?.total_entradas)} amountClass="positive"  icon={<IconArrowUp />}   variant="green" badge={loading ? '' : `+${fmt(estadisticas?.total_entradas)}`} badgeVariant="up"   footerText="ingresos"  loading={loading} />
        <MetricCard label="Total Salidas"   amount={fmt(estadisticas?.total_salidas)}  amountClass="negative"  icon={<IconArrowDown />} variant="rose"  badge={loading ? '' : `-${fmt(estadisticas?.total_salidas)}`}  badgeVariant="down" footerText="egresos"   loading={loading} />
        <MetricCard label="Saldo Actual"    amount={fmt(estadisticas?.saldo_actual)}   amountClass={saldoSubida ? 'positive' : 'negative'} icon={<IconBalance />} variant="sky" badge={loading ? '' : (saldoSubida ? `+${fmt(diferencia)}` : fmt(diferencia))} badgeVariant={saldoSubida ? 'up' : 'down'} footerText="vs apertura" loading={loading} />
      </div>
    </div>
  );
}