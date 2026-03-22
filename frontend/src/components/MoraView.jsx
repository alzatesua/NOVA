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
  ChartBarIcon, UsersIcon, EyeIcon, PhotoIcon, ArrowPathIcon
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

  const lista = tabActiva === 'mora' ? clientesEnMora : clientesConDeuda;

  /* ── Styles object ── */
  const s = {
    page:      { fontFamily: "'Inter', -apple-system, sans-serif", background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    header:    { background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
    tabBar:    { display: 'flex', gap: 2, background: C.bg, borderRadius: 8, padding: 3, border: `1px solid ${C.border}` },
    tab: (on) => ({ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all .15s', background: on ? C.surface : 'transparent', color: on ? C.blue : C.textSub, boxShadow: on ? '0 1px 3px rgba(0,0,0,.07)' : 'none' }),
    statGrid:  { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, padding: '16px 28px', background: C.surface, borderBottom: `1px solid ${C.border}` },
    statCard: (accent) => ({ background: C.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${C.border}`, borderLeft: `3px solid ${accent}` }),
    main:      { flex: 1, padding: '20px 28px', display: 'grid', gap: 20, alignItems: 'start' },
    panel:     { background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,.04)' },
    panelHead: { padding: '13px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 },
    card: (on) => ({ padding: '13px 15px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${on ? C.blue : C.border}`, background: on ? C.blueLight : C.surface, transition: 'all .15s' }),
    btnBlue:    { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 15px', background: C.blue, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    btnGreen:   { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 15px', background: C.green, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    btnGhost:   { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 15px', background: 'transparent', color: C.textMid, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    input:      { width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surface, outline: 'none', boxSizing: 'border-box' },
    lbl:        { display: 'block', fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 5 },
  };

  return (
    <div style={s.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .mora-card:hover{border-color:${C.blue}!important;box-shadow:0 2px 8px rgba(37,99,235,.1)}`}</style>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0 }}>Gestión de Crédito y Mora</h2>
          <p style={{ fontSize: 12, color: C.textSub, margin: '2px 0 0' }}>Administra clientes en mora y control de deuda</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={s.tabBar}>
            <button style={s.tab(tabActiva === 'mora')} onClick={() => setTabActiva('mora')}>
              <ExclamationTriangleIcon style={{ width: 14, height: 14 }} />
              Clientes en Mora
              {clientesEnMora.length > 0 && <Badge color={C.blue}>{clientesEnMora.length}</Badge>}
            </button>
            <button style={s.tab(tabActiva === 'deuda')} onClick={() => setTabActiva('deuda')}>
              <ChartBarIcon style={{ width: 14, height: 14 }} />
              Deuda General
              {clientesConDeuda.length > 0 && <Badge color={C.blue}>{clientesConDeuda.length}</Badge>}
            </button>
          </div>
          <button style={s.btnGhost} onClick={() => tabActiva === 'mora' ? cargarClientesEnMora() : cargarClientesConDeuda()}>
            <ArrowPathIcon style={{ width: 13, height: 13 }} /> Actualizar
          </button>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      {tabActiva === 'deuda' && resumenDeuda && (
        <div style={s.statGrid}>
          {[
            { label: 'Clientes con Deuda',  value: resumenDeuda.total_clientes_con_deuda,          accent: C.blue,  icon: UsersIcon },
            { label: 'Deuda Total',          value: fmt(resumenDeuda.total_deuda_general),           accent: '#7c3aed', icon: CurrencyDollarIcon },
            { label: 'En Mora',              value: fmt(resumenDeuda.total_deuda_mora),               accent: C.red,   icon: ExclamationTriangleIcon, sub: `${resumenDeuda.clientes_en_mora} clientes` },
            { label: 'Crédito Vigente',      value: fmt(resumenDeuda.total_deuda_credito_vigente),    accent: C.green, icon: CheckIcon, sub: `${resumenDeuda.clientes_con_credito_vigente} clientes` },
          ].map((st, i) => (
            <div key={i} style={s.statCard(st.accent)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                <st.icon style={{ width: 14, height: 14, color: st.accent }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{st.label}</span>
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, color: C.text }}>{st.value}</div>
              {st.sub && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{st.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* ── CONTENT ── */}
      <div style={{ ...s.main, gridTemplateColumns: clienteSeleccionado && resumenCliente ? '1fr 355px' : '1fr' }}>

        {/* Lista */}
        <div style={s.panel}>
          <div style={s.panelHead}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {tabActiva === 'mora'
                ? <ExclamationTriangleIcon style={{ width: 15, height: 15, color: C.blue }} />
                : <ChartBarIcon style={{ width: 15, height: 15, color: C.blue }} />
              }
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>{tabActiva === 'mora' ? 'Clientes en Mora' : 'Clientes con Deuda'}</p>
              <p style={{ fontSize: 12, color: C.textSub, margin: '1px 0 0' }}>{lista.length} {tabActiva === 'mora' ? 'pendientes' : 'con deuda'}</p>
            </div>
          </div>

          <div style={{ padding: 14 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ width: 28, height: 28, border: `2px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 10px' }} />
                <p style={{ color: C.textMuted, fontSize: 13 }}>Cargando…</p>
              </div>
            ) : lista.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '52px 0' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.greenLight, border: `1px solid ${C.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <CheckIcon style={{ width: 26, height: 26, color: C.green }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.textMid, margin: 0 }}>{tabActiva === 'mora' ? '¡Sin clientes en mora!' : '¡Sin clientes con deuda!'}</p>
                <p style={{ fontSize: 12, color: C.textMuted, margin: '4px 0 0' }}>{tabActiva === 'mora' ? 'Todos los clientes están al día' : 'Todos han pagado'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {lista.map((cl) => {
                  const sel = clienteSeleccionado?.cliente_id === cl.cliente_id;
                  return (
                    <div key={cl.cliente_id} className="mora-card" style={s.card(sel)} onClick={() => verDetallesCliente(cl)}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: sel ? '#dbeafe' : C.bg, border: `1px solid ${sel ? C.blueBorder : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <UserIcon style={{ width: 16, height: 16, color: sel ? C.blue : C.textSub }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                            <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{cl.nombre}</span>
                            {cl.en_mora && <Badge color={C.red}>MORA</Badge>}
                          </div>
                          <p style={{ fontSize: 12, color: C.textSub, margin: '0 0 7px' }}>{cl.numero_documento}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            {tabActiva === 'mora' ? (
                              <>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: cl.dias_mora > 60 ? C.red : C.amber }}>
                                  <CalendarIcon style={{ width: 12, height: 12 }} />{cl.dias_mora} días en mora
                                </span>
                                {cl.fecha_ultimo_pago && <span style={{ fontSize: 12, color: C.textMuted }}>Último pago: {fmtDate(cl.fecha_ultimo_pago)}</span>}
                              </>
                            ) : (
                              <>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: C.blue }}>
                                  <CurrencyDollarIcon style={{ width: 12, height: 12 }} />{fmt(cl.deuda_total)}
                                </span>
                                {cl.total_facturas_credito !== '0' && <span style={{ fontSize: 12, color: C.textMuted }}>Facturas: {fmt(cl.total_facturas_credito)}</span>}
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
          <div style={{ ...s.panel, position: 'sticky', top: 20 }}>
            <div style={{ ...s.panelHead, justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>Detalle del Cliente</p>
                <p style={{ fontSize: 12, color: C.textSub, margin: '1px 0 0', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resumenCliente.cliente.nombre}</p>
              </div>
              <button onClick={cerrarDetalles} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.textMuted, borderRadius: 6 }}>
                <XMarkIcon style={{ width: 17, height: 17 }} />
              </button>
            </div>

            <div style={{ padding: 14, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Resumen */}
              <div style={{ background: C.bg, borderRadius: 9, padding: '11px 13px', border: `1px solid ${C.border}` }}>
                {[
                  resumenCliente.cliente.dias_mora !== undefined && { label: 'Días en mora', value: `${resumenCliente.cliente.dias_mora} días`, color: resumenCliente.cliente.dias_mora > 30 ? C.red : C.green },
                  resumenCliente.deuda && { label: 'Deuda total', value: fmt(resumenCliente.deuda.deuda_total), color: C.blue, bold: true },
                  resumenCliente.deuda && { label: 'Facturas crédito', value: fmt(resumenCliente.deuda.total_facturas_credito) },
                  resumenCliente.deuda && { label: 'Total abonado', value: fmt(resumenCliente.deuda.total_abonos) },
                  resumenCliente.cliente.fecha_ultimo_pago && { label: 'Último pago', value: fmtDate(resumenCliente.cliente.fecha_ultimo_pago) },
                ].filter(Boolean).map((row, i, arr) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <span style={{ fontSize: 12, color: C.textSub }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: row.bold ? 700 : 600, color: row.color || C.text }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...s.btnGreen, flex: 1, justifyContent: 'center' }} onClick={() => setMostrarModalAbono(true)} disabled={procesando}>
                  <CurrencyDollarIcon style={{ width: 14, height: 14 }} /> Registrar Abono
                </button>
                {tabActiva === 'mora' && resumenCliente.cliente.dias_mora > 30 && (
                  <button style={{ ...s.btnBlue, flex: 1, justifyContent: 'center' }} onClick={handleQuitarMora} disabled={procesando}>
                    <CheckIcon style={{ width: 14, height: 14 }} /> Quitar Mora
                  </button>
                )}
              </div>

              {/* Abonos */}
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: '0 0 7px' }}>Historial de Abonos</p>
                {resumenCliente.abonos?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {resumenCliente.abonos.map((ab) => (
                      <div key={ab.abono_id || ab.id} style={{ background: C.greenLight, border: `1px solid ${C.greenBorder}`, borderRadius: 8, padding: '9px 11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ fontWeight: 700, color: C.green, fontSize: 13, margin: 0 }}>{fmt(ab.monto)}</p>
                            <p style={{ fontSize: 11, color: C.textMuted, margin: '1px 0 0' }}>{fmtDate(ab.fecha_abono)}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Badge color={C.green}>{ab.metodo_pago}</Badge>
                            {ab.soporte_pago && (
                              <button onClick={() => { setSoporteSeleccionado(ab.soporte_pago); setMostrarModalSoporte(true); }}
                                style={{ background: C.blueLight, border: 'none', borderRadius: 6, padding: '3px 5px', cursor: 'pointer', color: C.blue }}>
                                <EyeIcon style={{ width: 12, height: 12 }} />
                              </button>
                            )}
                          </div>
                        </div>
                        {ab.observaciones && <p style={{ fontSize: 11, color: C.textSub, margin: '5px 0 0', fontStyle: 'italic' }}>"{ab.observaciones}"</p>}
                        {ab.registrado_por && <p style={{ fontSize: 11, color: C.textMuted, margin: '2px 0 0' }}>Por: {ab.registrado_por}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 14, background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>Sin abonos registrados</p>
                  </div>
                )}
              </div>

              {/* Productos fiados */}
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: '0 0 7px' }}>Productos a Crédito</p>
                {resumenCliente.productos_fiados?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {resumenCliente.productos_fiados.map((pr, i) => (
                      <div key={`${pr.factura_id}-${i}`} style={{ background: C.blueLight, border: `1px solid ${C.blueBorder}`, borderRadius: 8, padding: '9px 11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, color: C.text, fontSize: 13, margin: 0 }}>{pr.producto_nombre}</p>
                            <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, color: C.textSub }}>SKU: {pr.producto_sku || '—'}</span>
                              <span style={{ fontSize: 11, color: C.textSub }}>x{pr.cantidad}</span>
                              <span style={{ fontSize: 11, color: C.textSub }}>{fmt(pr.valor_unitario)} c/u</span>
                            </div>
                          </div>
                          <p style={{ fontWeight: 700, color: C.blue, fontSize: 13, margin: 0 }}>{fmt(pr.valor_total)}</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, paddingTop: 7, borderTop: `1px solid ${C.blueBorder}` }}>
                          <span style={{ fontSize: 11, color: C.textMuted }}>Factura: {pr.numero_factura}</span>
                          <span style={{ fontSize: 11, color: C.textMuted }}>{fmtDate(pr.fecha_venta)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 14, background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>Sin productos a crédito</p>
                  </div>
                )}
              </div>

              {resumenCliente.total_abonado && resumenCliente.total_abonado !== '0' && (
                <div style={{ background: C.greenLight, border: `1px solid ${C.greenBorder}`, borderRadius: 9, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.green }}>Total Abonado</span>
                  <span style={{ fontSize: 17, fontWeight: 800, color: C.green }}>{fmt(resumenCliente.total_abonado)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL ABONO ── */}
      {mostrarModalAbono && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: C.surface, borderRadius: 14, boxShadow: '0 20px 50px rgba(0,0,0,.14)', maxWidth: 450, width: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Registrar Abono</p>
                <p style={{ fontSize: 12, color: C.textSub, margin: '2px 0 0' }}>{clienteSeleccionado?.nombre}</p>
              </div>
              <button onClick={() => setMostrarModalAbono(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 4, borderRadius: 6 }}>
                <XMarkIcon style={{ width: 17, height: 17 }} />
              </button>
            </div>

            <form onSubmit={handleCrearAbono} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: C.blueLight, border: `1px solid ${C.blueBorder}`, borderRadius: 9, padding: '10px 13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.blue }}>Deuda Total</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.blueDark }}>{fmt(resumenCliente?.deuda?.deuda_total || 0)}</span>
              </div>

              <div>
                <label style={s.lbl}>Monto del Abono *</label>
                <input type="number" step="0.01" min="0" max={resumenCliente?.deuda?.deuda_total || ''} placeholder="0" required style={s.input}
                  value={formularioAbono.monto} onChange={e => setFormularioAbono({ ...formularioAbono, monto: e.target.value })} />
                <p style={{ fontSize: 11, color: C.textMuted, margin: '3px 0 0' }}>Máximo: {fmt(resumenCliente?.deuda?.deuda_total || 0)}</p>
              </div>

              <div>
                <label style={s.lbl}>Método de Pago</label>
                <select style={s.input} value={formularioAbono.metodo_pago}
                  onChange={e => setFormularioAbono({ ...formularioAbono, metodo_pago: e.target.value, soporte_pago: null })}>
                  {['efectivo','transferencia','nequi','tarjeta','otro'].map(m => (
                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
              </div>

              {['transferencia','nequi','tarjeta','otro'].includes(formularioAbono.metodo_pago) && (
                <div>
                  <label style={s.lbl}>Soporte de Pago *</label>
                  <input type="file" accept="image/*,.pdf" required style={{ ...s.input, paddingTop: 7 }}
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file?.size > 5 * 1024 * 1024) { showToast('error', 'Máximo 5MB'); e.target.value = ''; return; }
                      if (file) setFormularioAbono({ ...formularioAbono, soporte_pago: file });
                    }} />
                  {formularioAbono.soporte_pago && <p style={{ fontSize: 11, color: C.green, margin: '3px 0 0' }}>✓ {formularioAbono.soporte_pago.name}</p>}
                  <p style={{ fontSize: 11, color: C.textMuted, margin: '3px 0 0' }}>JPG, PNG, PDF — máx. 5 MB</p>
                </div>
              )}

              <div>
                <label style={s.lbl}>Referencia (opcional)</label>
                <input type="text" placeholder="Número de recibo" style={s.input}
                  value={formularioAbono.referencia} onChange={e => setFormularioAbono({ ...formularioAbono, referencia: e.target.value })} />
              </div>

              <div>
                <label style={s.lbl}>Observaciones (opcional)</label>
                <textarea rows={2} placeholder="Notas sobre el abono…" style={{ ...s.input, resize: 'none' }}
                  value={formularioAbono.observaciones} onChange={e => setFormularioAbono({ ...formularioAbono, observaciones: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: 9, paddingTop: 2 }}>
                <button type="button" style={{ ...s.btnGhost, flex: 1, justifyContent: 'center' }} onClick={() => setMostrarModalAbono(false)} disabled={procesando}>Cancelar</button>
                <button type="submit" style={{ ...s.btnGreen, flex: 1, justifyContent: 'center', opacity: procesando ? .6 : 1 }} disabled={procesando}>
                  {procesando
                    ? <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /> Procesando…</>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: C.surface, borderRadius: 14, boxShadow: '0 20px 50px rgba(0,0,0,.16)', maxWidth: 780, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhotoIcon style={{ width: 15, height: 15, color: C.blue }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>Soporte de Pago</p>
                  <p style={{ fontSize: 12, color: C.textSub, margin: '1px 0 0' }}>Comprobante del abono</p>
                </div>
              </div>
              <button onClick={() => { setMostrarModalSoporte(false); setSoporteSeleccionado(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 4, borderRadius: 6 }}>
                <XMarkIcon style={{ width: 17, height: 17 }} />
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {soporteSeleccionado.toLowerCase().endsWith('.pdf') ? (
                <object data={soporteSeleccionado} type="application/pdf" style={{ width: '100%', minHeight: 500, borderRadius: 9, border: `1px solid ${C.border}` }}>
                  <div style={{ textAlign: 'center', padding: 28 }}>
                    <p style={{ color: C.textSub, marginBottom: 12 }}>No se puede previsualizar el PDF</p>
                    <a href={soporteSeleccionado} target="_blank" rel="noopener noreferrer" style={{ ...s.btnBlue, textDecoration: 'none', display: 'inline-flex' }}>
                      <DocumentTextIcon style={{ width: 14, height: 14 }} /> Abrir PDF
                    </a>
                  </div>
                </object>
              ) : (
                <img src={soporteSeleccionado} alt="Soporte de pago"
                  style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 9, border: `1px solid ${C.border}`, boxShadow: '0 4px 16px rgba(0,0,0,.07)' }}
                  onError={e => { e.target.src = '/placeholder-image.png'; }} />
              )}
            </div>

            <div style={{ padding: '13px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 9, justifyContent: 'flex-end', flexShrink: 0 }}>
              <a href={soporteSeleccionado} download={`soporte_${Date.now()}`} style={{ ...s.btnBlue, textDecoration: 'none' }}>
                <DocumentTextIcon style={{ width: 14, height: 14 }} /> Descargar
              </a>
              <button style={s.btnGhost} onClick={() => { setMostrarModalSoporte(false); setSoporteSeleccionado(null); }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}