

// src/services/api.js
const BASE_URL = 'https://dagi.co/';
const id_sucursal = localStorage.getItem("id_sucursal");

// Funciones internas que hacen la petición SIN lógica de refresh (para evitar recursión)
async function _postRaw(endpoint, body, token) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => null);
  return { res, json };
}

async function _getRaw(endpoint, token) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  const json = await res.json().catch(() => null);
  return { res, json };
}

async function post(endpoint, body, token, skipRefresh = false) {
  console.log(`POST ${BASE_URL}${endpoint}`, body);

  // Primera intento
  let { res, json } = await _postRaw(endpoint, body, token);
  console.log(`Response ${res.status}:`, json);

  // Si la petición fue exitosa, guardar nuevo_token si está presente en la respuesta
  if (res.ok && json && json.nuevo_token) {
    console.log('✅ Nuevo token recibido, guardando en localStorage...');
    localStorage.setItem('token_usuario', json.nuevo_token);
  }

  // Si la petición falló con 401 y NO estamos saltando el refresh (para evitar recursión)
  // Y NO es un endpoint de login/refresh (no tiene sentido refrescar en esos casos)
  if (!res.ok && res.status === 401 && !skipRefresh) {
    // NO intentar refrescar token para endpoints de auth
    const isAuthEndpoint = endpoint.includes('api/auth/login') ||
                           endpoint.includes('api/auth/refresh') ||
                           endpoint.includes('api/auth/register');

    if (!isAuthEndpoint) {
      console.warn('⚠️ Error 401 detectado. Intentando refresh de token...');

      const refreshToken = localStorage.getItem('auth_refresh_token');

      if (refreshToken) {
        try {
          const subdominio = window.location.hostname.split('.')[0];

          // Usar _postRaw para evitar recursión (skipRefresh=true)
          const refreshResult = await _postRaw('api/auth/refresh/', {
            refresh: refreshToken,
            subdominio
          }, null);

          if (refreshResult.res.ok && refreshResult.json.access) {
            // Guardar nuevo access token
            const newAccessToken = refreshResult.json.access;
            localStorage.setItem('auth_access_token', newAccessToken);
            console.log('✅ Token refrescado exitosamente');

            // Reintentar la petición original con el nuevo token
            const retryResult = await _postRaw(endpoint, body, newAccessToken);
            if (retryResult.res.ok) {
              console.log(`✅ Reintento exitoso después de refresh`);
              // Guardar nuevo_token si está presente en la respuesta del reintento
              if (retryResult.json && retryResult.json.nuevo_token) {
                console.log('✅ Nuevo token recibido en reintento, guardando en localStorage...');
                localStorage.setItem('token_usuario', retryResult.json.nuevo_token);
              }
              return retryResult.json;
            }
            // Si el reintento falló, continuar con el error normal
            res = retryResult.res;
            json = retryResult.json;
          }
        } catch (refreshError) {
          console.error('❌ Error al refrescar token:', refreshError);
        }
      }
    }

    // Si llegamos aquí, no se pudo refrescar el token (o era un endpoint de auth)
    // Solo limpiar tokens si NO es un endpoint de auth
    if (!isAuthEndpoint) {
      console.warn('⚠️ No se pudo refrescar el token. Limpiando tokens de autenticación...');
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_usuario');

      // Lanzar error especial para que el componente lo capture
      throw {
        message: 'SESSION_EXPIRED',
        isAuthError: true,
        details: json
      };
    }
  }

  // Manejo normal de errores (no 401, o 401 después de intentar refresh)
  if (!res.ok) {
    console.error('API Error:', {
      status: res.status,
      statusText: res.statusText,
      responseBody: json
    });

    // Extraer mensaje de error de diferentes formatos
    let msg = json?.mensaje || json?.detail || res.statusText;

    // Si es un error de validación de Django REST Framework
    if (json && typeof json === 'object') {
      // Buscar errores de campos específicos
      const firstFieldError = Object.keys(json).find(key => Array.isArray(json[key]) && json[key].length > 0);
      if (firstFieldError && json[firstFieldError][0]) {
        msg = json[firstFieldError][0];
      }
    }

    throw { message: msg, details: json };
  }

  return json;
}

async function get(endpoint, token, skipRefresh = false) {
  // Primer intento
  let { res, json } = await _getRaw(endpoint, token);

  // Si la petición fue exitosa, guardar nuevo_token si está presente en la respuesta
  if (res.ok && json && json.nuevo_token) {
    console.log('✅ Nuevo token recibido (GET), guardando en localStorage...');
    localStorage.setItem('token_usuario', json.nuevo_token);
  }

  // Si la petición falló con 401 y NO estamos saltando el refresh (para evitar recursión)
  // Y NO es un endpoint de login/refresh (no tiene sentido refrescar en esos casos)
  if (!res.ok && res.status === 401 && !skipRefresh) {
    // NO intentar refrescar token para endpoints de auth
    const isAuthEndpoint = endpoint.includes('api/auth/login') ||
                           endpoint.includes('api/auth/refresh') ||
                           endpoint.includes('api/auth/register');

    if (!isAuthEndpoint) {
      console.warn('⚠️ Error 401 detectado (GET). Intentando refresh de token...');

      const refreshToken = localStorage.getItem('auth_refresh_token');

      if (refreshToken) {
        try {
          const subdominio = window.location.hostname.split('.')[0];

          // Usar _postRaw para evitar recursión (skipRefresh=true)
          const refreshResult = await _postRaw('api/auth/refresh/', {
            refresh: refreshToken,
            subdominio
          }, null);

          if (refreshResult.res.ok && refreshResult.json.access) {
            // Guardar nuevo access token
            const newAccessToken = refreshResult.json.access;
            localStorage.setItem('auth_access_token', newAccessToken);
            console.log('✅ Token refrescado exitosamente (GET)');

            // Reintentar la petición original con el nuevo token
            const retryResult = await _getRaw(endpoint, newAccessToken);
            if (retryResult.res.ok) {
              console.log(`✅ Reintento exitoso después de refresh (GET)`);
              // Guardar nuevo_token si está presente en la respuesta del reintento
              if (retryResult.json && retryResult.json.nuevo_token) {
                console.log('✅ Nuevo token recibido en reintento (GET), guardando en localStorage...');
                localStorage.setItem('token_usuario', retryResult.json.nuevo_token);
              }
              return retryResult.json;
            }
            // Si el reintento falló, continuar con el error normal
            res = retryResult.res;
            json = retryResult.json;
          }
        } catch (refreshError) {
          console.error('❌ Error al refrescar token (GET):', refreshError);
        }
      }
    }

    // Si llegamos aquí, no se pudo refrescar el token (o era un endpoint de auth)
    // Solo limpiar tokens si NO es un endpoint de auth
    if (!isAuthEndpoint) {
      console.warn('⚠️ No se pudo refrescar el token (GET). Limpiando tokens de autenticación...');
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_usuario');

      // Lanzar error especial para que el componente lo capture
      throw {
        message: 'SESSION_EXPIRED',
        isAuthError: true,
        details: json
      };
    }
  }

  // Manejo normal de errores (no 401, o 401 después de intentar refresh)
  if (!res.ok) {
    console.error('API Error (GET):', {
      status: res.status,
      statusText: res.statusText,
      responseBody: json
    });

    const msg = json?.mensaje || json?.detail || res.statusText;
    throw { message: msg, details: json };
  }

  return json;
}

async function _patchRaw(endpoint, body, token) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => null);
  return { res, json };
}

async function patch(endpoint, body, token, skipRefresh = false) {
  console.log(`PATCH ${BASE_URL}${endpoint}`, body);

  // Primera intento
  let { res, json } = await _patchRaw(endpoint, body, token);
  console.log(`Response ${res.status}:`, json);

  // Si la petición fue exitosa, guardar nuevo_token si está presente en la respuesta
  if (res.ok && json && json.nuevo_token) {
    console.log('✅ Nuevo token recibido, guardando en localStorage...');
    localStorage.setItem('token_usuario', json.nuevo_token);
  }

  // Si la petición falló con 401 y NO estamos saltando el refresh (para evitar recursión)
  if (!res.ok && res.status === 401 && !skipRefresh) {
    // NO intentar refrescar token para endpoints de auth
    const isAuthEndpoint = endpoint.includes('api/auth/login') ||
                           endpoint.includes('api/auth/refresh') ||
                           endpoint.includes('api/auth/register');

    if (!isAuthEndpoint) {
      console.warn('⚠️ Error 401 detectado. Intentando refresh de token...');

      const refreshToken = localStorage.getItem('auth_refresh_token');

      if (refreshToken) {
        try {
          const subdominio = window.location.hostname.split('.')[0];

          // Usar _postRaw para evitar recursión (skipRefresh=true)
          const refreshResult = await _postRaw('api/auth/refresh/', {
            refresh: refreshToken,
            subdominio
          }, null);

          if (refreshResult.res.ok && refreshResult.json.access) {
            // Guardar nuevo access token
            const newAccessToken = refreshResult.json.access;
            localStorage.setItem('auth_access_token', newAccessToken);
            console.log('✅ Token refrescado exitosamente');

            // Reintentar la petición original con el nuevo token
            const retryResult = await _patchRaw(endpoint, body, newAccessToken);
            if (retryResult.res.ok) {
              console.log(`✅ Reintento exitoso después de refresh`);
              // Guardar nuevo_token si está presente en la respuesta del reintento
              if (retryResult.json && retryResult.json.nuevo_token) {
                console.log('✅ Nuevo token recibido en reintento, guardando en localStorage...');
                localStorage.setItem('token_usuario', retryResult.json.nuevo_token);
              }
              return retryResult.json;
            }
            // Si el reintento falló, continuar con el error normal
            res = retryResult.res;
            json = retryResult.json;
          }
        } catch (refreshError) {
          console.error('❌ Error al refrescar token:', refreshError);
        }
      }
    }

    // Si llegamos aquí, no se pudo refrescar el token (o era un endpoint de auth)
    // Solo limpiar tokens si NO es un endpoint de auth
    if (!isAuthEndpoint) {
      console.warn('⚠️ No se pudo refrescar el token. Limpiando tokens de autenticación...');
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_usuario');

      // Lanzar error especial para que el componente lo capture
      throw {
        message: 'SESSION_EXPIRED',
        isAuthError: true,
        details: json
      };
    }
  }

  // Manejo normal de errores (no 401, o 401 después de intentar refresh)
  if (!res.ok) {
    console.error('API Error:', {
      status: res.status,
      statusText: res.statusText,
      responseBody: json
    });

    // Extraer mensaje de error de diferentes formatos
    let msg = json?.mensaje || json?.detail || res.statusText;

    // Si es un error de validación de Django REST Framework
    if (json && typeof json === 'object') {
      // Buscar errores de campos específicos
      const firstFieldError = Object.keys(json).find(key => Array.isArray(json[key]) && json[key].length > 0);
      if (firstFieldError && json[firstFieldError][0]) {
        msg = json[firstFieldError][0];
      }
    }

    throw { message: msg, details: json };
  }

  return json;
}

export function fetchUsers({rol, token, usuario, tokenUsuario, accessToken, nombre, nombreTienda, hostname, tienda, subdominio}) {
  token = tokenUsuario;
  console.log("fetchUsers llamado con:", { usuario, tokenUsuario, subdominio, tabla: 'login_usuario' });
  return post('api/obtener/datos/info-tienda/', {usuario, token, subdominio, tabla: 'login_usuario'
  }, token);
}

export async function fetchBodegas({ tokenUsuario, usuario, subdominio }) {
  const token = tokenUsuario; 
  return post(
    'api/obtener/datos/info-tienda/', { usuario, token, subdominio, tabla: 'inventario_bodega' 
    },token
  );
}

//actualizar datos de una tabla
// Helper de API
export function actualizarfila({
  rol,
  token,
  usuario,
  tokenUsuario,
  subdominio,
  tabla,
  columna_filtro,
  valor_filtro,
  datos
}) {
  token = tokenUsuario;
  return post(
    'api/actualizar/datos/valores-tienda/',
    {
      rol,
      usuario,
      token,
      subdominio,
      tabla,
      columna_filtro,
      valor_filtro,
      datos
    },
    token
  );
}

export function fetchSucursales({rol, token, usuario, tokenUsuario, accessToken, nombre, nombreTienda, hostname, tienda, subdominio}) {
   token = tokenUsuario;
   return post('api/obtener/datos/info-tienda/', {
    usuario,
    token,
    subdominio,
    tabla: 'main_dashboard_sucursales'
  }, token);
}

export function fetchCategorias({ tokenUsuario, usuario, subdominio }) {
  const token = tokenUsuario;
  return post('api/obtener/datos/info-tienda/', {
    usuario,
    token,
    subdominio,
    tabla: 'main_dashboard_categoria'
  }, token);
}

export function fetchMarcas({ tokenUsuario, usuario, subdominio }) {
  const token = tokenUsuario;
  return post('api/obtener/datos/info-tienda/', {
    usuario,
    token,
    subdominio,
    tabla: 'main_dashboard_marca'
  }, token);
}

export function fetchDescuentos({ tokenUsuario, usuario, subdominio }) {
  const token = tokenUsuario;
  return post('api/obtener/datos/info-tienda/', {
    usuario,
    token,
    subdominio,
    tabla: 'descuentos'
  }, token);
}

export function fetchIva({ tokenUsuario, usuario, subdominio }) {
  const token = tokenUsuario;
  return post('api/obtener/datos/info-tienda/', {
    usuario,
    token,
    subdominio,
    tabla: 'main_dashboard_iva'
  }, token);
}

export function fetchTipoMedida({ tokenUsuario, usuario, subdominio }) {
  const token = tokenUsuario;
  return post('api/obtener/datos/info-tienda/', {
    usuario,
    token,
    subdominio,
    tabla: 'tipos_medida'
  }, token);
}

export function createSucursal({rol, token, usuario, tokenUsuario, accessToken, nombre, nombreTienda, hostname, tienda, subdominio, sucursal}) {
   return post('api/crear/datos/sucursal/', {
    usuario,
    token,
    subdominio,
    sucursal
  }, token);
}

export function createUsuario({usuario, token, subdominio, operario, sucursal_id, bodegas_ids}) {
  return post('api/obtener/datos/api/crear-operario/',{
      usuario,
      token,
      subdominio,
      operario,
      sucursal_id,
      bodegas_ids
    },
    token
  )
}

// Función anterior (puedes mantenerla si la usas en otro lado)
export function fetchProducts({
  usuario,
  tokenUsuario,
  subdominio
}) {
  const token = tokenUsuario;
  return post(
    'api/obtener/datos/info-tienda/',
    {
      usuario,
      token,
      subdominio,
      tabla: 'productos',
    },
    token
  );
}

// Nueva función para productos con existencias
export function fetchProductosConExistencias({
  usuario,
  tokenUsuario,
  subdominio
}) {
  const token = tokenUsuario;
  return post(
    'api/productos-existencias/list/',
    {
      usuario,
      token,
      subdominio
    },
    token
  );
}

// API Productos E-commerce - Multi-tenant por subdominio
// Retorna todos los productos con su ficha técnica completa
export function fetchProductosEcommerce({
  subdominio
}) {
  return post(
    'api/productos/list/',
    {
      subdominio
    }
  );
}


export function fetchAllProducts({
  usuario,
  tokenUsuario,
  subdominio
}) {
  const token = tokenUsuario;
  return post(
    'api/obtener/datos/all-info-tienda/',
    {
      usuario,
      token,
      subdominio,
      tabla: 'productos',
      id_sucursal  
    },
    token
  );
}



// Obtener existencias por bodega
export function obtenerExistenciasPorBodega({
  usuario,
  token,
  subdominio,
  bodega_id,
  limit = 100
}) {
  return post(
    'api/obtener/datos/info-tienda-columna/',
    {
      usuario,
      token,
      subdominio,
      tabla: 'inventario_existencia',
      columnas: [
        "id",
        "producto_id",
        "bodega_id",
        "cantidad",
        "reservado",
        "minimo",
        "maximo"
      ],
      filtro: {
        columna: "bodega_id",
        operador: "=",
        valor: bodega_id
      },
      limit
    },
    token
  );
}

/**
 * Obtiene productos con existencias en una bodega específica.
 * Útil para el componente de traslados.
 */
/*export function obtenerProductosPorBodega({
  usuario,
  tokenUsuario,
  subdominio,
  bodega_id,
  solo_con_stock = true
}) {
  const token = tokenUsuario;
  return post(
    'api/existencias/productos-por-bodega/',
    { usuario, token, subdominio, bodega_id, solo_con_stock },
    token
  );
}*/


export function fetchAllProductsTraslado({
  usuario,
  tokenUsuario,
  subdominio
}) {
  const token = tokenUsuario;
  return post(
    'api/obtener/datos/info-tienda/',
    {
      usuario,
      token,
      subdominio,
      tabla: 'inventario_traslado',
      id_sucursal  
    },
    token
  );
}
/**
 * Crea un nuevo producto.
 * Ajusta el endpoint si tu backend espera otra ruta.
 */
export function createProduct({ usuario, token, subdominio, datos }) {
  return post('api/crear/nuevos/productos-tienda/', {
    usuario,
    token,
    subdominio,
    datos
  });
}

export function crearCategoriaTienda({ usuario, token, subdominio, datos }) {
  return post('api/crear/nuevos/categorias-tienda/', {
    usuario,
    token,
    subdominio,
    datos
  });
}

export function crearMarca({ usuario, token, subdominio, datos }) {
  return post('api/crear/nuevos/marcas/', {
    usuario,
    token,
    subdominio,
    datos
  });
}

export function crearIva({ usuario, token, subdominio, datos }) {
  return post('api/crear/nuevos/iva/', {
    usuario,
    token,
    subdominio,
    datos
  });
}

export function crearDescuento({ usuario, token, subdominio, datos }) {
  return post('api/crear/nuevos/descuentos/', {
    usuario,
    token,
    subdominio,
    datos
  });
}

export function crearMedida({ usuario, token, subdominio, datos }) {
  return post('api/crear/nuevos/medida/', {
    usuario,
    token,
    subdominio,
    datos
  });
}

export async function subirImagenProducto({
  id, usuario, token, subdominio, categoriaId, imagen
}) {
  const formData = new FormData();
  formData.append('usuario',      usuario);
  formData.append('token',        token);
  formData.append('subdominio',   subdominio);
  formData.append('categoria_id', categoriaId);
  formData.append('imagen',       imagen);

  // ← URL sin duplicar "api"
  const endpoint = `/api/subir/${id}/imagen-producto/`;
  console.log(endpoint);
  console.log('Subiendo imagen a', endpoint);

  const res = await fetch(endpoint, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    // Captura bien el cuerpo de error (JSON o HTML)
    const ct = res.headers.get('content-type') || '';
    let err;
    if (ct.includes('application/json')) {
      const json = await res.json().catch(() => ({}));
      err = json.error || JSON.stringify(json);
    } else {
      err = await res.text();
    }
    console.error(`Error ${res.status}`, err);
    throw new Error(err);
  }

  const data = await res.json();
  if (data.nuevo_token) localStorage.setItem('token_usuario', data.nuevo_token);
  return data;  // { imagenUrl, nuevo_token? }
}

export async function obtenerImagenProducto({
  productoId,      // opcional: ID del producto concreto
  categoriaId,     // opcional: ID de la categoría (trae todas las imágenes de la categoría)
  usuario,
  token,
  subdominio
}) {
  // 1) Montar el body (FormData para compatibilidad con tus parsers en Django)
  const formData = new FormData();
  formData.append('usuario',    usuario);
  formData.append('token',      token);
  formData.append('subdominio', subdominio);

  if (productoId) {
    formData.append('producto_id', productoId);
  } else if (categoriaId) {
    formData.append('categoria_id', categoriaId);
  } else {
    throw new Error('Debes pasar productoId o categoriaId');
  }

  // 2) Endpoint absoluto (asegúrate de no duplicar "/api")
  const endpoint = `${window.location.origin}/api/subir/obtener_imagen/`;
  console.log('📥 Obteniendo imagen(es) de:', endpoint);

  // 3) Hacer la petición
  const res = await fetch(endpoint, {
    method: 'POST',
    body: formData
  });

  // 4) Manejar errores (JSON o HTML)
  if (!res.ok) {
    const ct = res.headers.get('content-type') || '';
    let err;
    if (ct.includes('application/json')) {
      const json = await res.json().catch(() => ({}));
      err = json.error || JSON.stringify(json);
    } else {
      err = await res.text();
    }
    console.error(`Error ${res.status}`, err);
    throw new Error(err);
  }

  // 5) Parsear respuesta
  const data = await res.json();
  // si refrescaron token, lo guardas
  if (data.nuevo_token) {
    localStorage.setItem('token_usuario', data.nuevo_token);
  }

  // 6) Devolver el array de URLs
  //    data.imagenes es un array de strings
  return data.imagenes;
}





// paises
export async function fetchPaises(tokenUsuario) {
  return await get('api/countries/', {}, tokenUsuario);
}

//ciudades
export async function fetchCiudades(tokenUsuario) {
  return await get('api/cities/', {}, tokenUsuario);
}

//regiones
export async function fetchRegiones(tokenUsuario) {
  return await get('api/subregions/', {}, tokenUsuario);
}









//-------------------- APIS DE BODEGA --------------------
//CREAR UNA NUEVA BODEGA  

export function crearBodega({token, usuario, subdominio, sucursal, nombre, tipo, es_predeterminada, estatus}) {
  
  return post('api/bodegas/', {
    usuario,
    token,
    subdominio,
    sucursal,
    nombre,
    tipo,
    es_predeterminada,
    estatus
  }, token);
}
// crear existencia
export function crearExistencia({token, usuario, subdominio, sucursal, producto, bodega, delta}) {

  return post('api/existencias/ajustar/', {
    usuario,
    token,
    subdominio,
    sucursal,
    producto,
    bodega,
    delta
   
  }, token);
}



export function crearTraslado({token, usuario, subdominio, bodega_origen, bodega_destino, observaciones, usar_bodega_transito, es_predeterminada, lineas}) {
  

  return post('api/traslados/', {
    usuario,
    token,
    subdominio,
    bodega_origen,
    bodega_destino,
    observaciones,
    usar_bodega_transito,
    es_predeterminada,
    lineas
  }, token);
}

//--------------------------------------------------------



// ---------- TRASLADOS ----------
// Función para listar traslados por bodega destino
export function listarTrasladosPorBodegaDestino({token, usuario, subdominio, bodega_destino_id, estado}) {
  return post('api/traslados/por-destino/', {
    usuario,
    token,
    subdominio,
    bodega_destino_id,
    estado
  }, token);
}




export function enviarTraslado({ token, usuario, subdominio, traslado_id }) {
  return post(`api/traslados/${traslado_id}/enviar/`, {
    usuario,
    token,
    subdominio
  }, token);
}

/**
 * Recibe un traslado (cambia estado de ENV a REC)
 * Endpoint: api/traslados/{id}/recibir/
 */

export function recibirTraslado({ token, usuario, subdominio, traslado_id, cantidades = [] }) {
  return post(
    `api/traslados/${traslado_id}/recibir/`, 
    {
      usuario,
      token,
      subdominio,
      cantidades
    }, 
    token
  );
}
//------------------------------------------



//------------ APIS PARA FILTRAR LOS PRODUCTOS -------------
// Obtener productos por bodega
export function obtenerProductosPorBodega({
  usuario,
  tokenUsuario,
  subdominio,
  bodega_id,
  solo_con_stock = true,
}) {
  console.log('[API] obtenerProductosPorBodega llamado con:', {
    usuario,
    subdominio,
    bodega_id,
    solo_con_stock
  });

  const token = tokenUsuario;
  return post(
    'api/existencias/productos-por-bodega/',
    {
      usuario,
      token,
      subdominio,
      bodega_id,
      solo_con_stock,
    },
    token
  );
}

// Obtener bodegas por sucursal
export function obtenerBodegasPorSucursal({
  usuario,
  token,
  subdominio,
  sucursal_id,
}) {
  return post(
    'api/bodegas/por-sucursal/',
    {
      usuario,
      token,
      subdominio,
      sucursal_id,
    },
    token
  );
}

//-------------------------------------------------------------







//ajustar existencia
// src/services/api.js

// ... código existente ...

// Ajustar existencia (ya existe pero la mejoramos)
export function ajustarExistencia({
  token,
  usuario,
  subdominio,
  producto,
  bodega,
  delta
}) {
  return post('api/existencias/ajustar/', {
    usuario,
    token,
    subdominio,
    producto,
    bodega,
    delta
  }, token);
}






//--------------------------------------------------------



//-------------------- APIS DE FACTURACION --------------------

// Clientes
export function buscarCliente({ query, token, usuario, subdominio }) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/facturacion/clientes/buscar/', {
    query,
    usuario,
    token,
    subdominio
  }, token);
}

export function crearCliente({ token, usuario, subdominio, datos }) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/facturacion/clientes/', {
    usuario,
    token,
    subdominio,
    ...datos
  }, token);
}

// Editar cliente (PATCH - actualización parcial)
export function editarCliente({ clienteId, token, usuario, subdominio, datos }) {
  token = token || localStorage.getItem('token_usuario');
  return patch(`api/facturacion/clientes/${clienteId}/`, {
    usuario,
    token,
    subdominio,
    ...datos
  }, token);
}

// Obtener un cliente por ID
export function obtenerCliente({ clienteId, token, usuario, subdominio }) {
  token = token || localStorage.getItem('token_usuario');
  return post(`api/facturacion/clientes/${clienteId}/`, {
    usuario,
    token,
    subdominio
  }, token);
}

// Listar todos los clientes
export function listarClientes({ token, usuario, subdominio }) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/facturacion/clientes/', {
    usuario,
    token,
    subdominio
  }, token);
}

// Formas de Pago
export function fetchFormasPago({ token, usuario, subdominio }) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/facturacion/formas-pago/', {
    usuario,
    token,
    subdominio
  }, token);
}

// Productos para POS
export function buscarProductosPOS({
  token,
  usuario,
  subdominio,
  bodega_id,
  query,
  incluir_sin_stock = false
}) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/facturacion/facturas/productos-pos/', {
    usuario,
    token,
    subdominio,
    bodega_id,
    query,
    incluir_sin_stock
  }, token);
}

// Crear Factura
export function crearFactura({
  token,
  usuario,
  subdominio,
  datos_factura
}) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/facturacion/facturas/', { 
    usuario,
    token,
    subdominio,
    ...datos_factura
  }, token);
}

// Anular Factura
export function anularFactura({
  token,
  usuario,
  subdominio,
  factura_id,
  motivo
}) {
  token = token || localStorage.getItem('token_usuario');
  return post(`api/facturacion/facturas/${factura_id}/anular/`, {
    usuario,
    token,
    subdominio,
    motivo_anulacion: motivo
  }, token);
}

// Estadísticas
export function fetchVentasHoy({ token, usuario, subdominio }) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/facturacion/facturas/ventas-hoy/', {
    usuario,
    token,
    subdominio
  }, token);
}

// Listar facturas
export function fetchFacturas({
  token,
  usuario,
  subdominio,
  fecha_inicio,
  fecha_fin,
  estado,
  cliente,
  numero_factura,
  page = 1,
  page_size = 30
}) {
  token = token || localStorage.getItem('token_usuario');

  // Construir query params
  const params = new URLSearchParams();
  if (usuario) params.append('usuario', usuario);
  if (token) params.append('token', token);
  if (subdominio) params.append('subdominio', subdominio);
  if (fecha_inicio) params.append('fecha_inicio', fecha_inicio);
  if (fecha_fin) params.append('fecha_fin', fecha_fin);
  if (estado) params.append('estado', estado);
  if (cliente) params.append('cliente', cliente);
  if (numero_factura) params.append('numero_factura', numero_factura);
  params.append('page', page);
  params.append('page_size', page_size);

  const url = `api/facturacion/facturas/?${params.toString()}`;

  return get(url, token);
}

// ==================== AUTENTICACIÓN CLIENTES ECOMMERCE ====================

// Registrar usuario de ecommerce
export async function registrarUsuario({ email, password, passwordConfirm, datosCliente }) {
  const url = `${BASE_URL}api/ecommerce/clientes/registro/`;
  console.log(`POST ${url}`, { email, datosCliente });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, password_confirm: passwordConfirm, datos_cliente: datosCliente }),
  });

  const json = await res.json().catch(() => null);
  console.log(`Response ${res.status}:`, json);

  if (!res.ok) {
    throw new Error(json?.message || json?.detail || 'Error al registrar usuario');
  }

  return json;
}

// Login usuario de ecommerce
export async function loginUsuario({ email, password }) {
  const subdominio = window.location.hostname.split('.')[0];
  const url = `${BASE_URL}api/auth/login/`;
  console.log(`POST ${url}`, { email, subdominio });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, subdominio }),
  });

  const json = await res.json().catch(() => null);
  console.log(`Response ${res.status}:`, json);

  if (!res.ok) {
    throw new Error(json?.message || json?.detail || 'Error al iniciar sesión');
  }

  return json;
}

// Activar cuenta de usuario
export async function activarCuenta({ email, numero_documento, password, password_confirm }) {
  const url = `${BASE_URL}api/ecommerce/clientes/activar-cuenta/`;
  console.log(`POST ${url}`, { email, numero_documento });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, numero_documento, password, password_confirm }),
  });

  const json = await res.json().catch(() => null);
  console.log(`Response ${res.status}:`, json);

  if (!res.ok) {
    throw new Error(json?.message || json?.detail || 'Error al activar cuenta');
  }

  return json;
}

// Logout usuario de ecommerce
export async function logout() {
  const accessToken = localStorage.getItem('auth_access_token');
  const url = `${BASE_URL}api/ecommerce/clientes/logout/`;
  console.log(`POST ${url}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
  });

  // Limpiar tokens del localStorage
  localStorage.removeItem('auth_access_token');
  localStorage.removeItem('auth_refresh_token');
  localStorage.removeItem('auth_usuario');

  return res.ok;
}


// ==================== CUPONES ====================

/**
 * Obtiene los cupones del cliente actual por correo
 * Usa la API pública que no requiere autenticación
 */
export async function obtenerMisCupones({ correo }) {
  const subdominio = window.location.hostname.split('.')[0];
  const url = `${BASE_URL}api/cupones/cliente-cupones/mis-cupones/?correo=${encodeURIComponent(correo)}&subdominio=${encodeURIComponent(subdominio)}`;

  console.log(`[CUPONES API] GET ${url}`);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const json = await res.json().catch(() => null);
    console.log(`[CUPONES API] Response ${res.status}:`, json);

    if (!res.ok) {
      throw new Error(json?.detail || 'Error al obtener cupones');
    }

    return json;
  } catch (error) {
    console.error('[CUPONES API] Error en la petición:', error);
    throw error;
  }
}

/**
 * Usa un cupón (decrementa cantidad_disponible)
 */
export async function usarCupon({ cuponId }) {
  const token = localStorage.getItem('auth_access_token');
  const usuario = localStorage.getItem('usuario');
  const tokenUsuario = localStorage.getItem('token_usuario');
  const subdominio = window.location.hostname.split('.')[0];

  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  return post(`api/cupones/cliente-cupon/${cuponId}/usar/`, {
    usuario: tokenUsuario || usuario,
    token: tokenUsuario,
    subdominio
  }, token);
}

export async function getCuponesActivos() {
  const token = localStorage.getItem('auth_access_token');
  const usuario = localStorage.getItem('usuario');
  const tokenUsuario = localStorage.getItem('token_usuario');
  const subdominio = window.location.hostname.split('.')[0];

  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  return get(`api/cupones/?activos=true`, {
    usuario: tokenUsuario || usuario,
    token: tokenUsuario,
    subdominio
  }, token);
}

// ==================== CAJA ====================

/**
 * Obtiene las estadísticas de caja para una fecha específica
 */
export function fetchEstadisticasCaja({
  token,
  usuario,
  subdominio,
  fecha,
  id_sucursal  // ← agregar
}) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/caja/estadisticas/', {
    usuario,
    token,
    subdominio,
    fecha,
    ...(id_sucursal && { id_sucursal })  // ← enviar solo si tiene valor
  }, token);
}

export function fetchMovimientosCaja({
  token,
  usuario,
  subdominio,
  fecha,
  tipo = 'todos',
  pagina = 1,
  por_pagina = 20,
  id_sucursal  // ← agregar
}) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/caja/movimientos/', {
    usuario,
    token,
    subdominio,
    fecha,
    tipo,
    pagina,
    por_pagina,
    ...(id_sucursal && { id_sucursal })  // ← enviar solo si tiene valor
  }, token);
}


/**
 * Registra un nuevo movimiento de caja (entrada o salida)
 */
export function registrarMovimientoCaja({
  token, usuario, subdominio, tipo, categoria,
  monto, metodo_pago = 'efectivo', descripcion, id_sucursal
}) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/caja/registrar_movimiento/', {
    usuario, token, subdominio, tipo, categoria,
    monto, metodo_pago, descripcion,
    ...(id_sucursal && { id_sucursal, sucursal: id_sucursal }) // 👈
  }, token);
}

/**
 * Obtiene el cuadre de caja completo para una fecha específica
 */
export function fetchCuadreCaja({
  token,
  usuario,
  subdominio,
  fecha
}) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/caja/cuadre/', {
    usuario,
    token,
    subdominio,
    fecha
  }, token);
}

/**
 * Realiza un arqueo de caja (cierra la caja)
 */
/*export function realizarArqueoCaja({
  token,
  usuario,
  subdominio,
  fecha,
  monto_contado
}) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/caja/realizar_arqueo/', {
    usuario,
    token,
    subdominio,
    fecha,
    monto_contado
  }, token);
}*/


export function realizarArqueoCaja({ token, usuario, subdominio, fecha, monto_contado, id_sucursal }) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/caja/realizar_arqueo/', {
    usuario, token, subdominio, fecha, monto_contado,
    ...(id_sucursal && { id_sucursal })  // 👈 para que el arqueo quede en la sede correcta
  }, token);
}

// ═══════════════════════════════════════════════════════════════
// API DE CONTROL DE MORA (LISTA NEGRA DE CLIENTES)
// ═══════════════════════════════════════════════════════════════

/**
 * Verifica si un cliente está en mora antes de permitir una venta
 */
export function verificarMoraCliente({ token, usuario, subdominio, cliente_id }) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/facturacion/clientes-mora/verificar/', {
    usuario,
    token,
    subdominio,
    cliente_id
  }, token);
}

/**
 * Marca manualmente un cliente como en mora
 */
export function marcarClienteMora({ token, usuario, subdominio, cliente_id, observaciones }) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/facturacion/clientes-mora/marcar/', {
    usuario,
    token,
    subdominio,
    cliente_id,
    observaciones
  }, token);
}

/**
 * Quita a un cliente de la lista negra de mora
 */
export function quitarMoraCliente({ token, usuario, subdominio, cliente_id, observaciones }) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/facturacion/clientes-mora/quitar/', {
    usuario,
    token,
    subdominio,
    cliente_id,
    observaciones
  }, token);
}

/**
 * Lista todos los clientes en mora para un tenant
 */
export function listarClientesMora({ token, usuario, subdominio }) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/facturacion/clientes-mora/listar/', {
    usuario,
    token,
    subdominio
  }, token);
}

/**
 * Actualiza los días de mora de todos los clientes (job programado)
 */
export function actualizarDiasMoraTodos({ token, usuario, subdominio }) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/facturacion/clientes-mora/actualizar-todos/', {
    usuario,
    token,
    subdominio
  }, token);
}

// ═══════════════════════════════════════════════════════════════
// API DE GESTIÓN DE ABONOS (Pagos a clientes en mora)
// ═══════════════════════════════════════════════════════════════

/**
 * Lista los abonos de un cliente específico
 */
export function listarAbonosCliente({ token, usuario, subdominio, cliente_id }) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/facturacion/abonos/listar/', {
    usuario,
    token,
    subdominio,
    cliente_id
  }, token);
}

/**
 * Crea un nuevo abono a un cliente en mora
 */
export function crearAbono({ token, usuario, subdominio, cliente_id, monto, metodo_pago, referencia, observaciones, fecha_abono }) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/facturacion/abonos/crear/', {
    usuario,
    token,
    subdominio,
    cliente_id,
    monto,
    metodo_pago: metodo_pago || 'efectivo',
    referencia,
    observaciones,
    fecha_abono
  }, token);
}

/**
 * Obtiene un resumen completo de la mora de un cliente con sus abonos
 */
export function resumenMoraCliente({ token, usuario, subdominio, cliente_id }) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/facturacion/abonos/resumen/', {
    usuario,
    token,
    subdominio,
    cliente_id
  }, token);
}

/**
 * Lista todos los clientes que deben dinero
 */
export function listarClientesConDeuda({ token, usuario, subdominio, solo_mora = false }) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/facturacion/clientes-mora/deuda/listar/', {
    usuario,
    token,
    subdominio,
    solo_mora
  }, token);
}

/**
 * Obtiene el resumen de deuda de un cliente específico
 */
export function resumenDeudaCliente({ token, usuario, subdominio, cliente_id }) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/facturacion/clientes-mora/deuda/resumen/', {
    usuario,
    token,
    subdominio,
    cliente_id
  }, token);
}
export function fetchSucursalesCaja({ token, usuario, subdominio }) {
  token = token || localStorage.getItem('token_usuario');
  return post('api/caja/sucursales/', {
    usuario,
    token,
    subdominio,
  }, token);
}


// Exportar funciones principales para uso en componentes
export { post, get, patch };


