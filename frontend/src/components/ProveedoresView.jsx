import React, { useState, useEffect } from 'react';
import { post, get, put, del, fetchCiudades } from '../services/api';
import { showToast } from '../utils/toast';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  Package,
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  Globe,
  Filter,
  X
} from 'lucide-react';

export default function ProveedoresView() {
  const [proveedores, setProveedores] = useState([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [vistaActual, setVistaActual] = useState('lista'); // 'lista' o 'detalle'
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [mostrarModalProducto, setMostrarModalProducto] = useState(false);
  const [productosProveedor, setProductosProveedor] = useState([]);
  const [productoFormData, setProductoFormData] = useState({
    nombre_producto: '',
    codigo_producto: '',
    descripcion: '',
    precio_unitario: '',
    moneda: 'COP',
    tiempo_entrega_dias: '',
    minimo_pedido: '',
    disponible: true,
    stock_actual: '',
    categoria: '',
    observaciones: ''
  });
  const [formData, setFormData] = useState({
    nit: '',
    razon_social: '',
    nombre_comercial: '',
    direccion: '',
    ciudad: '',
    correo_electronico: '',
    telefono: '',
    telefono_whatsapp: '',
    contacto_principal: '',
    cargo_contacto: '',
    sitio_web: '',
    plazo_pago_dias: '',
    descuento_comercial: '',
    limite_credito: ''
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [ciudades, setCiudades] = useState([]);
  const [loadingCiudades, setLoadingCiudades] = useState(false);

  useEffect(() => {
    // Detectar modo oscuro
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                     document.body.classList.contains('dark-mode') ||
                     localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Escuchar cambios en el DOM
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // También escuchar cambios en localStorage
    const handleStorageChange = () => checkDarkMode();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('darkModeChange', handleStorageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('darkModeChange', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarCiudades = async () => {
    try {
      setLoadingCiudades(true);
      const token = localStorage.getItem('token_usuario');
      const data = await fetchCiudades(token);
      setCiudades(data || []);
    } catch (error) {
      console.error('Error cargando ciudades:', error);
      showToast('error', 'Error al cargar ciudades');
    } finally {
      setLoadingCiudades(false);
    }
  };

  // Cargar ciudades cuando se abre el formulario
  useEffect(() => {
    if (mostrarFormulario && ciudades.length === 0) {
      cargarCiudades();
    }
  }, [mostrarFormulario]);


  const cargarProveedores = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token_usuario');
    const usuario = localStorage.getItem('usuario');
    const subdominio = window.location.hostname.split('.')[0];

    const response = await post('api/proveedores/', {
      usuario,
      token,
      subdominio
    }, token);

    // response ya ES el json, no response.json
    if (response && response.success) {
      setProveedores(response.data || []);
    } else {
      showToast('error', 'No se pudieron cargar los proveedores');
    }
  } catch (error) {
    console.error('Error cargando proveedores:', error);
    showToast('error', 'Error al cargar proveedores');
  } finally {
    setLoading(false);
  }
};

  const cargarDetalleProveedor = async (proveedorId) => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token_usuario');
    const usuario = localStorage.getItem('usuario');
    const subdominio = window.location.hostname.split('.')[0];

    // Usar GET con query parameters
    const params = new URLSearchParams({
      usuario,
      token,
      subdominio
    });
    const response = await get(`api/proveedores/${proveedorId}/?${params.toString()}`, token);

    // response ya ES el json
    if (response && response.success) {
      setProveedorSeleccionado(response.data);
      setVistaActual('detalle');
      // Cargar productos del proveedor
      cargarProductosProveedor(proveedorId);
    } else {
      showToast('error', 'No se pudo cargar el detalle del proveedor');
    }
  } catch (error) {
    console.error('Error cargando detalle:', error);
    showToast('error', 'Error al cargar detalle del proveedor');
  } finally {
    setLoading(false);
  }
};

  const crearProveedor = async () => {
  if (!formData.nit || !formData.razon_social) {
    showToast('error', 'NIT y Razón Social son obligatorios');
    return;
  }

  try {
    setLoading(true);
    const token = localStorage.getItem('token_usuario');
    const usuario = localStorage.getItem('usuario');
    const subdominio = window.location.hostname.split('.')[0];

    const payload = {
      usuario,
      token,
      subdominio,
      accion: 'crear',
      nit: formData.nit,
      razon_social: formData.razon_social,
      nombre_comercial: formData.nombre_comercial || '',
      direccion: formData.direccion || '',
      ciudad: formData.ciudad || '',
      correo_electronico: formData.correo_electronico || '',
      telefono: formData.telefono || '',
      telefono_whatsapp: formData.telefono_whatsapp || '',
      contacto_principal: formData.contacto_principal || '',
      cargo_contacto: formData.cargo_contacto || '',
      sitio_web: formData.sitio_web || '',
      plazo_pago_dias: formData.plazo_pago_dias ? parseInt(formData.plazo_pago_dias) : null,
      descuento_comercial: formData.descuento_comercial ? parseFloat(formData.descuento_comercial) : 0,
      limite_credito: formData.limite_credito ? parseFloat(formData.limite_credito) : null
    };

    const response = await post('api/proveedores/', payload, token);

    // ← CORRECCIÓN: response ya ES el json directamente
    if (response && response.success) {
      showToast('success', 'Proveedor creado exitosamente');
      setMostrarFormulario(false);
      setFormData({
        nit: '', razon_social: '', nombre_comercial: '', direccion: '',
        ciudad: '', correo_electronico: '', telefono: '', telefono_whatsapp: '',
        contacto_principal: '', cargo_contacto: '', sitio_web: '',
        plazo_pago_dias: '', descuento_comercial: '', limite_credito: ''
      });
      cargarProveedores();
    } else {
      showToast('error', response?.message || 'Error al crear proveedor');
    }
  } catch (error) {
    console.error('Error creando proveedor:', error);
    showToast('error', 'Error al crear proveedor');
  } finally {
    setLoading(false);
  }
};

  const handleEditar = () => {
    // Precargar el formulario con los datos del proveedor seleccionado
    setFormData({
      nit: proveedorSeleccionado.nit || '',
      razon_social: proveedorSeleccionado.razon_social || '',
      nombre_comercial: proveedorSeleccionado.nombre_comercial || '',
      direccion: proveedorSeleccionado.direccion || '',
      ciudad: proveedorSeleccionado.ciudad || '',
      correo_electronico: proveedorSeleccionado.correo_electronico || proveedorSeleccionado.correo || '',
      telefono: proveedorSeleccionado.telefono || proveedorSeleccionado.telefono_contacto || '',
      telefono_whatsapp: proveedorSeleccionado.telefono_whatsapp || '',
      contacto_principal: proveedorSeleccionado.contacto_principal || '',
      cargo_contacto: proveedorSeleccionado.cargo_contacto || '',
      sitio_web: proveedorSeleccionado.sitio_web || '',
      plazo_pago_dias: proveedorSeleccionado.plazo_pago_dias || '',
      descuento_comercial: proveedorSeleccionado.descuento_comercial || '',
      limite_credito: proveedorSeleccionado.limite_credito || ''
    });
    setMostrarModalEdicion(true);
  };

  const editarProveedor = async () => {
    if (!formData.razon_social) {
      showToast('error', 'Razón Social es obligatoria');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token_usuario');
      const usuario = localStorage.getItem('usuario');
      const subdominio = window.location.hostname.split('.')[0];

      const payload = {
        usuario,
        token,
        subdominio,
        razon_social: formData.razon_social,
        nombre_comercial: formData.nombre_comercial || '',
        direccion: formData.direccion || '',
        ciudad: formData.ciudad || '',
        correo_electronico: formData.correo_electronico || '',
        telefono: formData.telefono || '',
        telefono_whatsapp: formData.telefono_whatsapp || '',
        contacto_principal: formData.contacto_principal || '',
        cargo_contacto: formData.cargo_contacto || '',
        sitio_web: formData.sitio_web || '',
        plazo_pago_dias: formData.plazo_pago_dias ? parseInt(formData.plazo_pago_dias) : null,
        descuento_comercial: formData.descuento_comercial ? parseFloat(formData.descuento_comercial) : 0,
        limite_credito: formData.limite_credito ? parseFloat(formData.limite_credito) : null
      };

      const response = await put(`api/proveedores/${proveedorSeleccionado.id}/`, payload, token);

      if (response && response.success) {
        showToast('success', 'Proveedor actualizado exitosamente');
        setMostrarModalEdicion(false);
        // Recargar detalle
        await cargarDetalleProveedor(proveedorSeleccionado.id);
        // Recargar lista
        await cargarProveedores();
      } else {
        showToast('error', response?.message || 'Error al actualizar proveedor');
      }
    } catch (error) {
      console.error('Error editando proveedor:', error);
      showToast('error', 'Error al actualizar proveedor');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    // Usar SweetAlert para confirmación
    const Swal = (await import('sweetalert2')).default;

    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el proveedor "${proveedorSeleccionado.razon_social}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: isDarkMode ? '#1e293b' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#000000'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          const token = localStorage.getItem('token_usuario');
          const usuario = localStorage.getItem('usuario');
          const subdominio = window.location.hostname.split('.')[0];

          const response = await del(`api/proveedores/${proveedorSeleccionado.id}/?usuario=${encodeURIComponent(usuario)}&token=${encodeURIComponent(token)}&subdominio=${encodeURIComponent(subdominio)}`, token);

          if (response && response.success) {
            Swal.fire({
              title: '¡Eliminado!',
              text: 'El proveedor ha sido eliminado.',
              icon: 'success',
              background: isDarkMode ? '#1e293b' : '#ffffff',
              color: isDarkMode ? '#ffffff' : '#000000'
            });
            setVistaActual('lista');
            setProveedorSeleccionado(null);
            cargarProveedores();
          } else {
            Swal.fire({
              title: 'Error',
              text: response?.message || 'No se pudo eliminar el proveedor',
              icon: 'error',
              background: isDarkMode ? '#1e293b' : '#ffffff',
              color: isDarkMode ? '#ffffff' : '#000000'
            });
          }
        } catch (error) {
          console.error('Error eliminando proveedor:', error);
          Swal.fire({
            title: 'Error',
            text: 'Error al eliminar el proveedor',
            icon: 'error',
            background: isDarkMode ? '#1e293b' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const cargarProductosProveedor = async (proveedorId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token_usuario');
      const usuario = localStorage.getItem('usuario');
      const subdominio = window.location.hostname.split('.')[0];

      const params = new URLSearchParams({
        usuario,
        token,
        subdominio
      });

      const response = await get(`api/proveedores/${proveedorId}/productos/?${params.toString()}`, token);

      if (response && response.success) {
        setProductosProveedor(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando productos del proveedor:', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarProductoProveedor = async () => {
    if (!productoFormData.nombre_producto) {
      showToast('error', 'El nombre del producto es obligatorio');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token_usuario');
      const usuario = localStorage.getItem('usuario');
      const subdominio = window.location.hostname.split('.')[0];

      const payload = {
        usuario,
        token,
        subdominio,
        nombre_producto: productoFormData.nombre_producto,
        codigo_producto: productoFormData.codigo_producto || '',
        descripcion: productoFormData.descripcion || '',
        precio_unitario: productoFormData.precio_unitario ? parseFloat(productoFormData.precio_unitario) : 0,
        moneda: productoFormData.moneda || 'COP',
        tiempo_entrega_dias: productoFormData.tiempo_entrega_dias ? parseInt(productoFormData.tiempo_entrega_dias) : null,
        minimo_pedido: productoFormData.minimo_pedido ? parseInt(productoFormData.minimo_pedido) : null,
        disponible: productoFormData.disponible !== false,
        stock_actual: productoFormData.stock_actual ? parseInt(productoFormData.stock_actual) : null,
        categoria: productoFormData.categoria || '',
        observaciones: productoFormData.observaciones || ''
      };

      const params = new URLSearchParams({
        usuario,
        token,
        subdominio
      });

      const response = await post(`api/proveedores/${proveedorSeleccionado.id}/productos/?${params.toString()}`, payload, token);

      if (response && response.success) {
        showToast('success', 'Producto agregado exitosamente');
        setMostrarModalProducto(false);
        setProductoFormData({
          nombre_producto: '',
          codigo_producto: '',
          descripcion: '',
          precio_unitario: '',
          moneda: 'COP',
          tiempo_entrega_dias: '',
          minimo_pedido: '',
          disponible: true,
          stock_actual: '',
          categoria: '',
          observaciones: ''
        });
        cargarProductosProveedor(proveedorSeleccionado.id);
      } else {
        showToast('error', response?.message || 'Error al agregar producto');
      }
    } catch (error) {
      console.error('Error agregando producto:', error);
      showToast('error', 'Error al agregar producto');
    } finally {
      setLoading(false);
    }
  };

  const proveedoresFiltrados = proveedores.filter(prov => {
    const cumpleBusqueda = !busqueda ||
      prov.razon_social?.toLowerCase().includes(busqueda.toLowerCase()) ||
      prov.nit?.toLowerCase().includes(busqueda.toLowerCase());

    const cumpleFiltro = filtroEstado === 'todos' || prov.estado === filtroEstado;

    return cumpleBusqueda && cumpleFiltro;
  });

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'activo': return 'text-green-600 bg-green-100';
      case 'inactivo': return 'text-gray-600 bg-gray-100';
      case 'bloqueado': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'activo': return 'Activo';
      case 'inactivo': return 'Inactivo';
      case 'bloqueado': return 'Bloqueado';
      default: return estado;
    }
  };

  const renderStars = (calificacion) => {
    if (!calificacion) return <span className="text-slate-900 dark:!text-white">Sin calificar</span>;

    const estrellas = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= calificacion) {
        estrellas.push(<Star key={i} size={16} fill="currentColor" className="text-yellow-500" />);
      } else if (i - 0.5 <= calificacion) {
        estrellas.push(<Star key={i} size={16} fill="currentColor" className="text-yellow-500 opacity-50" />);
      } else {
        estrellas.push(<Star key={i} size={16} className="text-gray-300" />);
      }
    }
    return <div className="flex items-center gap-1">{estrellas}</div>;
  };

  // MODAL DE EDICIÓN DE PROVEEDOR
  if (mostrarModalEdicion) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:!bg-slate-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:!bg-slate-900 border-b border-gray-200 dark:!border-slate-700 px-6 py-4 flex justify-between items-center z-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:!text-white">
              Editar Proveedor
            </h2>
            <button
              onClick={() => setMostrarModalEdicion(false)}
              className="text-gray-400 hover:text-gray-600 dark:!text-slate-400 dark:hover:!text-slate-200"
            >
              <X size={24} strokeWidth={2} />
            </button>
          </div>

          {/* Form - usar el mismo formulario que crear proveedor pero con datos precargados */}
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:!text-white mb-3">Datos Básicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    NIT *
                  </label>
                  <input
                    type="text"
                    value={formData.nit}
                    onChange={(e) => setFormData({...formData, nit: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Razón Social *
                  </label>
                  <input
                    type="text"
                    value={formData.razon_social}
                    onChange={(e) => setFormData({...formData, razon_social: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Nombre Comercial
                  </label>
                  <input
                    type="text"
                    value={formData.nombre_comercial}
                    onChange={(e) => setFormData({...formData, nombre_comercial: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:!text-white mb-3">Información de Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.telefono_whatsapp}
                    onChange={(e) => setFormData({...formData, telefono_whatsapp: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.correo_electronico}
                    onChange={(e) => setFormData({...formData, correo_electronico: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:!text-white mb-3">Persona de Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.contacto_principal}
                    onChange={(e) => setFormData({...formData, contacto_principal: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={formData.cargo_contacto}
                    onChange={(e) => setFormData({...formData, cargo_contacto: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                Sitio Web
              </label>
              <input
                type="url"
                value={formData.sitio_web}
                onChange={(e) => setFormData({...formData, sitio_web: e.target.value})}
                placeholder="https://ejemplo.com"
                className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:!text-white mb-3">Condiciones Comerciales</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Plazo de Pago (días)
                  </label>
                  <input
                    type="number"
                    value={formData.plazo_pago_dias}
                    onChange={(e) => setFormData({...formData, plazo_pago_dias: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Descuento Comercial (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.descuento_comercial}
                    onChange={(e) => setFormData({...formData, descuento_comercial: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Límite de Crédito
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.limite_credito}
                    onChange={(e) => setFormData({...formData, limite_credito: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:!bg-slate-800 border-t border-gray-200 dark:!border-slate-700 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={() => setMostrarModalEdicion(false)}
              className="px-6 py-2 border border-gray-300 dark:!border-slate-600 text-gray-700 dark:!text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:!bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={editarProveedor}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MODAL DE AGREGAR PRODUCTO A PROVEEDOR
  if (mostrarModalProducto) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:!bg-slate-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:!bg-slate-900 border-b border-gray-200 dark:!border-slate-700 px-6 py-4 flex justify-between items-center z-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:!text-white">
              Agregar Producto de Proveedor
            </h2>
            <button
              onClick={() => setMostrarModalProducto(false)}
              className="text-gray-400 hover:text-gray-600 dark:!text-slate-400 dark:hover:!text-slate-200"
            >
              <X size={24} strokeWidth={2} />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:!text-white mb-3">Datos del Producto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={productoFormData.nombre_producto}
                    onChange={(e) => setProductoFormData({...productoFormData, nombre_producto: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Código del Producto
                  </label>
                  <input
                    type="text"
                    value={productoFormData.codigo_producto}
                    onChange={(e) => setProductoFormData({...productoFormData, codigo_producto: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={productoFormData.categoria}
                    onChange={(e) => setProductoFormData({...productoFormData, categoria: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={productoFormData.descripcion}
                    onChange={(e) => setProductoFormData({...productoFormData, descripcion: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:!text-white mb-3">Precios y Condiciones</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Precio Unitario *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productoFormData.precio_unitario}
                    onChange={(e) => setProductoFormData({...productoFormData, precio_unitario: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Moneda
                  </label>
                  <select
                    value={productoFormData.moneda}
                    onChange={(e) => setProductoFormData({...productoFormData, moneda: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                  >
                    <option value="COP">Peso Colombiano (COP)</option>
                    <option value="USD">Dólar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Tiempo de Entrega (días)
                  </label>
                  <input
                    type="number"
                    value={productoFormData.tiempo_entrega_dias}
                    onChange={(e) => setProductoFormData({...productoFormData, tiempo_entrega_dias: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:!text-white mb-3">Stock y Disponibilidad</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    value={productoFormData.stock_actual}
                    onChange={(e) => setProductoFormData({...productoFormData, stock_actual: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                    Mínimo Pedido
                  </label>
                  <input
                    type="number"
                    value={productoFormData.minimo_pedido}
                    onChange={(e) => setProductoFormData({...productoFormData, minimo_pedido: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productoFormData.disponible}
                      onChange={(e) => setProductoFormData({...productoFormData, disponible: e.target.checked})}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:!text-slate-300">
                      Disponible
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                Observaciones
              </label>
              <textarea
                value={productoFormData.observaciones}
                onChange={(e) => setProductoFormData({...productoFormData, observaciones: e.target.value})}
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                placeholder="Notas adicionales sobre el producto..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:!bg-slate-800 border-t border-gray-200 dark:!border-slate-700 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={() => setMostrarModalProducto(false)}
              className="px-6 py-2 border border-gray-300 dark:!border-slate-600 text-gray-700 dark:!text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:!bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={agregarProductoProveedor}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Agregar Producto'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  // VISTA: LISTA DE PROVEEDORES
  if (vistaActual === 'lista') {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header con estadísticas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:!text-white">
                Proveedores
              </h1>
              <p className="text-gray-600 dark:!text-slate-400 mt-1">
                Gestión de proveedores y productos
              </p>
            </div>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} strokeWidth={2} />
              <span>Nuevo Proveedor</span>
            </button>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:!bg-slate-900 rounded-lg p-4 shadow-sm ring-1 ring-slate-200 dark:!ring-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:!text-slate-400">Total Proveedores</p>
                  <p className="text-2xl font-bold text-gray-900 dark:!text-white">
                    {proveedores.length}
                  </p>
                </div>
                <Building2 className="text-blue-600" size={32} strokeWidth={2} />
              </div>
            </div>
            <div className="bg-white dark:!bg-slate-900 rounded-lg p-4 shadow-sm ring-1 ring-slate-200 dark:!ring-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:!text-slate-400">Activos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {proveedores.filter(p => p.estado === 'activo').length}
                  </p>
                </div>
                <Package className="text-green-600" size={32} strokeWidth={2} />
              </div>
            </div>
            <div className="bg-white dark:!bg-slate-900 rounded-lg p-4 shadow-sm ring-1 ring-slate-200 dark:!ring-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:!text-slate-400">Productos Totales</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {proveedores.reduce((sum, p) => sum + (p.total_productos || 0), 0)}
                  </p>
                </div>
                <FileText className="text-purple-600" size={32} strokeWidth={2} />
              </div>
            </div>
            <div className="bg-white dark:!bg-slate-900 rounded-lg p-4 shadow-sm ring-1 ring-slate-200 dark:!ring-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:!text-slate-400">Calificación Promedio</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {proveedores.length > 0
                      ? (proveedores.reduce((sum, p) => sum + (p.calificacion_promedio || 0), 0) / proveedores.length).toFixed(1)
                      : '0.0'}
                  </p>
                </div>
                <Star className="text-yellow-600" size={32} strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} strokeWidth={2} />
            <input
              type="text"
              placeholder="Buscar por nombre o NIT..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:!bg-slate-800 dark:!text-white"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:!bg-slate-800 dark:!text-white"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
              <option value="bloqueado">Bloqueados</option>
            </select>
          </div>
        </div>

        {/* Lista de proveedores */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : proveedoresFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto text-gray-400 mb-4" size={48} strokeWidth={2} />
            <p className="text-gray-500 dark:!text-slate-400 text-lg">
              {proveedores.length === 0
                ? 'No hay proveedores registrados'
                : 'No se encontraron proveedores con los filtros actuales'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {proveedoresFiltrados.map((proveedor) => (
              <div
                key={proveedor.id}
                onClick={() => cargarDetalleProveedor(proveedor.id)}
                className="bg-white dark:!bg-slate-900 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5 ring-1 ring-slate-200 dark:!ring-slate-700"
              >
                {/* Header de la tarjeta */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Logo del proveedor */}
                  {proveedor.logo_url ? (
                    <div className="flex-shrink-0">
                      <img
                        src={proveedor.logo_url}
                        alt={`Logo de ${proveedor.razon_social}`}
                        className="w-14 h-14 object-contain rounded bg-white dark:!bg-slate-800 p-1 border border-gray-200 dark:!border-slate-700"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-14 h-14 rounded bg-gray-100 dark:!bg-slate-800 flex items-center justify-center">
                      <Building2 size={24} className="text-gray-400 dark:!text-slate-600" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:!text-white mb-1 truncate">
                      {proveedor.razon_social}
                    </h3>
                    <p className="text-sm text-gray-500 dark:!text-slate-400">
                      NIT: {proveedor.nit}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(proveedor.estado)}`}>
                    {getEstadoLabel(proveedor.estado)}
                  </span>
                </div>

                {/* Información de contacto */}
                <div className="space-y-2 mb-4">
                  {proveedor.telefono_contacto && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:!text-slate-400">
                      <Phone size={16} strokeWidth={2} />
                      <span>{proveedor.telefono_contacto}</span>
                    </div>
                  )}
                  {proveedor.correo && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:!text-slate-400">
                      <Mail size={16} strokeWidth={2} />
                      <span className="truncate">{proveedor.correo}</span>
                    </div>
                  )}
                  {proveedor.ciudad && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:!text-slate-400">
                      <MapPin size={16} strokeWidth={2} />
                      <span>{proveedor.ciudad}</span>
                    </div>
                  )}
                </div>

                {/* Estadísticas del proveedor */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:!border-slate-700">
                  <div className="flex items-center gap-2">
                    <Package size={16} strokeWidth={2} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:!text-slate-400">
                      {proveedor.total_productos || 0} productos
                    </span>
                  </div>
                  {renderStars(proveedor.calificacion_promedio)}
                </div>

                {/* Botones de acción rápida */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200 dark:!border-slate-700">
                  {proveedor.telefono_whatsapp && (
                    <a
                      href={`https://wa.me/${proveedor.telefono_whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 hover:bg-slate-100 dark:hover:!bg-slate-800 rounded-lg transition-colors"
                      title="Contactar por WhatsApp"
                    >
                      <img src="/message.png" alt="WhatsApp" width={32} height={32} style={{objectFit: 'contain'}} />
                    </a>
                  )}
                  {proveedor.sitio_web && (
                    <a
                      href={proveedor.sitio_web}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Visitar sitio web"
                    >
                      <Globe size={24} strokeWidth={2} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Nuevo Proveedor */}
        {mostrarFormulario && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white dark:!bg-slate-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ring-1 ring-slate-200 dark:!ring-slate-700">
              {/* Header */}
              <div className="sticky top-0 bg-white dark:!bg-slate-900 border-b border-gray-200 dark:!border-slate-700 px-6 py-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:!text-white">
                    Nuevo Proveedor
                  </h2>
                  <button
                    onClick={() => setMostrarFormulario(false)}
                    className="text-gray-400 hover:text-gray-600 dark:!hover:text-slate-300"
                  >
                    <X size={24} strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="p-6 space-y-6">
                {/* Datos Básicos */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:!text-white">Datos Básicos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                        NIT/RUT * <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.nit}
                        onChange={(e) => setFormData({...formData, nit: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                        placeholder="Ej: 900123456-7"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                        Razón Social * <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.razon_social}
                        onChange={(e) => setFormData({...formData, razon_social: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                        placeholder="Ej: Mi Empresa SAS"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                        Nombre Comercial
                      </label>
                      <input
                        type="text"
                        value={formData.nombre_comercial}
                        onChange={(e) => setFormData({...formData, nombre_comercial: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                        placeholder="Ej: MiMarca"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                        Ciudad
                      </label>
                      {loadingCiudades ? (
                        <div className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white text-gray-500">
                          Cargando ciudades...
                        </div>
                      ) : (
                        <select
                          value={formData.ciudad}
                          onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                        >
                          <option value="">Seleccione una ciudad</option>
                          {ciudades.map((ciudad) => (
                            <option key={ciudad.id} value={ciudad.name}>
                              {ciudad.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:!text-white">Información de Contacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        value={formData.telefono}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                        placeholder="Ej: +57 1 1234567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                        WhatsApp
                      </label>
                      <input
                        type="text"
                        value={formData.telefono_whatsapp}
                        onChange={(e) => setFormData({...formData, telefono_whatsapp: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                        placeholder="Ej: +57 3001234567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        value={formData.correo_electronico}
                        onChange={(e) => setFormData({...formData, correo_electronico: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                        placeholder="Ej: contacto@empresa.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={formData.direccion}
                        onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                        placeholder="Ej: Calle 123 # 45-67"
                      />
                    </div>
                  </div>
                </div>

                {/* Persona de Contacto */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:!text-white">Persona de Contacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                        Nombre del Contacto
                      </label>
                      <input
                        type="text"
                        value={formData.contacto_principal}
                        onChange={(e) => setFormData({...formData, contacto_principal: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                        placeholder="Ej: Juan Pérez"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                        Cargo del Contacto
                      </label>
                      <input
                        type="text"
                        value={formData.cargo_contacto}
                        onChange={(e) => setFormData({...formData, cargo_contacto: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                        placeholder="Ej: Gerente de Ventas"
                      />
                    </div>
                  </div>
                </div>

                {/* Sitio Web */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:!text-white">Sitio Web</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                      URL del Sitio Web
                    </label>
                    <input
                      type="url"
                      value={formData.sitio_web}
                      onChange={(e) => setFormData({...formData, sitio_web: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                      placeholder="Ej: https://www.miempresa.com"
                    />
                  </div>
                </div>

                {/* Condiciones Comerciales */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:!text-white">Condiciones Comerciales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                        Plazo de Pago (días)
                      </label>
                      <input
                        type="number"
                        value={formData.plazo_pago_dias}
                        onChange={(e) => setFormData({...formData, plazo_pago_dias: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                        placeholder="Ej: 30"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                        Descuento Comercial (%)
                      </label>
                      <input
                        type="number"
                        value={formData.descuento_comercial}
                        onChange={(e) => setFormData({...formData, descuento_comercial: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                        placeholder="Ej: 5"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:!text-slate-300 mb-1">
                        Límite de Crédito
                      </label>
                      <input
                        type="number"
                        value={formData.limite_credito}
                        onChange={(e) => setFormData({...formData, limite_credito: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg dark:!bg-slate-800 dark:!text-white"
                        placeholder="Ej: 10000000"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white dark:!bg-slate-900 border-t border-gray-200 dark:!border-slate-700 px-6 py-4 rounded-b-lg">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setMostrarFormulario(false)}
                    className="px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:!bg-slate-800 dark:!text-white"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={crearProveedor}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Guardando...' : 'Crear Proveedor'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VISTA: DETALLE DEL PROVEEDOR
  if (vistaActual === 'detalle' && proveedorSeleccionado) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Botón volver */}
        <button
          onClick={() => setVistaActual('lista')}
          className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:!text-white"
        >
          <X size={20} strokeWidth={2} />
          <span>Volver a la lista</span>
        </button>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white dark:!bg-slate-900 rounded-lg shadow-sm p-6 ring-1 ring-slate-200 dark:!ring-slate-700">
            {/* Header del proveedor */}
            <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-200 dark:!border-slate-700">
              <div className="flex items-start gap-6 flex-1">
                {/* Logo del proveedor */}
                {proveedorSeleccionado.logo_url ? (
                  <div className="flex-shrink-0">
                    <img
                      src={proveedorSeleccionado.logo_url}
                      alt={`Logo de ${proveedorSeleccionado.razon_social}`}
                      className="w-24 h-24 object-contain rounded-lg bg-white dark:!bg-slate-800 p-2 border border-gray-200 dark:!border-slate-700"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : proveedorSeleccionado.sitio_web ? (
                  <div className="flex-shrink-0 w-24 h-24 rounded-lg bg-gray-100 dark:!bg-slate-800 flex items-center justify-center border border-gray-200 dark:!border-slate-700">
                    <Building2 size={40} className="text-gray-400 dark:!text-slate-600" />
                  </div>
                ) : null}

                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:!text-white mb-2">
                    {proveedorSeleccionado.razon_social}
                  </h1>
                  <p className="text-gray-600 dark:!text-slate-400 mb-4">
                    NIT: {proveedorSeleccionado.nit}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(proveedorSeleccionado.estado)}`}>
                      {getEstadoLabel(proveedorSeleccionado.estado)}
                    </span>
                    {renderStars(proveedorSeleccionado.calificacion_promedio)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEditar}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:!bg-slate-800 transition-colors dark:!text-white"
                >
                  <Edit size={18} strokeWidth={2} />
                  <span>Editar</span>
                </button>
                <button
                  onClick={handleEliminar}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:!bg-red-900/20 transition-colors"
                >
                  <Trash2 size={18} strokeWidth={2} />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>

            {/* Información de contacto */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:!text-white mb-3">
                  Información de Contacto
                </h3>
                <div className="space-y-3">
                  {proveedorSeleccionado.telefono_contacto && (
                    <div className="flex items-center gap-3">
                      <Phone className="text-gray-400" size={20} strokeWidth={2} />
                      <span className="text-gray-700 dark:!text-slate-300">
                        {proveedorSeleccionado.telefono_contacto}
                      </span>
                    </div>
                  )}
                  {proveedorSeleccionado.telefono_whatsapp && (
                    <div className="flex items-center gap-3">
                      <a
                        href={`https://wa.me/${proveedorSeleccionado.telefono_whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <img src="/message.png" alt="WhatsApp" width={32} height={32} style={{objectFit: 'contain'}} />
                        <span>Contactar</span>
                      </a>
                    </div>
                  )}
                  {proveedorSeleccionado.correo && (
                    <div className="flex items-center gap-3">
                      <Mail className="text-gray-400" size={20} strokeWidth={2} />
                      <span className="text-gray-700 dark:!text-slate-300">
                        {proveedorSeleccionado.correo}
                      </span>
                    </div>
                  )}
                  {proveedorSeleccionado.ciudad && (
                    <div className="flex items-center gap-3">
                      <MapPin className="text-gray-400" size={20} strokeWidth={2} />
                      <span className="text-gray-700 dark:!text-slate-300">
                        {proveedorSeleccionado.ciudad}
                      </span>
                    </div>
                  )}
                  {proveedorSeleccionado.sitio_web && (
                    <div className="flex items-center gap-3">
                      <a
                        href={proveedorSeleccionado.sitio_web}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-gray-300 dark:!border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:!bg-slate-800 transition-colors"
                        title="Visitar sitio web"
                      >
                        <Globe size={24} strokeWidth={2} />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Condiciones comerciales */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:!text-white mb-3">
                  Condiciones Comerciales
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:!text-slate-400">Plazo de pago:</span>
                    <span className="font-medium text-gray-900 dark:!text-white">
                      {proveedorSeleccionado.plazo_pago_dias} días
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:!text-slate-400">Descuento comercial:</span>
                    <span className="font-medium text-gray-900 dark:!text-white">
                      {proveedorSeleccionado.descuento_comercial}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:!text-white">
                  Productos ({productosProveedor.length || 0})
                </h3>
                <button
                  onClick={() => setMostrarModalProducto(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus size={16} strokeWidth={2} />
                  <span>Agregar Producto</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productosProveedor && productosProveedor.length > 0 ? (
                  productosProveedor.map((producto) => (
                    <div
                      key={producto.id}
                      className="p-4 border border-gray-200 dark:!border-slate-700 dark:!bg-slate-800 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-medium text-gray-900 dark:!text-white mb-2">
                        {producto.nombre_producto}
                      </h4>
                      {producto.codigo_producto && (
                        <p className="text-xs text-gray-500 dark:!text-slate-400 mb-2">
                          Código: {producto.codigo_producto}
                        </p>
                      )}
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600 dark:!text-slate-400">
                          Precio: ${parseFloat(producto.precio_unitario).toFixed(2)} {producto.moneda}
                        </p>
                        {producto.tiempo_entrega_dias && (
                          <p className="text-gray-600 dark:!text-slate-400">
                            Entrega: {producto.tiempo_entrega_dias} días
                          </p>
                        )}
                        <p className="text-gray-600 dark:!text-slate-400">
                          Disponible: <span className={`font-medium ${producto.disponible ? 'text-green-600' : 'text-red-600'}`}>
                            {producto.disponible ? 'Sí' : 'No'}
                          </span>
                        </p>
                        {producto.stock_actual !== null && producto.stock_actual !== undefined && (
                          <p className="text-gray-600 dark:!text-slate-400">
                            Stock: {producto.stock_actual}
                          </p>
                        )}
                        {producto.categoria && (
                          <p className="text-gray-600 dark:!text-slate-400">
                            Categoría: {producto.categoria}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500 dark:!text-slate-400">
                    No hay productos registrados. Haz clic en "Agregar Producto" para añadir uno.
                  </div>
                )}
              </div>
            </div>

            {/* Pedidos */}
            {proveedorSeleccionado.total_pedidos > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:!text-white mb-3">
                  Pedidos ({proveedorSeleccionado.total_pedidos})
                </h3>
                <div className="text-center py-8 text-gray-500 dark:!text-slate-400">
                  Historial de pedidos disponible próximamente
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }


  return null;
}
