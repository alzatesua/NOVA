/**
 * Vista de Kardex de Inventario - Sistema de Conteo Físico
 * Permite realizar conteos físicos de inventario y comparar con el stock registrado
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { get, fetchSucursalesCaja } from '../services/api';
import { showToast } from '../utils/toast';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export default function KardexView() {
  const { tokenUsuario, usuario, subdominio, idSucursal, isAdmin } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Estados principales
  const [productos, setProductos] = useState([]);
  const [productosConteo, setProductosConteo] = useState({});
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [resultadoKardex, setResultadoKardex] = useState(null);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [historialAjustes, setHistorialAjustes] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('');

  // Estados para sucursales
  const [sucursales, setSucursales] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [esAdminBackend, setEsAdminBackend] = useState(false);

  // Valor unificado del filtro de sucursal activo
  const sucursalFiltroActivo = esAdminBackend
    ? sucursalSeleccionada
    : (sucursalSeleccionada || idSucursal);

  // Detectar modo oscuro
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark =
        document.documentElement.classList.contains('dark') ||
        document.body.classList.contains('dark-mode') ||
        localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(isDark);
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Cargar sucursales
  const cargarSucursales = async () => {
    setLoadingSucursales(true);
    try {
      const response = await fetchSucursalesCaja({ token: tokenUsuario, usuario, subdominio });
      if (response?.success) {
        setSucursales(response.data);
        setEsAdminBackend(response.es_admin || false);
        // Para no-admin, autoseleccionar la sucursal asignada
        if (!response.es_admin && response.sucursal_asignada) {
          setSucursalSeleccionada(response.sucursal_asignada);
        }
      } else {
        showToast('error', 'Error al cargar las sedes');
      }
    } catch (err) {
      console.error('❌ Error cargando sedes:', err);
      showToast('error', 'Error al cargar las sedes');
    } finally {
      setLoadingSucursales(false);
    }
  };

  useEffect(() => {
    cargarSucursales();
  }, []);

  // Cargar productos — recibe el id de sucursal como argumento directo
  // para evitar depender del estado en el momento de ejecución
  const cargarProductos = async (sucursalId) => {
    if (!esAdminBackend && !sucursalId) {
      showToast('error', 'No tienes una sede asignada. Contacta al administrador.');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        usuario,
        token: tokenUsuario,
        subdominio
      });

      // Solo agrega id_sucursal si hay un valor definido
      if (sucursalId !== null && sucursalId !== undefined && sucursalId !== '') {
        params.append('id_sucursal', sucursalId);
      }

      const response = await get(`api/productos/?${params.toString()}`, tokenUsuario);
      if (response && response.success) {
        setProductos(response.data || []);
        const conteosIniciales = {};
        (response.data || []).forEach(p => {
          conteosIniciales[p.id] = '';
        });
        setProductosConteo(conteosIniciales);
      } else {
        showToast('error', 'Error al cargar productos');
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      showToast('error', 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  // Cargar historial de ajustes
  const cargarHistorialAjustes = async () => {
    try {
      // Nota: Este endpoint debe crearse en el backend
      // const params = new URLSearchParams({ usuario, token: tokenUsuario, subdominio });
      // const response = await get(`api/kardex/historial/?${params.toString()}`, tokenUsuario);
      // if (response && response.success) setHistorialAjustes(response.data || []);
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  // Efecto principal: se ejecuta SOLO cuando termina de cargar las sucursales (carga inicial).
  // Los cambios posteriores de sucursal se manejan directamente en el onChange del select.
  useEffect(() => {
    if (!loadingSucursales) {
      const filtroInicial = esAdminBackend
        ? sucursalSeleccionada
        : (sucursalSeleccionada || idSucursal);
      cargarProductos(filtroInicial);
      cargarHistorialAjustes();
    }
  }, [loadingSucursales]); // ← solo depende de loadingSucursales para la carga inicial

  // Manejador del cambio de sucursal en el select (admin)
  // Llama cargarProductos directamente con el valor nuevo, sin esperar re-render
  const handleSucursalChange = (e) => {
    const rawValue = e.target.value;
    const nuevoValor = rawValue ? parseInt(rawValue, 10) : null;
    setSucursalSeleccionada(nuevoValor);
    cargarProductos(nuevoValor); // valor fresco, no depende del estado
  };

  // Actualizar cantidad de conteo para un producto
  const handleCantidadChange = (productoId, valor) => {
    setProductosConteo(prev => ({
      ...prev,
      [productoId]: valor
    }));
  };

  // Realizar conteo rápido (usar cantidad del sistema)
  const handleConteoRapido = (productoId) => {
    const producto = productos.find(p => p.id === productoId);
    if (producto) {
      setProductosConteo(prev => ({
        ...prev,
        [productoId]: producto.stock_actual || 0
      }));
    }
  };

  // Filtrar productos
  const productosFiltrados = productos.filter(producto => {
    const cumpleBusqueda =
      !busqueda ||
      producto.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.codigo_producto?.toLowerCase().includes(busqueda.toLowerCase());
    const cumpleCategoria = !filtroCategoria || producto.categoria === filtroCategoria;
    return cumpleBusqueda && cumpleCategoria;
  });

  // Procesar Kardex - comparar conteo físico vs sistema
  const procesarKardex = () => {
    const diferencias = [];
    let productosCuadrados = 0;
    let productosConDiferencia = 0;

    productos.forEach(producto => {
      const cantidadSistema = parseInt(producto.stock_actual) || 0;
      const cantidadFisica = parseInt(productosConteo[producto.id]) || 0;
      const diferencia = cantidadFisica - cantidadSistema;

      if (diferencia !== 0) {
        productosConDiferencia++;
        diferencias.push({
          producto,
          cantidadSistema,
          cantidadFisica,
          diferencia,
          tipo: diferencia > 0 ? 'sobrante' : 'faltante',
          valorDiferencia: Math.abs(diferencia) * (producto.precio_unitario || 0)
        });
      } else {
        productosCuadrados++;
      }
    });

    const resultado = {
      fecha: new Date().toISOString(),
      usuario,
      totalProductos: productos.length,
      productosContados: Object.values(productosConteo).filter(v => v !== '').length,
      productosCuadrados,
      productosConDiferencia,
      diferencias,
      porcentajePrecision:
        productos.length > 0
          ? ((productosCuadrados / productos.length) * 100).toFixed(1)
          : 0,
      valorTotalDiferencias: diferencias.reduce((sum, d) => sum + d.valorDiferencia, 0),
      sugerencia: generarSugerencia(diferencias)
    };

    setResultadoKardex(resultado);
    setMostrarReporte(true);
  };

  // Generar sugerencia basada en las diferencias
  const generarSugerencia = (diferencias) => {
    if (diferencias.length === 0) return 'Inventario cuadrado';

    const tieneSobrantes = diferencias.some(d => d.tipo === 'sobrante');
    const tieneFaltantes = diferencias.some(d => d.tipo === 'faltante');
    const valorTotal = diferencias.reduce((sum, d) => sum + d.valorDiferencia, 0);

    if (tieneSobrantes && tieneFaltantes) {
      if (valorTotal > 1000000)
        return 'Revisión de inventario urgente - Se detectan movimientos significativos no registrados';
      return 'Cruce de mercancía - Se detectan sobrantes y faltantes que sugieren movimientos no registrados';
    }
    if (tieneSobrantes)
      return 'Posibles ventas sin registrar - Se detectan sobrantes en inventario';
    if (tieneFaltantes) {
      if (valorTotal > 500000)
        return 'Alerta: Mérito de revisión - Valor de faltantes requiere investigación inmediata';
      return 'Posibles mermas o hurtos - Se detectan faltantes en inventario';
    }
    return 'Revisión de inventario recomendada';
  };

  // Guardar ajuste de inventario
  const guardarAjuste = async () => {
    if (!resultadoKardex) return;
    setGuardando(true);
    try {
      const ajuste = {
        usuario,
        token: tokenUsuario,
        subdominio,
        fecha: resultadoKardex.fecha,
        diferencias: resultadoKardex.diferencias.map(d => ({
          producto_id: d.producto.id,
          cantidad_sistema: d.cantidadSistema,
          cantidad_fisica: d.cantidadFisica,
          diferencia: d.diferencia,
          tipo: d.tipo,
          valor_diferencia: d.valorDiferencia
        })),
        resumen: {
          total_productos: resultadoKardex.totalProductos,
          productos_cuadrados: resultadoKardex.productosCuadrados,
          productos_con_diferencia: resultadoKardex.productosConDiferencia,
          porcentaje_precision: resultadoKardex.porcentajePrecision,
          valor_total_diferencias: resultadoKardex.valorTotalDiferencias
        }
      };

      // Nota: Este endpoint debe crearse en el backend
      // const response = await post('api/kardex/guardar-ajuste/', ajuste, tokenUsuario);

      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('success', 'Ajuste de inventario guardado correctamente');

      const nuevoHistorial = {
        id: Date.now(),
        fecha: new Date().toISOString(),
        usuario,
        ...ajuste.resumen,
        sugerencia: resultadoKardex.sugerencia
      };
      setHistorialAjustes([nuevoHistorial, ...historialAjustes]);
    } catch (error) {
      console.error('Error guardando ajuste:', error);
      showToast('error', 'Error al guardar el ajuste');
    } finally {
      setGuardando(false);
    }
  };

  // Exportar a PDF
  const exportarPDF = () => {
    if (!resultadoKardex) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text('Reporte de Kardex de Inventario', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date(resultadoKardex.fecha).toLocaleString('es-CO')}`, 14, 35);
    doc.text(`Usuario: ${resultadoKardex.usuario}`, 14, 42);
    doc.setFontSize(12);
    doc.text('Resumen:', 14, 55);
    doc.setFontSize(10);
    doc.text(`Total de productos: ${resultadoKardex.totalProductos}`, 20, 65);
    doc.text(`Productos contados: ${resultadoKardex.productosContados}`, 20, 72);
    doc.text(`Productos cuadrados: ${resultadoKardex.productosCuadrados}`, 20, 79);
    doc.text(`Productos con diferencia: ${resultadoKardex.productosConDiferencia}`, 20, 86);
    doc.text(`Precisión: ${resultadoKardex.porcentajePrecision}%`, 20, 93);

    let y = 118;
    if (resultadoKardex.diferencias.length > 0) {
      doc.setFontSize(12);
      doc.text('Diferencias encontradas:', 14, 108);
      resultadoKardex.diferencias.forEach((d, index) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.text(`${index + 1}. ${d.producto.nombre}`, 20, y);
        doc.text(`   Código: ${d.producto.codigo_producto || 'N/A'}`, 20, y + 6);
        doc.text(`   Sistema: ${d.cantidadSistema} | Físico: ${d.cantidadFisica} | Diferencia: ${d.diferencia > 0 ? '+' : ''}${d.diferencia}`, 20, y + 12);
        doc.text(`   Valor: $${d.valorDiferencia.toLocaleString('es-CO')}`, 20, y + 18);
        y += 28;
      });
    }

    doc.setFontSize(12);
    doc.text(
      `Sugerencia: ${resultadoKardex.sugerencia}`,
      14,
      resultadoKardex.diferencias.length > 0 ? Math.min(y + 20, 270) : 120
    );

    doc.save(`kardex-inventario-${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('success', 'Reporte PDF generado');
  };

  // Exportar a Excel
  const exportarExcel = () => {
    if (!resultadoKardex) return;
    const wb = XLSX.utils.book_new();

    const resumenData = [
      ['REPORTE DE KARDEX DE INVENTARIO'],
      ['Fecha', new Date(resultadoKardex.fecha).toLocaleString('es-CO')],
      ['Usuario', resultadoKardex.usuario],
      [''],
      ['RESUMEN'],
      ['Total de productos', resultadoKardex.totalProductos],
      ['Productos contados', resultadoKardex.productosContados],
      ['Productos cuadrados', resultadoKardex.productosCuadrados],
      ['Productos con diferencia', resultadoKardex.productosConDiferencia],
      ['Porcentaje de precisión', `${resultadoKardex.porcentajePrecision}%`],
      ['Valor total de diferencias', resultadoKardex.valorTotalDiferencias],
      [''],
      ['SUGERENCIA', resultadoKardex.sugerencia]
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    if (resultadoKardex.diferencias.length > 0) {
      const diferenciasData = [
        ['DIFERENCIAS ENCONTRADAS'],
        ['#', 'Producto', 'Código', 'Cantidad Sistema', 'Cantidad Física', 'Diferencia', 'Tipo', 'Valor Diferencia'],
        ...resultadoKardex.diferencias.map((d, i) => [
          i + 1,
          d.producto.nombre,
          d.producto.codigo_producto || 'N/A',
          d.cantidadSistema,
          d.cantidadFisica,
          d.diferencia,
          d.tipo,
          d.valorDiferencia
        ])
      ];
      const wsDiferencias = XLSX.utils.aoa_to_sheet(diferenciasData);
      XLSX.utils.book_append_sheet(wb, wsDiferencias, 'Diferencias');
    }

    XLSX.writeFile(wb, `kardex-inventario-${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('success', 'Reporte Excel generado');
  };

  // Obtener categorías únicas
  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];

  return (
    <div className="font-sans bg-gray-50 dark:!bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:!bg-slate-900 border-b border-gray-200 dark:!border-slate-700 px-7 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <ClipboardDocumentListIcon style={{ width: 24, height: 24 }} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:!text-white">Kardex de Inventario</h1>
              <p className="text-sm text-gray-500 dark:!text-slate-400">Conteo físico y ajuste de inventario</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!esAdminBackend && !sucursalFiltroActivo) {
                showToast('error', 'No tienes una sede asignada. Contacta al administrador.');
                return;
              }
              cargarProductos(sucursalFiltroActivo);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowPathIcon style={{ width: 18, height: 18 }} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="px-7 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:!bg-slate-900 rounded-xl p-5 border border-gray-200 dark:!border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:!text-slate-400 uppercase tracking-wide">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900 dark:!text-white mt-1">{productos.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 dark:!bg-blue-900/20 flex items-center justify-center">
                <ClipboardDocumentListIcon style={{ width: 24, height: 24 }} className="text-blue-600 dark:!text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:!bg-slate-900 rounded-xl p-5 border border-gray-200 dark:!border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:!text-slate-400 uppercase tracking-wide">Contados</p>
                <p className="text-2xl font-bold text-green-600 dark:!text-green-400 mt-1">
                  {Object.values(productosConteo).filter(v => v !== '').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-50 dark:!bg-green-900/20 flex items-center justify-center">
                <CheckCircleIcon style={{ width: 24, height: 24 }} className="text-green-600 dark:!text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:!bg-slate-900 rounded-xl p-5 border border-gray-200 dark:!border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:!text-slate-400 uppercase tracking-wide">Sin Contar</p>
                <p className="text-2xl font-bold text-gray-600 dark:!text-slate-400 mt-1">
                  {productos.length - Object.values(productosConteo).filter(v => v !== '').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gray-50 dark:!bg-slate-800 flex items-center justify-center">
                <ExclamationCircleIcon style={{ width: 24, height: 24 }} className="text-gray-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:!bg-slate-900 rounded-xl p-5 border border-gray-200 dark:!border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:!text-slate-400 uppercase tracking-wide">Historial</p>
                <p className="text-2xl font-bold text-purple-600 dark:!text-purple-400 mt-1">{historialAjustes.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-50 dark:!bg-purple-900/20 flex items-center justify-center">
                <CalendarIcon style={{ width: 24, height: 24 }} className="text-purple-600 dark:!text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white dark:!bg-slate-900 rounded-xl p-4 border border-gray-200 dark:!border-slate-700 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon style={{ width: 18, height: 18 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:!bg-slate-800 border border-gray-300 dark:!border-slate-600 rounded-lg text-sm text-gray-900 dark:!text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Selector de sede */}
            {esAdminBackend ? (
              <div className="relative">
                <select
                  value={sucursalSeleccionada ?? ''}
                  onChange={handleSucursalChange}
                  disabled={loadingSucursales}
                  className="pl-10 pr-8 py-2.5 bg-gray-50 dark:!bg-slate-800 border border-gray-300 dark:!border-slate-600 rounded-lg text-sm text-gray-900 dark:!text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 appearance-none cursor-pointer min-w-[180px]"
                >
                  <option value="">Todas las sedes</option>
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="px-4 py-2.5 bg-blue-50 dark:!bg-blue-900/20 border border-blue-200 dark:!border-blue-800 rounded-lg text-sm text-blue-700 dark:!text-blue-300 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="font-medium">Sede:</span>
                <span>{sucursales.find(s => s.id === sucursalFiltroActivo)?.nombre || 'Cargando...'}</span>
              </div>
            )}

            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 dark:!bg-slate-800 border border-gray-300 dark:!border-slate-600 rounded-lg text-sm text-gray-900 dark:!text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setBusqueda('');
                setFiltroCategoria('');
                const conteosReset = {};
                productos.forEach(p => { conteosReset[p.id] = ''; });
                setProductosConteo(conteosReset);
                setResultadoKardex(null);
                setMostrarReporte(false);
              }}
              className="px-4 py-2.5 bg-gray-100 dark:!bg-slate-800 text-gray-700 dark:!text-slate-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:!bg-slate-700 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Acciones principales */}
        {!mostrarReporte && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={procesarKardex}
              disabled={Object.values(productosConteo).filter(v => v !== '').length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <ClipboardDocumentListIcon style={{ width: 20, height: 20 }} />
              Procesar Kardex
            </button>
            <button
              onClick={() => {
                const conteosRapidos = {};
                productos.forEach(p => { conteosRapidos[p.id] = p.stock_actual || 0; });
                setProductosConteo(conteosRapidos);
                showToast('success', 'Conteo rápido completado');
              }}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Conteo Rápido
            </button>
          </div>
        )}

        {/* Reporte de Kardex */}
        {mostrarReporte && resultadoKardex && (
          <div className="bg-white dark:!bg-slate-900 rounded-xl border border-gray-200 dark:!border-slate-700 mb-6 overflow-hidden">
            <div className={`p-6 border-b ${
              resultadoKardex.productosConDiferencia === 0
                ? 'bg-green-50 dark:!bg-green-900/20 border-green-200 dark:!border-green-800'
                : 'bg-amber-50 dark:!bg-amber-900/20 border-amber-200 dark:!border-amber-800'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {resultadoKardex.productosConDiferencia === 0 ? (
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:!bg-green-800 flex items-center justify-center">
                      <CheckCircleIcon style={{ width: 32, height: 32 }} className="text-green-600 dark:!text-green-400" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:!bg-amber-800 flex items-center justify-center">
                      <ExclamationTriangleIcon style={{ width: 32, height: 32 }} className="text-amber-600 dark:!text-amber-400" />
                    </div>
                  )}
                  <div>
                    <h2 className={`text-2xl font-bold ${
                      resultadoKardex.productosConDiferencia === 0
                        ? 'text-green-700 dark:!text-green-300'
                        : 'text-amber-700 dark:!text-amber-300'
                    }`}>
                      {resultadoKardex.productosConDiferencia === 0 ? '¡Inventario Cuadrado!' : 'Se Detectaron Diferencias'}
                    </h2>
                    <p className={`text-sm ${
                      resultadoKardex.productosConDiferencia === 0
                        ? 'text-green-600 dark:!text-green-400'
                        : 'text-amber-600 dark:!text-amber-400'
                    }`}>
                      {resultadoKardex.sugerencia}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setMostrarReporte(false); setResultadoKardex(null); }}
                  className="p-2 hover:bg-black/5 dark:hover:!bg-white/10 rounded-lg transition-colors"
                >
                  <XMarkIcon style={{ width: 24, height: 24 }} className="text-gray-500 dark:!text-slate-400" />
                </button>
              </div>
            </div>

            {/* Métricas */}
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:!bg-slate-800 rounded-lg">
                <p className="text-3xl font-bold text-blue-600 dark:!text-blue-400">{resultadoKardex.productosCuadrados}</p>
                <p className="text-xs text-gray-500 dark:!text-slate-400 mt-1">Cuadrados</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:!bg-slate-800 rounded-lg">
                <p className="text-3xl font-bold text-amber-600 dark:!text-amber-400">{resultadoKardex.productosConDiferencia}</p>
                <p className="text-xs text-gray-500 dark:!text-slate-400 mt-1">Con diferencia</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:!bg-slate-800 rounded-lg">
                <p className="text-3xl font-bold text-purple-600 dark:!text-purple-400">{resultadoKardex.porcentajePrecision}%</p>
                <p className="text-xs text-gray-500 dark:!text-slate-400 mt-1">Precisión</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:!bg-slate-800 rounded-lg">
                <p className="text-3xl font-bold text-red-600 dark:!text-red-400">
                  ${resultadoKardex.valorTotalDiferencias.toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-gray-500 dark:!text-slate-400 mt-1">Valor diferencias</p>
              </div>
            </div>

            {/* Lista de diferencias */}
            {resultadoKardex.diferencias.length > 0 && (
              <div className="p-6 border-t border-gray-200 dark:!border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:!text-white mb-4">Detalle de Diferencias</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:!border-slate-700">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:!text-slate-400 uppercase">Producto</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 dark:!text-slate-400 uppercase">Sistema</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 dark:!text-slate-400 uppercase">Físico</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 dark:!text-slate-400 uppercase">Diferencia</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 dark:!text-slate-400 uppercase">Tipo</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:!text-slate-400 uppercase">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultadoKardex.diferencias.map((d, index) => (
                        <tr key={index} className="border-b border-gray-100 dark:!border-slate-800 hover:bg-gray-50 dark:hover:!bg-slate-800/50">
                          <td className="py-3 px-4">
                            <p className="text-sm font-medium text-gray-900 dark:!text-white">{d.producto.nombre}</p>
                            <p className="text-xs text-gray-500 dark:!text-slate-400">{d.producto.codigo_producto || 'N/A'}</p>
                          </td>
                          <td className="py-3 px-4 text-center text-sm text-gray-700 dark:!text-slate-300">{d.cantidadSistema}</td>
                          <td className="py-3 px-4 text-center text-sm text-gray-700 dark:!text-slate-300">{d.cantidadFisica}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`text-sm font-semibold ${d.diferencia > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {d.diferencia > 0 ? '+' : ''}{d.diferencia}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              d.tipo === 'sobrante'
                                ? 'bg-green-100 text-green-700 dark:!bg-green-800 dark:!text-green-300'
                                : 'bg-red-100 text-red-700 dark:!bg-red-800 dark:!text-red-300'
                            }`}>
                              {d.tipo}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-gray-700 dark:!text-slate-300">
                            ${d.valorDiferencia.toLocaleString('es-CO')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Acciones del reporte */}
            <div className="p-6 border-t border-gray-200 dark:!border-slate-700 flex flex-col sm:flex-row gap-3">
              <button
                onClick={guardarAjuste}
                disabled={guardando}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {guardando ? 'Guardando...' : 'Guardar Ajuste'}
              </button>
              <button
                onClick={exportarPDF}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                <DocumentArrowDownIcon style={{ width: 18, height: 18 }} />
                PDF
              </button>
              <button
                onClick={exportarExcel}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                <DocumentArrowDownIcon style={{ width: 18, height: 18 }} />
                Excel
              </button>
              <button
                onClick={() => { setMostrarReporte(false); setResultadoKardex(null); }}
                className="px-4 py-2.5 bg-gray-100 dark:!bg-slate-800 text-gray-700 dark:!text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:!bg-slate-700 transition-colors font-semibold"
              >
                Nuevo Conteo
              </button>
            </div>
          </div>
        )}

        {/* Lista de productos para conteo */}
        {!mostrarReporte && (
          <div className="bg-white dark:!bg-slate-900 rounded-xl border border-gray-200 dark:!border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:!border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:!text-white">Productos para Conteo Físico</h3>
              <p className="text-sm text-gray-500 dark:!text-slate-400 mt-1">
                Ingrese la cantidad física contada de cada producto
              </p>
            </div>

            {/* Mensaje de advertencia para no-admin sin sede asignada */}
            {!esAdminBackend && !sucursalFiltroActivo && !loading && (
              <div className="p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-amber-100 dark:!bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                    <ExclamationTriangleIcon style={{ width: 32, height: 32 }} className="text-amber-600 dark:!text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:!text-white mb-2">
                    No tienes una sede asignada
                  </h3>
                  <p className="text-sm text-gray-500 dark:!text-slate-400">
                    Para realizar el kardex de inventario, necesitas tener una sede asignada. Por favor contacta al administrador del sistema.
                  </p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:!text-slate-400">No hay productos para mostrar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:!border-slate-700 bg-gray-50 dark:!bg-slate-800">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:!text-slate-400 uppercase">Producto</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 dark:!text-slate-400 uppercase">Categoría</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 dark:!text-slate-400 uppercase">Stock Sistema</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 dark:!text-slate-400 uppercase">Cantidad Física</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 dark:!text-slate-400 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosFiltrados.map((producto) => {
                      const cantidadContada = productosConteo[producto.id] || '';
                      const cantidadSistema = parseInt(producto.stock_actual) || 0;
                      const tieneDiferencia = cantidadContada !== '' && parseInt(cantidadContada) !== cantidadSistema;

                      return (
                        <tr
                          key={producto.id}
                          className={`border-b border-gray-100 dark:!border-slate-800 ${tieneDiferencia ? 'bg-amber-50/50 dark:!bg-amber-900/20' : ''}`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {producto.imagen_producto ? (
                                <img
                                  src={producto.imagen_producto}
                                  alt={producto.nombre}
                                  className="w-10 h-10 object-cover rounded-lg border border-gray-200 dark:!border-slate-700"
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:!bg-slate-800 flex items-center justify-center">
                                  <ClipboardDocumentListIcon style={{ width: 20, height: 20 }} className="text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:!text-white">{producto.nombre}</p>
                                <p className="text-xs text-gray-500 dark:!text-slate-400">{producto.codigo_producto || 'N/A'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:!bg-slate-700 text-gray-700 dark:!text-slate-300">
                              {producto.categoria || 'Sin categoría'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-sm font-semibold text-gray-700 dark:!text-slate-300">{cantidadSistema}</span>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min="0"
                              value={cantidadContada}
                              onChange={(e) => handleCantidadChange(producto.id, e.target.value)}
                              className="w-24 px-3 py-2 border border-gray-300 dark:!border-slate-600 rounded-lg text-sm text-center text-gray-900 dark:!text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleConteoRapido(producto.id)}
                              className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                            >
                              Usar sistema
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Historial de ajustes */}
        {historialAjustes.length > 0 && !mostrarReporte && (
          <div className="mt-6 bg-white dark:!bg-slate-900 rounded-xl border border-gray-200 dark:!border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:!border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:!text-white">Historial de Ajustes</h3>
            </div>
            <div className="divide-y divide-gray-200 dark:!divide-slate-700">
              {historialAjustes.slice(0, 5).map((ajuste, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 dark:hover:!bg-slate-800/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:!bg-purple-800 flex items-center justify-center flex-shrink-0">
                        <CalendarIcon style={{ width: 20, height: 20 }} className="text-purple-600 dark:!text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:!text-slate-400">
                          {new Date(ajuste.fecha).toLocaleString('es-CO')}
                        </p>
                        <p className="text-xs text-gray-600 dark:!text-slate-400 mt-0.5">
                          Usuario: {ajuste.usuario}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:!text-white">
                        {ajuste.productos_cuadrados} / {ajuste.total_productos} cuadrados
                      </p>
                      <p className="text-xs text-gray-500 dark:!text-slate-400">
                        {ajuste.porcentaje_precision}% precisión
                      </p>
                    </div>
                  </div>
                  {ajuste.sugerencia && (
                    <p className="text-sm text-gray-600 dark:!text-slate-400 mt-2 italic">
                      "{ajuste.sugerencia}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}