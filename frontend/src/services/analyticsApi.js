/**
 * Servicio API para Analytics
 * Consume los endpoints del módulo de analytics del backend
 */

const ANALYTICS_BASE_URL = '/api/analytics';

let isRefreshing = false;
let failedQueue = [];

/**
 * Procesa la cola de peticiones fallidas después de un refresh exitoso
 */
function processQueue(error, token = null) {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

/**
 * Refresca el token de acceso usando el refresh token
 * @returns {Promise<string>} Nuevo access token
 * @throws {Error} Si no se puede refrescar el token
 */
async function refreshAccessToken() {
  // Si ya hay un refresh en progreso, esperar a que termine
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const refreshToken = localStorage.getItem('auth_refresh_token');

    if (!refreshToken) {
      throw new Error('No hay refresh token disponible');
    }

    const response = await fetch(`/api/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken })
    });

    if (!response.ok) {
      // Si el refresh token también expiró o es inválido
      if (response.status === 401) {
        throw new Error('REFRESH_TOKEN_EXPIRED');
      }
      throw new Error('Error al refrescar token');
    }

    const data = await response.json();

    if (data.access) {
      // Guardar nuevo access token en todos los keys
      localStorage.setItem('auth_access_token', data.access);
      localStorage.setItem('token_usuario', data.access);
      localStorage.setItem('accessToken', data.access);

      // Si ROTATE_REFRESH_TOKENS=True, guardar nuevo refresh token
      if (data.refresh) {
        localStorage.setItem('auth_refresh_token', data.refresh);
        localStorage.setItem('refresh_token', data.refresh);
      }

      processQueue(null, data.access);
      return data.access;
    }

    throw new Error('No se recibió un access token válido');
  } catch (error) {
    processQueue(error, null);

    // Si el refresh token expiró, limpiar todo y disparar evento
    if (error.message === 'REFRESH_TOKEN_EXPIRED') {
      console.warn('⚠️ Refresh token expirado. Limpiando tokens...');
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_usuario');
      localStorage.removeItem('token_usuario');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refresh_token');

      // Disparar evento de sesión expirada
      window.dispatchEvent(new CustomEvent('session:expired', {
        detail: { message: 'SESSION_EXPIRED', isAuthError: true }
      }));
    }

    throw error;
  } finally {
    isRefreshing = false;
  }
}

/**
 * Helper para hacer fetch con autenticación y retry automático
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

  let response = await fetch(urlWithParams.toString(), {
    ...options,
    headers,
  });

  // Si la petición falló con 401, intentar refrescar el token y reintentar
  if (!response.ok && response.status === 401) {
    console.warn('⚠️ Error 401 detectado en analytics. Intentando refresh de token...');

    try {
      const newToken = await refreshAccessToken();

      // Actualizar token en authData
      const updatedAuthData = {
        ...authData,
        tokenUsuario: newToken,
      };

      // Reconstruir URL con el nuevo token
      const urlWithParamsRetry = new URL(url, window.location.origin);
      if (usuario) urlWithParamsRetry.searchParams.set('usuario', usuario);
      if (newToken) urlWithParamsRetry.searchParams.set('token', newToken);
      if (subdominio) urlWithParamsRetry.searchParams.set('subdominio', subdominio);

      if (options.params) {
        Object.entries(options.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            urlWithParamsRetry.searchParams.set(key, String(value));
          }
        });
      }

      // Reintentar la petición con el nuevo token
      response = await fetch(urlWithParamsRetry.toString(), {
        ...options,
        headers,
      });

      console.log('✅ Petición reintentada exitosamente con nuevo token');

    } catch (refreshError) {
      console.error('❌ Error al refrescar token:', refreshError);

      // Si el error es REFRESH_TOKEN_EXPIRED, ya se manejó en refreshAccessToken
      if (refreshError.message !== 'REFRESH_TOKEN_EXPIRED') {
        // Para otros errores, limpiar sesión y redirigir
        localStorage.clear();
        window.location.href = '/login';
      }

      throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }
  }

  if (!response.ok) {
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
