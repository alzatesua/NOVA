import React, { useState, useEffect } from 'react';
import { TrashIcon, PlusIcon, CreditCardIcon, BanknotesIcon, ReceiptPercentIcon } from '@heroicons/react/24/outline';
import ClienteSelector from './ClienteSelector';
import ProductoSelectorPOS from './ProductoSelectorPOS';
import { fetchFormasPago, crearFactura } from '../../services/api';
import { showToast } from '../../utils/toast';

export default function FacturaForm({ bodegaId, sucursalId, onFacturaCreada }) {
  const [cliente, setCliente] = useState(null);
  const [productos, setProductos] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [pagos, setPagos] = useState([{ forma_pago: null, monto: '', referencia: '' }]);
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);

  const tokenUsuario = localStorage.getItem('token_usuario');
  const usuario = localStorage.getItem('usuario');
  const subdominio = window.location.hostname.split('.')[0];

  useEffect(() => {
    cargarFormasPago();
  }, []);

  const cargarFormasPago = async () => {
    try {
      const response = await fetchFormasPago({
        token: tokenUsuario,
        usuario,
        subdominio
      });
      setFormasPago(response.formas_pago || []);

      // Seleccionar efectivo por defecto
      const efectivo = response.formas_pago?.find(f => f.codigo === 'EFE');
      if (efectivo) {
        setPagos([{ forma_pago: efectivo.id, monto: '', referencia: '' }]);
      }
    } catch (error) {
      console.error('Error cargando formas de pago:', error);
    }
  };

  const agregarProducto = (producto) => {
    const existente = productos.find(p => p.id === producto.id);
    if (existente) {
      setProductos(productos.map(p =>
        p.id === producto.id
          ? { ...p, cantidad: p.cantidad + producto.cantidad }
          : p
      ));
    } else {
      setProductos([...productos, producto]);
    }
  };

  const actualizarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      setProductos(productos.filter(p => p.id !== productoId));
    } else {
      const producto = productos.find(p => p.id === productoId);
      if (nuevaCantidad > producto.disponible) {
        showToast('error', `Stock insuficiente. Disponible: ${producto.disponible}`);
        return;
      }
      setProductos(productos.map(p =>
        p.id === productoId ? { ...p, cantidad: parseInt(nuevaCantidad) } : p
      ));
    }
  };

  const eliminarProducto = (productoId) => {
    setProductos(productos.filter(p => p.id !== productoId));
  };

  const actualizarPago = (index, campo, valor) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index][campo] = valor;
    setPagos(nuevosPagos);
  };

  const agregarPago = () => {
    setPagos([...pagos, { forma_pago: null, monto: '', referencia: '' }]);
  };

  const eliminarPago = (index) => {
    if (pagos.length > 1) {
      setPagos(pagos.filter((_, i) => i !== index));
    }
  };

  // Cálculos
  const calcularSubtotal = () => {
    return productos.reduce((sum, p) => sum + (parseFloat(p.precio) * p.cantidad), 0);
  };

  const calcularIVA = () => {
    return productos.reduce((sum, p) => {
      const subtotal = parseFloat(p.precio) * p.cantidad;
      return sum + (subtotal * (parseFloat(p.iva_porcentaje) / 100));
    }, 0);
  };

  const calcularTotal = () => {
    return calcularSubtotal() + calcularIVA();
  };

  const calcularTotalPagado = () => {
    return pagos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
  };

  const calcularCambio = () => {
    return Math.max(0, calcularTotalPagado() - calcularTotal());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (productos.length === 0) {
      showToast('error', 'Debe agregar al menos un producto');
      return;
    }

    if (calcularTotalPagado() < calcularTotal()) {
      showToast('error', 'El monto pagado es insuficiente');
      return;
    }

    setLoading(true);

    try {
      // Buscar el ID del vendedor
      const vendedorId = localStorage.getItem('usuario_id') || null;

      const datos_factura = {
        cliente: cliente?.id || null,
        vendedor: vendedorId,
        sucursal: sucursalId,
        bodega: bodegaId,
        subtotal: calcularSubtotal(),
        total_descuento: 0,
        total_iva: calcularIVA(),
        total: calcularTotal(),
        total_pagado: calcularTotalPagado(),
        cambio: calcularCambio(),
        observaciones: observaciones || null,
        detalles: productos.map(p => ({
          producto: p.id,
          producto_nombre: p.nombre,
          producto_sku: p.sku,
          producto_imei: p.imei || '',
          cantidad: p.cantidad,
          precio_unitario: parseFloat(p.precio),
          descuento_porcentaje: 0,
          descuento_valor: 0,
          iva_porcentaje: parseFloat(p.iva_porcentaje),
          iva_valor: (p.precio * p.cantidad) * (p.iva_porcentaje / 100),
          subtotal: p.precio * p.cantidad,
          total: (p.precio * p.cantidad) * (1 + p.iva_porcentaje / 100)
        })),
        pagos: pagos.map(p => ({
          forma_pago: p.forma_pago,
          monto: parseFloat(p.monto),
          referencia: p.referencia || null,
          autorizacion: p.autorizacion || null
        }))
      };

      const response = await crearFactura({
        token: tokenUsuario,
        usuario,
        subdominio,
        datos_factura
      });

      showToast('success', 'Factura creada correctamente');
      onFacturaCreada(response.factura || response);

      // Limpiar formulario
      setCliente(null);
      setProductos([]);
      setPagos([{ forma_pago: null, monto: '', referencia: '' }]);
      setObservaciones('');

    } catch (error) {
      showToast('error', error.message || 'Error al crear factura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sección 1: Cliente */}
      <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-xl">
            <CreditCardIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Datos del Cliente</h3>
        </div>
        <ClienteSelector cliente={cliente} onClienteChange={setCliente} />
      </div>

      {/* Sección 2: Productos */}
      <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <PlusIcon className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Productos</h3>
        </div>
        {bodegaId ? (
          <>
            <ProductoSelectorPOS
              bodegaId={bodegaId}
              onProductoSelect={agregarProducto}
              productosAgregados={productos}
            />

            {/* Tabla de productos */}
            {productos.length > 0 && (
              <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Producto</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 w-28">Cant.</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 w-32">Precio Unit.</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 w-32">Subtotal</th>
                      <th className="px-4 py-3 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productos.map((p) => (
                      <tr key={p.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{p.nombre}</p>
                          <p className="text-sm text-gray-500">{p.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            max={p.disponible}
                            value={p.cantidad}
                            onChange={(e) => actualizarCantidad(p.id, e.target.value)}
                            className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-700">
                          ${parseFloat(p.precio).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          ${(parseFloat(p.precio) * p.cantidad).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => eliminarProducto(p.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar producto"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-yellow-50 rounded-xl border-2 border-dashed border-yellow-200">
            <p className="text-yellow-700 font-medium">Seleccione una bodega para agregar productos</p>
          </div>
        )}
      </div>

      {/* Sección 3: Pagos */}
      {productos.length > 0 && (
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-xl">
              <BanknotesIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Formas de Pago</h3>
          </div>

          <div className="space-y-3">
            {pagos.map((pago, index) => (
              <div key={index} className="flex gap-3 items-start">
                <select
                  value={pago.forma_pago || ''}
                  onChange={(e) => actualizarPago(index, 'forma_pago', parseInt(e.target.value))}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {formasPago.map(fp => (
                    <option key={fp.id} value={fp.id}>{fp.nombre}</option>
                  ))}
                </select>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pago.monto}
                  onChange={(e) => actualizarPago(index, 'monto', e.target.value)}
                  placeholder="Monto"
                  className="w-40 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                  required
                />

                <input
                  type="text"
                  value={pago.referencia}
                  onChange={(e) => actualizarPago(index, 'referencia', e.target.value)}
                  placeholder="Referencia (opcional)"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                {pagos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => eliminarPago(index)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title="Eliminar pago"
                  >
                    <TrashIcon className="h-6 w-6" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={agregarPago}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-semibold"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Agregar otro pago</span>
            </button>
          </div>
        </div>
      )}

      {/* Sección 4: Totales */}
      {productos.length > 0 && (
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-xl">
              <ReceiptPercentIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Resumen de Venta</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-bold text-gray-900">${calcularSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">IVA:</span>
              <span className="font-bold text-gray-900">${calcularIVA().toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl px-4 -mx-2">
              <span className="text-xl font-bold text-blue-900">TOTAL:</span>
              <span className="text-3xl font-bold text-blue-600">${calcularTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-green-700 font-semibold">Total Pagado:</span>
              <span className="text-xl font-bold text-green-600">${calcularTotalPagado().toFixed(2)}</span>
            </div>
            {calcularCambio() > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-blue-700 font-semibold">Cambio:</span>
                <span className="text-2xl font-bold text-blue-600">${calcularCambio().toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>
      )}

      {/* Botón submit */}
      {productos.length > 0 && (
        <button
          type="submit"
          disabled={loading || calcularTotalPagado() < calcularTotal()}
          className="w-full py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xl font-bold rounded-2xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-xl shadow-green-500/30 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span>Procesando...</span>
            </>
          ) : (
            <>
              <BanknotesIcon className="h-7 w-7" />
              <span>Completar Venta</span>
            </>
          )}
        </button>
      )}
    </form>
  );
}
