import React from 'react';
import { BuildingStorefrontIcon, DocumentTextIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';

export default function FacturaTicket({ factura, formato = '80mm' }) {
  if (!factura) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-2xl shadow-lg border-2 border-dashed border-gray-300 text-center">
        <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium text-lg">No hay factura para mostrar</p>
        <p className="text-sm text-gray-400 mt-2">Completa una venta para ver el ticket aquí</p>
      </div>
    );
  }

  const styles = formato === '58mm' ? styles58mm : styles80mm;

  return (
    <div
      id="factura-ticket"
      className="bg-white rounded-2xl shadow-2xl overflow-hidden"
      style={{ fontFamily: 'monospace', ...styles }}
    >
      {/* Encabezado con gradiente */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <BuildingStorefrontIcon className="h-8 w-8" />
          <h2 className="font-bold text-2xl tracking-wide">MI TIENDA</h2>
        </div>
        <p className="text-blue-100 text-sm">NIT: 900.123.456-7</p>
        <p className="text-blue-100 text-xs mt-1">Dirección: Calle 123 #45-67</p>
        <p className="text-blue-100 text-xs">Tel: (555) 123-4567</p>
      </div>

      {/* Info factura */}
      <div className="p-5 space-y-2 border-b-2 border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-medium text-xs">Factura #</span>
          <span className="font-bold text-gray-900 text-lg">{factura.numero_factura || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-medium text-xs flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            Fecha
          </span>
          <span className="text-gray-700 text-xs">
            {new Date(factura.fecha_venta).toLocaleString()}
          </span>
        </div>
        {factura.vendedor_nombre && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-medium text-xs flex items-center gap-1">
              <UserIcon className="h-3 w-3" />
              Cajero
            </span>
            <span className="text-gray-700 text-xs">{factura.vendedor_nombre}</span>
          </div>
        )}
        {factura.cliente_nombre && factura.cliente_nombre !== 'Consumidor Final' && (
          <div className="bg-blue-50 rounded-lg p-2 mt-2">
            <p className="text-xs text-gray-500 mb-1">Cliente</p>
            <p className="font-semibold text-gray-900 text-sm">{factura.cliente_nombre}</p>
          </div>
        )}
      </div>

      {/* Productos */}
      <div className="p-5 border-b-2 border-gray-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 font-bold text-gray-700 w-16">Cant.</th>
              <th className="text-left py-2 font-bold text-gray-700">Descripción</th>
              <th className="text-right py-2 font-bold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {factura.detalles && factura.detalles.length > 0 ? (
              factura.detalles.map((det, i) => (
                <tr key={i} className="border-b border-dashed border-gray-100 last:border-b-0">
                  <td className="py-2 font-semibold text-gray-900">{det.cantidad}</td>
                  <td className="py-2">
                    <p className="font-medium text-gray-800 truncate" title={det.producto_nombre}>
                      {det.producto_nombre}
                    </p>
                    {det.producto_sku && (
                      <p className="text-xs text-gray-400">SKU: {det.producto_sku}</p>
                    )}
                    {det.producto_imei && (
                      <p className="text-xs text-orange-600 font-medium">IMEI: {det.producto_imei}</p>
                    )}
                  </td>
                  <td className="text-right py-2 font-bold text-gray-900">
                    ${parseFloat(det.total).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-400">
                  Sin productos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className="p-5 space-y-2 bg-gradient-to-b from-gray-50 to-white">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-semibold text-gray-900">${parseFloat(factura.subtotal || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">IVA:</span>
          <span className="font-semibold text-gray-900">${parseFloat(factura.total_iva || 0).toFixed(2)}</span>
        </div>
        {factura.total_descuento > 0 && (
          <div className="flex justify-between items-center text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <span>Descuento:</span>
            <span className="font-bold">-${parseFloat(factura.total_descuento).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl px-4 -mx-1 my-2">
          <span className="font-bold text-lg">TOTAL:</span>
          <span className="font-bold text-2xl">${parseFloat(factura.total || 0).toFixed(2)}</span>
        </div>

        {factura.pagos && factura.pagos.length > 0 && (
          <div className="space-y-1 mt-3 pt-3 border-t border-gray-200">
            {factura.pagos.map((pago, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="text-gray-500">{pago.forma_pago_nombre}:</span>
                <span className="font-semibold text-gray-900">${parseFloat(pago.monto).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {factura.cambio > 0 && (
          <div className="flex justify-between items-center py-2 bg-blue-50 px-3 rounded-lg mt-2">
            <span className="text-blue-700 font-semibold text-sm">Cambio:</span>
            <span className="font-bold text-blue-700 text-lg">${parseFloat(factura.cambio).toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Pie de página */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 text-center px-6 py-5 border-t-2 border-gray-200">
        <div className="flex items-center justify-center gap-2 mb-2">
          <DocumentTextIcon className="h-5 w-5 text-blue-600" />
          <p className="font-bold text-gray-800">¡Gracias por su compra!</p>
        </div>
        <p className="text-xs text-gray-500">Conserve este comprobante</p>
        {factura.observaciones && (
          <div className="mt-3 p-2 bg-white rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 italic">{factura.observaciones}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles58mm = {
  width: '220px',
  fontSize: '10px'
};

const styles80mm = {
  width: '100%',
  maxWidth: '400px',
  fontSize: '12px'
};
