# Guía de Gestión de Tiendas - Django Admin

## Modelos Registrados

Se han registrado los siguientes modelos en el panel de administración:

### 1. **Tiendas** ✅
**Ruta:** Home › Nova › Tiendas

**Funcionalidades:**
- Ver listado completo de tiendas
- Activar/desactivar tiendas
- Editar información de tiendas
- Gestionar dominios por tienda
- Ver información de base de datos (autogenerada)

### 2. **Direccion** ✅
**Ruta:** Home › Nova › Direccions

**Funcionalidades:**
- Gestión de direcciones de tiendas
- Campos: calle/número, ciudad/estado, código postal, país

### 3. **Documento** ✅
**Ruta:** Home › Nova › Documentos

**Funcionalidades:**
- Gestión de documentos fiscales de tiendas
- Tipos de documento: RUC, Cédula, etc.
- Relación con tienda

### 4. **Dominios** ✅
**Ruta:** Home › Nova › Dominios

**Funcionalidades:**
- Gestión de dominios de tiendas
- Marcar dominio como principal
- Autogeneración de subdominios

### 5. **TipoDocumento** ✅
**Ruta:** Home › Nova › Tipo documentos

**Funcionalidades:**
- Gestión de tipos de documento (RUC, Cédula, etc.)
- Configuración de documentos fiscales

---

## Gestión de Tiendas

### Listado de Tiendas

Al acceder a **Home › Nova › Tiendas**, verás:

| Columna | Descripción |
|---------|-------------|
| Nombre tienda | Nombre de la tienda |
| NIT | Número de identificación fiscal |
| Usuario | Usuario de acceso |
| Correo usuario | Correo electrónico |
| Es activo | ✅ Activo / ❌ Inactivo |
| Slug | Identificador URL único |
| Creado en | Fecha de creación |

**Filtros disponibles:**
- Es activo (Sí/No)
- Creado en (rango de fechas)

**Búsqueda:**
- Por nombre de tienda
- Por NIT
- Por usuario
- Por correo

### Activar/Desactivar Tiendas

#### Método 1: Acción Masiva

1. Ve a **Home › Nova › Tiendas**
2. Selecciona las tiendas con los checkboxes
3. En el dropdown "Acción", selecciona:
   - **Activar tiendas seleccionadas**
   - **Desactivar tiendas seleccionadas**
4. Click en **Go**
5. Las tiendas se actualizan automáticamente

#### Método 2: Edición Individual

1. Ve a **Home › Nova › Tiendas**
2. Click en la tienda que deseas modificar
3. En la sección **Usuario y Acceso**:
   - Marca **Es activo** ✅ para activar
   - Desmarca **Es activo** para desactivar
4. Click en **Save**

### Crear una Nueva Tienda

**Opción 1: Desde el Admin**

1. Ve a **Home › Nova › Tiendas**
2. Click en **+ Add Tiendas**
3. Completa los campos:

**Información Básica:**
- **Nombre tienda:** Nombre de la tienda
- **NIT:** Número de identificación fiscal (opcional)
- **Nombre completo:** Nombre legal de la empresa
- **Nombre propietario:** Nombre del propietario (opcional)
- **Teléfono:** Teléfono de contacto

**Usuario y Acceso:**
- **Usuario:** Username único para el sistema
- **Correo usuario:** Correo electrónico
- **Es activo:** ✅ Marcar para activar la tienda

4. Click en **Save**
5. El sistema autogenerará:
   - Slug único
   - Base de datos (nombre, usuario, password)

**Opción 2: Desde la API (Recomendado)**

Usa el endpoint `/api/tiendas/` con el siguiente formato:

```json
{
  "nombre_tienda": "Mi Tienda",
  "nit": "123456789001",
  "nombre_completo": "Mi Tienda S.A.",
  "telefono": "+593 99 123 4567",
  "direccion": {
    "calle_numero": "Calle Principal 123",
    "ciudad_estado": "Quito, Pichincha",
    "codigo_postal": "170129",
    "pais": "Ecuador"
  },
  "usuario_data": {
    "usuario": "mitienda",
    "correo_usuario": "contacto@mitienda.com"
  },
  "documento_data": {
    "tipo_id": 1,
    "documento": "123456789001"
  },
  "email": "contacto@mitienda.com"
}
```

### Editar una Tienda

1. Ve a **Home › Nova › Tiendas**
2. Click en la tienda que deseas editar
3. Modifica los campos necesarios

**Secciones disponibles:**

#### Información Básica
- Nombre tienda
- NIT
- Nombre completo
- Nombre propietario
- Teléfono

#### Usuario y Acceso
- Usuario
- Correo usuario
- **Es activo** ✅ (para activar/desactivar)

#### Base de Datos (Solo lectura)
- db_nombre (autogenerado)
- db_usuario (autogenerado)
- db_password (autogenerado)

#### Configuración Avanzada
- Slug (identificador URL)
- Documento fiscal
- Dirección

### Gestión de Dominios

Las tiendas pueden tener múltiples dominios. Desde el admin de tiendas:

#### Agregar un Dominio

1. Edita una tienda
2. En la sección **Dominios**, click en **+ Add another Dominio**
3. Completa:
   - **Dominio:** ej. `mi-tienda.nova.dagi.co`
   - **Es principal:** ✅ Marcar si es el dominio principal
4. Click en **Save**

#### Editar Dominios

1. Edita una tienda
2. En la sección **Dominios**, click en el dominio
3. Modifica los campos
4. Click en **Save**

### Ver Usuarios de una Tienda

Para ver los usuarios asociados a una tienda:

1. Ve a **Home › Nova › Login usuarios**
2. Usa el filtro **Tienda** para filtrar por tienda
3. O usa la búsqueda y escribe el nombre de la tienda

---

## Ejemplos de Uso

### Caso 1: Activar una Nueva Tienda

**Situación:** Una tienda se ha registrado pero está inactiva.

**Pasos:**
1. Ve a **Home › Nova › Tiendas**
2. Busca la tienda por nombre o NIT
3. Click en la tienda
4. En **Usuario y Acceso**, marca **Es activo** ✅
5. Click en **Save**

**Resultado:** La tienda ahora puede acceder al sistema.

### Caso 2: Desactivar una Tienda Temporalmente

**Situación:** Una tienda necesita ser desactivada temporalmente.

**Pasos:**
1. Ve a **Home › Nova › Tiendas**
2. Selecciona la tienda con el checkbox
3. En acciones, selecciona **Desactivar tiendas seleccionadas**
4. Click en **Go**

**Resultado:** La tienda ya no puede acceder al sistema, pero los datos se conservan.

### Caso 3: Ver Información de Base de Datos

**Situación:** Necesitas ver las credenciales de base de datos de una tienda.

**Pasos:**
1. Ve a **Home › Nova › Tiendas**
2. Click en la tienda
3. En **Base de Datos**, expande la sección
4. Verás:
   - **db_nombre:** Nombre de la base de datos
   - **db_usuario:** Usuario de base de datos
   - **db_password:** Password de base de datos

**Nota:** Estos campos son solo lectura y se generan automáticamente.

### Caso 4: Asignar Múltiples Dominios

**Situación:** Una tienda necesita múltiples dominios.

**Pasos:**
1. Edita la tienda
2. En **Dominios**, agrega:
   - Dominio 1: `tienda.nova.dagi.co` (Es principal: ✅)
   - Dominio 2: `www.mitienda.com` (Es principal: ❌)
   - Dominio 3: `mitienda.ec` (Es principal: ❌)
3. Click en **Save**

**Resultado:** La tienda es accesible desde los 3 dominios.

---

## Buenas Prácticas

### 1. Activación de Tiendas

✅ **Recomendado:**
- Verificar que la tienda tenga toda la información completa antes de activar
- Confirmar que el correo electrónico sea válido
- Asegurarse de que la dirección esté completa

❌ **No recomendado:**
- Activar tiendas con información incompleta
- Desactivar tiendas sin previo aviso

### 2. Gestión de Dominios

✅ **Recomendado:**
- Mantener un solo dominio principal por tienda
- Usar subdominios de nova.dagi.co cuando sea posible
- Documentar dominios personalizados

❌ **No recomendado:**
- Tener múltiples dominios principales
- Usar dominios sin verificar propiedad

### 3. Seguridad

✅ **Recomendado:**
- Revisar periódicamente las credenciales de base de datos
- Monitorear el acceso de tiendas inactivas
- Mantener actualizada la información de contacto

❌ **No recomendado:**
- Compartir credenciales de base de datos
- Activar tiendas sin verificación

---

## Troubleshooting

### Problema: No puedo activar una tienda

**Causas posibles:**
- La tienda no tiene un usuario asignado
- El correo electrónico es inválido
- Falta información obligatoria

**Solución:**
1. Verifica que todos los campos obligatorios estén completos
2. Asegúrate de que el usuario sea único
3. Verifica que el correo sea válido

### Problema: No puedo agregar un dominio

**Causas posibles:**
- El dominio ya está en uso por otra tienda
- El formato del dominio es inválido

**Solución:**
1. Verifica que el dominio no exista
2. Usa el formato: `subdominio.dominio.com`
3. Para subdominios de nova.dagi.co: `tienda.nova.dagi.co`

### Problema: No veo las credenciales de base de datos

**Causas posibles:**
- La tienda se creó antes de la implementación de autogeneración
- Los campos no se generaron correctamente

**Solución:**
1. Edita la tienda
2. Guarda sin hacer cambios (trigger de save)
3. Los campos se autogenerarán si están vacíos

---

## Resumen

### Funcionalidades Implementadas

| Funcionalidad | Estado |
|---------------|--------|
| Listado de tiendas | ✅ |
| Activar/desactivar tiendas | ✅ |
| Crear tiendas | ✅ |
| Editar tiendas | ✅ |
| Gestionar dominios | ✅ |
| Ver credenciales DB | ✅ |
| Filtros y búsqueda | ✅ |
| Acciones masivas | ✅ |

### Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| [`backend/nova/admin.py`](backend/nova/admin.py) | +180 líneas (Admin de tiendas) |

---

**Última actualización:** 2026-04-08
