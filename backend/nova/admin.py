from django.contrib import admin
from .models import LoginUsuario
from django.contrib.auth.admin import UserAdmin

class UsuarioAdmin(UserAdmin):
    list_display = ('correo_usuario', 'is_admin')
    search_fields = ('correo_usuario',)
    ordering = ('correo_usuario',)
    filter_horizontal = ()
    list_filter = ()
    fieldsets = (
        (None, {'fields': ('correo_usuario', 'password')}),
        ('Permisos', {'fields': ('is_admin', 'is_active')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('correo_usuario', 'password1', 'password2'),
        }),
    )

admin.site.register(LoginUsuario, UsuarioAdmin)
