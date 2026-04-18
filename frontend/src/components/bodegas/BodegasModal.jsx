// src/components/bodegas/BodegasModal.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Modal from '../Modal';
import BodegasHeader from './BodegasHeader';
import { SECCIONES } from './constants/secciones';
import '../../styles/sparkles.css';
import '../../styles/bodegas-responsive.css';

// Secciones
import CrearBodega from './sections/CrearBodega';
import Administrar from './sections/Administrar';
import AjustarExistencia from './sections/AjustarExistencia';
import RealizarTraslado from './sections/RealizarTraslado';
import EnviarTraslado from './sections/EnviarTraslado';
import RecibirTraslado from './sections/RecibirTraslado';

// Servicios / hooks
import {
  fetchCategorias,
  fetchBodegas,
  fetchBodegasTodas,
  fetchAllProducts,
  createProduct,
  subirImagenProducto,
  obtenerExistenciasPorBodega,
  obtenerProductosPorBodega,
  fetchAllProductsTraslado,
  enviarTraslado,
  recibirTraslado,
  listarTrasladosPorBodegaDestino,
} from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { showToast } from '../../utils/toast';

export default function BodegasModal({
  isOpen, onClose, sucursalSel, initialProducts = [], onCreated = () => {},
  // crear bodega
  bodegaForm, setBodegaForm, bodegaLoading, onCrearBodega,
  // ajustar existencia
  ajusteForm, setAjusteForm, ajusteLoading, onAjustar,
  // realizar traslado
  trasladoForm, setTrasladoForm, trasladoLoading, onRealizarTraslado,
}) {
  const [active, setActive] = useState('crear-bodega');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { tokenUsuario, subdominio } = useAuth();
  const usuario = localStorage.getItem('usuario');

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (!isOpen) return;

    // Guardar estilos originales
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const scrollY = window.scrollY;

    // Bloquear scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      // Restaurar scroll
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // productos base (si los usas en otras vistas)
  const [products, setProducts] = useState(initialProducts);
  const [visibleCount, setVisibleCount] = useState(10);

  // selects / catálogos (si los necesitas)
  const [categorias, setCategorias] = useState([]);
  const [isLoadingCategorias, setIsLoadingCategorias] = useState(false);

  // Traslados
  const [showTrasladosForm, setShowTrasladosForm] = useState(false);
  const [showExistenciaForm, setShowExistenciaForm] = useState(false);
  const [usarTransito, setUsarTransito] = useState(false);
  const [newProducts, setNewProducts] = useState([
    { producto_id: "", cantidad: "", bodega_origen: "", bodega_destino: "", observacion: "" },
  ]);

  // Bodegas / Productos para selects
  const [bodegas, setBodegas] = useState([]);  // Bodegas asignadas (para destino)
  const [bodegasTodas, setBodegasTodas] = useState([]);  // TODAS las bodegas de la sucursal (para origen)
  const [bodegasOtrasSucursales, setBodegasOtrasSucursales] = useState([]);  // Bodegas de OTRAS sucursales (para destino)
  const [isLoadingBodegas, setIsLoadingBodegas] = useState(false);
  const [productos, setProductos] = useState([]);
  const [productosTraslados, setProductosTraslados] = useState([]);
  const [productosPorBodega, setProductosPorBodega] = useState({});
  const [isLoadingProductosPorBodega, setIsLoadingProductosPorBodega] = useState(false);
  const [isLoadingProductos, setIsLoadingProductos] = useState(false);
  const [isLoadingProductosTraslado, setIsLoadingProductosTraslado] = useState(false);
  const [errorBodegas, setErrorBodegas] = useState(null);

  // Estados para enviar traslado
  const [enviarForm, setEnviarForm] = useState({ trasladoId: null });
  const [enviarLoading, setEnviarLoading] = useState(false);

  // Estados para recibir traslado
  const [recibirForm, setRecibirForm] = useState({ trasladoId: null });
  const [recibirLoading, setRecibirLoading] = useState(false);
  const [trasladosDisponibles, setTrasladosDisponibles] = useState([]);
  const [isLoadingTraslados, setIsLoadingTraslados] = useState(false);
  const [errorTraslados, setErrorTraslados] = useState(null);

  // Estados para selección múltiple
  const [trasladosSeleccionados, setTrasladosSeleccionados] = useState([]);
  const [seleccionandoMultiple, setSeleccionandoMultiple] = useState(false);

  // ID del usuario actual
  const [currentUserId, setCurrentUserId] = useState(null);

  const currentSection = SECCIONES.find(s => s.id === active);

  useEffect(() => {
    setProducts(initialProducts);
    setVisibleCount(10);
  }, [initialProducts]);

  // Cargar ID del usuario actual
  useEffect(() => {
    const loadUserId = async () => {
      try {
        // Intenta obtener el ID del localStorage
        const userId = localStorage.getItem('user_id');
        if (userId) {
          setCurrentUserId(userId);
        } else {
          console.warn('No se encontró user_id en localStorage');
        }
      } catch (error) {
        console.error('Error al cargar ID de usuario:', error);
      }
    };
    
    if (usuario) {
      loadUserId();
    }
  }, [usuario]);

  // Cargar bodegas
  const cargarBodegas = useCallback(async () => {
    if (!tokenUsuario || !usuario || !subdominio) return;
    setIsLoadingBodegas(true);
    setErrorBodegas(null);
    try {
      // ✅ Cargar bodegas asignadas al usuario (para destino según rol)
      const response = await fetchBodegas({
        tokenUsuario,
        usuario,
        subdominio,
        sucursalId: sucursalSel?.id  // Filtrar por sucursal seleccionada
      });
      const datos = response?.datos || [];
      setBodegas(datos);

      // ✅ Cargar TODAS las bodegas de la sucursal (para origen)
      if (sucursalSel?.id) {
        const responseTodas = await fetchBodegasTodas({
          tokenUsuario,
          usuario,
          subdominio,
          sucursalId: sucursalSel.id
        });
        setBodegasTodas(responseTodas?.datos || []);

        // ✅ Cargar bodegas de OTRAS sucursales (para destino)
        const responseOtras = await fetchBodegasTodas({
          tokenUsuario,
          usuario,
          subdominio,
          excluirSucursalId: sucursalSel.id  // Excluir sucursal actual
        });
        setBodegasOtrasSucursales(responseOtras?.datos || []);
      }
    } catch (e) {
      setErrorBodegas('Error al cargar las bodegas');
      setBodegas([]);
      setBodegasTodas([]);
      setBodegasOtrasSucursales([]);
    } finally {
      setIsLoadingBodegas(false);
    }
  }, [tokenUsuario, usuario, subdominio, sucursalSel?.id]);

  useEffect(() => { cargarBodegas(); }, [cargarBodegas]);

  // Cargar productos
  const cargarProductos = useCallback(async () => {
    if (!tokenUsuario || !usuario || !subdominio) return;
    setIsLoadingProductos(true);
    try {
      
      const response = await fetchAllProducts({ tokenUsuario, usuario, subdominio });

      for (let i = 0; i < response?.datos.length; i++) {
        const bodega_id = response?.datos?.[i]?.bodega_id;
        const token = tokenUsuario;
        const existencia_por_bodega = await obtenerExistenciasPorBodega({ usuario, token, subdominio, bodega_id });
        const existencia = existencia_por_bodega?.datos?.[0];

        if (existencia.bodega_id === bodega_id && existencia.producto_id === response?.datos?.[i]?.id) {
            response.datos[i].stock = existencia.cantidad;
            response.datos[i].stock = existencia.bodega_id;
        }
      }

      const datos = response?.datos || [];
  
      setProductos(datos);
    } catch (e) {
      setProductos([]);
    } finally {
      setIsLoadingProductos(false);
    }
  }, [tokenUsuario, usuario, subdominio]);

  useEffect(() => { cargarProductos(); }, [cargarProductos]);

  // Cargar productos de traslado
  const cargarProductosTraslado = useCallback(async () => {
    if (!tokenUsuario || !usuario || !subdominio) return;
    setIsLoadingProductosTraslado(true);
    try {
      const response = await fetchAllProductsTraslado({ tokenUsuario, usuario, subdominio });
      const datos = response?.datos || [];
      setProductosTraslados(datos);
    } catch (e) {
      setProductosTraslados([]);
    } finally {
      setIsLoadingProductosTraslado(false);
    }
  }, [tokenUsuario, usuario, subdominio]);

  useEffect(() => {
    if (active === 'enviar-traslado') {
      cargarProductosTraslado();
    }
  }, [active, cargarProductosTraslado]);

  // Cargar productos por bodega (para traslados)
  const cargarProductosPorBodega = useCallback(async (bodegaId) => {
    if (!tokenUsuario || !usuario || !subdominio || !bodegaId) {
      return;
    }

    setIsLoadingProductosPorBodega(true);
    try {
      const response = await obtenerProductosPorBodega({
        tokenUsuario,
        usuario,
        subdominio,
        bodega_id: bodegaId,
        solo_con_stock: true
      });

      const datos = response?.datos || [];
      setProductosPorBodega(prev => ({
        ...prev,
        [bodegaId]: datos
      }));
    } catch (e) {
      console.error('Error al cargar productos por bodega:', e);
      setProductosPorBodega(prev => ({
        ...prev,
        [bodegaId]: []
      }));
    } finally {
      setIsLoadingProductosPorBodega(false);
    }
  }, [tokenUsuario, usuario, subdominio]);

  // Cargar traslados disponibles para recibir
  const cargarTrasladosDisponibles = useCallback(async () => {
    

    const arrayBodegas = [];

    for (let i = 0; i < bodegas.length; i++) {
      if (bodegas[i].sucursal_id == sucursalSel.id) {
         arrayBodegas.push(bodegas[i].id);
      }
    }

    const bodegaDestino = arrayBodegas;

    setIsLoadingTraslados(true);
    setErrorTraslados(null);
    
    try {
      const response = await listarTrasladosPorBodegaDestino({
        token: tokenUsuario,
        usuario: usuario,
        subdominio: subdominio,
        bodega_destino_id: bodegaDestino,
        estado: 'ENV'
      });
      
      setTrasladosDisponibles(response);
    } catch (error) {
      setErrorTraslados(error.message || 'Error al cargar traslados');
      setTrasladosDisponibles([]);
    } finally {
      setIsLoadingTraslados(false);
    }
  }, [tokenUsuario, usuario, subdominio, sucursalSel]);

 
  // Categorías
  useEffect(() => {
    const cargarCategorias = async () => {
      if (!tokenUsuario || !usuario || !subdominio) return;
      setIsLoadingCategorias(true);
      try {
        const response = await fetchCategorias({ tokenUsuario, usuario, subdominio });
        setCategorias(response?.datos || []);
      } catch (e) {
        // noop
      } finally {
        setIsLoadingCategorias(false);
      }
    };
    cargarCategorias();
  }, [tokenUsuario, usuario, subdominio]);

  // ==========================================
  // FUNCIÓN PARA ENVIAR TRASLADO
  // ==========================================
  const handleEnviarTraslado = async (e) => {
    e.preventDefault();
    
    if (!enviarForm?.trasladoId) {
      showToast('error', 'Por favor selecciona un traslado');
      return;
    }


    setEnviarLoading(true);
    
    try {
      // Llamar al endpoint api/traslados/{id}/enviar/
      const response = await enviarTraslado({
        token: tokenUsuario,
        usuario: usuario,
        subdominio: subdominio,
        traslado_id: enviarForm.trasladoId
      });
      

      showToast('success', 'Traslado enviado exitosamente');
      
      // Recargar la lista de traslados
      await cargarProductosTraslado();
      
      // Limpiar el formulario
      setEnviarForm({ trasladoId: null });
      
    } catch (error) {
      console.error('❌ Error al enviar traslado:', error);
      showToast(
        'error',
        error.message || 'Error al enviar el traslado'
        
      );
    } finally {
      setEnviarLoading(false);
    }
  };

  // ==========================================
  // FUNCIÓN PARA RECIBIR TRASLADO (MÚLTIPLE)
  // ==========================================
  const getApiErrorMessage = (error) => {
    // Error HTTP (Axios / fetch)
    if (error?.response?.data?.detail) {
      return error.response.data.detail;
    }

    // Cuando el error ya viene logueado como objeto plano
    if (error?.responseBody?.detail) {
      return error.responseBody.detail;
    }

    // Error genérico JS
    if (error?.message) {
      return error.message;
    }

    return 'Ocurrió un error inesperado';
  };

  const handleRecibirTraslado = async (e) => {
    e.preventDefault();

    const idsParaRecibir = seleccionandoMultiple
      ? trasladosSeleccionados
      : (recibirForm?.trasladoId ? [recibirForm.trasladoId] : []);

    if (idsParaRecibir.length === 0) {
      showToast('error', 'Por favor selecciona al menos un traslado');
      return;
    }

    if (!tokenUsuario) {
      showToast('error', 'No hay sesión activa');
      return;
    }

    setRecibirLoading(true);

    try {
      const promesas = idsParaRecibir.map((trasladoId) => {
        const traslado = trasladosDisponibles.find(t => t.id === trasladoId);

        const cantidades = traslado?.lineas?.map(linea => ({
          producto: linea.producto,
          cantidad: linea.pendiente_por_recibir, 
        })) || [];

        return recibirTraslado({
          usuario,
          token: tokenUsuario,
          subdominio,
          traslado_id: trasladoId,
          cantidades,
        });
      });

      const resultados = await Promise.allSettled(promesas);

      const exitosos = resultados.filter(r => r.status === 'fulfilled');
      const fallidos = resultados.filter(r => r.status === 'rejected');

      //Mostrar éxitos
      if (exitosos.length > 0) {
        showToast(
          fallidos.length > 0 ? 'warning' : 'success',
          `${exitosos.length} traslado${exitosos.length > 1 ? 's' : ''} recibido${exitosos.length > 1 ? 's' : ''}`
          
        );
      }

      //Mostrar errores reales del backend
      if (fallidos.length > 0) {
        fallidos.forEach((r, index) => {
          const mensaje = getApiErrorMessage(r.reason);
          console.error(`Traslado ${idsParaRecibir[index]}:`, mensaje);
          showToast('error', mensaje);
        });
      }

      //Recargar estado
      await cargarTrasladosDisponibles();


      setRecibirForm({ trasladoId: null });
      setTrasladosSeleccionados([]);
      setSeleccionandoMultiple(false);

    } catch (error) {
      const mensaje = getApiErrorMessage(error);
      console.error('Error general:', mensaje);
      showToast('error', mensaje);
    } finally {
      setRecibirLoading(false);
    }
  };



  // Tabs animadas
  const handleTabChange = (sectionId) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActive(sectionId);
      setIsTransitioning(false);
    }, 150);
  };


  // Cargar traslados disponibles cuando se activa la sección de recibir traslado
    useEffect(() => {
      // Cargar cuando se abre el modal por primera vez
      if (isOpen) {
        cargarTrasladosDisponibles();
      }
    }, [isOpen, cargarTrasladosDisponibles]);

    // Y/O también cuando cambia a la pestaña específica
    useEffect(() => {
      if (active === 'recibir-traslado') {
        cargarTrasladosDisponibles();
      }
    }, [active, cargarTrasladosDisponibles]);
    

  // src/components/bodegas/BodegasModal.jsx

  const handleAjustar = async (payload) => {
    // payload = { producto, bodega, delta }
    
    if (!tokenUsuario || !usuario || !subdominio) {
      showToast('error', 'No hay sesión activa');
      return;
    }


    // Aquí deberías tener setAjusteLoading si no lo tienes
    // const [ajusteLoading, setAjusteLoading] = useState(false);
    
    try {
      // Llamar a la API de ajuste de existencia
      const response = await fetch(`${window.location.origin}/api/existencias/ajustar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokenUsuario && { Authorization: `Bearer ${tokenUsuario}` }),
        },
        body: JSON.stringify({
          usuario,
          token: tokenUsuario,
          subdominio,
          producto: payload.producto,
          bodega: payload.bodega,
          delta: payload.delta
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.mensaje || data?.detail || 'Error al ajustar existencia';
        throw new Error(errorMsg);
      }

      console.log('✅ Respuesta del servidor:', data);
      
      showToast(
        'success',
        `Stock ajustado: ${payload.delta > 0 ? '+' : ''}${payload.delta} unidades`
      );

      // Recargar productos para reflejar el cambio
      await cargarProductos();
      
      // Limpiar formulario
      setAjusteForm({ producto: '', bodega: '', delta: '' });
      
    } catch (error) {
      console.error('❌ Error al ajustar existencia:', error);
      showToast('error', error.message || 'Error al ajustar el stock');
    }
  };



  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      {/* Contenedor principal responsive - altura optimizada para móvil */}
      <div className="relative z-10 flex flex-col w-full" style={{
        height: 'auto',
        minHeight: '300px'
      }}>

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

        {/* Navegación horizontal optimizada para mobile/tablet - ANTES de todo */}
        <div className="md:hidden relative z-[100] flex-shrink-0 flex items-center justify-center py-3 px-2 gap-2 w-full" style={{
          backgroundColor: '#00000000',
          borderBottom: '2px solid #000000',
          minHeight: 'clamp(3.5rem, 10vw, 4.5rem)',
          maxHeight: 'clamp(4rem, 12vw, 5rem)',
          marginTop: '20px'
        }}>
          {/* Botón cerrar para mobile - más compacto */}
          <button
            onClick={onClose}
            className="flex-shrink-0 touch-target rounded-lg bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-all duration-300 shadow-md"
            style={{
              width: 'clamp(2.75rem, 8vw, 3.25rem)',
              height: 'clamp(2.75rem, 8vw, 3.25rem)'
            }}
            type="button"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Separador vertical más pequeño */}
          <div className="w-px h-7 sm:h-8 flex-shrink-0" style={{ backgroundColor: '#475569' }}></div>

          {/* Botones de navegación horizontales - más grandes y visibles */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1 justify-center">
            {SECCIONES.map(section => {
              const Icon = section.icon;
              const isActive = active === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => handleTabChange(section.id)}
                  className={`flex-shrink-0 rounded-lg flex flex-col items-center justify-center transition-all duration-300 border-2 shadow-md ${
                    isActive
                      ? `bg-blue-500 text-white scale-105 border-blue-400`
                      : 'bg-slate-600 hover:bg-slate-500 text-white border-slate-400'
                  }`}
                  style={{
                    width: 'clamp(2.75rem, 9vw, 3.25rem)',
                    height: 'clamp(2.75rem, 9vw, 3.25rem)',
                    minWidth: '2.75rem'
                  }}
                >
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${
                    isActive ? 'scale-110' : ''
                  }`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout principal: Sidebar + Contenido */}
        <div className="flex flex-1 overflow-visible flex-col md:flex-row">

          {/* Sidebar responsive - vertical en desktop, oculto en mobile */}
          {/* Desktop: sidebar vertical en la izquierda */}
          <div className="relative z-10 flex-shrink-0 flex flex-col items-center py-3 hidden md:flex" style={{
            width: 'clamp(3.5rem, 4rem, 5rem)',
            backgroundColor: '#0f172a',
            borderRight: '1px solid #1e293b'
          }}>
            {/* Contenedor centrado para todos los botones */}
            <div className="flex-1 flex flex-col justify-center items-center space-y-3">
              {/* Botón cerrar compacto */}
              <button
                onClick={onClose}
                className="group touch-target rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-md"
                style={{
                  width: 'clamp(2.5rem, 3rem, 3.5rem)',
                  height: 'clamp(2.5rem, 3rem, 3.5rem)'
                }}
                type="button"
              >
                <svg
                  className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Separador */}
              <div className="w-6 h-px" style={{ backgroundColor: '#334155' }}></div>

              {/* Botones de navegación compactos */}
              <div className="flex flex-col justify-center space-y-2">
            {SECCIONES.map(section => {
              const Icon = section.icon;
              const isActive = active === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => handleTabChange(section.id)}
                  className={`group relative touch-target rounded-lg flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-br ${section.color} text-white shadow-md`
                      : 'bg-slate-700/60 hover:bg-slate-600/80 text-slate-300 hover:text-white border border-slate-600/40'
                  }`}
                  style={{
                    width: 'clamp(2.5rem, 3rem, 3.5rem)',
                    height: 'clamp(2.5rem, 3rem, 3.5rem)'
                  }}
                >
                  {/* Indicador activo */}
                  {isActive && (
                    <div className={`absolute -left-2 w-0.5 h-6 bg-gradient-to-b ${section.color} rounded-r-full`}>
                      <div className="w-full h-2 bg-white/30 rounded-full animate-pulse"></div>
                    </div>
                  )}

                  {/* Efecto glassmorphism en hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-lg"></div>

                  <Icon className={`w-[30px] h-[30px] transition-transform duration-300 relative z-10 ${
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  }`} />

                  {/* Tooltip - ocultar en touch devices */}
                  <div className="hidden md:block absolute left-14 ml-2 px-3 py-2 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-50" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                    <div className="font-semibold text-sm mb-0.5">{section.label}</div>
                    <div className="text-slate-400 text-[10px] leading-tight">{section.description}</div>
                    <div className="absolute -left-1.5 top-1/2 transform -translate-y-1/2 w-2 h-2" style={{ backgroundColor: '#0f172a', borderLeft: '1px solid #1e293b', borderTop: '1px solid #1e293b' }}></div>
                  </div>
                </button>
              );
            })}
              </div>
            </div>
          </div>

          {/* Área principal de contenido */}
          <div className="flex-1 flex flex-col relative overflow-hidden w-full" style={{ backgroundColor: '#0B0D26' }}>
            {/* Header más compacto en móvil */}
            <div className="relative z-10 flex-shrink-0 px-2 sm:px-3 md:px-4 pt-1.5 sm:pt-2 md:pt-3 pb-1 sm:pb-1.5 md:pb-2 w-full">
              <header className="relative rounded-lg p-1.5 sm:p-2 md:p-2.5 border" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className={`w-0.5 h-4 sm:h-5 md:h-6 rounded-full bg-gradient-to-b transition-all duration-500 ${currentSection?.color} flex-shrink-0`}>
                    <div className="w-full h-1.5 sm:h-2 bg-white/30 rounded-full animate-pulse"></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] mb-0.5" style={{ color: '#94a3b8' }}>
                      <span className="px-1 sm:px-1.5 py-0.5 rounded-full font-medium text-[8px] sm:text-[9px] md:text-[10px]" style={{ background: 'linear-gradient(to right, rgba(37,99,235,0.1), rgba(29,78,216,0.1))', color: '#60a5fa' }}>
                        Gestión
                      </span>
                      <svg className="w-2 h-2 sm:w-2.5 sm:w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="font-medium truncate text-[8px] sm:text-[9px] md:text-[10px]" style={{ color: '#60a5fa' }}>
                        {sucursalSel?.nombre || 'Sucursal'}
                      </span>
                    </div>

                    <h6 className="text-[10px] sm:text-xs md:text-sm font-semibold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight">
                      {currentSection?.label}
                    </h6>
                  </div>
                </div>
              </header>
            </div>

            {/* Contenido principal responsive con scroll optimizado */}
            <div className="flex-1 relative overflow-y-auto overflow-x-hidden w-full" style={{ minHeight: 'clamp(200px, 40vh, 400px)' }}>
              <div className="h-full px-1 sm:px-1.5 md:px-3 lg:px-4 pt-5 sm:pt-1 md:pt-3 lg:pt-4 pb-1 sm:pb-1.5 md:pb-3 lg:pb-4 w-full">
              {/* Contenido con transiciones */}
              <div className={`relative transition-all duration-300 w-full ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`} style={{ minHeight: 'clamp(150px, 35vh, 300px)' }}>
                {active === 'crear-bodega' && (
                  <CrearBodega
                    bodegaForm={bodegaForm}
                    setBodegaForm={setBodegaForm}
                    bodegaLoading={bodegaLoading}
                    onCrearBodega={onCrearBodega}
                    onClose={onClose}
                  />
                )}

                {active === 'administrar' && (
                  <Administrar sucursalSel={sucursalSel} handleTabChange={handleTabChange} />
                )}

                {active === 'ajustar-existencia' && (
                  <AjustarExistencia
                    ajusteForm={ajusteForm}
                    setAjusteForm={setAjusteForm}
                    onAjustar={handleAjustar}  // ← Asegúrate de que esta línea esté presente
                    ajusteLoading={ajusteLoading}
                    bodegas={bodegas}
                    isLoadingBodegas={isLoadingBodegas}
                    productos={productos}
                    isLoadingProductos={isLoadingProductos}
                    errorBodegas={errorBodegas}
                    onRetryBodegas={cargarBodegas}
                    sucursalSel={sucursalSel}
                  />
                )}

                {active === 'realizar-traslado' && (
                  <RealizarTraslado



                    showTrasladosForm={showTrasladosForm}
                    setShowTrasladosForm={setShowTrasladosForm}
                    newProducts={newProducts}
                    setNewProducts={setNewProducts}
                    usarTransito={usarTransito}
                    setUsarTransito={setUsarTransito}
                    onRealizarTraslado={onRealizarTraslado}
                    trasladoLoading={trasladoLoading}
                    bodegas={bodegas}
                    bodegasTodas={bodegasTodas}
                    bodegasOtrasSucursales={bodegasOtrasSucursales}
                    isLoadingBodegas={isLoadingBodegas}
                    productos={productos}
                    productosPorBodega={productosPorBodega}
                    isLoadingProductosPorBodega={isLoadingProductosPorBodega}
                    onCargarProductosPorBodega={cargarProductosPorBodega}
                    isLoadingProductos={isLoadingProductos}
                    errorBodegas={errorBodegas}
                    onRetryBodegas={cargarBodegas}
                    sucursalSel={sucursalSel}
                  />
                )}

                {active === 'enviar-traslado' && (
                  <EnviarTraslado
                    enviarForm={enviarForm}
                    setEnviarForm={setEnviarForm}
                    enviarLoading={enviarLoading}
                    onEnviarTraslado={handleEnviarTraslado}
                    onClose={onClose}
                    bodegas={bodegas}
                    isLoadingBodegas={isLoadingBodegas}
                    productosTraslados={productosTraslados}
                    isLoadingProductos={isLoadingProductosTraslado}
                    errorBodegas={errorBodegas}
                    onRetryBodegas={cargarBodegas}
                    sucursalSel={sucursalSel}
                    currentUserId={currentUserId}
                  />
                )}

                {active === 'recibir-traslado' && (
                  <RecibirTraslado
                    recibirForm={recibirForm}
                    setRecibirForm={setRecibirForm}
                    recibirLoading={recibirLoading}
                    onRecibirTraslado={handleRecibirTraslado}
                    onClose={onClose}
                    bodegas={bodegas}
                    isLoadingBodegas={isLoadingBodegas}
                    productos={productos}
                    isLoadingProductos={isLoadingProductos}
                    trasladosDisponibles={trasladosDisponibles}
                    isLoadingTraslados={isLoadingTraslados}
                    errorTraslados={errorTraslados}
                    trasladosSeleccionados={trasladosSeleccionados}
                    setTrasladosSeleccionados={setTrasladosSeleccionados}
                    seleccionandoMultiple={seleccionandoMultiple}
                    setSeleccionandoMultiple={setSeleccionandoMultiple}
                    currentUserId={currentUserId}
                  />

                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </Modal>
  );
}