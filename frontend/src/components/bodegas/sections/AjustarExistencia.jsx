// src/components/bodegas/sections/AjustarExistencia.jsx
import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, MagnifyingGlassIcon, CheckCircleIcon, CubeIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../../hooks/useAuth';

// Debounce simple
function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Util para unir URLs
function joinUrl(base, path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (base.endsWith('/') && path.startsWith('/')) return base.slice(0, -1) + path;
  if (!base.endsWith('/') && !path.startsWith('/')) return base + '/' + path;
  return base + path;
}

// Helpers de productos/bodegas
const getBodegaIdFromProduct = (p) =>
  Number(p.bodega ?? p.bodega_id ?? p.id_bodega);

const findBodegaObj = (bodegasList, id) =>
  bodegasList.find(b => Number(b.id) === Number(id)) || null;

export default function AjustarExistencia({
  // Estado/control del padre
  ajusteForm = { producto: '', bodega: '', delta: '' },
  setAjusteForm,
  ajusteLoading = false,
  onAjustar,
  handleTabChange = () => {},

  // Data para selects
  bodegas,
  isLoadingBodegas,
  productos,
  isLoadingProductos,
  errorBodegas,
  onRetryBodegas,
  sucursalSel,
}) {
  const { tokenUsuario, subdominio } = useAuth();

  // Construcción del dominio para imágenes
  const dominio = import.meta.env.VITE_DOMINIO;
  const fullUrl = subdominio && dominio ? `https://${subdominio}.${dominio}` : '';

  // Setter defensivo
  const setAjusteFormSafe =
    typeof setAjusteForm === 'function'
      ? setAjusteForm
      : (u) => console.error('[AjustarExistencia] setAjusteForm no es función:', setAjusteForm, u);

  // Estado local
  const [codigoBarras, setCodigoBarras] = useState('');
  const debouncedBarcode = useDebounce(codigoBarras, 300);
  const [productoEncontrado, setProductoEncontrado] = useState(null);
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [imgError, setImgError] = useState(null);
  const barcodeRef = useRef(null);

  useEffect(() => { barcodeRef.current?.focus(); }, []);

  const bodegasList = Array.isArray(bodegas) ? bodegas : [];
  const productosList = Array.isArray(productos) ? productos : [];
  const loadingBodegas = !!isLoadingBodegas;
  const loadingProductos = !!isLoadingProductos;

  const sameBodega = (p, bodegaId) =>
    Number(p.bodega ?? p.bodega_id ?? p.id_bodega) === Number(bodegaId);

  const getBarcode = (p) =>
    String(p.codigo_barras ?? p.codigo_barra ?? p.barcode ?? p.codigo ?? p.sku ?? '').trim();

  // === Autocompletar por código de barras ===
  useEffect(() => {
    const code = String(debouncedBarcode || '').trim();

    if (!code) {
      setProductoEncontrado(null);
      setAjusteFormSafe(prev => ({ ...prev, producto: '' }));
      return;
    }

    const bodegaIdSel = ajusteForm?.bodega ? Number(ajusteForm.bodega) : null;

    // 1) Ya hay bodega seleccionada → buscar dentro de esa bodega
    if (bodegaIdSel) {
      const candidates = productosList.filter(p => sameBodega(p, bodegaIdSel));
      const found = candidates.find(p => getBarcode(p) === code);

      if (!found) {
        setProductoEncontrado(null);
        setAjusteFormSafe(prev => ({ ...prev, producto: '' }));
        return;
      }

      setProductoEncontrado(found);
      setAjusteFormSafe(prev => ({ ...prev, producto: found.id }));
      return;
    }

    // 2) Sin bodega seleccionada → buscar en todas
    const matches = productosList.filter(p => getBarcode(p) === code);

    if (matches.length === 0) {
      setProductoEncontrado(null);
      setAjusteFormSafe(prev => ({ ...prev, producto: '' }));
      return;
    }

    // Bodegas únicas donde existe ese código
    const uniqueBodegaIds = Array.from(new Set(matches.map(getBodegaIdFromProduct)));

    if (uniqueBodegaIds.length === 1) {
      const bodegaId = uniqueBodegaIds[0];
      const found = matches[0];

      setProductoEncontrado(found);
      setAjusteFormSafe(prev => ({
        ...prev,
        bodega: bodegaId,
        producto: found.id,
      }));
      setBodegaSeleccionada(findBodegaObj(bodegasList, bodegaId));
    } else {
      setProductoEncontrado(null);
      setAjusteFormSafe(prev => ({ ...prev, producto: '' }));
    }
  }, [debouncedBarcode, ajusteForm?.bodega, productosList, bodegasList, setAjusteFormSafe]);

  // Handlers
  const onBarcodeChange = (value) => setCodigoBarras(value ?? '');

  const onBodegaSelect = (bodegaIdRaw) => {
    const bodegaId = bodegaIdRaw === '' ? '' : Number(bodegaIdRaw);
    const bSel = findBodegaObj(bodegasList, bodegaId);
    setBodegaSeleccionada(bSel);
    setAjusteFormSafe(prev => ({ ...prev, bodega: bodegaId }));

    if (productoEncontrado) {
      const prodBodega = getBodegaIdFromProduct(productoEncontrado);
      if (prodBodega !== Number(bodegaId)) {
        setProductoEncontrado(null);
        setCodigoBarras('');
        setAjusteFormSafe(prev => ({ ...prev, producto: '' }));
      }
    }
  };

  const onProductoSelect = (productoId) => {
    if (!productoId) {
      setProductoEncontrado(null);
      setCodigoBarras('');
      setAjusteFormSafe(prev => ({ ...prev, producto: '' }));
      return;
    }
    const bodegaId = Number(ajusteForm?.bodega);
    const found = productosList
      .filter(p => sameBodega(p, bodegaId))
      .find(p => Number(p.id) === Number(productoId));

    if (found) {
      setProductoEncontrado(found);
      setCodigoBarras(getBarcode(found));
      setAjusteFormSafe(prev => ({ ...prev, producto: found.id }));
    }
  };

  // Derivado - Stock resultante
  const stockResultante =
    productoEncontrado && ajusteForm?.delta !== ''
      ? Number(productoEncontrado?.stock || 0) + Number(ajusteForm.delta)
      : null;

  // Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const ok =
      ajusteForm?.bodega !== '' &&
      ajusteForm?.producto !== '' &&
      ajusteForm?.delta !== '' &&
      !Number.isNaN(Number(ajusteForm?.delta));
      
    if (!ok) {
      console.warn('Formulario incompleto o inválido');
      return;
    }

    const payload = {
      producto: Number(ajusteForm.producto),
      bodega: Number(ajusteForm.bodega),
      delta: Number(ajusteForm.delta),
    };

    console.log('📤 Enviando ajuste:', payload);

    if (typeof onAjustar === 'function') {
      onAjustar(payload);
    } else {
      console.error('[AjustarExistencia] onAjustar no es función:', onAjustar);
    }
  };

  // Cargar imagen desde backend
  useEffect(() => {
    let revoked = false;
    let currentUrl = null;

    setImgError(null);
    setImgUrl(null);

    const path = productoEncontrado?.imagen_producto;
    if (!path || !fullUrl) return;

    const absolute = joinUrl(fullUrl, path);

    (async () => {
      try {
        const res = await fetch(absolute);
        if (!res.ok) throw new Error('No se pudo descargar la imagen');
        const blob = await res.blob();
        currentUrl = URL.createObjectURL(blob);
        if (!revoked) setImgUrl(currentUrl);
      } catch (err) {
        console.error('[AjustarExistencia] Imagen error:', err);
        if (!revoked) setImgError(err);
      }
    })();

    return () => {
      revoked = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [productoEncontrado?.imagen_producto, fullUrl]);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
          <SparklesIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Ajuste de inventario</h3>
          <p className="text-sm text-slate-600">Modifica inventarios con búsqueda inteligente por código de barras</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna izquierda - Formulario */}
          <div className="lg:col-span-8 space-y-6">
            {/* Fila 1: Código de barras y Bodega */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <MagnifyingGlassIcon className="w-4 h-4 inline mr-1" />
                  Código de Barras
                </label>
                <input
                  ref={barcodeRef}
                  type="text"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                            transition-all duration-200 shadow-sm hover:shadow-md"
                  value={codigoBarras}
                  placeholder="Escanea o escribe un código..."
                  onChange={(e) => onBarcodeChange(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Bodega <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={ajusteForm?.bodega || ''}
                  onChange={(e) => onBodegaSelect(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm 
                            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
                            transition-all duration-200 shadow-sm hover:shadow-md appearance-none"
                >
                  <option value="">Seleccionar bodega...</option>
                  {loadingBodegas ? (
                    <option disabled>⏳ Cargando bodegas...</option>
                  ) : (
                    bodegasList
                      .filter(b =>
                        sucursalSel 
                          ? Number(b.sucursal_id ?? b.id_sucursal ?? b.sucursal) === Number(sucursalSel?.id) 
                          : true
                      )
                      .map(bodega => (
                        <option key={bodega.id} value={bodega.id}>
                          🏪 {bodega.nombre}
                        </option>
                      ))
                  )}
                </select>
                {bodegaSeleccionada && (
                  <p className="text-xs text-emerald-600 mt-1">✓ {bodegaSeleccionada.nombre}</p>
                )}
              </div>
            </div>

            {/* Producto encontrado */}
            {productoEncontrado && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">Producto Encontrado</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-emerald-600 font-medium">Nombre:</span>
                    <p className="font-semibold text-slate-800 truncate">{productoEncontrado?.nombre}</p>
                  </div>
                  <div>
                    <span className="text-emerald-600 font-medium">Stock:</span>
                    <p className="font-semibold text-slate-800">{productoEncontrado?.stock ?? 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-emerald-600 font-medium">ID:</span>
                    <p className="font-semibold text-slate-800">{productoEncontrado?.id}</p>
                  </div>
                  <div>
                    <span className="text-emerald-600 font-medium">Bodega:</span>
                    <p className="font-semibold text-slate-800 truncate">{bodegaSeleccionada?.nombre || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Fila 2: ID Producto, Selector manual, Ajuste */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  ID del Producto <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm 
                            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                            transition-all duration-200"
                  value={ajusteForm?.producto ?? ''}
                  onChange={(e) => setAjusteFormSafe(prev => ({ ...prev, producto: e.target.value }))}
                  placeholder="ID del producto"
                  required
                  readOnly={!!productoEncontrado}
                />
                {productoEncontrado && (
                  <p className="text-xs text-emerald-600 mt-1">✓ Autocompletado</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  O selecciona manualmente
                </label>
                <select
                  disabled={!ajusteForm?.bodega}
                  value={ajusteForm?.producto ?? ''}
                  onChange={(e) => onProductoSelect(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm 
                            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                            transition-all duration-200 disabled:opacity-50"
                >
                  <option value="">
                    {ajusteForm?.bodega ? 'Buscar producto...' : 'Selecciona primero la bodega'}
                  </option>
                  {loadingProductos ? (
                    <option disabled>Cargando productos...</option>
                  ) : (
                    productosList
                      .filter(p => sameBodega(p, ajusteForm?.bodega))
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}{typeof p.stock !== 'undefined' ? ` • Stock: ${p.stock}` : ''}
                        </option>
                      ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Ajuste <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm 
                            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                            transition-all duration-200"
                  value={ajusteForm?.delta ?? ''}
                  onChange={(e) => setAjusteFormSafe(prev => ({ ...prev, delta: e.target.value }))}
                  step="1"
                  placeholder="+10 o -5"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Positivo suma, negativo resta</p>
              </div>
            </div>
          </div>

          {/* Columna derecha - Imagen y resumen */}
          <div className="lg:col-span-4 space-y-6">
            {/* Imagen del producto */}
            <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
              <h5 className="text-sm font-semibold text-slate-700 mb-3 text-center">
                Imagen del Producto
              </h5>
              <div className="w-full aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg 
                            border border-slate-200 flex items-center justify-center overflow-hidden relative">
                {imgUrl && !imgError && (
                  <img
                    key={imgUrl}
                    src={imgUrl}
                    alt={productoEncontrado?.nombre || 'Producto'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}

                {(!imgUrl || imgError) && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 absolute inset-0">
                    <CubeIcon className="w-16 h-16 mb-2" />
                    <span className="text-sm font-medium">
                      {productoEncontrado
                        ? (imgError ? 'No se pudo cargar la imagen' : 'Sin imagen')
                        : 'Busca un producto'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen del ajuste */}
            {productoEncontrado && ajusteForm?.delta !== '' && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-4">
                <h5 className="text-sm font-semibold text-blue-800 mb-3 text-center">
                  📊 Resumen del Ajuste
                </h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                    <span className="text-sm text-slate-600">Stock Actual:</span>
                    <span className="font-bold text-slate-800">
                      {productoEncontrado?.stock ?? '?'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                    <span className="text-sm text-slate-600">Ajuste:</span>
                    <span className={`font-bold ${
                      Number(ajusteForm.delta) > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {Number(ajusteForm.delta) > 0 ? '+' : ''}{ajusteForm.delta}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-indigo-100 rounded-lg border border-indigo-200">
                    <span className="text-sm font-semibold text-indigo-800">Stock Final:</span>
                    <span className="font-bold text-indigo-600 text-lg">
                      {stockResultante ?? '?'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={() => handleTabChange('administrar')}
            className="px-6 py-3 text-slate-700 font-medium rounded-xl border-2 border-slate-200 
                      hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              ajusteLoading ||
              !ajusteForm?.producto ||
              !ajusteForm?.bodega ||
              ajusteForm?.delta === '' ||
              Number.isNaN(Number(ajusteForm?.delta))
            }
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold 
                      rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 
                      hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 transition-all duration-200"
          >
            {ajusteLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Aplicando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5" />
                Aplicar Ajuste
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}