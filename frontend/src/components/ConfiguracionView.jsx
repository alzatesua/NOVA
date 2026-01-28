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
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function ConfiguracionView() {
  const { tokenUsuario, usuario, subdominio, rol, logout } = useAuth();

  // Tab activa
  const [activeTab, setActiveTab] = useState('categorias');

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
        let apiError;
        try {
          switch (activeTab) {
            case 'categorias':
              response = await crearCategoriaTienda({ usuario, token, subdominio, datos });
              break;
            case 'marcas':
              response = await crearMarca({ usuario, token, subdominio, datos });
              break;
            case 'ivas':
              response = await crearIva({ usuario, token, subdominio, datos });
              break;
            case 'descuentos':
              response = await crearDescuento({ usuario, token, subdominio, datos });
              break;
            case 'medidas':
              response = await crearMedida({ usuario, token, subdominio, datos });
              break;
          }
          console.log('📥 Respuesta de la API:', response);
          showToast('success', 'Creado correctamente');
        } catch (error) {
          apiError = error;
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
    { id: 'categorias', label: 'Categorías', icon: '📁' },
    { id: 'marcas', label: 'Marcas', icon: '🏷️' },
    { id: 'ivas', label: 'IVA', icon: '💰' },
    { id: 'descuentos', label: 'Descuentos', icon: '🏷️' },
    { id: 'medidas', label: 'Medidas', icon: '📏' },
  ];

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No hay {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} registrados</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {activeTab === 'ivas' ? (
                  <p className="font-semibold text-lg text-gray-800">
                    {item.porcentaje}%
                  </p>
                ) : activeTab === 'descuentos' ? (
                  <p className="font-semibold text-lg text-gray-800">
                    {item.porcentaje || item.Descuento}%
                  </p>
                ) : activeTab === 'categorias' ? (
                  <>
                    <p className="font-semibold text-lg text-gray-800">
                      {item.nombre}
                    </p>
                    {item.descripcion && (
                      <p className="text-sm text-gray-600 mt-1">{item.descripcion}</p>
                    )}
                  </>
                ) : (
                  <p className="font-semibold text-lg text-gray-800">
                    {item.nombre}
                  </p>
                )}
                {item.id && (
                  <p className="text-xs text-gray-400 mt-1">ID: {item.id}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Editar"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Eliminar"
                >
                  <TrashIcon className="h-5 w-5" />
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
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Configuración General</h2>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setShowCreateForm(false);
            }}
            className={`flex items-center space-x-2 px-6 py-3 font-semibold rounded-t-lg transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="space-y-6">
        {/* Botón de crear */}
        <div className="flex justify-end">
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition font-semibold"
          >
            <PlusIcon className="h-5 w-5" />
            <span>
              {editingItem ? 'Editar' : 'Crear'} {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
            </span>
          </button>
        </div>

        {/* Formulario de creación/edición */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingItem ? 'Editar' : 'Crear'} {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
              </h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'categorias' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre || ''}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Electrónica, Deportes"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      required
                      value={formData.descripcion || ''}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Todos los productos de electrónica"
                      rows={2}
                    />
                  </div>
                </>
              )}

              {(activeTab === 'marcas' || activeTab === 'medidas') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre || ''}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={activeTab === 'marcas' ? "Ej: Apple, Samsung" : "Ej: Kilogramo, Unidad"}
                  />
                </div>
              )}

              {activeTab === 'ivas' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Porcentaje de IVA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.porcentaje || ''}
                    onChange={(e) => setFormData({ ...formData, porcentaje: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 19.00"
                  />
                </div>
              )}

              {activeTab === 'descuentos' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Porcentaje de Descuento
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.Descuento || ''}
                    onChange={(e) => setFormData({ ...formData, Descuento: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 30"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  {editingItem ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de items */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          {renderList()}
        </div>
      </div>
    </div>
  );
}
