/**
 * Vista principal de Caja — Dark Mode + Rediseño moderno
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import CajaDashboard from './caja/CajaDashboard';
import MovimientosTable from './caja/MovimientosTable';
import RegistroMovimiento from './caja/RegistroMovimiento';
import CuadreCaja from './caja/CuadreCaja';
import { fetchSucursalesCaja } from '../services/api';
import { showToast } from '../utils/toast';

const VIEW_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .cv-root { font-family: 'Plus Jakarta Sans', sans-serif; }

  /* ── Light ── */
  .cv-root {
    --bg:          #f4faff;
    --white:       #ffffff;
    --border:      #dbeafe;
    --border-soft: #e0f2fe;
    --pill-bg:     #ffffff;
    --pill-border: #dbeafe;
    --tabs-bg:     #f0f9ff;
    --tab-color:   #94a3b8;
    --card-bg:     #ffffff;
    --card-border: #e0f2fe;
    --card-head-border: #e0f2fe;
    --title-color: #334155;
    --text-muted:  #94a3b8;
    --text-sub:    #94a3b8;
    --head-title:  #0f172a;
    --select-bg:   #ffffff;
    --select-color:#0f172a;
    --refresh-bg:  #f0f9ff;
    --refresh-color:#0284c7;
    --refresh-border:#bae6fd;
    --shadow-xs:   0 1px 3px rgba(14,165,233,.06);
    --shadow-md:   0 4px 20px rgba(14,165,233,.10), 0 2px 6px rgba(0,0,0,.04);
    --chip-bg:     #ffffff;
    --chip-border: #dbeafe;
    --chip-color:  #64748b;
  }

  /* ── Dark ── */
  .cv-root[data-theme="dark"] {
    --bg:          #070e1a;
    --white:       #0f1f35;
    --border:      #1e3a5f;
    --border-soft: #1a3352;
    --pill-bg:     #0f1f35;
    --pill-border: #1e3a5f;
    --tabs-bg:     #0a1728;
    --tab-color:   #3a6080;
    --card-bg:     #0f1f35;
    --card-border: #1e3a5f;
    --card-head-border: #1a3352;
    --title-color: #93c5fd;
    --text-muted:  #3a6080;
    --text-sub:    #3a6080;
    --head-title:  #e2e8f0;
    --select-bg:   #0f1f35;
    --select-color:#bfdbfe;
    --refresh-bg:  #0a1f38;
    --refresh-color:#38bdf8;
    --refresh-border:#1e3a5f;
    --shadow-xs:   0 1px 3px rgba(0,0,0,.3);
    --shadow-md:   0 4px 20px rgba(0,0,0,.3), 0 2px 6px rgba(0,0,0,.2);
    --chip-bg:     #0f1f35;
    --chip-border: #1e3a5f;
    --chip-color:  #4d7fa8;
  }

  .cv-root {
    background: var(--bg);
    min-height: 100vh;
    padding: 24px;
    transition: background .25s;
  }

  /* Header */
  .cv-header { display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:28px; }
  .cv-header__brand { display:flex;align-items:center;gap:14px; }
  .cv-header__icon { width:50px;height:50px;border-radius:18px;background:linear-gradient(135deg,#0ea5e9,#0284c7);display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 4px 16px rgba(14,165,233,.35);flex-shrink:0; }
  .cv-header__title { font-size:22px;font-weight:800;letter-spacing:-.5px;color:var(--head-title);margin:0 0 3px;line-height:1.1; }
  .cv-header__sub { font-size:12.5px;font-weight:500;color:var(--text-sub);margin:0; }
  .cv-controls { display:flex;align-items:center;flex-wrap:wrap;gap:8px; }

  /* Pills */
  .cv-pill { display:flex;align-items:center;gap:7px;padding:8px 14px;border-radius:10px;border:1.5px solid var(--pill-border);background:var(--pill-bg);box-shadow:var(--shadow-xs);font-size:13px;font-weight:600;color:var(--select-color);transition:border-color .18s,box-shadow .18s;white-space:nowrap;cursor:default; }
  .cv-pill:focus-within { border-color:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.15); }
  .cv-pill svg { color:#0ea5e9;flex-shrink:0; }
  .cv-pill input[type="date"],
  .cv-pill select { background:transparent;border:none;outline:none;font-family:inherit;font-size:13px;font-weight:600;color:var(--select-color);cursor:pointer;padding:0;appearance:none;-webkit-appearance:none; }
  .cv-pill input[type="date"]::-webkit-calendar-picker-indicator { opacity:.5;cursor:pointer;filter:var(--date-icon-filter, none); }
  .cv-root[data-theme="dark"] .cv-pill input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(.5); }

  /* Tabs */
  .cv-tabs { display:flex;background:var(--tabs-bg);border:1.5px solid var(--border);border-radius:11px;padding:3px;gap:3px;box-shadow:var(--shadow-xs); }
  .cv-tab { padding:7px 17px;border-radius:8px;font-size:13px;font-weight:700;border:none;background:transparent;color:var(--tab-color);cursor:pointer;transition:all .18s;white-space:nowrap;font-family:inherit; }
  .cv-tab:hover:not(.cv-tab--active) { color:#0284c7;background:rgba(56,189,248,.1); }
  .cv-tab--active { background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff!important;box-shadow:0 2px 10px rgba(14,165,233,.3); }

  /* Layout */
  .cv-content-grid { display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:20px; }
  @media(max-width:1024px){.cv-content-grid{grid-template-columns:1fr;}}

  /* Cards */
  .cv-card { background:var(--card-bg);border-radius:22px;border:1.5px solid var(--card-border);box-shadow:var(--shadow-md);overflow:hidden;transition:background .25s,border-color .25s; }
  .cv-card__head { display:flex;align-items:center;justify-content:space-between;padding:16px 20px 14px;border-bottom:1px solid var(--card-head-border); }
  .cv-card__title { font-size:14px;font-weight:800;color:var(--title-color);letter-spacing:-.2px; }
  .cv-card__body { padding:20px; }

  /* Filter bar */
  .cv-filter-bar { display:flex;align-items:center;gap:10px;padding:14px 20px;flex-wrap:wrap; }
  .cv-filter-label { font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);display:flex;align-items:center;gap:5px; }
  .cv-chips { display:flex;gap:6px;flex-wrap:wrap; }
  .cv-chip { padding:5px 15px;border-radius:20px;font-size:12px;font-weight:700;border:1.5px solid var(--chip-border);background:var(--chip-bg);color:var(--chip-color);cursor:pointer;transition:all .16s;font-family:inherit; }
  .cv-chip:hover:not(.cv-chip--active) { border-color:#7dd3fc;color:#0284c7;background:rgba(56,189,248,.08); }
  .cv-chip--active { background:linear-gradient(135deg,#0ea5e9,#0284c7);border-color:transparent;color:#fff;box-shadow:0 2px 8px rgba(14,165,233,.28); }

  /* Refresh btn */
  .cv-btn-refresh { display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:700;background:var(--refresh-bg);color:var(--refresh-color);border:1.5px solid var(--refresh-border);cursor:pointer;transition:all .16s;font-family:inherit; }
  .cv-btn-refresh:hover { background:rgba(56,189,248,.12);border-color:#38bdf8;box-shadow:0 2px 8px rgba(14,165,233,.15); }

  /* Section animation */
  @keyframes cv-fadein { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .cv-section { animation:cv-fadein .3s ease both; }
`;

const IcoCash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="22" height="22">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
  </svg>
);
const IcoCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="15" height="15">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
  </svg>
);
const IcoBuilding = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="15" height="15">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
  </svg>
);
const IcoChevron = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" width="12" height="12">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6l4 4 4-4"/>
  </svg>
);
const IcoRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
  </svg>
);
const IcoFilter = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="13" height="13">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
  </svg>
);

export default function CajaView() {
  const { isAdmin, idSucursal, usuario, tokenUsuario, subdominio } = useAuth();
  const { theme } = useTheme();

  const [fecha,                setFecha]                = useState(new Date().toISOString().split('T')[0]);
  const [filtroTipo,           setFiltroTipo]           = useState('todos');
  const [vista,                setVista]                = useState('general');
  const [refreshKey,           setRefreshKey]           = useState(0);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [sucursales,           setSucursales]           = useState([]);
  const [loadingSucursales,    setLoadingSucursales]    = useState(false);

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
      console.error(err);
      showToast('Error al cargar las sucursales', 'error');
    } finally { setLoadingSucursales(false); }
  };

  const getSucursalFilter    = () => isAdmin ? sucursalSeleccionada : idSucursal;
  const handleRegistroExitoso = () => setRefreshKey(k => k + 1);
  const handleRefresh         = () => setRefreshKey(k => k + 1);

  const vistaOptions  = [{ value:'general',label:'Vista General'},{value:'movimientos',label:'Movimientos'},{value:'cuadre',label:'Cuadre de Caja'}];
  const filtroOptions = [{ value:'todos',label:'Todos'},{value:'entrada',label:'Entradas'},{value:'salida',label:'Salidas'}];

  return (
    <>
      <style>{VIEW_STYLES}</style>
      <div className="cv-root" data-theme={theme}>

        <header className="cv-header">
          <div className="cv-header__brand">
            <div className="cv-header__icon"><IcoCash /></div>
            <div>
              <h1 className="cv-header__title">Control de Caja</h1>
              <p className="cv-header__sub">
                {isAdmin ? 'Gestiona todos los movimientos y cuadres de caja' : 'Vista limitada a tu sucursal asignada'}
              </p>
            </div>
          </div>

          <div className="cv-controls">
            <label className="cv-pill">
              <IcoCalendar />
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </label>

            {isAdmin && (
              <label className="cv-pill" style={{ gap: 6 }}>
                <IcoBuilding />
                <select
                  value={sucursalSeleccionada || ''}
                  onChange={e => setSucursalSeleccionada(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={loadingSucursales}
                >
                  <option value="">Todas las sedes</option>
                  {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
                <IcoChevron />
              </label>
            )}

            <nav className="cv-tabs">
              {vistaOptions.map(o => (
                <button key={o.value} className={`cv-tab${vista===o.value?' cv-tab--active':''}`} onClick={() => setVista(o.value)}>
                  {o.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {vista === 'general' && (
          <div className="cv-section" key={`general-${refreshKey}`}>
            <CajaDashboard fecha={fecha} isAdmin={isAdmin} idSucursal={getSucursalFilter()} onRefresh={handleRefresh} />
            <div className="cv-content-grid">
              <div className="cv-card">
                <div className="cv-card__head"><span className="cv-card__title">Registrar Movimiento</span></div>
                <div className="cv-card__body">
                  <RegistroMovimiento isAdmin={isAdmin} idSucursal={getSucursalFilter()} onRegistroExitoso={handleRegistroExitoso} />
                </div>
              </div>
              <div className="cv-card">
                <div className="cv-card__head">
                  <span className="cv-card__title">Movimientos de Caja</span>
                  <button className="cv-btn-refresh" onClick={handleRefresh}><IcoRefresh /> Actualizar</button>
                </div>
                <div style={{ paddingBottom: 16 }}>
                  <MovimientosTable fecha={fecha} filtroTipo={filtroTipo} isAdmin={isAdmin} idSucursal={getSucursalFilter()} onRefresh={handleRefresh} />
                </div>
              </div>
            </div>
          </div>
        )}

        {vista === 'movimientos' && (
          <div className="cv-section" key={`movimientos-${refreshKey}`}>
            <div className="cv-card">
              <div className="cv-filter-bar">
                <span className="cv-filter-label"><IcoFilter /> Filtrar</span>
                <div className="cv-chips">
                  {filtroOptions.map(o => (
                    <button key={o.value} className={`cv-chip${filtroTipo===o.value?' cv-chip--active':''}`} onClick={() => setFiltroTipo(o.value)}>
                      {o.label}
                    </button>
                  ))}
                </div>
                <button className="cv-btn-refresh" style={{ marginLeft: 'auto' }} onClick={handleRefresh}><IcoRefresh /> Actualizar</button>
              </div>
              <MovimientosTable fecha={fecha} filtroTipo={filtroTipo} isAdmin={isAdmin} idSucursal={getSucursalFilter()} onRefresh={handleRefresh} />
            </div>
          </div>
        )}

        {vista === 'cuadre' && (
          <div className="cv-section" key={`cuadre-${refreshKey}`}>
            <CuadreCaja fecha={fecha} isAdmin={isAdmin} idSucursal={getSucursalFilter()} />
          </div>
        )}

      </div>
    </>
  );
}