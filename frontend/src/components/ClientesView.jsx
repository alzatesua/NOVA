// src/components/ClientesView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  MagnifyingGlassIcon,
  GiftIcon,
  UserIcon,
  TicketIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  SparklesIcon,
  TagIcon,
  ArrowPathIcon,
  PencilIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { crearCliente, editarCliente, fetchCiudades } from '../services/api';
import { showToast } from '../utils/toast';
import Select from 'react-select';

// ─────────────────────────────────────────────
// Componentes reutilizables de UI
// ─────────────────────────────────────────────

function Modal({ isOpen, onClose, title, subtitle, icon: Icon, iconColor = 'from-blue-500 to-blue-600', children, footer }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`p-2 bg-gradient-to-br ${iconColor} rounded-lg`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
              {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 ${bgColor} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
        </div>
        <div className={`p-3 bg-gradient-to-br ${color} rounded-xl shadow-sm`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="text-center py-14">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <p className="text-slate-600 dark:text-slate-300 font-medium">{title}</p>
      {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function LoadingSpinner({ color = 'blue', text = 'Cargando...' }) {
  return (
    <div className="text-center py-12">
      <div className={`inline-block animate-spin rounded-full h-9 w-9 border-4 border-${color}-600 border-t-transparent`}></div>
      <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">{text}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-secciones / Modales
// ─────────────────────────────────────────────

/** Modal: Ver cupones de un cliente específico */
function CuponesClienteModal({ cliente, onClose }) {
  const cupones = cliente?.cupones || [];

  return (
    <Modal
      isOpen={!!cliente}
      onClose={onClose}
      title={cliente?.tipo_persona === 'JUR' ? cliente?.razon_social : `${cliente?.primer_nombre || ''} ${cliente?.apellidos || ''}`}
      subtitle="Cupones asignados a este cliente"
      icon={UserIcon}
      iconColor="from-purple-500 to-purple-600"
      footer={
        <button onClick={onClose} className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-all">
          Cerrar
        </button>
      }
    >
      {cupones.length > 0 ? (
        <div className="space-y-3">
          {cupones.map((cc) => (
            <div key={cc.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <TicketIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{cc.cupon?.codigo}</p>
                    <p className="text-sm text-slate-500">{cc.cupon?.descripcion}</p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${cc.activo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                  {cc.cantidad_disponible} disponibles
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={TicketIcon} title="Sin cupones asignados" subtitle="Este cliente no tiene cupones activos" />
      )}
    </Modal>
  );
}

/** Modal: Gestión de Clientes */
function GestionClientesModal({ isOpen, onClose, clientes, loading, searchQuery, onSearchChange, onVerCupones, onNuevoCliente, onEditarCliente }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión de Clientes"
      subtitle="Busca, crea y edita clientes"
      icon={UserIcon}
      iconColor="from-purple-500 to-purple-600"
    >
      <div className="space-y-5">
        {/* Buscador y botón nuevo cliente */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nombre, cédula o RUC..."
              className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={onNuevoCliente}
            className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md flex-shrink-0"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nuevo</span>
          </button>
        </div>

        {/* Resultados */}
        {loading ? (
          <LoadingSpinner color="purple" text="Buscando clientes..." />
        ) : clientes.length > 0 ? (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Cliente</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Documento</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Tipo</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {clientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => onEditarCliente(cliente)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserIcon className="h-4 w-4 text-white" />
                        </div>
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[140px]">
                          {cliente.tipo_persona === 'JUR' ? cliente.razon_social : `${cliente.primer_nombre || ''} ${cliente.apellidos || ''}`}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{cliente.numero_documento}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${cliente.tipo_persona === 'JUR' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                        {cliente.tipo_persona === 'JUR' ? 'Jurídica' : 'Natural'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditarCliente(cliente);
                          }}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium transition-colors"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onVerCupones(cliente);
                          }}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium transition-colors"
                        >
                          <TicketIcon className="h-3.5 w-3.5" />
                          <span>Ver Cupones</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : searchQuery ? (
          <EmptyState icon={UserIcon} title="No se encontraron clientes" subtitle="Intenta con otro término de búsqueda" />
        ) : (
          <EmptyState icon={MagnifyingGlassIcon} title="Busca clientes para ver resultados" subtitle="Ingresa nombre, cédula o RUC" />
        )}
      </div>
    </Modal>
  );
}

/** Modal: Asignar Cupón */
function AsignarCuponModal({ isOpen, onClose, clientes, cupones, loading, searchQuery, onSearchChange, selectedCliente, onSelectCliente, selectedCupon, onSelectCupon, cantidad, onCantidadChange, onSubmit }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Cupón a Cliente"
      subtitle="Selecciona un cliente y un cupón"
      icon={GiftIcon}
      iconColor="from-blue-500 to-blue-600"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Buscador de cliente */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Buscar Cliente</label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nombre, cédula o RUC..."
              className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Lista de clientes */}
        {loading ? (
          <LoadingSpinner color="blue" text="Buscando clientes..." />
        ) : clientes.length > 0 ? (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
            {clientes.map((cliente) => (
              <div
                key={cliente.id}
                onClick={() => onSelectCliente(cliente.id)}
                className={`p-4 cursor-pointer transition-all border-b border-slate-100 dark:border-slate-800 last:border-b-0 ${selectedCliente === cliente.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 border-l-4 border-l-transparent'}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {cliente.tipo_persona === 'JUR' ? cliente.razon_social : `${cliente.primer_nombre || ''} ${cliente.apellidos || ''}`}
                    </p>
                    <p className="text-sm text-slate-500">{cliente.numero_documento}</p>
                  </div>
                  {selectedCliente === cliente.id && <CheckIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />}
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <EmptyState icon={UserIcon} title="No se encontraron clientes" />
        ) : null}

        {/* Seleccionar cupón */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Seleccionar Cupón</label>
          <select
            value={selectedCupon || ''}
            onChange={(e) => onSelectCupon(Number(e.target.value))}
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
          >
            <option value="">-- Selecciona un cupón --</option>
            {cupones.map((cupon) => (
              <option key={cupon.id} value={cupon.id}>
                {cupon.codigo} — {cupon.descripcion} ({cupon.tipo === 'PORCENTAJE' ? `${cupon.porcentaje_descuento}%` : `$${cupon.monto_fijo}`})
              </option>
            ))}
          </select>
        </div>

        {/* Cantidad */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Cantidad a Asignar</label>
          <input
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => onCantidadChange(Number(e.target.value))}
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
          />
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!selectedCliente || !selectedCupon}
            className="py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-700 dark:disabled:to-slate-800 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
          >
            <GiftIcon className="h-5 w-5" />
            <span>Asignar</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Componente: Selector de Ciudad con Búsqueda */
function CiudadSelector({ value, onChange, token, label = "Ciudad" }) {
  const [ciudades, setCiudades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const cargarCiudades = useCallback(async (search = '') => {
    if (search.length < 2 && search !== '') return;

    setLoading(true);
    try {
      const data = await fetchCiudades(token);
      // Manejar diferentes formatos de respuesta
      let ciudadesData = [];
      if (Array.isArray(data)) {
        ciudadesData = data;
      } else if (data && typeof data === 'object') {
        ciudadesData = data.cities || data.ciudades || data.results || [];
      }

      // Normalizar estructura de datos (manejar 'nombre' o 'name')
      const normalizadas = ciudadesData.map(c => ({
        nombre: c.nombre || c.name || c.ciudad || '',
        ...c
      })).filter(c => c.nombre); // Solo ciudades con nombre válido

      // Filtrar si hay búsqueda
      const filtradas = search
        ? normalizadas.filter(c =>
            c.nombre.toLowerCase().includes(search.toLowerCase())
          )
        : normalizadas;

      setCiudades(filtradas.slice(0, 50)); // Limitar a 50 resultados
    } catch (err) {
      console.error('Error cargando ciudades:', err);
      setCiudades([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Cargar ciudades al montar y cuando cambia el término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => cargarCiudades(inputValue), 300);
    return () => clearTimeout(timer);
  }, [inputValue, cargarCiudades]);

  const opciones = ciudades.map(c => ({
    value: c.nombre,
    label: c.nombre
  })).filter(c => c.value && c.label); // Filtrar opciones inválidas

  const valorActual = value ? { value, label: value } : null;

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{label} *</label>
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
            <div className="p-2 text-slate-400 dark:text-slate-500">
              <ChevronDownIcon className="h-5 w-5" />
            </div>
          ),
          IndicatorSeparator: () => null,
        }}
      />
    </div>
  );
}

/** Modal: Crear/Editar Cliente */
function CrearEditarClienteModal({ isOpen, onClose, onSubmit, cliente, onChange, esEdicion, token, errores = {} }) {
  // Función auxiliar para mostrar error de campo
  const mostrarError = (campo) => errores[campo];

  // Función auxiliar para clases de input con error
  const clasesInput = (campo) => {
    const tieneError = errores[campo];
    return `w-full px-4 py-3 ${tieneError ? 'pr-10' : ''} border ${tieneError ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl ${tieneError ? 'text-red-900 dark:text-red-200' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'} focus:ring-2 ${tieneError ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-transparent'} transition-all`;
  };

  // Wrapper para input con mensaje de error
  const CampoConError = ({ campo, children }) => (
    <div className="relative">
      {children}
      {errores[campo] && (
        <ExclamationTriangleIcon className="absolute right-3 top-10 h-5 w-5 text-red-500 pointer-events-none" />
      )}
      {errores[campo] && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <ExclamationTriangleIcon className="h-3 w-3" />
          {errores[campo]}
        </p>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Cliente' : 'Nuevo Cliente'}
      subtitle={esEdicion ? 'Modifica los datos del cliente' : 'Completa los datos del nuevo cliente'}
      icon={UserIcon}
      iconColor="from-indigo-500 to-indigo-600"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <style>{`
          .react-select-container {
            font-size: 0.875rem;
          }
        `}</style>
        {/* Tipo de persona */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tipo de Persona *</label>
          <select
            required
            value={cliente.tipo_persona}
            onChange={(e) => onChange({ ...cliente, tipo_persona: e.target.value })}
            className={clasesInput('tipo_persona')}
          >
            <option value="NAT">Natural</option>
            <option value="JUR">Jurídica (Empresa)</option>
          </select>
          {mostrarError('tipo_persona') && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{mostrarError('tipo_persona')}</p>}
        </div>

        {cliente.tipo_persona === 'NAT' ? (
          // Persona Natural
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Primer Nombre *</label>
              <input
                type="text"
                required={cliente.tipo_persona === 'NAT'}
                value={cliente.primer_nombre}
                onChange={(e) => onChange({ ...cliente, primer_nombre: e.target.value })}
                placeholder="Juan"
                className={clasesInput('primer_nombre')}
              />
              {mostrarError('primer_nombre') && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{mostrarError('primer_nombre')}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Segundo Nombre</label>
              <input
                type="text"
                value={cliente.segundo_nombre}
                onChange={(e) => onChange({ ...cliente, segundo_nombre: e.target.value })}
                placeholder="Carlos"
                className={clasesInput('segundo_nombre')}
              />
              {mostrarError('segundo_nombre') && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{mostrarError('segundo_nombre')}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Apellidos *</label>
              <input
                type="text"
                required={cliente.tipo_persona === 'NAT'}
                value={cliente.apellidos}
                onChange={(e) => onChange({ ...cliente, apellidos: e.target.value })}
                placeholder="Pérez García"
                className={clasesInput('apellidos')}
              />
              {mostrarError('apellidos') && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{mostrarError('apellidos')}</p>}
            </div>
          </div>
        ) : (
          // Persona Jurídica
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Razón Social *</label>
            <input
              type="text"
              required={cliente.tipo_persona === 'JUR'}
              value={cliente.razon_social}
              onChange={(e) => onChange({ ...cliente, razon_social: e.target.value })}
              placeholder="Mi Empresa S.A."
              className={clasesInput('razon_social')}
            />
            {mostrarError('razon_social') && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{mostrarError('razon_social')}</p>}
          </div>
        )}

        {/* Tipo y número de documento */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tipo Documento *</label>
            <select
              required
              value={cliente.tipo_documento}
              onChange={(e) => onChange({ ...cliente, tipo_documento: e.target.value })}
              className={clasesInput('tipo_documento')}
            >
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="NIT">NIT</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="TI">Tarjeta de Identidad</option>
              <option value="PP">Pasaporte</option>
            </select>
            {mostrarError('tipo_documento') && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{mostrarError('tipo_documento')}</p>}
          </div>
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Número Documento *</label>
            <input
              type="text"
              required
              value={cliente.numero_documento}
              onChange={(e) => onChange({ ...cliente, numero_documento: e.target.value })}
              placeholder="1234567890"
              className={clasesInput('numero_documento')}
            />
            {mostrarError('numero_documento') && (
              <ExclamationTriangleIcon className="absolute right-3 top-[2.4rem] h-5 w-5 text-red-500 pointer-events-none" />
            )}
            {mostrarError('numero_documento') && <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"><ExclamationTriangleIcon className="h-3 w-3" />{mostrarError('numero_documento')}</p>}
          </div>
        </div>

        {/* Información de contacto */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 relative">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Correo Electrónico *</label>
            <input
              type="email"
              required
              value={cliente.correo}
              onChange={(e) => onChange({ ...cliente, correo: e.target.value })}
              placeholder="cliente@ejemplo.com"
              className={clasesInput('correo')}
            />
            {mostrarError('correo') && (
              <ExclamationTriangleIcon className="absolute right-3 top-[2.4rem] h-5 w-5 text-red-500 pointer-events-none" />
            )}
            {mostrarError('correo') && <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"><ExclamationTriangleIcon className="h-3 w-3" />{mostrarError('correo')}</p>}
          </div>
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Teléfono *</label>
            <input
              type="tel"
              required
              value={cliente.telefono}
              onChange={(e) => onChange({ ...cliente, telefono: e.target.value })}
              placeholder="0991234567"
              className={clasesInput('telefono')}
            />
            {mostrarError('telefono') && (
              <ExclamationTriangleIcon className="absolute right-3 top-[2.4rem] h-5 w-5 text-red-500 pointer-events-none" />
            )}
            {mostrarError('telefono') && <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"><ExclamationTriangleIcon className="h-3 w-3" />{mostrarError('telefono')}</p>}
          </div>
          <div className="col-span-2">
            <CiudadSelector
              value={cliente.ciudad}
              onChange={(valor) => onChange({ ...cliente, ciudad: valor })}
              token={token}
              label="Ciudad"
            />
            {mostrarError('ciudad') && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{mostrarError('ciudad')}</p>}
          </div>
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Dirección</label>
          <input
            type="text"
            value={cliente.direccion}
            onChange={(e) => onChange({ ...cliente, direccion: e.target.value })}
            placeholder="Calle 123 # 45-67"
            className={clasesInput('direccion')}
          />
          {mostrarError('direccion') && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{mostrarError('direccion')}</p>}
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
          >
            {esEdicion ? (
              <>
                <PencilIcon className="h-5 w-5" />
                <span>Guardar Cambios</span>
              </>
            ) : (
              <>
                <PlusIcon className="h-5 w-5" />
                <span>Crear Cliente</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Modal: Crear Cupón */
function CrearCuponModal({ isOpen, onClose, onSubmit, cupon, onChange }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nuevo Cupón"
      subtitle="Configura un cupón de descuento"
      icon={PlusIcon}
      iconColor="from-green-500 to-green-600"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Código *</label>
            <input
              type="text"
              required
              value={cupon.codigo}
              onChange={(e) => onChange({ ...cupon, codigo: e.target.value.toUpperCase() })}
              placeholder="Ej: VERANO2024"
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tipo *</label>
            <select
              required
              value={cupon.tipo}
              onChange={(e) => onChange({ ...cupon, tipo: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            >
              <option value="PORCENTAJE">Porcentaje</option>
              <option value="MONTO_FIJO">Monto Fijo</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Descripción</label>
          <input
            type="text"
            value={cupon.descripcion}
            onChange={(e) => onChange({ ...cupon, descripcion: e.target.value })}
            placeholder="Ej: Descuento de temporada"
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {cupon.tipo === 'PORCENTAJE' ? (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Descuento (%) *</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={cupon.porcentaje_descuento}
                  onChange={(e) => onChange({ ...cupon, porcentaje_descuento: e.target.value })}
                  placeholder="Ej: 10"
                  className="w-full px-4 py-3 pr-10 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Monto Fijo ($) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={cupon.monto_fijo}
                  onChange={(e) => onChange({ ...cupon, monto_fijo: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Vencimiento</label>
            <input
              type="date"
              value={cupon.fecha_vencimiento}
              onChange={(e) => onChange({ ...cupon, fecha_vencimiento: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Cantidad Máxima de Usos (por cliente)</label>
          <input
            type="number"
            min="1"
            value={cupon.cantidad_maxima}
            onChange={(e) => onChange({ ...cupon, cantidad_maxima: e.target.value })}
            placeholder="Sin límite si está vacío"
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <input
            type="checkbox"
            id="activo"
            checked={cupon.activo}
            onChange={(e) => onChange({ ...cupon, activo: e.target.checked })}
            className="w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-2 focus:ring-green-500"
          />
          <label htmlFor="activo" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            Cupón activo (disponible para asignar)
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="py-3.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Crear Cupón</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Vista principal
// ─────────────────────────────────────────────

const CUPON_VACIO = {
  codigo: '',
  descripcion: '',
  porcentaje_descuento: '',
  monto_fijo: '',
  fecha_vencimiento: '',
  activo: true,
  cantidad_maxima: '',
  tipo: 'PORCENTAJE'
};

const CLIENTE_VACIO = {
  tipo_persona: 'NAT',
  primer_nombre: '',
  segundo_nombre: '',
  apellidos: '',
  razon_social: '',
  tipo_documento: 'CC',
  numero_documento: '',
  correo: '',
  telefono: '',
  direccion: '',
  ciudad: ''
};

export default function ClientesView() {
  const { usuario, tokenUsuario, subdominio } = useAuth();

  // Datos
  const [clientes, setClientes] = useState([]);
  const [cupones, setCupones] = useState([]);
  const [clienteCupones, setClienteCupones] = useState([]);

  // Loading
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingCupones, setLoadingCupones] = useState(false);
  const [loadingClienteCupones, setLoadingClienteCupones] = useState(false);

  // Búsqueda separada para cada modal
  const [searchAsignar, setSearchAsignar] = useState('');
  const [searchGestion, setSearchGestion] = useState('');

  // Formulario de asignar
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedCupon, setSelectedCupon] = useState(null);
  const [cantidadAsignar, setCantidadAsignar] = useState(1);

  // Nuevo cupón
  const [nuevoCupon, setNuevoCupon] = useState(CUPON_VACIO);

  // Cliente a editar
  const [clienteEditando, setClienteEditando] = useState(null);
  const [datosCliente, setDatosCliente] = useState(CLIENTE_VACIO);
  const [erroresFormulario, setErroresFormulario] = useState({});

  // Estado de modales
  const [modalGestion, setModalGestion] = useState(false);
  const [modalAsignar, setModalAsignar] = useState(false);
  const [modalCrearCupon, setModalCrearCupon] = useState(false);
  const [modalCrearEditarCliente, setModalCrearEditarCliente] = useState(false);
  const [clienteParaCupones, setClienteParaCupones] = useState(null);

  // ── API ──────────────────────────────────────

  const fetchClientes = useCallback(async (query = '') => {
    setLoadingClientes(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/facturacion/clientes/buscar/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, token: tokenUsuario, subdominio, query: query || ' ' })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch {
      setClientes([]);
    } finally {
      setLoadingClientes(false);
    }
  }, [usuario, tokenUsuario, subdominio]);

  const fetchCupones = useCallback(async () => {
    setLoadingCupones(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cupones/cupones/?activos=true&usuario=${usuario}&token=${tokenUsuario}&subdominio=${subdominio}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCupones(data.cupones || []);
    } catch {
      setCupones([]);
    } finally {
      setLoadingCupones(false);
    }
  }, [usuario, tokenUsuario, subdominio]);

  const fetchClienteCupones = useCallback(async () => {
    setLoadingClienteCupones(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cupones/cliente-cupones/?usuario=${usuario}&token=${tokenUsuario}&subdominio=${subdominio}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClienteCupones(data.cliente_cupones || []);
    } catch {
      setClienteCupones([]);
    } finally {
      setLoadingClienteCupones(false);
    }
  }, [usuario, tokenUsuario, subdominio]);

  const fetchCuponesPorCliente = async (clienteId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cupones/cliente-cupones/cliente/${clienteId}/?solo_activos=true&usuario=${usuario}&token=${tokenUsuario}&subdominio=${subdominio}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      return data.cupones || [];
    } catch {
      return [];
    }
  };

  const handleCrearCupon = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cupones/cupones/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...nuevoCupon, usuario, token: tokenUsuario, subdominio })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al crear cupón');
      }
      await fetchCupones();
      setModalCrearCupon(false);
      setNuevoCupon(CUPON_VACIO);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAsignarCupon = async (e) => {
    e.preventDefault();
    if (!selectedCliente || !selectedCupon) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cupones/cliente-cupones/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_tienda_id: selectedCliente,
          cupon_id: selectedCupon,
          cantidad_disponible: cantidadAsignar,
          activo: true,
          usuario,
          token: tokenUsuario,
          subdominio
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al asignar cupón');
      }
      await fetchClienteCupones();
      setModalAsignar(false);
      setSelectedCliente(null);
      setSelectedCupon(null);
      setCantidadAsignar(1);
      setSearchAsignar('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUsarCupon = async (clienteCuponId) => {
    if (!confirm('¿Confirmar uso de este cupón?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cupones/cliente-cupones/${clienteCuponId}/usar/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, token: tokenUsuario, subdominio })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al usar cupón');
      }
      await fetchClienteCupones();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerCuponesCliente = async (cliente) => {
    setClienteParaCupones({ ...cliente, cupones: [] });
    const cupones = await fetchCuponesPorCliente(cliente.id);
    setClienteParaCupones({ ...cliente, cupones });
  };

  const handleGuardarCliente = async (e) => {
    e.preventDefault();

    // Limpiar errores anteriores
    setErroresFormulario({});

    // Validaciones antes de enviar al backend
    const errores = validarCliente(datosCliente);
    if (Object.keys(errores).length > 0) {
      setErroresFormulario(errores);
      const primerError = Object.values(errores)[0];
      showToast('error', primerError);
      return;
    }

    try {
      if (clienteEditando) {
        // Editar cliente existente
        await editarCliente({
          clienteId: clienteEditando.id,
          token: tokenUsuario,
          usuario,
          subdominio,
          datos: datosCliente
        });
        showToast('success', 'Cliente actualizado correctamente');
      } else {
        // Crear nuevo cliente
        await crearCliente({
          token: tokenUsuario,
          usuario,
          subdominio,
          datos: datosCliente
        });
        showToast('success', 'Cliente creado correctamente');
      }

      // Refrescar lista de clientes si el modal de gestión está abierto
      if (modalGestion) {
        await fetchClientes(searchGestion);
      }

      // Cerrar modal y limpiar formulario
      setModalCrearEditarCliente(false);
      setClienteEditando(null);
      setDatosCliente(CLIENTE_VACIO);
      setErroresFormulario({});
    } catch (err) {
      // Manejo de errores más amigable
      const mensajeError = obtenerMensajeErrorAmigable(err);
      showToast('error', mensajeError);
    }
  };

  // Validar datos del cliente antes de enviar
  const validarCliente = (cliente) => {
    const errores = {};

    // Validar campos según tipo de persona
    if (cliente.tipo_persona === 'NAT') {
      if (!cliente.primer_nombre?.trim()) {
        errores.primer_nombre = 'El primer nombre es obligatorio';
      }
      if (!cliente.apellidos?.trim()) {
        errores.apellidos = 'Los apellidos son obligatorios';
      }
    } else if (cliente.tipo_persona === 'JUR') {
      if (!cliente.razon_social?.trim()) {
        errores.razon_social = 'La razón social es obligatoria';
      }
    }

    // Validar documento
    if (!cliente.tipo_documento) {
      errores.tipo_documento = 'Selecciona el tipo de documento';
    }
    if (!cliente.numero_documento?.trim()) {
      errores.numero_documento = 'El número de documento es obligatorio';
    } else if (cliente.numero_documento.length < 5) {
      errores.numero_documento = 'Debe tener al menos 5 caracteres';
    }

    // Validar email
    if (!cliente.correo?.trim()) {
      errores.correo = 'El correo es obligatorio';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cliente.correo)) {
        errores.correo = 'Email no válido. Ejemplo: cliente@ejemplo.com';
      }
    }

    // Validar teléfono
    if (!cliente.telefono?.trim()) {
      errores.telefono = 'El teléfono es obligatorio';
    } else if (cliente.telefono.length < 7) {
      errores.telefono = 'Debe tener al menos 7 dígitos';
    }

    return errores;
  };

  // Función para obtener mensajes de error amigables
  const obtenerMensajeErrorAmigable = (err) => {
    const msg = err.message || '';
    const details = err.details;

    // Error de documento duplicado
    if (msg.includes('Ya existe un cliente con este número de documento') ||
        msg.includes('numero_documento') ||
        msg.includes('unique') ||
        (details && details.numero_documento)) {
      return 'Este número de documento ya está registrado. Verifica que los datos sean correctos o usa un número diferente.';
    }

    // Error de campos requeridos
    if (msg.includes('required') || msg.includes('This field is required')) {
      return 'Por favor completa todos los campos obligatorios (marcados con *)';
    }

    // Error de email inválido
    if (msg.includes('email') || msg.includes('Enter a valid email')) {
      return 'El correo electrónico no es válido. Ejemplo: cliente@ejemplo.com';
    }

    // Error de token o autenticación
    if (msg.includes('TOKEN') || msg.includes('token') || msg.includes('Usuario no encontrado')) {
      return 'Tu sesión ha expirado. Recarga la página para continuar.';
    }

    // Error de conexión
    if (msg.includes('SESSION_EXPIRED') || msg.includes('fetch') || msg.includes('Network')) {
      return 'Error de conexión. Verifica tu internet e intenta nuevamente.';
    }

    // Error de servidor (500)
    if (msg.includes('500') || msg.includes('Internal Server Error')) {
      return 'Error del servidor. Por favor intenta en unos minutos.';
    }

    // Error genérico
    if (msg.length > 150) {
      return 'Ha ocurrido un error inesperado. Por favor intenta nuevamente.';
    }

    // Mensaje original si es corto y claro
    return msg || 'Error al guardar el cliente. Por favor intenta nuevamente.';
  };

  const handleNuevoCliente = () => {
    setClienteEditando(null);
    setDatosCliente(CLIENTE_VACIO);
    setErroresFormulario({});
    setModalCrearEditarCliente(true);
  };

  const handleEditarCliente = (cliente) => {
    setClienteEditando(cliente);
    setDatosCliente({
      tipo_persona: cliente.tipo_persona || 'NAT',
      primer_nombre: cliente.primer_nombre || '',
      segundo_nombre: cliente.segundo_nombre || '',
      apellidos: cliente.apellidos || '',
      razon_social: cliente.razon_social || '',
      tipo_documento: cliente.tipo_documento || 'CC',
      numero_documento: cliente.numero_documento || '',
      correo: cliente.correo || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || ''
    });
    setErroresFormulario({});
    setModalCrearEditarCliente(true);
  };

  const closeModalCrearEditarCliente = () => {
    setModalCrearEditarCliente(false);
    setClienteEditando(null);
    setDatosCliente(CLIENTE_VACIO);
  };

  // ── Effects ──────────────────────────────────

  useEffect(() => {
    fetchCupones();
    fetchClienteCupones();
  }, []);

  // Debounce búsqueda modal asignar
  useEffect(() => {
    if (!modalAsignar) return;
    const id = setTimeout(() => fetchClientes(searchAsignar), 500);
    return () => clearTimeout(id);
  }, [searchAsignar, modalAsignar]);

  // Debounce búsqueda modal gestion
  useEffect(() => {
    if (!modalGestion) return;
    const id = setTimeout(() => fetchClientes(searchGestion), 500);
    return () => clearTimeout(id);
  }, [searchGestion, modalGestion]);

  // Limpiar búsquedas al cerrar modales
  const closeModalAsignar = () => {
    setModalAsignar(false);
    setSearchAsignar('');
    setClientes([]);
    setSelectedCliente(null);
    setSelectedCupon(null);
    setCantidadAsignar(1);
  };

  const closeModalGestion = () => {
    setModalGestion(false);
    setSearchGestion('');
    setClientes([]);
  };

  // ── Render ───────────────────────────────────

  const stats = [
    { title: 'Total Cupones', value: cupones.length, icon: TicketIcon, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Asignaciones Activas', value: clienteCupones.filter(cc => cc.activo).length, icon: GiftIcon, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
    { title: 'Total Asignaciones', value: clienteCupones.length, icon: UserIcon, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20' }
  ];

  return (
    <div className="w-full space-y-6">

      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
          <SparklesIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gestión de Clientes</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Administra cupones y clientes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Acciones principales */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleNuevoCliente}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm hover:shadow-md hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Nuevo Cliente</span>
        </button>
        <button
          onClick={() => setModalGestion(true)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-purple-300 transition-all duration-200"
        >
          <UserIcon className="h-4 w-4" />
          <span>Gestión Clientes</span>
        </button>

        <button
          onClick={() => setModalAsignar(true)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-blue-300 transition-all duration-200"
        >
          <GiftIcon className="h-4 w-4" />
          <span>Asignar Cupón</span>
        </button>

        <button
          onClick={() => setModalCrearCupon(true)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm hover:shadow-md hover:from-green-600 hover:to-green-700 transition-all duration-200"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Crear Cupón</span>
        </button>
      </div>

      {/* Tabla de asignaciones */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
              <GiftIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Cupones Asignados</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Gestiona las asignaciones activas</p>
            </div>
          </div>
          <button
            onClick={fetchClienteCupones}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span>Actualizar</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          {loadingClienteCupones ? (
            <LoadingSpinner color="blue" text="Cargando asignaciones..." />
          ) : clienteCupones.length === 0 ? (
            <EmptyState icon={TicketIcon} title="No hay cupones asignados" subtitle="Comienza asignando cupones a tus clientes" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Cliente</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Cupón</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Disponibles</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Estado</th>
                  <th className="px-6 py-4 text-right font-semibold text-slate-700 dark:text-slate-300">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {clienteCupones.map((cc) => (
                  <tr key={cc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserIcon className="h-5 w-5 text-white" />
                        </div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {cc.cliente_tienda?.email || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <TagIcon className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-slate-900 dark:text-slate-100">{cc.cupon?.codigo || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {cc.cantidad_disponible}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cc.activo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                        {cc.activo ? <CheckIcon className="h-3 w-3" /> : <XMarkIcon className="h-3 w-3" />}
                        <span>{cc.activo ? 'Activo' : 'Inactivo'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {cc.activo && cc.cantidad_disponible > 0 && (
                        <button
                          onClick={() => handleUsarCupon(cc.id)}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl text-xs font-medium transition-all shadow-sm hover:shadow-md"
                        >
                          <SparklesIcon className="h-4 w-4" />
                          <span>Usar Cupón</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modales ── */}

      <GestionClientesModal
        isOpen={modalGestion}
        onClose={closeModalGestion}
        clientes={clientes}
        loading={loadingClientes}
        searchQuery={searchGestion}
        onSearchChange={setSearchGestion}
        onVerCupones={handleVerCuponesCliente}
        onNuevoCliente={handleNuevoCliente}
        onEditarCliente={handleEditarCliente}
      />

      <AsignarCuponModal
        isOpen={modalAsignar}
        onClose={closeModalAsignar}
        clientes={clientes}
        cupones={cupones}
        loading={loadingClientes}
        searchQuery={searchAsignar}
        onSearchChange={setSearchAsignar}
        selectedCliente={selectedCliente}
        onSelectCliente={setSelectedCliente}
        selectedCupon={selectedCupon}
        onSelectCupon={setSelectedCupon}
        cantidad={cantidadAsignar}
        onCantidadChange={setCantidadAsignar}
        onSubmit={handleAsignarCupon}
      />

      <CrearCuponModal
        isOpen={modalCrearCupon}
        onClose={() => { setModalCrearCupon(false); setNuevoCupon(CUPON_VACIO); }}
        onSubmit={handleCrearCupon}
        cupon={nuevoCupon}
        onChange={setNuevoCupon}
      />

      <CuponesClienteModal
        cliente={clienteParaCupones}
        onClose={() => setClienteParaCupones(null)}
      />

      <CrearEditarClienteModal
        isOpen={modalCrearEditarCliente}
        onClose={closeModalCrearEditarCliente}
        onSubmit={handleGuardarCliente}
        cliente={datosCliente}
        onChange={setDatosCliente}
        esEdicion={!!clienteEditando}
        token={tokenUsuario}
        errores={erroresFormulario}
      />
    </div>
  );
}