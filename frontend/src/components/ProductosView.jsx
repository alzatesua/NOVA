// src/views/ProductsView.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo
} from 'react';
import ProductsTable from './ProductsTable';
import ProductCard from './ProductCard';
import {
  actualizarfila,
  createProduct,
  subirImagenProducto,
  fetchCategorias,
  fetchMarcas,
  fetchDescuentos,
  fetchIva,
  fetchTipoMedida,
  fetchSucursales,
  fetchBodegas
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../utils/toast';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronDownIcon,
  TruckIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/solid';
import Modal from '../components/Modal';


export default function ProductsView({
  products: initialProducts = [],
  loading = false,
  onCreated
}) {
  const { rol, tokenUsuario, subdominio, logout } = useAuth();
  const usuario = localStorage.getItem('usuario');

  // ——— Estados búsqueda & filtros ———
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState('todos');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // ——— Productos & scroll infinito ———
  const [products, setProducts] = useState(initialProducts);
  const [visibleCount, setVisibleCount] = useState(10);
  const loadMoreRef = useRef(null);
  const [file, setFile] = useState(null);

  //opciones de select
  const [categorias, setCategorias] = useState([]);
  const [isLoadingCategorias, setIsLoadingCategorias] = useState(false);
  const [showTrasladosForm, setShowTrasladosForm] = useState(false);
  const [marcas, setMarcas] = useState([]);
  const [isLoadingMarcas, setIsLoadingMarcas] = useState(false);
  const [descuentos, setDescuentos] = useState([]);
  const [isLoadingDescuentos, setIsLoadingDescuentos] = useState(false);
  const [ivas, setIvas] = useState([]);
  const [isLoadingIva, setIsLoadingIva] = useState(false);
  const [tiposMedida, setTiposMedida] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [isLoadingSucursales, setIsLoadingSucursales] = useState(false);
  const [bodegas, setBodegas] = useState([]);
  const [isLoadingBodegas, setIsLoadingBodegas] = useState(false);
  const [newUser, setNewUser] = useState({ sucursal_id: '' });






  useEffect(() => {
    setProducts(initialProducts);
    setVisibleCount(10);
  }, [initialProducts]);

  // ——— Filtrado ———
  // Cambiar esta sección
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (
        searchTerm &&
        !p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      ) return false;
      
      // Ahora usamos stock_total en lugar de stock
      if (quickFilter === 'disponible' && p.stock_total <= 0) return false;
      if (quickFilter === 'agotados' && p.stock_total > 0) return false;
      if (quickFilter === 'destacados' && !p.is_featured) return false;
      
      // Categoria ahora es un objeto
      if (categoryFilter && p.categoria?.id !== Number(categoryFilter))
        return false;
        
      if (priceMin !== '' && parseFloat(p.precio) < parseFloat(priceMin)) return false;
      if (priceMax !== '' && parseFloat(p.precio) > parseFloat(priceMax)) return false;
      if (dateFilter && new Date(p.creado_en) < new Date(dateFilter))
        return false;
      return true;
    });
  }, [
    products,
    searchTerm,
    quickFilter,
    categoryFilter,
    priceMin,
    priceMax,
    dateFilter
  ]);

  // ——— Infinite scroll ———
  useEffect(() => {
    if (visibleCount >= filteredProducts.length) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount(v => Math.min(v + 10, filteredProducts.length));
          obs.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0.1 }
    );
    if (loadMoreRef.current) obs.observe(loadMoreRef.current);
    return () => obs.disconnect();
  }, [visibleCount, filteredProducts.length]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  // ——— UI de vista y edición ———
  const [viewMode, setViewMode] = useState('card');
  const [expandedId, setExpandedId] = useState(null);
  const [editStates, setEditStates] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);

  // ——— Estados “Nuevo Producto” ———
  const [newProducts, setNewProducts] = useState([
    {
      nombre: '',
      descripcion: '',
      categoria: '',
      marca: '',
      codigo_barras: '',
      iva: '',
      atributo: '',
      valor_atributo: '',
      stock: '',
      precio: '',
      previewImage: null,
      file: null,
    },
  ]);
  const [previewImage, setPreviewImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [creating, setCreating] = useState(false);

  // ——— Handlers “Nuevo Producto” ———
 const handleNewFieldChange = useCallback((index, e) => {
  const { name, value } = e.target;
  setNewProducts(prev => {
    const updated = [...prev];
    updated[index] = {
      ...updated[index],
      [name]: value,
    };
    return updated;
  });
}, []);



  const handleNewImageChange = useCallback(
    async e => {
      const file = e.target.files[0];
      if (!file) return;
      setPreviewImage(URL.createObjectURL(file));
      setIsUploadingImage(true);
      try {
        const { imagenUrl: url } = await subirImagenProducto({
          id: 0,
          usuario,
          tokenUsuario,
          subdominio,
          categoriaId: newProduct.categoria,   // <-- aquí está el error
          imagen: file
        });
        setNewProduct(prev => ({ ...prev, imagen_producto: url }));  // <-- aquí también
        showToast('success', 'Imagen subida con éxito');
      } catch (err) {
        showToast('error', err.message || 'Fallo al subir imagen');
      } finally {
        setIsUploadingImage(false);
      }
    },
    [usuario, tokenUsuario, subdominio, newProducts.categoria]
  );


  async function uploadImageProducto({ id, usuario, token, subdominio, categoriaId, imagen }) {
    const result = await subirImagenProducto({
      id,
      usuario,
      token, 
      subdominio,
      categoriaId,
      imagen
    });

    return result.imagenUrl; // ✅ Retorna solo la URL
  }


  const handleSubmitNew = useCallback(
    async e => {
      e.preventDefault();
      setCreating(true);

      try {
        // 1. Crear todos los productos enviando los datos (sin imagen aún)
        const productosDatos = newProducts.map(p => ({
          nombre: p.nombre,
          descripcion: p.descripcion,
          categoria: Number(p.categoria),
          marca: Number(p.marca),
          codigo_barras: p.codigo_barras,
          imagen_producto: '', // se subirá después
          iva: Number(p.iva),
          atributo: p.atributo,
          valor_atributo: p.valor_atributo,
          imei: p.imei,
          sucursal: Number(p.sucursal_id),
          bodega: p.bodega ,
          stock: Number(p.stock),
          precio: Number(p.precio),
          descuento: Number(p.descuento),
          tipo_medida: Number(p.tipo_medida)
        }));

        console.log("productosDatos", productosDatos)

        const response = await createProduct({
          usuario,
          token: localStorage.getItem('token_usuario'),
          subdominio,
          datos: productosDatos
        });

        if (!response || response.length !== newProducts.length) {
          throw new Error('Error creando productos: respuesta inesperada');
        }

        // 2. Para cada producto creado, si tiene imagen, subirla
        for (let i = 0; i < response.length; i++) {
          const productoCreado = response[i];
          const productoLocal = newProducts[i];
          const categoria = Number(productoLocal.categoria);

          if (productoLocal.file) {
            setIsUploadingImage(true);

            const imagenUrl = await uploadImageProducto({
              id: productoCreado.id,
              usuario,
              token: localStorage.getItem('token_usuario'),
              subdominio,
              categoriaId: categoria,
              imagen: productoLocal.file
            });

            // Opcional: actualizar el producto local con la url de imagen subida
            setNewProducts(prev => {
              const updated = [...prev];
              updated[i].imagen_producto = imagenUrl;
              return updated;
            });
          }
        }

        showToast('success', 'Productos creados con éxito');
        setNewProducts([
          {
            nombre: '',
            descripcion: '',
            categoria: '',
            marca: '',
            codigo_barras: '',
            iva: '',
            atributo: '',
            valor_atributo: '',
            stock: '',
            precio: '',
            previewImage: null,
            file: null,
          },
        ]);
        setShowCreateForm(false);
        onCreated();

      } catch (err) {
        showToast('error', err.message || 'Error al crear productos');
      } finally {
        setCreating(false);
        setIsUploadingImage(false);
      }
    },
    [newProducts, usuario, subdominio, onCreated, tokenUsuario]
  );
  // ——— Handlers edición / detalles ———
  const toggleDetails = useCallback(
    id => {
      setExpandedId(x => (x === id ? null : id));
      setEditStates(prev => ({
        ...prev,
        [id]: {
          editing: false,
          fields: products.find(p => p.id === id) || {}
        }
      }));
    },
    [products]
  );
  const toggleEdit = useCallback(id => {
    setEditStates(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        editing: !prev[id]?.editing
      }
    }));
  }, []);
  const handleFieldChange = useCallback((id, field, value) => {
    setEditStates(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        fields: {
          ...prev[id].fields,
          [field]: value
        }
      }
    }));
  }, []);
  const handleSave = useCallback(
    async id => {
      const updated = editStates[id].fields;
      try {
        await actualizarfila({
          rol,
          token: localStorage.getItem('token_usuario'),
          usuario,
          tokenUsuario,
          subdominio,
          tabla: 'productos',
          columna_filtro: 'id',
          valor_filtro: id,
          datos: updated
        });
        showToast('success', 'Producto actualizado correctamente');
        toggleEdit(id);
        setProducts(prev =>
          prev.map(p => (p.id === id ? { ...p, ...updated } : p))
        );
      } catch (err) {
        if (err.isNotFound) logout();
        showToast('error', err.message || 'Error al actualizar producto');
      }
    },
    [editStates, rol, tokenUsuario, subdominio, usuario, toggleEdit, logout]
  );
  const handleToggleActive = useCallback(
    async p => {
      const newActive = !p.is_active;
      if (!newActive) {
        const { isConfirmed } = await Swal.fire({
          title: '¿Desactivar producto?',
          text: `"${p.nombre}" pasará a inactivo.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, desactivar',
          cancelButtonText: 'Cancelar'
        });
        if (!isConfirmed) return;
      }
      setProducts(prev =>
        prev.map(x =>
          x.id === p.id ? { ...x, is_active: newActive } : x
        )
      );
      try {
        await actualizarfila({
          rol,
          token: localStorage.getItem('token_usuario'),
          usuario,
          tokenUsuario,
          subdominio,
          tabla: 'productos',
          columna_filtro: 'id',
          valor_filtro: p.id,
          datos: { is_active: newActive }
        });
        showToast(
          'success',
          `Producto ${newActive ? 'activado' : 'inactivado'}`
        );
      } catch (err) {
        setProducts(prev =>
          prev.map(x =>
            x.id === p.id ? { ...x, is_active: p.is_active } : x
          )
        );
        if (err.isNotFound) logout();
        showToast('error', err.message || 'Error al cambiar estado');
      }
    },
    [rol, tokenUsuario, subdominio, usuario, logout]
  );

  // Manejar actualización de imagen - solo actualiza el producto específico
  const handleImageUpdate = useCallback((productId, imageUrl) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === productId ? { ...p, imagen_producto: imageUrl, imagenUrl: imageUrl } : p
      )
    );
  }, []);



  //-------- SELECT --------

  //obtener informacion de categorias
  useEffect(() => {
    const cargarCategorias = async () => {
      setIsLoadingCategorias(true);
      try {
        const response = await fetchCategorias({ tokenUsuario, usuario, subdominio });
        const datosCategorias = response?.datos || [];
        setCategorias(datosCategorias);
      } catch (error) {
        console.error('Error cargando categorías:', error);
      } finally {
        setIsLoadingCategorias(false);
      }
    };

    cargarCategorias();
  }, [tokenUsuario, usuario, subdominio]);



  //obtener información de marcas
  useEffect(() => {
    const cargarMarcas = async () => {
      setIsLoadingMarcas(true);
      try {
        const response = await fetchMarcas({ tokenUsuario, usuario, subdominio });
        const datosMarcas = response?.datos || [];
        setMarcas(datosMarcas);
      } catch (error) {
        console.error('Error cargando marcas:', error);
      } finally {
        setIsLoadingMarcas(false);
      }
    };

    cargarMarcas();
  }, [tokenUsuario, usuario, subdominio]);


  //ontener información de iva
  useEffect(() => {
    const cargarIvas = async () => {
      setIsLoadingIva(true);
      try {
        const response = await fetchIva({ tokenUsuario, usuario, subdominio });
        const datosIva = response?.datos || [];
        setIvas(datosIva);
      } catch (error) {
        console.error('Error cargando IVA:', error);
      } finally {
        setIsLoadingIva(false);
      }
    };

    cargarIvas();
  }, [tokenUsuario, usuario, subdominio]);



  useEffect(() => {
    const cargarDescuentos = async () => {
      setIsLoadingDescuentos(true);
      try {
        const response = await fetchDescuentos({ tokenUsuario, usuario, subdominio });
        const datosDescuentos = response?.datos || [];
        setDescuentos(datosDescuentos);
      } catch (error) {
        console.error('Error cargando descuentos:', error);
      } finally {
        setIsLoadingDescuentos(false);
      }
    };

    cargarDescuentos();
  }, [tokenUsuario, usuario, subdominio]);

  useEffect(() => {
    const cargarTiposMedida = async () => {
      setIsLoading(true);
      try {
        const response = await fetchTipoMedida({ tokenUsuario, usuario, subdominio });
        const datos = response?.datos || [];
        setTiposMedida(datos);
      } catch (error) {
        console.error('Error cargando tipos de medida:', error);
      } finally {
        setIsLoading(false);
      }
    };

    cargarTiposMedida();
  }, [tokenUsuario, usuario, subdominio]);

  //------ CARGAR TODAS LAS SUCURSALES -------
  useEffect(() => {
    const cargarSucursales = async () => {
      if (rol !== 'admin') return; // según tu lógica original

      setIsLoadingSucursales(true);
      try {
        const response = await fetchSucursales({ rol, tokenUsuario, usuario, subdominio });
        const datosSucursales = response?.datos || [];
        setSucursales(datosSucursales);
      } catch (error) {
        console.error('Error cargando sucursales:', error);
      } finally {
        setIsLoadingSucursales(false);
      }
    };

    cargarSucursales();
  }, [rol, tokenUsuario, usuario, subdominio]);

  //------ CARGAR TODAS LAS BODEGAS ------
    useEffect(() => {
    const cargarSucursales = async () => {
      if (rol !== 'admin') return; // según tu lógica original

      setIsLoadingBodegas(true);
      try {
        const response = await fetchBodegas({ rol, tokenUsuario, usuario, subdominio });
        const datosBodegas = response?.datos || [];
        setBodegas(datosBodegas);
      } catch (error) {
        console.error('Error cargando bodegas:', error);
      } finally {
        setIsLoadingBodegas(false);
      }
    };

    cargarSucursales();
  }, [rol, tokenUsuario, usuario, subdominio]);

  return (
    <section className="space-y-1">
      {/* ——— Cabecera: search + filtros rápidos + “Nuevo” ——— */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
        {/* Búsqueda + chips rápidos */}
        <div className="flex flex-1 items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <input
              type="text"
              placeholder="Buscar productos…"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {['Todos', 'Disponible', 'Agotados', 'Destacados'].map(label => (
              <button
                key={label}
                onClick={() => setQuickFilter(label.toLowerCase())}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-sm ${
                  quickFilter === label.toLowerCase()
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros avanzados + nuevo */}
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <button
            onClick={() => setShowAdvancedFilters(f => !f)}
            className="flex items-center text-sm font-medium text-blue-600 hover:underline"
          >
            Filtros avanzados
            <ChevronDownIcon
              className={`h-4 w-4 ml-1 transition-transform ${
                showAdvancedFilters ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </button>
          <button
            onClick={() => setShowCreateForm(f => !f)}
            className="flex items-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {showCreateForm ? 'Cancelar' : 'Nuevo Producto'}
          </button>
          

        </div>
      </div>

      {/* ——— Panel Filtros Avanzados ——— */}
      {showAdvancedFilters && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              className="border rounded px-3 py-2 text-sm"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              <option value="1">Categoría 1</option>
              <option value="2">Categoría 2</option>
            </select>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Precio min"
                className="w-full border rounded px-3 py-2 text-sm"
                value={priceMin}
                onChange={e => setPriceMin(e.target.value)}
              />
              <span className="text-gray-500">–</span>
              <input
                type="number"
                placeholder="Precio max"
                className="w-full border rounded px-3 py-2 text-sm"
                value={priceMax}
                onChange={e => setPriceMax(e.target.value)}
              />
            </div>
            <input
              type="date"
              className="border rounded px-3 py-2 text-sm"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ——— Modal Nuevo Producto ——— */}
      {showCreateForm && (
        <Modal onClose={() => setShowCreateForm(false)}>
          <h4 className="text-2xl font-semibold text-gray-800 mb-4">Crear Productos</h4>
          <form onSubmit={handleSubmitNew} className="space-y-6">
            <div className="space-y-8">
              {newProducts.map((product, index) => (
                <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-6 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                  {/* Columna Izquierda: Imagen */}
                  <div className="flex flex-col items-center">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Imagen del Producto #{index + 1}
                    </label>

                    <div className="relative w-full h-80 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                      {product.previewImage ? (
                        <img
                          src={product.previewImage}
                          alt={`Preview ${index}`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <ArrowUpTrayIcon className="h-8 w-8 text-gray-600 dark:text-gray-400 mb-2" />
                      )}

                      <input
                        id={`file-upload-${index}`}
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const selected = e.target.files[0];
                          if (selected) {
                            setNewProducts(prev => {
                              const updated = [...prev];
                              updated[index].file = selected;
                              updated[index].previewImage = URL.createObjectURL(selected);
                              return updated;
                            });
                          }
                        }}
                        className="hidden"
                      />

                      <label
                        htmlFor={`file-upload-${index}`}
                        className="
                          absolute inset-0
                          flex flex-col items-center justify-center
                          bg-transparent
                          cursor-pointer
                          rounded-lg
                          hover:bg-gray-200 dark:hover:bg-gray-700 hover:bg-opacity-30
                          transition
                        "
                      >
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400"></span>
                      </label>
                    </div>
                  </div>

                  {/* Columna Derecha: Campos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nombre */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                      <input
                        name="nombre"
                        placeholder="Aspiradora Dyson"
                        required
                        value={product.nombre}
                        onChange={e => {
                          const value = e.target.value;
                          setNewProducts(prev => {
                            const updated = [...prev];
                            updated[index].nombre = value;
                            return updated;
                          });
                        }}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100
                                  focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                      />
                    </div>

                    {/* Descripción */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Descripción
                      </label>
                      <textarea
                        name="descripcion"
                        rows={3}
                        placeholder="Tecnología ciclónica, sin bolsa"
                        required
                        value={product.descripcion}
                        onChange={e => {
                          const value = e.target.value;
                          setNewProducts(prev => {
                            const updated = [...prev];
                            updated[index].descripcion = value;
                            return updated;
                          });
                        }}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100
                                  focus:outline-none focus:ring-2 focus:ring-blue-400 transition resize-none"
                      />
                    </div>

                    {/* Categoría */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                      <select
                        name="categoria"
                        required
                        value={newProducts[index].categoria}
                        onChange={e => {
                          const value = e.target.value;
                          setNewProducts(prev => {
                            const updated = [...prev];
                            updated[index].categoria = value;
                            return updated;
                          });
                        }}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100
                          focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                      >
                        <option value="">Selecciona...</option>
                        {isLoadingCategorias ? (
                          <option disabled>Cargando categorías...</option>
                        ) : (
                          categorias.map(cat => (
                            <option key={cat.id} value={cat.id_categoria}>
                              {cat.nombre}
                            </option>
                          ))
                        )}
                      </select>
                    </div>


                    

                    {/* Marca */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marca</label>
                        <select
                          name="marca"
                          required
                          value={newProducts[index].marca}
                          onChange={e => {
                            const value = e.target.value;
                            setNewProducts(prev => {
                              const updated = [...prev];
                              updated[index].marca = value;
                              return updated;
                            });
                          }}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100
                            focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                        >
                          <option value="">Selecciona una marca...</option>
                          {isLoadingMarcas ? (
                            <option disabled>Cargando marcas...</option>
                          ) : (
                            marcas.map(marca => (
                              <option key={marca.id} value={marca.id_marca}>
                                {marca.nombre}
                              </option>
                            ))
                          )}
                      </select>
                    </div>

                    {/* Código de Barras */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Código de Barras
                      </label>
                      <input
                        name="codigo_barras"
                        placeholder="0000000000006"
                        required
                        value={product.codigo_barras}
                        onChange={e => {
                          const value = e.target.value;
                          setNewProducts(prev => {
                            const updated = [...prev];
                            updated[index].codigo_barras = value;
                            return updated;
                          });
                        }}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100
                                  focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                      />
                    </div>

                    {/* IVA */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IVA</label>
                      <select
                        name="iva"
                        required
                        value={newProducts[index].iva}
                        onChange={e => {
                          const value = e.target.value;
                          setNewProducts(prev => {
                            const updated = [...prev];
                            updated[index].iva = value;
                            return updated;
                          });
                        }}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100
                          focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                      >
                        <option value="">Selecciona un IVA...</option>
                        {isLoadingIva ? (
                          <option disabled>Cargando IVA...</option>
                        ) : (
                          ivas.map(iva => (
                            <option key={iva.id} value={iva.id_iva}>
                              {iva.porcentaje + '%'}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Descuento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descuento</label>
                      <select
                        name="descuento"
                        required
                        value={newProducts[index].descuento}
                        onChange={e => {
                          const value = e.target.value;
                          setNewProducts(prev => {
                            const updated = [...prev];
                            updated[index].descuento = value;
                            return updated;
                          });
                        }}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100
                          focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                      >
                        <option value="">Selecciona un descuento...</option>
                        {isLoadingDescuentos ? (
                          <option disabled>Cargando descuentos...</option>
                        ) : (
                          descuentos.map(desc => (
                            <option key={desc.id} value={desc.id_descuento}>
                              {desc.porcentaje+'%'}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Tipo de medida */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Medida</label>
                       <select
                        name="tipo_medida"
                        required
                        value={newProducts[index].tipo_medida}
                        onChange={e => {
                          const value = e.target.value;
                          setNewProducts(prev => {
                            const updated = [...prev];
                            updated[index].tipo_medida = value;
                            return updated;
                          });
                        }}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100
                          focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                      >
                        <option value="">Selecciona un tipo de medida...</option>
                        {isLoading ? (
                          <option disabled>Cargando tipos de medida...</option>
                        ) : (
                          tiposMedida.map(tipo => (
                            <option key={tipo.id} value={tipo.id_tipo_medida}>
                              {tipo.nombre}
                            </option>
                          ))
                        )}
                      </select>
                    </div>


                    {/* Atributo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Atributo</label>
                      <input
                        name="atributo"
                        placeholder="Potencia"
                        value={product.atributo}
                        onChange={e => {
                          const value = e.target.value;
                          setNewProducts(prev => {
                            const updated = [...prev];
                            updated[index].atributo = value;
                            return updated;
                          });
                        }}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100
                                  focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                      />
                    </div>

                    {/* Valor Atributo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Valor Atributo
                      </label>
                      <input
                        name="valor_atributo"
                        placeholder="1200W"
                        value={product.valor_atributo}
                        onChange={e => {
                          const value = e.target.value;
                          setNewProducts(prev => {
                            const updated = [...prev];
                            updated[index].valor_atributo = value;
                            return updated;
                          });
                        }}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100
                                  focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                      />
                    </div>

                    {/* Sucursal */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sucursal</label>
                      <select
                        name="sucursal_id"
                        value={newProducts[index].sucursal_id ?? ''}   // fallback para controlado
                        onChange={e => {
                          const value = Number(e.target.value) || null;
                          setNewProducts(prev => {
                            const updated = [...prev];
                            updated[index].sucursal_id = value;
                            updated[index].bodega = null;              // resetear bodega al cambiar sucursal
                            return updated;
                          });
                        }}
                        className="mt-1 block w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1 text-sm"
                      >
                        <option value="">Seleccione una sucursal</option>
                        {isLoadingSucursales ? (
                          <option disabled>Cargando sucursales...</option>
                        ) : (
                          sucursales.map(suc => (
                            <option key={suc.id} value={suc.id}>
                              {suc.nombre}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Bodegas */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bodegas</label>
                      <select
                        name="bodega"
                        value={newProducts[index].bodega ?? ''}        // id de la bodega seleccionada
                        onChange={e => {
                          const value = Number(e.target.value) || null;
                          setNewProducts(prev => {
                            const updated = [...prev];
                            updated[index].bodega = value;
                            return updated;
                          });
                        }}
                        className="mt-1 block w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1 text-sm"
                        disabled={!newProducts[index].sucursal_id}     // deshabilitar si no hay sucursal
                      >
                        <option value="">Seleccione una bodega</option>
                        {isLoadingBodegas ? (
                          <option disabled>Cargando bodegas...</option>
                        ) : (
                          bodegas
                            .filter(b =>
                              Number(b.sucursal_id ?? b.id_sucursal ?? b.sucursal) ===
                              Number(newProducts[index].sucursal_id)
                            )
                            .map(bodega => (
                              <option key={bodega.id} value={bodega.id}>
                                {bodega.nombre}
                              </option>
                            ))
                        )}
                      </select>
                    </div>




                    {/* IMEI */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IMEI (Opcional)</label>
                      <input
                        name="imei"
                        type="text"
                        placeholder="123456789012345"
                        value={product.imei || ''}
                        onChange={e => {
                          const value = e.target.value;
                          setNewProducts(prev => {
                            const updated = [...prev];
                            updated[index].imei = value;
                            return updated;
                          });
                        }}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100
                                  focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                      />
                    </div>


                    {/* Stock */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
                      <input
                        name="stock"
                        type="number"
                        placeholder="5"
                        required
                        value={product.stock}
                        onChange={e => {
                          const value = e.target.value;
                          setNewProducts(prev => {
                            const updated = [...prev];
                            updated[index].stock = value;
                            return updated;
                          });
                        }}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100
                                  focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                      />
                    </div>

                    {/* Precio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio</label>
                      <input
                        name="precio"
                        type="text"
                        inputMode="decimal" // teclado numérico en móviles
                        placeholder="1.999.999,50"
                        required
                        value={
                          product.precio !== undefined && product.precio !== null && product.precio !== ""
                            ? new Intl.NumberFormat("es-CL").format(product.precio) // puntos de miles y coma decimal
                            : ""
                        }
                        onChange={e => {
                          // limpiar puntos y cambiar coma por punto
                          const raw = e.target.value.replace(/\./g, "").replace(",", ".");
                          const numericValue = parseFloat(raw) || 0;

                          // Validación: máximo 8 enteros + 2 decimales (max_digits=10 en Django)
                          const partes = raw.split(".");
                          const enteros = partes[0].replace(/\D/g, "");
                          const decimales = partes[1] || "";

                          if (enteros.length > 8 || decimales.length > 2) {
                            showToast(
                              "error",
                              "El precio no puede tener más de 8 dígitos enteros y 2 decimales."
                            );
                            return;
                          }

                          setNewProducts(prev => {
                            const updated = [...prev];
                            updated[index].precio = numericValue;
                            return updated;
                          });
                        }}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100
                                  focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                      />

                      {/* Advertencia visual */}
                      {String(product.precio).replace('.', '').length > 10 && (
                        <p className="mt-1 text-sm text-red-600">
                          El precio excede el máximo permitido (8 dígitos enteros, 2 decimales).
                        </p>
                      )}
                    </div>



                    {/* Botón eliminar producto */}
                    {newProducts.length > 1 && (
                      <div className="sm:col-span-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setNewProducts(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          Eliminar producto
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Botón para agregar otro producto */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setNewProducts(prev => [
                      ...prev,
                      {
                        nombre: '',
                        descripcion: '',
                        categoria: '',
                        marca: '',
                        codigo_barras: '',
                        iva: '',
                        atributo: '',
                        valor_atributo: '',
                        stock: '',
                        precio: '',
                        previewImage: null,
                        file: null,
                      },
                    ]);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  + Agregar otro producto
                </button>
              </div>

              {/* Botones cancelar y crear */}
              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg shadow hover:from-green-600 hover:to-green-700 transition"
                >
                  {creating ? 'Creando…' : (
                    <>
                      <PlusIcon className="h-5 w-5 mr-2" /> Crear Productos
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}


    



      {/* ——— Listado de Productos ——— */}
      {viewMode === 'card' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {visibleProducts.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                isExpanded={expandedId === p.id}
                editingState={editStates[p.id] || { editing: false, fields: p }}
                onToggleDetails={toggleDetails}
                onToggleEdit={toggleEdit}
                onFieldChange={handleFieldChange}
                onSave={handleSave}
                onToggleActive={handleToggleActive}
                onImageUpdate={handleImageUpdate}
                existencias={p.existencias || []}
                stockTotal={p.stock_total}
              />
            ))}
          </div>
          {visibleProducts.length < filteredProducts.length && (
            <div ref={loadMoreRef} className="flex justify-center p-4">
              <svg /* spinner */>…</svg>
            </div>
          )}
        </>
      ) : (
        <ProductsTable products={filteredProducts} loading={loading} />
      )}
    </section>
  );
}
