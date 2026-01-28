import React from 'react';

export default function FacturaTicket({ factura, formato = '80mm' }) {
  if (!factura) {
    return (
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <p className="text-gray-500">No hay factura para mostrar</p>
      </div>
    );
  }

  const styles = formato === '58mm' ? styles58mm : styles80mm;

  return (
    <div
      id="factura-ticket"
      className="bg-white p-4 rounded-lg shadow text-sm font-mono"
      style={{ fontFamily: 'monospace', ...styles }}
    >
      {/* Encabezado */}
      <div className="text-center border-b border-dashed border-gray-300 pb-2 mb-2">
        <h2 className="font-bold text-lg">MI TIENDA</h2>
        <p className="text-xs">NIT: 900.123.456-7</p>
        <p className="text-xs">Dirección: Calle 123 #45-67</p>
        <p className="text-xs">Tel: (555) 123-4567</p>
      </div>

      {/* Info factura */}
      <div className="mb-2 space-y-1">
        <p className="text-xs"><strong>Factura:</strong> {factura.numero_factura}</p>
        <p className="text-xs"><strong>Fecha:</strong> {new Date(factura.fecha_venta).toLocaleString()}</p>
        {factura.vendedor_nombre && (
          <p className="text-xs"><strong>Cajero:</strong> {factura.vendedor_nombre}</p>
        )}
        {factura.cliente_nombre && factura.cliente_nombre !== 'Consumidor Final' && (
          <p className="text-xs"><strong>Cliente:</strong> {factura.cliente_nombre}</p>
        )}
      </div>

      {/* Productos */}
      <div className="border-t border-b border-dashed border-gray-300 py-2 mb-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-dashed border-gray-300">
              <th className="text-left py-1 w-12">Cant.</th>
              <th className="text-left py-1">Descripción</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {factura.detalles && factura.detalles.length > 0 ? (
              factura.detalles.map((det, i) => (
                <tr key={i} className="border-b border-dotted border-gray-200">
                  <td className="py-1">{det.cantidad}</td>
                  <td className="py-1">
                    <div className="truncate" title={det.producto_nombre}>
                      {det.producto_nombre}
                    </div>
                    {det.producto_imei && (
                      <p className="text-xs text-gray-500">IMEI: {det.producto_imei}</p>
                    )}
                  </td>
                  <td className="text-right py-1">${parseFloat(det.total).toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center py-2">Sin productos</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Subtotal:</span>
          <span>${parseFloat(factura.subtotal || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>IVA:</span>
          <span>${parseFloat(factura.total_iva || 0).toFixed(2)}</span>
        </div>
        {factura.total_descuento > 0 && (
          <div className="flex justify-between text-xs text-green-600">
            <span>Descuento:</span>
            <span>-${parseFloat(factura.total_descuento).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg border-t border-dashed border-gray-300 pt-1">
          <span>TOTAL:</span>
          <span>${parseFloat(factura.total || 0).toFixed(2)}</span>
        </div>

        {factura.pagos && factura.pagos.length > 0 && factura.pagos.map((pago, i) => (
          <div key={i} className="flex justify-between text-xs">
            <span>{pago.forma_pago_nombre}:</span>
            <span>${parseFloat(pago.monto).toFixed(2)}</span>
          </div>
        ))}

        {factura.cambio > 0 && (
          <div className="flex justify-between text-blue-600 font-semibold text-sm">
            <span>Cambio:</span>
            <span>${parseFloat(factura.cambio).toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Pie de página */}
      <div className="text-center border-t border-dashed border-gray-300 mt-4 pt-2 text-xs">
        <p className="font-semibold">¡Gracias por su compra!</p>
        <p className="mt-1">Conserve este comprobante</p>
        {factura.observaciones && (
          <p className="mt-2 text-gray-600 italic">{factura.observaciones}</p>
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
  width: '320px',
  fontSize: '12px'
};
