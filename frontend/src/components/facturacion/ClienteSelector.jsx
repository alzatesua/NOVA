import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MagnifyingGlassIcon, UserPlusIcon, XMarkIcon, BuildingOfficeIcon, UserIcon, ExclamationTriangleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { buscarCliente, crearCliente, fetchCiudades } from '../../services/api';
import { showToast } from '../../utils/toast';
import Select from 'react-select';

// Componente: Selector de Ciudad con Búsqueda
function CiudadSelector({ value, onChange, token, label = "Ciudad" }) {
  const [ciudades, setCiudades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const cargarCiudades = useCallback(async (search = '') => {
    if (search.length < 2 && search !== '') return;

    setLoading(true);
    try {
      const data = await fetchCiudades(token);
      let ciudadesData = [];
      if (Array.isArray(data)) {
        ciudadesData = data;
      } else if (data && typeof data === 'object') {
        ciudadesData = data.cities || data.ciudades || data.results || [];
      }

      const normalizadas = ciudadesData.map(c => ({
        nombre: c.nombre || c.name || c.ciudad || '',
        ...c
      })).filter(c => c.nombre);

      const filtradas = search
        ? normalizadas.filter(c =>
            c.nombre.toLowerCase().includes(search.toLowerCase())
          )
        : normalizadas;

      setCiudades(filtradas.slice(0, 50));
    } catch (err) {
      console.error('Error cargando ciudades:', err);
      setCiudades([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => cargarCiudades(inputValue), 300);
    return () => clearTimeout(timer);
  }, [inputValue, cargarCiudades]);

  const opciones = ciudades.map(c => ({
    value: c.nombre,
    label: c.nombre
  })).filter(c => c.value && c.label);

  const valorActual = value ? { value, label: value } : null;

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <Select
        value={valorActual}
        onChange={(opcion) => onChange(opcion ? opcion.value : '')}
        options={opciones}
        inputValue={inputValue}
        onInputChange={setInputValue}
        isLoading={loading}
        isClearable
        placeholder="Selecciona una ciudad..."
        noOptionsMessage={() => inputValue.length > 0 && inputValue.length < 2 ? 'Escribe al menos 2 caracteres' : 'Escribe para buscar...'}
        loadingMessage={() => 'Buscando...'}
        className="react-select-container"
        classNamePrefix="react-select"
        components={{
          DropdownIndicator: () => (
            <div className="p-2 text-gray-400">
              <ChevronDownIcon className="h-5 w-5" />
            </div>
          ),
          IndicatorSeparator: () => null,
        }}
      />
    </div>
  );
}

// Modal separado que se renderiza fuera del formulario padre
function CrearClienteModal({ show, onClose, onCrear, token }) {
  const [tipoPersona, setTipoPersona] = useState('NAT');
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({});
  const [formData, setFormData] = useState({
    tipo_documento: '',
    numero_documento: '',
    primer_nombre: '',
    segundo_nombre: '',
    apellidos: '',
    razon_social: '',
    correo: '',
    telefono: '',
    direccion: '',
    ciudad: ''
  });

  if (!show) return null;

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Limpiar errores
    setErrores({});

    // Validar datos
    const erroresValidacion = validarDatos(formData, tipoPersona);
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      const primerError = Object.values(erroresValidacion)[0];
      showToast('error', primerError);
      return;
    }

    // Construir datos según tipo de persona
    const datos = {
      tipo_persona: tipoPersona,
      tipo_documento: formData.tipo_documento,
      numero_documento: formData.numero_documento,
      correo: formData.correo,
      telefono: formData.telefono,
      direccion: formData.direccion,
      ciudad: formData.ciudad
    };

    if (tipoPersona === 'NAT') {
      datos.primer_nombre = formData.primer_nombre;
      datos.segundo_nombre = formData.segundo_nombre || null;
      datos.apellidos = formData.apellidos;
    } else {
      datos.razon_social = formData.razon_social;
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

  // Función de validación
  const validarDatos = (datos, tipo) => {
    const errores = {};

    if (tipo === 'NAT') {
      if (!datos.primer_nombre?.trim()) errores.primer_nombre = 'El primer nombre es obligatorio';
      if (!datos.apellidos?.trim()) errores.apellidos = 'Los apellidos son obligatorios';
    } else {
      if (!datos.razon_social?.trim()) errores.razon_social = 'La razón social es obligatoria';
    }

    if (!datos.tipo_documento) errores.tipo_documento = 'Selecciona el tipo de documento';
    if (!datos.numero_documento?.trim()) {
      errores.numero_documento = 'El número de documento es obligatorio';
    } else if (datos.numero_documento.length < 5) {
      errores.numero_documento = 'Debe tener al menos 5 caracteres';
    }

    if (!datos.correo?.trim()) {
      errores.correo = 'El correo es obligatorio';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(datos.correo)) {
        errores.correo = 'Email no válido. Ejemplo: cliente@ejemplo.com';
      }
    }

    if (!datos.telefono?.trim()) {
      errores.telefono = 'El teléfono es obligatorio';
    } else if (datos.telefono.length < 7) {
      errores.telefono = 'Debe tener al menos 7 dígitos';
    }

    return errores;
  };

  // Función para obtener mensajes de error amigables
  const obtenerMensajeErrorAmigable = (err) => {
    const msg = err.message || '';

    if (msg.includes('Ya existe un cliente con este número de documento') ||
        msg.includes('numero_documento') || msg.includes('unique')) {
      return '⚠️ Este número de documento ya está registrado. Verifica los datos.';
    }

    if (msg.includes('required') || msg.includes('This field is required')) {
      return '📝 Por favor completa todos los campos obligatorios';
    }

    if (msg.includes('email') || msg.includes('Enter a valid email')) {
      return '📧 El correo electrónico no es válido';
    }

    if (msg.includes('TOKEN') || msg.includes('token') || msg.includes('Usuario no encontrado')) {
      return '🔐 Tu sesión ha expirado. Recarga la página';
    }

    if (msg.includes('SESSION_EXPIRED') || msg.includes('fetch') || msg.includes('Network')) {
      return '🌐 Error de conexión. Verifica tu internet';
    }

    return msg || 'Error al guardar el cliente. Intenta nuevamente.';
  };

  // Función auxiliar para clases de input con error
  const clasesInput = (campo) => {
    const tieneError = errores[campo];
    return `w-full px-4 py-2.5 ${tieneError ? 'pr-10 border-red-500 bg-red-50' : 'border-gray-300'} border rounded-xl focus:outline-none focus:ring-2 ${tieneError ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-transparent'} transition-all`;
  };

  // Update form data handler
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errores[field]) {
      setErrores(prev => ({ ...prev, [field]: null }));
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
        <form onSubmit={handleCrearCliente} className="p-6 space-y-4">
          {/* Tipo de Persona */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Persona</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setTipoPersona('NAT'); setErrores({}); }}
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
                onClick={() => { setTipoPersona('JUR'); setErrores({}); }}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tipo Documento */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo Documento</label>
              <select
                value={formData.tipo_documento}
                onChange={(e) => updateField('tipo_documento', e.target.value)}
                className={clasesInput('tipo_documento')}
                required
              >
                <option value="">Seleccionar...</option>
                <option value="CC">Cédula</option>
                <option value="NIT">NIT</option>
                <option value="CE">Cédula Extranjería</option>
                <option value="TI">Tarjeta Identidad</option>
                <option value="PP">Pasaporte</option>
              </select>
              {errores.tipo_documento && <p className="mt-1 text-xs text-red-600">{errores.tipo_documento}</p>}
            </div>

            {/* Número Documento */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Número</label>
              <input
                type="text"
                value={formData.numero_documento}
                onChange={(e) => updateField('numero_documento', e.target.value)}
                className={clasesInput('numero_documento')}
                placeholder="12345678"
                required
              />
              {errores.numero_documento && (
                <ExclamationTriangleIcon className="absolute right-3 top-9 h-5 w-5 text-red-500 pointer-events-none" />
              )}
              {errores.numero_documento && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><ExclamationTriangleIcon className="h-3 w-3" />{errores.numero_documento}</p>}
            </div>
          </div>

          {tipoPersona === 'NAT' ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Primer Nombre *</label>
                  <input
                    type="text"
                    value={formData.primer_nombre}
                    onChange={(e) => updateField('primer_nombre', e.target.value)}
                    className={clasesInput('primer_nombre')}
                    placeholder="Juan"
                    required
                  />
                  {errores.primer_nombre && <p className="mt-1 text-xs text-red-600">{errores.primer_nombre}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Segundo Nombre</label>
                  <input
                    type="text"
                    value={formData.segundo_nombre}
                    onChange={(e) => updateField('segundo_nombre', e.target.value)}
                    className={clasesInput('segundo_nombre')}
                    placeholder="Carlos"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Apellidos *</label>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => updateField('apellidos', e.target.value)}
                  className={clasesInput('apellidos')}
                  placeholder="Pérez García"
                  required
                />
                {errores.apellidos && <p className="mt-1 text-xs text-red-600">{errores.apellidos}</p>}
              </div>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Razón Social *</label>
              <input
                type="text"
                value={formData.razon_social}
                onChange={(e) => updateField('razon_social', e.target.value)}
                className={clasesInput('razon_social')}
                placeholder="Mi Empresa SAS"
                required
              />
              {errores.razon_social && <p className="mt-1 text-xs text-red-600">{errores.razon_social}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => updateField('telefono', e.target.value)}
                className={clasesInput('telefono')}
                placeholder="300 123 4567"
                required
              />
              {errores.telefono && (
                <ExclamationTriangleIcon className="absolute right-3 top-9 h-5 w-5 text-red-500 pointer-events-none" />
              )}
              {errores.telefono && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><ExclamationTriangleIcon className="h-3 w-3" />{errores.telefono}</p>}
            </div>
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Correo</label>
              <input
                type="email"
                value={formData.correo}
                onChange={(e) => updateField('correo', e.target.value)}
                className={clasesInput('correo')}
                placeholder="correo@ejemplo.com"
                required
              />
              {errores.correo && (
                <ExclamationTriangleIcon className="absolute right-3 top-9 h-5 w-5 text-red-500 pointer-events-none" />
              )}
              {errores.correo && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><ExclamationTriangleIcon className="h-3 w-3" />{errores.correo}</p>}
            </div>
          </div>

          <div>
            <CiudadSelector
              value={formData.ciudad}
              onChange={(value) => updateField('ciudad', value)}
              token={token}
              label="Ciudad"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección</label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => updateField('direccion', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Calle 123 #45-67"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => { onClose(); setErrores(); setFormData({ tipo_documento: '', numero_documento: '', primer_nombre: '', segundo_nombre: '', apellidos: '', razon_social: '', correo: '', telefono: '', direccion: '', ciudad: '' }); }}
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
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const tokenUsuario = localStorage.getItem('token_usuario');
  const usuario = localStorage.getItem('usuario');
  const subdominio = window.location.hostname.split('.')[0];

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target) &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar cliente con debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setLoading(true);
        setShowDropdown(true);

        try {
          const response = await buscarCliente({
            query: searchQuery,
            token: tokenUsuario,
            usuario,
            subdominio
          });

          // Intentar ambas estructuras de respuesta
          const clientesEncontrados = response.clientes || response || [];
          setSearchResults(clientesEncontrados);
        } catch (error) {
          console.error('Error buscando cliente:', error);
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCliente = (clienteSeleccionado) => {
    onClienteChange(clienteSeleccionado);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleClearCliente = () => {
    onClienteChange(null);
    setShowDropdown(false);
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
      const mensajeError = obtenerMensajeError(error);
      showToast('error', mensajeError);
    }
  };

  const obtenerMensajeError = (err) => {
    const msg = err.message || '';

    if (msg.includes('Ya existe un cliente con este número de documento') ||
        msg.includes('numero_documento') || msg.includes('unique')) {
      return 'Este número de documento ya está registrado';
    }

    if (msg.includes('required') || msg.includes('This field is required')) {
      return 'Completa todos los campos obligatorios';
    }

    if (msg.includes('email') || msg.includes('Enter a valid email')) {
      return 'El correo electrónico no es válido';
    }

    if (msg.includes('TOKEN') || msg.includes('token') || msg.includes('Usuario no encontrado')) {
      return 'Tu sesión ha expirado. Recarga la página';
    }

    if (msg.includes('SESSION_EXPIRED') || msg.includes('fetch') || msg.includes('Network')) {
      return 'Error de conexión. Verifica tu internet';
    }

    return msg || 'Error al crear el cliente. Intenta nuevamente.';
  };

  // Calcular posición del dropdown
  const getDropdownPosition = () => {
    if (!inputRef.current) return {};
    
    const rect = inputRef.current.getBoundingClientRect();
    return {
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      maxHeight: '240px',
    };
  };

  return (
    <>
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">Cliente</label>

        {/* Buscador */}
        <div className="relative group">
          <input
            ref={inputRef}
            type="text"
            value={cliente && !searchQuery ? cliente.nombre_completo : searchQuery || ''}
            onChange={(e) => {
              const valor = e.target.value;
              if (cliente && valor !== cliente.nombre_completo) {
                onClienteChange(null);
              }
              setSearchQuery(valor);
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

        {/* Dropdown renderizado con Portal */}
        {showDropdown && createPortal(
          <div
            ref={dropdownRef}
            className="bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-y-auto z-[9999]"
            style={getDropdownPosition()}
          >
            {(() => {
              if (loading && searchResults.length === 0) {
                return (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Buscando...</p>
                  </div>
                );
              }
              
              if (searchResults.length > 0) {
                return (
                  <div className="divide-y divide-gray-100">
                    {searchResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCliente(c)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        <p className="font-semibold text-gray-900">{c.nombre_completo}</p>
                        <p className="text-sm text-gray-500">
                          {c.tipo_documento}: {c.numero_documento}
                        </p>
                      </button>
                    ))}
                  </div>
                );
              }
              
              if (searchQuery.length >= 2) {
                return (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">No se encontraron clientes</p>
                    <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
                  </div>
                );
              }
              
              return null;
            })()}
          </div>,
          document.body
        )}

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

      {/* Modal de creación */}
      <CrearClienteModal
        show={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onCrear={handleCrearCliente}
        token={tokenUsuario}
      />
    </>
  );
}