import React, { useState, useEffect } from 'react';
import { 
  TrashIcon, 
  PlusIcon, 
  ArrowRightIcon, 
  ArrowLeftIcon,
  CheckIcon,
  UserCircleIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  DocumentCheckIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import ClienteSelector from './ClienteSelector';
import ProductoSelectorPOS from './ProductoSelectorPOS';
import { fetchFormasPago, crearFactura } from '../../services/api';
import { showToast } from '../../utils/toast';

export default function FacturaForm({ bodegaId, sucursalId, onFacturaCreada }) {
  const [pasoActual, setPasoActual] = useState(1);
  const [cliente, setCliente] = useState(null);
  const [productos, setProductos] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [pagos, setPagos] = useState([{ forma_pago: null, monto: '', referencia: '' }]);
  const [loading, setLoading] = useState(false);

  const tokenUsuario = localStorage.getItem('token_usuario');
  const usuario = localStorage.getItem('usuario');
  const subdominio = window.location.hostname.split('.')[0];

  // Definir los pasos
  const pasos = [
    { 
      numero: 1, 
      titulo: 'Cliente', 
      icono: UserCircleIcon, 
      completado: true // Cliente es opcional
    },
    { 
      numero: 2, 
      titulo: 'Productos', 
      icono: ShoppingCartIcon, 
      completado: productos.length > 0 && productos.every(p => p.producto_seleccionado)
    },
    { 
      numero: 3, 
      titulo: 'Pago', 
      icono: CreditCardIcon, 
      completado: calcularTotalPagado() >= calcularTotal() && productos.length > 0 && productos.every(p => p.producto_seleccionado)
    },
    { 
      numero: 4, 
      titulo: 'Confirmar', 
      icono: DocumentCheckIcon, 
      completado: false 
    }
  ];

  useEffect(() => {
    if (tokenUsuario && usuario && subdominio) {
      cargarFormasPago();
    }
  }, [tokenUsuario, usuario, subdominio]);

  const cargarFormasPago = async () => {
    try {
      const response = await fetchFormasPago({
        token: tokenUsuario,
        usuario,
        subdominio
      });
      
      if (!response || !response.formas_pago) {
        setFormasPago([]);
        return;
      }

      setFormasPago(response.formas_pago || []);

      const efectivo = response.formas_pago?.find(f => f.codigo === 'EFE');
      if (efectivo) {
        setPagos([{ forma_pago: efectivo.id, monto: '', referencia: '' }]);
      }
    } catch (error) {
      console.error('Error cargando formas de pago:', error);
      showToast('error', 'Error al cargar formas de pago');
      setFormasPago([]);
    }
  };

  // Agregar una fila vacía de producto
  const agregarFilaProducto = () => {
    const nuevaFila = {
      fila_id: Date.now(), // ID único para la fila
      producto_seleccionado: null, // Producto seleccionado
      cantidad: 1,
      mostrar_buscador: true // Mostrar el buscador por defecto
    };
    setProductos([...productos, nuevaFila]);
  };

  // Asignar producto a una fila específica
  const asignarProductoAFila = (filaId, productoData) => {
    setProductos(productos.map(fila => {
      if (fila.fila_id === filaId) {
        return {
          ...fila,
          producto_seleccionado: productoData,
          mostrar_buscador: false,
          // Copiar datos del producto
          id: productoData.id,
          nombre: productoData.nombre,
          sku: productoData.sku,
          precio: productoData.precio,
          iva_porcentaje: productoData.iva_porcentaje,
          disponible: productoData.disponible,
          imei: productoData.imei || ''
        };
      }
      return fila;
    }));
    showToast('success', `Producto agregado: ${productoData.nombre}`);
  };

  // Mostrar/ocultar buscador de una fila
  const toggleBuscador = (filaId) => {
    setProductos(productos.map(fila => {
      if (fila.fila_id === filaId) {
        return {
          ...fila,
          mostrar_buscador: !fila.mostrar_buscador
        };
      }
      return fila;
    }));
  };

  // Actualizar cantidad de una fila
  const actualizarCantidad = (filaId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarProducto(filaId);
      return;
    }

    setProductos(productos.map(fila => {
      if (fila.fila_id === filaId) {
        if (fila.producto_seleccionado && nuevaCantidad > fila.disponible) {
          showToast('error', `Stock insuficiente. Disponible: ${fila.disponible}`);
          return fila;
        }
        return {
          ...fila,
          cantidad: parseInt(nuevaCantidad)
        };
      }
      return fila;
    }));
  };

  // Eliminar una fila de producto
  const eliminarProducto = (filaId) => {
    setProductos(productos.filter(fila => fila.fila_id !== filaId));
    showToast('info', 'Producto eliminado');
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

  function calcularSubtotal() {
    return productos.reduce((sum, fila) => {
      if (!fila.producto_seleccionado) return sum;
      const precio = parseFloat(fila.precio) || 0;
      const cantidad = parseInt(fila.cantidad) || 0;
      return sum + (precio * cantidad);
    }, 0);
  }

  function calcularIVA() {
    return productos.reduce((sum, fila) => {
      if (!fila.producto_seleccionado) return sum;
      const precio = parseFloat(fila.precio) || 0;
      const cantidad = parseInt(fila.cantidad) || 0;
      const ivaPorcentaje = parseFloat(fila.iva_porcentaje) || 0;
      const subtotal = precio * cantidad;
      return sum + (subtotal * (ivaPorcentaje / 100));
    }, 0);
  }

  function calcularTotal() {
    return calcularSubtotal() + calcularIVA();
  }

  function calcularTotalPagado() {
    return pagos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
  }

  function calcularCambio() {
    return Math.max(0, calcularTotalPagado() - calcularTotal());
  }

  const puedeIrAPaso = (numeroPaso) => {
    // Paso 1: Siempre accesible (cliente es opcional)
    if (numeroPaso === 1) return true;

    // Validaciones comunes de productos
    const hayProductos = productos.length > 0;
    const todosSeleccionados = productos.every(p => p.producto_seleccionado);
    const todosConCantidadValida = productos.every(p => {
      const cantidad = parseInt(p.cantidad);
      return cantidad > 0 && cantidad <= (p.disponible || 9999);
    });

    // Paso 2: Requiere productos agregados y seleccionados con cantidad válida
    if (numeroPaso === 2) {
      return hayProductos && todosSeleccionados && todosConCantidadValida;
    }

    // Paso 3: Requiere productos validados Y pagos completos
    if (numeroPaso === 3) {
      // Validar pagos
      const totalMayorQueCero = calcularTotal() > 0;
      const hayPagosValidos = pagos.length > 0 && pagos.some(p => parseFloat(p.monto) > 0);
      const pagoCompleto = calcularTotalPagado() >= calcularTotal();

      return hayProductos && todosSeleccionados && todosConCantidadValida && totalMayorQueCero && hayPagosValidos && pagoCompleto;
    }

    // Paso 4: Confirmar - Mismos requisitos que paso 3
    if (numeroPaso === 4) {
      const totalMayorQueCero = calcularTotal() > 0;
      const hayPagosValidos = pagos.length > 0 && pagos.some(p => parseFloat(p.monto) > 0);
      const pagoCompleto = calcularTotalPagado() >= calcularTotal();

      return hayProductos && todosSeleccionados && todosConCantidadValida && totalMayorQueCero && hayPagosValidos && pagoCompleto;
    }

    return false;
  };

  const puedeAvanzar = () => {
    let hayProductos;
    let todosProductosSeleccionados;
    let todosConCantidadValida;
    let hayProductosPago;
    let productosSeleccionados;
    let totalMayorQueCero;
    let hayPagosValidos;
    let pagoCompleto;

    switch (pasoActual) {
      case 1:
        // Paso 1: Cliente es opcional, pero si se selecciona uno debe ser válido
        // Se puede avanzar siempre (con o sin cliente)
        return true;

      case 2:
        // Paso 2: Productos - VALIDACIONES ESTRICTAS
        // NO se puede avanzar si:
        // - No hay productos agregados
        // - Hay productos sin seleccionar
        // - Hay productos con cantidad 0 o inválida
        hayProductos = productos.length > 0;

        // Verificar que TODOS los productos tengan un producto seleccionado
        todosProductosSeleccionados = hayProductos && productos.every(p => {
          return p.producto_seleccionado && p.id !== null && p.id !== undefined;
        });

        // Verificar que todos los productos tengan cantidad válida
        todosConCantidadValida = hayProductos && productos.every(p => {
          const cantidad = parseInt(p.cantidad);
          return cantidad > 0 && cantidad <= (p.disponible || 9999);
        });

        return hayProductos && todosProductosSeleccionados && todosConCantidadValida;

      case 3:
        // Paso 3: Pago - VALIDACIONES ESTRICTAS
        // NO se puede avanzar si:
        // - No hay productos
        // - Productos no seleccionados
        // - Total es 0
        // - Pagos incompletos
        // - Monto pagado insuficiente
        hayProductosPago = productos.length > 0;
        productosSeleccionados = hayProductosPago && productos.every(p => p.producto_seleccionado);
        totalMayorQueCero = calcularTotal() > 0;

        // Verificar que haya al menos un método de pago con monto
        hayPagosValidos = pagos.length > 0 && pagos.some(p => {
          const monto = parseFloat(p.monto);
          return monto > 0;
        });

        pagoCompleto = calcularTotalPagado() >= calcularTotal();

        return hayProductosPago && productosSeleccionados && totalMayorQueCero && hayPagosValidos && pagoCompleto;

      default:
        return true;
    }
  };

  const handleSiguiente = () => {
    if (puedeAvanzar()) {
      setPasoActual(pasoActual + 1);
    } else {
      // Mensajes específicos según el paso actual y qué falta
      if (pasoActual === 1) {
        // Paso 1 - Cliente (no debería bloquearse, pero por si acaso)
        showToast('error', '⚠️ Debes completar el paso de cliente antes de continuar');
      }

      if (pasoActual === 2) {
        // Paso 2 - Productos
        if (productos.length === 0) {
          showToast('error', '⚠️ Debes agregar al menos un producto antes de continuar');
        } else if (!productos.every(p => p.producto_seleccionado)) {
          const productosSinSeleccionar = productos.filter(p => !p.producto_seleccionado);
          showToast('error', `⚠️ Hay ${productosSinSeleccionar.length} producto(s) sin seleccionar. Debes buscar y seleccionar un producto para cada fila.`);
        } else if (!productos.every(p => {
          const cantidad = parseInt(p.cantidad);
          return cantidad > 0;
        })) {
          showToast('error', '⚠️ Todos los productos deben tener una cantidad mayor a 0');
        }
      }

      if (pasoActual === 3) {
        // Paso 3 - Pago
        const productosCompletos = productos.length > 0 && productos.every(p => p.producto_seleccionado);

        if (!productosCompletos || productos.length === 0) {
          showToast('error', '⚠️ Debes agregar y seleccionar productos antes de continuar');
        } else if (calcularTotal() === 0) {
          showToast('error', '⚠️ El total de la venta es $0. Debes agregar productos');
        } else if (!pagos.some(p => parseFloat(p.monto) > 0)) {
          showToast('error', '⚠️ Debes agregar al menos un método de pago con monto antes de continuar');
        } else if (calcularTotalPagado() < calcularTotal()) {
          const faltante = (calcularTotal() - calcularTotalPagado()).toFixed(2);
          showToast('error', `⚠️ Monto insuficiente. Faltan $${faltante} para completar la venta`);
        }
      }
    }
  };

  const handleAnterior = () => {
    setPasoActual(pasoActual - 1);
  };

  const handleSubmit = async () => {
    if (productos.length === 0) {
      showToast('error', 'Debe agregar al menos un producto');
      return;
    }

    if (!productos.every(p => p.producto_seleccionado)) {
      showToast('error', 'Debe seleccionar un producto para cada fila');
      return;
    }

    if (calcularTotalPagado() < calcularTotal()) {
      showToast('error', 'El monto pagado es insuficiente');
      return;
    }

    setLoading(true);

    try {
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
        detalles: productos.filter(p => p.producto_seleccionado).map(p => {
          const precio = parseFloat(p.precio);
          const ivaPorcentaje = parseFloat(p.iva_porcentaje || 0);
          const cantidad = parseInt(p.cantidad);
          const subtotal = precio * cantidad;
          const ivaValor = subtotal * (ivaPorcentaje / 100);
          const total = subtotal + ivaValor;

          return {
            producto: p.id,
            producto_nombre: p.nombre,
            producto_sku: p.sku,
            producto_imei: p.imei || '',
            cantidad: cantidad,
            precio_unitario: precio,
            descuento_porcentaje: 0,
            descuento_valor: 0,
            iva_porcentaje: ivaPorcentaje,
            iva_valor: ivaValor,
            subtotal: subtotal,
            total: total
          };
        }),
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

      // Limpiar formulario y volver al paso 1
      setCliente(null);
      setProductos([]);
      setPagos([{ forma_pago: null, monto: '', referencia: '' }]);
      setObservaciones('');
      setPasoActual(1);

    } catch (error) {
      showToast('error', error.message || 'Error al crear factura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Indicador de pasos horizontal - Compacto */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-3 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          {pasos.map((paso, index) => {
            const Icono = paso.icono;
            const esActivo = pasoActual === paso.numero;
            const estaCompletado = paso.completado;
            const yaVisitado = pasoActual > paso.numero;

            return (
              <React.Fragment key={paso.numero}>
                {/* Paso */}
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => {
                      if (puedeIrAPaso(paso.numero)) {
                        setPasoActual(paso.numero);
                      }
                    }}
                    disabled={!puedeIrAPaso(paso.numero)}
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm
                      transition-all duration-300 mb-1
                      ${esActivo
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50 scale-105'
                        : estaCompletado || yaVisitado
                        ? 'bg-sky-400 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }
                      ${!puedeIrAPaso(paso.numero) && !esActivo ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {estaCompletado && !esActivo ? (
                      <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Icono className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                  <span className={`
                    text-[10px] sm:text-xs font-semibold text-center
                    ${esActivo 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-slate-600 dark:text-slate-400'
                    }
                  `}>
                    {paso.titulo}
                  </span>
                </div>

                {/* Línea conectora */}
                {index < pasos.length - 1 && (
                  <div className={`
                    h-0.5 flex-1 mx-1 rounded-full transition-all duration-300
                    ${puedeIrAPaso(paso.numero + 1)
                      ? 'bg-sky-400'
                      : 'bg-slate-200 dark:bg-slate-700'
                    }
                  `} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Contenido del paso actual - Compacto */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 min-h-[350px]">
        {/* Paso 1: Cliente */}
        {pasoActual === 1 && (
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <UserCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Información del Cliente</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Busca o crea un cliente (opcional)</p>
              </div>
            </div>
            <ClienteSelector cliente={cliente} onClienteChange={setCliente} />
          </div>
        )}

        {/* Paso 2: Productos */}
        {pasoActual === 2 && (
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
                <ShoppingCartIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Productos</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Agrega productos a la venta</p>
              </div>
            </div>

            {!bodegaId ? (
              <div className="text-center py-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-dashed border-yellow-200 dark:border-yellow-800">
                <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-400 font-medium">Seleccione una bodega para agregar productos</p>
              </div>
            ) : productos.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <ShoppingCartIcon className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">No hay productos agregados</p>
                <button
                  onClick={agregarFilaProducto}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-400 text-white text-sm font-semibold rounded-lg hover:bg-sky-500 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  Agregar primer producto
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Lista de productos */}
                {productos.map((fila, index) => (
                  <div key={fila.fila_id} className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-2 sm:p-3">
                    <div className="flex items-start gap-2">
                      {/* Número de fila */}
                      <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                        {index + 1}
                      </div>

                      {/* Contenido del producto */}
                      <div className="flex-1 min-w-0">
                        {fila.producto_seleccionado ? (
                          // Producto seleccionado
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {fila.nombre}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  SKU: {fila.sku} • Disponible: {fila.disponible}
                                </p>
                              </div>
                              <button
                                onClick={() => toggleBuscador(fila.fila_id)}
                                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                              >
                                Cambiar
                              </button>
                            </div>

                            {/* Cantidad y precio */}
                            <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
                              <div>
                                <label className="block text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mb-1">Cantidad</label>
                                <input
                                  type="number"
                                  min="1"
                                  max={fila.disponible}
                                  value={fila.cantidad}
                                  onChange={(e) => actualizarCantidad(fila.fila_id, e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mb-1">Precio Unit.</label>
                                <p className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-center font-bold text-slate-900 dark:text-slate-100">
                                  ${parseFloat(fila.precio).toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <label className="block text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mb-1">Subtotal</label>
                                <p className="px-2 py-1 bg-sky-100 dark:bg-sky-900/30 rounded text-center font-bold text-sky-700 dark:text-sky-400">
                                  ${(parseFloat(fila.precio) * fila.cantidad).toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {/* Buscador colapsado */}
                            {fila.mostrar_buscador && (
                              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                <ProductoSelectorPOS
                                  bodegaId={bodegaId}
                                  onProductoSelect={(producto) => asignarProductoAFila(fila.fila_id, producto)}
                                  productosAgregados={productos.filter(p => p.producto_seleccionado)}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          // Sin producto seleccionado - Mostrar buscador
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                              <MagnifyingGlassIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                              <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
                                Buscar producto para esta fila
                              </p>
                            </div>
                            <ProductoSelectorPOS
                              bodegaId={bodegaId}
                              onProductoSelect={(producto) => asignarProductoAFila(fila.fila_id, producto)}
                              productosAgregados={productos.filter(p => p.producto_seleccionado)}
                            />
                          </div>
                        )}
                      </div>

                      {/* Botón eliminar */}
                      <button
                        onClick={() => eliminarProducto(fila.fila_id)}
                        className="flex-shrink-0 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar fila"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Resumen total */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-3 text-white">
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base font-bold">
                      Total ({productos.filter(p => p.producto_seleccionado).length} {productos.filter(p => p.producto_seleccionado).length === 1 ? 'producto' : 'productos'}):
                    </span>
                    <span className="text-lg sm:text-xl font-bold">
                      ${calcularTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Botón para agregar más productos - Centrado */}
                <button
                  onClick={agregarFilaProducto}
                  disabled={!bodegaId}
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs sm:text-sm bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors font-semibold border border-sky-200 dark:border-sky-800"
                  title={!bodegaId ? "Seleccione una bodega primero" : "Agregar otro producto"}
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Agregar producto</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Paso 3: Pago */}
        {pasoActual === 3 && (
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
                <CreditCardIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Métodos de Pago</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configura cómo se realizará el pago</p>
              </div>
            </div>

            {formasPago.length === 0 && (
              <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                  ⚠ No se han cargado las formas de pago
                </p>
              </div>
            )}

            <div className="space-y-2 mb-3">
              {pagos.map((pago, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={pago.forma_pago || ''}
                    onChange={(e) => actualizarPago(index, 'forma_pago', parseInt(e.target.value))}
                    className="flex-1 px-2 py-1.5 text-xs sm:text-sm border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  >
                    <option value="">Seleccionar método...</option>
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
                    className="w-full sm:w-28 px-2 py-1.5 text-xs sm:text-sm border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />

                  <input
                    type="text"
                    value={pago.referencia}
                    onChange={(e) => actualizarPago(index, 'referencia', e.target.value)}
                    placeholder="Ref. (opcional)"
                    className="flex-1 px-2 py-1.5 text-xs sm:text-sm border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />

                  {pagos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarPago(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={agregarPago}
                className="flex items-center justify-center gap-1.5 w-full px-2 py-1.5 text-xs sm:text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-semibold"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                <span>Agregar otro método</span>
              </button>
            </div>

            {/* Resumen de totales - Compacto */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Resumen</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-600">
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Subtotal:</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">${calcularSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-600">
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">IVA:</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">${calcularIVA().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg px-2">
                  <span className="text-sm sm:text-base font-bold text-white">TOTAL:</span>
                  <span className="text-lg sm:text-xl font-bold text-white">${calcularTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs sm:text-sm text-sky-700 dark:text-sky-400 font-semibold">Pagado:</span>
                  <span className="text-sm sm:text-base font-bold text-sky-600 dark:text-sky-400">${calcularTotalPagado().toFixed(2)}</span>
                </div>
                {calcularCambio() > 0 && (
                  <div className="flex justify-between items-center py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg px-2">
                    <span className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 font-semibold">Cambio:</span>
                    <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">${calcularCambio().toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Paso 4: Confirmación */}
        {pasoActual === 4 && (
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <DocumentCheckIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Confirmar Venta</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Revisa antes de finalizar</p>
              </div>
            </div>

            {/* Resumen compacto con scroll si es necesario */}
            <div className="space-y-3 max-h-[450px] overflow-y-auto">
              {/* Cliente */}
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <UserCircleIcon className="h-3.5 w-3.5" />
                  Cliente
                </h4>
                {cliente ? (
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">{cliente.nombre_completo}</p>
                    <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">{cliente.tipo_documento}: {cliente.numero_documento}</p>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Consumidor Final</p>
                )}
              </div>

              {/* Productos */}
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <ShoppingCartIcon className="h-3.5 w-3.5" />
                  Productos ({productos.filter(p => p.producto_seleccionado).length})
                </h4>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {productos.filter(p => p.producto_seleccionado).map((p) => (
                    <div key={p.fila_id} className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700 last:border-0">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{p.nombre}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">{p.cantidad} × ${parseFloat(p.precio).toFixed(2)}</p>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex-shrink-0">${(parseFloat(p.precio) * p.cantidad).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagos */}
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <CreditCardIcon className="h-3.5 w-3.5" />
                  Métodos de Pago
                </h4>
                <div className="space-y-1">
                  {pagos.map((pago, index) => {
                    const formaPago = formasPago.find(f => f.id === pago.forma_pago);
                    return (
                      <div key={index} className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="text-slate-700 dark:text-slate-300">{formaPago?.nombre || 'N/A'}</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">${parseFloat(pago.monto).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total final */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-lg text-white">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-bold">TOTAL:</span>
                  <span className="text-xl sm:text-2xl font-bold">${calcularTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botones de navegación - Compactos */}
      <div className="flex justify-between items-center gap-2">
        {pasoActual > 1 && (
          <button
            type="button"
            onClick={handleAnterior}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Anterior
          </button>
        )}

        <div className="flex-1" />

        {pasoActual < 4 ? (
          <button
            type="button"
            onClick={handleSiguiente}
            disabled={!puedeAvanzar()}
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all shadow-md"
          >
            Siguiente
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-sky-400 to-cyan-400 text-white text-xs sm:text-sm font-bold rounded-lg hover:from-sky-500 hover:to-cyan-500 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all shadow-lg shadow-sky-500/30"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Procesando...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                Completar Venta
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}