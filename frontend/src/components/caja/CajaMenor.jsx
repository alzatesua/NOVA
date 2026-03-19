/**
 * Vista de Caja Menor — Rediseño estilo referencia
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { registrarMovimientoCaja } from '../../services/api';
import { showToast } from '../../utils/toast';
import { EyeIcon } from '@heroicons/react/24/outline';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .cm-root {
    font-family: 'Inter', sans-serif;
    /* Exact colors from reference dashboard */
    --green:         #0ba86d;
    --green-dark:    #098f5c;
    --green-bg:      #edfaf4;
    --green-border:  #0ba86d;
    --green-text:    #ffffff;
    --green-stripe:  #0ba86d;

    --red:           #f25a7b;
    --red-dark:      #e0355a;
    --red-bg:        #fdeef2;
    --red-border:    #f25a7b;
    --red-text:      #ffffff;
    --red-stripe:    #f25a7b;

    /* KPI badge sub-text colors (the "+$xxx ingresos" text) */
    --green-sub-text: #0ba86d;
    --red-sub-text:   #f25a7b;

    --blue:          #0ea5e9;
    --blue-bg:       #e0f2fe;
    --blue-border:   #0ea5e9;
    --blue-text:     #ffffff;
    --blue-stripe:   #0ea5e9;
    --blue-sub-text: #0369a1;

    --teal-stripe:   #06b6d4;

    --surface:       #ffffff;
    --bg:            #f8fafc;
    --border:        #e8edf3;
    --border-light:  #f1f5f9;
    --text-1:        #1a2233;
    --text-2:        #4a5568;
    --text-3:        #a0aec0;
    --radius-sm:     8px;
    --radius-md:     10px;
    --radius-lg:     14px;
    --shadow-sm:     0 1px 4px rgba(0,0,0,.06);
    --shadow-md:     0 4px 16px rgba(0,0,0,.08);
  }
  .cm-root[data-theme="dark"] {
    --green:         #0ba86d;
    --green-dark:    #098f5c;
    --green-bg:      rgba(11,168,109,.15);
    --green-border:  #0ba86d;
    --green-text:    #ffffff;
    --green-stripe:  #0ba86d;
    --green-sub-text:#0ba86d;

    --red:           #f25a7b;
    --red-dark:      #e0355a;
    --red-bg:        rgba(242,90,123,.15);
    --red-border:    #f25a7b;
    --red-text:      #ffffff;
    --red-stripe:    #f25a7b;
    --red-sub-text:  #f25a7b;

    --blue:          #0ea5e9;
    --blue-bg:       rgba(14,165,233,.15);
    --blue-border:   #0ea5e9;
    --blue-text:     #ffffff;
    --blue-stripe:   #0ea5e9;
    --blue-sub-text: #38bdf8;

    --surface:       #1a2235;
    --bg:            #111827;
    --border:        #2d3748;
    --border-light:  #1f2a3a;
    --text-1:        #f0f4f8;
    --text-2:        #94a3b8;
    --text-3:        #4a5568;
    --shadow-sm:     0 1px 4px rgba(0,0,0,.3);
    --shadow-md:     0 4px 16px rgba(0,0,0,.4);
  }

  .cm-root *, .cm-root *::before, .cm-root *::after { box-sizing: border-box; margin:0; padding:0; }
  .cm-root { background: var(--bg); min-height: 100vh; padding: 24px; }

  /* ── KPI Cards ── */
  .cm-kpi-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
  .cm-kpi-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px 22px 18px;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .cm-kpi-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: 3px 3px 0 0;
  }
  .cm-kpi-card--income::before  { background: var(--green-stripe); }
  .cm-kpi-card--expense::before { background: var(--red-stripe); }
  .cm-kpi-card--balance::before { background: var(--blue-stripe); }

  .cm-kpi-card__label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--text-3);
    margin-bottom: 10px;
  }
  .cm-kpi-card__amount {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -1px;
    line-height: 1;
    color: var(--text-1);
    margin-bottom: 10px;
  }
  .cm-kpi-card__amount span { font-size: 16px; font-weight: 600; margin-right: 2px; opacity: .6; }
  .cm-kpi-card__badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 20px;
  }
  .cm-kpi-card--income  .cm-kpi-card__badge { background: var(--green-bg); color: var(--green-sub-text); }
  .cm-kpi-card--expense .cm-kpi-card__badge { background: var(--red-bg);   color: var(--red-sub-text);   }
  .cm-kpi-card--balance .cm-kpi-card__badge { background: var(--blue-bg);  color: var(--blue-sub-text);  }
  .cm-kpi-card__icon {
    position: absolute;
    right: 18px; top: 18px;
    width: 36px; height: 36px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }
  .cm-kpi-card--income  .cm-kpi-card__icon { background: var(--green-bg); color: var(--green); }
  .cm-kpi-card--expense .cm-kpi-card__icon { background: var(--red-bg);   color: var(--red);   }
  .cm-kpi-card--balance .cm-kpi-card__icon { background: var(--blue-bg);  color: var(--blue);  }

  /* ── Layout ── */
  .cm-layout {
    display: grid;
    grid-template-columns: 360px 1fr;
    gap: 20px;
    align-items: start;
  }
  @media (max-width: 840px) { .cm-layout { grid-template-columns: 1fr; } }

  /* ── Panel ── */
  .cm-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }
  .cm-panel__head {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-light);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .cm-panel__title { font-size: 14px; font-weight: 700; color: var(--text-1); }
  .cm-panel__body  { padding: 20px; }

  /* ── Tipo toggle ── */
  .cm-tipo-toggle {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    overflow: hidden;
    margin-bottom: 20px;
  }
  .cm-tipo-btn {
    padding: 11px 16px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all .18s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    background: var(--surface);
    color: var(--text-3);
  }
  .cm-tipo-btn + .cm-tipo-btn { border-left: 1px solid var(--border); }
  .cm-tipo-btn--income.active  { background: var(--green); color: #fff; }
  .cm-tipo-btn--expense.active { background: var(--red);   color: #fff; }
  .cm-tipo-btn:not(.active):hover { background: var(--bg); color: var(--text-2); }
  .cm-tipo-btn__icon {
    width: 18px; height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
    background: rgba(255,255,255,.25);
    line-height: 1;
  }
  .cm-tipo-btn:not(.active) .cm-tipo-btn__icon { background: var(--border); color: var(--text-3); }

  /* ── Form fields ── */
  .cm-form-fields { display: flex; flex-direction: column; gap: 16px; }
  .cm-field { display: flex; flex-direction: column; gap: 6px; }
  .cm-label {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: .09em;
    text-transform: uppercase;
    color: var(--text-2);
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .cm-label em { color: var(--red); font-style: normal; }
  .cm-input-wrap { position: relative; }
  .cm-input-prefix {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-3);
    pointer-events: none;
    user-select: none;
  }
  .cm-input, .cm-textarea, .cm-select {
    width: 100%;
    font-family: 'Inter', sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    color: var(--text-1);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 10px 14px;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
    -webkit-appearance: none;
    appearance: none;
  }
  .cm-input--prefix { padding-left: 28px; }
  .cm-input::placeholder, .cm-textarea::placeholder { color: var(--text-3); }
  .cm-input:focus, .cm-textarea:focus, .cm-select:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(59,130,246,.1);
    background: var(--surface);
  }
  .cm-textarea { min-height: 90px; resize: vertical; line-height: 1.55; }
  .cm-select {
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 13px center;
    padding-right: 36px;
  }

  /* ── Submit btn ── */
  .cm-submit-btn {
    width: 100%;
    padding: 12px;
    border-radius: var(--radius-md);
    font-family: 'Inter', sans-serif;
    font-size: 13.5px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all .18s;
    margin-top: 4px;
  }
  .cm-submit-btn--income  { background: var(--green); box-shadow: 0 4px 12px rgba(34,197,94,.3); }
  .cm-submit-btn--expense { background: var(--red);   box-shadow: 0 4px 12px rgba(244,63,94,.3); }
  .cm-submit-btn:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); }
  .cm-submit-btn:disabled { opacity: .55; cursor: not-allowed; transform: none !important; }

  /* ── Refresh btn ── */
  .cm-refresh-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-2);
    cursor: pointer;
    transition: all .15s;
  }
  .cm-refresh-btn:hover:not(:disabled) { background: var(--border-light); color: var(--text-1); }
  .cm-refresh-btn:disabled { opacity: .5; cursor: not-allowed; }

  /* ── Table ── */
  .cm-table-scroll { overflow-x: auto; }
  .cm-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .cm-table thead { border-bottom: 1px solid var(--border); }
  .cm-table th {
    padding: 10px 16px;
    text-align: left;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--text-3);
    white-space: nowrap;
  }
  .cm-table td {
    padding: 13px 16px;
    border-bottom: 1px solid var(--border-light);
    color: var(--text-2);
    font-weight: 500;
    vertical-align: middle;
  }
  .cm-table tbody tr:last-child td { border-bottom: none; }
  .cm-table tbody tr:hover { background: var(--bg); }
  .cm-td-date  { font-size: 12px; color: var(--text-3); white-space: nowrap; }
  .cm-td-desc  { max-width: 180px; }
  .cm-td-desc span { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .cm-td-amount { font-weight: 700; font-size: 13.5px; white-space: nowrap; }
  .cm-td-amount--income  { color: var(--green); }
  .cm-td-amount--expense { color: var(--red);   }

  /* ── Badge — fondo sólido como en la referencia ── */
  .cm-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    color: #ffffff;
  }
  .cm-badge--income  { background: var(--green); }
  .cm-badge--expense { background: var(--red);   }

  /* ── Cat tag ── */
  .cm-cat-tag {
    font-size: 12px; font-weight: 500;
    color: var(--text-2);
    background: var(--border-light);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 3px 8px;
    display: inline-block;
    white-space: nowrap;
  }

  /* ── Empty / loading ── */
  .cm-state {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    padding: 52px 24px;
    color: var(--text-3); font-size: 13px; font-weight: 500; text-align: center;
  }
  .cm-state__icon { font-size: 32px; opacity: .4; }
  .cm-state__sub  { font-size: 12px; opacity: .7; }

  /* ── Spinner ── */
  @keyframes cm-spin { to { transform: rotate(360deg); } }
  .cm-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: cm-spin .7s linear infinite;
  }
  .cm-spinner--gray { border-color: var(--border); border-top-color: var(--text-3); }

  /* ── Animations ── */
  @keyframes cm-fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes cm-fadeIn { from { opacity:0; } to { opacity:1; } }
  .cm-kpi-card { animation: cm-fadeUp .3s ease both; }
  .cm-kpi-card:nth-child(2) { animation-delay: .06s; }
  .cm-kpi-card:nth-child(3) { animation-delay: .12s; }
  .cm-panel { animation: cm-fadeUp .3s .1s ease both; }
`;

const CATEGORIAS = {
  entrada: [
    { value: 'reembolso_caja_menor', label: 'Reembolso' },
    { value: 'venta_caja_menor',     label: 'Venta' },
    { value: 'abono_caja_menor',     label: 'Abono' },
    { value: 'otra_entrada_caja_menor', label: 'Otra entrada' },
  ],
  salida: [
    { value: 'compra_caja_menor', label: 'Compra' },
    { value: 'gasto_caja_menor',  label: 'Gasto' },
    { value: 'pago_caja_menor',   label: 'Pago' },
    { value: 'otra_salida_caja_menor', label: 'Otra salida' },
  ],
};

const fmt = (n) =>
  '$ ' + parseFloat(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const catLabel = (v = '') =>
  v.replace(/_caja_menor$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

export default function CajaMenor({ fecha, idSucursal, onRefresh }) {
  const { usuario, tokenUsuario, subdominio } = useAuth();
  const { theme } = useTheme();

  const [tipo, setTipo]               = useState('entrada');
  const [monto, setMonto]             = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria]     = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [balance, setBalance]         = useState({ ingresos: 0, egresos: 0, total: 0 });
  const [mostrarModalSoporte, setMostrarModalSoporte] = useState(false);
  const [soporteSeleccionado, setSoporteSeleccionado] = useState(null);

  useEffect(() => { cargar(); }, [fecha, idSucursal]);
  useEffect(() => { setCategoria(''); }, [tipo]);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://dagi.co/api/caja/movimientos_caja_menor/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenUsuario, usuario, subdominio, fecha, id_sucursal: idSucursal || null }),
      });
      if (res.ok) {
        const data = await res.json();
        const movs = data.movimientos || [];
        setMovimientos(movs);
        const ingresos = movs.filter(m => m.tipo === 'entrada').reduce((s, m) => s + parseFloat(m.monto), 0);
        const egresos  = movs.filter(m => m.tipo === 'salida').reduce((s, m) => s + parseFloat(m.monto), 0);
        setBalance({ ingresos, egresos, total: ingresos - egresos });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!monto || parseFloat(monto) <= 0) return showToast('Ingresa un monto válido', 'error');
    if (!descripcion.trim())              return showToast('Ingresa una descripción', 'error');
    if (!categoria)                       return showToast('Selecciona una categoría', 'error');

    setSubmitting(true);
    try {
      const res = await registrarMovimientoCaja({
        token: tokenUsuario, usuario, subdominio, tipo,
        monto: parseFloat(monto),
        descripcion: descripcion.trim(),
        metodo_pago: 'efectivo',
        categoria,
        id_sucursal: idSucursal || null,
        es_caja_menor: true,
      });
      if (res.success) {
        showToast(`${tipo === 'entrada' ? 'Ingreso' : 'Egreso'} registrado exitosamente`, 'success');
        setMonto(''); setDescripcion(''); setCategoria('');
        cargar();
        if (onRefresh) onRefresh();
      } else {
        showToast(res.message || 'Error al registrar', 'error');
      }
    } catch {
      showToast('Error al registrar el movimiento', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cm-root" data-theme={theme}>
      <style>{STYLES}</style>

      {/* ── KPIs ── */}
      <div className="cm-kpi-row">
        <div className="cm-kpi-card cm-kpi-card--income">
          <div className="cm-kpi-card__icon">↑</div>
          <div className="cm-kpi-card__label">Total Ingresos</div>
          <div className="cm-kpi-card__amount">
            <span>$</span>
            {balance.ingresos.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
          </div>
          <span className="cm-kpi-card__badge">↗ +{fmt(balance.ingresos)} ingresos</span>
        </div>

        <div className="cm-kpi-card cm-kpi-card--expense">
          <div className="cm-kpi-card__icon">↓</div>
          <div className="cm-kpi-card__label">Total Egresos</div>
          <div className="cm-kpi-card__amount">
            <span>$</span>
            {balance.egresos.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
          </div>
          <span className="cm-kpi-card__badge">↘ -{fmt(balance.egresos)} egresos</span>
        </div>

        <div className="cm-kpi-card cm-kpi-card--balance">
          <div className="cm-kpi-card__icon">◎</div>
          <div className="cm-kpi-card__label">Saldo Actual</div>
          <div className="cm-kpi-card__amount">
            <span>$</span>
            {balance.total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
          </div>
          <span className="cm-kpi-card__badge">↗ {fmt(balance.total)} vs apertura</span>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="cm-layout">

        {/* ── Form ── */}
        <div className="cm-panel">
          <div className="cm-panel__head">
            <span className="cm-panel__title">Registrar Movimiento</span>
          </div>
          <div className="cm-panel__body">

            {/* Toggle Entrada / Salida */}
            <div className="cm-tipo-toggle">
              <button
                type="button"
                className={`cm-tipo-btn cm-tipo-btn--income ${tipo === 'entrada' ? 'active' : ''}`}
                onClick={() => setTipo('entrada')}
              >
                <span className="cm-tipo-btn__icon">+</span>
                Entrada
              </button>
              <button
                type="button"
                className={`cm-tipo-btn cm-tipo-btn--expense ${tipo === 'salida' ? 'active' : ''}`}
                onClick={() => setTipo('salida')}
              >
                <span className="cm-tipo-btn__icon">−</span>
                Salida
              </button>
            </div>

            <div className="cm-form-fields">
              <div className="cm-field">
                <label className="cm-label">Monto <em>*</em></label>
                <div className="cm-input-wrap">
                  <span className="cm-input-prefix">$</span>
                  <input
                    className="cm-input cm-input--prefix"
                    type="number"
                    placeholder="0.00"
                    value={monto}
                    onChange={e => setMonto(e.target.value)}
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              <div className="cm-field">
                <label className="cm-label">Categoría <em>*</em></label>
                <select
                  className="cm-select"
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                >
                  <option value="">Seleccionar categoría...</option>
                  {(tipo === 'entrada' ? CATEGORIAS.entrada : CATEGORIAS.salida).map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="cm-field">
                <label className="cm-label">Descripción <em>*</em></label>
                <textarea
                  className="cm-textarea"
                  placeholder="Describe el motivo del movimiento..."
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                />
              </div>

              <button
                type="button"
                className={`cm-submit-btn cm-submit-btn--${tipo === 'entrada' ? 'income' : 'expense'}`}
                onClick={submit}
                disabled={submitting}
              >
                {submitting
                  ? <><span className="cm-spinner" /> Procesando...</>
                  : tipo === 'entrada' ? '+ Registrar Ingreso' : '− Registrar Egreso'
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="cm-panel">
          <div className="cm-panel__head">
            <span className="cm-panel__title">Movimientos de Caja Menor</span>
            <button className="cm-refresh-btn" onClick={cargar} disabled={loading}>
              {loading
                ? <><span className="cm-spinner cm-spinner--gray" /> Cargando</>
                : <>↻ Actualizar</>
              }
            </button>
          </div>

          {loading ? (
            <div className="cm-state">
              <span className="cm-spinner cm-spinner--gray" style={{ width: 24, height: 24 }} />
              <p>Cargando movimientos...</p>
            </div>
          ) : movimientos.length === 0 ? (
            <div className="cm-state">
              <div className="cm-state__icon">📋</div>
              <p>Sin movimientos registrados</p>
              <p className="cm-state__sub">Los movimientos aparecerán aquí</p>
            </div>
          ) : (
            <div className="cm-table-scroll">
              <table className="cm-table">
                <thead>
                  <tr>
                    <th>Fecha / Hora</th>
                    <th>Tipo</th>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th>Monto</th>
                    <th>Soporte</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map(mov => (
                    <tr key={mov.id}>
                      <td className="cm-td-date">
                        {(() => {
                          const fecha = new Date(mov.fecha_hora);
                          return !isNaN(fecha.getTime())
                            ? fecha.toLocaleString('es-CO', {
                                day: '2-digit', month: '2-digit', year: '2-digit',
                                hour: '2-digit', minute: '2-digit',
                              })
                            : 'Fecha no disponible';
                        })()}
                      </td>
                      <td>
                        <span className={`cm-badge cm-badge--${mov.tipo}`}>
                          {mov.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                        </span>
                      </td>
                      <td>
                        <span className="cm-cat-tag">{catLabel(mov.categoria)}</span>
                      </td>
                      <td className="cm-td-desc">
                        <span title={mov.descripcion}>{mov.descripcion}</span>
                      </td>
                      <td className={`cm-td-amount cm-td-amount--${mov.tipo}`}>
                        {mov.tipo === 'entrada' ? '+' : '-'}{fmt(mov.monto)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {mov.soporte_pago ? (
                          <button
                            onClick={() => {
                              setSoporteSeleccionado(mov.soporte_pago);
                              setMostrarModalSoporte(true);
                            }}
                            style={{
                              padding: '6px',
                              background: 'var(--blue-bg)',
                              border: '1px solid var(--blue-border)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: 'var(--blue)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s',
                            }}
                            title="Ver soporte de pago"
                            onMouseEnter={(e) => {
                              e.target.style.background = 'var(--blue)';
                              e.target.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'var(--blue-bg)';
                              e.target.style.color = 'var(--blue)';
                            }}
                          >
                            <EyeIcon style={{ width: '16px', height: '16px' }} />
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
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

      {/* Modal para ver Soporte de Pago */}
      {mostrarModalSoporte && soporteSeleccionado && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '16px',
          animation: 'cm-fadeIn 0.2s ease'
        }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            animation: 'cm-fadeUp 0.3s ease'
          }}>
            {/* Header */}
            <div style={{
              background: 'var(--blue)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>📄</div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Soporte de Pago</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Comprobante del movimiento</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setMostrarModalSoporte(false);
                  setSoporteSeleccionado(null);
                }}
                style={{
                  padding: '8px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#fff',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              >✕</button>
            </div>

            {/* Body */}
            <div style={{
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxHeight: 'calc(90vh - 140px)',
              overflow: 'auto'
            }}>
              {soporteSeleccionado.toLowerCase().endsWith('.pdf') ? (
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <object
                    data={soporteSeleccionado}
                    type="application/pdf"
                    style={{
                      width: '100%',
                      height: '500px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ padding: '32px' }}>
                      <p style={{ color: 'var(--text-2)', marginBottom: '16px' }}>
                        No se puede previsualizar el PDF directamente
                      </p>
                      <a
                        href={soporteSeleccionado}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 20px',
                          background: 'var(--blue)',
                          color: '#fff',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '14px'
                        }}
                      >
                        📄 Abrir PDF en nueva pestaña
                      </a>
                    </div>
                  </object>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={soporteSeleccionado}
                    alt="Soporte de pago"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: '1px solid var(--border)'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              background: 'var(--bg)',
              padding: '16px 24px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <a
                href={soporteSeleccionado}
                download={`soporte_pago_${new Date().getTime()}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'var(--blue)',
                  color: '#fff',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => e.target.style.filter = 'brightness(1.1)'}
                onMouseLeave={(e) => e.target.style.filter = 'brightness(1)'}
              >
                📥 Descargar
              </a>
              <button
                onClick={() => {
                  setMostrarModalSoporte(false);
                  setSoporteSeleccionado(null);
                }}
                style={{
                  padding: '10px 20px',
                  background: 'var(--border)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-1)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--border-light)'}
                onMouseLeave={(e) => e.target.style.background = 'var(--border)'}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}