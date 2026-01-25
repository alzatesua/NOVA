# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = True` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from django.contrib.auth.models import Group, Permission
from django.contrib.admin.models import LogEntry
from django.contrib.contenttypes.models import ContentType
from django.contrib.sessions.models import Session
from django.contrib.auth.models import Group
from django.contrib.auth.models import Permission
from django.contrib.auth.models import User, Group, Permission
from django.utils import timezone
import uuid
from django.contrib.auth.hashers import make_password
import random
import string

from django.contrib.auth.models import BaseUserManager
from django.contrib.auth.hashers import make_password, check_password as django_check_password
from django.utils.text import slugify
import uuid
from django.conf import settings
import psycopg2
from psycopg2 import sql
import os

import re
from django.utils.text import slugify

import uuid
import random
import string
import psycopg
from psycopg import sql
from django.conf import settings
from django.db import models

import psycopg
from django.conf import settings
from psycopg.errors import DuplicateDatabase, DuplicateObject, Error

from nova.services.db_creator import crear_db
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework import status

import uuid
import random
import string
import logging
from django.utils.text import slugify
from django.db import models
from django.core.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import PermissionsMixin
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.hashers import make_password

from .managers import UsuarioManager


import logging

logger = logging.getLogger(__name__)


class HistorialVentas(models.Model):
    # campos...
    pass



class ApellidosUsuarioNatural(models.Model):
    id_apellido = models.AutoField(primary_key=True)
    apellido = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'apellidos_usuario_natural'

class AuthUser(models.Model):
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(blank=True, null=True)
    is_superuser = models.BooleanField()
    username = models.CharField(unique=True, max_length=150)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.CharField(max_length=254)
    is_staff = models.BooleanField()
    is_active = models.BooleanField()
    date_joined = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'auth_user'


class AuthUserGroups(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    group = models.ForeignKey(Group, models.DO_NOTHING)

    class Meta:
        managed = True
        db_table = 'auth_user_groups'
        unique_together = (('user', 'group'),)


class AuthUserUserPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    permission = models.ForeignKey(Permission, models.DO_NOTHING)

    class Meta:
        managed = True
        db_table = 'auth_user_user_permissions'
        unique_together = (('user', 'permission'),)


class InfProveedores(models.Model):
    razon_social = models.CharField(max_length=255, blank=True, null=True)
    correo = models.CharField(max_length=255, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    n_registro_mercantil = models.CharField(max_length=50, blank=True, null=True)
    nit = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'inf_proveedores'


class Direccion(models.Model):
    calle_numero = models.CharField(max_length=100)
    ciudad_estado = models.CharField(max_length=100)
    codigo_postal = models.CharField(max_length=20)
    pais = models.CharField(max_length=100)

    class Meta:
        db_table = 'direccion'
# Tabla maestra de tipos de documento
class TipoDocumento(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'tipo_documento'


class Documento(models.Model):
    tipo = models.ForeignKey(TipoDocumento, on_delete=models.CASCADE)
    documento = models.CharField(max_length=50)
    tienda = models.ForeignKey('Tiendas', on_delete=models.CASCADE, related_name='documentos')

    class Meta:
        db_table = 'documento'
        unique_together = ('tienda', 'tipo')


class Tiendas(models.Model):
    nombre_tienda = models.CharField(max_length=100)
    nit = models.CharField(max_length=30, null=True, blank=True)
    db_nombre = models.CharField(max_length=150, unique=True, null=True, blank=True)
    db_password = models.CharField(max_length=100, blank=True)
    db_usuario = models.CharField(max_length=100, blank=True)

    nombre_completo = models.CharField(max_length=150)
    telefono = models.CharField(max_length=30)
    direccion = models.OneToOneField('Direccion', on_delete=models.CASCADE, related_name='tienda')
    nombre_propietario = models.CharField(max_length=150, blank=True, null=True)
    documento = models.OneToOneField('Documento', on_delete=models.SET_NULL, blank=True, null=True)

    slug = models.SlugField(max_length=100, unique=True, blank=True, null=True)
    usuario    = models.CharField(max_length=100, unique=True)
    correo_usuario = models.EmailField()
    es_activo = models.BooleanField(default=False)

    creado_en = models.DateTimeField(auto_now_add=True)

    
    def save(self, *args, **kwargs):
        usuario_data = kwargs.pop("usuario_data", None)
        creating = self.pk is None

        uid = uuid.uuid4().hex[:6]

        if not self.db_nombre or self.db_nombre.strip() == '':
            slug_base = self.nombre_tienda.lower().replace(' ', '-')
            self.db_nombre = f"{slug_base}-{uid}"

        if not self.db_usuario or self.db_usuario.strip() == '':
            slug_nit = self.nit.lower().replace(' ', '_') if self.nit else 'sin_nit'
            self.db_usuario = f"{slug_nit}_{uid}"

        if not self.db_password or self.db_password.strip() == '':
            self.db_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))

        if not self.slug:
            base_slug = slugify(self.nombre_tienda)
            random_suffix = uuid.uuid4().hex[:4]
            self.slug = f"{base_slug}-{random_suffix}"

        # ✅ ASIGNAR USUARIO DESDE usuario_data
        if not self.usuario and usuario_data and usuario_data.get("usuario"):
            self.usuario = usuario_data["usuario"]

        # ✅ También puedes poblar el email si es necesario
        if not self.correo_usuario and usuario_data and usuario_data.get("correo_usuario"):
            self.correo_usuario = usuario_data["correo_usuario"]

        # Guardar tienda primero
        super().save(*args, **kwargs)

        if creating:
            try:
                base_creada = crear_db(
                    db_nombre=self.db_nombre,
                    db_password=self.db_password,
                    db_usuario=self.db_usuario,
                    usuario_data=usuario_data
                )

                if not base_creada:
                    raise ValidationError("No se pudo crear la base de datos correctamente.")

            except Exception as e:
                logger.exception("Error al crear tienda y base de datos")
                raise ValidationError(f"Error al configurar la tienda: {str(e)}")

            return Response({"detail": "Tienda creada correctamente."}, status=status.HTTP_201_CREATED)


class Dominios(models.Model):
    tienda = models.ForeignKey(Tiendas, on_delete=models.CASCADE, related_name='dominios')
    dominio = models.CharField(max_length=255, unique=True, blank=True)  # Lo dejamos en blanco para autogenerar
    es_principal = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True)

    def clean_subdomain(value):
        slug = slugify(value)
        return re.sub(r'[^a-z0-9-]', '-', slug)


    def save(self, *args, **kwargs):
        if not self.dominio:
            # Convertimos el nombre de la tienda en un slug (sin espacios, minúsculas)
            nombre_slug = Dominios.clean_subdomain(self.tienda.db_nombre)
            # Aquí defines la forma del dominio. Ejemplo: "nombretienda-abc123.midominio.com"
            self.dominio = f"{nombre_slug}"#.{settings.BASE_DOMAIN}"

        super().save(*args, **kwargs)

    def __str__(self):
        return self.dominio

class Sucursal(models.Model):
    nombre = models.CharField(max_length=100)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    ciudad = models.CharField(max_length=100, blank=True, null=True)
    pais = models.CharField(max_length=100, blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    estatus = models.BooleanField(default=True)

    class Meta:
        db_table = 'main_dashboard_sucursales'

    def __str__(self):
        return self.nombre



"""
class LoginUsuario(AbstractBaseUser, PermissionsMixin):

    ROLES = (
        ('admin', 'Administrador'),
        ('almacen', 'Encargado de Almacén'),
        ('vendedor', 'Vendedor'),
        ('operario', 'Operario'),
    )

    id = models.AutoField(primary_key=True, db_column='id_login_usuario')
    tienda = models.ForeignKey('Tiendas', on_delete=models.CASCADE, related_name='usuarios_legacy')
    
    usuario = models.CharField(max_length=100, unique=True)
    correo_usuario = models.EmailField(unique=True, max_length=255)
    password = models.CharField(_('password'), max_length=128)
    
    rol = models.CharField(max_length=20, choices=ROLES, default='admin')
    
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    last_login = models.DateTimeField(auto_now=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    token = models.CharField(max_length=255, blank=True, null=True)

    objects = UsuarioManager()

    USERNAME_FIELD = 'correo_usuario'
    REQUIRED_FIELDS = []

    sucursal_id = models.IntegerField(
        null=True,
        blank=True,
        db_column='id_sucursal_default'
    )

    id_sucursal_default = models.ForeignKey(
        Sucursal,
        on_delete=models.SET_NULL,
        null=True,
        db_column='id_sucursal_default',
        related_name='usuarios'
    )
    class Meta:
        db_table = 'login_usuario'

    def __str__(self):
        return f'{self.usuario} - {self.get_rol_display()}'

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True

    @property
    def is_staff(self):
        return self.is_admin"""





class LoginUsuario(AbstractBaseUser, PermissionsMixin):

    ROLES = (
        ('admin', 'Administrador'),
        ('almacen', 'Encargado de Almacén'),
        ('vendedor', 'Vendedor'),
        ('operario', 'Operario'),
    )

    id = models.AutoField(primary_key=True, db_column='id_login_usuario')
    tienda = models.ForeignKey('Tiendas', on_delete=models.CASCADE, related_name='usuarios_legacy')

    usuario = models.CharField(max_length=100, unique=True)
    correo_usuario = models.EmailField(unique=True, max_length=255)
    password = models.CharField(_('password'), max_length=128)

    rol = models.CharField(max_length=20, choices=ROLES, default='admin')

    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    last_login = models.DateTimeField(auto_now=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    token = models.CharField(max_length=255, blank=True, null=True)

    # Manager
    objects = UsuarioManager()

    USERNAME_FIELD = 'correo_usuario'
    REQUIRED_FIELDS = []

    # ✅ Deja SOLO el FK apuntando a la misma columna física
    id_sucursal_default = models.ForeignKey(
        'Sucursal',
        on_delete=models.SET_NULL,
        null=True,
        db_column='id_sucursal_default',
        related_name='usuarios',
    )

    class Meta:
        db_table = 'login_usuario'

    def __str__(self):
        return f'{self.usuario} - {self.get_rol_display()}'

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True

    @property
    def is_staff(self):
        return self.is_admin

    # ✅ Alias compatible para el entero (sustituye al IntegerField eliminado)
    @property
    def sucursal_id(self):
        return self.id_sucursal_default_id  # entero del FK

    @sucursal_id.setter
    def sucursal_id(self, value):
        self.id_sucursal_default_id = value