# Corrección de Persistencia de Perfil - Nova

## Fecha: 2026-04-11

## 🐛 Problema Identificado

Los cambios de perfil (nombre y foto) **se perdían al hacer logout y login de nuevo**. Solo persistían mientras la sesión estaba activa.

### Causa Raíz

Se encontraron **3 instancias de `localStorage.clear()`** que borraban TODOS los datos del localStorage, incluyendo los perfiles de usuario:

1. **[useAuth.js](frontend/src/hooks/useAuth.js:19)** - En verificación de autenticación
2. **[useAuth.js](frontend/src/hooks/useAuth.js:25)** - En función `logout()`
3. **[analyticsApi.js](frontend/src/services/analyticsApi.js:183)** - En error de refresh token

### Impacto

```javascript
// Antes: localStorage.clear() borraba TODO
localStorage.clear(); // ❌ Borraba también:
// - nombre_perfil_usuario1
// - foto_perfil_usuario1
// - nombre_perfil_usuario2
// - foto_perfil_usuario2
// ...y todos los demás datos
```

---

## ✅ Solución Implementada

### 1. Separación de Datos

**Datos de Autenticación** (se limpian al hacer logout):
- `rol`
- `token_usuario`
- `auth_access_token`
- `accessToken`
- `auth_usuario`
- `usuario`
- `tienda`
- `id_sucursal`
- `auth_refresh_token`
- `refreshToken`

**Datos de Perfil** (PERSISTEN entre sesiones):
- `nombre_perfil_{usuario}`
- `foto_perfil_{usuario}`

### 2. Archivos Modificados

#### **[useAuth.js](frontend/src/hooks/useAuth.js)**

**Antes:**
```javascript
const logout = () => {
  localStorage.clear(); // ❌ Borra TODO
  navigate('/login');
};
```

**Después:**
```javascript
const limpiarAuth = () => {
  const clavesAuth = [
    'rol', 'token_usuario', 'auth_access_token', 'accessToken',
    'auth_usuario', 'usuario', 'tienda', 'id_sucursal',
    'auth_refresh_token', 'refreshToken'
  ];
  clavesAuth.forEach(clave => localStorage.removeItem(clave));
};

const logout = () => {
  limpiarAuth(); // ✅ Solo limpia auth
  navigate('/login');
};
```

#### **[analyticsApi.js](frontend/src/services/analyticsApi.js)**

**Antes:**
```javascript
if (refreshError.message !== 'REFRESH_TOKEN_EXPIRED') {
  localStorage.clear(); // ❌ Borra TODO
  window.location.href = '/login';
}
```

**Después:**
```javascript
if (refreshError.message !== 'REFRESH_TOKEN_EXPIRED') {
  const clavesAuth = [
    'auth_access_token', 'auth_refresh_token', 'auth_usuario',
    'token_usuario', 'accessToken', 'refresh_token',
    'rol', 'tienda', 'id_sucursal'
  ];
  clavesAuth.forEach(clave => localStorage.removeItem(clave));
  window.location.href = '/login';
}
```

### 3. Nuevo Sistema de Gestión de Perfil

Creado **[perfilStorage.js](frontend/src/utils/perfilStorage.js)** con funciones auxiliares:

```javascript
// Guardar datos
guardarPerfilCompleto(usuario, { nombre, foto })
guardarNombrePerfil(usuario, nombre)
guardarFotoPerfil(usuario, fotoData)

// Cargar datos
cargarPerfilCompleto(usuario) // → { nombre, foto }
obtenerNombrePerfil(usuario)
obtenerFotoPerfil(usuario)

// Eliminar foto
eliminarFotoPerfil(usuario)

// Depuración
listarPerfilesGuardados()
depurarPerfiles()
```

### 4. Actualización de Componentes

#### **[PerfilModal.jsx](frontend/src/components/PerfilModal.jsx)**

**Cambios:**
- ✅ Usa funciones auxiliares de `perfilStorage.js`
- ✅ Verifica que los datos se guarden correctamente
- ✅ Muestra logs detallados para debugging
- ✅ Carga perfil al abrir el modal (useEffect con `isOpen`)

**Ejemplo:**
```javascript
const handleSave = () => {
  const exito = guardarPerfilCompleto(usuario, {
    nombre: nombre.trim(),
    foto: previewUrl
  });

  if (exito) {
    onSave({ nombre, foto });
  } else {
    alert('Error al guardar perfil');
  }
};
```

#### **[Navbar.jsx](frontend/src/components/Navbar.jsx)**

**Cambios:**
- ✅ Usa funciones auxiliares de `perfilStorage.js`
- ✅ Carga perfil automáticamente al cambiar usuario
- ✅ Muestra nombre personalizado: `nombrePersonalizado || usuario`
- ✅ Muestra logs detallados para debugging

**Ejemplo:**
```javascript
useEffect(() => {
  if (usuario) {
    const perfil = cargarPerfilCompleto(usuario);
    setPerfilPhoto(perfil.foto);
    setNombrePersonalizado(perfil.nombre);
  }
}, [usuario]);
```

---

## 📋 Flujo Completo de Persistencia

### Guardar Perfil:

```javascript
1. Usuario abre "Configurar Perfil"
2. Cambia nombre y/o foto
3. Click en "Guardar Cambios"
4. PerfilModal.handleSave():
   a. Valida que el nombre no esté vacío
   b. Llama a guardarPerfilCompleto(usuario, { nombre, foto })
   c. Verifica que se guardó correctamente
   d. Llama a onSave({ nombre, foto })
5. Navbar.onSave():
   a. Actualiza setNombrePersonalizado(nombre)
   b. Actualiza setPerfilPhoto(foto)
   c. Cierra modales
6. Datos guardados en localStorage:
   - nombre_perfil_{usuario}
   - foto_perfil_{usuario}
```

### Cargar Perfil al Login:

```javascript
1. Usuario hace login
2. useAuth() detecta token válido
3. Navbar se monta con nuevo usuario
4. useEffect() se ejecuta con nuevo usuario:
   a. Llama a cargarPerfilCompleto(usuario)
   b. Obtiene nombre y foto del localStorage
   c. Actualiza estados:
      - setNombrePersonalizado(perfil.nombre)
      - setPerfilPhoto(perfil.foto)
5. Navbar muestra perfil personalizado
```

### Logout (Sin perder perfil):

```javascript
1. Usuario hace click en "Cerrar Sesión"
2. Navbar.onLogout():
   a. Llama a logout() de useAuth()
3. useAuth.logout():
   a. Llama a limpiarAuth()
   b. Solo elimina claves de autenticación
   c. PRESERVA claves de perfil:
      - nombre_perfil_{usuario} ✅
      - foto_perfil_{usuario} ✅
4. Redirige a /login
```

---

## 🔍 Logs de Depuración

Se agregaron logs detallados para tracking:

### PerfilModal:
```javascript
console.log('Guardando perfil...');
console.log('Usuario:', usuario);
console.log('Nombre:', nombre);
console.log('Foto:', previewUrl ? 'Sí' : 'No');
console.log('✅ Perfil guardado exitosamente');
```

### Navbar:
```javascript
console.log('Navbar - Cargando perfil para usuario:', usuario);
console.log('Foto encontrada:', perfil.foto ? 'Sí' : 'No');
console.log('Nombre encontrado:', perfil.nombre || 'No');
```

### perfilStorage.js:
```javascript
console.log(`✅ Nombre guardado para ${usuario}:`, nombre);
console.log(`✅ Foto guardada para ${usuario}`);
console.log(`📖 Nombre recuperado para ${usuario}:`, nombre);
console.log(`📖 Foto recuperada para ${usuario}:`, foto ? 'Sí' : 'No');
```

---

## 🎯 Resultado Final

### ✅ Funcionalidades Verificadas:

1. **Nombre de perfil**:
   - ✅ Se guarda correctamente
   - ✅ Persiste entre sesiones
   - ✅ Se muestra en navbar y dropdown

2. **Foto de perfil**:
   - ✅ Se guarda correctamente
   - ✅ Persiste entre sesiones
   - ✅ Se puede eliminar
   - ✅ Validación de tipo (solo imágenes)
   - ✅ Validación de tamaño (máx 5MB)

3. **Multi-usuario**:
   - ✅ Cada usuario tiene su propio perfil
   - ✅ Los perfiles son independientes
   - ✅ No hay interferencia entre usuarios

4. **Logout/Login**:
   - ✅ El perfil NO se borra al hacer logout
   - ✅ El perfil se recupera al hacer login
   - ✅ Solo se limpian datos de autenticación

---

## 🧪 Testing

### Casos de Prueba:

1. **Cambio de nombre**
   ```
   ✅ Abrir "Configurar Perfil"
   ✅ Cambiar nombre
   ✅ Guardar
   ✅ Verificar que se muestra en navbar
   ✅ Logout
   ✅ Login
   ✅ Verificar que el nombre persiste
   ```

2. **Cambio de foto**
   ```
   ✅ Abrir "Configurar Perfil"
   ✅ Subir foto
   ✅ Guardar
   ✅ Verificar que se muestra en navbar
   ✅ Logout
   ✅ Login
   ✅ Verificar que la foto persiste
   ```

3. **Eliminación de foto**
   ```
   ✅ Abrir "Configurar Perfil"
   ✅ Click en "Eliminar Foto"
   ✅ Guardar
   ✅ Verificar que se muestra avatar por defecto
   ```

4. **Múltiples usuarios**
   ```
   ✅ Login como usuario1
   ✅ Configurar perfil usuario1
   ✅ Logout
   ✅ Login como usuario2
   ✅ Configurar perfil usuario2
   ✅ Verificar que cada usuario tiene su perfil
   ```

---

## 📊 Estructura de localStorage

### Después de Login:

```javascript
// Datos de Autenticación (transitorios)
localStorage = {
  'rol': 'admin',
  'token_usuario': 'eyJ0eXAiOiJKV1QiLCJhbGc...',
  'auth_access_token': 'eyJ0eXAiOiJKV1QiLCJhbGc...',
  'auth_usuario': 'dagi',
  'usuario': 'dagi',
  'tienda': 'tienda1',
  'id_sucursal': '1',

  // Datos de Perfil (persistentes)
  'nombre_perfil_dagi': 'Tienda Nova',
  'foto_perfil_dagi': 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',

  // Otros usuarios
  'nombre_perfil_usuario2': 'Mi Tienda',
  'foto_perfil_usuario2': 'data:image/png;base64,iVBORw0KGg...',
}
```

### Después de Logout:

```javascript
// Solo datos de Perfil (persistentes)
localStorage = {
  'nombre_perfil_dagi': 'Tienda Nova',
  'foto_perfil_dagi': 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  'nombre_perfil_usuario2': 'Mi Tienda',
  'foto_perfil_usuario2': 'data:image/png;base64,iVBORw0KGg...',
}
```

---

## 🚀 Ventajas de la Nueva Implementación

1. **Separación de Concerns**: Auth vs Perfil
2. **Persistencia Real**: Los datos sobreviven a logout/login
3. **Multi-usuario**: Cada usuario tiene su perfil independiente
4. **Mantenibilidad**: Funciones auxiliares reutilizables
5. **Debugging**: Logs detallados para troubleshooting
6. **Validación**: Verificación de guardado exitoso
7. **Robustez**: Manejo de errores con alertas al usuario

---

## 📝 Archivos Creados/Modificados

### Creados:
- ✅ [frontend/src/utils/perfilStorage.js](frontend/src/utils/perfilStorage.js) - Utilidades de perfil

### Modificados:
- ✅ [frontend/src/hooks/useAuth.js](frontend/src/hooks/useAuth.js) - Logout sin borrar perfiles
- ✅ [frontend/src/services/analyticsApi.js](frontend/src/services/analyticsApi.js) - Error handling sin borrar perfiles
- ✅ [frontend/src/components/Navbar.jsx](frontend/src/components/Navbar.jsx) - Carga perfil con funciones auxiliares
- ✅ [frontend/src/components/PerfilModal.jsx](frontend/src/components/PerfilModal.jsx) - Guarda con verificación

---

## ✅ Estado: COMPLETADO

**Fecha**: 2026-04-11
**Versión**: 2.0 (Persistencia de Perfil)
**Estado**: ✅ Producción

El perfil de usuario ahora persiste correctamente entre sesiones de login/logout.
