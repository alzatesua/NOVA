/**
 * Formulario para Registrar Movimientos de Caja (Entradas/Salidas)
 */
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { registrarMovimientoCaja } from '../../services/api';
import { showToast } from '../../utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

// ── Iconos ──────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const MinusIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

export default function RegistroMovimiento({ isAdmin, idSucursal, onRegistroExitoso }) {
  const { usuario, tokenUsuario, subdominio } = useAuth();
  const authData = { usuario, tokenUsuario, subdominio };

  const [tipo, setTipo] = useState('entrada');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [submitting, setSubmitting] = useState(false);

  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'nequi', label: 'Nequi' },
    { value: 'daviplata', label: 'Daviplata' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'otro', label: 'Otro' },
  ];

  const categorias = {
    entrada: [
      { value: 'venta', label: 'Venta' },
      { value: 'abono', label: 'Abono' },
      { value: 'reembolso', label: 'Reembolso' },
      { value: 'ajuste_positivo', label: 'Ajuste Positivo' },
      { value: 'otra_entrada', label: 'Otra Entrada' },
    ],
    salida: [
      { value: 'compra', label: 'Compra' },
      { value: 'gasto', label: 'Gasto' },
      { value: 'retiro', label: 'Retiro' },
      { value: 'devolucion', label: 'Devolución' },
      { value: 'ajuste_negativo', label: 'Ajuste Negativo' },
      { value: 'otra_salida', label: 'Otra Salida' },
    ]
  };

  const [categoria, setCategoria] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!monto || parseFloat(monto) <= 0) {
      showToast('Por favor ingresa un monto válido', 'error');
      return;
    }

    if (!descripcion.trim()) {
      showToast('Por favor ingresa una descripción', 'error');
      return;
    }

    if (!categoria) {
      showToast('Por favor selecciona una categoría', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // RegistroMovimiento.jsx — handleSubmit

      const params = {
        token: authData.tokenUsuario,
        usuario: authData.usuario,
        subdominio: authData.subdominio,
        tipo,
        monto: parseFloat(monto),
        descripcion: descripcion.trim(),
        metodo_pago: metodoPago,
        categoria,
        id_sucursal: idSucursal || null, 
      };

      // CAMBIO: enviar como "sucursal" (campo del modelo) además de id_sucursal
      if (idSucursal) {
        params.id_sucursal = idSucursal;  // lo lee el serializer manualmente
        params.sucursal = idSucursal;     // lo lee DRF como FK directo
      }

      const response = await registrarMovimientoCaja(params);

      if (response.success) {
        showToast(`Movimiento registrado exitosamente`, 'success');
        // Limpiar formulario
        setMonto('');
        setDescripcion('');
        setCategoria('');
        if (onRegistroExitoso) {
          onRegistroExitoso();
        }
      } else {
        showToast(response.message || 'Error al registrar el movimiento', 'error');
      }
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      showToast('Error al registrar el movimiento', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {tipo === 'entrada' ? (
            <>
              <span className="p-2 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
                <PlusIcon />
              </span>
              Registrar Entrada Manual
            </>
          ) : (
            <>
              <span className="p-2 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400">
                <MinusIcon />
              </span>
              Registrar Salida
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Selector de tipo */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={tipo === 'entrada' ? 'default' : 'outline'}
            className={tipo === 'entrada' ? 'bg-green-600 hover:bg-green-700' : ''}
            onClick={() => {
              setTipo('entrada');
              setCategoria('');
            }}
          >
            Entrada
          </Button>
          <Button
            variant={tipo === 'salida' ? 'default' : 'outline'}
            className={tipo === 'salida' ? 'bg-red-600 hover:bg-red-700' : ''}
            onClick={() => {
              setTipo('salida');
              setCategoria('');
            }}
          >
            Salida
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="monto">Monto *</Label>
            <Input
              id="monto"
              type="number"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría *</Label>
            <select
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">Seleccionar...</option>
              {categorias[tipo].map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Método de Pago */}
          <div className="space-y-2">
            <Label htmlFor="metodoPago">Método de Pago</Label>
            <select
              id="metodoPago"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              {metodosPago.map(metodo => (
                <option key={metodo.value} value={metodo.value}>{metodo.label}</option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <textarea
              id="descripcion"
              placeholder="Describe el motivo del movimiento..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            />
          </div>

          {/* Botón de submit */}
          <Button
            type="submit"
            className={`w-full ${tipo === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            disabled={submitting}
          >
            {submitting ? 'Registrando...' : `Registrar ${tipo === 'entrada' ? 'Entrada' : 'Salida'}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
