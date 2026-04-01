import React, { useState, useEffect } from 'react';
import UsersTable from './UsersTable';
import {
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/solid';
import { fetchSucursales, actualizarfila, createUsuario, fetchBodegas } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../utils/toast';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import Select from 'react-select';

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
    <section className="space-y-6 w-full px-6 py-4">
      {/* Cabecera con búsqueda y filtros */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6 max-w-7xl mx-auto">
        <input
          type="text"
          placeholder="Buscar usuarios..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full lg:w-80 px-4 py-2 rounded-full border border-slate-300 dark:!border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:!bg-slate-800 dark:!text-slate-100 dark:!placeholder-slate-400 transition-colors"
        />

        <div className="flex flex-wrap items-center gap-3">
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
          className="bg-white dark:!bg-slate-900 p-6 rounded-lg shadow-md border border-slate-200 dark:!border-slate-800 space-y-4 mb-6 transition-colors max-w-7xl mx-auto"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto">
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
                    onClick={() => toggleDetails(u.id_login_usuario)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center transition-all duration-300 hover:scale-105 group-hover:translate-x-1"
                  >
                    {isExpanded ? (
                      <>Ocultar <ChevronUpIcon className="w-4 h-4 ml-1" /></>
                    ) : (
                      <>Más detalles <ChevronDownIcon className="w-4 h-4 ml-1" /></>
                    )}
                  </button>

                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:!border-slate-800 space-y-2 text-sm text-slate-700 dark:!text-slate-300">
                    <div>
                      <span className="font-medium text-slate-500 dark:!text-slate-400">Rol:</span>{' '}
                      {isEditing ? (
                        <select
                          className="border dark:!border-slate-700 rounded px-2 py-1 text-sm dark:!bg-slate-800 dark:!text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                          value={fields.rol}
                          onChange={e => handleFieldChange(u.id_login_usuario, 'rol', e.target.value)}
                        >
                          <option value="" disabled>-- Selecciona un rol --</option>
                          {availableRoles.map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                      ) : (
                        availableRoles.find(r => r.value === fields.rol)?.label || fields.rol
                      )}
                    </div>

                    <div>
                      <span className="font-medium text-slate-500 dark:!text-slate-400">Usuario:</span>{' '}
                      {isEditing ? (
                        <input
                          className="border dark:!border-slate-700 rounded px-2 py-1 text-sm dark:!bg-slate-800 dark:!text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                          value={fields.usuario}
                          onChange={e => handleFieldChange(u.id_login_usuario, 'usuario', e.target.value)}
                        />
                      ) : (
                        fields.usuario
                      )}
                    </div>

                    <div>
                      <span className="font-medium text-slate-500 dark:!text-slate-400">Sucursal:</span>{' '}
                      {isEditing ? (
                        <select
                          className="border dark:!border-slate-700 rounded px-2 py-1 text-sm dark:!bg-slate-800 dark:!text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                          value={fields.id_sucursal_default}
                          onChange={e => handleFieldChange(u.id_login_usuario, 'id_sucursal_default', e.target.value)}
                        >
                          <option value="">Seleccione una sucursal</option>
                          {sucursales.map(s => (
                            <option key={s.id} value={s.id}>{s.nombre}</option>
                          ))}
                        </select>
                      ) : (
                        sucursales.find(s => s.id === fields.id_sucursal_default)?.nombre || '—'
                      )}
                    </div>

                    <div>
                      <span className="font-medium text-slate-500 dark:!text-slate-400">Fecha de creación:</span> {fields.creado_en}
                    </div>

                    {u.foto_perfil && (
                      <div>
                        <img
                          src={u.foto_perfil}
                          alt="Foto de perfil"
                          className="w-20 h-20 rounded-full object-cover border border-slate-200 dark:!border-slate-700"
                        />
                      </div>
                    )}

                    <div className="flex gap-3 pt-3">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSave(u.id_login_usuario)}
                            className="bg-emerald-600 dark:bg-emerald-500 text-white text-sm px-3 py-1 rounded hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => toggleEdit(u.id_login_usuario)}
                            className="bg-slate-300 dark:bg-slate-700 text-slate-800 dark:!text-slate-200 text-sm px-3 py-1 rounded hover:bg-slate-400 dark:hover:bg-slate-600 transition-colors"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => toggleEdit(u.id_login_usuario)}
                          className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm transition-colors"
                        >
                          <PencilSquareIcon className="w-5 h-5 mr-1" />
                          Editar
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`px-3 py-1 rounded text-sm font-medium text-white transition-colors
                          ${u.is_active ? 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700' : 'bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700'}`}
                      >
                        {u.is_active ? 'Inactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <UsersTable users={users} />
      )}
    </section>
  );
}
