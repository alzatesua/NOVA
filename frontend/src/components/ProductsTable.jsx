// src/views/ProductsTable.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';
import {
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/solid';
import { actualizarfila } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../utils/toast';

export default function ProductsTable({ products = [] }) {
  const { rol, tokenUsuario, subdominio, logout } = useAuth();
  const usuario = localStorage.getItem('usuario');
  
  // Local copy + infinite scroll
  const [localProducts, setLocalProducts] = useState(products);
  useEffect(() => {
    setLocalProducts(products);
    setVisibleCount(10);
    setSelectedIds(new Set());
  }, [products]);

  const [visibleCount, setVisibleCount] = useState(10);
  const loadMoreRef = useRef(null);
  useEffect(() => {
    if (visibleCount >= localProducts.length) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisibleCount(v => Math.min(v + 10, localProducts.length));
          obs.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0.1 }
    );
    if (loadMoreRef.current) obs.observe(loadMoreRef.current);
    return () => obs.disconnect();
  }, [visibleCount, localProducts.length]);

  // Inline editing
  const [editRowId, setEditRowId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const startEdit = useCallback(p => {
    setEditRowId(p.id);
    setEditFields({ nombre: p.nombre, precio: p.precio, cantidad: p.cantidad });
  }, []);
  const cancelEdit = useCallback(() => {
    setEditRowId(null);
    setEditFields({});
  }, []);
  const onFieldChange = useCallback((field, value) => {
    setEditFields(f => ({ ...f, [field]: value }));
  }, []);
  const saveRow = useCallback(async id => {
    try {
      await actualizarfila({
        rol,
        token: localStorage.getItem('token_usuario'),
        usuario,
        tokenUsuario,
        subdominio,
        tabla: 'productos',
        columna_filtro: 'id',
        valor_filtro: id,
        datos: { 
          nombre: editFields.nombre,
          precio: editFields.precio,
          cantidad: editFields.cantidad 
        }
      });
      showToast('success', 'Producto actualizado');
      setLocalProducts(lp => lp.map(p => p.id === id ? { ...p, ...editFields } : p));
      cancelEdit();
    } catch (err) {
      console.error(err);
      if (err.isNotFound) logout();
      showToast('error', err.message || 'Error al guardar');
    }
  }, [editFields, rol, usuario, tokenUsuario, subdominio, cancelEdit, logout]);

  // Toggle active
  const toggleActive = useCallback(async p => {
    const newActive = !p.is_active;
    if (!newActive && !window.confirm(`Desactivar "${p.nombre}"?`)) return;
    setLocalProducts(lp => lp.map(x => x.id===p.id?{...x, is_active:newActive}:x));
    try {
      await actualizarfila({
        rol,
        token: localStorage.getItem('token_usuario'),
        usuario,
        tokenUsuario,
        subdominio,
        tabla: 'productos',
        columna_filtro: 'id',
        valor_filtro: p.id,
        datos: { is_active: newActive }
      });
      showToast('success', `Producto ${newActive?'activado':'inactivado'}`);
    } catch (err) {
      console.error(err);
      setLocalProducts(lp => lp.map(x => x.id===p.id?{...x, is_active:p.is_active}:x));
      if (err.isNotFound) logout();
      showToast('error', err.message || 'Error al cambiar estado');
    }
  }, [rol, usuario, tokenUsuario, subdominio, logout]);

  // Selection & select all
  const [selectedIds, setSelectedIds] = useState(new Set());
  const toggleSelect = useCallback(id => {
    setSelectedIds(s => {
      const next = new Set(s);
      s.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);
  const allVisible = visibleProducts => visibleProducts.every(p => selectedIds.has(p.id));
  const toggleSelectAll = () => {
    const visible = localProducts.slice(0, visibleCount);
    if (allVisible(visible)) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visible.map(p => p.id)));
    }
  };

  // Show selected data
  const selectedData = localProducts.filter(p => selectedIds.has(p.id));

  const visibleProducts = localProducts.slice(0, visibleCount);

  return (
    <div className="relative">
      {/* Bulk toolbar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:!bg-blue-900/30 border border-blue-200 dark:!border-blue-800 rounded flex items-center justify-between transition-colors duration-200">
          <span className="text-slate-700 dark:!text-slate-300">{selectedIds.size} seleccionado(s)</span>
          <pre className="bg-white dark:!bg-slate-800 p-2 text-xs overflow-auto max-h-40 text-slate-800 dark:!text-slate-200 rounded border border-slate-200 dark:!border-slate-700 transition-colors duration-200">
            {JSON.stringify(selectedData, null, 2)}
          </pre>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:!divide-slate-800 bg-white dark:!bg-slate-900 transition-colors duration-200">
          <thead className="bg-slate-50 dark:!bg-slate-950">
            <tr>
              <th className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={allVisible(visibleProducts)}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-700 rounded"
                />
              </th>
              <th className="px-4 py-2 text-left text-slate-700 dark:!text-slate-300">Nombre</th>
              <th className="px-4 py-2 text-left text-slate-700 dark:!text-slate-300">SKU</th>
              <th className="px-4 py-2 text-right text-slate-700 dark:!text-slate-300">Precio</th>
              <th className="px-4 py-2 text-center text-slate-700 dark:!text-slate-300">Cantidad</th>
              <th className="px-4 py-2 text-left text-slate-700 dark:!text-slate-300">Categoría</th>
              <th className="px-4 py-2 text-center text-slate-700 dark:!text-slate-300">Activo</th>
              <th className="px-4 py-2 text-left text-slate-700 dark:!text-slate-300">Creado en</th>
              <th className="px-4 py-2 text-center text-slate-700 dark:!text-slate-300">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:!divide-slate-800">
            {visibleProducts.map(p => (
              <tr key={p.id} className={`hover:bg-slate-50 dark:hover:!bg-slate-800/50 transition-colors duration-200 ${selectedIds.has(p.id)?'bg-blue-50 dark:!bg-blue-900/30':''}`}>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-700 rounded"
                  />
                </td>
                <td className="px-4 py-2">
                  {editRowId === p.id ? (
                    <input
                      type="text"
                      value={editFields.nombre}
                      onChange={e => onFieldChange('nombre', e.target.value)}
                      className="w-full border-b border-slate-300 dark:!border-slate-700 focus:outline-none bg-transparent dark:!bg-slate-900 text-slate-900 dark:!text-slate-100 transition-colors duration-200"
                    />
                  ) : (
                    <span className="text-slate-900 dark:!text-slate-100">{p.nombre}</span>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-700 dark:!text-slate-300">{p.sku}</td>
                <td className="px-4 py-2 text-right text-slate-900 dark:!text-slate-100">
                  {editRowId === p.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editFields.precio}
                      onChange={e => onFieldChange('precio', parseFloat(e.target.value))}
                      className="w-20 text-right border-b border-slate-300 dark:!border-slate-700 focus:outline-none bg-transparent dark:!bg-slate-900 text-slate-900 dark:!text-slate-100 transition-colors duration-200"
                    />
                  ) : (
                    `$${Number(p.precio).toFixed(2)}`
                  )}
                </td>
                <td className="px-4 py-2 text-center text-slate-900 dark:!text-slate-100">
                  {editRowId === p.id ? (
                    <div className="inline-flex items-center space-x-1">
                      <button
                        onClick={() => onFieldChange('cantidad', Math.max(0, editFields.cantidad - 1))}
                        className="px-1 py-0.5 bg-slate-200 dark:!bg-slate-700 rounded hover:bg-slate-300 dark:hover:!bg-slate-600 transition-colors duration-200"
                      >−</button>
                      <span className="w-8 text-center">{editFields.cantidad}</span>
                      <button
                        onClick={() => onFieldChange('cantidad', editFields.cantidad + 1)}
                        className="px-1 py-0.5 bg-slate-200 dark:!bg-slate-700 rounded hover:bg-slate-300 dark:hover:!bg-slate-600 transition-colors duration-200"
                      >+</button>
                    </div>
                  ) : (
                    p.cantidad
                  )}
                </td>
                <td className="px-4 py-2 text-slate-700 dark:!text-slate-300">{p.categoria_nombre}</td>
                <td className="px-4 py-2 text-center">
                  <span className={`text-sm font-medium ${p.is_active ? 'text-emerald-600 dark:text-emerald-400':'text-red-600 dark:text-red-400'}`}>
                    {p.is_active?'Sí':'No'}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-700 dark:!text-slate-300">{new Date(p.creado_en).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-center space-x-1">
                  {editRowId === p.id ? (
                    <>
                      <button onClick={() => saveRow(p.id)} className="bg-emerald-600 text-white p-1 rounded hover:bg-emerald-700 transition-colors duration-200">Guardar</button>
                      <button onClick={cancelEdit} className="bg-slate-300 dark:!bg-slate-700 text-slate-800 dark:!text-slate-200 p-1 rounded hover:bg-slate-400 dark:hover:!bg-slate-600 transition-colors duration-200">Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(p)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200">
                        <PencilSquareIcon className="h-5 w-5 inline"/>
                      </button>
                      <button onClick={() => toggleActive(p)}
                        className={`text-white p-1 rounded transition-colors duration-200 ${p.is_active?'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700':'bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700'}`}>
                        {p.is_active?'Inactivar':'Activar'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {visibleCount < localProducts.length && (
              <tr ref={loadMoreRef}>
                <td colSpan="9" className="p-4 text-center">
                  <svg className="animate-spin h-6 w-6 text-slate-600 dark:text-slate-400 mx-auto" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
