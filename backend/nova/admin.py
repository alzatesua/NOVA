from django.contrib import admin, messages
from .models import (
    LoginUsuario, Tiendas, LoginUsuarioBodega, Direccion,
    Documento, Dominios, TipoDocumento
)
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django import forms


class CustomUserChangeForm(UserChangeForm):
    """Formulario personalizado para editar usuarios"""
    class Meta:
        model = LoginUsuario
        fields = '__all__'


class CustomUserCreationForm(UserCreationForm):
    """Formulario personalizado para crear usuarios"""
    class Meta:
        model = LoginUsuario
        fields = ('correo_usuario', 'tienda', 'rol')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Agregar campos adicionales
        self.fields['tienda'] = forms.ModelChoiceField(
            queryset=Tiendas.objects.all(),
            required=True,
            label='Tienda'
        )
        self.fields['rol'] = forms.ChoiceField(
            choices=LoginUsuario.ROLES,
            label='Rol',
            initial='admin'
        )


class LoginUsuarioBodegaInline(admin.TabularInline):
    """Inline para gestionar bodegas asignadas"""
    model = LoginUsuarioBodega
    extra = 0
    verbose_name = 'Bodega Asignada'
    verbose_name_plural = 'Bodegas Asignadas'
    readonly_fields = ('fecha_asignacion',)
    fields = ('id_bodega', 'fecha_asignacion')


# ============================================================================
# ADMIN DE TIENDAS Y MODELOS RELACIONADOS
# ============================================================================

@admin.register(Direccion)
class DireccionAdmin(admin.ModelAdmin):
    """Admin para direcciones"""
    list_display = ('calle_numero', 'ciudad_estado', 'pais', 'codigo_postal')
    search_fields = ('calle_numero', 'ciudad_estado', 'pais')


@admin.register(TipoDocumento)
class TipoDocumentoAdmin(admin.ModelAdmin):
    """Admin para tipos de documento"""
    list_display = ('nombre',)
    search_fields = ('nombre',)


@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    """Admin para documentos"""
    list_display = ('tipo', 'documento', 'tienda')
    list_filter = ('tipo',)
    search_fields = ('documento', 'tienda__nombre_tienda')


@admin.register(Dominios)
class DominiosAdmin(admin.ModelAdmin):
    """Admin para dominios"""
    list_display = ('dominio', 'tienda', 'es_principal', 'creado_en')
    list_filter = ('es_principal', 'creado_en')
    search_fields = ('dominio', 'tienda__nombre_tienda')


class DireccionInline(admin.StackedInline):
    """Inline para mostrar la dirección de la tienda"""
    model = Direccion
    can_delete = False
    verbose_name_plural = 'Dirección'
    readonly_fields = ('calle_numero', 'ciudad_estado', 'codigo_postal', 'pais')


class DominioInline(admin.TabularInline):
    """Inline para gestionar dominios de la tienda"""
    model = Dominios
    extra = 0
    verbose_name = 'Dominio'
    verbose_name_plural = 'Dominios'
    fields = ('dominio', 'es_principal')


@admin.register(Tiendas)
class TiendasAdmin(admin.ModelAdmin):
    """Admin mejorado para gestionar tiendas"""
    list_display = (
        'nombre_tienda',
        'nit',
        'usuario',
        'correo_usuario',
        'es_activo',
        'slug',
        'creado_en'
    )
    list_filter = ('es_activo', 'creado_en')
    search_fields = ('nombre_tienda', 'nit', 'usuario', 'correo_usuario')
    ordering = ('-creado_en',)
    readonly_fields = (
        'slug', 'db_nombre', 'db_usuario', 'db_password',
        'usuario_info', 'creado_en'
    )

    fieldsets = (
        ('Información Básica', {
            'fields': (
                'nombre_tienda',
                'nit',
                'nombre_completo',
                'nombre_propietario',
                'telefono'
            )
        }),
        ('Usuario y Acceso', {
            'fields': (
                'usuario',
                'correo_usuario',
                'es_activo'
            )
        }),
        ('Base de Datos (Autogenerado)', {
            'fields': ('db_nombre', 'db_usuario', 'db_password'),
            'classes': ('collapse',),
        }),
        ('Configuración Avanzada', {
            'fields': ('slug', 'documento', 'direccion'),
            'classes': ('collapse',),
        }),
        ('Metadatos', {
            'fields': ('creado_en',),
            'classes': ('collapse',),
        }),
    )

    inlines = [DominioInline]
    list_per_page = 25

    # Acciones masivas
    actions = ['activar_tiendas', 'desactivar_tiendas']

    def activar_tiendas(self, request, queryset):
        """Activar tiendas seleccionadas"""
        updated = queryset.update(es_activo=True)
        self.message_user(
            request,
            f'{updated} tienda(s) activada(s) exitosamente.',
            messages.SUCCESS
        )
    activar_tiendas.short_description = 'Activar tiendas seleccionadas'

    def desactivar_tiendas(self, request, queryset):
        """Desactivar tiendas seleccionadas"""
        updated = queryset.update(es_activo=False)
        self.message_user(
            request,
            f'{updated} tienda(s) desactivada(s) exitosamente.',
            messages.WARNING
        )
    desactivar_tiendas.short_description = 'Desactivar tiendas seleccionadas'

    def usuario_info(self, obj):
        """Mostrar información del usuario"""
        return f"Usuario: {obj.usuario}\nCorreo: {obj.correo_usuario}"
    usuario_info.short_description = 'Información de Usuario'

    # Sobrescribir get_queryset para optimizar consultas
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('direccion', 'documento')


# ============================================================================
# ADMIN DE USUARIOS
# ============================================================================

@admin.register(LoginUsuario)
class UsuarioAdmin(UserAdmin):
    """Admin mejorado para LoginUsuario con CRUD completo"""

    # Configuración de listado
    list_display = (
        'correo_usuario',
        'usuario',
        'tienda',
        'rol',
        'is_active',
        'is_admin',
        'last_login',
        'creado_en'
    )
    list_filter = (
        'is_active',
        'is_admin',
        'rol',
        'tienda',
        'last_login',
        'creado_en'
    )
    search_fields = (
        'correo_usuario',
        'usuario',
        'tienda__nombre_tienda'
    )
    ordering = ('-creado_en',)

    # Configuración de campos en el formulario
    fieldsets = (
        ('Información de Cuenta', {
            'fields': ('correo_usuario', 'password', 'usuario')
        }),
        ('Información de Tienda', {
            'fields': ('tienda', 'id_sucursal_default')
        }),
        ('Roles y Permisos', {
            'fields': ('rol', 'is_active', 'is_admin')
        }),
        ('Metadatos', {
            'fields': ('last_login', 'creado_en', 'token'),
            'classes': ('collapse',),
        }),
    )

    # Configuración para crear usuario
    add_fieldsets = (
        ('Crear Nuevo Usuario', {
            'classes': ('wide',),
            'fields': (
                'correo_usuario',
                'usuario',
                'password1',
                'password2',
                'tienda',
                'rol',
                'is_active',
                'is_admin'
            ),
        }),
    )

    # Formularios personalizados
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm

    # Inlines para gestionar relaciones
    inlines = [LoginUsuarioBodegaInline]

    # Configuraciones adicionales
    list_per_page = 25

    # Acciones personalizadas
    actions = ['activar_usuarios', 'desactivar_usuarios', 'hacer_admin', 'quitar_admin']

    def activar_usuarios(self, request, queryset):
        """Acción para activar usuarios seleccionados"""
        updated = queryset.update(is_active=True)
        self.message_user(
            request,
            f'{updated} usuario(s) activado(s) exitosamente.',
            messages.SUCCESS
        )
    activar_usuarios.short_description = 'Activar usuarios seleccionados'

    def desactivar_usuarios(self, request, queryset):
        """Acción para desactivar usuarios seleccionados"""
        updated = queryset.update(is_active=False)
        self.message_user(
            request,
            f'{updated} usuario(s) desactivado(s) exitosamente.',
            messages.WARNING
        )
    desactivar_usuarios.short_description = 'Desactivar usuarios seleccionados'

    def hacer_admin(self, request, queryset):
        """Acción para otorgar permisos de administrador"""
        updated = queryset.update(is_admin=True)
        self.message_user(
            request,
            f'{updated} usuario(s) ahora son administradores.',
            messages.SUCCESS
        )
    hacer_admin.short_description = 'Otorgar permisos de administrador'

    def quitar_admin(self, request, queryset):
        """Acción para quitar permisos de administrador"""
        updated = queryset.update(is_admin=False)
        self.message_user(
            request,
            f'{updated} usuario(s) perdieron permisos de administrador.',
            messages.WARNING
        )
    quitar_admin.short_description = 'Quitar permisos de administrador'

    # Sobrescribir get_queryset para optimizar consultas
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('tienda', 'id_sucursal_default')

    # Personalización de mensajes
    def response_add(self, request, obj, post_url_continue=None):
        from django.contrib.admin.options import IS_POPUP_VAR
        if IS_POPUP_VAR in request.POST:
            return super().response_add(request, obj, post_url_continue)
        self.message_user(
            request,
            f'Usuario {obj.correo_usuario} creado exitosamente.',
            messages.SUCCESS
        )
        return super().response_add(request, obj, post_url_continue)

    def response_change(self, request, obj):
        self.message_user(
            request,
            f'Usuario {obj.correo_usuario} actualizado exitosamente.',
            messages.SUCCESS
        )
        return super().response_change(request, obj)
