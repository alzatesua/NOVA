import React, { useState, useEffect } from 'react';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import ClienteSelector from './ClienteSelector';
import ProductoSelectorPOS from './ProductoSelectorPOS';
import { fetchFormasPago, crearFactura } from '../../services/api';
import { showToast } from '../../utils/toast';

export default function FacturaForm({ bodegaId, sucursalId, onFacturaCreada }) {
  const [cliente, setCliente] = useState(null);
  const [productos, setProductos] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [pagos, setPagos] = useState([{ forma_pago: null, monto: '' }]);
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);

  const tokenUsuario = localStorage.getItem('token_usuario');
  const usuario = localStorage.getItem('usuario');
  const subdominio = localStorage.getItem('slug');

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
      setFormasPago(response.datos || []);

      // Seleccionar efectivo por defecto
      const efectivo = response.datos?.find(f => f.codigo === 'EFE');
      if (efectivo) {
        setPagos([{ forma_pago: efectivo.id, monto: '' }]);
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
      // Validar stock disponible
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
    setPagos([...pagos, { forma_pago: null, monto: '' }]);
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
      const datos_factura = {
        cliente: cliente?.id,
        vendedor: usuario,
        sucursal: sucursalId,
        bodega: bodegaId,
        subtotal: calcularSubtotal(),
        total_descuento: 0,
        total_iva: calcularIVA(),
        total: calcularTotal(),
        total_pagado: calcularTotalPagado(),
        cambio: calcularCambio(),
        observaciones,
        detalles: productos.map(p => ({
          producto: p.id,
          producto_nombre: p.nombre,
          producto_sku: p.sku,
          cantidad: p.cantidad,
          precio_unitario: p.precio,
          descuento_porcentaje: 0,
          descuento_valor: 0,
          iva_porcentaje: p.iva_porcentaje,
          iva_valor: (p.precio * p.cantidad) * (p.iva_porcentaje / 100),
          subtotal: p.precio * p.cantidad,
          total: (p.precio * p.cantidad) * (1 + p.iva_porcentaje / 100)
        })),
        pagos: pagos.map(p => ({
          forma_pago: p.forma_pago,
          monto: parseFloat(p.monto)
        }))
      };

      const response = await crearFactura({
        token: tokenUsuario,
        usuario,
        subdominio,
        datos_factura
      });

      showToast('success', 'Factura creada correctamente');
      onFacturaCreada(response);

      // Limpiar formulario
      setCliente(null);
      setProductos([]);
      setPagos([{ forma_pago: null, monto: '' }]);
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
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Datos del Cliente</h3>
        <ClienteSelector cliente={cliente} onClienteChange={setCliente} />
      </div>

      {/* Sección 2: Productos */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Productos</h3>
        {bodegaId ? (
          <>
            <ProductoSelectorPOS
              bodegaId={bodegaId}
              onProductoSelect={agregarProducto}
              productosAgregados={productos}
            />

            {/* Tabla de productos */}
            {productos.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Producto</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Cant.</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Precio Unit.</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Subtotal</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {productos.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium">{p.nombre}</p>
                          <p className="text-sm text-gray-500">{p.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            max={p.disponible}
                            value={p.cantidad}
                            onChange={(e) => actualizarCantidad(p.id, e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-center"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">${parseFloat(p.precio).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          ${(parseFloat(p.precio) * p.cantidad).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => eliminarProducto(p.id)}
                            className="text-red-600 hover:text-red-800"
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
          <p className="text-gray-500 text-center py-4">Seleccione una bodega para agregar productos</p>
        )}
      </div>

      {/* Sección 3: Pagos */}
      {productos.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Formas de Pago</h3>

          <div className="space-y-3">
            {pagos.map((pago, index) => (
              <div key={index} className="flex items-center space-x-3">
                <select
                  value={pago.forma_pago || ''}
                  onChange={(e) => actualizarPago(index, 'forma_pago', parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
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
                  className="w-40 px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />

                {pagos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => eliminarPago(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={agregarPago}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Agregar otro pago</span>
            </button>
          </div>
        </div>
      )}

      {/* Sección 4: Totales */}
      {productos.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Resumen</h3>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${calcularSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA:</span>
              <span>${calcularIVA().toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>${calcularTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Total Pagado:</span>
              <span>${calcularTotalPagado().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-blue-600 font-semibold">
              <span>Cambio:</span>
              <span>${calcularCambio().toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
          disabled={loading}
          className="w-full py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Procesando...' : 'Completar Venta'}
        </button>
      )}
    </form>
  );
}
