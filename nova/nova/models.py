# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class ApellidosUsuarioNatural(models.Model):
    id_apellido = models.AutoField(primary_key=True)
    apellido = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'apellidos_usuario_natural'


class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group', 'permission'),)


class AuthPermission(models.Model):
    name = models.CharField(max_length=255)
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
    codename = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type', 'codename'),)


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
        managed = False
        db_table = 'auth_user'


class AuthUserGroups(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_groups'
        unique_together = (('user', 'group'),)


class AuthUserUserPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_user_permissions'
        unique_together = (('user', 'permission'),)


class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre_categoria = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'categoria'


class CreditoUsuarioNatural(models.Model):
    id_credito = models.AutoField(primary_key=True)
    id_cliente = models.ForeignKey('InfClientes', models.DO_NOTHING, db_column='id_cliente')
    limite_saldo = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    saldo_actual = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    saldo_disponible = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    id_estado = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'credito_usuario_natural'


class DjangoAdminLog(models.Model):
    action_time = models.DateTimeField()
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.SmallIntegerField()
    change_message = models.TextField()
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    id = models.BigAutoField(primary_key=True)
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'


class Empleados(models.Model):
    id_empleado = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    correo = models.CharField(unique=True, max_length=100)
    password_empleado = models.CharField(max_length=255)
    id_rol = models.ForeignKey('Roles', models.DO_NOTHING, db_column='id_rol')

    class Meta:
        managed = False
        db_table = 'empleados'


class EstadisticaAi(models.Model):
    id_estadistica = models.AutoField(primary_key=True)
    id_sucursal = models.ForeignKey('Sucursales', models.DO_NOTHING, db_column='id_sucursal')
    productos_vendidos = models.IntegerField(blank=True, null=True)
    ganancias = models.FloatField(blank=True, null=True)
    gastos = models.FloatField(blank=True, null=True)
    perdidas = models.FloatField(blank=True, null=True)
    producto_mas_vendido = models.CharField(max_length=255, blank=True, null=True)
    comparacion_producto_mas_vendido = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'estadistica_ai'


class Estado(models.Model):
    id_estado = models.AutoField(primary_key=True)
    tipo = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'estado'


class FacturasProveedor(models.Model):
    id_factura = models.AutoField(primary_key=True)
    id_proveedor = models.ForeignKey('InfProveedores', models.DO_NOTHING, db_column='id_proveedor')
    id_tienda = models.ForeignKey('Tiendas', models.DO_NOTHING, db_column='id_tienda')
    total_neto = models.FloatField(blank=True, null=True)
    total_bruto = models.FloatField(blank=True, null=True)
    descuento = models.FloatField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'facturas_proveedor'


class HistorialLogin(models.Model):
    id_historial_login = models.AutoField(primary_key=True)
    id_empleado = models.ForeignKey(Empleados, models.DO_NOTHING, db_column='id_empleado')
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField(blank=True, null=True)
    hora_fin = models.TimeField(blank=True, null=True)
    tiempo_transcurrido = models.DurationField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'historial_login'


class HistorialMovimientos(models.Model):
    id_historial_movimiento = models.OneToOneField('RegistroUsuarioNatural', models.DO_NOTHING, db_column='id_historial_movimiento', primary_key=True)
    id_empleado = models.ForeignKey(Empleados, models.DO_NOTHING, db_column='id_empleado')
    accion = models.TextField()

    class Meta:
        managed = False
        db_table = 'historial_movimientos'


class HistorialVentas(models.Model):
    id_historial = models.AutoField(primary_key=True)
    id_producto = models.ForeignKey('Productos', models.DO_NOTHING, db_column='id_producto')
    cantidad = models.IntegerField(blank=True, null=True)
    fecha_venta = models.DateField(blank=True, null=True)
    precio_unitario = models.FloatField(blank=True, null=True)
    precio_total = models.FloatField(blank=True, null=True)
    id_cliente = models.ForeignKey('InfClientes', models.DO_NOTHING, db_column='id_cliente', blank=True, null=True)
    id_proveedor = models.ForeignKey('InfProveedores', models.DO_NOTHING, db_column='id_proveedor', blank=True, null=True)
    id_categoria = models.ForeignKey(Categoria, models.DO_NOTHING, db_column='id_categoria', blank=True, null=True)
    hora_registro = models.TimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'historial_ventas'


class InfClientes(models.Model):
    id_cliente = models.OneToOneField('Tiendas', models.DO_NOTHING, db_column='id_cliente', primary_key=True)
    nombre = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    cedula = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'inf_clientes'


class InfLoginUsuarioNatural(models.Model):
    id_usuario_natural_login = models.ForeignKey('RegistroUsuarioNatural', models.DO_NOTHING, db_column='id_usuario_natural_login', blank=True, null=True)
    id_usuario = models.AutoField(primary_key=True)
    nombres = models.CharField(max_length=100, blank=True, null=True)
    apellidos = models.CharField(max_length=100, blank=True, null=True)
    correos = models.CharField(max_length=255, blank=True, null=True)
    cargo = models.CharField(max_length=50, blank=True, null=True)
    password_usuario_natural = models.CharField(max_length=255, blank=True, null=True)
    img_perfil = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'inf_login_usuario_natural'


class InfProducto(models.Model):
    product_id = models.AutoField(primary_key=True)
    id_tienda = models.IntegerField()
    codigo_barras_local = models.IntegerField()
    descripcion = models.TextField(blank=True, null=True)
    precio_local = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    nombre_producto = models.CharField(max_length=40, blank=True, null=True)
    id_categoria = models.ForeignKey(Categoria, models.DO_NOTHING, db_column='id_categoria')
    imagen_producto = models.BinaryField(blank=True, null=True)
    marca = models.CharField(max_length=30)
    tiene_iva = models.BooleanField(blank=True, null=True)
    referencia = models.CharField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'inf_producto'


class InfProveedores(models.Model):
    id_proveedor = models.AutoField(primary_key=True)
    razon_social = models.CharField(max_length=255, blank=True, null=True)
    correo = models.CharField(max_length=255, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    n_registro_mercantil = models.CharField(max_length=50, blank=True, null=True)
    nit = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'inf_proveedores'


class LoginUsuario(models.Model):
    id_login_usuario = models.AutoField(primary_key=True)
    id_tienda = models.IntegerField(blank=True, null=True)
    password_usuario = models.CharField(max_length=250, blank=True, null=True)
    correo_usuario = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'login_usuario'


class MediosPago(models.Model):
    id_pago = models.AutoField(primary_key=True)
    metodo_pago = models.CharField(max_length=30, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'medios_pago'


class NPedido(models.Model):
    id_n_pedido = models.AutoField(primary_key=True)
    id_producto = models.IntegerField(blank=True, null=True)
    cantidad_producto = models.IntegerField(blank=True, null=True)
    precio_unitario_con_iva = models.DecimalField(max_digits=10, decimal_places=0, blank=True, null=True)
    precio_unitario_sin_iva = models.DecimalField(max_digits=10, decimal_places=0, blank=True, null=True)
    iva = models.DecimalField(max_digits=10, decimal_places=0, blank=True, null=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=0, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'n_pedido'


class NombresUsuarioNatural(models.Model):
    id_nombre = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'nombres_usuario_natural'


class Pedido(models.Model):
    id_pedido = models.AutoField(primary_key=True)
    id_pagos = models.IntegerField(blank=True, null=True)
    numero_fact_unico = models.DecimalField(max_digits=10, decimal_places=0, blank=True, null=True)
    fecha_emicion = models.DateField(blank=True, null=True)
    fecha_vencimiento = models.DateField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'pedido'


class Productos(models.Model):
    id_producto = models.AutoField(primary_key=True)
    nombre_producto = models.CharField(max_length=255, blank=True, null=True)
    id_categoria = models.ForeignKey(Categoria, models.DO_NOTHING, db_column='id_categoria')
    precio_unitario = models.FloatField(blank=True, null=True)
    descripcion = models.TextField(blank=True, null=True)
    imagen_producto = models.CharField(max_length=255, blank=True, null=True)
    marca = models.CharField(max_length=100, blank=True, null=True)
    tiene_iva = models.BooleanField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'productos'


class RegistroUsuarioNatural(models.Model):
    id_usuario_natural = models.AutoField(primary_key=True)
    id_nombre = models.ForeignKey(NombresUsuarioNatural, models.DO_NOTHING, db_column='id_nombre')
    id_apellido = models.ForeignKey(ApellidosUsuarioNatural, models.DO_NOTHING, db_column='id_apellido')
    id_telefono = models.ForeignKey('TelefonosUsuarioNatural', models.DO_NOTHING, db_column='id_telefono', blank=True, null=True)
    correos_usuarios_natural = models.CharField(max_length=255, blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    pasword_usuario_natural = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'registro_usuario_natural'


class RegistroVentas(models.Model):
    id_venta = models.AutoField(primary_key=True)
    id_cliente = models.ForeignKey(InfClientes, models.DO_NOTHING, db_column='id_cliente')
    fecha_venta = models.DateField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    precio_total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        managed = False
        db_table = 'registro_ventas'


class Roles(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=255)
    permiso = models.TextField()

    class Meta:
        managed = False
        db_table = 'roles'


class Sucursales(models.Model):
    id_sucursal = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    ciudad = models.CharField(max_length=100, blank=True, null=True)
    socio = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=50, blank=True, null=True)
    subfijo = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'sucursales'


class TelefonosUsuarioNatural(models.Model):
    id_telefono = models.AutoField(primary_key=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'telefonos_usuario_natural'


class Tiendas(models.Model):
    id_tienda = models.AutoField(primary_key=True)
    nombre_tienda = models.CharField(max_length=100, blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tiendas'
