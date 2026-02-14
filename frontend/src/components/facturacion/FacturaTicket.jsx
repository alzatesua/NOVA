import React from 'react';
import { BuildingStorefrontIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

/* ─────────────────────────────────────────────────────────────
   FacturaTicket — Diseño POS profesional
   • Tailwind CSS + Heroicons (igual que tu proyecto original)
   • Sin gradientes de color (no imprimen bien en térmica)
   • Optimizado para papel térmico 58mm / 80mm
   
   INSTALACIÓN DE FUENTE — añade esto en tu index.html o globals.css:
   <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
   ───────────────────────────────────────────────────────────── */

const fmt = (n) =>
  '$' +
  parseFloat(n || 0).toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const Separador = ({ tipo = 'solid' }) => (
  <div className="px-4 py-1 text-gray-300 text-xs tracking-widest select-none overflow-hidden">
    {tipo === 'dashed'
      ? '- - - - - - - - - - - - - - - - - - - - - - - - - -'
      : '──────────────────────────────────────────────────'}
  </div>
);

const Fila = ({ label, valor, negrita = false }) => (
  <div className="flex justify-between items-baseline py-0.5">
    <span className={`text-[10px] ${negrita ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
      {label}
    </span>
    <span className={`text-[10px] font-mono ${negrita ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
      {valor}
    </span>
  </div>
);

export default function FacturaTicket({ factura, formato = '80mm', empresaInfo = {} }) {
  const empresa = {
    nombre:    'MI TIENDA',
    nit:       '900.123.456-7',
    direccion: 'Calle 123 #45-67',
    ciudad:    'Bogotá, Colombia',
    telefono:  '(555) 123-4567',
    email:     'ventas@mitienda.com',
    regimen:   'Régimen Simplificado',
    ...empresaInfo,
  };

  const anchoClase = formato === '58mm' ? 'w-[220px]' : 'w-full max-w-[302px]';
  const textoBase  = formato === '58mm' ? 'text-[9px]' : 'text-[10px]';

  // Extraer información del cliente (soporta diferentes estructuras de respuesta del backend)
  const clienteNombre = factura?.cliente_nombre || factura?.cliente?.nombre_completo || '';
  const clienteNit = factura?.cliente_nit || factura?.cliente?.numero_documento || '';

  /* ── Estado vacío ── */
  if (!factura) {
    return (
      <div className={`${anchoClase} border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50`}>
        <DocumentTextIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 font-semibold text-xs">Sin factura para mostrar</p>
        <p className="text-gray-400 text-[10px] mt-1">Completa una venta para ver el ticket</p>
      </div>
    );
  }

  const fecha    = new Date(factura.fecha_venta);
  const fechaStr = fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const horaStr  = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });

  const subtotal  = parseFloat(factura.subtotal        || 0);
  const iva       = parseFloat(factura.total_iva        || 0);
  const descuento = parseFloat(factura.total_descuento  || 0);
  const total     = parseFloat(factura.total            || 0);
  const cambio    = parseFloat(factura.cambio           || 0);

  return (
    <div
      id="factura-ticket"
      className={`${anchoClase} ${textoBase} bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden`}
      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
    >
      {/* ── ENCABEZADO ── */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <BuildingStorefrontIcon className="h-4 w-4 text-white" />
          <h2 className="font-bold text-sm tracking-[2px] uppercase">{empresa.nombre}</h2>
        </div>
        <p className="text-blue-100 text-[8px] tracking-widest uppercase mb-1">{empresa.regimen}</p>
        <p className="text-blue-50 text-[9px]">NIT: {empresa.nit}</p>
        <p className="text-blue-50 text-[9px]">{empresa.direccion}</p>
        <p className="text-blue-50 text-[9px]">{empresa.ciudad}</p>
        <p className="text-blue-50 text-[9px]">Tel: {empresa.telefono}</p>
      </div>

      {/* ── TIPO DOCUMENTO ── */}
      <div className="bg-sky-400 text-white text-center py-0.5 text-[9px] font-bold tracking-[2px]">
        FACTURA DE VENTA
      </div>

      {/* ── INFO FACTURA ── */}
      <div className="px-3 pt-2 pb-1.5">
        <Fila label="No. Factura:" valor={`#${factura.numero_factura || 'N/A'}`} negrita />
        <Fila label="Fecha:"       valor={fechaStr} />
        <Fila label="Hora:"        valor={horaStr} />
        {factura.vendedor_nombre && (
          <Fila label="Cajero:" valor={factura.vendedor_nombre} />
        )}
      </div>

      {/* ── CLIENTE ── */}
      {clienteNombre && (
        <>
          <Separador tipo="dashed" />
          <div className="px-3 pb-2">
            <p className="text-[8px] font-bold tracking-widest text-gray-400 uppercase mb-0.5">Cliente</p>
            <p className="font-bold text-gray-900 text-[11px]">{clienteNombre}</p>
            {clienteNit && (
              <p className="text-[9px] text-gray-500">NIT/CC: {clienteNit}</p>
            )}
          </div>
        </>
      )}

      {/* ── PRODUCTOS ── */}
      <Separador />
      <div className="px-3 pb-1.5">
        {/* Cabecera tabla */}
        <div className="grid grid-cols-[20px_1fr_56px] gap-1 border-b-2 border-gray-900 pb-0.5 mb-0.5">
          {['Ctd', 'Descripción', 'Total'].map((h, i) => (
            <span
              key={i}
              className={`text-[8px] font-bold tracking-widest uppercase text-gray-900 ${i === 2 ? 'text-right' : ''}`}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Filas de productos */}
        {factura.detalles && factura.detalles.length > 0 ? (
          factura.detalles.map((det, i) => (
            <div
              key={i}
              className="grid grid-cols-[20px_1fr_56px] gap-1 py-1 border-b border-dashed border-gray-200 last:border-b-0 items-start"
            >
              <span className="font-bold text-gray-900">{det.cantidad}</span>
              <div>
                <p className="font-semibold text-gray-900 leading-tight break-words text-[10px]">
                  {det.producto_nombre}
                </p>
                {det.precio_unitario && (
                  <p className="text-[8px] text-gray-400 mt-0.5">c/u {fmt(det.precio_unitario)}</p>
                )}
                {det.producto_sku && (
                  <p className="text-[8px] text-gray-400">SKU: {det.producto_sku}</p>
                )}
                {det.producto_imei && (
                  <p className="text-[8px] font-semibold text-gray-600">IMEI: {det.producto_imei}</p>
                )}
              </div>
              <span className="text-right font-bold text-gray-900 whitespace-nowrap text-[10px]">
                {fmt(det.total)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400 py-2 text-[10px]">Sin productos</p>
        )}
      </div>

      {/* ── TOTALES ── */}
      <Separador />
      <div className="px-3 pb-3">
        <Fila label="Subtotal:"   valor={fmt(subtotal)} />
        <Fila label="IVA (19%):"  valor={fmt(iva)} />
        {descuento > 0 && (
          <Fila label="Descuento:" valor={`-${fmt(descuento)}`} />
        )}

        {/* Total destacado — azul sólido, imprime perfecto en térmica */}
        <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded px-2.5 py-1.5 my-1.5">
          <span className="font-bold text-xs tracking-wide">TOTAL A PAGAR:</span>
          <span className="font-bold text-sm">{fmt(total)}</span>
        </div>

        {/* Formas de pago */}
        {factura.pagos && factura.pagos.length > 0 && (
          <div className="mt-1.5">
            <p className="text-[8px] font-bold tracking-widest text-gray-400 uppercase mb-0.5">
              Forma de Pago
            </p>
            {factura.pagos.map((pago, i) => (
              <Fila key={i} label={pago.forma_pago_nombre + ':'} valor={fmt(pago.monto)} />
            ))}
          </div>
        )}

        {/* Cambio */}
        {cambio > 0 && (
          <div className="flex justify-between items-center bg-sky-50 rounded px-2.5 py-1 mt-1.5">
            <span className="font-semibold text-sky-700 text-[10px]">Cambio:</span>
            <span className="font-bold text-gray-900 text-xs">{fmt(cambio)}</span>
          </div>
        )}
      </div>

      {/* ── OBSERVACIONES ── */}
      {factura.observaciones && (
        <>
          <Separador tipo="dashed" />
          <div className="px-3 pb-2">
            <p className="text-[8px] font-bold tracking-widest text-gray-400 uppercase mb-0.5">
              Observaciones
            </p>
            <p className="text-[9px] text-gray-600 italic leading-relaxed">
              {factura.observaciones}
            </p>
          </div>
        </>
      )}

      {/* ── PIE DE PÁGINA ── */}
      <Separador />
      <div className="px-3 pb-3 pt-1.5 text-center border-t-[2px] border-double border-gray-900">
        <p className="font-bold text-gray-900 text-[11px] tracking-wide mb-0.5">
          ¡GRACIAS POR SU COMPRA!
        </p>
        <p className="text-[8px] text-gray-400 tracking-wide mb-0.5">
          Conserve este comprobante de pago
        </p>
        <p className="text-[8px] text-gray-400">{empresa.email}</p>
        <p className="text-[7px] text-gray-300 mt-1">
          {empresa.regimen} — No somos responsables del IVA
        </p>
      </div>

      {/* ── BOTÓN IMPRIMIR — clase print:hidden para que no salga en papel ── */}
      <div className="px-3 pb-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-[10px] tracking-widest py-2 rounded transition-colors"
        >
          🖨 IMPRIMIR TICKET
        </button>
      </div>
    </div>
  );
}