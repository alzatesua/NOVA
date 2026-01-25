from django.db import models
from django.db import models, transaction        # ← añade transaction aquí
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.conf import settings


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