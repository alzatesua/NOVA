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
    blueBorder: '#2563eb',
    text:       '#f9fafb',
    textMid:    '#d1d5db',
    textSub:    '#9ca3af',
    textMuted:  '#6b7280',
    border:     '#374151',
    surface:    '#1f2937',
    bg:         '#111827',
    green:      '#324fb1ff',
    greenDark:  '#2563eb',
    greenLight: '#2563eb',
    greenBorder:'#2563eb',
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
function Dropdown({ value, onChange, options, placeholder = 'Seleccionar…', colors = C }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
          background: colors.surface, border: `1px solid ${open ? colors.blue : colors.border}`,
          color: selected ? colors.text : colors.textMuted,
          fontFamily: 'inherit', fontSize: 13, fontWeight: selected ? 500 : 400,
          boxShadow: open ? `0 0 0 3px ${colors.blue}22` : 'none',
          transition: 'border-color .15s, box-shadow .15s',
          boxSizing: 'border-box',
        }}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <span style={{ color: colors.textMuted, transition: 'transform .18s', transform: open ? 'rotate(180deg)' : 'none', display: 'flex' }}>
          <IcoChevron />
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, zIndex: 9999,
          background: colors.surface, border: `1px solid ${colors.border}`,
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.10)',
          overflow: 'hidden', animation: 'rm-fadein .14s ease both',
        }}>
          {options.map((o, i) => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                padding: '9px 12px', fontSize: 13, fontWeight: value === o.value ? 600 : 400,
                color: value === o.value ? '#fff' : colors.textMid,
                background: value === o.value ? colors.blue : 'transparent',
                cursor: 'pointer', transition: 'background .1s',
                borderRadius: i === 0 ? '9px 9px 0 0' : i === options.length - 1 ? '0 0 9px 9px' : 0,
              }}
              onMouseEnter={e => { if (value !== o.value) e.currentTarget.style.background = colors.blueLight; }}
              onMouseLeave={e => { if (value !== o.value) e.currentTarget.style.background = 'transparent'; }}
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
      const d = err.response?.data;
      let msg = d?.message || d?.detail || 'Error al registrar el movimiento';
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
    lbl:   { display: 'block', fontSize: 12, fontWeight: 600, color: colors.textMid, marginBottom: 5 },
    input: { width: '100%', padding: '9px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.surface, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s' },
    field: { marginBottom: 14 },
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @keyframes rm-spin    { to { transform: rotate(360deg); } }
        @keyframes rm-fadein  { from { opacity:0; transform:translateY(-5px); } to { opacity:1; transform:translateY(0); } }
        .rm-input-focus:focus { border-color: ${C.blue} !important; box-shadow: 0 0 0 3px ${C.blue}22 !important; }
        .rm-type-btn:hover { opacity: .85; }
        .rm-submit-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .rm-submit-btn:disabled { opacity: .6; cursor: not-allowed; }
        .rm-file-zone:hover { border-color: ${C.blue}; background: ${C.blueLight}; }
      `}</style>

      {/* ── Toggle Entrada / Salida ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
        background: colors.bg, border: `1px solid ${colors.border}`,
        borderRadius: 10, padding: 4, marginBottom: 20,
      }}>
        {[
          { value: 'entrada', label: 'Entrada', icon: <IcoPlus />,  bg: colors.green,  shadow: '0 2px 8px rgba(22,163,74,.25)'  },
          { value: 'salida',  label: 'Salida',  icon: <IcoMinus />, bg: colors.red,    shadow: '0 2px 8px rgba(220,38,38,.25)'  },
        ].map(opt => {
          const active = tipo === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              className="rm-type-btn"
              onClick={() => handleTipo(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '9px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                background: active ? opt.bg : 'transparent',
                color: active ? '#fff' : colors.textSub,
                boxShadow: active ? opt.shadow : 'none',
                transition: 'all .15s',
              }}
            >
              <span style={{
                width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'rgba(255,255,255,.2)' : `${opt.bg}18`,
                color: active ? '#fff' : opt.bg,
              }}>
                {opt.icon}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>

      <div style={{ height: 1, background: colors.border, marginBottom: 18 }} />

      <form onSubmit={handleSubmit}>

        {/* Monto */}
        <div style={s.field}>
          <label style={s.lbl}>Monto <span style={{ color: colors.red }}>*</span></label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 12, fontSize: 13, fontWeight: 700, color: colors.textSub, pointerEvents: 'none', userSelect: 'none' }}>$</span>
            <input
              type="number" placeholder="0.00" min="0" step="0.01"
              value={monto} onChange={e => setMonto(e.target.value)}
              className="rm-input-focus"
              style={{ ...s.input, paddingLeft: 26, fontSize: 15, fontWeight: 700, letterSpacing: '-.2px' }}
            />
          </div>
        </div>

        {/* Categoría */}
        <div style={s.field}>
          <label style={s.lbl}>Categoría <span style={{ color: colors.red }}>*</span></label>
          <Dropdown value={categoria} onChange={setCategoria} options={CATEGORIAS[tipo]} placeholder="Seleccionar categoría…" colors={colors} />
        </div>

        {/* Método de Pago */}
        <div style={s.field}>
          <label style={s.lbl}>Método de Pago</label>
          <Dropdown value={metodoPago} onChange={(v) => { setMetodoPago(v); setSoporte(null); setPreviewUrl(''); }} options={METODOS} colors={colors} />
        </div>

        {/* Comprobante (solo si no es efectivo) */}
        {metodoPago !== 'efectivo' && (
          <div style={s.field}>
            <label style={s.lbl}>
              Comprobante de Pago <span style={{ color: colors.red }}>*</span>
            </label>
            <input type="file" id="rm-file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <label
              htmlFor="rm-file"
              className="rm-file-zone"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                width: '100%', padding: '10px 12px', borderRadius: 8, boxSizing: 'border-box',
                border: `1px dashed ${soporte ? colors.green : colors.border}`,
                background: soporte ? colors.greenLight : colors.surface,
                color: soporte ? colors.green : colors.textMuted,
                fontSize: 13, fontWeight: soporte ? 600 : 400,
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {soporte ? <><IcoCheck /> {soporte.name}</> : <><IcoUpload /> Subir comprobante</>}
            </label>
            {!soporte && (
              <p style={{ fontSize: 11, color: colors.red, margin: '4px 0 0', fontWeight: 600 }}>
                * Obligatorio para {METODOS.find(m => m.value === metodoPago)?.label || metodoPago}
              </p>
            )}
            {previewUrl && (
              <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
                <img src={previewUrl} alt="Vista previa" style={{ width: '100%', maxHeight: 180, objectFit: 'contain', display: 'block' }} />
              </div>
            )}
          </div>
        )}

        {/* Descripción */}
        <div style={s.field}>
          <label style={s.lbl}>Descripción <span style={{ color: colors.red }}>*</span></label>
          <textarea
            placeholder="Describe el motivo del movimiento…"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            rows={3}
            className="rm-input-focus"
            style={{ ...s.input, resize: 'vertical', lineHeight: 1.5, minHeight: 76 }}
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