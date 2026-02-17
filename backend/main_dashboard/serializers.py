from rest_framework import serializers
from .models import (
    Sucursales, Categoria, Marca, Iva, Producto, Descuento, TipoMedida,
    Bodega, Existencia, Traslado, TrasladoLinea,
    Cliente, FormaPago, Factura, FacturaDetalle, Pago, ConfiguracionFactura
)
from rest_framework.validators import UniqueValidator, UniqueTogetherValidator

from django.db import transaction, IntegrityError

import logging

logger = logging.getLogger(__name__)


class SucursalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sucursales
        fields = ['id', 'nombre', 'direccion', 'ciudad', 'pais', 'fecha_creacion', 'estatus']
        read_only_fields = ['id', 'fecha_creacion']




from rest_framework import serializers
from .models import Producto, Categoria, Marca, Iva

class ProductoSerializer(serializers.ModelSerializer):
    categoria = serializers.PrimaryKeyRelatedField(
        source='categoria_id',
        queryset=Categoria.objects.none(),
        allow_null=True,
        required=False
    )
    marca = serializers.PrimaryKeyRelatedField(
        source='marca_id',
        queryset=Marca.objects.none(),
        allow_null=True,
        required=False
    )
    iva = serializers.PrimaryKeyRelatedField(
        source='iva_id',
        queryset=Iva.objects.none(),
        allow_null=True,
        required=False
    )
    sucursal = serializers.PrimaryKeyRelatedField(
        queryset=Sucursales.objects.none(),
        allow_null=True,
        required=False
    )
    bodega = serializers.PrimaryKeyRelatedField(
        queryset=Bodega.objects.none(),
        allow_null=True,
        required=False
    )
    descuento = serializers.PrimaryKeyRelatedField(
        source='descuento_id',
        queryset=Descuento.objects.none(),
        allow_null=True,
        required=False
    )
    tipo_medida = serializers.PrimaryKeyRelatedField(
        source='tipo_medida_id',
        queryset=TipoMedida.objects.none(),
        allow_null=True,
        required=False
    )

    imagenUrl         = serializers.CharField(source='imagen_producto', read_only=True)
    categoria_nombre  = serializers.CharField(source='categoria_id.nombre',  read_only=True)
    marca_nombre      = serializers.CharField(source='marca_id.nombre',      read_only=True)
    iva_valor         = serializers.CharField(source='iva_id.porcentaje',    read_only=True)
    sucursal_nombre   = serializers.CharField(source='sucursal.nombre',      read_only=True)
    bodega_nombre        = serializers.CharField(source='bodega.nombre',        read_only=True)
    descuento_porcentaje = serializers.CharField(source='descuento_id.porcentaje', read_only=True)
    tipo_medida_nombre = serializers.CharField(source='tipo_medida_id.nombre', read_only=True)

    class Meta:
        model = Producto
        fields = [
            'id',
            'nombre',
            'descripcion',
            'precio',
            'stock',
            'sku',

            # Envío por POST
            'categoria',
            'marca',
            'iva',
            'sucursal',
            'bodega',
            'descuento',
            'tipo_medida',

            'codigo_barras',
            'imei',
            'imagen_producto',
            'imagenUrl',

            # Legibles
            'categoria_nombre',
            'marca_nombre',
            'iva_valor',
            'sucursal_nombre',
            'bodega_nombre', 
            'descuento_porcentaje',
            'tipo_medida_nombre',

            'atributo',
            'valor_atributo',
            'creado_en',
        ]
        read_only_fields = ['id', 'creado_en']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        alias = self.context.get('db_alias', 'default')
        self.fields['categoria'].queryset = Categoria.objects.using(alias).all()
        self.fields['marca'].queryset = Marca.objects.using(alias).all()
        self.fields['iva'].queryset = Iva.objects.using(alias).all()
        self.fields['sucursal'].queryset = Sucursales.objects.using(alias).all()
        self.fields['bodega'].queryset      = Bodega.objects.using(alias).all()
        self.fields['descuento'].queryset = Descuento.objects.using(alias).all()
        self.fields['tipo_medida'].queryset = TipoMedida.objects.using(alias).all()

    def create(self, validated_data):
        db = self.context.get('db_alias', 'default')

        descuento_obj = validated_data.pop('descuento_id', None)
        tipo_medida_obj = validated_data.pop('tipo_medida_id', None)

        producto = Producto.objects.using(db).create(**validated_data)

        if descuento_obj:
            producto.descuento = descuento_obj
        if tipo_medida_obj:
            producto.tipo_medida = tipo_medida_obj

        producto.save(using=db)
        return producto


class DescuentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Descuento
        fields = ['id_descuento', 'porcentaje', 'creado_en']
        read_only_fields = ['id_descuento', 'creado_en']

class TipoMedidaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoMedida
        fields = ['id_tipo_medida', 'nombre', 'creado_en']
        read_only_fields = ['id_tipo_medida', 'creado_en']

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id_categoria', 'nombre', 'descripcion', 'creado_en']
        read_only_fields = ['categoria', 'creado_en']


class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = ['id_marca', 'nombre', 'creado_en']
        read_only_fields = ['marca', 'creado_en']


class IvaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Iva
        fields = ['id_iva', 'porcentaje', 'creado_en']
        read_only_fields = ['iva', 'creado_en']












class DbAliasModelSerializer(serializers.ModelSerializer):
    def build_field(self, field_name, info, model_class, nested_depth):
        """
        Sobrescribir para convertir min_value de int a Decimal para campos DecimalField.
        Esto soluciona el warning: "fields min_value in DecimalField should be Decimal type"
        """
        from decimal import Decimal
        field = super().build_field(field_name, info, model_class, nested_depth)

        # Si el campo tiene min_value y es un DecimalField, convertir min_value a Decimal
        if hasattr(field, 'min_value') and field.min_value is not None:
            from rest_framework.fields import DecimalField
            if isinstance(field, DecimalField) and isinstance(field.min_value, int):
                field.min_value = Decimal(str(field.min_value))

        return field

    def _alias(self):
        return self.context.get('db_alias') or 'default'

    # ---- util: aplica alias a FKs/validadores, recursivo (incluye anidados) ----
    def _reattach_for_serializer(self, serializer, alias: str):
        for field in serializer.fields.values():
            # ListSerializer (many=True): bajar al child
            if isinstance(field, serializers.ListSerializer) and hasattr(field, 'child'):
                child = field.child
                if isinstance(child, serializers.ModelSerializer):
                    self._reattach_for_serializer(child, alias)
                # validadores de campo del ListSerializer no suelen tener queryset
                continue

            # ModelSerializer anidado
            if isinstance(field, serializers.ModelSerializer):
                self._reattach_for_serializer(field, alias)
                continue

            # Campos normales: si tienen queryset, re-enganchar al alias
            qs = getattr(field, 'queryset', None)
            if qs is not None:
                try:
                    field.queryset = qs.using(alias).all()
                except Exception:
                    pass

            # UniqueValidator por campo: ajustar su queryset
            if hasattr(field, 'validators'):
                for v in field.validators:
                    if isinstance(v, UniqueValidator) and getattr(v, 'queryset', None) is not None:
                        try:
                            v.queryset = v.queryset.using(alias).all()
                        except Exception:
                            pass

        # UniqueTogetherValidator a nivel de serializer
        if hasattr(serializer, 'validators'):
            new_validators = []
            for v in serializer.validators:
                if isinstance(v, UniqueTogetherValidator) and getattr(v, 'queryset', None) is not None:
                    try:
                        v.queryset = v.queryset.using(alias).all()
                    except Exception:
                        pass
                new_validators.append(v)
            serializer.validators = new_validators

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        alias = self._alias()
        self._reattach_for_serializer(self, alias)

    # ---- escritura con alias ----
    def create(self, validated_data):
        return self.Meta.model.objects.using(self._alias()).create(**validated_data)

    def update(self, instance, validated_data):
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save(using=self._alias())
        return instance





# serializers.py



# serializers.py
from django.db import transaction, IntegrityError
from rest_framework import serializers
from .models import Bodega, Sucursales

class BodegaSerializer(DbAliasModelSerializer):
    codigo    = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    direccion = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    notas     = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Bodega
        fields = '__all__'
        validators = []  # validamos unicidades a mano

    # --- helper para generar código único por sucursal ---
    def _gen_codigo(self, alias: str, sucursal_id: int, nombre: str) -> str:
        base = ''.join(c for c in (nombre or '').upper() if c.isalnum())[:4] or 'BOD'
        seq = 1
        code = f'{base}{seq:02d}'
        while Bodega.objects.using(alias).filter(sucursal_id=sucursal_id, codigo=code).exists():
            seq += 1
            code = f'{base}{seq:02d}'
        return code

    # --- validación de unicidad (alias-aware) ---
    def validate(self, attrs):
        alias    = self._alias()
        instance = getattr(self, 'instance', None)

        sucursal = attrs.get('sucursal', getattr(instance, 'sucursal', None))
        nombre   = attrs.get('nombre',   getattr(instance, 'nombre',   None))
        codigo   = attrs.get('codigo',   getattr(instance, 'codigo',   None))

        if sucursal and nombre:
            qs = Bodega.objects.using(alias).filter(sucursal=sucursal, nombre=nombre)
            if instance: qs = qs.exclude(pk=instance.pk)
            if qs.exists():
                raise serializers.ValidationError({'nombre': 'Ya existe una bodega con ese nombre en esta sucursal.'})

        if sucursal and codigo not in (None, ''):
            qs = Bodega.objects.using(alias).filter(sucursal=sucursal, codigo=codigo)
            if instance: qs = qs.exclude(pk=instance.pk)
            if qs.exists():
                raise serializers.ValidationError({'codigo': 'Ya existe una bodega con ese código en esta sucursal.'})

        return attrs

    def create(self, validated_data):
        alias    = self._alias()
        sucursal = validated_data.get('sucursal')
        nombre   = validated_data.get('nombre', '')

        # 1) si será predeterminada, desmarca la anterior en esa sucursal
        if validated_data.get('es_predeterminada') and sucursal:
            Bodega.objects.using(alias).filter(
                sucursal=sucursal, es_predeterminada=True
            ).update(es_predeterminada=False)

        # 2) AUTORRELLENOS (esto faltaba en tu código)
        if not validated_data.get('codigo'):
            validated_data['codigo'] = self._gen_codigo(alias, sucursal.id, nombre)

        if not validated_data.get('direccion'):
            suc = Sucursales.objects.using(alias).only('direccion').get(pk=sucursal.id)
            validated_data['direccion'] = suc.direccion or ''

        if not validated_data.get('responsable'):
            tenant_user = self.context.get('tenant_user')  # viene del ViewSet/Mixin
            if tenant_user:
                validated_data['responsable'] = tenant_user

        if 'notas' not in validated_data or validated_data.get('notas') is None:
            validated_data['notas'] = ''

        try:
            with transaction.atomic(using=alias):
                return super().create(validated_data)
        except IntegrityError as e:
            msg = str(e)
            if 'uniq_bodega_predeterminada_por_sucursal' in msg:
                raise serializers.ValidationError({'es_predeterminada': 'Ya existe una bodega predeterminada en esta sucursal.'})
            if 'uniq_bodega_nombre_por_sucursal' in msg:
                raise serializers.ValidationError({'nombre': 'Ya existe una bodega con ese nombre en esta sucursal.'})
            if 'uniq_bodega_codigo_por_sucursal' in msg:
                raise serializers.ValidationError({'codigo': 'Ya existe una bodega con ese código en esta sucursal.'})
            raise

    def update(self, instance, validated_data):
        alias    = self._alias()
        sucursal = validated_data.get('sucursal', getattr(instance, 'sucursal', None))
        nombre   = validated_data.get('nombre',   getattr(instance, 'nombre',   ''))

        if validated_data.get('es_predeterminada') is True and sucursal:
            Bodega.objects.using(alias).filter(
                sucursal=sucursal, es_predeterminada=True
            ).exclude(pk=instance.pk).update(es_predeterminada=False)

        # autorrellenos también en update cuando vengan vacíos
        if 'codigo' in validated_data and not validated_data['codigo']:
            validated_data['codigo'] = self._gen_codigo(alias, sucursal.id, nombre)
        if 'direccion' in validated_data and not validated_data['direccion']:
            suc = Sucursales.objects.using(alias).only('direccion').get(pk=sucursal.id)
            validated_data['direccion'] = suc.direccion or ''
        if 'responsable' not in validated_data or not validated_data.get('responsable'):
            tenant_user = self.context.get('tenant_user')
            if tenant_user:
                validated_data['responsable'] = tenant_user
        if 'notas' in validated_data and validated_data['notas'] is None:
            validated_data['notas'] = ''

        try:
            with transaction.atomic(using=alias):
                return super().update(instance, validated_data)
        except IntegrityError as e:
            msg = str(e)
            if 'uniq_bodega_predeterminada_por_sucursal' in msg:
                raise serializers.ValidationError({'es_predeterminada': 'Ya hay una bodega predeterminada en esta sucursal.'})
            if 'uniq_bodega_nombre_por_sucursal' in msg:
                raise serializers.ValidationError({'nombre': 'Ya existe una bodega con ese nombre en esta sucursal.'})
            if 'uniq_bodega_codigo_por_sucursal' in msg:
                raise serializers.ValidationError({'codigo': 'Ya existe una bodega con ese código en esta sucursal.'})
            raise


class ExistenciaSerializer(DbAliasModelSerializer):
    disponible = serializers.IntegerField(read_only=True)
    producto_sku = serializers.CharField(source='producto.sku', read_only=True)
    bodega_nombre = serializers.CharField(source='bodega.nombre', read_only=True)

    class Meta:
        model = Existencia
        fields = [
            'id', 'producto', 'producto_sku', 'bodega', 'bodega_nombre',
            'cantidad', 'reservado', 'minimo', 'maximo',
            'disponible', 'creado_en', 'actualizado_en'
        ]




class ProductoConExistenciasSerializer(DbAliasModelSerializer):
    stock_total = serializers.IntegerField(read_only=True)
    existencias = ExistenciaSerializer(many=True, read_only=True)

    class Meta:
        model = Producto
        fields = [
            'id',
            'nombre',
            'sku',
            'precio',
            'activo',
            'stock_total',
            'existencias'
        ]





class TrasladoLineaSerializer(DbAliasModelSerializer):
    pendiente_por_recibir = serializers.IntegerField(read_only=True)
    producto_nombre = serializers.CharField(
        source='producto.nombre',
        read_only=True
    )

    class Meta:
        model = TrasladoLinea
        fields = [
            'id',
            'producto',
            'producto_nombre',
            'cantidad',
            'cantidad_recibida',
            'pendiente_por_recibir',
        ]


class TrasladoSerializer(DbAliasModelSerializer):
    lineas = TrasladoLineaSerializer(many=True)

    class Meta:
        model = Traslado
        fields = [
            'id', 'bodega_origen', 'bodega_destino', 'estado',
            'usar_bodega_transito', 'observaciones', 'creado_por',
            'enviado_en', 'recibido_en', 'creado_en', 'actualizado_en',
            'lineas'
        ]
        read_only_fields = ['estado', 'enviado_en', 'recibido_en', 'creado_en', 'actualizado_en']

    def create(self, validated_data):
        alias = self.context.get('db_alias') or 'default'
        lineas = validated_data.pop('lineas', [])
        t = Traslado.objects.using(alias).create(**validated_data)
        for ln in lineas:
            TrasladoLinea.objects.using(alias).create(traslado=t, **ln)
        return t

    def update(self, instance, validated_data):
        alias = self.context.get('db_alias') or 'default'
        if instance.estado != 'BOR':
            raise serializers.ValidationError('Solo puedes editar un traslado en estado BOR.')
        lineas = validated_data.pop('lineas', None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save(using=alias)
        if lineas is not None:
            instance.lineas.using(alias).all().delete()
            for ln in lineas:
                TrasladoLinea.objects.using(alias).create(traslado=instance, **ln)
        return instance


# =========================
# FACTURACIÓN SERIALIZERS
# =========================

class ClienteSerializer(DbAliasModelSerializer):
    """Serializer para Cliente con nombre completo calculado"""
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = [
            'id', 'tipo_persona', 'primer_nombre', 'segundo_nombre', 'apellidos',
            'razon_social', 'n_registro_mercantil', 'tipo_documento',
            'numero_documento', 'correo', 'telefono', 'direccion', 'ciudad',
            'limite_credito', 'dias_credito', 'estatus', 'creado_en', 'actualizado_en',
            'nombre_completo'
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']

    def get_nombre_completo(self, obj):
        return obj.nombre_completo


class FormaPagoSerializer(DbAliasModelSerializer):
    """Serializer para Forma de Pago (solo lectura para POS)"""
    class Meta:
        model = FormaPago
        fields = ['id', 'codigo', 'nombre', 'activo', 'requiere_referencia', 'permite_cambio']


class FacturaDetalleSerializer(DbAliasModelSerializer):
    """Serializer para detalles de factura"""
    producto_nombre = serializers.CharField(read_only=True)
    producto_sku = serializers.CharField(read_only=True)

    class Meta:
        model = FacturaDetalle
        fields = [
            'id', 'factura', 'producto', 'producto_nombre', 'producto_sku',
            'producto_imei', 'cantidad', 'precio_unitario',
            'descuento_porcentaje', 'descuento_valor',
            'iva_porcentaje', 'iva_valor', 'subtotal', 'total',
            'cantidad_devuelta', 'creado_en'
        ]
        read_only_fields = ['id', 'creado_en']


class PagoSerializer(DbAliasModelSerializer):
    """Serializer para pagos de factura"""
    forma_pago_nombre = serializers.CharField(source='forma_pago.nombre', read_only=True)

    class Meta:
        model = Pago
        fields = ['id', 'factura', 'forma_pago', 'forma_pago_nombre', 'monto', 'referencia', 'autorizacion', 'creado_en']
        read_only_fields = ['id', 'creado_en']


class FacturaSerializer(DbAliasModelSerializer):
    """Serializer para leer facturas (con detalles y pagos anidados)"""
    cliente_nombre = serializers.SerializerMethodField()
    vendedor_nombre = serializers.CharField(source='vendedor.username', read_only=True, allow_null=True)
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True)
    bodega_nombre = serializers.CharField(source='bodega.nombre', read_only=True)
    detalles = FacturaDetalleSerializer(many=True, read_only=True)
    pagos = PagoSerializer(many=True, read_only=True)

    class Meta:
        model = Factura
        fields = [
            'id', 'numero_factura', 'estado', 'cliente', 'cliente_nombre',
            'vendedor', 'vendedor_nombre', 'sucursal', 'sucursal_nombre',
            'bodega', 'bodega_nombre', 'fecha_venta', 'fecha_anulacion',
            'subtotal', 'total_descuento', 'total_iva', 'total',
            'total_pagado', 'cambio', 'observaciones',
            'motivo_anulacion', 'anulada_por',
            'detalles', 'pagos'
        ]
        read_only_fields = [
            'id', 'numero_factura', 'fecha_venta', 'fecha_anulacion'
        ]

    def get_cliente_nombre(self, obj):
        if obj.cliente:
            return obj.cliente.nombre_completo
        return 'Consumidor Final'


class FacturaDetalleInlineSerializer(DbAliasModelSerializer):
    """Serializer para crear detalles desde FacturaCreateSerializer"""
    # Hacer los campos derivados opcionales
    producto_nombre = serializers.CharField(required=False, allow_blank=True)
    producto_sku = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = FacturaDetalle
        fields = [
            'producto', 'producto_nombre', 'producto_sku',
            'producto_imei', 'cantidad', 'precio_unitario',
            'descuento_porcentaje', 'descuento_valor',
            'iva_porcentaje', 'iva_valor', 'subtotal', 'total'
        ]
        extra_kwargs = {
            'producto': {'required': True},
            'cantidad': {'required': True, 'min_value': 1},
            'precio_unitario': {'required': True, 'min_value': 0},
            'iva_porcentaje': {'required': True, 'min_value': 0},
            'iva_valor': {'required': True, 'min_value': 0},
            'subtotal': {'required': True, 'min_value': 0},
            'total': {'required': True, 'min_value': 0},
            'descuento_porcentaje': {'default': 0, 'min_value': 0},
            'descuento_valor': {'default': 0, 'min_value': 0},
        }

    def validate(self, attrs):
        """Obtener producto_nombre y producto_sku del objeto Producto si no se proporcionan"""
        producto = attrs.get('producto')
        if producto:
            # Si producto es un ID (número), obtener la instancia
            from .models import Producto
            alias = self.context.get('db_alias', 'default')

            # Si es un ID, obtener la instancia del modelo
            if isinstance(producto, int):
                producto = Producto.objects.using(alias).get(pk=producto)
                attrs['producto'] = producto

            if not attrs.get('producto_nombre'):
                attrs['producto_nombre'] = producto.nombre
            if not attrs.get('producto_sku'):
                attrs['producto_sku'] = producto.sku

        # Asegurar que los valores numéricos sean decimales
        from decimal import Decimal, InvalidOperation
        for campo in ['precio_unitario', 'descuento_porcentaje', 'descuento_valor',
                      'iva_porcentaje', 'iva_valor', 'subtotal', 'total']:
            if campo in attrs and attrs[campo] is not None:
                try:
                    if not isinstance(attrs[campo], Decimal):
                        attrs[campo] = Decimal(str(attrs[campo]))
                except (ValueError, TypeError, InvalidOperation):
                    raise serializers.ValidationError({
                        campo: f'El valor {attrs[campo]} no es un número válido'
                    })

        return attrs


class PagoInlineSerializer(DbAliasModelSerializer):
    """Serializer para crear pagos desde FacturaCreateSerializer"""
    class Meta:
        model = Pago
        fields = ['forma_pago', 'monto', 'referencia', 'autorizacion']
        extra_kwargs = {
            'forma_pago': {'required': True},
            'monto': {'required': True, 'min_value': 0},
            'referencia': {'required': False, 'allow_null': True, 'allow_blank': True},
            'autorizacion': {'required': False, 'allow_null': True, 'allow_blank': True},
        }

    def validate(self, attrs):
        """Validar y convertir forma_pago si es un ID"""
        from .models import FormaPago
        alias = self.context.get('db_alias', 'default')

        forma_pago = attrs.get('forma_pago')
        if forma_pago and isinstance(forma_pago, int):
            attrs['forma_pago'] = FormaPago.objects.using(alias).get(pk=forma_pago)

        # Asegurar que monto sea Decimal
        from decimal import Decimal, InvalidOperation
        if 'monto' in attrs and attrs['monto'] is not None:
            if not isinstance(attrs['monto'], Decimal):
                try:
                    attrs['monto'] = Decimal(str(attrs['monto']))
                except (ValueError, TypeError, InvalidOperation):
                    raise serializers.ValidationError({
                        'monto': f'El valor {attrs["monto"]} no es un número válido'
                    })

        return attrs


class FacturaCreateSerializer(DbAliasModelSerializer):
    """
    Serializer para crear factura con líneas y pagos en una sola transacción atómica.
    Maneja:
    1. Generación de número de factura
    2. Validación y reserva de stock
    3. Creación de detalles y pagos
    4. Confirmación de reserva (mover de reservado a cantidad real)
    """
    detalles = FacturaDetalleInlineSerializer(many=True)
    pagos = PagoInlineSerializer(many=True)

    class Meta:
        model = Factura
        fields = [
            'cliente', 'vendedor', 'sucursal', 'bodega',
            'subtotal', 'total_descuento', 'total_iva', 'total',
            'total_pagado', 'cambio', 'observaciones',
            'detalles', 'pagos'
        ]
        extra_kwargs = {
            'cliente': {'required': False, 'allow_null': True},
            'vendedor': {'required': False, 'allow_null': True},
            'sucursal': {'required': True},
            'bodega': {'required': True},
        }

    def to_internal_value(self, data):
        """
        Convierte floats a Decimal con 2 decimales ANTES de la validación de campos.
        Esto evita errores de max_digits por problemas de precisión de float.
        """
        from decimal import Decimal, ROUND_HALF_UP
        import logging
        logger = logging.getLogger(__name__)

        # Convertir datos primitivos a dict para modificarlos
        data = dict(data)

        # Convertir floats a Decimal con 2 decimales en campos monetarios
        campos_monetarios = ['subtotal', 'total_descuento', 'total_iva', 'total', 'total_pagado', 'cambio']
        for campo in campos_monetarios:
            if campo in data and isinstance(data[campo], float):
                original = data[campo]
                data[campo] = Decimal(str(round(data[campo], 2))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                logger.info(f"Convertido {campo}: {original} -> {data[campo]}")

        # Convertir floats a Decimal en los detalles
        if 'detalles' in data:
            for detalle in data['detalles']:
                for campo in ['precio_unitario', 'iva_valor', 'descuento_valor', 'subtotal', 'total']:
                    if campo in detalle and isinstance(detalle[campo], float):
                        original = detalle[campo]
                        detalle[campo] = Decimal(str(round(detalle[campo], 2))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                        logger.info(f"Convertido detalle.{campo}: {original} -> {detalle[campo]}")

        # Convertir floats a Decimal en los pagos
        if 'pagos' in data:
            for pago in data['pagos']:
                if 'monto' in pago and isinstance(pago['monto'], float):
                    original = pago['monto']
                    pago['monto'] = Decimal(str(round(pago['monto'], 2))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                    logger.info(f"Convertido pago.monto: {original} -> {pago['monto']}")

        # Llamar al método padre con los datos convertidos
        return super().to_internal_value(data)

    def validate(self, attrs):
        """Validar y convertir IDs a instancias de modelos si es necesario"""
        from .models import Sucursales, Bodega, Cliente
        from django.contrib.auth import get_user_model
        from decimal import Decimal, ROUND_HALF_UP
        alias = self.context.get('db_alias', 'default')

        # Convertir floats a Decimal con 2 decimales para evitar errores de precisión
        campos_monetarios = ['subtotal', 'total_descuento', 'total_iva', 'total', 'total_pagado', 'cambio']
        for campo in campos_monetarios:
            if campo in attrs and isinstance(attrs[campo], float):
                attrs[campo] = Decimal(str(round(attrs[campo], 2))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        # Convertir floats a Decimal en los detalles
        if 'detalles' in attrs:
            for detalle in attrs['detalles']:
                for campo in ['precio_unitario', 'iva_valor', 'descuento_valor', 'subtotal', 'total']:
                    if campo in detalle and isinstance(detalle[campo], float):
                        detalle[campo] = Decimal(str(round(detalle[campo], 2))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        # Convertir floats a Decimal en los pagos
        if 'pagos' in attrs:
            for pago in attrs['pagos']:
                if 'monto' in pago and isinstance(pago['monto'], float):
                    pago['monto'] = Decimal(str(round(pago['monto'], 2))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        # Log para debug de conversión de float a Decimal
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Valores después de conversión - total_iva: {attrs.get('total_iva')} (tipo: {type(attrs.get('total_iva')).__name__ if attrs.get('total_iva') is not None else 'None'})")
        if 'detalles' in attrs and attrs['detalles']:
            logger.info(f"detalle[0].iva_valor: {attrs['detalles'][0].get('iva_valor')} (tipo: {type(attrs['detalles'][0].get('iva_valor')).__name__ if attrs['detalles'][0].get('iva_valor') is not None else 'None'})")

        # Validar y convertir bodega
        bodega = attrs.get('bodega')
        if bodega and isinstance(bodega, int):
            attrs['bodega'] = Bodega.objects.using(alias).get(pk=bodega)

        # Validar y convertir sucursal
        sucursal = attrs.get('sucursal')
        if sucursal and isinstance(sucursal, int):
            attrs['sucursal'] = Sucursales.objects.using(alias).get(pk=sucursal)

        # Validar y convertir cliente (opcional)
        cliente = attrs.get('cliente')
        if cliente and isinstance(cliente, int):
            try:
                attrs['cliente'] = Cliente.objects.using(alias).get(pk=cliente)
            except Cliente.DoesNotExist:
                attrs['cliente'] = None

        # Validar y convertir vendedor (opcional)
        vendedor = attrs.get('vendedor')
        if vendedor and isinstance(vendedor, int):
            User = get_user_model()
            try:
                attrs['vendedor'] = User.objects.using(alias).get(pk=vendedor)
            except User.DoesNotExist:
                attrs['vendedor'] = None

        # Validar totales
        from decimal import Decimal
        subtotal = attrs.get('subtotal', Decimal('0'))
        total_iva = attrs.get('total_iva', Decimal('0'))
        total = attrs.get('total', Decimal('0'))

        # Verificar que total = subtotal + total_iva
        esperado = subtotal + total_iva
        if abs(total - esperado) > Decimal('0.01'):
            raise serializers.ValidationError(
                f'El total ({total}) no coincide con la suma de subtotal ({subtotal}) + IVA ({total_iva}). '
                f'Valor esperado: {esperado}'
            )

        return attrs

    def create(self, validated_data):
        from django.utils import timezone
        from .models import ConfiguracionFactura

        alias = self.context.get('db_alias', 'default')
        detalles_data = validated_data.pop('detalles', [])
        pagos_data = validated_data.pop('pagos', [])

        logger.info(f"FacturaCreateSerializer.create() - alias: {alias}")
        logger.info(f"validated_data: {validated_data}")
        logger.info(f"detalles_count: {len(detalles_data)}, pagos_count: {len(pagos_data)}")

        try:
            with transaction.atomic(using=alias):
                # 1. Generar número de factura
                sucursal = validated_data.get('sucursal')
                config = ConfiguracionFactura.objects.using(alias).filter(
                    sucursal=sucursal
                ).first()

                if config:
                    numero = f"{config.prefijo_factura}-{config.consecutivo_actual:0{config.longitud_consecutivo}d}"
                    config.consecutivo_actual += 1
                    config.save(using=alias)
                else:
                    # Fallback si no hay config: usar timestamp
                    numero = f"FACT-{timezone.now().strftime('%Y%m%d%H%M%S')}"

                validated_data['numero_factura'] = numero
                validated_data['estado'] = 'PAG'

                logger.info(f"Número de factura generado: {numero}")

                # 2. Crear factura - campos explícitos
                factura_data = {
                    'numero_factura': validated_data['numero_factura'],
                    'estado': validated_data['estado'],
                    'cliente': validated_data.get('cliente'),
                    'vendedor': validated_data.get('vendedor'),
                    'sucursal': validated_data['sucursal'],
                    'bodega': validated_data['bodega'],
                    'subtotal': validated_data.get('subtotal', 0),
                    'total_descuento': validated_data.get('total_descuento', 0),
                    'total_iva': validated_data.get('total_iva', 0),
                    'total': validated_data['total'],
                    'total_pagado': validated_data.get('total_pagado', 0),
                    'cambio': validated_data.get('cambio', 0),
                    'observaciones': validated_data.get('observaciones'),
                }
                logger.info(f"Datos de factura a crear: {factura_data}")

                factura = Factura.objects.using(alias).create(**factura_data)
                logger.info(f"Factura creada con ID: {factura.id}, PK: {factura.pk}")

                # 3. Crear detalles y reservar stock
                for idx, detalle_data in enumerate(detalles_data):
                    producto = detalle_data['producto']

                    logger.info(f"Procesando detalle {idx + 1}: producto={producto.id}, cantidad={detalle_data['cantidad']}")

                    # Validar y reservar stock
                    existencia = Existencia.objects.using(alias).filter(
                        producto=producto,
                        bodega=validated_data['bodega']
                    ).select_for_update().first()

                    if not existencia:
                        raise serializers.ValidationError(
                            f'El producto {producto.nombre} no tiene existencia en esta bodega'
                        )

                    if existencia.disponible < detalle_data['cantidad']:
                        raise serializers.ValidationError(
                            f'Stock insuficiente para {producto.nombre}. '
                            f'Disponible: {existencia.disponible}, Solicitado: {detalle_data["cantidad"]}'
                        )

                    # Reservar stock
                    existencia.reservado += detalle_data['cantidad']
                    existencia.save(using=alias)

                    # Crear detalle - solo campos del modelo
                    detalle_data_to_create = {
                        'factura': factura,
                        'producto': detalle_data['producto'],
                        'producto_nombre': detalle_data.get('producto_nombre', ''),
                        'producto_sku': detalle_data.get('producto_sku', ''),
                        'producto_imei': detalle_data.get('producto_imei', ''),
                        'cantidad': detalle_data['cantidad'],
                        'precio_unitario': detalle_data['precio_unitario'],
                        'descuento_porcentaje': detalle_data.get('descuento_porcentaje', 0),
                        'descuento_valor': detalle_data.get('descuento_valor', 0),
                        'iva_porcentaje': detalle_data['iva_porcentaje'],
                        'iva_valor': detalle_data['iva_valor'],
                        'subtotal': detalle_data['subtotal'],
                        'total': detalle_data['total'],
                    }
                    logger.info(f"Guardando detalle: {detalle_data_to_create}")
                    FacturaDetalle.objects.using(alias).create(**detalle_data_to_create)
                    logger.info(f"Detalle {idx + 1} creado")

                # 4. Crear pagos
                for idx, pago_data in enumerate(pagos_data):
                    pago_data_to_create = {
                        'factura': factura,
                        'forma_pago': pago_data['forma_pago'],
                        'monto': pago_data['monto'],
                        'referencia': pago_data.get('referencia'),
                        'autorizacion': pago_data.get('autorizacion'),
                    }
                    logger.info(f"Guardando pago {idx + 1}: {pago_data_to_create}")
                    Pago.objects.using(alias).create(**pago_data_to_create)
                    logger.info(f"Pago {idx + 1} creado")

                # 5. Confirmar reserva (mover de reservado a cantidad real)
                for detalle in factura.detalles.all().using(alias):
                    existencia = Existencia.objects.using(alias).get(
                        producto=detalle.producto,
                        bodega=factura.bodega
                    )
                    existencia.cantidad -= detalle.cantidad
                    existencia.reservado -= detalle.cantidad
                    existencia.save(using=alias)

                    # Actualizar cache de stock del producto
                    self._actualizar_cache_stock_producto(alias, detalle.producto_id)

                logger.info(f"Factura {factura.id} creada exitosamente")

        except Exception as e:
            logger.error(f"Error creando factura: {str(e)}", exc_info=True)
            raise

        return factura

    def _actualizar_cache_stock_producto(self, alias, producto_id):
        """Mantiene Producto.stock como cache"""
        from django.db.models import Sum
        total = (Existencia.objects.using(alias).filter(producto_id=producto_id)
                 .aggregate(total=Sum('cantidad') - Sum('reservado'))['total'] or 0)
        Producto.objects.using(alias).filter(pk=producto_id).update(stock=total)


class ConfiguracionFacturaSerializer(DbAliasModelSerializer):
    """Serializer para configuración de facturación por sucursal"""
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True)

    class Meta:
        model = ConfiguracionFactura
        fields = [
            'id', 'sucursal', 'sucursal_nombre', 'prefijo_factura',
            'consecutivo_actual', 'longitud_consecutivo', 'formato_impresion',
            'nombre_empresa', 'nit_empresa', 'direccion_empresa',
            'telefono_empresa', 'ciudad_empresa', 'pie_de_pagina'
        ]






