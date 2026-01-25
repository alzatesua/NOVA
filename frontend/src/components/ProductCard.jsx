// src/views/ProductCard.jsx
import React, { useState, useEffect, memo } from 'react';
import {
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/solid';
import {
  subirImagenProducto,
  obtenerImagenProducto
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../utils/toast';

function ProductCard({
  product,
  isExpanded,
  editingState,
  onToggleDetails,
  onToggleEdit,
  onFieldChange,
  onSave,
  onToggleActive
}) {
  const {
    id,
    categoria_nombre,
    descripcion,
    descripcion_larga,
    imagenUrl,
    is_active
  } = product;

  const { usuario, tokenUsuario: token, subdominio } = useAuth();
  const [previewImage, setPreviewImage] = useState(imagenUrl);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { editing, fields } = editingState;

  // Carga inicial de imagen
  useEffect(() => {
    let mounted = true;
    setImageError(false);
    (async () => {
      try {
        const [url] = await obtenerImagenProducto({
          productoId: id,
          usuario,
          token,
          subdominio
        });
        if (!mounted) return;
        setPreviewImage(`${url}?t=${Date.now()}`);
      } catch (err) {
        if (mounted) showToast('error', err.message);
      } finally {
        if (mounted) setIsLoadingImage(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, usuario, token, subdominio]);

  // Subir nueva imagen
  const handleImageChange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setPreviewImage(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const { imagenUrl: newUrl } = await subirImagenProducto({
        id,
        usuario,
        token,
        subdominio,
        categoriaId: product.id_categoria,
        imagen: file
      });
      setPreviewImage(`${newUrl}?t=${Date.now()}`);
      showToast('success', 'Imagen subida con éxito');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col w-full">

      {/* Hero + imagen + upload */}
      <div className="relative h-48 w-full bg-gray-100 flex items-center justify-center">
        {isLoadingImage ? (
  <svg
    className="animate-spin h-8 w-8 text-gray-400"
    xmlns="http://www.w3.org/2000/svg"
    fill="none" viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25" cx="12" cy="12" r="10"
      stroke="currentColor" strokeWidth="4"
    />
    <path
      className="opacity-75" fill="currentColor"
      d="M4 12a8 8 0 018-8v8H4z"
    />
  </svg>
        ) : imageError ? (
          <label
            htmlFor={`file-${id}`}
            className="flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <CameraIcon className="h-12 w-12 mb-2" />
            <span>Haz clic para subir una imagen</span>
          </label>
        ) : (
          <img
            src={previewImage || '/placeholder.png'}
            alt={fields.nombre}
            className="object-contain w-full h-full"
            loading="lazy"
            onError={e => {
              e.currentTarget.onerror = null;
              setImageError(true);
            }}
          />
        )}


        <label
          htmlFor={`file-${id}`}
          className={`
            absolute inset-0 flex items-center justify-center
            ${isUploading
              ? 'pointer-events-none opacity-50'
              : 'hover:bg-black hover:bg-opacity-30 cursor-pointer'}
          `}
        >
          <CameraIcon
            className={`h-8 w-8 text-white transition
              ${isUploading ? 'opacity-50' : 'opacity-0 hover:opacity-100'}`}
          />
        </label>
        <input
          id={`file-${id}`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
          disabled={isUploading}
        />

        {/* Badge de stock */}
        <span
          className={`
            absolute top-2 right-2 inline-flex items-center text-xs font-semibold
            px-2 py-1 rounded-full
            ${fields.stock <= 0
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'}
          `}
        >
          {fields.stock <= 0 ? (
            <XCircleIcon className="w-4 h-4 mr-1" />
          ) : (
            <CheckCircleIcon className="w-4 h-4 mr-1" />
          )}
          {fields.stock <= 0 ? 'Agotado' : 'Disponible'}
        </span>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 p-6 flex flex-col">
        {/* Nombre */}
        {editing ? (
          <input
            type="text"
            value={fields.nombre}
            onChange={e => onFieldChange(id, 'nombre', e.target.value)}
            className="text-2xl font-bold text-gray-900 mb-1 border-b focus:outline-none"
          />
        ) : (
          <h5 className="text-2xl font-bold text-gray-900 mb-1">
            {fields.nombre}
          </h5>
        )}

        {/* Categoría */}
        {categoria_nombre && (
          <span className="inline-block text-sm bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full mb-4">
            {categoria_nombre}
          </span>
        )}

        {/* Descripción corta */}
        {editing ? (
          <textarea
            rows={2}
            value={fields.descripcion}
            onChange={e => onFieldChange(id, 'descripcion', e.target.value)}
            className="text-gray-600 text-sm mb-4 border rounded p-2 focus:outline-none"
          />
        ) : fields.descripcion ? (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {fields.descripcion}
          </p>
        ) : null}

        {/* Datos */}
        <dl className="flex-1 space-y-3 text-gray-700 text-sm">
          {/* SKU (solo lectura) */}
          <div className="flex justify-between items-center">
            <dt className="font-medium">SKU</dt>
            <dd className="text-right text-gray-800">{fields.sku}</dd>
          </div>
          
          {fields.imei && (
            <div className="flex justify-between items-center">
              <dt className="font-medium">IMEI</dt>
              <dd className="text-right text-gray-800">{fields.imei}</dd>
            </div>
          )}


          {/* Stock editable con botones */}
          <div className="flex justify-between items-center">
            <dt className="font-medium">Stock</dt>
            {editing ? (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() =>
                    onFieldChange(id, 'stock', Math.max(0, fields.stock - 1))
                  }
                  className="px-2 py-1 bg-gray-200 rounded"
                >
                  −
                </button>
                <span className="w-8 text-center">{fields.stock}</span>
                <button
                  type="button"
                  onClick={() =>
                    onFieldChange(id, 'stock', fields.stock + 1)
                  }
                  className="px-2 py-1 bg-gray-200 rounded"
                >
                  +
                </button>
              </div>
            ) : (
              <dd className="text-right text-gray-800">{fields.stock}</dd>
            )}
          </div>

          {/* Precio */}
          <div className="flex justify-between items-center">
            <dt className="font-medium">Precio</dt>
            {editing ? (
              <input
                type="number"
                step="0.01"
                value={fields.precio}
                onChange={e =>
                  onFieldChange(id, 'precio', parseFloat(e.target.value))
                }
                className="w-24 text-right border-b focus:outline-none"
              />
            ) : (
              <dd className="text-right text-gray-800">
                ${fields.precio.toFixed(2)}
              </dd>
            )}
          </div>
        </dl>

        {/* Toggle + precio al final */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => onToggleDetails(id)}
            className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm font-medium"
          >
            {isExpanded ? 'Ocultar' : 'Acciones'}
            {isExpanded ? (
              <ChevronUpIcon className="w-4 h-4 ml-1" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 ml-1" />
            )}
          </button>
          {!editing && (
            <span className="text-lg font-semibold text-gray-800">
              ${fields.precio.toFixed(2)}
            </span>
          )}
        </div>

        {/* Detalles extra */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-4 text-gray-700 text-sm">
            

            <div className="flex gap-3">
              {editing ? (
                <>
                  <button
                    onClick={() => onSave(id)}
                    className="bg-green-600 text-white text-sm px-3 py-1 rounded hover:bg-green-700"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => onToggleEdit(id)}
                    className="bg-gray-300 text-gray-800 text-sm px-3 py-1 rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onToggleEdit(id)}
                  className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  <PencilSquareIcon className="w-5 h-5 mr-1" />
                  Editar
                </button>
              )}
              <button
                onClick={() => onToggleActive(product)}
                className={`px-3 py-1 rounded text-sm font-medium text-white ${
                  is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {is_active ? 'Inactivar' : 'Activar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ProductCard);
