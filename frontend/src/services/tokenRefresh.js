/**
 * Servicio de refresh proactivo de tokens
 *
 * Refresca el access token automáticamente antes de que expire,
 * evitando errores 401 y mejorando la experiencia de usuario.
 *
 * Con access tokens de 8 horas, refresca 5 minutos antes:
 * - 8 horas = 480 minutos
 * - Refresca a los 475 minutos (7 horas 55 minutos)
 */

let refreshTimer = null;
const REFRESH_BEFORE_MS = 5 * 60 * 1000; // 5 minutos en milisegundos

/**
 * Decodifica un token JWT sin verificar la firma
 * (Solo para extraer el tiempo de expiración)
 */
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error al decodificar token:', error);
    return null;
  }
}

/**
 * Calcula el tiempo restante hasta que expire el token en milisegundos
 */
function getTimeUntilExpiry(token) {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    return null;
  }

  const expiryTime = decoded.exp * 1000; // Convertir a milisegundos
  const now = Date.now();
  const timeUntilExpiry = expiryTime - now;

  return timeUntilExpiry > 0 ? timeUntilExpiry : 0;
}

/**
 * Refresca el token usando el refresh token
 * @returns {Promise<boolean>} True si el refresh fue exitoso, False en caso contrario
 */
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('auth_refresh_token');

  if (!refreshToken) {
    console.warn('⚠️ No hay refresh token disponible');
    return false;
  }

  try {
    const response = await fetch('https://dagi.co/api/auth/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken })
    });

    if (!response.ok) {
      // Si el refresh token también expiró o es inválido
      if (response.status === 401) {
        console.error('❌ Refresh token expirado o inválido');

        // Limpiar todos los tokens
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

        return false;
      }

      console.error('❌ Error al refrescar token:', response.status);
      return false;
    }

    const data = await response.json();

    if (data.access) {
      // Guardar nuevo access token en todos los keys
      localStorage.setItem('auth_access_token', data.access);
      localStorage.setItem('token_usuario', data.access);
      localStorage.setItem('accessToken', data.access);

      console.log('✅ Token refrescado exitosamente (proactivo)');

      // Si ROTATE_REFRESH_TOKENS=True, guardar nuevo refresh token
      if (data.refresh) {
        localStorage.setItem('auth_refresh_token', data.refresh);
        localStorage.setItem('refresh_token', data.refresh);
        console.log('✅ Refresh token rotado exitosamente');
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Error al refrescar token (proactivo):', error);

    // Si hay un error de red, no limpiar los tokens
    // El sistema reactivo intentará refrescar en la próxima petición
    return false;
  }
}

/**
 * Programa el próximo refresh
 */
function scheduleNextRefresh() {
  // Limpiar timer existente si hay uno
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  // Obtener el access token actual
  const accessToken = localStorage.getItem('auth_access_token') ||
                      localStorage.getItem('accessToken') ||
                      localStorage.getItem('token_usuario');

  if (!accessToken) {
    console.warn('⚠️ No hay access token para programar refresh');
    return;
  }

  // Calcular tiempo hasta expiración
  const timeUntilExpiry = getTimeUntilExpiry(accessToken);

  if (timeUntilExpiry === null) {
    console.error('❌ No se pudo determinar la expiración del token');
    return;
  }

  // Si ya expiró, refrescar inmediatamente
  if (timeUntilExpiry === 0) {
    console.warn('⚠️ Token ya expirado, refrescando inmediatamente...');
    refreshAccessToken().then(success => {
      if (success) {
        scheduleNextRefresh();
      }
    });
    return;
  }

  // Calcular cuándo refrescar (5 minutos antes de la expiración)
  const timeUntilRefresh = Math.max(0, timeUntilExpiry - REFRESH_BEFORE_MS);

  console.log(`📅 Próximo refresh en ${Math.round(timeUntilRefresh / 1000 / 60)} minutos`);

  // Programar el refresh
  refreshTimer = setTimeout(async () => {
    const success = await refreshAccessToken();

    if (success) {
      // Reprogramar el próximo refresh después de un refresh exitoso
      scheduleNextRefresh();
    } else {
      // Si falló el refresh, detener el refresh proactivo
      // El sistema reactivo se encargará de refrescar cuando sea necesario
      console.warn('⚠️ Refresh falló, deteniendo refresh proactivo. El sistema reactivo se encargará.');
      stopAutoRefresh();
    }
  }, timeUntilRefresh);
}

/**
 * Inicia el refresh proactivo
 * Debe llamarse cuando el usuario se autentique
 */
export function startAutoRefresh() {
  console.log('🚀 Iniciando refresh proactivo de tokens...');

  // Verificar que hay tokens antes de iniciar
  const accessToken = localStorage.getItem('auth_access_token') ||
                      localStorage.getItem('accessToken') ||
                      localStorage.getItem('token_usuario');
  const refreshToken = localStorage.getItem('auth_refresh_token');

  if (!accessToken || !refreshToken) {
    console.warn('⚠️ No hay tokens disponibles, no se iniciará refresh proactivo');
    return;
  }

  // Programar el primer refresh
  scheduleNextRefresh();
}

/**
 * Detiene el refresh proactivo
 * Debe llamarse cuando el usuario cierre sesión
 */
export function stopAutoRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
    console.log('🛑 Refresh proactivo detenido');
  }
}

/**
 * Refresca el token inmediatamente (útil para forzar un refresh manual)
 */
export async function forceRefreshNow() {
  console.log('🔄 Forzando refresh inmediato...');
  const success = await refreshAccessToken();

  if (success) {
    // Reprogramar el próximo refresh
    scheduleNextRefresh();
  }

  return success;
}
