/**
 * Helper para exportación de historial de arqueos
 * Separa lógica de exportación del componente UI
 */

import { postDownload } from '../services/api';
import { showToast } from './toast';

/**
 * Exporta historial de arqueos a Excel
 * @param {Object} params - Parámetros de exportación
 * @param {string} params.token - Token de autenticación
 * @param {string} params.usuario - Usuario
 * @param {string} params.subdominio - Subdominio
 * @param {number} params.id_sucursal - ID de sucursal (opcional)
 * @param {string} params.fecha_desde - Fecha desde (opcional)
 * @param {string} params.fecha_hasta - Fecha hasta (opcional)
 * @param {Function} params.onProgress - Callback de progreso (opcional)
 * @returns {Promise<void>}
 */
export async function exportarHistorialExcel(params, onProgress) {
  try {
    if (onProgress) onProgress({ loading: true, message: 'Generando Excel...' });

    // ✅ Usar postDownload para manejar blobs correctamente
    const { blob, headers } = await postDownload('api/caja/historial_arqueos/export/excel/', {
      ...params,
      modo_exportacion: true  // 🔑 CLAVE: sin límites
    });

    // Descargar archivo
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Extraer nombre de archivo del Content-Disposition
    const disposition = headers.get('Content-Disposition') || '';
    const filenameMatch = disposition.match(/filename\*?=['"]*UTF-8['"]*''([^;]+)/i);
    const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : `historial_arqueos_${new Date().toISOString().split('T')[0]}.xlsx`;

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    if (onProgress) onProgress({ loading: false });
    showToast('success', 'Excel exportado correctamente');
    return { success: true };
  } catch (error) {
    console.error('Error al exportar Excel:', error);
    if (onProgress) onProgress({ loading: false, error: error.message });
    showToast('error', error.message || 'Error al exportar Excel');
    return { success: false, error: error.message };
  }
}

/**
 * Exporta historial de arqueos a PDF
 * @param {Object} params - Parámetros de exportación
 * @param {string} params.token - Token de autenticación
 * @param {string} params.usuario - Usuario
 * @param {string} params.subdominio - Subdominio
 * @param {number} params.id_sucursal - ID de sucursal (opcional)
 * @param {string} params.fecha_desde - Fecha desde (opcional)
 * @param {string} params.fecha_hasta - Fecha hasta (opcional)
 * @param {Function} params.onProgress - Callback de progreso (opcional)
 * @returns {Promise<void>}
 */
export async function exportarHistorialPDF(params, onProgress) {
  try {
    if (onProgress) onProgress({ loading: true, message: 'Generando PDF...' });

    // ✅ Usar postDownload para manejar blobs correctamente
    const { blob, headers } = await postDownload('api/caja/historial_arqueos/export/pdf/', {
      ...params,
      modo_exportacion: true  // 🔑 CLAVE: sin límites
    });

    // Descargar archivo
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Extraer nombre de archivo del Content-Disposition
    const disposition = headers.get('Content-Disposition') || '';
    const filenameMatch = disposition.match(/filename\*?=['"]*UTF-8['"]*''([^;]+)/i);
    const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : `historial_arqueos_${new Date().toISOString().split('T')[0]}.pdf`;

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    if (onProgress) onProgress({ loading: false });
    showToast('success', 'PDF exportado correctamente');
    return { success: true };
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    if (onProgress) onProgress({ loading: false, error: error.message });
    showToast('error', error.message || 'Error al exportar PDF');
    return { success: false, error: error.message };
  }
}
