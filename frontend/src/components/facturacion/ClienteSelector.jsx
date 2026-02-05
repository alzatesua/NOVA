import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MagnifyingGlassIcon, UserPlusIcon, XMarkIcon, BuildingOfficeIcon, UserIcon } from '@heroicons/react/24/outline';
import { buscarCliente, crearCliente } from '../../services/api';
import { showToast } from '../../utils/toast';

// Modal separado que se renderiza fuera del formulario padre
function CrearClienteModal({ show, onClose, onCrear }) {
  const [tipoPersona, setTipoPersona] = useState('NAT');
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const formData = new FormData(e.target);
    const tipo = formData.get('tipo_persona');

    // Construir datos según tipo de persona
    const datos = {
      tipo_persona: tipo,
      tipo_documento: formData.get('tipo_documento'),
      numero_documento: formData.get('numero_documento'),
      correo: formData.get('correo'),
      telefono: formData.get('telefono'),
      direccion: formData.get('direccion'),
    };

    if (tipo === 'NAT') {
      datos.primer_nombre = formData.get('primer_nombre');
      datos.segundo_nombre = formData.get('segundo_nombre') || null;
      datos.apellidos = formData.get('apellidos');
    } else {
      datos.razon_social = formData.get('razon_social');
      datos.primer_nombre = null;
      datos.segundo_nombre = null;
      datos.apellidos = null;
    }

    setLoading(true);
    try {
      await onCrear(datos);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {tipoPersona === 'NAT' ? (
                  <UserIcon className="h-6 w-6" />
                ) : (
                  <BuildingOfficeIcon className="h-6 w-6" />
                )}
                Nuevo Cliente
              </h3>
              <p className="text-blue-100 text-sm mt-1">
                {tipoPersona === 'NAT' ? 'Persona Natural' : 'Persona Jurídica'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleCrearCliente} className="p-6 space-y-5">
          {/* Tipo de Persona */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Persona</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoPersona('NAT')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  tipoPersona === 'NAT'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <UserIcon className="h-5 w-5" />
                <span className="font-medium">Natural</span>
              </button>
              <button
                type="button"
                onClick={() => setTipoPersona('JUR')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  tipoPersona === 'JUR'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <BuildingOfficeIcon className="h-5 w-5" />
                <span className="font-medium">Jurídica</span>
              </button>
            </div>
            <input type="hidden" name="tipo_persona" value={tipoPersona} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tipo Documento */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo Documento</label>
              <select
                name="tipo_documento"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              >
                <option value="">Seleccionar...</option>
                <option value="CC">Cédula</option>
                <option value="NIT">NIT</option>
                <option value="CE">Cédula Extranjería</option>
                <option value="TI">Tarjeta Identidad</option>
              </select>
            </div>

            {/* Número Documento */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Número</label>
              <input
                type="text"
                name="numero_documento"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="12345678"
                required
              />
            </div>
          </div>

          {tipoPersona === 'NAT' ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Primer Nombre *</label>
                  <input
                    type="text"
                    name="primer_nombre"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Juan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Segundo Nombre</label>
                  <input
                    type="text"
                    name="segundo_nombre"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Carlos"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Apellidos *</label>
                <input
                  type="text"
                  name="apellidos"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Pérez García"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Razón Social *</label>
              <input
                type="text"
                name="razon_social"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Mi Empresa SAS"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="300 123 4567"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Correo</label>
              <input
                type="email"
                name="correo"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección</label>
            <input
              type="text"
              name="direccion"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Calle 123 #45-67"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
            >
              {loading ? 'Creando...' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function ClienteSelector({ cliente, onClienteChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const tokenUsuario = localStorage.getItem('token_usuario');
  const usuario = localStorage.getItem('usuario');
  const subdominio = window.location.hostname.split('.')[0];

  // Buscar cliente con debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setLoading(true);
        try {
          const response = await buscarCliente({
            query: searchQuery,
            token: tokenUsuario,
            usuario,
            subdominio
          });
          setSearchResults(response.clientes || []);
        } catch (error) {
          console.error('Error buscando cliente:', error);
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCliente = (clienteSeleccionado) => {
    onClienteChange(clienteSeleccionado);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleClearCliente = () => {
    onClienteChange(null);
  };

  const handleCrearCliente = async (datos) => {
    try {
      const response = await crearCliente({
        token: tokenUsuario,
        usuario,
        subdominio,
        datos
      });
      onClienteChange(response.cliente);
      setShowCreateForm(false);
      showToast('success', 'Cliente creado correctamente');
    } catch (error) {
      showToast('error', error.message || 'Error al crear cliente');
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">Cliente</label>

      {/* Buscador */}
      <div className="relative group">
        <input
          type="text"
          value={searchQuery || (cliente && cliente.nombre_completo) || ''}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (cliente) {
              setSearchQuery('');
              onClienteChange(null);
            }
          }}
          placeholder="Buscar por documento o nombre..."
          className="w-full pl-12 pr-24 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
        />
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />

        {cliente && (
          <button
            type="button"
            onClick={handleClearCliente}
            className="absolute right-12 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            title="Limpiar cliente"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          title="Crear nuevo cliente"
        >
          <UserPlusIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Resultados de búsqueda */}
      {searchResults.length > 0 && (
        <div className="absolute z-30 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {searchResults.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelectCliente(c)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <p className="font-semibold text-gray-900">{c.nombre_completo}</p>
              <p className="text-sm text-gray-500">
                {c.tipo_documento}: {c.numero_documento}
              </p>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute z-30 w-full bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Buscando...</p>
        </div>
      )}

      {/* Modal de creación */}
      <CrearClienteModal
        show={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onCrear={handleCrearCliente}
      />

      {/* Cliente seleccionado */}
      {cliente && !searchQuery && (
        <div className="mt-2 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-lg">{cliente.nombre_completo}</p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="inline-flex items-center gap-1">
                  <span className="font-semibold">{cliente.tipo_documento}:</span>
                  <span>{cliente.numero_documento}</span>
                </span>
              </p>
              {cliente.correo && (
                <p className="text-sm text-gray-600">{cliente.correo}</p>
              )}
              {cliente.telefono && (
                <p className="text-sm text-gray-600">{cliente.telefono}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleClearCliente}
              className="p-2 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
              title="Cambiar cliente"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
