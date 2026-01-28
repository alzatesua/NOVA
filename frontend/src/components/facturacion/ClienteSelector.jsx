import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { buscarCliente, crearCliente } from '../../services/api';
import { showToast } from '../../utils/toast';

export default function ClienteSelector({ cliente, onClienteChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const tokenUsuario = localStorage.getItem('token_usuario');
  const usuario = localStorage.getItem('usuario');
  const subdominio = localStorage.getItem('slug');

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
          setSearchResults(response.datos || []);
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

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const datos = {
      tipo_persona: formData.get('tipo_persona'),
      primer_nombre: formData.get('primer_nombre'),
      segundo_nombre: formData.get('segundo_nombre'),
      apellidos: formData.get('apellidos'),
      razon_social: formData.get('razon_social'),
      tipo_documento: formData.get('tipo_documento'),
      numero_documento: formData.get('numero_documento'),
      correo: formData.get('correo'),
      telefono: formData.get('telefono'),
      direccion: formData.get('direccion'),
    };

    try {
      const response = await crearCliente({
        token: tokenUsuario,
        usuario,
        subdominio,
        datos
      });
      onClienteChange(response);
      setShowCreateForm(false);
      showToast('success', 'Cliente creado correctamente');
    } catch (error) {
      showToast('error', error.message || 'Error al crear cliente');
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Cliente</label>

      {/* Buscador */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery || (cliente && cliente.nombre_completo) || ''}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={(e) => {
            if (cliente) {
              setSearchQuery('');
              onClienteChange(null);
            }
          }}
          placeholder="Buscar por documento o nombre..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

        {cliente && (
          <button
            type="button"
            onClick={handleClearCliente}
            className="absolute right-10 top-3 p-1 text-gray-400 hover:text-gray-600"
            title="Limpiar cliente"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="absolute right-2 top-2 p-1 text-blue-600 hover:bg-blue-50 rounded"
          title="Crear nuevo cliente"
        >
          <UserPlusIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Resultados de búsqueda */}
      {searchResults.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {searchResults.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelectCliente(c)}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 transition border-b border-gray-100 last:border-b-0"
            >
              <p className="font-medium text-gray-900">{c.nombre_completo}</p>
              <p className="text-sm text-gray-500">
                {c.tipo_documento}: {c.numero_documento}
              </p>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Buscando...</p>
        </div>
      )}

      {/* Formulario de creación */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Nuevo Cliente</h3>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCrearCliente} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo Persona</label>
                <select
                  name="tipo_persona"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="NAT">Natural</option>
                  <option value="JUR">Jurídica</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo Documento</label>
                <select
                  name="tipo_documento"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Seleccionar...</option>
                  <option value="CC">Cédula</option>
                  <option value="NIT">NIT</option>
                  <option value="CE">Cédula Extranjería</option>
                  <option value="TI">Tarjeta Identidad</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Número Documento</label>
                <input
                  type="text"
                  name="numero_documento"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Primer Nombre</label>
                <input
                  type="text"
                  name="primer_nombre"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Segundo Nombre (opcional)</label>
                <input
                  type="text"
                  name="segundo_nombre"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Apellidos</label>
                <input
                  type="text"
                  name="apellidos"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Correo</label>
                <input
                  type="email"
                  name="correo"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cliente seleccionado */}
      {cliente && !searchQuery && (
        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="font-medium text-gray-900">{cliente.nombre_completo}</p>
          <p className="text-sm text-gray-600">
            {cliente.tipo_documento}: {cliente.numero_documento}
          </p>
          <button
            type="button"
            onClick={handleClearCliente}
            className="text-xs text-blue-600 hover:text-blue-800 mt-1 font-medium"
          >
            Cambiar cliente
          </button>
        </div>
      )}
    </div>
  );
}
