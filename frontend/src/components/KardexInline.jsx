/**
 * Componente KardexInline - Integración dentro de ProductosView
 * Permite realizar conteo físico de inventario y comparar con stock del sistema
 */
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../utils/toast';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export default function KardexInline({ productos }) {
  const { tokenUsuario, usuario, subdominio } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [productosConteo, setProductosConteo] = useState({});
  const [resultadoKardex, setResultadoKardex] = useState(null);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [procesando, setProcesando] = useState(false);

  // Inicializar conteos cuando cambian los productos
  React.useEffect(() => {
    const conteosIniciales = {};
    productos.forEach(p => {
      conteosIniciales[p.id] = '';
    });
    setProductosConteo(conteosIniciales);
    setResultadoKardex(null);
    setMostrarReporte(false);
  }, [productos]);

  // Actualizar cantidad de conteo para un producto
  const handleCantidadChange = (productoId, valor) => {
    setProductosConteo(prev => ({
      ...prev,
      [productoId]: valor
    }));
  };

  // Marcar como igual al sistema
  const handleConteoRapido = (producto) => {
    setProductosConteo(prev => ({
      ...prev,
      [producto.id]: producto.stock || 0
    }));
  };

  // Filtrar productos
  const productosFiltrados = productos.filter(producto => {
    if (!busqueda) return true;
    const search = busqueda.toLowerCase();
    return (
      producto.nombre?.toLowerCase().includes(search) ||
      producto.sku?.toLowerCase().includes(search) ||
      producto.codigo_barras?.toLowerCase().includes(search)
    );
  });

  // Procesar Kardex - comparar conteo físico vs sistema
  const procesarKardex = () => {
    setProcesando(true);

    const diferencias = [];
    let productosCuadrados = 0;
    let productosConDiferencia = 0;
    let productosContados = 0;

    productosFiltrados.forEach(producto => {
      const cantidadSistema = parseInt(producto.stock) || 0;
      const conteoIngresado = productosConteo[producto.id];

      // Solo procesar productos que tienen conteo ingresado
      if (conteoIngresado !== '' && conteoIngresado !== null && conteoIngresado !== undefined) {
        productosContados++;
        const cantidadFisica = parseInt(conteoIngresado) || 0;
        const diferencia = cantidadFisica - cantidadSistema;

        if (diferencia !== 0) {
          productosConDiferencia++;
          diferencias.push({
            producto,
            cantidadSistema,
            cantidadFisica,
            diferencia,
            tipo: diferencia > 0 ? 'sobrante' : 'faltante',
            valorDiferencia: Math.abs(diferencia) * (producto.precio || 0)
          });
        } else {
          productosCuadrados++;
        }
      }
    });

    if (productosContados === 0) {
      showToast('warning', 'Debes ingresar al menos un conteo físico');
      setProcesando(false);
      return;
    }

    const resultado = {
      fecha: new Date().toISOString(),
      usuario: usuario,
      totalProductos: productosFiltrados.length,
      productosContados,
      productosCuadrados,
      productosConDiferencia,
      diferencias,
      porcentajePrecision: productosContados > 0
        ? ((productosCuadrados / productosContados) * 100).toFixed(1)
        : 0,
      valorTotalDiferencias: diferencias.reduce((sum, d) => sum + d.valorDiferencia, 0),
    };

    setResultadoKardex(resultado);
    setMostrarReporte(true);
    setProcesando(false);
  };

  // Exportar a PDF
  const exportarPDF = () => {
    if (!resultadoKardex) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Título
    doc.setFontSize(18);
    doc.text('Reporte de Kardex de Inventario', pageWidth / 2, 20, { align: 'center' });

    // Fecha
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date(resultadoKardex.fecha).toLocaleString()}`, 14, 30);
    doc.text(`Usuario: ${resultadoKardex.usuario}`, 14, 36);

    // Resumen
    doc.setFontSize(14);
    doc.text('Resumen', 14, 50);
    doc.setFontSize(10);
    doc.text(`Total productos: ${resultadoKardex.totalProductos}`, 14, 58);
    doc.text(`Productos contados: ${resultadoKardex.productosContados}`, 14, 64);
    doc.text(`Productos cuadrados: ${resultadoKardex.productosCuadrados}`, 14, 70);
    doc.text(`Productos con diferencia: ${resultadoKardex.productosConDiferencia}`, 14, 76);
    doc.text(`Precisión: ${resultadoKardex.porcentajePrecision}%`, 14, 82);
    doc.text(`Valor total diferencias: $${resultadoKardex.valorTotalDiferencias.toLocaleString()}`, 14, 88);

    let yPosition = 100;
    if (resultadoKardex.diferencias.length > 0) {
      doc.setFontSize(14);
      doc.text('Diferencias Detectadas', 14, yPosition);
      yPosition += 10;

      resultadoKardex.diferencias.forEach((diff, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(10);
        doc.text(
          `${index + 1}. ${diff.producto.nombre}`,
          14,
          yPosition
        );
        yPosition += 6;
        doc.text(
          `   Sistema: ${diff.cantidadSistema} | Físico: ${diff.cantidadFisica} | Diferencia: ${diff.diferencia > 0 ? '+' : ''}${diff.diferencia} (${diff.tipo})`,
          14,
          yPosition
        );
        yPosition += 6;
        doc.text(
          `   Valor diferencia: $${diff.valorDiferencia.toLocaleString()}`,
          14,
          yPosition
        );
        yPosition += 8;
      });
    } else {
      doc.setFontSize(12);
      doc.text('✓ No se detectaron diferencias', 14, yPosition);
    }

    doc.save(`kardex-inventario-${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('success', 'PDF exportado correctamente');
  };

  // Exportar a Excel
  const exportarExcel = () => {
    if (!resultadoKardex) return;

    const data = [
      ['REPORTE DE KARDEX DE INVENTARIO'],
      ['Fecha', new Date(resultadoKardex.fecha).toLocaleString()],
      ['Usuario', resultadoKardex.usuario],
      [],
      ['RESUMEN'],
      ['Total productos', resultadoKardex.totalProductos],
      ['Productos contados', resultadoKardex.productosContados],
      ['Productos cuadrados', resultadoKardex.productosCuadrados],
      ['Productos con diferencia', resultadoKardex.productosConDiferencia],
      ['Precisión', `${resultadoKardex.porcentajePrecision}%`],
      ['Valor total diferencias', resultadoKardex.valorTotalDiferencias],
      [],
    ];

    if (resultadoKardex.diferencias.length > 0) {
      data.push(['DIFERENCIAS DETECTADAS']);
      data.push(['Producto', 'SKU', 'Sistema', 'Físico', 'Diferencia', 'Tipo', 'Valor']);

      resultadoKardex.diferencias.forEach(diff => {
        data.push([
          diff.producto.nombre,
          diff.producto.sku || '',
          diff.cantidadSistema,
          diff.cantidadFisica,
          diff.diferencia,
          diff.tipo,
          diff.valorDiferencia
        ]);
      });
    } else {
      data.push(['No se detectaron diferencias']);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kardex');
    XLSX.writeFile(wb, `kardex-inventario-${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('success', 'Excel exportado correctamente');
  };

  // Reiniciar conteo
  const reiniciarConteo = () => {
    const conteosVacios = {};
    productos.forEach(p => {
      conteosVacios[p.id] = '';
    });
    setProductosConteo(conteosVacios);
    setResultadoKardex(null);
    setMostrarReporte(false);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardDocumentListIcon style={{ width: 28, height: 28 }} />
            Kardex de Inventario
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Realiza el conteo físico de inventario y compara con el stock del sistema
          </p>
        </div>
      </div>

      {/* Estado actual */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:!bg-slate-900 rounded-lg p-4 border border-slate-200 dark:!border-slate-800">
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Productos</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{productos.length}</div>
        </div>
        <div className="bg-white dark:!bg-slate-900 rounded-lg p-4 border border-slate-200 dark:!border-slate-800">
          <div className="text-sm text-slate-600 dark:text-slate-400">Contados</div>
          <div className="text-2xl font-bold text-blue-600">
            {Object.values(productosConteo).filter(v => v !== '' && v !== null && v !== undefined).length}
          </div>
        </div>
        <div className="bg-white dark:!bg-slate-900 rounded-lg p-4 border border-slate-200 dark:!border-slate-800">
          <div className="text-sm text-slate-600 dark:text-slate-400">Por Contar</div>
          <div className="text-2xl font-bold text-orange-600">
            {productos.length - Object.values(productosConteo).filter(v => v !== '' && v !== null && v !== undefined).length}
          </div>
        </div>
        <div className="bg-white dark:!bg-slate-900 rounded-lg p-4 border border-slate-200 dark:!border-slate-800">
          <div className="text-sm text-slate-600 dark:text-slate-400">Stock Total</div>
          <div className="text-2xl font-bold text-emerald-600">
            {productos.reduce((sum, p) => sum + (parseInt(p.stock) || 0), 0)}
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white dark:!bg-slate-900 rounded-lg p-4 border border-slate-200 dark:!border-slate-800">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ width: 20, height: 20 }} />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:!border-slate-600 rounded-lg bg-white dark:!bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <button
            onClick={reiniciarConteo}
            className="px-4 py-2 bg-slate-200 dark:!bg-slate-700 text-slate-700 dark:!text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:!bg-slate-600 transition-colors"
          >
            Reiniciar
          </button>
        </div>
        <div className="flex gap-3">
          <button
            onClick={procesarKardex}
            disabled={procesando}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <ClipboardDocumentListIcon style={{ width: 20, height: 20 }} />
            {procesando ? 'Procesando...' : 'Procesar Kardex'}
          </button>
        </div>
      </div>

      {/* Reporte de resultados */}
      {mostrarReporte && resultadoKardex && (
        <div className="bg-white dark:!bg-slate-900 rounded-lg border border-slate-200 dark:!border-slate-800 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Resultados del Kardex
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={exportarPDF}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <DocumentArrowDownIcon style={{ width: 18, height: 18 }} />
                  PDF
                </button>
                <button
                  onClick={exportarExcel}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <DocumentArrowDownIcon style={{ width: 18, height: 18 }} />
                  Excel
                </button>
              </div>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${resultadoKardex.productosConDiferencia === 0 ? 'bg-emerald-50 dark:!bg-emerald-900/20' : 'bg-amber-50 dark:!bg-amber-900/20'}`}>
                <div className="text-sm text-slate-600 dark:text-slate-400">Precisión</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {resultadoKardex.porcentajePrecision}%
                </div>
              </div>
              <div className="bg-blue-50 dark:!bg-blue-900/20 p-4 rounded-lg">
                <div className="text-sm text-slate-600 dark:text-slate-400">Contados</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {resultadoKardex.productosContados}
                </div>
              </div>
              <div className="bg-emerald-50 dark:!bg-emerald-900/20 p-4 rounded-lg">
                <div className="text-sm text-slate-600 dark:text-slate-400">Cuadrados</div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {resultadoKardex.productosCuadrados}
                </div>
              </div>
              <div className="bg-red-50 dark:!bg-red-900/20 p-4 rounded-lg">
                <div className="text-sm text-slate-600 dark:text-slate-400">Con Diferencia</div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {resultadoKardex.productosConDiferencia}
                </div>
              </div>
            </div>

            {/* Diferencias */}
            {resultadoKardex.diferencias.length > 0 ? (
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <ExclamationTriangleIcon className="text-amber-500" style={{ width: 20, height: 20 }} />
                  Diferencias Detectadas ({resultadoKardex.diferencias.length})
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 dark:!bg-slate-800">
                      <tr>
                        <th className="px-4 py-2 text-left">Producto</th>
                        <th className="px-4 py-2 text-center">Sistema</th>
                        <th className="px-4 py-2 text-center">Físico</th>
                        <th className="px-4 py-2 text-center">Diferencia</th>
                        <th className="px-4 py-2 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultadoKardex.diferencias.map((diff, index) => (
                        <tr key={index} className="border-t border-slate-200 dark:!border-slate-700">
                          <td className="px-4 py-2">
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {diff.producto.nombre}
                            </div>
                            <div className="text-xs text-slate-500">
                              {diff.producto.sku || diff.producto.codigo_barras || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center text-slate-600 dark:text-slate-400">
                            {diff.cantidadSistema}
                          </td>
                          <td className="px-4 py-2 text-center text-slate-900 dark:text-slate-100">
                            {diff.cantidadFisica}
                          </td>
                          <td className={`px-4 py-2 text-center font-semibold ${
                            diff.tipo === 'sobrante'
                              ? 'text-emerald-600'
                              : 'text-red-600'
                          }`}>
                            {diff.diferencia > 0 ? '+' : ''}{diff.diferencia}
                            <span className="text-xs ml-1">({diff.tipo})</span>
                          </td>
                          <td className="px-4 py-2 text-right text-slate-900 dark:text-slate-100">
                            ${diff.valorDiferencia.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircleIcon className="mx-auto text-emerald-500 mb-2" style={{ width: 48, height: 48 }} />
                <p className="text-emerald-600 font-semibold">¡Inventario Cuadrado!</p>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Todos los productos contados coinciden con el stock del sistema
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabla de productos para conteo */}
      {!mostrarReporte && (
        <div className="bg-white dark:!bg-slate-900 rounded-lg border border-slate-200 dark:!border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:!bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">Producto</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-slate-100">SKU</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-slate-100">Stock Sistema</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-slate-100">Conteo Físico</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-slate-100">Acción</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                      No se encontraron productos
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((producto) => (
                    <tr key={producto.id} className="border-t border-slate-200 dark:!border-slate-700 hover:bg-slate-50 dark:hover:!bg-slate-800">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {producto.nombre}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                        {producto.sku || producto.codigo_barras || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:!bg-blue-900 text-blue-800 dark:text-blue-200">
                          {parseInt(producto.stock) || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={productosConteo[producto.id] || ''}
                          onChange={(e) => handleCantidadChange(producto.id, e.target.value)}
                          placeholder="0"
                          className="w-24 px-3 py-1 border border-slate-300 dark:!border-slate-600 rounded-lg bg-white dark:!bg-slate-800 text-slate-900 dark:text-slate-100 text-center"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleConteoRapido(producto)}
                          className="px-3 py-1 bg-emerald-100 dark:!bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:!bg-emerald-800 transition-colors text-sm font-medium"
                        >
                          Igualar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
