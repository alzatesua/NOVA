import React, { useState, useEffect } from 'react';
import UsersTable from './UsersTable';
import {
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  UserIcon
} from '@heroicons/react/24/solid';
import { fetchSucursales, actualizarfila, createUsuario, fetchBodegas } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../utils/toast';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import Select from 'react-select';

// Componente Modal reutilizable (como en ClientesView)
function Modal({ isOpen, onClose, title, subtitle, icon: Icon, iconColor = 'from-[rgb(37,99,235)] to-[rgb(29,78,216)]', children, footer }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Estilos para animaciones de destellos */}
      <style>{`
        @keyframes sparkle1 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(10px, -10px); }
        }
        @keyframes sparkle2 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(-15px, 5px); }
        }
        @keyframes sparkle3 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(8px, 12px); }
        }
        @keyframes sparkle4 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(-12px, -8px); }
        }
        @keyframes sparkle5 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.2) translate(12px, -8px); }
        }
        @keyframes sparkle6 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.2) translate(-10px, 10px); }
        }
        @keyframes sparkle7 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.5) translate(15px, -15px); }
        }
        @keyframes sparkle8 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.5) translate(-18px, 12px); }
        }
        .animate-sparkle1 { animation: sparkle1 3s ease-in-out infinite; }
        .animate-sparkle2 { animation: sparkle2 4s ease-in-out infinite 0.5s; }
        .animate-sparkle3 { animation: sparkle3 3.5s ease-in-out infinite 1s; }
        .animate-sparkle4 { animation: sparkle4 4.5s ease-in-out infinite 1.5s; }
        .animate-sparkle5 { animation: sparkle5 2.8s ease-in-out infinite 0.3s; }
        .animate-sparkle6 { animation: sparkle6 3.1s ease-in-out infinite 0.7s; }
        .animate-sparkle7 { animation: sparkle7 3.5s ease-in-out infinite 0.2s; }
        .animate-sparkle8 { animation: sparkle8 3.2s ease-in-out infinite 1.3s; }
      `}</style>

      <div className="fixed inset-0 z-50 overflow-y-auto" style={{ paddingTop: '60px' }}>
        <div className="flex items-start justify-center min-h-screen px-2 sm:px-4 py-4">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={onClose}
            style={{ paddingTop: '60px' }}
          />

          {/* Modal Content */}
          <div
            className="relative rounded-2xl shadow-2xl w-full max-w-4xl mx-auto my-4 overflow-hidden"
            style={{
              maxHeight: 'calc(100vh - 100px)',
              backgroundColor: '#0B0D26',
              border: '1px solid',
              borderColor: '#1a1d3d'
            }}
          >
            {/* Destellos animados en el modal */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {/* Pequeños destellos - 1px */}
              <div className="absolute top-[10%] left-[5%] w-1 h-1 rounded-full animate-sparkle1" style={{ backgroundColor: '#93c5fd' }}></div>
              <div className="absolute top-[20%] left-[15%] w-1 h-1 rounded-full animate-sparkle2" style={{ backgroundColor: '#67e8f9' }}></div>
              <div className="absolute top-[30%] right-[10%] w-1 h-1 rounded-full animate-sparkle3" style={{ backgroundColor: '#c4b5fd' }}></div>
              <div className="absolute top-[40%] right-[20%] w-1 h-1 rounded-full animate-sparkle4" style={{ backgroundColor: '#bfdbfe' }}></div>
              <div className="absolute top-[60%] left-[8%] w-1 h-1 rounded-full animate-sparkle1" style={{ backgroundColor: '#a5f3fc' }}></div>
              <div className="absolute top-[70%] right-[15%] w-1 h-1 rounded-full animate-sparkle2" style={{ backgroundColor: '#ddd6fe' }}></div>
              <div className="absolute top-[80%] left-[12%] w-1 h-1 rounded-full animate-sparkle3" style={{ backgroundColor: '#93c5fd' }}></div>
              <div className="absolute top-[90%] right-[8%] w-1 h-1 rounded-full animate-sparkle4" style={{ backgroundColor: '#67e8f9' }}></div>

              {/* Destellos medios - 2px */}
              <div className="absolute top-[25%] left-[30%] w-2 h-2 rounded-full animate-sparkle5" style={{ backgroundColor: '#60a5fa' }}></div>
              <div className="absolute top-[50%] right-[25%] w-2 h-2 rounded-full animate-sparkle6" style={{ backgroundColor: '#22d3ee' }}></div>
              <div className="absolute top-[75%] left-[35%] w-2 h-2 rounded-full animate-sparkle1" style={{ backgroundColor: '#a78bfa' }}></div>

              {/* Destellos grandes - 3px */}
              <div className="absolute top-[35%] left-[50%] w-3 h-3 rounded-full animate-sparkle7" style={{ backgroundColor: '#60a5fa' }}></div>
              <div className="absolute top-[65%] right-[45%] w-3 h-3 rounded-full animate-sparkle8" style={{ backgroundColor: '#22d3ee' }}></div>
            </div>

            {/* Header */}
            <div
              className="sticky top-0 p-3 sm:p-4 md:p-6 z-10"
              style={{
                backgroundColor: '#0B0D26',
                borderBottom: '1px solid',
                borderColor: '#1a1d3d'
              }}
            >
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 bg-gradient-to-br ${iconColor} rounded-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg md:text-2xl font-bold" style={{ color: '#ffffff' }}>{title}</h2>
                    {subtitle && <p className="text-sm" style={{ color: '#cbd5e1' }}>{subtitle}</p>}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  style={{ color: '#94a3b8' }}
                  className="hover:opacity-70 transition-colors flex-shrink-0"
                >
                  <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-3 sm:p-4 md:p-6 overflow-y-auto relative z-10" style={{ maxHeight: 'calc(70vh - 60px)' }}>
              <div style={{ color: '#f1f5f9' }}>
                {children}
              </div>
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-3 sm:p-4 md:p-6 relative z-10" style={{ borderTop: '1px solid', borderColor: '#1a1d3d', backgroundColor: '#0B0D26' }}>
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function UsersView({ users: initialUsers, onCreated }) {
  const [users, setUsers] = useState(initialUsers);
  const [viewMode, setViewMode] = useState('card');
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [editStates, setEditStates] = useState({});
  const [loading, setLoading] = useState(false);

  const [sucursales, setSucursales] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Estados para el modal de detalles
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const { rol, usuario, tokenUsuario, subdominio, logout } = useAuth();

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState('todos');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filtrar usuarios según búsqueda y filtro rápido
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.usuario.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      quickFilter === 'todos' ||
      (quickFilter === 'activo' && user.is_active) ||
      (quickFilter === 'inactivo' && !user.is_active);
    return matchesSearch && matchesFilter;
  });

  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (hasLoaded) return;
    if (rol !== 'admin') return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { datos } = await fetchSucursales({ usuario, tokenUsuario, subdominio });
        setSucursales(datos || []);
        setHasLoaded(true);
      } catch (err) {
        if (err.isNotFound) logout();
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [rol, usuario, tokenUsuario, subdominio, logout, hasLoaded]);


  const toggleDetails = (userId) => {
    setExpandedUserId(prev => (prev === userId ? null : userId));
    setEditStates(prev => ({
      ...prev,
      [userId]: {
        editing: false,
        fields: users.find(u => u.id_login_usuario === userId) || {}
      }
    }));
  };

  const openModal = (userId) => {
    const user = users.find(u => u.id_login_usuario === userId);
    if (user) {
      setSelectedUser(user);
      setModalDetallesOpen(true);
    }
  };

  const closeModalDetalles = () => {
    setModalDetallesOpen(false);
    setSelectedUser(null);
  };

  const toggleEdit = (userId) => {
    setEditStates(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        editing: !prev[userId]?.editing
      }
    }));
  };

  const handleFieldChange = (userId, field, value) => {
    setEditStates(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        fields: {
          ...prev[userId].fields,
          [field]: value
        }
      }
    }));
  };

  const handleSave = async (userId) => {
  let updated = editStates[userId].fields;

  // Asegurar que ciertos campos numéricos estén como número
  if (updated.id_sucursal_default !== undefined) {
    updated.id_sucursal_default = Number(updated.id_sucursal_default);
  }
  // Agrega otras conversiones si es necesario

  const token   = localStorage.getItem('token_usuario');
  const usuarioLog = localStorage.getItem('usuario');
  const subdominioLocal = window.location.hostname.split('.')[0];

  setIsLoading(true);
  try {
    await actualizarfila({
      rol,
      token,
      usuario: usuarioLog,
      tokenUsuario,
      subdominio: subdominioLocal,
      tabla: "login_usuario",
      columna_filtro: "id_login_usuario",
      valor_filtro: userId,
      datos: updated,
    });
    showToast('success', 'Usuario actualizado correctamente');
    toggleEdit(userId);
  } catch (err) {
    console.error('Error al guardar:', err);
    if (err.isNotFound) logout();
    showToast('error', err.message || 'Ocurrió un error al guardar');
  } finally {
    setIsLoading(false);
  }
};


  const handleToggleActive = async (u) => {
    const newActive = !u.is_active;

    if (u.rol === 'admin' && u.is_active) {
      const { isConfirmed } = await Swal.fire({
        title: '¿Estás seguro?',
        text: `Vas a inactivar al administrador "${u.usuario}".`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, desactivar',
        cancelButtonText: 'Cancelar',
        customClass: {
          popup: 'rounded-xl',
          title: 'text-lg font-semibold',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md',
          cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md'
        },
        buttonsStyling: false
      });

      if (!isConfirmed) return;
    }

    setTogglingId(u.id_login_usuario);
    setIsLoading(true);

    setUsers(prev =>
      prev.map(user =>
        user.id_login_usuario === u.id_login_usuario
          ? { ...user, is_active: newActive }
          : user
      )
    );

    try {
      const token      = localStorage.getItem('token_usuario');
      const usuarioLog = localStorage.getItem('usuario');
      const subdominioLocal = window.location.hostname.split('.')[0];

      await actualizarfila({
        rol,
        token,
        usuario: usuarioLog,
        tokenUsuario,
        subdominio: subdominioLocal,
        tabla: "login_usuario",
        columna_filtro: "id_login_usuario",
        valor_filtro: u.id_login_usuario,
        datos: { is_active: newActive }
      });


     

      showToast('success', `Usuario ${newActive ? 'activado' : 'inactivado'} correctamente`);
    } catch (err) {
      console.error('Error al actualizar estado:', err);

      setUsers(prev =>
        prev.map(user =>
          user.id_login_usuario === u.id_login_usuario
            ? { ...user, is_active: u.is_active }
            : user
        )
      );

      if (err.isNotFound) logout();
      showToast('error', err.message || 'Ocurrió un error al actualizar');
    } finally {
      setIsLoading(false);
      setTogglingId(null);
    }
  };

  const availableRoles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'almacen', label: 'Encargado de Almacén'},
    { value: 'vendedor', label: 'Vendedor'},
    { value: 'operario', label: 'Operario'},
  ];

  const [newUser, setNewUser] = useState({
    usuario: '',
    correo_usuario: '',
    password: '',
    rol: '',
    sucursal_id: '',
    bodegas_ids: []
  });

  const toggleCreateForm = () => setShowCreateForm(v => !v);
  const handleNewFieldChange = e => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  // Cargar bodegas cuando cambia la sucursal seleccionada
  useEffect(() => {
    if (newUser.sucursal_id && (newUser.rol === 'vendedor' || newUser.rol === 'operario')) {
      const loadBodegas = async () => {
        try {
          const response = await fetchBodegas({ rol, tokenUsuario, usuario, subdominio });
          const todasBodegas = response?.datos || [];
          // Filtrar por sucursal seleccionada
          const bodegasFiltradas = todasBodegas.filter(
            b => b.sucursal_id === Number(newUser.sucursal_id) || b.id_sucursal === Number(newUser.sucursal_id)
          );
          setBodegas(bodegasFiltradas);
        } catch (error) {
          console.error('Error cargando bodegas:', error);
        }
      };
      loadBodegas();
    } else {
      setBodegas([]);
    }
  }, [newUser.sucursal_id, newUser.rol]);

  const handleSubmitNewUser = async e => {
    e.preventDefault();
    setLoading(true);

    const usuarioNuevo = e.target.usuario.value;
    const correo = e.target.correo_usuario.value;
    const password = e.target.password.value;
    const rolNuevo = e.target.rol.value;
    const sucursalId = e.target.sucursal_id.value;



    try {
      await createUsuario({
        usuario: localStorage.getItem('usuario'),
        token: localStorage.getItem('token_usuario'),
        subdominio: window.location.hostname.split('.')[0],
        operario: { usuario: usuarioNuevo, correo_usuario: correo, password, rol: rolNuevo },
        sucursal_id: sucursalId,
        bodegas_ids: newUser.bodegas_ids || []
      });

      showToast('success');
      e.target.reset();
      onCreated();
      setNewUser({ usuario: '', correo_usuario: '', password: '', rol: '', sucursal_id: '', bodegas_ids: [] });
      setBodegas([]);
      setShowCreateForm(false);
    } catch (err) {
      console.log("error", err);
      showToast('error', err.details?.error || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .modal-custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .modal-custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.1);
          border-radius: 4px;
        }
        .modal-custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.5);
          border-radius: 4px;
        }
        .modal-custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.7);
        }
        .dark .modal-custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
        }
        .dark .modal-custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
        }
        .dark .modal-custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.7);
        }
      `}</style>
      <section className="space-y-6 w-full px-6 py-4">
      {/* Cabecera con título, búsqueda y filtros */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 w-full">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Gestión de Usuarios</h3>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full lg:w-80 px-4 py-2 rounded-full border border-slate-300 dark:!border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:!bg-slate-800 dark:!text-slate-100 dark:!placeholder-slate-400 transition-colors"
          />

          <div className="flex gap-2 whitespace-nowrap">
            {['Todos', 'Activo', 'Inactivo'].map(label => (
              <button
                key={label}
                onClick={() => setQuickFilter(label.toLowerCase())}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                  quickFilter === label.toLowerCase()
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-slate-200 dark:!bg-slate-800 text-slate-700 dark:!text-slate-300 hover:bg-slate-300 dark:hover:!bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={toggleCreateForm}
            className="flex items-center bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:opacity-90 transition-opacity text-sm font-medium"
          >
            {showCreateForm ? 'Cancelar' : 'Nuevo Usuario'}
          </button>
        </div>
      </div>

      {/* Formulario creación */}
      {showCreateForm && (
        <form
          onSubmit={handleSubmitNewUser}
          className="bg-white dark:!bg-slate-900 p-6 rounded-lg shadow-md border border-slate-200 dark:!border-slate-800 space-y-4 mb-6 transition-colors w-full"
        >
          <h4 className="text-lg font-medium text-slate-900 dark:!text-slate-100">Crear Nuevo Usuario</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <input
              name="usuario"
              placeholder="Usuario"
              value={newUser.usuario}
              onChange={handleNewFieldChange}
              required
              className="border dark:!border-slate-700 rounded px-2 py-1 text-sm dark:!bg-slate-800 dark:!text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <input
              name="correo_usuario"
              type="email"
              placeholder="Correo Usuario"
              value={newUser.correo_usuario}
              onChange={handleNewFieldChange}
              required
              className="border dark:!border-slate-700 rounded px-2 py-1 text-sm dark:!bg-slate-800 dark:!text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={handleNewFieldChange}
              required
              className="border dark:!border-slate-700 rounded px-2 py-1 text-sm dark:!bg-slate-800 dark:!text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <select
              name="sucursal_id"
              value={newUser.sucursal_id}
              onChange={handleNewFieldChange}
              className="border dark:!border-slate-700 rounded px-2 py-1 text-sm dark:!bg-slate-800 dark:!text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              required
            >
              <option value="">Seleccione una sucursal</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
            <select
              name="rol"
              value={newUser.rol}
              onChange={handleNewFieldChange}
              required
              className="border dark:!border-slate-700 rounded px-2 py-1 text-sm dark:!bg-slate-800 dark:!text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="" disabled>-- Selecciona un rol --</option>
              {availableRoles.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Selector de bodegas (solo para vendedor y operario) */}
          {(newUser.rol === 'vendedor' || newUser.rol === 'operario') && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-2">
                Selecciona las bodegas asignadas
              </label>
              <Select
                isMulti
                options={bodegas.map(b => ({ value: b.id, label: b.nombre }))}
                value={bodegas.filter(b => newUser.bodegas_ids?.includes(b.id)).map(b => ({ value: b.id, label: b.nombre }))}
                onChange={(selected) => {
                  setNewUser(prev => ({
                    ...prev,
                    bodegas_ids: selected.map(s => s.value)
                  }));
                }}
                placeholder="Selecciona una o más bodegas..."
                className="text-sm"
                classNamePrefix="select"
                noOptionsMessage={() => newUser.sucursal_id ? "No hay bodegas disponibles para esta sucursal" : "Selecciona una sucursal primero"}
              />
              <p className="text-xs text-slate-500 dark:!text-slate-400 mt-1">
                {newUser.bodegas_ids?.length || 0} bodegas seleccionadas
              </p>
            </div>
          )}
          <div className="text-right">
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 dark:bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-700 dark:hover:bg-emerald-600 text-sm transition-colors"
            >
              Crear Usuario
            </button>
          </div>
        </form>
      )}

      {/* Vista tarjetas o tabla */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
          {filteredUsers.length === 0 && !loading && (
            <p className="col-span-full text-center text-slate-500 dark:!text-slate-400 py-8">No se encontraron usuarios.</p>
          )}

          {filteredUsers.map(u => {
            const isExpanded = expandedUserId === u.id_login_usuario;
            const isEditing = editStates[u.id_login_usuario]?.editing;
            const fields = editStates[u.id_login_usuario]?.fields || u;

            return (
              <div
                key={u.id_login_usuario}
                className="bg-white dark:!bg-slate-900 rounded-2xl shadow-md p-6 border border-slate-200 dark:!border-slate-700 flex flex-col break-words hover:shadow-xl hover:shadow-blue-500/20 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out group w-full min-h-[280px]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h5
                    className="text-xl font-semibold text-slate-900 dark:!text-slate-100 truncate max-w-[70%] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300"
                    title={u.usuario}
                  >
                    {u.usuario}
                  </h5>

                  <button
                    onClick={() => handleToggleActive(u)}
                    disabled={togglingId === u.id_login_usuario}
                    className="focus:outline-none transform active:scale-95 transition-transform duration-100"
                    title={u.is_active ? 'Activo' : 'Inactivo'}
                  >
                    <span
                      className={`inline-flex items-center text-sm font-medium px-2.5 py-0.5 rounded-full
                        transition-all duration-300 group-hover:scale-110 ${
                          u.is_active
                            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/70'
                            : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 group-hover:bg-red-200 dark:group-hover:bg-red-800/70'
                        }`}
                    >
                      {togglingId === u.id_login_usuario ? (
                        <svg
                          className="w-4 h-4 mr-1 animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                      ) : u.is_active ? (
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                      ) : (
                        <XCircleIcon className="w-4 h-4 mr-1" />
                      )}
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </button>
                </div>

                <dl className="space-y-2 text-sm text-slate-700 dark:!text-slate-300 group/dl">
                  <div className="flex justify-between group-hover/dl:translate-x-1 transition-transform duration-300">
                    <dt className="font-medium text-slate-500 dark:!text-slate-400">Correo</dt>
                    <dd
                      className="truncate max-w-[60%]"
                      title={u.correo_usuario}
                    >
                      {u.correo_usuario}
                    </dd>
                  </div>
                  <div className="flex justify-between group-hover/dl:translate-x-1 transition-transform duration-300">
                    <dt className="font-medium text-slate-500 dark:!text-slate-400">Sucursal</dt>
                    <dd
                      className="truncate max-w-[60%]"
                      title={sucursales.find(s => s.id === u.id_sucursal_default)?.nombre || '—'}
                    >
                      {sucursales.find(s => s.id === u.id_sucursal_default)?.nombre || '—'}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 text-right">
                  <button
                    onClick={() => openModal(u.id_login_usuario)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center transition-all duration-300 hover:scale-105 group-hover:translate-x-1"
                  >
                    <>Más detalles <ChevronDownIcon className="w-4 h-4 ml-1" /></>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <UsersTable users={users} />
      )}

      {/* Modal de detalles del usuario */}
      {modalDetallesOpen && selectedUser && (
        <Modal
          isOpen={modalDetallesOpen}
          onClose={closeModalDetalles}
          title="Detalles del Usuario"
          subtitle={selectedUser.usuario}
          icon={UserIcon}
          iconColor="from-blue-500 to-indigo-600"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModalDetalles}
                className="px-6 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg hover:opacity-90 transition-all font-medium shadow-md border border-slate-500"
              >
                Cerrar
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Usuario</label>
              <div className="text-white border border-slate-700 bg-slate-900/50 px-4 py-3 rounded-lg">
                {selectedUser.usuario}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Rol</label>
              <div className="text-white border border-slate-700 bg-slate-900/50 px-4 py-3 rounded-lg">
                {availableRoles.find(r => r.value === selectedUser.rol)?.label || selectedUser.rol}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Correo</label>
              <div className="text-white border border-slate-700 bg-slate-900/50 px-4 py-3 rounded-lg break-all">
                {selectedUser.correo_usuario}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Sucursal</label>
              <div className="text-white border border-slate-700 bg-slate-900/50 px-4 py-3 rounded-lg">
                {sucursales.find(s => s.id === selectedUser.id_sucursal_default)?.nombre || '—'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Estado</label>
              <div className="flex items-center gap-2 px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-lg">
                <span className={`inline-flex items-center text-sm font-medium px-3 py-1 rounded-full ${
                  selectedUser.is_active
                    ? 'bg-emerald-600 text-white'
                    : 'bg-red-600 text-white'
                }`}>
                  {selectedUser.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Fecha de creación</label>
              <div className="text-white border border-slate-700 bg-slate-900/50 px-4 py-3 rounded-lg">
                {selectedUser.creado_en || 'N/A'}
              </div>
            </div>
          </div>
        </Modal>
      )}

    </section>
    </>
  );
}
