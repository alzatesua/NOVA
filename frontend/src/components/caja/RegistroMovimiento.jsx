/**
 * Formulario para Registrar Movimientos de Caja — Custom dropdowns (sin select nativo)
 */
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { registrarMovimientoCaja } from '../../services/api';
import { showToast } from '../../utils/toast';

const FORM_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .rm-root { font-family: 'Plus Jakarta Sans', sans-serif; }

  /* ── Light ── */
  .rm-root {
    --toggle-bg:       #f0f9ff;
    --toggle-border:   #dbeafe;
    --field-bg:        #ffffff;
    --field-border:    #e2e8f0;
    --field-color:     #0f172a;
    --field-ph:        #94a3b8;
    --label-color:     #64748b;
    --divider:         #e0f2fe;
    --dropdown-bg:     #ffffff;
    --dropdown-border: #e2e8f0;
    --dropdown-shadow: 0 8px 24px rgba(14,165,233,.13), 0 2px 8px rgba(0,0,0,.06);
    --option-hover:    #f0f9ff;
    --option-active-bg: #0ea5e9;
    --option-active-color: #ffffff;
    --chevron-color:   #94a3b8;
    --inactive-icon-e-bg:  #d1fae5;
    --inactive-icon-e-col: #059669;
    --inactive-icon-s-bg:  #ffe4e6;
    --inactive-icon-s-col: #e11d48;
    --inactive-text:   #94a3b8;
  }

  /* ── Dark ── */
  .rm-root[data-theme="dark"] {
    --toggle-bg:       #0a1728;
    --toggle-border:   #1e3a5f;
    --field-bg:        #0c1e33;
    --field-border:    #1e3a5f;
    --field-color:     #bfdbfe;
    --field-ph:        #2d5070;
    --label-color:     #4d7fa8;
    --divider:         #1a3352;
    --dropdown-bg:     #0c1e33;
    --dropdown-border: #1e3a5f;
    --dropdown-shadow: 0 8px 24px rgba(0,0,0,.4), 0 2px 8px rgba(0,0,0,.3);
    --option-hover:    #0f2237;
    --option-active-bg: #0284c7;
    --option-active-color: #ffffff;
    --chevron-color:   #2d5070;
    --inactive-icon-e-bg:  rgba(16,185,129,.2);
    --inactive-icon-e-col: #34d399;
    --inactive-icon-s-bg:  rgba(244,63,94,.2);
    --inactive-icon-s-col: #fb7185;
    --inactive-text:   #2d5070;
  }

  /* ── Toggle ── */
  .rm-toggle {
    display: grid; grid-template-columns: 1fr 1fr;
    background: var(--toggle-bg); border: 1.5px solid var(--toggle-border);
    border-radius: 16px; padding: 4px; gap: 4px; margin-bottom: 22px;
  }
  .rm-toggle__btn {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 10px 14px; border-radius: 12px; font-size: 13.5px; font-weight: 700;
    border: none; cursor: pointer; transition: all .2s; font-family: inherit;
    background: transparent; color: var(--inactive-text);
  }
  .rm-toggle__btn:hover:not(.rm-toggle__btn--active) { background: rgba(255,255,255,.06); color: var(--label-color); }
  .rm-toggle__btn--entrada.rm-toggle__btn--active { background:linear-gradient(135deg,#10b981,#059669);color:#fff;box-shadow:0 3px 12px rgba(16,185,129,.28); }
  .rm-toggle__btn--salida.rm-toggle__btn--active  { background:linear-gradient(135deg,#f43f5e,#e11d48);color:#fff;box-shadow:0 3px 12px rgba(244,63,94,.28); }
  .rm-toggle__icon {
    width:22px;height:22px;border-radius:6px;
    display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .2s;
  }
  .rm-toggle__btn--entrada:not(.rm-toggle__btn--active) .rm-toggle__icon { background:var(--inactive-icon-e-bg); color:var(--inactive-icon-e-col); }
  .rm-toggle__btn--salida:not(.rm-toggle__btn--active)  .rm-toggle__icon { background:var(--inactive-icon-s-bg); color:var(--inactive-icon-s-col); }
  .rm-toggle__btn--active .rm-toggle__icon { background:rgba(255,255,255,.2); color:#fff; }

  /* ── Fields ── */
  .rm-field { margin-bottom: 16px; position: relative; }
  .rm-label { display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--label-color);margin-bottom:7px; }
  .rm-label span { color: #f43f5e; margin-left:2px; }

  /* ── Text input ── */
  .rm-input, .rm-textarea {
    width: 100%; font-family: inherit; font-size: 13.5px; font-weight: 500;
    color: var(--field-color); background: var(--field-bg);
    border: 1.5px solid var(--field-border); border-radius: 12px;
    padding: 10px 14px; outline: none;
    transition: border-color .18s, box-shadow .18s, background .25s;
    box-sizing: border-box;
  }
  .rm-input::placeholder, .rm-textarea::placeholder { color: var(--field-ph); font-weight: 400; }
  .rm-input:focus, .rm-textarea:focus {
    border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,.14);
  }
  .rm-textarea { min-height: 88px; resize: vertical; line-height: 1.5; }

  /* ── Monto ── */
  .rm-amount-wrap { position: relative; display: flex; align-items: center; }
  .rm-amount-prefix { position:absolute;left:14px;font-size:14px;font-weight:700;color:var(--label-color);pointer-events:none;user-select:none; }
  .rm-amount-wrap .rm-input { padding-left: 28px; font-size: 16px; font-weight: 700; letter-spacing: -.3px; }

  /* ── Custom Dropdown ── */
  .rm-dropdown { position: relative; user-select: none; }

  .rm-dropdown__trigger {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; border-radius: 12px; cursor: pointer;
    background: var(--field-bg); border: 1.5px solid var(--field-border);
    color: var(--field-color); font-family: inherit; font-size: 13.5px; font-weight: 500;
    transition: border-color .18s, box-shadow .18s;
    box-sizing: border-box; width: 100%;
  }
  .rm-dropdown__trigger:focus { outline: none; }
  .rm-dropdown__trigger.placeholder { color: var(--field-ph); font-weight: 400; }
  .rm-dropdown__trigger.open,
  .rm-dropdown__trigger:focus {
    border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,.14);
  }

  .rm-dropdown__chevron {
    flex-shrink: 0; color: var(--chevron-color);
    transition: transform .2s;
  }
  .rm-dropdown__chevron.open { transform: rotate(180deg); }

  .rm-dropdown__menu {
    position: absolute; top: calc(100% + 6px); left: 0; right: 0;
    background: var(--dropdown-bg); border: 1.5px solid var(--dropdown-border);
    border-radius: 12px; box-shadow: var(--dropdown-shadow);
    z-index: 9999; overflow: hidden;
    animation: rm-dropdown-in .15s ease both;
  }

  @keyframes rm-dropdown-in {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .rm-dropdown__option {
    display: flex; align-items: center; padding: 10px 14px;
    font-family: inherit; font-size: 13.5px; font-weight: 500;
    color: var(--field-color); cursor: pointer;
    transition: background .12s;
  }
  .rm-dropdown__option:hover { background: var(--option-hover); }
  .rm-dropdown__option.selected {
    background: var(--option-active-bg); color: var(--option-active-color); font-weight: 700;
  }
  .rm-dropdown__option:first-child { border-radius: 10px 10px 0 0; }
  .rm-dropdown__option:last-child  { border-radius: 0 0 10px 10px; }
  .rm-dropdown__option.selected:only-child { border-radius: 10px; }

  /* ── Divider ── */
  .rm-divider { height:1px; background:var(--divider); margin:4px 0 20px; }

  /* ── Submit ── */
  .rm-submit {
    width:100%; padding:13px; border-radius:12px;
    font-family:inherit; font-size:14px; font-weight:800;
    border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:8px;
    transition:all .2s; margin-top:6px;
  }
  .rm-submit--entrada { background:linear-gradient(135deg,#10b981,#059669);color:#fff;box-shadow:0 4px 14px rgba(16,185,129,.3); }
  .rm-submit--entrada:hover:not(:disabled) { background:linear-gradient(135deg,#059669,#047857);box-shadow:0 6px 20px rgba(16,185,129,.38);transform:translateY(-1px); }
  .rm-submit--salida  { background:linear-gradient(135deg,#f43f5e,#e11d48);color:#fff;box-shadow:0 4px 14px rgba(244,63,94,.3); }
  .rm-submit--salida:hover:not(:disabled)  { background:linear-gradient(135deg,#e11d48,#be123c);box-shadow:0 6px 20px rgba(244,63,94,.38);transform:translateY(-1px); }
  .rm-submit:disabled { opacity:.6; cursor:not-allowed; transform:none!important; }

  @keyframes rm-spin { to { transform: rotate(360deg); } }
  .rm-spinner { width:16px;height:16px;border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:rm-spin .7s linear infinite;flex-shrink:0; }
`;

/* ─── Íconos ─────────────────────────────────────────────────── */
const IcoPlus  = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 4v12M4 10h12"/></svg>;
const IcoMinus = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 10h12"/></svg>;
const IcoChevron = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" width="16" height="16">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 7.5l5 5 5-5"/>
  </svg>
);

/* ─── Custom Dropdown ────────────────────────────────────────── */
function Dropdown({ value, onChange, options, placeholder = 'Seleccionar...' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div className="rm-dropdown" ref={ref}>
      <button
        type="button"
        className={`rm-dropdown__trigger${open ? ' open' : ''}${!selected ? ' placeholder' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <span className={`rm-dropdown__chevron${open ? ' open' : ''}`}><IcoChevron /></span>
      </button>

      {open && (
        <div className="rm-dropdown__menu">
          {!value && (
            <div
              className="rm-dropdown__option placeholder"
              style={{ color: 'var(--field-ph)', fontWeight: 400 }}
              onClick={() => { onChange(''); setOpen(false); }}
            >
              {placeholder}
            </div>
          )}
          {options.map(o => (
            <div
              key={o.value}
              className={`rm-dropdown__option${value === o.value ? ' selected' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Datos estáticos ────────────────────────────────────────── */
const METODOS_PAGO = [
  { value:'efectivo',      label:'Efectivo'      },
  { value:'transferencia', label:'Transferencia' },
  { value:'nequi',         label:'Nequi'         },
  { value:'daviplata',     label:'Daviplata'     },
  { value:'tarjeta',       label:'Tarjeta'       },
  { value:'otro',          label:'Otro'          },
];
const CATEGORIAS = {
  entrada: [
    { value:'venta',           label:'Venta'           },
    { value:'abono',           label:'Abono'           },
    { value:'reembolso',       label:'Reembolso'       },
    { value:'ajuste_positivo', label:'Ajuste Positivo' },
    { value:'otra_entrada',    label:'Otra Entrada'    },
  ],
  salida: [
    { value:'compra',          label:'Compra'          },
    { value:'gasto',           label:'Gasto'           },
    { value:'retiro',          label:'Retiro'          },
    { value:'devolucion',      label:'Devolución'      },
    { value:'ajuste_negativo', label:'Ajuste Negativo' },
    { value:'otra_salida',     label:'Otra Salida'     },
  ],
};

/* ─── Componente principal ───────────────────────────────────── */
export default function RegistroMovimiento({ isAdmin, idSucursal, onRegistroExitoso }) {
  const { usuario, tokenUsuario, subdominio } = useAuth();
  const { theme } = useTheme();

  const [tipo,        setTipo]        = useState('entrada');
  const [monto,       setMonto]       = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [metodoPago,  setMetodoPago]  = useState('efectivo');
  const [categoria,   setCategoria]   = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const handleTipo = (t) => { setTipo(t); setCategoria(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monto || parseFloat(monto) <= 0) { showToast('Por favor ingresa un monto válido', 'error'); return; }
    if (!descripcion.trim())              { showToast('Por favor ingresa una descripción', 'error'); return; }
    if (!categoria)                       { showToast('Por favor selecciona una categoría', 'error'); return; }

    setSubmitting(true);
    try {
      const params = {
        token: tokenUsuario, usuario, subdominio,
        tipo, monto: parseFloat(monto), descripcion: descripcion.trim(),
        metodo_pago: metodoPago, categoria, id_sucursal: idSucursal || null,
      };
      if (idSucursal) { params.id_sucursal = idSucursal; params.sucursal = idSucursal; }

      const response = await registrarMovimientoCaja(params);
      if (response.success) {
        showToast('Movimiento registrado exitosamente', 'success');
        setMonto(''); setDescripcion(''); setCategoria('');
        if (onRegistroExitoso) onRegistroExitoso();
      } else {
        showToast(response.message || 'Error al registrar el movimiento', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al registrar el movimiento', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const esEntrada = tipo === 'entrada';

  return (
    <div className="rm-root" data-theme={theme}>
      <style>{FORM_STYLES}</style>

      {/* Toggle Entrada / Salida */}
      <div className="rm-toggle">
        <button
          type="button"
          className={`rm-toggle__btn rm-toggle__btn--entrada${esEntrada ? ' rm-toggle__btn--active' : ''}`}
          onClick={() => handleTipo('entrada')}
        >
          <span className="rm-toggle__icon"><IcoPlus /></span>
          Entrada
        </button>
        <button
          type="button"
          className={`rm-toggle__btn rm-toggle__btn--salida${!esEntrada ? ' rm-toggle__btn--active' : ''}`}
          onClick={() => handleTipo('salida')}
        >
          <span className="rm-toggle__icon"><IcoMinus /></span>
          Salida
        </button>
      </div>

      <div className="rm-divider" />

      <form onSubmit={handleSubmit}>
        {/* Monto */}
        <div className="rm-field">
          <label className="rm-label" htmlFor="rm-monto">Monto <span>*</span></label>
          <div className="rm-amount-wrap">
            <span className="rm-amount-prefix">$</span>
            <input
              id="rm-monto"
              className="rm-input"
              type="number"
              placeholder="0.00"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Categoría */}
        <div className="rm-field">
          <label className="rm-label">Categoría <span>*</span></label>
          <Dropdown
            value={categoria}
            onChange={setCategoria}
            options={CATEGORIAS[tipo]}
            placeholder="Seleccionar categoría..."
          />
        </div>

        {/* Método de Pago */}
        <div className="rm-field">
          <label className="rm-label">Método de Pago</label>
          <Dropdown
            value={metodoPago}
            onChange={setMetodoPago}
            options={METODOS_PAGO}
          />
        </div>

        {/* Descripción */}
        <div className="rm-field">
          <label className="rm-label" htmlFor="rm-desc">Descripción <span>*</span></label>
          <textarea
            id="rm-desc"
            className="rm-textarea"
            placeholder="Describe el motivo del movimiento..."
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
          />
        </div>

        {/* Submit */}
        <button type="submit" className={`rm-submit rm-submit--${tipo}`} disabled={submitting}>
          {submitting
            ? <><span className="rm-spinner" /> Registrando...</>
            : `Registrar ${esEntrada ? 'Entrada' : 'Salida'}`
          }
        </button>
      </form>
    </div>
  );
}