# Guía de Uso - Django Admin Panel

## Configuración Implementada

Se han realizado las siguientes mejoras al sistema de administración:

### 1. Configuración de Nginx

**Archivo modificado:** [`nginx/nginx.conf`](nginx/nginx.conf)

**Cambios realizados:**
- ✅ Agregado `location /admin/` en ambos server blocks (nova.dagi.co y *.nova.dagi.co)
- ✅ El panel `/admin/` ahora se proxy correctamente al backend Django

**Flujo de redireccionamiento:**
```
Antes:
/admin/ → frontend (React) → redirección a /api/login ❌

Ahora:
/admin/ → backend (Django Admin) ✅
/api/ → backend (Django API) ✅
/ → frontend (React) ✅
```

### 2. Mejoras en UsuarioAdmin

**Archivo modificado:** [`backend/nova/admin.py`](backend/nova/admin.py)

**Nuevas funcionalidades implementadas:**

#### A. Listado Mejorado
- ✅ 8 columnas visibles: correo, usuario, tienda, rol, estado, admin, último login, fecha creación
- ✅ Filtros laterales: activo/inactivo, admin/no admin, rol, tienda, fechas
- ✅ Búsqueda: por correo, usuario, nombre de tienda
- ✅ Ordenamiento: por defecto por fecha de creación (más recientes primero)
- ✅ Paginación: 25 usuarios por página

#### B. Formularios Personalizados

**Crear Usuario:**
- Campos obligatorios: correo, usuario, contraseña, tienda, rol
- Opciones adicionales: is_active, is_admin
- Validación de contraseñas automática

**Editar Usuario:**
- Información de cuenta: correo, contraseña, usuario
- Información de tienda: tienda, sucursal default, bodegas asignadas
- Roles y permisos: rol, is_active, is_admin
- Metadatos (colapsado): last_login, creado_en, token

#### C. Acciones Masivas

Nuevas acciones disponibles desde el listado:

1. **Activar usuarios seleccionados**
   - Activa `is_active=True` para usuarios seleccionados
   - Mensaje de éxito con cantidad

2. **Desactivar usuarios seleccionados**
   - Desactiva `is_active=False` para usuarios seleccionados
   - Mensaje de warning con cantidad

3. **Otorgar permisos de administrador**
   - Establece `is_admin=True` para usuarios seleccionados
   - Mensaje de éxito con cantidad

4. **Quitar permisos de administrador**
   - Establece `is_admin=False` para usuarios seleccionados
   - Mensaje de warning con cantidad

#### D. Optimizaciones

- ✅ `select_related()` para tienda y sucursal (reduce consultas SQL)
- ✅ Mensajes personalizados de éxito en crear/editar
- ✅ Filtro horizontal para bodegas asignadas (UI mejorada)

---

## Instrucciones de Uso

### Paso 1: Reiniciar Nginx

**Si usas Docker:**
```bash
docker-compose restart nginx
```

**Si usas nginx nativo:**
```bash
sudo nginx -t  # Verificar configuración
sudo systemctl reload nginx  # Recargar configuración
```

### Paso 2: Verificar Superusuario

Si no tienes un superusuario creado:

```bash
docker-compose exec backend python manage.py createsuperuser
```

Ingresa:
- Correo electrónico (será el USERNAME_FIELD)
- Contraseña
- Confirmación de contraseña

### Paso 3: Acceder al Panel

1. Abre el navegador en: `https://nova.dagi.co/admin/`
2. Ingresa tu correo y contraseña
3. ¡Listo! Tienes acceso completo al panel

### Paso 4: Gestionar Tiendas

#### Ver Todas las Tiendas

1. Ve a **Home › Nova › Tiendas**
2. Verás el listado de todas las tiendas con:
   - Nombre de la tienda
   - NIT
   - Usuario
   - Correo
   - Estado (Activo/Inactivo)
   - Slug
   - Fecha de creación

#### Activar/Desactivar Tiendas (Acción Masiva)

1. Ve a **Home › Nova › Tiendas**
2. Selecciona las tiendas checkboxes
3. Selecciona la acción del dropdown:
   - **Activar tiendas seleccionadas**
   - **Desactivar tiendas seleccionadas**
4. Click en **Go**
5. Las tiendas se actualizan automáticamente

#### Editar una Tienda

1. Ve a **Home › Nova › Tiendas**
2. Click en la tienda que deseas editar
3. Puedes modificar:
   - Información básica (nombre, NIT, teléfono, etc.)
   - **Estado activo/inactivo** ✅
   - Ver la información de base de datos (solo lectura)
   - Gestionar dominios
4. Click en **Save**

#### Agregar Dominios a una Tienda

1. Edita una tienda
2. En la sección **Dominios**, click en **+ Add another Dominio**
3. Completa:
   - **Dominio**: ej. mi-tienda.nova.dagi.co
   - **Es principal**: ✅ si es el dominio principal
4. Click en **Save**

### Paso 5: Gestionar Usuarios

#### Crear un Nuevo Usuario

1. Ve a **Home › Nova › Login usuarios**
2. Click en **+ Add Login usuario**
3. Completa los campos:
   - **Correo usuario**: email@ejemplo.com
   - **Usuario**: nombre de usuario
   - **Password1**: contraseña
   - **Password2**: confirmar contraseña
   - **Tienda**: selecciona la tienda
   - **Rol**: admin, almacen, vendedor, u operario
   - **Is active**: ✅ (marcar para activar)
   - **Is admin**: ✅ (marcar solo para administradores)
4. Click en **Save**

#### Editar un Usuario Existente

1. Ve a **Home › Nova › Login usuarios**
2. Click en el usuario que deseas editar
3. Modifica los campos necesarios
4. Click en **Save**

#### Activar/Desactivar Usuarios (Acción Masiva)

1. Selecciona los usuarios checkboxes
2. Selecciona la acción del dropdown:
   - **Activar usuarios seleccionados**
   - **Desactivar usuarios seleccionados**
3. Click en **Go**
4. Los usuarios se actualizan automáticamente

#### Gestionar Permisos de Admin (Acción Masiva)

1. Selecciona los usuarios checkboxes
2. Selecciona la acción del dropdown:
   - **Otorgar permisos de administrador**
   - **Quitar permisos de administrador**
3. Click en **Go**
4. Los permisos se actualizan automáticamente

#### Buscar Usuarios

Usa la barra de búsqueda para filtrar por:
- Correo electrónico
- Nombre de usuario
- Nombre de tienda

#### Filtrar Usuarios

Usa los filtros laterales para filtrar por:
- Estado (activo/inactivo)
- Admin (sí/no)
- Rol (admin/almacen/vendedor/operario)
- Tienda
- Último login
- Fecha de creación

---

## Arquitectura del Sistema

### Modelo LoginUsuario

El modelo personalizado `LoginUsuario` implementa:

```python
class LoginUsuario(AbstractBaseUser, PermissionsMixin):
    # Campos principales
    correo_usuario = EmailField(unique=True)  # USERNAME_FIELD
    usuario = CharField(unique=True)
    password = CharField(max_length=128)

    # Multi-tenant
    tienda = ForeignKey('Tiendas')

    # Roles personalizados
    rol = ChoiceField(admin, almacen, vendedor, operario)

    # Permisos Django
    is_active = BooleanField(default=True)
    is_admin = BooleanField(default=False)  # Equivalente a is_staff

    # Relaciones
    id_sucursal_default = ForeignKey('Sucursales')
    bodegas_asignadas = ManyToManyField('Bodega', through='LoginUsuarioBodega')
```

### Configuración Django

```python
# settings.py
AUTH_USER_MODEL = 'nova.LoginUsuario'

# urls.py
urlpatterns = [
    path('admin/', admin.site.urls),
    # ...
]
```

### Integración con Django Admin

- ✅ Compatible con `@login_required`
- ✅ Compatible con `@permission_required`
- ✅ Compatible con `user.has_perm()`
- ✅ Compatible con Django REST Framework authentication
- ✅ Compatible con JWT (SimpleJWT)

---

## Troubleshooting

### Problema: /admin/ redirige a /api/login

**Solución aplicada:**
- ✅ Agregado `location /admin/` en nginx.conf
- ✅ Reiniciar nginx

**Verificar:**
```bash
# Ver configuración de nginx
cat nginx/nginx.conf | grep -A 5 "location /admin/"

# Debe mostrar:
# location /admin/ {
#     proxy_pass http://backend;
#     ...
# }
```

### Problema: No puedo acceder al admin (403 Forbidden)

**Causa:** El usuario no tiene `is_staff=True`

**Solución:**
```python
# Desde Python shell
from nova.models import LoginUsuario
user = LoginUsuario.objects.get(correo_usuario='tu@email.com')
user.is_admin = True  # Esto activa is_staff via @property
user.save()
```

### Problema: No puedo ver el modelo LoginUsuario en el admin

**Causa:** El modelo no está registrado en admin.py

**Solución aplicada:**
- ✅ Modelo registrado con `@admin.register(LoginUsuario)`

### Problema: Error al crear usuario desde el admin

**Verificar:**
1. Que el campo `correo_usuario` sea único
2. Que el campo `usuario` sea único
3. Que `tienda` esté seleccionada
4. Que las contraseñas coincidan

---

## Próximos Pasos (Opcionales)

### Mejoras Adicionales Sugeridas

1. **Registrar más modelos en admin:**
   ```python
   # main_dashboard/admin.py
   @admin.register(Sucursales)
   class SucursalAdmin(admin.ModelAdmin):
       list_display = ('nombre', 'direccion', 'activo')
   ```

2. **Personalizar el dashboard del admin:**
   - Agregar métricas personalizadas
   - Mostrar gráficos de ventas
   - Agregar enlaces rápidos

3. **Implementar logging de acciones:**
   - Registrar quién modificó qué usuario
   - Auditoría de cambios en permisos

4. **Agregar notificaciones:**
   - Email cuando se crea un nuevo usuario
   - Alertas cuando se desactiva un usuario

---

## Resumen de Cambios

### Archivos Modificados

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| [`nginx/nginx.conf`](nginx/nginx.conf) | Agregado `location /admin/` en server blocks | +20 |
| [`backend/nova/admin.py`](backend/nova/admin.py) | Admin completo para Tiendas y Usuarios | +320 |
| [`backend/nova/managers.py`](backend/nova/managers.py) | Manager mejorado para superusuarios | +25 |

### Funcionalidades Agregadas

#### Gestión de Tiendas
- ✅ CRUD completo de tiendas
- ✅ Activar/desactivar tiendas
- ✅ Gestión de dominios por tienda
- ✅ Visualización de información de DB
- ✅ Filtros y búsqueda
- ✅ Acciones masivas

#### Gestión de Usuarios
- ✅ CRUD completo de usuarios
- ✅ Filtros avanzados
- ✅ Búsqueda optimizada
- ✅ Acciones masivas (activar, desactivar, admin)
- ✅ Formularios personalizados
- ✅ Mensajes de éxito mejorados
- ✅ Optimización de consultas SQL

#### Infraestructura
- ✅ Acceso a `/admin/` desde nginx
- ✅ Superusuario con tienda asignada automáticamente

---

## Soporte

Si encuentras algún problema:

1. **Verifica los logs de nginx:**
   ```bash
   docker-compose logs nginx
   ```

2. **Verifica los logs de Django:**
   ```bash
   docker-compose logs backend
   ```

3. **Verifica la configuración:**
   ```bash
   docker-compose exec backend python manage.py check
   ```

4. **Verifica las migraciones:**
   ```bash
   docker-compose exec backend python manage.py showmigrations
   ```

---

**Documentación creada:** 2026-04-08
**Sistema:** Nova - Multi-tenant E-commerce & Inventory Management
**Arquitectura:** Django + Django REST Framework + JWT + Nginx + React
