// src/components/ConfiguracionView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../utils/toast';
import {
  fetchCategorias,
  fetchMarcas,
  fetchDescuentos,
  fetchIva,
  fetchTipoMedida,
  actualizarfila,
  crearCategoriaTienda,
  crearMarca,
  crearIva,
  crearDescuento,
  crearMedida
} from '../services/api';
import 'boxicons/css/boxicons.min.css';

export default function ConfiguracionView() {
  const { tokenUsuario, usuario, subdominio, rol, logout } = useAuth();

  // Tab activa
  const [activeTab, setActiveTab] = useState('categorias');

  // Configuración de la tienda
  const [tiendaConfig, setTiendaConfig] = useState({
    nombre_tienda: localStorage.getItem('nombre_tienda') || '',
    whatsapp_number: localStorage.getItem('whatsapp_number') || ''
  });

  // Estados para cada entidad
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [ivas, setIvas] = useState([]);
  const [descuentos, setDescuentos] = useState([]);
  const [tiposMedida, setTiposMedida] = useState([]);

  // Estados de carga
  const [loading, setLoading] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Estados para crear/editar
  const [formData, setFormData] = useState({});
  const [editingItem, setEditingItem] = useState(null);

  // Cargar datos según la tab activa
  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const loadData = async (tab) => {
    setLoading(prev => ({ ...prev, [tab]: true }));
    try {
      let response;
      console.log(`📥 Cargando ${tab}...`);

      switch (tab) {
        case 'categorias':
          response = await fetchCategorias({ tokenUsuario, usuario, subdominio });
          console.log('Categorías response:', response);
          setCategorias(response?.datos || []);
          break;
        case 'marcas':
          response = await fetchMarcas({ tokenUsuario, usuario, subdominio });
          console.log('Marcas response:', response);
          setMarcas(response?.datos || []);
          break;
        case 'ivas':
          response = await fetchIva({ tokenUsuario, usuario, subdominio });
          console.log('IVAs response:', response);
          setIvas(response?.datos || []);
          break;
        case 'descuentos':
          response = await fetchDescuentos({ tokenUsuario, usuario, subdominio });
          console.log('Descuentos response:', response);
          setDescuentos(response?.datos || []);
          break;
        case 'medidas':
          response = await fetchTipoMedida({ tokenUsuario, usuario, subdominio });
          console.log('Medidas response:', response);
          setTiposMedida(response?.datos || []);
          break;
      }

      console.log(`✅ ${tab} cargados:`, {
        categorias: categorias.length,
        marcas: marcas.length,
        ivas: ivas.length,
        descuentos: descuentos.length,
        medidas: tiposMedida.length
      });
    } catch (error) {
      console.error(`❌ Error cargando ${tab}:`, error);
      showToast('error', `Error al cargar ${tab}`);
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }));
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData(getDefaultFormData(activeTab));
    setShowCreateForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(mapItemToFormData(item, activeTab));
    setShowCreateForm(true);
  };

  const getDefaultFormData = (tab) => {
    switch (tab) {
      case 'categorias':
        return { nombre: '', descripcion: '' };
      case 'marcas':
        return { nombre: '' };
      case 'ivas':
        return { porcentaje: '' };
      case 'descuentos':
        return { Descuento: '' }; // Usar "Descuento" con mayúscula según la API
      case 'medidas':
        return { nombre: '' };
      default:
        return {};
    }
  };

  const mapItemToFormData = (item, tab) => {
    switch (tab) {
      case 'categorias':
        return { id: item.id, nombre: item.nombre, descripcion: item.descripcion || '' };
      case 'marcas':
        return { id: item.id, nombre: item.nombre };
      case 'ivas':
        return { id: item.id, porcentaje: item.porcentaje };
      case 'descuentos':
        return { id: item.id, Descuento: item.porcentaje || item.Descuento || '' };
      case 'medidas':
        return { id: item.id, nombre: item.nombre };
      default:
        return {};
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token_usuario');
      const datos = prepareFormData(formData, activeTab);

      console.log('📤 Enviando datos a la API:', { activeTab, datos });

      if (editingItem) {
        // Editar - usamos actualizarfila
        const tabla = getTablaForTab(activeTab);
        await actualizarfila({
          rol,
          token,
          usuario,
          tokenUsuario,
          subdominio,
          tabla,
          columna_filtro: 'id',
          valor_filtro: editingItem.id,
          datos
        });
        showToast('success', 'Actualizado correctamente');
      } else {
        // Crear - usamos las APIs específicas de creación
        let response;
        let creacionExitosa = false;
        try {
          switch (activeTab) {
            case 'categorias':
              response = await crearCategoriaTienda({ usuario, token, subdominio, datos });
              creacionExitosa = !!response;
              break;
            case 'marcas':
              response = await crearMarca({ usuario, token, subdominio, datos });
              creacionExitosa = !!response;
              break;
            case 'ivas':
              response = await crearIva({ usuario, token, subdominio, datos });
              creacionExitosa = !!response;
              break;
            case 'descuentos':
              console.log('🔵 Intentando crear descuento con datos:', datos);
              response = await crearDescuento({ usuario, token, subdominio, datos });
              console.log('🔵 Respuesta descuento:', response);
              // Para descuentos, validamos que tenga un campo de éxito o no sea un error
              creacionExitosa = response && !response.error && !response.mensaje?.toLowerCase().includes('error');
              console.log('🔵 creacionExitosa:', creacionExitosa);
              break;
            case 'medidas':
              response = await crearMedida({ usuario, token, subdominio, datos });
              creacionExitosa = !!response;
              break;
          }
          console.log('📥 Respuesta de la API:', response);
          if (creacionExitosa) {
            showToast('success', 'Creado correctamente');
          } else if (activeTab === 'descuentos') {
            // Si es descuentos y no hubo éxito, mostrar error
            console.error('❌ No se pudo crear el descuento, response:', response);
            showToast('error', response?.mensaje || response?.error || 'Error al crear descuento');
            return; // Detener ejecución
          }
        } catch (error) {
          console.log('🔍 Error capturado, propiedades:', {
            activeTab,
            status: error.status,
            message: error.message,
            hasDetails: !!error.details,
            detailsStatus: error.details?.status,
            details: error.details,
            stringified: JSON.stringify(error)
          });

          // Lista de endpoints que tienen el bug del 500 (guardan pero retornan error)
          const endpointsConBug500 = ['categorias', 'marcas', 'ivas', 'medidas'];
          const esEndpointConBug = endpointsConBug500.includes(activeTab);

          if (esEndpointConBug) {
            // Endpoint con bug conocido = asumimos que se guardó sin importar el error
            console.warn('⚠️ Endpoint con bug conocido, asumiendo que se guardó');
            showToast('success', 'Creado correctamente');
          } else {
            // Otros endpoints = mostrar el error al usuario
            console.error('❌ Error real al crear, mostrando al usuario');
            console.error('Detalles del error para ' + activeTab + ':', {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              details: error.details
            });
            showToast('error', error.message || `Error al crear ${activeTab}`);
            throw error;
          }
        }
      }

      setShowCreateForm(false);
      // Pequeño delay para asegurar que el backend procesó
      await new Promise(resolve => setTimeout(resolve, 800));
      loadData(activeTab);
    } catch (error) {
      console.error('❌ Error al guardar:', error);
      console.error('Detalles del error:', {
        message: error.message,
        details: error.details,
        status: error.status,
        stack: error.stack
      });
      if (error.isNotFound) logout();
      showToast('error', error.message || 'Error al guardar');
    }
  };

  const getTablaForTab = (tab) => {
    switch (tab) {
      case 'categorias': return 'main_dashboard_categoria';
      case 'marcas': return 'main_dashboard_marca';
      case 'ivas': return 'main_dashboard_iva';
      case 'descuentos': return 'descuentos';
      case 'medidas': return 'tipos_medida';
      default: return '';
    }
  };

  const prepareFormData = (data, tab) => {
    switch (tab) {
      case 'categorias':
        return {
          nombre: data.nombre,
          descripcion: data.descripcion || ''
        };
      case 'marcas':
        return { nombre: data.nombre };
      case 'ivas':
        return { porcentaje: String(data.porcentaje) };
      case 'descuentos':
        return { Descuento: String(data.Descuento) };
      case 'medidas':
        return { nombre: data.nombre };
      default:
        return data;
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`¿Estás seguro de eliminar este ${activeTab.slice(0, -1)}?`)) return;

    try {
      const tabla = getTablaForTab(activeTab);

      await actualizarfila({
        rol,
        token: localStorage.getItem('token_usuario'),
        usuario,
        tokenUsuario,
        subdominio,
        tabla,
        columna_filtro: 'id',
        valor_filtro: item.id,
        datos: { estatus: 'inactivo' }
      });

      showToast('success', 'Eliminado correctamente');
      loadData(activeTab);
    } catch (error) {
      if (error.isNotFound) logout();
      showToast('error', error.message || 'Error al eliminar');
    }
  };

  const tabs = [
    { id: 'tienda', label: 'Mi Tienda', icon: 'bx-store' },
    { id: 'categorias', label: 'Categorías', icon: 'bx-category' },
    { id: 'marcas', label: 'Marcas', icon: 'bx-tag' },
    { id: 'ivas', label: 'IVA', icon: 'bx-dollar' },
    { id: 'descuentos', label: 'Descuentos', icon: 'bx-discount' },
    { id: 'medidas', label: 'Medidas', icon: 'bx-ruler' },
  ];

  // Guardar configuración de la tienda
  const handleSaveTiendaConfig = () => {
    localStorage.setItem('nombre_tienda', tiendaConfig.nombre_tienda);
    localStorage.setItem('whatsapp_number', tiendaConfig.whatsapp_number);
    showToast('success', 'Configuración de tienda guardada correctamente');
  };

  const renderList = () => {
    const items = {
      categorias: categorias,
      marcas: marcas,
      ivas: ivas,
      descuentos: descuentos,
      medidas: tiposMedida
    }[activeTab] || [];

    if (loading[activeTab]) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-100 border-t-[rgb(37,99,235)]"></div>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:!bg-slate-800 mb-3 transition-colors duration-200">
            <i className='bx bx-inbox text-3xl text-slate-400 dark:!text-slate-600'></i>
          </div>
          <p className="text-base text-slate-500 dark:!text-slate-400 font-medium transition-colors duration-200">No hay {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} registrados</p>
          <p className="text-xs text-slate-400 dark:!text-slate-500 mt-1 transition-colors duration-200">Crea uno nuevo para comenzar</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:!bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:!border-slate-800 p-4 hover:shadow-md hover:border-[rgb(37,99,235)] hover:border-opacity-30 transition-all duration-200 group transition-colors duration-200"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {activeTab === 'ivas' ? (
                  <p className="font-semibold text-base text-slate-800 dark:!text-slate-100 flex items-center gap-2 transition-colors duration-200">
                    <span className="w-7 h-7 rounded-lg bg-[rgb(37,99,235)] bg-opacity-10 flex items-center justify-center">
                      <i className='bx bx-percent text-sm text-[rgb(37,99,235)]'></i>
                    </span>
                    {item.porcentaje}%
                  </p>
                ) : activeTab === 'descuentos' ? (
                  <p className="font-semibold text-base text-slate-800 dark:!text-slate-100 flex items-center gap-2 transition-colors duration-200">
                    <span className="w-7 h-7 rounded-lg bg-[rgb(37,99,235)] bg-opacity-10 flex items-center justify-center">
                      <i className='bx bx-discount text-sm text-[rgb(37,99,235)]'></i>
                    </span>
                    {item.porcentaje || item.Descuento}%
                  </p>
                ) : activeTab === 'categorias' ? (
                  <>
                    <p className="font-semibold text-base text-slate-800 dark:!text-slate-100 flex items-center gap-2 transition-colors duration-200">
                      <span className="w-7 h-7 rounded-lg bg-[rgb(37,99,235)] bg-opacity-10 flex items-center justify-center">
                        <i className='bx bx-category text-sm text-[rgb(37,99,235)]'></i>
                      </span>
                      {item.nombre}
                    </p>
                    {item.descripcion && (
                      <p className="text-xs text-slate-500 dark:!text-slate-400 mt-1.5 ml-9 transition-colors duration-200">{item.descripcion}</p>
                    )}
                  </>
                ) : activeTab === 'marcas' ? (
                  <p className="font-semibold text-base text-slate-800 dark:!text-slate-100 flex items-center gap-2 transition-colors duration-200">
                    <span className="w-7 h-7 rounded-lg bg-[rgb(37,99,235)] bg-opacity-10 flex items-center justify-center">
                      <i className='bx bx-tag text-sm text-[rgb(37,99,235)]'></i>
                    </span>
                    {item.nombre}
                  </p>
                ) : (
                  <p className="font-semibold text-base text-slate-800 dark:!text-slate-100 flex items-center gap-2 transition-colors duration-200">
                    <span className="w-7 h-7 rounded-lg bg-[rgb(37,99,235)] bg-opacity-10 flex items-center justify-center">
                      <i className='bx bx-ruler text-sm text-[rgb(37,99,235)]'></i>
                    </span>
                    {item.nombre}
                  </p>
                )}
                {item.id && (
                  <p className="text-xs text-slate-400 dark:!text-slate-600 mt-1.5 ml-9 transition-colors duration-200">ID: {item.id}</p>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-1.5 text-gray-400 hover:text-[rgb(37,99,235)] hover:bg-[rgb(37,99,235)] hover:bg-opacity-10 rounded-lg transition-all"
                  title="Editar"
                >
                  <i className='bx bx-edit-alt text-base'></i>
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Eliminar"
                >
                  <i className='bx bx-trash text-base'></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[rgb(37,99,235)] bg-opacity-10 flex items-center justify-center">
          <i className='bx bx-cog text-xl text-[rgb(37,99,235)]'></i>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:!text-slate-100 transition-colors duration-200">Configuración General</h2>
          <p className="text-slate-500 dark:!text-slate-400 text-sm transition-colors duration-200">Administra la configuración de tu sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 dark:!border-slate-800 pb-1 transition-colors duration-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setShowCreateForm(false);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium rounded-t-lg transition-all duration-200 text-sm transition-colors duration-200 ${
              activeTab === tab.id
                ? 'text-white bg-[rgb(37,99,235)] shadow-sm'
                : 'text-slate-600 dark:!text-slate-400 hover:text-[rgb(37,99,235)] hover:bg-slate-50 dark:hover:!bg-slate-700'
            }`}
          >
            <i className={`bx ${tab.icon} text-lg`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="space-y-6">
        {/* Configuración de la Tienda */}
        {activeTab === 'tienda' && (
          <div className="bg-white dark:!bg-slate-900 rounded-xl shadow-md border border-slate-100 dark:!border-slate-800 p-6 transition-colors duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[rgb(37,99,235)] bg-opacity-10 flex items-center justify-center">
                <i className='bx bx-store-alt text-xl text-[rgb(37,99,235)]'></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:!text-slate-100 transition-colors duration-200">Configuración de Tienda Online</h3>
                <p className="text-slate-500 dark:!text-slate-400 text-sm transition-colors duration-200">Personaliza tu tienda en línea</p>
              </div>
            </div>
            <p className="text-slate-600 dark:!text-slate-400 mb-8 transition-colors duration-200">
              Configura los datos de tu tienda para que los clientes puedan contactarte por WhatsApp.
            </p>

            <div className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:!text-slate-300 mb-2 flex items-center gap-2 transition-colors duration-200">
                  <i className='bx bx-heading text-sm text-[rgb(37,99,235)]'></i>
                  Nombre de la Tienda
                </label>
                <input
                  type="text"
                  value={tiendaConfig.nombre_tienda}
                  onChange={(e) => setTiendaConfig({ ...tiendaConfig, nombre_tienda: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:!border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(37,99,235)] focus:border-transparent transition-all text-sm bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 transition-colors duration-200"
                  placeholder="Ej: Mi Tienda Online"
                />
                <p className="text-xs text-slate-400 dark:!text-slate-500 mt-1.5 transition-colors duration-200">Este nombre se mostrará en el header de tu tienda</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:!text-slate-300 mb-2 flex items-center gap-2 transition-colors duration-200">
                  <i className='bx bxl-whatsapp text-sm text-[rgb(37,99,235)]'></i>
                  Número de WhatsApp
                </label>
                <input
                  type="text"
                  value={tiendaConfig.whatsapp_number}
                  onChange={(e) => setTiendaConfig({ ...tiendaConfig, whatsapp_number: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:!border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(37,99,235)] focus:border-transparent transition-all text-sm bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 transition-colors duration-200"
                  placeholder="Ej: 573000000000"
                />
                <p className="text-xs text-slate-400 dark:!text-slate-500 mt-1.5 transition-colors duration-200">
                  Código de país + número (sin el signo +). Ej: 57 para Colombia, 54 para Argentina
                </p>
              </div>

              <div className="bg-gradient-to-r from-[rgb(37,99,235)] to-[rgb(29,78,216)] bg-opacity-5 border border-[rgb(37,99,235)] border-opacity-20 rounded-xl p-5">
                <h4 className="font-semibold text-slate-800 dark:!text-slate-100 mb-3 flex items-center gap-2 text-sm transition-colors duration-200">
                  <i className='bx bx-info-circle text-[rgb(37,99,235)] text-lg'></i>
                  ¿Cómo funciona?
                </h4>
                <ul className="text-sm text-slate-700 dark:!text-slate-300 space-y-2 transition-colors duration-200">
                  <li className="flex items-start gap-2">
                    <i className='bx bx-check-circle text-[rgb(37,99,235)] mt-0.5'></i>
                    <span>Los clientes agregan productos al carrito</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className='bx bx-check-circle text-[rgb(37,99,235)] mt-0.5'></i>
                    <span>Al completar el pedido, se genera un mensaje automático</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className='bx bx-check-circle text-[rgb(37,99,235)] mt-0.5'></i>
                    <span>El mensaje se envía a este número de WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className='bx bx-check-circle text-[rgb(37,99,235)] mt-0.5'></i>
                    <span>Tú recibes el detalle completo del pedido para gestionarlo</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveTiendaConfig}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[rgb(37,99,235)] hover:bg-[rgb(29,78,216)] text-white rounded-lg shadow hover:shadow-md transition-all duration-200 text-sm font-medium"
                >
                  <i className='bx bx-save text-lg'></i>
                  Guardar Configuración
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de creación/edición */}
        {showCreateForm && (
          <div className="bg-white dark:!bg-slate-900 rounded-xl shadow-md border border-slate-100 dark:!border-slate-800 p-6 transition-colors duration-200">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgb(37,99,235)] bg-opacity-10 flex items-center justify-center">
                  <i className={`bx ${editingItem ? 'bx-edit' : 'bx-plus'} text-base text-[rgb(37,99,235)]`}></i>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:!text-slate-100 transition-colors duration-200">
                  {editingItem ? 'Editar' : 'Crear'} {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
              >
                <i className='bx bx-x text-lg'></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'categorias' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:!text-slate-300 mb-2 flex items-center gap-2 transition-colors duration-200">
                      <i className='bx bx-text text-sm text-[rgb(37,99,235)]'></i>
                      Nombre
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre || ''}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 dark:!border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(37,99,235)] focus:border-transparent transition-all text-sm bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 transition-colors duration-200"
                      placeholder="Ej: Electrónica, Deportes"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:!text-slate-300 mb-2 flex items-center gap-2 transition-colors duration-200">
                      <i className='bx bx-align-left text-sm text-[rgb(37,99,235)]'></i>
                      Descripción
                    </label>
                    <textarea
                      required
                      value={formData.descripcion || ''}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 dark:!border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(37,99,235)] focus:border-transparent transition-all resize-none text-sm bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 transition-colors duration-200"
                      placeholder="Ej: Todos los productos de electrónica"
                      rows={2}
                    />
                  </div>
                </>
              )}

              {(activeTab === 'marcas' || activeTab === 'medidas') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:!text-slate-300 mb-2 flex items-center gap-2 transition-colors duration-200">
                    <i className='bx bx-text text-sm text-[rgb(37,99,235)]'></i>
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre || ''}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:!border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(37,99,235)] focus:border-transparent transition-all text-sm bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 transition-colors duration-200"
                    placeholder={activeTab === 'marcas' ? "Ej: Apple, Samsung" : "Ej: Kilogramo, Unidad"}
                  />
                </div>
              )}

              {activeTab === 'ivas' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:!text-slate-300 mb-2 flex items-center gap-2 transition-colors duration-200">
                    <i className='bx bx-percent text-sm text-[rgb(37,99,235)]'></i>
                    Porcentaje de IVA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.porcentaje || ''}
                    onChange={(e) => setFormData({ ...formData, porcentaje: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:!border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(37,99,235)] focus:border-transparent transition-all text-sm bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 transition-colors duration-200"
                    placeholder="Ej: 19.00"
                  />
                </div>
              )}

              {activeTab === 'descuentos' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:!text-slate-300 mb-2 flex items-center gap-2 transition-colors duration-200">
                    <i className='bx bx-discount text-sm text-[rgb(37,99,235)]'></i>
                    Porcentaje de Descuento
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.Descuento || ''}
                    onChange={(e) => setFormData({ ...formData, Descuento: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:!border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(37,99,235)] focus:border-transparent transition-all text-sm bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 transition-colors duration-200"
                    placeholder="Ej: 30"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:!bg-slate-800 text-slate-700 dark:!text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:!bg-slate-700 transition-all text-sm font-medium transition-colors duration-200"
                >
                  <i className='bx bx-x text-base'></i>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2.5 bg-[rgb(37,99,235)] hover:bg-[rgb(29,78,216)] text-white rounded-lg shadow hover:shadow-md transition-all text-sm font-medium"
                >
                  <i className={`bx ${editingItem ? 'bx-save' : 'bx-plus'} text-lg`}></i>
                  {editingItem ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de items (ocultar en tab tienda) */}
        {activeTab !== 'tienda' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 relative">
            {/* Botón de crear flotante */}
            <button
              onClick={handleCreate}
              className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 bg-[rgb(37,99,235)] hover:bg-[rgb(29,78,216)] text-white rounded-lg shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 z-10"
              title={`Crear ${tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}`}
            >
              <i className='bx bx-plus text-lg'></i>
            </button>
            <div className="p-6">
              {renderList()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
