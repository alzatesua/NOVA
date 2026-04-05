/**
 * Formulario para Registrar Movimientos de Caja — Diseño Profesional
 */
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { registrarMovimientoCaja } from '../../services/api';
import { showToast } from '../../utils/toast';

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
  green:      '#2563eb',
  greenDark:  '#2563eb',
  greenLight: '#f0fdf4',
  greenBorder:'#bbf7d0',
  red:        '#dc2626',
  redDark:    '#b91c1c',
  redLight:   '#fef2f2',
  redBorder:  '#fecaca',
  // Dark mode
  dark: {
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
    green:      '#22c55e',
    greenDark:  '#16a34a',
    greenLight: '#14532d',
    greenBorder:'#166534',
    red:        '#ef4444',
    redDark:    '#dc2626',
    redLight:   '#7f1d1d',
    redBorder:  '#991b1b',
  }
};

/* ─── Iconos ──────────────────────────────────────────────────────────── */
const IcoPlus = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" width="14" height="14" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 4v12M4 10h12"/>
  </svg>
);
const IcoMinus = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" width="14" height="14" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 10h12"/>
  </svg>
);
const IcoChevron = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" width="15" height="15" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 7.5l5 5 5-5"/>
  </svg>
);
const IcoUpload = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" width="15" height="15" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 16v1a1 1 0 001 1h10a1 1 0 001-1v-1M8 10l4-4m0 0l4 4m-4-4v8"/>
  </svg>
);
const IcoCheck = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" width="13" height="13" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 10l3 3 7-7"/>
  </svg>
);
const IcoSpinner = () => (
  <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'rm-spin .7s linear infinite', flexShrink: 0 }} />
);

/* ─── Datos estáticos ─────────────────────────────────────────────────── */
const METODOS = [
  { value: 'efectivo',      label: 'Efectivo'      },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'nequi',         label: 'Nequi'         },
  { value: 'daviplata',     label: 'Daviplata'     },
  { value: 'tarjeta',       label: 'Tarjeta'       },
  { value: 'otro',          label: 'Otro'          },
];
const CATEGORIAS = {
  entrada: [
    { value: 'venta',           label: 'Venta'           },
    { value: 'abono',           label: 'Abono'           },
    { value: 'ajuste_positivo', label: 'Ajuste Positivo' },
    { value: 'otra_entrada',    label: 'Otra Entrada'    },
  ],
  salida: [
    { value: 'compra',          label: 'Compra'          },
    { value: 'gasto',           label: 'Gasto'           },
    { value: 'retiro',          label: 'Retiro'          },
    { value: 'reembolso',       label: 'Reembolso'       },
    { value: 'devolucion',      label: 'Devolución'      },
    { value: 'ajuste_negativo', label: 'Ajuste Negativo' },
    { value: 'otra_salida',     label: 'Otra Salida'     },
  ],
};

/* ─── Custom Dropdown ─────────────────────────────────────────────────── */
function Dropdown({ value, onChange, options, placeholder = 'Seleccionar…', colors = C, isDark = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative select-none">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg cursor-pointer font-sans text-sm transition-all duration-150 border
          ${selected ? 'font-medium' : 'font-normal'}
          ${open
            ? 'border-blue-500 bg-white dark:!bg-slate-800 text-gray-900 dark:!text-white ring-2 ring-blue-500/20'
            : 'border-gray-300 dark:!border-slate-600 bg-white dark:!bg-slate-800 text-gray-900 dark:!text-white'
          }
        `}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <span className="text-gray-400 dark:!text-slate-500 transition-transform duration-180 flex" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
          <IcoChevron />
        </span>
      </button>

      {open && (
        <div className="absolute top-1.5 left-0 right-0 z-[9999] bg-white dark:!bg-slate-900 border border-gray-200 dark:!border-slate-700 rounded-xl shadow-lg overflow-hidden animate-[rm-fadein_0.14s_ease_both]">
          {options.map((o, i) => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`px-3 py-2.5 text-sm cursor-pointer transition-colors duration-100
                ${value === o.value
                  ? 'font-semibold bg-blue-600 text-white'
                  : 'font-normal text-gray-700 dark:!text-slate-300 hover:bg-blue-50 dark:hover:!bg-blue-900/20'
                }
                ${i === 0 ? 'rounded-t-xl' : ''}
                ${i === options.length - 1 ? 'rounded-b-xl' : ''}
              `}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Componente principal ────────────────────────────────────────────── */
export default function RegistroMovimiento({ idSucursal, onRegistroExitoso, isDark = false }) {
  const { usuario, tokenUsuario, subdominio } = useAuth();

  const [tipo,        setTipo]        = useState('entrada');
  const [monto,       setMonto]       = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [metodoPago,  setMetodoPago]  = useState('efectivo');
  const [categoria,   setCategoria]   = useState('');
  const [soporte,     setSoporte]     = useState(null);
  const [previewUrl,  setPreviewUrl]  = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  // Dynamic colors
  const colors = isDark ? C.dark : C;

  const handleTipo = (t) => { setTipo(t); setCategoria(''); };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) { setSoporte(null); setPreviewUrl(''); return; }
    if (!file.type.startsWith('image/')) { showToast('error', 'Selecciona un archivo de imagen válido'); return; }
    if (file.size > 5 * 1024 * 1024)    { showToast('error', 'La imagen no puede ser mayor a 5MB'); return; }
    setSoporte(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monto || parseFloat(monto) <= 0) return showToast('error', 'Ingresa un monto válido');
    if (!descripcion.trim())              return showToast('error', 'Ingresa una descripción');
    if (!categoria)                       return showToast('error', 'Selecciona una categoría');
    if (metodoPago !== 'efectivo' && !soporte) return showToast('error', 'Adjunta el comprobante de pago');

    setSubmitting(true);
    try {
      const params = {
        token: tokenUsuario, usuario, subdominio,
        tipo, monto: parseFloat(monto),
        descripcion: descripcion.trim(),
        metodo_pago: metodoPago, categoria,
        id_sucursal: idSucursal || null,
        sucursal: idSucursal || null,
        soporte_pago: soporte,
      };
      const response = await registrarMovimientoCaja(params);
      if (response.success) {
        showToast('success', 'Movimiento registrado exitosamente');
        setMonto(''); setDescripcion(''); setCategoria('');
        setSoporte(null); setPreviewUrl('');
        if (onRegistroExitoso) onRegistroExitoso();
      } else {
        let msg = response.message || 'Error al registrar el movimiento';
        if (!response.message && response.data && typeof response.data === 'object') {
          msg = Object.entries(response.data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('. ');
        }
        showToast('error', msg);
      }
    } catch (err) {
      // Si es un error de sesión expirada, no mostrar toast (el hook useSessionExpired se encarga)
      if (err?.isAuthError || err?.message === 'SESSION_EXPIRED') {
        console.warn('Sesión expirada, redirigiendo al login...');
        return;
      }

      const d = err.response?.data;
      let msg = d?.message || d?.detail || err?.message || 'Error al registrar el movimiento';
      if (!msg && d && typeof d === 'object') {
        msg = Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('. ');
      }
      showToast('error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const esEntrada = tipo === 'entrada';

  /* ── Colores dinámicos según tipo ── */
  const accent      = esEntrada ? colors.green    : colors.red;
  const accentDark  = esEntrada ? colors.greenDark: colors.redDark;
  const accentLight = esEntrada ? colors.greenLight: colors.redLight;
  const accentBorder= esEntrada ? colors.greenBorder: colors.redBorder;

  const s = {
    lbl:   { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 },
    input: { width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s' },
    field: { marginBottom: 14 },
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @keyframes rm-spin    { to { transform: rotate(360deg); } }
        @keyframes rm-fadein  { from { opacity:0; transform:translateY(-5px); } to { opacity:1; transform:translateY(0); } }
        .rm-input-focus:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.15) !important; }
        .rm-type-btn:hover { opacity: .85; }
        .rm-submit-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .rm-submit-btn:disabled { opacity: .6; cursor: not-allowed; }
      `}</style>

      {/* ── Toggle Entrada / Salida ── */}
      <div className="grid grid-cols-2 gap-1.5 p-1 mb-5 rounded-xl bg-gray-100 dark:!bg-slate-800 border border-gray-200 dark:!border-slate-700">
        {[
          { value: 'entrada', label: 'Entrada', icon: <IcoPlus />,  bg: 'bg-green-600 dark:!bg-green-600',  shadow: 'shadow-green-600/25' },
          { value: 'salida',  label: 'Salida',  icon: <IcoMinus />, bg: 'bg-red-600 dark:!bg-red-600',    shadow: 'shadow-red-600/25'  },
        ].map(opt => {
          const active = tipo === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              className="rm-type-btn flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-none cursor-pointer font-sans text-sm font-semibold transition-all duration-150"
              style={{
                background: active ? (opt.value === 'entrada' ? '#16a34a' : '#dc2626') : 'transparent',
                color: active ? '#fff' : isDark ? '#cbd5e1' : '#6b7280',
                boxShadow: active ? (opt.value === 'entrada' ? '0 2px 8px rgba(22,163,74,.25)' : '0 2px 8px rgba(220,38,38,.25)') : 'none',
              }}
              onClick={() => handleTipo(opt.value)}
            >
              <span
                className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center"
                style={{
                  background: active ? 'rgba(255,255,255,.2)' : (opt.value === 'entrada' ? 'rgba(22,163,74,.1)' : 'rgba(220,38,38,.1)'),
                  color: active ? '#fff' : (opt.value === 'entrada' ? '#16a34a' : '#dc2626'),
                }}
              >
                {opt.icon}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="h-px bg-gray-200 dark:!bg-slate-700 mb-4.5" />

      <form onSubmit={handleSubmit}>

        {/* Monto */}
        <div style={s.field}>
          <label className="block text-xs font-semibold text-gray-700 dark:!text-slate-400 mb-1.5">
            Monto <span className="text-red-500">*</span>
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-sm font-bold text-gray-500 dark:!text-slate-500 pointer-events-none select-none">$</span>
            <input
              type="number" placeholder="0.00" min="0" step="0.01"
              value={monto} onChange={e => setMonto(e.target.value)}
              className="rm-input-focus w-full px-3 py-2.5 rounded-lg text-sm font-bold tracking-tight pl-7 border border-gray-300 dark:!border-slate-600 bg-white dark:!bg-slate-800 text-gray-900 dark:!text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Categoría */}
        <div style={s.field}>
          <label className="block text-xs font-semibold text-gray-700 dark:!text-slate-400 mb-1.5">
            Categoría <span className="text-red-500">*</span>
          </label>
          <Dropdown value={categoria} onChange={setCategoria} options={CATEGORIAS[tipo]} placeholder="Seleccionar categoría…" colors={colors} isDark={isDark} />
        </div>

        {/* Método de Pago */}
        <div style={s.field}>
          <label className="block text-xs font-semibold text-gray-700 dark:!text-slate-400 mb-1.5">
            Método de Pago
          </label>
          <Dropdown value={metodoPago} onChange={(v) => { setMetodoPago(v); setSoporte(null); setPreviewUrl(''); }} options={METODOS} colors={colors} isDark={isDark} />
        </div>

        {/* Comprobante (solo si no es efectivo) */}
        {metodoPago !== 'efectivo' && (
          <div style={s.field}>
            <label className="block text-xs font-semibold text-gray-700 dark:!text-slate-400 mb-1.5">
              Comprobante de Pago <span className="text-red-500">*</span>
            </label>
            <input type="file" id="rm-file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <label
              htmlFor="rm-file"
              className="rm-file-zone flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg cursor-pointer transition-all border border-dashed border-gray-300 dark:!border-slate-600 bg-white dark:!bg-slate-800 text-gray-500 dark:!text-slate-400 text-sm font-medium hover:border-blue-500 dark:hover:!border-blue-500 hover:bg-blue-50 dark:hover:!bg-blue-900/20"
              style={{
                borderStyle: 'dashed',
                borderColor: soporte ? '#22c55e' : undefined,
                background: soporte ? '#f0fdf4' : undefined,
                color: soporte ? '#16a34a' : undefined,
                fontWeight: soporte ? 600 : 400,
              }}
            >
              {soporte ? <><IcoCheck /> {soporte.name}</> : <><IcoUpload /> Subir comprobante</>}
            </label>
            {!soporte && (
              <p className="text-xs text-red-500 mt-1 font-semibold">
                * Obligatorio para {METODOS.find(m => m.value === metodoPago)?.label || metodoPago}
              </p>
            )}
            {previewUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-gray-300 dark:!border-slate-600">
                <img src={previewUrl} alt="Vista previa" className="w-full max-h-44 object-contain block" />
              </div>
            )}
          </div>
        )}

        {/* Descripción */}
        <div style={s.field}>
          <label className="block text-xs font-semibold text-gray-700 dark:!text-slate-400 mb-1.5">
            Descripción <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="Describe el motivo del movimiento…"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            rows={3}
            className="rm-input-focus w-full px-3 py-2.5 rounded-lg text-sm border border-gray-300 dark:!border-slate-600 bg-white dark:!bg-slate-800 text-gray-900 dark:!text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-y min-h-19 leading-relaxed"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="rm-submit-btn"
          disabled={submitting}
          style={{
            width: '100%', padding: '11px 16px', borderRadius: 9,
            fontFamily: 'inherit', fontSize: 13, fontWeight: 700, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            background: accent, color: '#fff',
            boxShadow: `0 3px 10px ${accent}44`,
            cursor: 'pointer', transition: 'all .15s',
            marginTop: 4,
          }}
        >
          {submitting
            ? <><IcoSpinner /> Registrando…</>
            : `Registrar ${esEntrada ? 'Entrada' : 'Salida'}`
          }
        </button>
      </form>
    </div>
  );
}