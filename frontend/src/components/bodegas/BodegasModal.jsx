// src/components/bodegas/BodegasModal.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Modal from '../Modal';
import BodegasHeader from './BodegasHeader';
import { SECCIONES } from './constants/secciones';

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
          console.log('ID de usuario cargado:', userId);
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
      console.log("fetchAllProducts", datos);
  
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
      console.log("fetchAllProductsTraslado", datos);
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
      console.log('Faltan datos para cargar productos por bodega:', { tokenUsuario: !!tokenUsuario, usuario: !!usuario, subdominio: !!subdominio, bodegaId });
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
      console.log(`Productos para bodega ${bodegaId}:`, datos);
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
    
    console.log("bodegas", bodegas);
    console.log("sucursalSel", sucursalSel);

    const arrayBodegas = [];

    for (let i = 0; i < bodegas.length; i++) {
      if (bodegas[i].sucursal_id == sucursalSel.id) {
         arrayBodegas.push(bodegas[i].id);
      }
    }

    console.log("arrayBodegas",arrayBodegas);
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
      
      console.log("response", response);
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

    console.log('=== ENVIANDO TRASLADO ===');
    console.log('Traslado ID:', enviarForm.trasladoId);
    console.log('Usuario:', usuario);
    console.log('Subdominio:', subdominio);
    console.log('Token:', tokenUsuario ? 'Presente' : 'Ausente');

    setEnviarLoading(true);
    
    try {
      // Llamar al endpoint api/traslados/{id}/enviar/
      const response = await enviarTraslado({
        token: tokenUsuario,
        usuario: usuario,
        subdominio: subdominio,
        traslado_id: enviarForm.trasladoId
      });
      
      console.log('Respuesta del servidor:', response);
 
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

    console.log('=== AJUSTANDO EXISTENCIA ===');
    console.log('Payload:', payload);
    console.log('Usuario:', usuario);
    console.log('Subdominio:', subdominio);

    // Aquí deberías tener setAjusteLoading si no lo tienes
    // const [ajusteLoading, setAjusteLoading] = useState(false);
    
    try {
      // Llamar a la API de ajuste de existencia
      const response = await fetch('https://dagi.co/api/existencias/ajustar/', {
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
    <Modal onClose={onClose} fullscreen>
      {/* Contenedor principal - Pantalla completa */}
      <div className="fixed inset-0 z-50 flex h-screen w-screen">
        
        {/* Fondos decorativos */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 opacity-60"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100/20 via-transparent to-transparent"></div>

        {/* Sidebar vertical izquierdo */}
        <div className="relative z-10 w-16 bg-slate-800/95 backdrop-blur-xl flex flex-col items-center py-6 space-y-3 shadow-2xl border-r border-slate-700/50">
          {/* Botón cerrar en la parte superior del sidebar */}
          <button
            onClick={onClose}
            className="group w-12 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg mb-3"
            type="button"
          >
            <svg 
              className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Separador */}
          <div className="w-8 h-px bg-slate-600/50"></div>

          {/* Botones de navegación */}
          {SECCIONES.map(section => {
            const Icon = section.icon;
            const isActive = active === section.id;

            return (
              <button
                key={section.id}
                onClick={() => handleTabChange(section.id)}
                className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? `bg-gradient-to-br ${section.color} text-white shadow-lg shadow-indigo-500/25`
                    : 'bg-slate-700/60 hover:bg-slate-600/80 text-slate-300 hover:text-white border border-slate-600/40'
                }`}
              >
                {/* Indicador activo */}
                {isActive && (
                  <div className={`absolute -left-4 w-1 h-8 bg-gradient-to-b ${section.color} rounded-r-full`}>
                    <div className="w-full h-3 bg-white/30 rounded-full animate-pulse"></div>
                  </div>
                )}

                {/* Efecto glassmorphism en hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-xl"></div>
                
                <Icon className={`w-6 h-6 transition-transform duration-300 relative z-10 ${
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                }`} />
                
                {/* Tooltip */}
                <div className="absolute left-16 ml-3 px-3 py-2 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 shadow-xl text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-50 font-medium">
                  {section.label}
                  <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-slate-800/95 border-l border-t border-slate-600/50 rotate-45"></div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Área principal */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50/30">
          {/* Header superior - Más compacto */}
          <div className="relative z-10 flex-shrink-0">
            <header className="relative mb-2 sticky top-0 z-20 bg-white/70 backdrop-blur-xl rounded-xl p-3 border border-white/20 shadow-lg mx-6 mt-2">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-8 rounded-full bg-gradient-to-b transition-all duration-500 ${currentSection?.color} flex-shrink-0`}>
                  <div className="w-full h-3 bg-white/30 rounded-full animate-pulse"></div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-xs text-slate-600 mb-0.5">
                    <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-600/10 to-blue-500/10 rounded-full font-medium">
                      Gestión de Inventario
                    </span>
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium text-blue-600 text-sm truncate">
                      {sucursalSel?.nombre || 'Sucursal'}
                    </span>
                  </div>

                  <h6 className="text-base font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent leading-tight">
                    {currentSection?.label}
                  </h6>
                </div>
              </div>
            </header>
          </div>

          {/* Contenido principal - Más espacio */}
          <div className="flex-1 relative overflow-y-auto">
            <div className="min-h-full px-4 pb-3">
              {/* Contenido con transiciones */}
              <div className={`relative transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
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
    </Modal>
  );
}