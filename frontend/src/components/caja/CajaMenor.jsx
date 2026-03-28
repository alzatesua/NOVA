/**
 * Vista de Caja Menor — Diseño Profesional
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { registrarMovimientoCaja } from '../../services/api';
import { showToast } from '../../utils/toast';
import { EyeIcon } from '@heroicons/react/24/outline';

/* ─── Paleta ─────────────────────────────────────────────────────────── */
const C = {
  blue:        '#2563eb',
  blueDark:    '#1d4ed8',
  blueLight:   '#eff6ff',
  blueBorder:  '#bfdbfe',
  text:        '#111827',
  textMid:     '#374151',
  textSub:     '#6b7280',
  textMuted:   '#9ca3af',
  border:      '#e5e7eb',
  surface:     '#ffffff',
  bg:          '#f9fafb',
  green:       '#1d4ed8',
  greenLight:  '#f0fdf4',
  greenBorder: '#bbf7d0',
  red:         '#dc2626',
  redLight:    '#fef2f2',
  redBorder:   '#fecaca',
  // Dark mode - IGUAL QUE PROVEEDORESVIEW
  dark: {
    blue:        '#3b82f6',
    blueDark:    '#2563eb',
    blueLight:   '#1e3a5f',
    blueBorder:  '#1e40af',
    text:        '#ffffff',
    textMid:     '#e2e8f0',
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

/* ─── Datos estáticos ─────────────────────────────────────────────────── */
const CATEGORIAS = {
  entrada: [
    { value: 'reembolso_caja_menor',    label: 'Reembolso'    },
    { value: 'venta_caja_menor',        label: 'Venta'        },
    { value: 'abono_caja_menor',        label: 'Abono'        },
    { value: 'otra_entrada_caja_menor', label: 'Otra entrada' },
  ],
  salida: [
    { value: 'compra_caja_menor',       label: 'Compra'       },
    { value: 'gasto_caja_menor',        label: 'Gasto'        },
    { value: 'pago_caja_menor',         label: 'Pago'         },
    { value: 'otra_salida_caja_menor',  label: 'Otra salida'  },
  ],
};
const CATS_CON_SOPORTE = ['compra_caja_menor', 'pago_caja_menor'];

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(parseFloat(n || 0));

const catLabel = (v = '') =>
  v.replace(/_caja_menor$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const fmtDatetime = (str) => {
  const d = new Date(str);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};

/* ─── Iconos ──────────────────────────────────────────────────────────── */
const IcoArrowUp = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} width="17" height="17" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 11l5-5m0 0l5 5m-5-5v12"/>
  </svg>
);
const IcoArrowDown = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} width="17" height="17" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 13l-5 5m0 0l-5-5m5 5V6"/>
  </svg>
);
const IcoBalance = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} width="17" height="17" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);
const IcoRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="13" height="13" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
  </svg>
);
const IcoWarning = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="15" height="15" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
  </svg>
);
const IcoPlus = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" width="13" height="13" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 4v12M4 10h12"/>
  </svg>
);
const IcoMinus = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" width="13" height="13" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 10h12"/>
  </svg>
);
const IcoUpload = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" width="14" height="14" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 16v1a1 1 0 001 1h10a1 1 0 001-1v-1M8 10l4-4m0 0l4 4m-4-4v8"/>
  </svg>
);
const IcoCheck = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" width="12" height="12" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 10l3 3 7-7"/>
  </svg>
);
const IcoSpinner = ({ gray }) => (
  <div style={{
    width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
    border: `2px solid ${gray ? C.border : 'rgba(255,255,255,.35)'}`,
    borderTopColor: gray ? C.textSub : '#fff',
    animation: 'cm-spin .7s linear infinite',
  }} />
);

/* ─── KPI Card ────────────────────────────────────────────────────────── */
function KpiCard({ label, amount, icon, iconBg, iconColor, accent, badge, badgeUp, badgeNeutral, delay = 0, colors = C }) {
  return (
    <div
      className="bg-white dark:!bg-slate-900 ring-1 ring-slate-200 dark:!ring-slate-700"
      style={{
        borderRadius: 12,
        borderLeft: `3px solid ${accent}`,
        padding: '16px 18px',
        boxShadow: '0 1px 2px rgba(0,0,0,.04)',
        animation: `cm-slidein .3s ease ${delay}s both`,
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted }} className="dark:!text-slate-400">
          {label}
        </span>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {React.cloneElement(icon, { color: iconColor })}
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: accent, lineHeight: 1.1, marginBottom: 8 }}>
        {amount}
      </div>
      {badge && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999,
          background: badgeNeutral ? colors.blueLight : badgeUp ? colors.greenLight : colors.redLight,
          color: badgeNeutral ? colors.blue : badgeUp ? colors.green : colors.red,
        }}>
          {badge}
        </span>
      )}
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────── */
export default function CajaMenor({ fecha, idSucursal, onRefresh, isDark = false }) {
  const { usuario, tokenUsuario, subdominio, isAdmin } = useAuth();

  const [tipo,        setTipo]        = useState(isAdmin ? 'entrada' : 'salida');
  const [monto,       setMonto]       = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria,   setCategoria]   = useState('');
  const [soporte,     setSoporte]     = useState(null);
  const [previewUrl,  setPreviewUrl]  = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [balance,     setBalance]     = useState({ ingresos: 0, egresos: 0, total: 0 });
  const [modalSoporte,       setModalSoporte]       = useState(false);
  const [soporteSeleccionado, setSoporteSeleccionado] = useState(null);

  // Dynamic colors
  const colors = isDark ? C.dark : C;

  useEffect(() => { cargar(); }, [fecha, idSucursal]);
  useEffect(() => { setCategoria(''); }, [tipo]);

  const cargar = async () => {
    setLoading(true);
    try {
      // Para usuarios no-admin, siempre usar su sucursal asignada
      // Para admin, usar la sucursal seleccionada o null para ver todas
      const sucursalId = isAdmin ? (idSucursal || null) : (idSucursal);

      // Obtener balance acumulado de caja menor (todos los movimientos históricos)
      const balanceRes = await fetch('https://dagi.co/api/caja/balance_caja_menor/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenUsuario, usuario, subdominio, id_sucursal: sucursalId }),
      });

      // Obtener movimientos del día actual para la tabla
      const movsRes = await fetch('https://dagi.co/api/caja/movimientos_caja_menor/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenUsuario, usuario, subdominio, fecha, id_sucursal: sucursalId }),
      });

      if (balanceRes.ok && movsRes.ok) {
        const balanceData = await balanceRes.json();
        const movsData = await movsRes.json();

        const movs = movsData.movimientos || [];
        setMovimientos(movs);

        // Usar el balance acumulado del endpoint específico
        if (balanceData.balance) {
          setBalance({
            ingresos: parseFloat(balanceData.balance.ingresos),
            egresos: parseFloat(balanceData.balance.egresos),
            total: parseFloat(balanceData.balance.total)
          });
        }
      } else if (balanceRes.status === 401 || movsRes.status === 401) {
        // Si es un error 401, limpiar tokens y disparar evento de sesión expirada
        console.warn('Error 401 detectado en CajaMenor');
        localStorage.removeItem('auth_access_token');
        localStorage.removeItem('auth_refresh_token');
        localStorage.removeItem('auth_usuario');
        localStorage.removeItem('token_usuario');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refresh_token');

        window.dispatchEvent(new CustomEvent('session:expired', {
          detail: { message: 'SESSION_EXPIRED', isAuthError: true }
        }));
        return;
      }
    } catch (err) {
      // Si es un error de sesión expirada, no mostrar toast
      if (err?.isAuthError || err?.message === 'SESSION_EXPIRED') {
        console.warn('Sesión expirada, redirigiendo al login...');
        return;
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) { setSoporte(null); setPreviewUrl(''); return; }
    if (!file.type.startsWith('image/')) { showToast('error', 'Selecciona una imagen válida'); return; }
    if (file.size > 5 * 1024 * 1024)    { showToast('error', 'La imagen no puede superar 5MB'); return; }
    setSoporte(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!monto || parseFloat(monto) <= 0) return showToast('error', 'Ingresa un monto válido');
    if (!descripcion.trim())              return showToast('error', 'Ingresa una descripción');
    if (!categoria)                       return showToast('error', 'Selecciona una categoría');
    if (tipo === 'salida' && balance.total <= 0) return showToast('error', 'No hay saldo disponible en caja menor');
    if (tipo === 'salida' && parseFloat(monto) > balance.total) return showToast('error', `Saldo insuficiente. Disponible: ${fmt(balance.total)}`);
    if (tipo === 'salida' && !soporte)    return showToast('error', 'El soporte de pago es obligatorio para todas las salidas de caja menor');

    setSubmitting(true);
    try {
      const res = await registrarMovimientoCaja({
        token: tokenUsuario, usuario, subdominio, tipo,
        monto: parseFloat(monto), descripcion: descripcion.trim(),
        metodo_pago: 'efectivo', categoria,
        id_sucursal: idSucursal || null,
        es_caja_menor: true,
        soporte_pago: soporte,
      });
      if (res.success) {
        showToast('success', `${tipo === 'entrada' ? 'Ingreso' : 'Egreso'} registrado exitosamente`);
        setMonto(''); setDescripcion(''); setCategoria('');
        setSoporte(null); setPreviewUrl('');
        cargar();
        if (onRefresh) onRefresh();
      } else {
        showToast('error', res.message || 'Error al registrar');
      }
    } catch (err) {
      // Si es un error de sesión expirada, no mostrar toast (el hook useSessionExpired se encarga)
      if (err?.isAuthError || err?.message === 'SESSION_EXPIRED') {
        console.warn('Sesión expirada, redirigiendo al login...');
        return;
      }

      showToast('error', err?.message || 'Error al registrar el movimiento');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Shared styles ── */
  const s = {
    panel:     { borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,.04)' },
    panelHead: { padding: '13px 18px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    panelTitle:{ fontSize: 14, fontWeight: 600, color: colors.text, margin: 0 },
    lbl:       { display: 'block', fontSize: 12, fontWeight: 600, color: colors.textMid, marginBottom: 5 },
    input:     { width: '100%', padding: '9px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s' },
    field:     { marginBottom: 13 },
    btnGhost:  { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'transparent', color: colors.textMid, border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' },
  };

  const saldoInsuficiente = tipo === 'salida' && balance.total <= 0;
  const accentTipo = tipo === 'entrada' ? C.green : C.red;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @keyframes cm-spin    { to { transform: rotate(360deg); } }
        @keyframes cm-slidein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .cm-row-hover:hover { background: ${C.bg}; }
        .cm-input-f:focus { border-color: ${C.blue} !important; box-shadow: 0 0 0 3px ${C.blue}22 !important; }
        .cm-type-btn:hover:not(.cm-type-active) { background: ${C.bg}; color: ${C.textMid}; }
        .cm-file-zone:hover { border-color: ${C.blue}; background: ${C.blueLight}; }
        .cm-btn-ghost:hover { background: ${C.blueLight}; border-color: ${C.blue}; color: ${C.blue}; }
        .cm-submit:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
        .cm-submit:disabled { opacity: .55; cursor: not-allowed !important; transform: none !important; }
        @media (max-width: 860px) { .cm-main-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 900px) { .cm-kpi-grid { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>

      {/* ── KPI Cards ── */}
      <div className="cm-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
        <KpiCard
          label="Total Ingresos"
          amount={fmt(balance.ingresos)}
          icon={<IcoArrowUp />}
          iconBg={colors.greenLight} iconColor={colors.green} accent={colors.green}
          badge={`+${fmt(balance.ingresos)} ingresos`} badgeUp
          delay={0}
          colors={colors}
        />
        <KpiCard
          label="Total Egresos"
          amount={fmt(balance.egresos)}
          icon={<IcoArrowDown />}
          iconBg={colors.redLight} iconColor={colors.red} accent={colors.red}
          badge={`-${fmt(balance.egresos)} egresos`} badgeUp={false}
          delay={0.07}
          colors={colors}
        />
        <KpiCard
          label="Disponible"
          amount={fmt(balance.total)}
          icon={<IcoBalance />}
          iconBg={balance.total > 0 ? colors.blueLight : colors.redLight}
          iconColor={balance.total > 0 ? colors.blue : colors.red}
          accent={balance.total > 0 ? colors.blue : colors.red}
          badge={balance.total <= 0 ? 'Sin saldo disponible' : `${fmt(balance.total)} disponible`}
          badgeNeutral={balance.total > 0}
          badgeUp={false}
          delay={0.14}
          colors={colors}
        />
      </div>

      {/* ── Advertencia saldo insuficiente ── */}
      {balance.total <= 0 && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '13px 16px', marginBottom: 18,
          background: colors.redLight, border: `1px solid ${colors.redBorder}`,
          borderRadius: 10, color: colors.red,
        }}>
          <IcoWarning />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Saldo insuficiente en Caja Menor</p>
            <p style={{ fontSize: 12, color: colors.textSub, margin: '3px 0 0' }}>
              No hay saldo para registrar salidas. Solicita un reabastecimiento al administrador.
            </p>
          </div>
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="cm-main-grid" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Formulario ── */}
        <div style={s.panel} className="bg-white dark:!bg-slate-900 ring-1 ring-slate-200 dark:!ring-slate-700">
          <div style={s.panelHead}>
            <p style={s.panelTitle} className="dark:!text-white">Registrar Movimiento</p>
            <span style={{ fontSize: 11, color: C.textMuted }}>Caja Menor</span>
          </div>
          <div style={{ padding: 16 }}>

            {/* Toggle tipo */}
            <div style={{
              display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr',
              gap: 4, background: colors.bg, border: `1px solid ${colors.border}`,
              borderRadius: 9, padding: 3, marginBottom: 16,
            }}>
              {isAdmin && (
                <button
                  type="button"
                  className={`cm-type-btn${tipo === 'entrada' ? ' cm-type-active' : ''}`}
                  onClick={() => setTipo('entrada')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 600, transition: 'all .15s',
                    background: tipo === 'entrada' ? colors.green : 'transparent',
                    color: tipo === 'entrada' ? '#fff' : colors.textSub,
                    boxShadow: tipo === 'entrada' ? '0 2px 8px rgba(22,163,74,.25)' : 'none',
                  }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: tipo === 'entrada' ? 'rgba(255,255,255,.2)' : `${colors.green}18`, color: tipo === 'entrada' ? '#fff' : colors.green, flexShrink: 0 }}>
                    <IcoPlus />
                  </span>
                  Entrada
                </button>
              )}
              <button
                type="button"
                className={`cm-type-btn${tipo === 'salida' ? ' cm-type-active' : ''}`}
                onClick={() => setTipo('salida')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 600, transition: 'all .15s',
                  background: tipo === 'salida' ? colors.red : 'transparent',
                  color: tipo === 'salida' ? '#fff' : colors.textSub,
                  boxShadow: tipo === 'salida' ? '0 2px 8px rgba(220,38,38,.25)' : 'none',
                }}
              >
                <span style={{ width: 18, height: 18, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: tipo === 'salida' ? 'rgba(255,255,255,.2)' : `${colors.red}18`, color: tipo === 'salida' ? '#fff' : colors.red, flexShrink: 0 }}>
                  <IcoMinus />
                </span>
                Salida
              </button>
            </div>

            {/* Aviso no-admin */}
            {!isAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 11px', background: colors.redLight, border: `1px solid ${colors.redBorder}`, borderRadius: 8, marginBottom: 14 }}>
                <IcoWarning />
                <span style={{ fontSize: 12, color: colors.red, fontWeight: 500 }}>Solo administradores pueden registrar entradas</span>
              </div>
            )}

            {/* Monto */}
            <div style={s.field}>
              <label style={s.lbl}>Monto <span style={{ color: colors.red }}>*</span></label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: 12, fontSize: 13, fontWeight: 700, color: colors.textSub, pointerEvents: 'none' }}>$</span>
                <input
                  type="number" placeholder="0.00" min="0" step="1"
                  value={monto} onChange={e => setMonto(e.target.value)}
                  className="cm-input-f dark:!bg-slate-800 dark:!text-white dark:!border-slate-600"
                  style={{ ...s.input, paddingLeft: 26, fontSize: 15, fontWeight: 700 }}
                />
              </div>
              {tipo === 'salida' && monto && parseFloat(monto) > balance.total && balance.total > 0 && (
                <p style={{ fontSize: 11, color: colors.red, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IcoWarning /> Excede el saldo disponible ({fmt(balance.total)})
                </p>
              )}
            </div>

            {/* Categoría */}
            <div style={s.field}>
              <label style={s.lbl}>Categoría <span style={{ color: colors.red }}>*</span></label>
              <select
                className="cm-input-f dark:!bg-slate-800 dark:!text-white dark:!border-slate-600"
                value={categoria} onChange={e => setCategoria(e.target.value)}
                style={{ ...s.input, cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 34, appearance: 'none', WebkitAppearance: 'none' }}
              >
                <option value="">Seleccionar categoría…</option>
                {CATEGORIAS[tipo].map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* Descripción */}
            <div style={s.field}>
              <label style={s.lbl}>Descripción <span style={{ color: colors.red }}>*</span></label>
              <textarea
                rows={3} placeholder="Describe el motivo del movimiento…"
                value={descripcion} onChange={e => setDescripcion(e.target.value)}
                className="cm-input-f dark:!bg-slate-800 dark:!text-white dark:!border-slate-600"
                style={{ ...s.input, resize: 'vertical', lineHeight: 1.55, minHeight: 76 }}
              />
            </div>

            {/* Soporte (solo salidas) */}
            {tipo === 'salida' && (
              <div style={s.field}>
                <label style={s.lbl}>
                  Soporte de Pago <span style={{ color: colors.red }}>*</span>
                </label>
                <input type="file" accept="image/*" id="cm-file" onChange={handleFile} style={{ display: 'none' }} />
                <label
                  htmlFor="cm-file"
                  className="cm-file-zone dark:!bg-slate-800"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    width: '100%', padding: '10px 12px', borderRadius: 8, boxSizing: 'border-box',
                    border: `1px dashed ${soporte ? colors.green : colors.border}`,
                    background: soporte ? colors.greenLight : '',
                    color: soporte ? colors.green : colors.textMuted,
                    fontSize: 13, fontWeight: soporte ? 600 : 400,
                    cursor: 'pointer', transition: 'all .15s',
                  }}
                >
                  {soporte ? <><IcoCheck /> {soporte.name}</> : <><IcoUpload /> Subir comprobante</>}
                </label>
                {!soporte && (
                  <p style={{ fontSize: 11, color: colors.red, margin: '4px 0 0', fontWeight: 600 }}>
                    * El soporte es obligatorio para todas las salidas
                  </p>
                )}
                {previewUrl && (
                  <div style={{ marginTop: 8, position: 'relative' }}>
                    <img src={previewUrl} alt="Vista previa" style={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 8, border: `1px solid ${colors.border}` }} />
                    <button
                      type="button"
                      onClick={() => { setSoporte(null); setPreviewUrl(''); }}
                      style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: '50%', background: colors.red, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >×</button>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="button"
              className="cm-submit"
              onClick={submit}
              disabled={submitting || saldoInsuficiente}
              style={{
                width: '100%', padding: '11px 16px', borderRadius: 9,
                fontFamily: 'inherit', fontSize: 13, fontWeight: 700, border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: accentTipo, color: '#fff',
                boxShadow: `0 3px 10px ${accentTipo}44`,
                cursor: saldoInsuficiente ? 'not-allowed' : 'pointer',
                transition: 'all .15s', marginTop: 4,
              }}
            >
              {submitting
                ? <><IcoSpinner /> Registrando…</>
                : tipo === 'entrada' ? '+ Registrar Ingreso' : '− Registrar Egreso'
              }
            </button>

            {saldoInsuficiente && (
              <p style={{ fontSize: 11, color: colors.red, textAlign: 'center', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <IcoWarning /> Necesitas saldo disponible para registrar egresos
              </p>
            )}
          </div>
        </div>

        {/* ── Tabla movimientos ── */}
        <div style={s.panel} className="bg-white dark:!bg-slate-900 ring-1 ring-slate-200 dark:!ring-slate-700">
          <div style={s.panelHead}>
            <p style={s.panelTitle} className="dark:!text-white">Movimientos de Caja Menor</p>
            <button className="cm-btn-ghost" style={s.btnGhost} onClick={cargar} disabled={loading}>
              {loading ? <><IcoSpinner gray /> Cargando</> : <><IcoRefresh /> Actualizar</>}
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <IcoSpinner gray />
              <p style={{ color: colors.textMuted, fontSize: 13, marginTop: 10 }}>Cargando movimientos…</p>
            </div>
          ) : movimientos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '52px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.35 }}>
                    <rect x="6" y="4" width="24" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <rect x="13" y="2" width="10" height="5" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <line x1="11" y1="14" x2="25" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="11" y1="19" x2="25" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="11" y1="24" x2="19" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p style={{ fontSize: 13, color: colors.textMid, fontWeight: 600, margin: 0 }}>Sin movimientos registrados</p>
                <p style={{ fontSize: 12, color: colors.textMuted, margin: '4px 0 0' }}>Los movimientos aparecerán aquí</p>
              </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    {['Fecha / Hora', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Soporte', 'Usuario'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map(mov => (
                    <tr key={mov.id} className="cm-row-hover" style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: colors.textMuted, whiteSpace: 'nowrap' }}>
                        {fmtDatetime(mov.fecha_hora)}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                          background: mov.tipo === 'entrada' ? colors.green : colors.red, color: '#fff',
                        }}>
                          {mov.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className="dark:!bg-slate-800 dark:!border-slate-600" style={{ fontSize: 12, fontWeight: 500, color: colors.textSub, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap' }}>
                          {catLabel(mov.categoria)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', maxWidth: 180 }}>
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: colors.textMid, fontSize: 13 }} title={mov.descripcion}>
                          {mov.descripcion}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', color: mov.tipo === 'entrada' ? colors.green : colors.red }}>
                        {mov.tipo === 'entrada' ? '+' : '-'}{fmt(mov.monto)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {mov.soporte_pago_url ? (
                          <button
                            onClick={() => { setSoporteSeleccionado(mov.soporte_pago_url); setModalSoporte(true); }}
                            style={{ background: colors.blueLight, border: `1px solid ${colors.blueBorder}`, borderRadius: 7, padding: '5px 7px', cursor: 'pointer', color: colors.blue, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = colors.blue; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = colors.blueLight; e.currentTarget.style.color = colors.blue; }}
                          >
                            <EyeIcon style={{ width: 14, height: 14 }} />
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: colors.textMuted }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: colors.textMuted, whiteSpace: 'nowrap' }}>
                        {(mov.usuario_nombre || mov.usuario || '').split(' ')[0]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Soporte ── */}
      {modalSoporte && soporteSeleccionado && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div className="bg-white dark:!bg-slate-900" style={{ borderRadius: 14, boxShadow: '0 20px 50px rgba(0,0,0,.16)', maxWidth: 780, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: colors.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 15 }}>📄</span>
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: colors.text, margin: 0 }} className="dark:!text-white">Soporte de Pago</p>
                  <p style={{ fontSize: 12, color: colors.textSub, margin: '1px 0 0' }} className="dark:!text-slate-400">Comprobante del movimiento</p>
                </div>
              </div>
              <button onClick={() => { setModalSoporte(false); setSoporteSeleccionado(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: 4, borderRadius: 6 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="17" height="17" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            {/* Body */}
            <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {soporteSeleccionado.toLowerCase().endsWith('.pdf') ? (
                <object data={soporteSeleccionado} type="application/pdf" style={{ width: '100%', minHeight: 500, borderRadius: 9, border: `1px solid ${colors.border}` }}>
                  <div style={{ textAlign: 'center', padding: 28 }}>
                    <p style={{ color: colors.textSub, marginBottom: 12 }}>No se puede previsualizar el PDF</p>
                    <a href={soporteSeleccionado} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: colors.blue, color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
                      Abrir PDF
                    </a>
                  </div>
                </object>
              ) : (
                <img src={soporteSeleccionado} alt="Soporte" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 9, border: `1px solid ${colors.border}`, boxShadow: '0 4px 16px rgba(0,0,0,.07)' }} />
              )}
            </div>
            {/* Footer */}
            <div style={{ padding: '13px 20px', borderTop: `1px solid ${colors.border}`, display: 'flex', gap: 9, justifyContent: 'flex-end', flexShrink: 0 }}>
              <a href={soporteSeleccionado} download={`soporte_${Date.now()}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 15px', background: colors.blue, color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
                Descargar
              </a>
              <button onClick={() => { setModalSoporte(false); setSoporteSeleccionado(null); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 15px', background: 'transparent', color: colors.textMid, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}