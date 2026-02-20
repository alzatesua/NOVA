from django.db import models
from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.conf import settings
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class Sucursales(models.Model):
    nombre = models.CharField(max_length=100)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    ciudad = models.CharField(max_length=100, blank=True, null=True)
    pais = models.CharField(max_length=100, blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    estatus = models.BooleanField(default=True)  # True = activa, False = inactiva

    def __str__(self):
        return self.nombre



#modelos de productos
class Categoria(models.Model):
    id_categoria     = models.AutoField(primary_key=True, db_column='id_categoria')
    nombre       = models.CharField(max_length=100, unique=True)
    descripcion  = models.TextField(blank=True, null=True)
    creado_en    = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre

class Marca(models.Model):
    id_marca     = models.AutoField(primary_key=True, db_column='id_marca')
    nombre       = models.CharField(max_length=100, unique=True)
    creado_en    = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre

class Iva(models.Model):
    id_iva     = models.AutoField(primary_key=True, db_column='id_iva')
    porcentaje   = models.DecimalField(max_digits=5, decimal_places=2)
    creado_en    = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.porcentaje}%"


class Descuento(models.Model):
    id_descuento     = models.AutoField(primary_key=True, db_column='id_descuento')
    porcentaje = models.DecimalField(max_digits=5, decimal_places=2)  
    creado_en = models.DateTimeField(auto_now_add=True)  

    def __str__(self):
        return f"{self.porcentaje}%"

    class Meta:
        managed = False
        db_table = 'descuentos'


class TipoMedida(models.Model):
    id_tipo_medida     = models.AutoField(primary_key=True, db_column='id_tipo_medida')
    nombre = models.CharField(max_length=50)  
    creado_en = models.DateTimeField(auto_now_add=True)  

    def __str__(self):
        return self.nombre

    class Meta:
        managed = False
        db_table = 'tipos_medida'


"""
class Producto(models.Model):
    nombre        = models.CharField("Nombre", max_length=255)
    sku           = models.CharField("SKU", max_length=50, unique=True)
    descripcion   = models.TextField(blank=True, null=True)
    precio        = models.DecimalField(max_digits=10, decimal_places=2)
    stock         = models.IntegerField(default=0)

    categoria_id = models.ForeignKey(
        Categoria,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='id_categoria'
    )
    marca_id = models.ForeignKey(
        Marca,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='id_marca'
    )
    sucursal = models.ForeignKey(
        'Sucursales',           # referencia a la clase Sucursales
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='sucursal_id',
        related_name='productos'
    )
    
    descuento = models.ForeignKey(
        Descuento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='descuento_id'
    )

    tipo_medida = models.ForeignKey(
        TipoMedida,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='tipo_medida_id'
    )

    codigo_barras  = models.CharField(max_length=50, blank=True, null=True)
    imei          = models.CharField(max_length=50, blank=True, null=True)  # Campo IMEI opcional

    imagen_producto = models.CharField(max_length=255, blank=True, null=True)
    iva_id = models.ForeignKey(
        Iva,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='id_iva'
    )

    atributo       = models.CharField(max_length=50, blank=True, null=True)
    valor_atributo = models.CharField(max_length=50, blank=True, null=True)

    creado_en      = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'productos'
        indexes = [
            models.Index(fields=['sku'], name='producto_sku_idx'),
        ]
"""

class Producto(models.Model):
    nombre = models.CharField("Nombre", max_length=255)
    sku = models.CharField("SKU", max_length=50, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)  # cache/legado: la suma de todas las bodegas (lo mantenemos por compatibilidad)

    categoria_id = models.ForeignKey(
        Categoria,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='id_categoria'
    )
    marca_id = models.ForeignKey(
        Marca,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='id_marca'
    )
    sucursal = models.ForeignKey(
        'Sucursales',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='sucursal_id',
        related_name='productos'
    )


    bodega = models.ForeignKey(
        'Bodega',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='bodega_id',      
        related_name='productos'    
    )


    descuento = models.ForeignKey(
        Descuento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='descuento_id'
    )

    tipo_medida = models.ForeignKey(
        TipoMedida,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='tipo_medida_id'
    )

    codigo_barras = models.CharField(max_length=50, blank=True, null=True)
    imei = models.CharField(max_length=50, blank=True, null=True)  # Campo IMEI opcional

    imagen_producto = models.CharField(max_length=255, blank=True, null=True)
    iva_id = models.ForeignKey(
        Iva,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='id_iva'
    )

    atributo = models.CharField(max_length=50, blank=True, null=True)
    valor_atributo = models.CharField(max_length=50, blank=True, null=True)

    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'productos'
        indexes = [
            models.Index(fields=['sku'], name='producto_sku_idx'),
        ]

    def __str__(self):
        return f'{self.nombre} ({self.sku})'

    # ---- Propiedades de inventario real (basadas en Existencia) ----
    @property
    def stock_total(self):
        # suma (cantidad - reservado) en todas las bodegas
        from django.db.models import Sum
        total = (self.existencias.aggregate(
            total=Sum('cantidad') - Sum('reservado')
        )['total'] or 0)
        return total

    def existencias_por_bodega(self):
        return self.existencias.select_related('bodega', 'bodega__sucursal')







# =========================
# Inventario (nuevo)
# =========================
class Bodega(models.Model):
    TIPO_CHOICES = [
        ('ALM', 'Almacén central'),
        ('SUC', 'Bodega de sucursal'),
        ('TRN', 'En tránsito'),
        ('CON', 'Consignación'),
        ('3PL', 'Operador logístico'),
    ]

    sucursal = models.ForeignKey(
        Sucursales, on_delete=models.PROTECT, related_name='bodegas'
    )
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=20, blank=True, null=True)
    tipo = models.CharField(max_length=4, choices=TIPO_CHOICES, default='SUC')
    direccion = models.CharField(max_length=255, blank=True, null=True)
    es_predeterminada = models.BooleanField(default=False)
    estatus = models.BooleanField(default=True)

    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='bodegas_responsables'
    )

    notas = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventario_bodega'
        ordering = ('sucursal', 'nombre')
        constraints = [
            models.UniqueConstraint(fields=['sucursal', 'nombre'], name='uniq_bodega_nombre_por_sucursal'),
            models.UniqueConstraint(fields=['sucursal', 'codigo'], name='uniq_bodega_codigo_por_sucursal'),
            # Si usas PostgreSQL, puedes añadir una partial unique para es_predeterminada=True.
            # En MySQL/MariaDB NO usar esta constraint condicional.
            # models.UniqueConstraint(fields=['sucursal'], condition=Q(es_predeterminada=True),
            #                         name='uniq_bodega_predeterminada_por_sucursal'),
        ]
        indexes = [
            models.Index(fields=['sucursal', 'estatus']),
            models.Index(fields=['sucursal', 'tipo']),
        ]

    def clean(self):
        if self.es_predeterminada and self.sucursal_id:
            qs = Bodega.objects.filter(sucursal=self.sucursal, es_predeterminada=True)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                raise ValidationError({'es_predeterminada': 'Ya existe una bodega predeterminada en esta sucursal.'})

    def __str__(self):
        return f'{self.nombre} ({self.sucursal})'


class Existencia(models.Model):
    """
    Stock por Producto y por Bodega.
    (producto, bodega) es único.
    """
    producto = models.ForeignKey(
        Producto, on_delete=models.PROTECT,
        db_column='producto_id', related_name='existencias'
    )
    bodega = models.ForeignKey(Bodega, on_delete=models.PROTECT, related_name='existencias')

    cantidad = models.IntegerField(default=0)   # on-hand
    reservado = models.IntegerField(default=0)  # comprometido (órdenes/boletas abiertas)
    minimo = models.IntegerField(default=0)
    maximo = models.IntegerField(null=True, blank=True)

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventario_existencia'
        constraints = [
            models.UniqueConstraint(fields=['producto', 'bodega'], name='uniq_existencia_producto_bodega'),
        ]
        indexes = [
            models.Index(fields=['bodega']),
            models.Index(fields=['producto']),
        ]

    def __str__(self):
        return f'{self.producto_id} @ {self.bodega} = {self.cantidad}'

    @property
    def disponible(self):
        return self.cantidad - self.reservado


# =========================
# Traslados entre bodegas
# =========================
class Traslado(models.Model):
    ESTADOS = [
        ('BOR', 'Borrador'),
        ('ENV', 'Enviado'),
        ('REC', 'Recibido'),
        ('CAN', 'Cancelado'),
    ]

    bodega_origen = models.ForeignKey(Bodega, on_delete=models.PROTECT, related_name='traslados_origen')
    bodega_destino = models.ForeignKey(Bodega, on_delete=models.PROTECT, related_name='traslados_destino')
    estado = models.CharField(max_length=3, choices=ESTADOS, default='BOR')
    usar_bodega_transito = models.BooleanField(default=True, help_text='Si está activo, usa una bodega TRN durante el envío.')

    observaciones = models.TextField(blank=True, null=True)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='traslados_creados')
    enviado_en = models.DateTimeField(blank=True, null=True)
    recibido_en = models.DateTimeField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventario_traslado'
        ordering = ('-creado_en',)

    def clean(self):
        if self.bodega_origen_id and self.bodega_destino_id and self.bodega_origen_id == self.bodega_destino_id:
            raise ValidationError('La bodega de origen y destino no pueden ser la misma.')

    def __str__(self):
        return f'Traslado #{self.pk or "nuevo"} {self.bodega_origen} → {self.bodega_destino} ({self.get_estado_display()})'


class TrasladoLinea(models.Model):
    traslado = models.ForeignKey(Traslado, on_delete=models.CASCADE, related_name='lineas')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT, db_column='producto_id', related_name='lineas_traslado')
    cantidad = models.PositiveIntegerField()
    cantidad_recibida = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'inventario_traslado_linea'
        constraints = [
            models.UniqueConstraint(fields=['traslado', 'producto'], name='uniq_linea_por_producto_en_traslado')
        ]
        indexes = [
            models.Index(fields=['traslado']),
            models.Index(fields=['producto']),
        ]

    def clean(self):
        if self.cantidad == 0:
            raise ValidationError({'cantidad': 'Debe ser mayor que 0'})
        if self.cantidad_recibida > self.cantidad:
            raise ValidationError({'cantidad_recibida': 'No puede exceder la cantidad enviada'})

    @property
    def pendiente_por_recibir(self):
        return max(0, self.cantidad - self.cantidad_recibida)

    def __str__(self):
        return f'{self.producto_id} x {self.cantidad} (rec: {self.cantidad_recibida})'



# ---------- Helpers base ----------
@transaction.atomic
def ajustar_stock(producto_id: int, bodega_id: int, delta: int, actualizar_cache_producto: bool = True):
    """
    Ajusta la cantidad en una bodega (delta positivo entra, negativo sale).
    Lanza error si quedaría negativo.
    """
    exi, _ = (Existencia.objects
              .select_for_update()
              .get_or_create(producto_id=producto_id, bodega_id=bodega_id, defaults={'cantidad': 0}))
    nueva = exi.cantidad + delta
    if nueva < 0:
        raise ValueError('Stock insuficiente para la operación')
    exi.cantidad = nueva
    exi.save()

    if actualizar_cache_producto:
        _actualizar_cache_stock_producto(producto_id)
    return exi


def _actualizar_cache_stock_producto(producto_id: int):
    """
    Mantiene Producto.stock como cache (suma de (cantidad - reservado) en todas las bodegas).
    """
    total = (Existencia.objects.filter(producto_id=producto_id)
             .aggregate(total=models.Sum('cantidad') - models.Sum('reservado')))['total'] or 0
    # Producto está definido en este mismo archivo:
    Producto.objects.filter(pk=producto_id).update(stock=total)


# ---------- Traslados ----------
def _get_bodega_transito_para(origen: Bodega) -> Bodega:
    """
    Retorna (o crea) bodega TRN en la misma sucursal del origen.
    """
    b = Bodega.objects.filter(sucursal=origen.sucursal, tipo='TRN').first()
    if not b:
        b = Bodega.objects.create(sucursal=origen.sucursal, nombre='En tránsito', tipo='TRN',
                                  estatus=True, es_predeterminada=False)
    return b


@transaction.atomic
def enviar_traslado(traslado_id: int):
    t = (Traslado.objects.select_for_update()
         .select_related('bodega_origen', 'bodega_destino')
         .prefetch_related('lineas').get(pk=traslado_id))

    if t.estado != 'BOR':
        raise ValidationError('Solo se puede ENVIAR un traslado en estado BORRADOR.')
    if not t.lineas.exists():
        raise ValidationError('El traslado no tiene líneas.')

    bodega_trn = _get_bodega_transito_para(t.bodega_origen) if t.usar_bodega_transito else None

    for ln in t.lineas.select_for_update():
        ajustar_stock(ln.producto_id, t.bodega_origen_id, -ln.cantidad, actualizar_cache_producto=False)
        if bodega_trn:
            ajustar_stock(ln.producto_id, bodega_trn.id, +ln.cantidad, actualizar_cache_producto=False)

    _actualizar_cache_de_productos_de_traslado(t)

    t.estado = 'ENV'
    t.enviado_en = timezone.now()
    t.save()
    return t


@transaction.atomic
def recibir_traslado(traslado_id: int, cantidades: dict | None = None):
    """
    cantidades opcional = {producto_id: qty_a_recibir} -> soporta recepción parcial.
    Si no se pasa, recibe todo lo pendiente.
    """
    t = (Traslado.objects.select_for_update()
         .select_related('bodega_origen', 'bodega_destino')
         .prefetch_related('lineas').get(pk=traslado_id))

    if t.estado != 'ENV':
        raise ValidationError('Solo se puede RECIBIR un traslado ENVIADO.')

    bodega_trn = _get_bodega_transito_para(t.bodega_origen) if t.usar_bodega_transito else None

    for ln in t.lineas.select_for_update():
        pendiente = max(0, ln.cantidad - ln.cantidad_recibida)
        if pendiente == 0:
            continue
        qty = cantidades.get(ln.producto_id, pendiente) if cantidades else pendiente
        if qty < 0 or qty > pendiente:
            raise ValidationError(f'Cantidad inválida para producto {ln.producto_id}.')

        if bodega_trn:
            ajustar_stock(ln.producto_id, bodega_trn.id, -qty, actualizar_cache_producto=False)
        ajustar_stock(ln.producto_id, t.bodega_destino_id, +qty, actualizar_cache_producto=False)

        ln.cantidad_recibida += qty
        ln.save()

    _actualizar_cache_de_productos_de_traslado(t)

    if all(l.cantidad_recibida >= l.cantidad for l in t.lineas.all()):
        t.estado = 'REC'
        t.recibido_en = timezone.now()
    t.save()
    return t


@transaction.atomic
def cancelar_traslado(traslado_id: int):
    """
    BOR: sin efecto en stock.
    ENV: revierte lo pendiente (desde TRN o directo) hacia la bodega de origen.
    REC: no permitido (usar proceso de devolución).
    """
    t = (Traslado.objects.select_for_update()
         .select_related('bodega_origen', 'bodega_destino')
         .prefetch_related('lineas').get(pk=traslado_id))

    if t.estado == 'REC':
        raise ValidationError('No se puede cancelar un traslado ya recibido.')
    if t.estado == 'CAN':
        return t

    if t.estado == 'ENV':
        bodega_trn = _get_bodega_transito_para(t.bodega_origen) if t.usar_bodega_transito else None
        for ln in t.lineas.select_for_update():
            qty_pend = max(0, ln.cantidad - ln.cantidad_recibida)
            if qty_pend <= 0:
                continue
            if bodega_trn:
                ajustar_stock(ln.producto_id, bodega_trn.id, -qty_pend, actualizar_cache_producto=False)
            ajustar_stock(ln.producto_id, t.bodega_origen_id, +qty_pend, actualizar_cache_producto=False)

    _actualizar_cache_de_productos_de_traslado(t)
    t.estado = 'CAN'
    t.save()
    return t

def _actualizar_cache_de_productos_de_traslado(traslado: Traslado):
    """
    Recalcula Producto.stock (cache) para los productos del traslado de una sola vez.
    """
    ids = list(traslado.lineas.values_list('producto_id', flat=True))
    if not ids:
        return
    totales = (Existencia.objects.filter(producto_id__in=ids)
               .values('producto_id')
               .annotate(total=models.Sum('cantidad') - models.Sum('reservado')))
    mapa = {r['producto_id']: (r['total'] or 0) for r in totales}
    for pid in ids:
        Producto.objects.filter(pk=pid).update(stock=mapa.get(pid, 0))


# =========================
# FACTURACIÓN POS
# =========================

class Cliente(models.Model):
    """
    Cliente para facturación (Persona Natural o Jurídica)
    """
    TIPO_PERSONA_CHOICES = [
        ('NAT', 'Natural'),
        ('JUR', 'Jurídica'),
    ]
    TIPO_DOCUMENTO_CHOICES = [
        ('CC', 'Cédula de Ciudadanía'),
        ('NIT', 'NIT'),
        ('CE', 'Cédula de Extranjería'),
        ('TI', 'Tarjeta de Identidad'),
        ('PP', 'Pasaporte'),
    ]

    tipo_persona = models.CharField(max_length=3, choices=TIPO_PERSONA_CHOICES, default='NAT')

    # Persona Natural
    primer_nombre = models.CharField(max_length=100, blank=True, null=True)
    segundo_nombre = models.CharField(max_length=100, blank=True, null=True)
    apellidos = models.CharField(max_length=100, blank=True, null=True)

    # Persona Jurídica
    razon_social = models.CharField(max_length=255, blank=True, null=True)
    n_registro_mercantil = models.CharField(max_length=100, blank=True, null=True)

    # Comunes
    tipo_documento = models.CharField(max_length=3, choices=TIPO_DOCUMENTO_CHOICES, blank=True, null=True)
    numero_documento = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    correo = models.EmailField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    ciudad = models.CharField(max_length=100, blank=True, null=True)

    # Límite de crédito (opcional para ventas a crédito)
    limite_credito = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    dias_credito = models.IntegerField(default=0)

    estatus = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'facturacion_cliente'
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        indexes = [
            models.Index(fields=['numero_documento']),
            models.Index(fields=['tipo_documento', 'numero_documento']),
        ]

    def __str__(self):
        if self.tipo_persona == 'JUR':
            return self.razon_social or 'Cliente Jurídico'
        nombre = f'{self.primer_nombre or ""} {self.segundo_nombre or ""} {self.apellidos or ""}'.strip()
        return nombre or 'Cliente Natural'

    @property
    def nombre_completo(self):
        """Retorna el nombre completo formateado"""
        return self.__str__()


# =========================
# CLIENTE TIENDA (Autenticación E-commerce)
# =========================

class ClienteTiendaManager(BaseUserManager):
    """Manager personalizado para ClienteTienda"""
    def create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('rol', 'admin')
        extra_fields.setdefault('estado', 'activo')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class ClienteTienda(AbstractBaseUser, PermissionsMixin):
    """
    Cliente del e-commerce desacoplado del modelo fiscal.
    Hereda de AbstractBaseUser para integración con sistema de auth de Django.
    """
    ROLES_CHOICES = [
        ('cliente', 'Cliente E-commerce'),
        ('admin', 'Administrador Tienda'),
        ('vendedor', 'Vendedor POS'),
    ]
    ESTADOS_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('pendiente', 'Pendiente de Activación'),
    ]

    # Campos AbstractBaseUser requeridos
    id = models.BigAutoField(primary_key=True)
    email = models.EmailField(unique=True, max_length=254)
    password = models.CharField(max_length=255)  # Django lo maneja automáticamente

    # Campos adicionales
    rol = models.CharField(max_length=20, choices=ROLES_CHOICES, default='cliente')
    estado = models.CharField(max_length=20, choices=ESTADOS_CHOICES, default='pendiente')

    # Vinculación opcional con cliente fiscal
    cliente = models.ForeignKey(
        'Cliente',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cuenta_tienda',
        db_column='cliente_id'
    )

    # Timestamps
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    ultimo_login = models.DateTimeField(null=True, blank=True)

    # Campos requeridos por AbstractBaseUser/PermissionsMixin
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    # Related names para evitar conflictos con LoginUsuario
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name="cliente_tienda_set",
        related_query_name="cliente_tienda",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="cliente_tienda_set",
        related_query_name="cliente_tienda",
    )

    objects = ClienteTiendaManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'clientes_tienda'
        verbose_name = 'Cliente Tienda'
        verbose_name_plural = 'Clientes Tienda'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['estado']),
            models.Index(fields=['cliente_id']),
        ]

    def __str__(self):
        return self.email

    # Django maneja set_password y check_password automáticamente via AbstractBaseUser


class FormaPago(models.Model):
    """
    Maestro de formas de pago
    """
    codigo = models.CharField(max_length=10, unique=True)  # EFE, TDC, TDE, TRF, CDP
    nombre = models.CharField(max_length=50)
    activo = models.BooleanField(default=True)
    requiere_referencia = models.BooleanField(default=False)  # Para tarjeta/transf
    permite_cambio = models.BooleanField(default=True)  # ¿Permite dar cambio?

    class Meta:
        db_table = 'facturacion_forma_pago'
        verbose_name = 'Forma de Pago'
        verbose_name_plural = 'Formas de Pago'

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'


class Factura(models.Model):
    """
    Cabecera de Factura
    """
    ESTADO_CHOICES = [
        ('BOR', 'Borrador'),      # En creación
        ('PAG', 'Pagada'),        # Pagada completa
        ('ANU', 'Anulada'),       # Anulada con reversión de stock
    ]

    # Datos básicos
    numero_factura = models.CharField(max_length=50, unique=True, db_index=True)  # FACT-000001
    estado = models.CharField(max_length=3, choices=ESTADO_CHOICES, default='BOR')

    # Cliente (opcional para venta al público)
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='facturas'
    )

    # Vendedor y sucursal
    vendedor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='facturas_vendedor'
    )
    sucursal = models.ForeignKey(
        Sucursales,
        on_delete=models.PROTECT,
        related_name='facturas'
    )
    bodega = models.ForeignKey(
        Bodega,
        on_delete=models.PROTECT,
        related_name='facturas'
    )

    # Fechas
    fecha_venta = models.DateTimeField(auto_now_add=True, db_index=True)
    fecha_anulacion = models.DateTimeField(blank=True, null=True)

    # Totales (calculados pero cacheados)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_descuento = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_iva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Pagos
    total_pagado = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cambio = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Observaciones
    observaciones = models.TextField(blank=True, null=True)

    # Anulación
    motivo_anulacion = models.TextField(blank=True, null=True)
    anulada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='facturas_anuladas',
        db_column='anulada_por'
    )

    class Meta:
        db_table = 'facturacion_factura'
        verbose_name = 'Factura'
        verbose_name_plural = 'Facturas'
        ordering = ('-fecha_venta',)
        indexes = [
            models.Index(fields=['numero_factura']),
            models.Index(fields=['fecha_venta']),
            models.Index(fields=['estado']),
            models.Index(fields=['cliente']),
        ]

    def __str__(self):
        return f'Factura #{self.numero_factura} - ${self.total}'


class FacturaDetalle(models.Model):
    """
    Detalles de Factura (líneas de productos)
    """
    factura = models.ForeignKey(
        Factura,
        on_delete=models.CASCADE,
        related_name='detalles'
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        related_name='detalles_factura'
    )

    # Datos del producto al momento de la venta
    producto_nombre = models.CharField(max_length=255)
    producto_sku = models.CharField(max_length=50)
    producto_imei = models.CharField(max_length=50, blank=True, null=True)  # Opcional

    # Cantidades y precios
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    descuento_porcentaje = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    descuento_valor = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # IVA
    iva_porcentaje = models.DecimalField(max_digits=5, decimal_places=2)
    iva_valor = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Total línea
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    # Devoluciones
    cantidad_devuelta = models.PositiveIntegerField(default=0)

    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'facturacion_factura_detalle'
        verbose_name = 'Detalle de Factura'
        verbose_name_plural = 'Detalles de Factura'
        indexes = [
            models.Index(fields=['factura', 'producto']),
        ]

    def __str__(self):
        return f'{self.producto_nombre} x{self.cantidad}'


class Pago(models.Model):
    """
    Múltiples formas de pago por factura
    """
    factura = models.ForeignKey(
        Factura,
        on_delete=models.CASCADE,
        related_name='pagos'
    )
    forma_pago = models.ForeignKey(
        FormaPago,
        on_delete=models.PROTECT
    )

    monto = models.DecimalField(max_digits=10, decimal_places=2)
    referencia = models.CharField(max_length=100, blank=True, null=True)  # Últimos 4 dígitos, código auth
    autorizacion = models.CharField(max_length=100, blank=True, null=True)  # Código de autorización

    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'facturacion_pago'
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'

    def __str__(self):
        return f'{self.forma_pago.nombre}: ${self.monto}'


class ConfiguracionFactura(models.Model):
    """
    Configuración de facturación por sucursal
    """
    FORMATO_CHOICES = [
        ('58mm', 'Térmico 58mm'),
        ('80mm', 'Térmico 80mm'),
        ('a4', 'Papel A4'),
    ]

    sucursal = models.OneToOneField(
        Sucursales,
        on_delete=models.PROTECT,
        related_name='config_facturacion'
    )

    # Numeración
    prefijo_factura = models.CharField(max_length=10, default='FACT')
    consecutivo_actual = models.IntegerField(default=1)
    longitud_consecutivo = models.IntegerField(default=6)  # FACT-000001

    # Impresión
    formato_impresion = models.CharField(
        max_length=10,
        choices=FORMATO_CHOICES,
        default='80mm'
    )

    # Info en encabezado
    nombre_empresa = models.CharField(max_length=255)
    nit_empresa = models.CharField(max_length=50)
    direccion_empresa = models.CharField(max_length=255)
    telefono_empresa = models.CharField(max_length=20)
    ciudad_empresa = models.CharField(max_length=100, blank=True, null=True)

    # Mensajes
    pie_de_pagina = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'facturacion_config'
        verbose_name = 'Configuración de Facturación'
        verbose_name_plural = 'Configuraciones de Facturación'

    def __str__(self):
        return f'Config {self.sucursal.nombre}'


# =========================
# CUPONES
# =========================

class Cupon(models.Model):
    """Cupón de descuento. Puede ser un valor fijo o un porcentaje."""
    TIPO_CHOICES = [
        ('PCT', 'Porcentaje'),
        ('VAL', 'Valor fijo'),
    ]

    nombre = models.CharField(max_length=100)
    tipo = models.CharField(max_length=3, choices=TIPO_CHOICES, default='PCT')
    valor = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text='Porcentaje (ej. 15.00) o valor monetario fijo según el tipo'
    )
    activo = models.BooleanField(default=True)
    fecha_vencimiento = models.DateField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cupones'
        verbose_name = 'Cupón'
        verbose_name_plural = 'Cupones'

    def __str__(self):
        sufijo = '%' if self.tipo == 'PCT' else ''
        return f'{self.nombre} ({self.valor}{sufijo})'


class ClienteCupon(models.Model):
    """Relación entre un cliente y un cupón asignado."""
    cliente = models.ForeignKey(
        Cliente, on_delete=models.CASCADE, related_name='cupones_asignados'
    )
    cupon = models.ForeignKey(
        Cupon, on_delete=models.CASCADE, related_name='clientes_asignados'
    )
    activo = models.BooleanField(default=True)
    cantidad_disponible = models.PositiveIntegerField(default=1)
    fecha_uso = models.DateTimeField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cliente_cupones'
        verbose_name = 'Cupón de Cliente'
        verbose_name_plural = 'Cupones de Clientes'
        unique_together = ('cliente', 'cupon')

    def __str__(self):
        return f'{self.cliente} - {self.cupon.nombre} (x{self.cantidad_disponible})'


# =========================
# CONTACTOS E-COMMERCE
# =========================

class Contacto(models.Model):
    """
    Mensajes de contacto recibidos desde el formulario web.
    Multitenant: cada mensaje está asociado a una tienda específica.
    """
    nombre_completo = models.CharField(max_length=255)
    email = models.EmailField(max_length=254)
    mensaje = models.TextField()

    subdominio = models.CharField(max_length=100)
    tienda_id = models.IntegerField()

    leido = models.BooleanField(default=False)
    respondido = models.BooleanField(default=False)
    fecha_respuesta = models.DateTimeField(blank=True, null=True)

    ip_cliente = models.CharField(max_length=45, blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    origen_referer = models.CharField(max_length=500, blank=True, null=True)

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contactos'
        verbose_name = 'Contacto'
        verbose_name_plural = 'Contactos'
        ordering = ('-creado_en',)

    def __str__(self):
        return f'{self.nombre_completo} ({self.email}) - {self.creado_en.strftime("%Y-%m-%d %H:%M")}'

    def marcar_como_respondido(self):
        self.respondido = True
        self.leido = True
        self.fecha_respuesta = timezone.now()
        self.save(update_fields=['respondido', 'leido', 'fecha_respuesta'])


# =========================
# SIGNALS - Sincronización Automática de Stock
# =========================


@receiver(post_save, sender=Producto)
def crear_existencias_para_producto(sender, instance, created, **kwargs):
    """
    Cuando se crea un producto, crear automáticamente existencias
    con stock 0 en todas las bodegas activas.
    """
    if created and instance.pk:
        from django.db import connection
        # Usar la misma base de datos que el producto
        db_alias = connection.schema_name if hasattr(connection, 'schema_name') else 'default'

        try:
            bodegas = Bodega.objects.using(db_alias).filter(estatus=True)
            for bodega in bodegas:
                Existencia.objects.using(db_alias).get_or_create(
                    producto=instance,
                    bodega=bodega,
                    defaults={
                        'cantidad': 0,
                        'reservado': 0,
                        'minimo': 0
                    }
                )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error creando existencias para producto {instance.pk}: {e}')


@receiver(post_save, sender=Existencia)
def actualizar_cache_stock_post_save(sender, instance, **kwargs):
    """
    Cuando se guarda una existencia, actualizar el cache de stock del producto.
    """
    if instance.producto_id and instance.producto:
        from django.db import connection
        db_alias = connection.schema_name if hasattr(connection, 'schema_name') else 'default'

        try:
            # Recalcular stock total del producto (suma de todas las bodegas)
            total_stock = Existencia.objects.using(db_alias).filter(
                producto_id=instance.producto_id
            ).aggregate(
                total=Sum('cantidad')
            )['total'] or 0

            # Actualizar el cache
            Producto.objects.using(db_alias).filter(
                pk=instance.producto_id
            ).update(stock=total_stock)

        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error actualizando stock cache para producto {instance.producto_id}: {e}')


@receiver(post_delete, sender=Existencia)
def actualizar_cache_stock_post_delete(sender, instance, **kwargs):
    """
    Cuando se elimina una existencia, actualizar el cache de stock del producto.
    """
    if instance.producto_id and instance.producto:
        from django.db import connection
        db_alias = connection.schema_name if hasattr(connection, 'schema_name') else 'default'

        try:
            # Recalcular stock total del producto (suma de todas las bodegas)
            total_stock = Existencia.objects.using(db_alias).filter(
                producto_id=instance.producto_id
            ).aggregate(
                total=Sum('cantidad')
            )['total'] or 0

            # Actualizar el cache
            Producto.objects.using(db_alias).filter(
                pk=instance.producto_id
            ).update(stock=total_stock)

        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error actualizando stock cache para producto {instance.producto_id}: {e}')
