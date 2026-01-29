/**
 * Servicio API para Analytics
 * Consume los endpoints del módulo de analytics del backend
 */

const ANALYTICS_BASE_URL = '/api/analytics';

/**
 * Helper para hacer fetch con autenticación
 */
export async function fetchAnalytics(endpoint, authData, options = {}) {
  const { usuario, tokenUsuario, subdominio } = authData;

  const url = `${ANALYTICS_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Construir URL con query params
  const urlWithParams = new URL(url, window.location.origin);

  // Agregar parámetros de autenticación
  if (usuario) urlWithParams.searchParams.set('usuario', usuario);
  if (tokenUsuario) urlWithParams.searchParams.set('token', tokenUsuario);
  if (subdominio) urlWithParams.searchParams.set('subdominio', subdominio);

  // Agregar query params adicionales
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlWithParams.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(urlWithParams.toString(), {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Detectar CUALQUIER error 401 y limpiar sesión
    if (response.status === 401) {
      console.warn('⚠️ Error 401 detectado en analytics. Limpiando sesión y redirigiendo al login...');
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * KPIs Generales del Dashboard
 */
export function fetchKPIsGenerales(authData, params = {}) {
  return fetchAnalytics('/kpis/', authData, { params });
}

/**
 * Ventas Totales
 */
export function fetchVentasTotales(authData, params = {}) {
  return fetchAnalytics('/ventas/totales/', authData, { params });
}

/**
 * Tendencia de Ventas
 */
export function fetchTendenciaVentas(authData, params = {}) {
  return fetchAnalytics('/ventas/tendencia/', authData, { params });
}

/**
 * Top Productos
 */
export function fetchTopProductos(authData, params = {}) {
  return fetchAnalytics('/ventas/top-productos/', authData, { params });
}

/**
 * Ventas por Categoría
 */
export function fetchVentasPorCategoria(authData, params = {}) {
  return fetchAnalytics('/ventas/por-categoria/', authData, { params });
}

/**
 * Ventas por Sucursal
 */
export function fetchVentasPorSucursal(authData, params = {}) {
  return fetchAnalytics('/ventas/por-sucursal/', authData, { params });
}

/**
 * Resumen de Inventario
 */
export function fetchInventarioResumen(authData, params = {}) {
  return fetchAnalytics('/inventario/resumen/', authData, { params });
}

/**
 * Productos con Stock Bajo
 */
export function fetchStockBajo(authData, params = {}) {
  return fetchAnalytics('/inventario/stock-bajo/', authData, { params });
}

/**
 * Productos sin Rotación
 */
export function fetchSinRotacion(authData, params = {}) {
  return fetchAnalytics('/inventario/sin-rotacion/', authData, { params });
}

/**
 * Existencias por Bodega
 */
export function fetchExistenciasPorBodega(authData, params = {}) {
  return fetchAnalytics('/inventario/por-bodega/', authData, { params });
}

/**
 * Comparativa de Períodos
 */
export function fetchComparativaPeriodos(authData, params = {}) {
  return fetchAnalytics('/comparativa-periodos/', authData, { params });
}
