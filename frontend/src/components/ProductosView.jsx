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
  fetchBodegas,
  obtenerProductosPorBodega
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { showToast } from '../utils/toast';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronDownIcon,
  TruckIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import Modal from '../components/Modal';

// Paleta de colores predefinidos
const COLORES_PALETA = [
  { nombre: 'Rojo', hex: '#EF4444' },
  { nombre: 'Rojo Oscuro', hex: '#B91C1C' },
  { nombre: 'Naranja', hex: '#F97316' },
  { nombre: 'Amarillo', hex: '#EAB308' },
  { nombre: 'Verde Lima', hex: '#84CC16' },
  { nombre: 'Verde', hex: '#22C55E' },
  { nombre: 'Verde Oscuro', hex: '#15803D' },
  { nombre: 'Cian', hex: '#06B6D4' },
  { nombre: 'Azul Claro', hex: '#0EA5E9' },
  { nombre: 'Azul', hex: '#3B82F6' },
  { nombre: 'Azul Oscuro', hex: '#1D4ED8' },
  { nombre: 'Índigo', hex: '#6366F1' },
  { nombre: 'Violeta', hex: '#8B5CF6' },
  { nombre: 'Púrpura', hex: '#A855F7' },
  { nombre: 'Fucsia', hex: '#D946EF' },
  { nombre: 'Rosa', hex: '#EC4899' },
  { nombre: 'Blanco', hex: '#FFFFFF' },
  { nombre: 'Gris Claro', hex: '#F3F4F6' },
  { nombre: 'Gris', hex: '#9CA3AF' },
  { nombre: 'Gris Oscuro', hex: '#4B5563' },
  { nombre: 'Negro', hex: '#000000' },
  { nombre: 'Beige', hex: '#D4B483' },
  { nombre: 'Marrón', hex: '#92400E' },
  { nombre: 'Dorado', hex: '#F59E0B' },
  { nombre: 'Plata', hex: '#C0C0C0' },
  { nombre: 'Bronce', hex: '#CD7F32' },
  { nombre: 'Turquesa', hex: '#40E0D0' },
  { nombre: 'Coral', hex: '#FF7F50' },
  { nombre: 'Terracota', hex: '#E2725B' },
  { nombre: 'Oliva', hex: '#808000' },
];

// Componente de paleta de colores
const ColorPicker = ({ selectedColor, onSelectColor, isDark }) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-9 gap-1.5">
        {COLORES_PALETA.map((color) => (
          <button
            key={color.hex}
            type="button"
            onClick={() => onSelectColor(color)}
            className={`w-7 h-7 rounded-md border transition-all duration-150 ${
              selectedColor?.hex === color.hex
                ? 'border-blue-500 ring-2 ring-blue-300 scale-110 shadow-md'
                : 'border-gray-300 dark:border-gray-600 hover:scale-105 hover:shadow-sm'
            }`}
            style={{ backgroundColor: color.hex }}
            title={color.nombre}
          />
        ))}
      </div>

      {selectedColor && (
        <div className="flex items-center gap-2">
          <span
            className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: selectedColor.hex }}
          />
          <span className="text-xs text-gray-700 dark:text-gray-300">{selectedColor.nombre}</span>
          <button
            type="button"
            onClick={() => onSelectColor(null)}
            className="text-red-500 hover:text-red-700"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default function ProductsView({
  products: initialProducts = [],
  loading = false,
  onCreated
}) {
  const { rol, tokenUsuario, subdominio, logout } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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

  // Estados para filtro por bodega
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState(null);
  const [productosPorBodega, setProductosPorBodega] = useState({});
  const [sucursalActual, setSucursalActual] = useState(null);

  const [newUser, setNewUser] = useState({ sucursal_id: '' });






  useEffect(() => {
    setProducts(initialProducts);
    setVisibleCount(10);
  }, [initialProducts]);

  // ——— Funciones para filtro por bodega ———
  const cargarProductosPorBodega = useCallback(async (bodegaId) => {
    console.log('[ProductosView] cargarProductosPorBodega llamado', {
      bodegaId,
      subdominio,
      usuario,
      hasToken: !!tokenUsuario
    });

    if (!bodegaId || !subdominio || !usuario) {
      console.error('[ProductosView] Faltan parámetros requeridos', {
        hasBodegaId: !!bodegaId,
        hasSubdominio: !!subdominio,
        hasUsuario: !!usuario
      });
      return;
    }

    try {
      console.log('[ProductosView] Llamando a obtenerProductosPorBodega...');
      const response = await obtenerProductosPorBodega({
        usuario,
        tokenUsuario,
        subdominio,
        bodega_id: bodegaId,
        solo_con_stock: true
      });

      console.log('[ProductosView] Respuesta recibida:', response);

      if (response && response.datos) {
        console.log('[ProductosView] Productos recibidos:', response.datos.length);

        // Mapear los productos al formato esperado
        const productosMapeados = response.datos.map(p => ({
          ...p,
          id: p.id,
          nombre: p.nombre,
          sku: p.sku,
          precio: p.precio,
          imagen_producto: p.imagen_producto,
          stock: p.stock_bodega, // Usar stock de la bodega
          stock_total: p.stock_total, // Stock total across warehouses
          reservado: p.reservado_bodega,
          disponible: p.disponible_bodega,
          categoria: { id: p.id_categoria },
          marca: { id: p.id_marca },
          iva: { id: p.id_iva }
        }));

        console.log('[ProductosView] Productos mapeados:', productosMapeados.length);

        setProductosPorBodega(prev => {
          const newState = {
            ...prev,
            [bodegaId]: productosMapeados
          };
          console.log('[ProductosView] Estado productosPorBodega actualizado:', newState);
          return newState;
        });

        return productosMapeados; // Devolver para que Promise.all funcione
      } else {
        console.warn('[ProductosView] Respuesta sin datos:', response);
        return [];
      }
    } catch (error) {
      console.error('[ProductosView] Error cargando productos por bodega:', error);
      showToast('Error al cargar productos de la bodega', 'error');
      return [];
    }
  }, [subdominio, usuario, tokenUsuario]);

  const cambiarBodega = useCallback(() => {
    console.log('[ProductosView] cambiarBodega llamado', {
      totalBodegas: bodegas.length,
      bodegaSeleccionada
    });

    if (bodegas.length === 0) {
      console.warn('[ProductosView] No hay bodegas disponibles');
      showToast('No hay bodegas disponibles', 'warning');
      return;
    }

    // Usar todas las bodegas disponibles (no filtrar por sucursal)
    const listaBodegas = bodegas;
    console.log('[ProductosView] Lista de bodegas:', listaBodegas);

    // Si no hay bodega seleccionada, seleccionar la primera
    if (!bodegaSeleccionada) {
      const primeraBodega = listaBodegas[0];
      console.log('[ProductosView] Seleccionando primera bodega:', primeraBodega);
      setBodegaSeleccionada(primeraBodega.id);
      cargarProductosPorBodega(primeraBodega.id);
      showToast(`Bodega: ${primeraBodega.nombre}`, 'info');
      return;
    }

    // Encontrar índice de la bodega actual
    const indiceActual = listaBodegas.findIndex(b => b.id === bodegaSeleccionada);
    if (indiceActual === -1) {
      console.warn('[ProductosView] Bodega seleccionada no encontrada en la lista');
      // Seleccionar la primera
      const primeraBodega = listaBodegas[0];
      setBodegaSeleccionada(primeraBodega.id);
      cargarProductosPorBodega(primeraBodega.id);
      showToast(`Bodega: ${primeraBodega.nombre}`, 'info');
      return;
    }

    const siguienteIndice = (indiceActual + 1) % listaBodegas.length;
    const siguienteBodega = listaBodegas[siguienteIndice];

    console.log('[ProductosView] Cambiando a siguiente bodega:', {
      actual: listaBodegas[indiceActual]?.nombre,
      siguiente: siguienteBodega?.nombre
    });

    setBodegaSeleccionada(siguienteBodega.id);
    cargarProductosPorBodega(siguienteBodega.id);
    showToast(`Bodega: ${siguienteBodega.nombre}`, 'info');
  }, [bodegas, bodegaSeleccionada, cargarProductosPorBodega]);

  const limpiarFiltroBodega = useCallback(() => {
    console.log('[ProductosView] Limpiando filtro de bodega');
    setBodegaSeleccionada(null);
    // No limpiar productosPorBodega para que se muestren todos los productos de las bodegas asignadas
    showToast('Mostrando productos de todas tus bodegas', 'info');
  }, []);

  // Limpiar todos los filtros
  const limpiarFiltros = useCallback(() => {
    setSearchTerm('');
    setQuickFilter('todos');
    setCategoryFilter('');
    setPriceMin('');
    setPriceMax('');
    setDateFilter('');
    setShowAdvancedFilters(false);
    showToast('Filtros limpiados', 'info');
  }, []);

  // ——— Filtrado ———
  const filteredProducts = useMemo(() => {
    let productosBase = [];

    // Si hay una bodega seleccionada, usar sus productos
    if (bodegaSeleccionada && productosPorBodega[bodegaSeleccionada]) {
      productosBase = productosPorBodega[bodegaSeleccionada];
    }
    // Si no hay bodega seleccionada pero el usuario es vendedor/operario,
    // combinar productos de todas sus bodegas asignadas
    else if (rol === 'vendedor' || rol === 'operario') {
      // Combinar todos los productos de las bodegas del usuario
      const todasLasBodegas = Object.keys(productosPorBodega);
      todasLasBodegas.forEach(bodegaId => {
        productosBase = [...productosBase, ...productosPorBodega[bodegaId]];
      });
      // Eliminar duplicados por id de producto
      const productosUnicos = new Map();
      productosBase.forEach(p => productosUnicos.set(p.id, p));
      productosBase = Array.from(productosUnicos.values());
      console.log('[ProductosView] Productos combinados de todas las bodegas:', productosBase.length);
    }
    // Si no hay bodega seleccionada y es admin/almacen, usar todos los productos
    else {
      productosBase = products;
    }

    // Aplicar filtros adicionales
    return productosBase.filter(p => {
      if (
        searchTerm &&
        !p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      ) return false;

      // Usar stock_total para productos combinados o disponible para una bodega específica
      const stock = bodegaSeleccionada ? (p.disponible ?? p.disponible_bodega ?? 0) : (p.stock_total ?? p.stock ?? 0);
      if (quickFilter === 'disponible' && stock <= 0) return false;
      if (quickFilter === 'agotados' && stock > 0) return false;
      if (quickFilter === 'destacados' && !p.is_featured) return false;

      // Categoria - puede ser objeto o id numérico
      const categoriaId = p.categoria?.id || p.id_categoria;
      if (categoryFilter && categoriaId !== Number(categoryFilter)) return false;

      if (priceMin !== '' && parseFloat(p.precio) < parseFloat(priceMin)) return false;
      if (priceMax !== '' && parseFloat(p.precio) > parseFloat(priceMax)) return false;
      if (dateFilter && p.creado_en && new Date(p.creado_en) < new Date(dateFilter))
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
    dateFilter,
    bodegaSeleccionada,
    productosPorBodega,
    rol
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

  // ——— Estados "Nuevo Producto" ———
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
      // Campos de variante
      talla: '',
      color: null, // { nombre: string, hex: string }
      medida: '',
      variantes: [], // Array de variantes adicionales
      conVariantes: false, // Indica si el producto tendrá variantes
    },
  ]);
  const [previewImage, setPreviewImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [creating, setCreating] = useState(false);

  // Estado para el formulario de variantes
  const [showVariantForm, setShowVariantForm] = useState({});
  const [tempVariant, setTempVariant] = useState({});

  // ——— Handlers "Nuevo Producto" ———
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
          tipo_medida: Number(p.tipo_medida),
          // Incluir variantes si existen
          variantes: p.variantes && p.variantes.length > 0 ? p.variantes : undefined
        }));

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

          console.log('Producto local:', productoLocal);
          console.log('Categoría:', productoLocal.categoria, 'Convertida:', categoria);

          if (productoLocal.file) {
            setIsUploadingImage(true);

            // Verificar que categoria sea válido
            if (!categoria || isNaN(categoria)) {
              console.error('Categoría inválida:', productoLocal.categoria);
              showToast('error', 'La categoría es inválida. Por favor selecciona una categoría.');
              continue;
            }

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
    const cargarBodegas = async () => {
      console.log('[ProductosView] Cargando bodegas...', { rol, subdominio, usuario });

      setIsLoadingBodegas(true);
      try {
        const response = await fetchBodegas({ rol, tokenUsuario, usuario, subdominio });
        console.log('[ProductosView] Respuesta fetchBodegas:', response);
        let datosBodegas = response?.datos || [];

        // Filtrar bodegas según las asignadas al usuario (para vendedores y operarios)
        const bodegasSeleccionadas = localStorage.getItem('bodegas_seleccionadas');
        if (bodegasSeleccionadas) {
          const bodegasIds = JSON.parse(bodegasSeleccionadas);
          if (bodegasIds.length > 0) {
            console.log('[ProductosView] Filtrando bodegas por IDs:', bodegasIds);
            datosBodegas = datosBodegas.filter(b => bodegasIds.includes(b.id));
            console.log('[ProductosView] Bodegas después del filtro:', datosBodegas.length);

            // Para vendedor/operario: cargar productos de todas sus bodegas
            if (datosBodegas.length > 0 && (rol === 'vendedor' || rol === 'operario')) {
              // Cargar productos de todas las bodegas en paralelo
              const promesas = datosBodegas.map(b => cargarProductosPorBodega(b.id));
              await Promise.all(promesas);

              // Auto-seleccionar la primera bodega
              const primeraBodega = datosBodegas[0];
              console.log('[ProductosView] Auto-seleccionando primera bodega:', primeraBodega);
              setBodegaSeleccionada(primeraBodega.id);
            }
          }
        }

        console.log('[ProductosView] Bodegas cargadas:', datosBodegas.length, datosBodegas);
        setBodegas(datosBodegas);
      } catch (error) {
        console.error('[ProductosView] Error cargando bodegas:', error);
      } finally {
        setIsLoadingBodegas(false);
      }
    };

    cargarBodegas();
  }, [rol, tokenUsuario, usuario, subdominio]);

  // ── Tema tokens ──────────────────────────────────────────────
  const T = isDark ? {
    navBg: 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)',
    inputBg: '#0d1f3c',
    inputBorder: 'rgba(14,165,233,0.25)',
    inputColor: '#e2e8f0',
    inputPlaceholder: '#64748b',
    inputFocus: '0 0 0 2px rgba(14,165,233,0.4)',
    chipBg: 'rgba(14,165,233,0.08)',
    chipBorder: 'rgba(14,165,233,0.2)',
    chipColor: '#94a3b8',
    chipActiveBg: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
    chipActiveColor: '#fff',
    chipHoverBg: 'rgba(14,165,233,0.15)',
    btnPrimaryBg: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
    btnPrimaryColor: '#fff',
    btnPrimaryHover: 'linear-gradient(90deg, #38bdf8, #7dd3fc)',
    btnPrimaryShadow: '0 4px 14px rgba(14,165,233,0.35)',
    btnSecondaryBg: 'rgba(14,165,233,0.08)',
    btnSecondaryColor: '#38bdf8',
    btnSecondaryBorder: 'rgba(14,165,233,0.2)',
    btnSecondaryHover: 'rgba(14,165,233,0.15)',
    panelBg: '#0d1f3c',
    panelBorder: 'rgba(14,165,233,0.18)',
    panelShadow: '0 8px 24px rgba(14,165,233,0.12), 0 1px 0 rgba(14,165,233,0.2)',
    bannerBg: 'rgba(251,191,36,0.08)',
    bannerBorder: 'rgba(251,191,36,0.3)',
    bannerText: '#fde68a',
    bannerAccent: '#fbbf24',
    textPrimary: '#e2e8f0',
    textSecondary: '#94a3b8',
    divider: 'rgba(14,165,233,0.12)',
  } : {
    navBg: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 50%, #f0f7ff 100%)',
    inputBg: '#ffffff',
    inputBorder: 'rgba(14,165,233,0.35)',
    inputColor: '#1e293b',
    inputPlaceholder: '#64748b',
    inputFocus: '0 0 0 2px rgba(14,165,233,0.3)',
    chipBg: 'rgba(14,165,233,0.08)',
    chipBorder: 'rgba(14,165,233,0.25)',
    chipColor: '#475569',
    chipActiveBg: 'linear-gradient(90deg, #0284c7, #0ea5e9)',
    chipActiveColor: '#fff',
    chipHoverBg: 'rgba(14,165,233,0.12)',
    btnPrimaryBg: 'linear-gradient(90deg, #0284c7, #0ea5e9)',
    btnPrimaryColor: '#fff',
    btnPrimaryHover: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
    btnPrimaryShadow: '0 4px 14px rgba(14,165,233,0.3)',
    btnSecondaryBg: 'rgba(255,255,255,0.8)',
    btnSecondaryColor: '#0284c7',
    btnSecondaryBorder: 'rgba(14,165,233,0.35)',
    btnSecondaryHover: 'rgba(255,255,255,1)',
    panelBg: '#ffffff',
    panelBorder: 'rgba(14,165,233,0.25)',
    panelShadow: '0 8px 20px rgba(14,165,233,0.12), 0 1px 0 rgba(14,165,233,0.2)',
    bannerBg: 'rgba(254,243,199,0.8)',
    bannerBorder: 'rgba(251,191,36,0.4)',
    bannerText: '#92400e',
    bannerAccent: '#d97706',
    textPrimary: '#0c4a6e',
    textSecondary: '#475569',
    divider: 'rgba(14,165,233,0.15)',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

        .productos-root { font-family: 'Sora', sans-serif; }

        @media (max-width: 768px) {
          .productos-header { flex-direction: column !important; align-items: stretch !important; }
          .productos-search-container { flex-direction: column !important; width: 100% !important; }
          .productos-chips { flex-wrap: wrap !important; justify-content: center !important; }
          .productos-buttons { flex-direction: column !important; width: 100% !important; }
          .productos-buttons button { width: 100% !important; justify-content: center !important; }
          .productos-filters-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .productos-chips button { padding: 6px 12px !important; font-size: 12px !important; }
        }
      `}</style>
      <section className="productos-root space-y-1">
      {/* ——— Cabecera: search + filtros rápidos + "Nuevo" ——— */}
      <div className="productos-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        {/* Búsqueda + chips rápidos */}
        <div className="productos-search-container" style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '16px', width: '100%' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <input
              type="text"
              placeholder="Buscar productos…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                border: `1px solid ${T.inputBorder}`,
                borderRadius: '24px',
                padding: '10px 16px 10px 40px',
                fontSize: '14px',
                background: T.inputBg,
                color: T.inputColor,
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={e => e.currentTarget.style.boxShadow = T.inputFocus}
              onBlur={e => e.currentTarget.style.boxShadow = 'none'}
            />
            <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', height: '20px', width: '20px', color: T.inputPlaceholder }} />
          </div>
          <div className="productos-chips" style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
            {['Todos', 'Disponible', 'Agotados', 'Destacados'].map(label => {
              const isActive = quickFilter === label.toLowerCase();
              return (
                <button
                  key={label}
                  onClick={() => setQuickFilter(label.toLowerCase())}
                  style={{
                    whitespace: 'nowrap',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 500,
                    border: isActive ? 'none' : `1px solid ${T.chipBorder}`,
                    background: isActive ? T.chipActiveBg : T.chipBg,
                    color: isActive ? T.chipActiveColor : T.chipColor,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.chipHoverBg; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = T.chipBg; }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtros avanzados + nuevo */}
        <div className="productos-buttons" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAdvancedFilters(f => !f)}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '13px', fontWeight: 500,
              color: T.btnSecondaryColor,
              background: 'transparent',
              border: 'none', cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = isDark ? '#7dd3fc' : '#0284c7'}
            onMouseLeave={e => e.currentTarget.style.color = T.btnSecondaryColor}
          >
            Filtros avanzados
            <ChevronDownIcon
              style={{ height: '16px', width: '16px', transition: 'transform 0.2s', transform: showAdvancedFilters ? 'rotate(180deg)' : 'rotate(0)' }}
            />
          </button>
          {/* Botón para limpiar filtros */}
          {(searchTerm || quickFilter !== 'todos' || categoryFilter || priceMin || priceMax || dateFilter) && (
            <button
              onClick={limpiarFiltros}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', fontWeight: 500,
                color: isDark ? '#f87171' : '#dc2626',
                background: T.btnSecondaryBg,
                border: `1px solid ${isDark ? 'rgba(248,113,113,0.3)' : 'rgba(220,38,38,0.3)'}`,
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(248,113,113,0.15)' : 'rgba(220,38,38,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = T.btnSecondaryBg}
              title="Limpiar todos los filtros"
            >
              <XMarkIcon style={{ height: '16px', width: '16px' }} />
              Limpiar
            </button>
          )}
          <button
            onClick={() => setShowCreateForm(f => !f)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: T.btnPrimaryBg,
              color: T.btnPrimaryColor,
              padding: '10px 20px',
              borderRadius: '10px',
              boxShadow: T.btnPrimaryShadow,
              border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.btnPrimaryHover}
            onMouseLeave={e => e.currentTarget.style.background = T.btnPrimaryBg}
          >
            <PlusIcon style={{ height: '20px', width: '20px' }} />
            {showCreateForm ? 'Cancelar' : 'Nuevo Producto'}
          </button>

          {/* Botón para cambiar de bodega */}
          <button
            onClick={cambiarBodega}
            disabled={isLoadingBodegas || bodegas.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: isDark ? '#d97706' : '#f59e0b',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '10px',
              boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
              border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600,
              transition: 'all 0.2s',
              opacity: (isLoadingBodegas || bodegas.length === 0) ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!(isLoadingBodegas || bodegas.length === 0)) e.currentTarget.style.background = isDark ? '#b45309' : '#d97706'; }}
            onMouseLeave={e => { if (!(isLoadingBodegas || bodegas.length === 0)) e.currentTarget.style.background = isDark ? '#d97706' : '#f59e0b'; }}
            title="Cambiar bodega"
          >
            <TruckIcon style={{ height: '20px', width: '20px' }} />
            {bodegaSeleccionada
              ? `Bodega: ${bodegas.find(b => b.id === bodegaSeleccionada)?.nombre || 'Seleccionada'}`
              : 'Seleccionar Bodega'
            }
          </button>

        </div>
      </div>

      {/* ——— Banner indicador de filtro por bodega ——— */}
      {bodegaSeleccionada && (
        <div style={{
          background: T.bannerBg,
          borderLeft: `4px solid ${T.bannerAccent}`,
          padding: '16px 20px',
          borderRadius: '0 12px 12px 0',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TruckIcon style={{ height: '20px', width: '20px', color: T.bannerAccent, marginRight: '12px' }} />
            <div>
              <p style={{ fontWeight: 600, color: T.bannerText, fontSize: '14px', margin: 0 }}>
                Filtrando por bodega: {bodegas.find(b => b.id === bodegaSeleccionada)?.nombre || 'Seleccionada'}
              </p>
              <p style={{ fontSize: '13px', color: T.bannerText, opacity: 0.8, margin: '4px 0 0 0' }}>
                Mostrando {productosPorBodega[bodegaSeleccionada]?.length || 0} productos de esta bodega
              </p>
            </div>
          </div>
          <button
            onClick={limpiarFiltroBodega}
            style={{
              color: T.bannerText,
              background: 'transparent',
              border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '13px',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Limpiar filtro
          </button>
        </div>
      )}

      {/* ——— Panel Filtros Avanzados ——— */}
      {showAdvancedFilters && (
        <div style={{
          background: T.panelBg,
          padding: '20px',
          borderRadius: '12px',
          boxShadow: T.panelShadow,
          border: `1px solid ${T.panelBorder}`,
          marginBottom: '24px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{
                width: '100%',
                border: `1px solid ${T.inputBorder}`,
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '14px',
                background: T.inputBg,
                color: T.inputColor,
                cursor: 'pointer',
              }}
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre}</option>
              ))}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                placeholder="Precio min"
                value={priceMin}
                onChange={e => setPriceMin(e.target.value)}
                style={{
                  flex: 1,
                  border: `1px solid ${T.inputBorder}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '14px',
                  background: T.inputBg,
                  color: T.inputColor,
                }}
              />
              <span style={{ color: T.textSecondary }}>–</span>
              <input
                type="number"
                placeholder="Precio max"
                value={priceMax}
                onChange={e => setPriceMax(e.target.value)}
                style={{
                  flex: 1,
                  border: `1px solid ${T.inputBorder}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '14px',
                  background: T.inputBg,
                  color: T.inputColor,
                }}
              />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{
                width: '100%',
                border: `1px solid ${T.inputBorder}`,
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '14px',
                background: T.inputBg,
                color: T.inputColor,
              }}
            />
          </div>
        </div>
      )}

      {/* ——— Modal Nuevo Producto ——— */}
      {showCreateForm && (
        <Modal onClose={() => setShowCreateForm(false)}>
          <h4 className="text-2xl font-semibold text-slate-800 dark:!text-slate-100 mb-4 transition-colors duration-200">Crear Productos</h4>
          <form onSubmit={handleSubmitNew} className="space-y-6">
            <div className="space-y-8 max-w-7xl mx-auto">
              {newProducts.map((product, index) => (
                <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 border border-slate-200 dark:!border-slate-800 p-5 lg:p-6 rounded-lg transition-colors duration-200">
                  {/* Columna Izquierda: Imagen */}
                  <div className="flex flex-col items-center">
                    <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-2 transition-colors duration-200">
                      Imagen del Producto #{index + 1}
                    </label>

                    <div className="relative w-full h-80 bg-slate-100 dark:!bg-slate-800 rounded-lg border border-slate-200 dark:!border-slate-700 flex items-center justify-center overflow-hidden transition-colors duration-200">
                      {product.previewImage ? (
                        <img
                          src={product.previewImage}
                          alt={`Preview ${index}`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <ArrowUpTrayIcon className="h-8 w-8 text-slate-600 dark:!text-slate-400 mb-2" />
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
                          hover:bg-slate-200 dark:hover:!bg-slate-700 hover:bg-opacity-30
                          transition
                        "
                      >
                        <span className="text-sm font-medium text-slate-600 dark:!text-slate-400"></span>
                      </label>
                    </div>
                  </div>

                  {/* Columna Derecha: Campos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                    {/* Nombre */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-1 transition-colors duration-200">Nombre</label>
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
                        className="w-full px-3 py-2 bg-slate-50 dark:!bg-slate-800 border border-slate-200 dark:!border-slate-700 rounded-lg text-sm dark:!text-slate-100
                                  focus:outline-none focus:ring-2 focus:ring-blue-400 transition transition-colors duration-200"
                      />
                    </div>

                    {/* Descripción */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-1 transition-colors duration-200">
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
                        className="w-full px-3 py-2 bg-slate-50 dark:!bg-slate-800 border border-slate-200 dark:!border-slate-700 rounded-lg text-sm dark:!text-slate-100
                                  focus:outline-none focus:ring-2 focus:ring-blue-400 transition resize-none transition-colors duration-200"
                      />
                    </div>

                    {/* Categoría */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-1 transition-colors duration-200">Categoría</label>
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
                        className="w-full px-3 py-2 bg-slate-50 dark:!bg-slate-800 border border-slate-200 dark:!border-slate-700 rounded-lg text-sm dark:!text-slate-100
                          focus:outline-none focus:ring-2 focus:ring-blue-400 transition transition-colors duration-200"
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
                      <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-1 transition-colors duration-200">Marca</label>
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
                      <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-1 transition-colors duration-200">
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
                        className="w-full px-3 py-2 bg-slate-50 dark:!bg-slate-800 border border-slate-200 dark:!border-slate-700 rounded-lg text-sm dark:!text-slate-100
                                  focus:outline-none focus:ring-2 focus:ring-blue-400 transition transition-colors duration-200"
                      />
                    </div>

                    {/* IVA */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-1 transition-colors duration-200">IVA</label>
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
                        className="w-full px-3 py-2 bg-slate-50 dark:!bg-slate-800 border border-slate-200 dark:!border-slate-700 rounded-lg text-sm dark:!text-slate-100
                          focus:outline-none focus:ring-2 focus:ring-blue-400 transition transition-colors duration-200"
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
                      <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-1 transition-colors duration-200">Descuento</label>
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
                        className="w-full px-3 py-2 bg-slate-50 dark:!bg-slate-800 border border-slate-200 dark:!border-slate-700 rounded-lg text-sm dark:!text-slate-100
                          focus:outline-none focus:ring-2 focus:ring-blue-400 transition transition-colors duration-200"
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
                      <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-1 transition-colors duration-200">Tipo de Medida</label>
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
                        className="w-full px-3 py-2 bg-slate-50 dark:!bg-slate-800 border border-slate-200 dark:!border-slate-700 rounded-lg text-sm dark:!text-slate-100
                          focus:outline-none focus:ring-2 focus:ring-blue-400 transition transition-colors duration-200"
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
                      <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-1 transition-colors duration-200">Atributo</label>
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
                        className="w-full px-3 py-2 bg-slate-50 dark:!bg-slate-800 border border-slate-200 dark:!border-slate-700 rounded-lg text-sm dark:!text-slate-100
                                  focus:outline-none focus:ring-2 focus:ring-blue-400 transition transition-colors duration-200"
                      />
                    </div>

                    {/* Valor Atributo */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-1 transition-colors duration-200">
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
                        className="w-full px-3 py-2 bg-slate-50 dark:!bg-slate-800 border border-slate-200 dark:!border-slate-700 rounded-lg text-sm dark:!text-slate-100
                                  focus:outline-none focus:ring-2 focus:ring-blue-400 transition transition-colors duration-200"
                      />
                    </div>

                    {/* Sucursal */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-1 transition-colors duration-200">Sucursal</label>
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
                        className="mt-1 block w-full border border-slate-300 dark:!border-slate-700 dark:!bg-slate-800 dark:!text-slate-100 rounded px-2 py-1 text-sm transition-colors duration-200"
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
                      <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-1 transition-colors duration-200">Bodegas</label>
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
                        className="mt-1 block w-full border border-slate-300 dark:!border-slate-700 dark:!bg-slate-800 dark:!text-slate-100 rounded px-2 py-1 text-sm transition-colors duration-200"
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
                      <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-1 transition-colors duration-200">IMEI (Opcional)</label>
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
                        className="w-full px-3 py-2 bg-slate-50 dark:!bg-slate-800 border border-slate-200 dark:!border-slate-700 rounded-lg text-sm dark:!text-slate-100
                                  focus:outline-none focus:ring-2 focus:ring-blue-400 transition transition-colors duration-200"
                      />
                    </div>


                    {/* Stock */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-1 transition-colors duration-200">Stock</label>
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
                        className="w-full px-3 py-2 bg-slate-50 dark:!bg-slate-800 border border-slate-200 dark:!border-slate-700 rounded-lg text-sm dark:!text-slate-100
                                  focus:outline-none focus:ring-2 focus:ring-blue-400 transition transition-colors duration-200"
                      />
                    </div>

                    {/* Precio */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-1 transition-colors duration-200">Precio</label>
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
                        className="w-full px-3 py-2 bg-slate-50 dark:!bg-slate-800 border border-slate-200 dark:!border-slate-700 rounded-lg text-sm dark:!text-slate-100
                                  focus:outline-none focus:ring-2 focus:ring-blue-400 transition transition-colors duration-200"
                      />

                      {/* Advertencia visual */}
                      {String(product.precio).replace('.', '').length > 10 && (
                        <p className="mt-1 text-sm text-red-600">
                          El precio excede el máximo permitido (8 dígitos enteros, 2 decimales).
                        </p>
                      )}
                    </div>

                    {/* Sección de Variantes */}
                    <div className="sm:col-span-2 border-t border-slate-200 dark:!border-slate-700 pt-5 mt-5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-semibold text-slate-800 dark:!text-slate-100">
                          Características del Producto
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={product.conVariantes || false}
                            onChange={e => {
                              setNewProducts(prev => {
                                const updated = [...prev];
                                updated[index].conVariantes = e.target.checked;
                                return updated;
                              });
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-400"
                          />
                          <span className="text-sm text-slate-700 dark:!text-slate-300">
                            Habilitar variantes (talla/color/medida)
                          </span>
                        </label>
                      </div>

                      {product.conVariantes && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                          {/* Talla */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-1 transition-colors duration-200">
                              Talla
                            </label>
                            <input
                              name="talla"
                              type="text"
                              placeholder="S, M, L, XL, 38, 40..."
                              value={product.talla || ''}
                              onChange={e => {
                                setNewProducts(prev => {
                                  const updated = [...prev];
                                  updated[index].talla = e.target.value;
                                  return updated;
                                });
                              }}
                              className="w-full px-3 py-2 bg-slate-50 dark:!bg-slate-800 border border-slate-200 dark:!border-slate-700 rounded-lg text-sm dark:!text-slate-100
                                        focus:outline-none focus:ring-2 focus:ring-blue-400 transition transition-colors duration-200"
                            />
                          </div>

                          {/* Medida */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-1 transition-colors duration-200">
                              Medida
                            </label>
                            <input
                              name="medida"
                              type="text"
                              placeholder="10x20cm, 500ml, 1kg..."
                              value={product.medida || ''}
                              onChange={e => {
                                setNewProducts(prev => {
                                  const updated = [...prev];
                                  updated[index].medida = e.target.value;
                                  return updated;
                                });
                              }}
                              className="w-full px-3 py-2 bg-slate-50 dark:!bg-slate-800 border border-slate-200 dark:!border-slate-700 rounded-lg text-sm dark:!text-slate-100
                                        focus:outline-none focus:ring-2 focus:ring-blue-400 transition transition-colors duration-200"
                            />
                          </div>

                          {/* Color */}
                          <div className="sm:col-span-3">
                            <label className="block text-sm font-medium text-slate-700 dark:!text-slate-300 mb-1 transition-colors duration-200">
                              Color
                            </label>
                            <ColorPicker
                              selectedColor={product.color}
                              onSelectColor={(color) => {
                                setNewProducts(prev => {
                                  const updated = [...prev];
                                  updated[index].color = color;
                                  return updated;
                                });
                              }}
                              isDark={isDark}
                            />
                          </div>
                        </div>
                      )}

                      {/* Lista de variantes */}
                      {product.conVariantes && product.variantes && product.variantes.length > 0 && (
                        <div className="mt-4 space-y-2.5">
                          <h5 className="text-sm font-semibold text-slate-700 dark:!text-slate-300 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Variantes agregadas ({product.variantes.length})
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                            {product.variantes.map((variante, vIndex) => (
                              <div
                                key={vIndex}
                                className="relative group bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl border-2 border-slate-200 dark:border-slate-600 p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-200"
                              >
                                {/* Badge de eliminar */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewProducts(prev => {
                                      const updated = [...prev];
                                      updated[index].variantes = updated[index].variantes.filter((_, i) => i !== vIndex);
                                      return updated;
                                    });
                                  }}
                                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                                  title="Eliminar variante"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>

                                {/* Contenido de la variante */}
                                <div className="space-y-3">
                                  {/* SKU */}
                                  <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">SKU</p>
                                    <p className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200">{variante.sku_variante || 'N/A'}</p>
                                  </div>

                                  {/* Características */}
                                  <div className="flex flex-wrap gap-2">
                                    {variante.talla && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        {variante.talla}
                                      </span>
                                    )}
                                    {variante.color && (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-600 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-500">
                                        <span
                                          className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-500"
                                          style={{ backgroundColor: variante.color.hex }}
                                        />
                                        {variante.color.nombre}
                                      </span>
                                    )}
                                    {variante.medida && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        {variante.medida}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Botón agregar variante */}
                      {product.conVariantes && (
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => {
                              const variante = {
                                talla: product.talla || null,
                                color: product.color?.nombre || null,  // Extraer solo el nombre
                                color_hex: product.color?.hex || null,
                                medida: product.medida || null,
                                sku_variante: `${product.sku || 'SKU'}-${(product.variantes?.length || 0) + 1}`,
                                precio: null,
                              };

                              // Validar que al menos una característica esté definida
                              if (!variante.talla && !variante.color && !variante.medida) {
                                showToast('error', 'Debes especificar al menos una característica (talla, color o medida)');
                                return;
                              }

                              setNewProducts(prev => {
                                const updated = [...prev];
                                if (!updated[index].variantes) {
                                  updated[index].variantes = [];
                                }
                                updated[index].variantes = [...updated[index].variantes, variante];

                                // Limpiar campos después de agregar
                                updated[index].talla = '';
                                updated[index].color = null;
                                updated[index].medida = '';
                                return updated;
                              });

                              showToast('success', 'Variante agregada correctamente');
                            }}
                            className="w-full py-2.5 px-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Agregar Variante
                          </button>
                        </div>
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
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                >
                  + Agregar otro producto
                </button>
              </div>

              {/* Botones cancelar y crear */}
              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-200 dark:!border-slate-800 transition-colors duration-200">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:!text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:!bg-slate-600 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2 rounded-lg shadow hover:from-emerald-600 hover:to-emerald-700 transition-colors duration-200"
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
    </>
  );
}
