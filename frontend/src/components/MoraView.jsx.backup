/**
 * Vista de Gestión de Mora - Diseño Profesional
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  listarClientesMora, crearAbono, quitarMoraCliente,
  listarClientesConDeuda, resumenDeudaCliente
} from '../services/api';
import { showToast } from '../utils/toast';
import {
  ExclamationTriangleIcon, UserIcon, XMarkIcon, CheckIcon,
  CurrencyDollarIcon, CalendarIcon, DocumentTextIcon,
  ChartBarIcon, UsersIcon, EyeIcon, PhotoIcon, ArrowPathIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

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
  greenBorder: '#bbcbf7ff',
  amber:       '#d97706',
  red:         '#dc2626',
};

const fmt = (v) => {
  if (!v) return '$0';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(typeof v === 'string' ? parseFloat(v) : v);
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO') : '—';

const Badge = ({ children, color = C.blue }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, color, background: `${color}18` }}>
    {children}
  </span>
);

export default function MoraView() {
  const { usuario, tokenUsuario, subdominio } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detectar modo oscuro
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                     document.body.classList.contains('dark-mode') ||
                     localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    const handleStorageChange = () => checkDarkMode();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('darkModeChange', handleStorageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('darkModeChange', handleStorageChange);
    };
  }, []);

  const [tabActiva, setTabActiva]           = useState('mora');
  const [clientesEnMora, setClientesEnMora] = useState([]);
  const [clientesConDeuda, setClientesConDeuda] = useState([]);
  const [resumenDeuda, setResumenDeuda]     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [resumenCliente, setResumenCliente] = useState(null);
  const [mostrarModalAbono, setMostrarModalAbono]     = useState(false);
  const [mostrarModalSoporte, setMostrarModalSoporte] = useState(false);
  const [soporteSeleccionado, setSoporteSeleccionado] = useState(null);
  const [procesando, setProcesando]         = useState(false);
  const [busqueda, setBusqueda]             = useState('');
  const [formularioAbono, setFormularioAbono] = useState({
    monto: '', metodo_pago: 'efectivo', referencia: '', observaciones: '', soporte_pago: null
  });

  useEffect(() => {
    tabActiva === 'mora' ? cargarClientesEnMora() : cargarClientesConDeuda();
  }, [tabActiva]);

  const cargarClientesEnMora = async () => {
    setLoading(true);
    try {
      const r = await listarClientesMora({ token: tokenUsuario, usuario, subdominio });
      if (r.success) setClientesEnMora(r.data || []);
    } catch { showToast('error', 'Error al cargar clientes en mora'); }
    finally { setLoading(false); }
  };

  const cargarClientesConDeuda = async () => {
    setLoading(true);
    try {
      const r = await listarClientesConDeuda({ token: tokenUsuario, usuario, subdominio, solo_mora: false });
      if (r.success) { setClientesConDeuda(r.data || []); setResumenDeuda(r.resumen || null); }
    } catch { showToast('error', 'Error al cargar clientes con deuda'); }
    finally { setLoading(false); }
  };

  const verDetallesCliente = async (cliente) => {
    setClienteSeleccionado(cliente);
    setResumenCliente(null);
    try {
      const r = await resumenDeudaCliente({ token: tokenUsuario, usuario, subdominio, cliente_id: cliente.cliente_id });
      if (r.success) setResumenCliente({ ...r, productos_fiados: r.productos_fiados || cliente.productos_fiados || [] });
    } catch {
      setResumenCliente({
        cliente,
        deuda: { deuda_total: cliente.deuda_total, total_facturas_credito: cliente.total_facturas_credito, total_abonos: cliente.total_abonos },
        productos_fiados: cliente.productos_fiados || [],
        abonos: []
      });
    }
  };

  const cerrarDetalles = () => { setClienteSeleccionado(null); setResumenCliente(null); };

  const handleCrearAbono = async (e) => {
    e.preventDefault();
    const monto = parseFloat(formularioAbono.monto);
    if (!monto || monto <= 0) return showToast('error', 'Ingresa un monto válido');
    const deuda = resumenCliente?.deuda?.deuda_total ? parseFloat(resumenCliente.deuda.deuda_total) : 0;
    if (monto > deuda) return showToast('error', `El monto no puede superar ${fmt(deuda)}`);
    if (['transferencia','nequi','tarjeta'].includes(formularioAbono.metodo_pago) && !formularioAbono.soporte_pago)
      return showToast('error', 'Adjunta el soporte de pago');
    setProcesando(true);
    try {
      const r = await crearAbono({ token: tokenUsuario, usuario, subdominio, cliente_id: clienteSeleccionado.cliente_id, ...formularioAbono });
      if (r.success) {
        showToast('success', 'Abono registrado');
        await verDetallesCliente(clienteSeleccionado);
        tabActiva === 'mora' ? await cargarClientesEnMora() : await cargarClientesConDeuda();
        setFormularioAbono({ monto: '', metodo_pago: 'efectivo', referencia: '', observaciones: '', soporte_pago: null });
        setMostrarModalAbono(false);
      }
    } catch (err) { showToast('error', err.message || 'Error al registrar abono'); }
    finally { setProcesando(false); }
  };

  const handleQuitarMora = async () => {
    if (!confirm('¿Quitar este cliente de mora?')) return;
    setProcesando(true);
    try {
      const r = await quitarMoraCliente({ token: tokenUsuario, usuario, subdominio, cliente_id: clienteSeleccionado.cliente_id, observaciones: 'Saldo cancelado manualmente' });
      if (r.success) { showToast('success', 'Cliente quitado de mora'); await cargarClientesEnMora(); cerrarDetalles(); }
    } catch (err) { showToast('error', err.message || 'Error al quitar mora'); }
    finally { setProcesando(false); }
  };

  const lista = (tabActiva === 'mora' ? clientesEnMora : clientesConDeuda).filter(cliente => {
    if (!busqueda) return true;
    const searchTerm = busqueda.toLowerCase().trim();
    return (
      cliente.nombre?.toLowerCase().includes(searchTerm) ||
      cliente.numero_documento?.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="font-sans bg-gray-50 dark:!bg-slate-900 min-h-screen flex flex-col">
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .mora-card:hover{border-color:#2563eb!important;box-shadow:0 2px 8px rgba(37,99,235,.1)}

        /* ─── Responsive Design para MoraView ────────────────────────────── */

        /* ─── Desktop & Large Screens (≥ 1024px) ─────────────────────────── */
        @media (min-width: 1024px) {
          .mora-stat-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          .mora-content-grid {
            grid-template-columns: 1fr 340px !important;
          }
        }

        /* ─── Tablet (768px - 1023px) ──────────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          .mora-stat-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .mora-content-grid {
            grid-template-columns: 1fr !important;
          }
          .mora-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .mora-header-tabs {
            width: 100% !important;
            overflow-x: auto !important;
          }
          .mora-header-btns {
            width: 100% !important;
            flex-direction: column !important;
            gap: 8px !important;
          }
          .mora-tab-btn {
            flex: 1 !important;
            min-width: 120px !important;
            justify-content: center !important;
          }
          .mora-refresh-btn {
            width: 100% !important;
          }
        }

        /* ─── Mobile & Tablet Landscape (481px - 767px) ──────────────────── */
        @media (min-width: 481px) and (max-width: 767px) {
          .mora-stat-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .mora-stat-card {
            padding: 12px !important;
          }
          .mora-content-grid {
            grid-template-columns: 1fr !important;
          }
          .mora-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
            padding: 12px 16px !important;
          }
          .mora-title {
            font-size: 16px !important;
          }
          .mora-subtitle {
            font-size: 11px !important;
          }
          .mora-header-tabs {
            width: 100% !important;
            display: flex !important;
            overflow-x: auto !important;
          }
          .mora-tab-btn {
            flex: 1 !important;
            padding: 8px 12px !important;
            font-size: 12px !important;
            min-width: 140px !important;
          }
          .mora-header-btns {
            width: 100% !important;
            flex-direction: column !important;
            gap: 6px !important;
          }
          .mora-refresh-btn {
            width: 100% !important;
            padding: 10px 12px !important;
          }
          .mora-search {
            padding: 12px 16px !important;
          }
          .mora-content {
            padding: 16px !important;
            gap: 16px !important;
          }
          .mora-details-panel {
            position: static !important;
          }
        }

        /* ─── Mobile Portrait (≤ 480px) ──────────────────────────────────── */
        @media (max-width: 480px) {
          .mora-stat-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .mora-stat-card {
            padding: 10px !important;
          }
          .mora-stat-icon {
            width: 12px !important;
            height: 12px !important;
          }
          .mora-stat-label {
            font-size: 9px !important;
          }
          .mora-stat-value {
            font-size: 14px !important;
          }
          .mora-stat-sub {
            font-size: 9px !important;
          }
          .mora-content-grid {
            grid-template-columns: 1fr !important;
          }
          .mora-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
            padding: 10px 12px !important;
          }
          .mora-title {
            font-size: 15px !important;
          }
          .mora-subtitle {
            font-size: 10px !important;
          }
          .mora-header-tabs {
            width: 100% !important;
            display: flex !important;
          }
          .mora-tab-btn {
            flex: 1 !important;
            padding: 8px 10px !important;
            font-size: 11px !important;
            min-width: 120px !important;
          }
          .mora-header-btns {
            width: 100% !important;
            flex-direction: column !important;
            gap: 6px !important;
          }
          .mora-refresh-btn {
            width: 100% !important;
            padding: 8px 10px !important;
            font-size: 12px !important;
          }
          .mora-search {
            padding: 10px 12px !important;
          }
          .mora-search-input {
            font-size: 13px !important;
            padding: 8px 36px 8px 10px !important;
          }
          .mora-content {
            padding: 12px !important;
            gap: 12px !important;
          }
          .mora-cliente-card {
            padding: 10px !important;
          }
          .mora-cliente-icon {
            width: 32px !important;
            height: 32px !important;
          }
          .mora-cliente-name {
            font-size: 13px !important;
          }
          .mora-cliente-doc {
            font-size: 10px !important;
          }
          .mora-cliente-info {
            font-size: 10px !important;
          }
          .mora-details-panel {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 50 !important;
            border-radius: 0 !important;
          }
          .mora-modal {
            padding: 16px !important;
            margin: 8px !important;
          }
          .mora-modal-title {
            font-size: 14px !important;
          }
        }

        /* ─── Very small mobile (≤ 380px) ────────────────────────────────── */
        @media (max-width: 380px) {
          .mora-stat-card {
            padding: 8px !important;
          }
          .mora-stat-value {
            font-size: 12px !important;
          }
          .mora-title {
            font-size: 14px !important;
          }
          .mora-tab-btn {
            padding: 7px 8px !important;
            font-size: 10px !important;
          }
          .mora-cliente-card {
            padding: 8px !important;
          }
          .mora-cliente-icon {
            width: 28px !important;
            height: 28px !important;
          }
          .mora-cliente-name {
            font-size: 12px !important;
          }
          .mora-search {
            padding: 8px 10px !important;
          }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div className="mora-header bg-white dark:!bg-slate-900 border-b border-gray-200 dark:!border-slate-700 px-7 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="mora-title text-base font-bold text-gray-900 dark:!text-white m-0">Gestión de Crédito y Mora</h2>
          <p className="mora-subtitle text-xs text-gray-500 dark:!text-slate-400 mt-0.5">Administra clientes en mora y control de deuda</p>
        </div>
        <div className="mora-header-btns flex items-center gap-2">
          <div className="mora-header-tabs flex gap-0.5 bg-gray-50 dark:!bg-slate-800 rounded-lg p-0.5 border border-gray-200 dark:!border-slate-700">
            <button className={`mora-tab-btn flex items-center gap-1.5 px-5 py-2.5 rounded-md border-0 cursor-pointer text-sm font-semibold transition-all ${tabActiva === 'mora' ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-blue-600 dark:!text-blue-400'}`} onClick={() => setTabActiva('mora')}>
              <ExclamationTriangleIcon style={{ width: 16, height: 16 }} />
              Clientes en Mora
              {clientesEnMora.length > 0 && <Badge>{clientesEnMora.length}</Badge>}
            </button>
            <button className={`mora-tab-btn flex items-center gap-1.5 px-5 py-2.5 rounded-md border-0 cursor-pointer text-sm font-semibold transition-all ${tabActiva === 'deuda' ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-blue-600 dark:!text-blue-400'}`} onClick={() => setTabActiva('deuda')}>
              <ChartBarIcon style={{ width: 16, height: 16 }} />
              Deuda General
              {clientesConDeuda.length > 0 && <Badge>{clientesConDeuda.length}</Badge>}
            </button>
          </div>
          <button className="mora-refresh-btn inline-flex items-center gap-1.5 px-5 py-2.5 bg-transparent text-blue-600 dark:!text-blue-400 border border-blue-300 dark:!border-blue-600 rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-50 dark:hover:!bg-blue-900/30" onClick={() => tabActiva === 'mora' ? cargarClientesEnMora() : cargarClientesConDeuda()}>
            <ArrowPathIcon style={{ width: 16, height: 16 }} /> Actualizar
          </button>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      {tabActiva === 'deuda' && resumenDeuda && (
        <div className="mora-stat-grid grid grid-cols-4 gap-3.5 px-7 py-4 bg-white dark:!bg-slate-900 border-b border-gray-200 dark:!border-slate-700">
          {[
            { label: 'Clientes con Deuda',  value: resumenDeuda.total_clientes_con_deuda,          accent: 'bg-blue-600',  icon: UsersIcon },
            { label: 'Deuda Total',          value: fmt(resumenDeuda.total_deuda_general),           accent: 'bg-purple-600', icon: CurrencyDollarIcon },
            { label: 'En Mora',              value: fmt(resumenDeuda.total_deuda_mora),               accent: 'bg-red-600',   icon: ExclamationTriangleIcon, sub: `${resumenDeuda.clientes_en_mora} clientes` },
            { label: 'Crédito Vigente',      value: fmt(resumenDeuda.total_deuda_credito_vigente),    accent: 'bg-green-600', icon: CheckIcon, sub: `${resumenDeuda.clientes_con_credito_vigente} clientes` },
          ].map((st, i) => (
            <div key={i} className="mora-stat-card bg-gray-50 dark:!bg-slate-800 rounded-lg p-3.5 border border-gray-200 dark:!border-slate-700 border-l-4" style={{ borderLeftColor: st.accent.replace('bg-', '').replace('-600', '') === 'blue' ? '#2563eb' : st.accent.replace('bg-', '').replace('-600', '') === 'purple' ? '#7c3aed' : st.accent.replace('bg-', '').replace('-600', '') === 'red' ? '#dc2626' : '#16a34a' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <st.icon style={{ width: 14, height: 14 }} className={`mora-stat-icon ${st.accent.replace('bg-', 'text-')}`} />
                <span className="mora-stat-label text-xs font-semibold text-gray-500 dark:!text-slate-400 uppercase tracking-wider">{st.label}</span>
              </div>
              <div className="mora-stat-value text-lg font-bold text-gray-900 dark:!text-white">{st.value}</div>
              {st.sub && <div className="mora-stat-sub text-xs text-gray-500 dark:!text-slate-400 mt-0.5">{st.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* ── BARRA DE BÚSQUEDA ── */}
      <div className="mora-search px-7 py-3 bg-gray-50 dark:!bg-slate-800 border-b border-gray-200 dark:!border-slate-700">
        <div className="relative max-w-md mx-auto">
          <MagnifyingGlassIcon style={{ width: 18, height: 18 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o número de documento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="mora-search-input w-full pl-10 pr-4 py-2.5 bg-white dark:!bg-slate-900 border border-gray-300 dark:!border-slate-600 rounded-lg text-sm text-gray-900 dark:!text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:!text-slate-300"
            >
              <XMarkIcon style={{ width: 16, height: 16 }} />
            </button>
          )}
        </div>
        {(tabActiva === 'deuda' ? clientesConDeuda : clientesEnMora).length > 0 && (
          <p className="text-xs text-gray-500 dark:!text-slate-400 mt-2">
            Mostrando {lista.length} de {(tabActiva === 'deuda' ? clientesConDeuda : clientesEnMora).length} clientes
            {busqueda && ` (filtrado por "${busqueda}")`}
          </p>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="mora-content mora-content-grid flex-1 px-7 py-5 grid gap-5 items-start" style={{ gridTemplateColumns: clienteSeleccionado && resumenCliente ? '1fr 340px' : '1fr' }}>

        {/* Lista */}
        <div className="mora-clientes-list bg-white dark:!bg-slate-900 rounded-xl border border-gray-200 dark:!border-slate-700 overflow-hidden shadow-sm">
          <div className="px-6 py-3 border-b border-gray-200 dark:!border-slate-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:!bg-blue-900/20 flex items-center justify-center flex-shrink-0">
              {tabActiva === 'mora'
                ? <ExclamationTriangleIcon style={{ width: 20, height: 20 }} className="text-blue-600 dark:!text-blue-400" />
                : <ChartBarIcon style={{ width: 20, height: 20 }} className="text-blue-600 dark:!text-blue-400" />
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:!text-white m-0">{tabActiva === 'mora' ? 'Clientes en Mora' : 'Clientes con Deuda'}</p>
              <p className="text-xs text-gray-500 dark:!text-slate-400 mt-0.5">{lista.length} {tabActiva === 'mora' ? 'pendientes' : 'con deuda'}</p>
            </div>
          </div>

          <div className="p-3.5">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-7 h-7 border-2 border-gray-300 dark:!border-slate-600 border-t-blue-600 rounded-full animate-spin mx-auto mb-2.5"></div>
                <p className="text-gray-500 dark:!text-slate-400 text-sm">Cargando…</p>
              </div>
            ) : lista.length === 0 ? (
              <div className="text-center py-13">
                <div className="w-16 h-16 rounded-full bg-green-50 dark:!bg-green-900/20 border border-green-200 dark:!border-green-800 flex items-center justify-center mx-auto mb-3">
                  <CheckIcon style={{ width: 26, height: 26 }} className="text-green-600 dark:!text-green-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:!text-slate-300 m-0">{tabActiva === 'mora' ? '¡Sin clientes en mora!' : '¡Sin clientes con deuda!'}</p>
                <p className="text-xs text-gray-500 dark:!text-slate-400 mt-1">{tabActiva === 'mora' ? 'Todos los clientes están al día' : 'Todos han pagado'}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {lista.map((cl) => {
                  const sel = clienteSeleccionado?.cliente_id === cl.cliente_id;
                  return (
                    <div key={cl.cliente_id} className={`mora-cliente-card mora-card p-3 rounded-lg cursor-pointer border transition-all ${sel ? 'bg-blue-50 dark:!bg-blue-900/20 border-blue-500 dark:!border-blue-500' : 'bg-white dark:!bg-slate-900 border-gray-200 dark:!border-slate-700 hover:border-blue-500 dark:hover:!border-blue-500'}`}
                      onClick={() => verDetallesCliente(cl)}>
                      <div className="flex items-start gap-3">
                        <div className="mora-cliente-icon w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center"
                          className={sel ? 'bg-blue-100 dark:!bg-blue-800 border-blue-200 dark:!border-blue-700' : 'bg-gray-50 dark:!bg-slate-800 border-gray-200 dark:!border-slate-700'}>
                          <UserIcon style={{ width: 16, height: 16 }} className={sel ? 'text-blue-600 dark:!text-blue-400' : 'text-gray-500 dark:!text-slate-400'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="mora-cliente-name font-semibold text-sm text-gray-900 dark:!text-white">{cl.nombre}</span>
                            {cl.en_mora && <Badge color="#dc2626">MORA</Badge>}
                          </div>
                          <p className="mora-cliente-doc text-xs text-gray-500 dark:!text-slate-400 mb-2">{cl.numero_documento}</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            {tabActiva === 'mora' ? (
                              <>
                                <span className={`flex items-center gap-1 text-xs font-semibold ${cl.dias_mora > 60 ? 'text-red-600 dark:!text-red-400' : 'text-amber-600 dark:!text-amber-400'}`}>
                                  <CalendarIcon style={{ width: 12, height: 12 }} />{cl.dias_mora} días en mora
                                </span>
                                {cl.fecha_ultimo_pago && <span className="text-xs text-gray-500 dark:!text-slate-400">Último pago: {fmtDate(cl.fecha_ultimo_pago)}</span>}
                              </>
                            ) : (
                              <>
                                <span className="flex items-center gap-1 text-sm font-bold text-blue-600 dark:!text-blue-400">
                                  <CurrencyDollarIcon style={{ width: 12, height: 12 }} />{fmt(cl.deuda_total)}
                                </span>
                                {cl.total_facturas_credito !== '0' && <span className="text-xs text-gray-500 dark:!text-slate-400">Facturas: {fmt(cl.total_facturas_credito)}</span>}
                                {cl.total_productos_fiados > 0 && <Badge color="#7c3aed">{cl.total_productos_fiados} productos</Badge>}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panel Detalles */}
        {clienteSeleccionado && resumenCliente && (
          <>
            {/* Backdrop for mobile */}
            <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={cerrarDetalles}></div>
            <div className="mora-details-panel bg-white dark:!bg-slate-900 rounded-xl border border-gray-200 dark:!border-slate-700 overflow-hidden shadow-sm sticky top-5 lg:relative lg:z-0 z-50">
            <div className="px-4.5 py-3 border-b border-gray-200 dark:!border-slate-700 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:!text-white m-0">Detalle del Cliente</p>
                <p className="text-xs text-gray-500 dark:!text-slate-400 mt-0.5 max-w-[220px] whitespace-nowrap overflow-hidden text-ellipsis">{resumenCliente.cliente.nombre}</p>
              </div>
              <button onClick={cerrarDetalles} className="bg-transparent border-0 cursor-pointer p-1 text-gray-500 dark:!text-slate-400 rounded-md hover:bg-gray-100 dark:hover:!bg-slate-800">
                <XMarkIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="p-3.5 max-h-[calc(100vh-200px)] overflow-y-auto flex flex-col gap-3">

              {/* Resumen */}
              <div className="bg-gray-50 dark:!bg-slate-800 rounded-lg p-3 border border-gray-200 dark:!border-slate-700">
                {[
                  resumenCliente.cliente.dias_mora !== undefined && { label: 'Días en mora', value: `${resumenCliente.cliente.dias_mora} días`, color: resumenCliente.cliente.dias_mora > 30 ? 'text-red-600 dark:!text-red-400' : 'text-green-600 dark:!text-green-400' },
                  resumenCliente.deuda && { label: 'Deuda total', value: fmt(resumenCliente.deuda.deuda_total), color: 'text-blue-600 dark:!text-blue-400', bold: true },
                  resumenCliente.deuda && { label: 'Facturas crédito', value: fmt(resumenCliente.deuda.total_facturas_credito), color: 'text-gray-900 dark:!text-white' },
                  resumenCliente.deuda && { label: 'Total abonado', value: fmt(resumenCliente.deuda.total_abonos), color: 'text-gray-900 dark:!text-white' },
                  resumenCliente.cliente.fecha_ultimo_pago && { label: 'Último pago', value: fmtDate(resumenCliente.cliente.fecha_ultimo_pago), color: 'text-gray-900 dark:!text-white' },
                ].filter(Boolean).map((row, i, arr) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b last:border-0 border-gray-200 dark:!border-slate-700">
                    <span className="text-xs text-gray-600 dark:!text-slate-400">{row.label}</span>
                    <span className={`text-sm ${row.bold ? 'font-bold' : 'font-semibold'} ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Acciones */}
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white border-0 rounded-lg text-xs font-semibold cursor-pointer hover:bg-blue-700 disabled:opacity-60" onClick={() => setMostrarModalAbono(true)} disabled={procesando}>
                  <CurrencyDollarIcon style={{ width: 14, height: 14 }} /> Registrar Abono
                </button>
                {tabActiva === 'mora' && resumenCliente.cliente.dias_mora > 30 && (
                  <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white border-0 rounded-lg text-xs font-semibold cursor-pointer hover:bg-green-700 disabled:opacity-60" onClick={handleQuitarMora} disabled={procesando}>
                    <CheckIcon style={{ width: 14, height: 14 }} /> Quitar Mora
                  </button>
                )}
              </div>

              {/* Abonos */}
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:!text-white mb-2">Historial de Abonos</p>
                {resumenCliente.abonos?.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {resumenCliente.abonos.map((ab) => (
                      <div key={ab.abono_id || ab.id} className="bg-green-50 dark:!bg-green-900/20 border border-green-200 dark:!border-green-800 rounded-lg p-2.5">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-green-600 dark:!text-green-400 text-sm m-0">{fmt(ab.monto)}</p>
                            <p className="text-xs text-gray-500 dark:!text-slate-400 mt-0.5">{fmtDate(ab.fecha_abono)}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge color="#16a34a">{ab.metodo_pago}</Badge>
                            {ab.soporte_pago && (
                              <button onClick={() => { setSoporteSeleccionado(ab.soporte_pago); setMostrarModalSoporte(true); }}
                                className="bg-blue-50 dark:!bg-blue-900/20 border-0 rounded-md p-1 cursor-pointer text-blue-600 dark:!text-blue-400 hover:bg-blue-100 dark:hover:!bg-blue-900/30">
                                <EyeIcon style={{ width: 12, height: 12 }} />
                              </button>
                            )}
                          </div>
                        </div>
                        {ab.observaciones && <p className="text-xs text-gray-600 dark:!text-slate-400 mt-1 italic">"{ab.observaciones}"</p>}
                        {ab.registrado_por && <p className="text-xs text-gray-500 dark:!text-slate-400 mt-0.5">Por: {ab.registrado_por}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-3.5 bg-gray-50 dark:!bg-slate-800 rounded-lg border border-gray-200 dark:!border-slate-700">
                    <p className="text-xs text-gray-500 dark:!text-slate-400 m-0">Sin abonos registrados</p>
                  </div>
                )}
              </div>

              {/* Productos fiados */}
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:!text-white mb-2">Productos a Crédito</p>
                {resumenCliente.productos_fiados?.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {resumenCliente.productos_fiados.map((pr, i) => (
                      <div key={`${pr.factura_id}-${i}`} className="bg-blue-50 dark:!bg-blue-900/20 border border-blue-200 dark:!border-blue-800 rounded-lg p-2.5">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:!text-white text-sm m-0">{pr.producto_nombre}</p>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-gray-600 dark:!text-slate-400">SKU: {pr.producto_sku || '—'}</span>
                              <span className="text-xs text-gray-600 dark:!text-slate-400">x{pr.cantidad}</span>
                              <span className="text-xs text-gray-600 dark:!text-slate-400">{fmt(pr.valor_unitario)} c/u</span>
                            </div>
                          </div>
                          <p className="font-bold text-blue-600 dark:!text-blue-400 text-sm m-0">{fmt(pr.valor_total)}</p>
                        </div>
                        <div className="flex justify-between mt-2 pt-2 border-t border-blue-200 dark:!border-blue-800">
                          <span className="text-xs text-gray-500 dark:!text-slate-400">Factura: {pr.numero_factura}</span>
                          <span className="text-xs text-gray-500 dark:!text-slate-400">{fmtDate(pr.fecha_venta)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-3.5 bg-gray-50 dark:!bg-slate-800 rounded-lg border border-gray-200 dark:!border-slate-700">
                    <p className="text-xs text-gray-500 dark:!text-slate-400 m-0">Sin productos a crédito</p>
                  </div>
                )}
              </div>

              {resumenCliente.total_abonado && resumenCliente.total_abonado !== '0' && (
                <div className="bg-green-50 dark:!bg-green-900/20 border border-green-200 dark:!border-green-800 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-green-600 dark:!text-green-400">Total Abonado</span>
                  <span className="text-base font-extrabold text-green-600 dark:!text-green-400">{fmt(resumenCliente.total_abonado)}</span>
                </div>
              )}
            </div>
          </div>
          </>
        )}
      </div>

      {/* ── MODAL ABONO ── */}
      {mostrarModalAbono && (
        <div className="fixed inset-0 bg-gray-900/45 dark:!bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="mora-modal bg-white dark:!bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:!border-slate-700 flex justify-between items-center">
              <div>
                <p className="mora-modal-title text-sm font-bold text-gray-900 dark:!text-white m-0">Registrar Abono</p>
                <p className="text-xs text-gray-500 dark:!text-slate-400 mt-0.5">{clienteSeleccionado?.nombre}</p>
              </div>
              <button onClick={() => setMostrarModalAbono(false)} className="bg-transparent border-0 cursor-pointer p-1 text-gray-500 dark:!text-slate-400 rounded-md hover:bg-gray-100 dark:hover:!bg-slate-800">
                <XMarkIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <form onSubmit={handleCrearAbono} className="p-5 flex flex-col gap-3.5">
              <div className="bg-blue-50 dark:!bg-blue-900/20 border border-blue-200 dark:!border-blue-800 rounded-lg p-2.5 flex justify-between items-center">
                <span className="text-xs font-semibold text-blue-600 dark:!text-blue-400">Deuda Total</span>
                <span className="text-base font-extrabold text-blue-700 dark:!text-blue-300">{fmt(resumenCliente?.deuda?.deuda_total || 0)}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:!text-slate-300 mb-1">Monto del Abono *</label>
                <input type="number" step="0.01" min="0" max={resumenCliente?.deuda?.deuda_total || ''} placeholder="0" required className="w-full px-3 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg text-sm text-gray-900 dark:!text-white bg-white dark:!bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formularioAbono.monto} onChange={e => setFormularioAbono({ ...formularioAbono, monto: e.target.value })} />
                <p className="text-xs text-gray-500 dark:!text-slate-400 mt-1">Máximo: {fmt(resumenCliente?.deuda?.deuda_total || 0)}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:!text-slate-300 mb-1">Método de Pago</label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg text-sm text-gray-900 dark:!text-white bg-white dark:!bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" value={formularioAbono.metodo_pago}
                  onChange={e => setFormularioAbono({ ...formularioAbono, metodo_pago: e.target.value, soporte_pago: null })}>
                  {['efectivo','transferencia','nequi','tarjeta','otro'].map(m => (
                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
              </div>

              {['transferencia','nequi','tarjeta','otro'].includes(formularioAbono.metodo_pago) && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:!text-slate-300 mb-1">Soporte de Pago *</label>
                  <input type="file" accept="image/*,.pdf" required className="w-full px-3 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg text-sm text-gray-900 dark:!text-white bg-white dark:!bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 pt-1.5"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file?.size > 5 * 1024 * 1024) { showToast('error', 'Máximo 5MB'); e.target.value = ''; return; }
                      if (file) setFormularioAbono({ ...formularioAbono, soporte_pago: file });
                    }} />
                  {formularioAbono.soporte_pago && <p className="text-xs text-green-600 dark:!text-green-400 mt-1">✓ {formularioAbono.soporte_pago.name}</p>}
                  <p className="text-xs text-gray-500 dark:!text-slate-400 mt-1">JPG, PNG, PDF — máx. 5 MB</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:!text-slate-300 mb-1">Referencia (opcional)</label>
                <input type="text" placeholder="Número de recibo" className="w-full px-3 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg text-sm text-gray-900 dark:!text-white bg-white dark:!bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formularioAbono.referencia} onChange={e => setFormularioAbono({ ...formularioAbono, referencia: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:!text-slate-300 mb-1">Observaciones (opcional)</label>
                <textarea rows={2} placeholder="Notas sobre el abono…" className="w-full px-3 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg text-sm text-gray-900 dark:!text-white bg-white dark:!bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  value={formularioAbono.observaciones} onChange={e => setFormularioAbono({ ...formularioAbono, observaciones: e.target.value })} />
              </div>

              <div className="flex gap-2 pt-0.5">
                <button type="button" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-transparent text-gray-700 dark:!text-slate-300 border border-gray-300 dark:!border-slate-600 rounded-lg text-xs font-semibold cursor-pointer hover:bg-gray-50 dark:hover:!bg-slate-800" onClick={() => setMostrarModalAbono(false)} disabled={procesando}>Cancelar</button>
                <button type="submit" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white border-0 rounded-lg text-xs font-semibold cursor-pointer hover:bg-blue-700 disabled:opacity-60" disabled={procesando}>
                  {procesando
                    ? <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Procesando…</>
                    : <><CheckIcon style={{ width: 14, height: 14 }} /> Registrar Abono</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL SOPORTE ── */}
      {mostrarModalSoporte && soporteSeleccionado && (
        <div className="fixed inset-0 bg-gray-900/50 dark:!bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="mora-modal bg-white dark:!bg-slate-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:!border-slate-700 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:!bg-blue-900/20 flex items-center justify-center">
                  <PhotoIcon style={{ width: 16, height: 16 }} className="text-blue-600 dark:!text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:!text-white m-0">Soporte de Pago</p>
                  <p className="text-xs text-gray-500 dark:!text-slate-400 mt-0.5">Comprobante del abono</p>
                </div>
              </div>
              <button onClick={() => { setMostrarModalSoporte(false); setSoporteSeleccionado(null); }}
                className="bg-transparent border-0 cursor-pointer p-1 text-gray-500 dark:!text-slate-400 rounded-md hover:bg-gray-100 dark:hover:!bg-slate-800">
                <XMarkIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5 flex items-center justify-center">
              {soporteSeleccionado.toLowerCase().endsWith('.pdf') ? (
                <object data={soporteSeleccionado} type="application/pdf" className="w-full min-h-[500px] rounded-lg border border-gray-200 dark:!border-slate-700">
                  <div className="text-center p-7">
                    <p className="text-gray-600 dark:!text-slate-400 mb-3">No se puede previsualizar el PDF</p>
                    <a href={soporteSeleccionado} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white border-0 rounded-lg text-xs font-semibold cursor-pointer hover:bg-blue-700 no-underline">
                      <DocumentTextIcon style={{ width: 14, height: 14 }} /> Abrir PDF
                    </a>
                  </div>
                </object>
              ) : (
                <img src={soporteSeleccionado} alt="Soporte de pago"
                  className="max-w-full max-h-full rounded-lg border border-gray-200 dark:!border-slate-700 shadow-sm"
                  onError={e => { e.target.src = '/placeholder-image.png'; }} />
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-200 dark:!border-slate-700 flex gap-2 justify-end flex-shrink-0">
              <a href={soporteSeleccionado} download={`soporte_${Date.now()}`} className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white border-0 rounded-lg text-xs font-semibold cursor-pointer hover:bg-blue-700 no-underline">
                <DocumentTextIcon style={{ width: 14, height: 14 }} /> Descargar
              </a>
              <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-transparent text-gray-700 dark:!text-slate-300 border border-gray-300 dark:!border-slate-600 rounded-lg text-xs font-semibold cursor-pointer hover:bg-gray-50 dark:hover:!bg-slate-800" onClick={() => { setMostrarModalSoporte(false); setSoporteSeleccionado(null); }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}