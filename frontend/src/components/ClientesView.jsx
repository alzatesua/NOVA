// src/components/ClientesView.jsx
import React, { useState, useEffect } from 'react';
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
  TagIcon
} from '@heroicons/react/24/outline';

export default function ClientesView() {
  const { usuario, tokenUsuario, subdominio } = useAuth();

  // Estados para clientes
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientesSearchQuery, setClientesSearchQuery] = useState('');

  // Estados para cupones
  const [cupones, setCupones] = useState([]);
  const [loadingCupones, setLoadingCupones] = useState(false);

  // Estados para cliente-cupones (asignaciones)
  const [clienteCupones, setClienteCupones] = useState([]);
  const [loadingClienteCupones, setLoadingClienteCupones] = useState(false);

  // Estados para formulario de asignar cupón
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedCupon, setSelectedCupon] = useState(null);
  const [cantidadAsignar, setCantidadAsignar] = useState(1);

  // Estados para modales
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [showCuponesModal, setShowCuponesModal] = useState(false);
  const [clienteForCupones, setClienteForCupones] = useState(null);
  const [showClientesModal, setShowClientesModal] = useState(false);

  // Estados para crear cupón
  const [showCrearCuponModal, setShowCrearCuponModal] = useState(false);
  const [nuevoCupon, setNuevoCupon] = useState({
    codigo: '',
    descripcion: '',
    porcentaje_descuento: '',
    monto_fijo: '',
    fecha_vencimiento: '',
    activo: true,
    cantidad_maxima: '',
    tipo: 'PORCENTAJE'
  });

  // API: Obtener clientes (búsqueda)
  const fetchClientes = async (query = '') => {
    setLoadingClientes(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/facturacion/clientes/buscar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario,
          token: tokenUsuario,
          subdominio,
          query: query || ' '
        })
      });

      if (!response.ok) {
        throw new Error('Error al obtener clientes');
      }

      const data = await response.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching clientes:', error);
      setClientes([]);
    } finally {
      setLoadingClientes(false);
    }
  };

  // API: Obtener cupones
  const fetchCupones = async () => {
    setLoadingCupones(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cupones/cupones/?activos=true&usuario=${usuario}&token=${tokenUsuario}&subdominio=${subdominio}`);

      if (!response.ok) {
        throw new Error('Error al obtener cupones');
      }

      const data = await response.json();
      setCupones(data.cupones || []);
    } catch (error) {
      console.error('Error fetching cupones:', error);
      setCupones([]);
    } finally {
      setLoadingCupones(false);
    }
  };

  // API: Obtener cliente-cupones (asignaciones)
  const fetchClienteCupones = async () => {
    setLoadingClienteCupones(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cupones/cliente-cupones/?usuario=${usuario}&token=${tokenUsuario}&subdominio=${subdominio}`);

      if (!response.ok) {
        throw new Error('Error al obtener asignaciones de cupones');
      }

      const data = await response.json();
      setClienteCupones(data.cliente_cupones || []);
    } catch (error) {
      console.error('Error fetching cliente-cupones:', error);
      setClienteCupones([]);
    } finally {
      setLoadingClienteCupones(false);
    }
  };

  // API: Crear cupón
  const createCupon = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cupones/cupones/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...nuevoCupon,
          usuario,
          token: tokenUsuario,
          subdominio
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear cupón');
      }

      await fetchCupones();
      setShowCrearCuponModal(false);
      setNuevoCupon({
        codigo: '',
        descripcion: '',
        porcentaje_descuento: '',
        monto_fijo: '',
        fecha_vencimiento: '',
        activo: true,
        cantidad_maxima: '',
        tipo: 'PORCENTAJE'
      });
    } catch (error) {
      alert(error.message);
    }
  };

  // API: Asignar cupón a cliente
  const asignarCupon = async (e) => {
    e.preventDefault();
    if (!selectedCliente || !selectedCupon) {
      alert('Selecciona un cliente y un cupón');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cupones/cliente-cupones/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al asignar cupón');
      }

      await fetchClienteCupones();
      setShowAsignarModal(false);
      setSelectedCliente(null);
      setSelectedCupon(null);
      setCantidadAsignar(1);
    } catch (error) {
      alert(error.message);
    }
  };

  // API: Usar cupón
  const usarCupon = async (clienteCuponId) => {
    if (!confirm('¿Confirmar uso de este cupón?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cupones/cliente-cupones/${clienteCuponId}/usar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario,
          token: tokenUsuario,
          subdominio
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al usar cupón');
      }

      await fetchClienteCupones();
    } catch (error) {
      alert(error.message);
    }
  };

  // Obtener cupones de un cliente específico
  const fetchCuponesPorCliente = async (clienteId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cupones/cliente-cupones/cliente/${clienteId}/?solo_activos=true&usuario=${usuario}&token=${tokenUsuario}&subdominio=${subdominio}`);

      if (!response.ok) {
        throw new Error('Error al obtener cupones del cliente');
      }

      const data = await response.json();
      return data.cupones || [];
    } catch (error) {
      console.error('Error fetching cupones por cliente:', error);
      return [];
    }
  };

  const verCuponesCliente = async (cliente) => {
    setClienteForCupones(cliente);
    const cupones = await fetchCuponesPorCliente(cliente.id);
    setClienteForCupones({ ...cliente, cupones });
    setShowCuponesModal(true);
  };

  // Cargar datos al inicio
  useEffect(() => {
    fetchClientes();
    fetchCupones();
    fetchClienteCupones();
  }, []);

  // Debounce para búsqueda (asignar cupón)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        fetchClientes(searchQuery);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Debounce para búsqueda de clientes (gestión clientes)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (clientesSearchQuery) {
        fetchClientes(clientesSearchQuery);
      } else if (!showClientesModal) {
        // Limpiar clientes cuando se cierra la modal
        setClientes([]);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [clientesSearchQuery, showClientesModal]);

  // Función para obtener nombre del cliente
  const getClienteNombre = (clienteCupon) => {
    if (clienteCupon.cliente_tienda) {
      return clienteCupon.cliente_tienda.email || 'N/A';
    }
    return 'N/A';
  };

  // Función para obtener código del cupón
  const getCuponCodigo = (clienteCupon) => {
    return clienteCupon.cupon?.codigo || 'N/A';
  };

  // Stats cards
  const statsCards = [
    {
      title: 'Total Cupones',
      value: cupones.length,
      icon: TicketIcon,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Asignaciones Activas',
      value: clienteCupones.filter(cc => cc.activo).length,
      icon: GiftIcon,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Clientes Registrados',
      value: clientes.length,
      icon: UserIcon,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header con título */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gestion clientes</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Administra cupones y clientes</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((stat, index) => (
          <div key={index} className={`relative overflow-hidden rounded-2xl p-5 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 ${stat.bgColor} transition-all hover:shadow-md`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl shadow-sm`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toggle Buttons - Secciones independientes */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowClientesModal(!showClientesModal)}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${showClientesModal
            ? 'bg-purple-600 text-white shadow-md'
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700'
            }`}
        >
          <UserIcon className="h-4 w-4" />
          <span>Gestion Clientes</span>
          {showClientesModal && <XMarkIcon className="h-4 w-4" />}
        </button>
        <button
          onClick={() => setShowAsignarModal(!showAsignarModal)}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${showAsignarModal
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700'
            }`}
        >
          <GiftIcon className="h-4 w-4" />
          <span>Asignar Cupón</span>
          {showAsignarModal && <XMarkIcon className="h-4 w-4" />}
        </button>
        <button
          onClick={() => setShowCrearCuponModal(!showCrearCuponModal)}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${showCrearCuponModal
            ? 'bg-green-600 text-white shadow-md'
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700'
            }`}
        >
          <PlusIcon className="h-4 w-4" />
          <span>Crear Cupón</span>
          {showCrearCuponModal && <XMarkIcon className="h-4 w-4" />}
        </button>
      </div>

      {/* Vista General - Asignaciones de cupones */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                <GiftIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Cupones Asignados</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Gestiona las asignaciones de cupones</p>
              </div>
            </div>
            <button
              onClick={fetchClienteCupones}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loadingClienteCupones ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Cargando asignaciones...</p>
            </div>
          ) : clienteCupones.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                <TicketIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">No hay cupones asignados</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Comienza asignando cupones a tus clientes</p>
            </div>
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
                {clienteCupones.map((cc, index) => (
                  <tr key={cc.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${index === 0 ? '' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{getClienteNombre(cc)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <TagIcon className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-slate-900 dark:text-slate-100">{getCuponCodigo(cc)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {cc.cantidad_disponible}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cc.activo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                        {cc.activo ? (
                          <>
                            <CheckIcon className="h-3 w-3" />
                            <span>Activo</span>
                          </>
                        ) : (
                          <>
                            <XMarkIcon className="h-3 w-3" />
                            <span>Inactivo</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {cc.activo && cc.cantidad_disponible > 0 && (
                        <button
                          onClick={() => usarCupon(cc.id)}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md"
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

      {/* Sección Gestion Clientes */}
      {showClientesModal && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                  <UserIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Gestión de Clientes</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Busca y visualiza clientes registrados</p>
                </div>
              </div>
              <button
                onClick={() => setShowClientesModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Búsqueda de cliente */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Buscar Cliente
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={clientesSearchQuery}
                  onChange={(e) => setClientesSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, cédula o RUC..."
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Lista de clientes */}
            {loadingClientes ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent"></div>
                <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">Buscando clientes...</p>
              </div>
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
                      <tr key={cliente.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                              <UserIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">
                                {cliente.tipo_persona === 'JUR' ? cliente.razon_social : `${cliente.primer_nombre || ''} ${cliente.apellidos || ''}`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{cliente.numero_documento}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${cliente.tipo_persona === 'JUR' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                            }`}>
                            {cliente.tipo_persona === 'JUR' ? 'Empresa' : 'Natural'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => verCuponesCliente(cliente)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium transition-colors"
                          >
                            <TicketIcon className="h-3.5 w-3.5" />
                            <span>Ver Cupones</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : clientesSearchQuery ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <UserIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No se encontraron clientes</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Intenta con otro término de búsqueda</p>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <MagnifyingGlassIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Busca clientes para ver resultados</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Ingresa nombre, cédula o RUC</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sección para asignar cupón */}
      {showAsignarModal && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                  <GiftIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Asignar Cupón a Cliente</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Selecciona un cliente y un cupón para asignar</p>
                </div>
              </div>
              <button
                onClick={() => setShowAsignarModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Búsqueda de cliente */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Buscar Cliente
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, cédula o RUC..."
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Lista de clientes */}
            {loadingClientes ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">Buscando clientes...</p>
              </div>
            ) : clientes.length > 0 ? (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                {clientes.map((cliente, index) => (
                  <div
                    key={cliente.id}
                    onClick={() => setSelectedCliente(cliente.id)}
                    className={`p-4 cursor-pointer transition-all duration-200 border-b border-slate-100 dark:border-slate-800 last:border-b-0 ${selectedCliente === cliente.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 border-l-4 border-l-transparent'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {cliente.tipo_persona === 'JUR' ? cliente.razon_social : `${cliente.primer_nombre || ''} ${cliente.apellidos || ''}`}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{cliente.numero_documento}</p>
                      </div>
                      {selectedCliente === cliente.id && (
                        <CheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <UserIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No se encontraron clientes</p>
              </div>
            ) : null}

            {/* Selección de cupón */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Seleccionar Cupón
              </label>
              <select
                value={selectedCupon || ''}
                onChange={(e) => setSelectedCupon(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">-- Selecciona un cupón --</option>
                {cupones.map((cupon) => (
                  <option key={cupon.id} value={cupon.id}>
                    {cupon.codigo} - {cupon.descripcion} ({cupon.tipo === 'PORCENTAJE' ? `${cupon.porcentaje_descuento}%` : `$${cupon.monto_fijo}`})
                  </option>
                ))}
              </select>
            </div>

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Cantidad a Asignar
              </label>
              <input
                type="number"
                min="1"
                value={cantidadAsignar}
                onChange={(e) => setCantidadAsignar(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Botón de asignar */}
            <button
              onClick={asignarCupon}
              disabled={!selectedCliente || !selectedCupon}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-700 dark:disabled:to-slate-800 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
            >
              <GiftIcon className="h-5 w-5" />
              <span>Asignar Cupón</span>
            </button>
          </div>
        </div>
      )}

      {/* Sección para crear cupón */}
      {showCrearCuponModal && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                  <PlusIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Crear Nuevo Cupón</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Configura un nuevo cupón de descuento</p>
                </div>
              </div>
              <button
                onClick={() => setShowCrearCuponModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={createCupon} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Código *
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevoCupon.codigo}
                    onChange={(e) => setNuevoCupon({ ...nuevoCupon, codigo: e.target.value })}
                    placeholder="Ej: VERANO2024"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Tipo de Descuento *
                  </label>
                  <select
                    required
                    value={nuevoCupon.tipo}
                    onChange={(e) => setNuevoCupon({ ...nuevoCupon, tipo: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="PORCENTAJE">Porcentaje</option>
                    <option value="MONTO_FIJO">Monto Fijo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Descripción
                </label>
                <input
                  type="text"
                  value={nuevoCupon.descripcion}
                  onChange={(e) => setNuevoCupon({ ...nuevoCupon, descripcion: e.target.value })}
                  placeholder="Ej: Descuento de verano"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {nuevoCupon.tipo === 'PORCENTAJE' ? (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Porcentaje de Descuento *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required={nuevoCupon.tipo === 'PORCENTAJE'}
                        min="0"
                        max="100"
                        step="0.01"
                        value={nuevoCupon.porcentaje_descuento}
                        onChange={(e) => setNuevoCupon({ ...nuevoCupon, porcentaje_descuento: e.target.value })}
                        placeholder="Ej: 10"
                        className="w-full px-4 py-3 pr-12 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-medium">%</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Monto Fijo de Descuento *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-medium">$</span>
                      <input
                        type="number"
                        required={nuevoCupon.tipo === 'MONTO_FIJO'}
                        min="0"
                        step="0.01"
                        value={nuevoCupon.monto_fijo}
                        onChange={(e) => setNuevoCupon({ ...nuevoCupon, monto_fijo: e.target.value })}
                        placeholder="Ej: 10.00"
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={nuevoCupon.fecha_vencimiento}
                    onChange={(e) => setNuevoCupon({ ...nuevoCupon, fecha_vencimiento: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Cantidad Máxima de Usos (por cliente)
                </label>
                <input
                  type="number"
                  min="1"
                  value={nuevoCupon.cantidad_maxima}
                  onChange={(e) => setNuevoCupon({ ...nuevoCupon, cantidad_maxima: e.target.value })}
                  placeholder="Ej: 1"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <input
                  type="checkbox"
                  id="activo"
                  checked={nuevoCupon.activo}
                  onChange={(e) => setNuevoCupon({ ...nuevoCupon, activo: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="activo" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Cupón Activo (disponible para usar)
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCrearCuponModal(false)}
                  className="py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-3.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Crear Cupón</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver cupones del cliente */}
      {showCuponesModal && clienteForCupones && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                    <UserIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {clienteForCupones.tipo_persona === 'JUR' ? clienteForCupones.razon_social : `${clienteForCupones.primer_nombre || ''} ${clienteForCupones.apellidos || ''}`}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Cupones asignados</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCuponesModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {clienteForCupones.cupones && clienteForCupones.cupones.length > 0 ? (
                <div className="space-y-3">
                  {clienteForCupones.cupones.map((cc) => (
                    <div key={cc.id} className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                            <TicketIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{cc.cupon?.codigo}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{cc.cupon?.descripcion}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${cc.activo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                          {cc.cantidad_disponible} disponibles
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                    <TicketIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Este cliente no tiene cupones asignados</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowCuponesModal(false)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-all duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
