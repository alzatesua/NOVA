/**
 * Utilidades para gestionar el almacenamiento del perfil de usuario
 * Los datos del perfil se guardan separados de la sesión de autenticación
 */

export const PERFIL_KEYS = {
  NOMBRE: 'nombre_perfil',
  FOTO: 'foto_perfil'
};

/**
 * Guarda el nombre personalizado del perfil
 * @param {string} usuario - Nombre de usuario
 * @param {string} nombre - Nombre personalizado a guardar
 */
export function guardarNombrePerfil(usuario, nombre) {
  if (!usuario || !nombre) return false;

  const clave = `${PERFIL_KEYS.NOMBRE}_${usuario}`;
  try {
    localStorage.setItem(clave, nombre);
    console.log(`✅ Nombre guardado para ${usuario}:`, nombre);

    // Verificar que se guardó correctamente
    const guardado = localStorage.getItem(clave);
    if (guardado === nombre) {
      return true;
    } else {
      console.error('❌ Error al verificar nombre guardado');
      return false;
    }
  } catch (error) {
    console.error('❌ Error al guardar nombre:', error);
    return false;
  }
}

/**
 * Guarda la foto de perfil del usuario
 * @param {string} usuario - Nombre de usuario
 * @param {string} fotoData - Data URL de la foto
 */
export function guardarFotoPerfil(usuario, fotoData) {
  if (!usuario) return false;

  const clave = `${PERFIL_KEYS.FOTO}_${usuario}`;

  try {
    if (fotoData) {
      localStorage.setItem(clave, fotoData);
      console.log(`✅ Foto guardada para ${usuario}`);

      // Verificar que se guardó correctamente
      const guardada = localStorage.getItem(clave);
      return guardada === fotoData;
    } else {
      // Si fotoData es null o undefined, eliminar la foto
      eliminarFotoPerfil(usuario);
      return true;
    }
  } catch (error) {
    console.error('❌ Error al guardar foto:', error);
    return false;
  }
}

/**
 * Elimina la foto de perfil del usuario
 * @param {string} usuario - Nombre de usuario
 */
export function eliminarFotoPerfil(usuario) {
  if (!usuario) return;

  const clave = `${PERFIL_KEYS.FOTO}_${usuario}`;
  try {
    localStorage.removeItem(clave);
    console.log(`🗑️ Foto eliminada para ${usuario}`);
  } catch (error) {
    console.error('❌ Error al eliminar foto:', error);
  }
}

/**
 * Obtiene el nombre personalizado del usuario
 * @param {string} usuario - Nombre de usuario
 * @returns {string|null} Nombre personalizado o null si no existe
 */
export function obtenerNombrePerfil(usuario) {
  if (!usuario) return null;

  const clave = `${PERFIL_KEYS.NOMBRE}_${usuario}`;
  try {
    const nombre = localStorage.getItem(clave);
    console.log(`📖 Nombre recuperado para ${usuario}:`, nombre || 'No encontrado');
    return nombre;
  } catch (error) {
    console.error('❌ Error al obtener nombre:', error);
    return null;
  }
}

/**
 * Obtiene la foto de perfil del usuario
 * @param {string} usuario - Nombre de usuario
 * @returns {string|null} Data URL de la foto o null si no existe
 */
export function obtenerFotoPerfil(usuario) {
  if (!usuario) return null;

  const clave = `${PERFIL_KEYS.FOTO}_${usuario}`;
  try {
    const foto = localStorage.getItem(clave);
    console.log(`📖 Foto recuperada para ${usuario}:`, foto ? 'Sí' : 'No');
    return foto;
  } catch (error) {
    console.error('❌ Error al obtener foto:', error);
    return null;
  }
}

/**
 * Carga todos los datos del perfil de un usuario
 * @param {string} usuario - Nombre de usuario
 * @returns {Object} Objeto con { nombre, foto }
 */
export function cargarPerfilCompleto(usuario) {
  if (!usuario) {
    console.warn('⚠️ No se proporcionó usuario para cargar perfil');
    return { nombre: null, foto: null };
  }

  console.log(`🔄 Cargando perfil completo para: ${usuario}`);

  return {
    nombre: obtenerNombrePerfil(usuario),
    foto: obtenerFotoPerfil(usuario)
  };
}

/**
 * Guarda todos los datos del perfil de un usuario
 * @param {string} usuario - Nombre de usuario
 * @param {Object} datos - Objeto con { nombre, foto }
 * @returns {boolean} True si se guardó correctamente
 */
export function guardarPerfilCompleto(usuario, datos) {
  if (!usuario) {
    console.error('❌ No se proporcionó usuario para guardar perfil');
    return false;
  }

  const { nombre, foto } = datos;

  console.log(`💾 Guardando perfil completo para: ${usuario}`);
  console.log('  - Nombre:', nombre);
  console.log('  - Foto:', foto ? 'Sí' : 'No');

  const nombreGuardado = guardarNombrePerfil(usuario, nombre);
  const fotoGuardada = guardarFotoPerfil(usuario, foto);

  return nombreGuardado && fotoGuardada;
}

/**
 * Lista todos los perfiles guardados en localStorage
 * @returns {Array} Lista de usuarios con perfil guardado
 */
export function listarPerfilesGuardados() {
  const perfiles = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i);
      if (clave && clave.startsWith(PERFIL_KEYS.NOMBRE + '_')) {
        const usuario = clave.replace(PERFIL_KEYS.NOMBRE + '_', '');
        perfiles.push({
          usuario,
          nombre: localStorage.getItem(clave),
          foto: localStorage.getItem(`${PERFIL_KEYS.FOTO}_${usuario}`)
        });
      }
    }
  } catch (error) {
    console.error('❌ Error al listar perfiles:', error);
  }

  return perfiles;
}

/**
 * Depura: Muestra todos los datos del localStorage relacionados con perfiles
 */
export function depurarPerfiles() {
  console.log('🔍 DEPURACIÓN DE PERFILES:');
  console.log('================================');

  const perfiles = listarPerfilesGuardados();

  if (perfiles.length === 0) {
    console.log('⚠️ No hay perfiles guardados');
  } else {
    console.log(`✅ ${perfiles.length} perfil(es) encontrado(s):`);
    perfiles.forEach((perfil, index) => {
      console.log(`\n${index + 1}. Usuario: ${perfil.usuario}`);
      console.log(`   Nombre: ${perfil.nombre || 'No guardado'}`);
      console.log(`   Foto: ${perfil.foto ? 'Guardada' : 'No guardada'}`);
    });
  }

  console.log('\n================================');
}
