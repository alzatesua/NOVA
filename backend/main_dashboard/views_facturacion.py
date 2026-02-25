# main_dashboard/views_facturacion.py
"""
Vistas para el módulo de facturación POS
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from django.db.models import Q, Sum, F
from django.utils import timezone
from django.db import transaction

from .models import (
    Cliente, FormaPago, Factura, FacturaDetalle, Pago,
    ConfiguracionFactura
)
from .serializers import (
    ClienteSerializer, FormaPagoSerializer,
    FacturaSerializer, FacturaCreateSerializer,
    ConfiguracionFacturaSerializer
)
from .models import Producto, Bodega, Existencia
from .serializers import ProductoConExistenciasSerializer
from .views import TenantMixin
from nova.models import Dominios
from nova.utils.db import conectar_db_tienda
import jwt
from django.conf import settings
from jwt import ExpiredSignatureError, InvalidTokenError
import logging

logger = logging.getLogger(__name__)

# ============================================================
#                    TenantMixin Facturacion
# ============================================================
class FacturacionTenantMixin:
    """
    Mixin para resolver el alias de BD en cada request para facturación.
    Reutiliza la lógica de TenantMixin pero adaptada para views de facturación.
    """
    permission_classes = [AllowAny]
    db_alias = None
    _tenant_user = None
    _tenant_tienda = None

    def _resolve_alias(self, request, require_auth=True):
        """
        Resuelve el alias de BD del tenant.

        Args:
            request: El request HTTP
            require_auth: Si True, requiere usuario y token. Si False, solo resuelve el tenant por subdominio.
        """
        if self.db_alias:
            return self.db_alias

        # Obtener credenciales desde body o query params
        usuario = request.data.get('usuario') or request.query_params.get('usuario')
        token = request.data.get('token') or request.query_params.get('token')
        subdom = request.data.get('subdominio') or request.query_params.get('subdominio')

        # Si no hay subdominio, usar el host
        if not subdom:
            host = request.get_host().split(':')[0]
            subdom = host.split('.')[0].lower()

        # Buscar tenant por Dominios y conectar
        dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).select_related('tienda').first()
        if not dominio_obj:
            raise ValueError('Dominio no válido.')

        tienda = dominio_obj.tienda
        alias = str(tienda.id)
        conectar_db_tienda(alias, tienda)

        # Si se requiere autenticación, validar usuario y token
        if require_auth:
            if not usuario or not token:
                raise ValueError('usuario y token son requeridos (en body o querystring).')

            # Validar usuario en tenant DB
            from django.apps import apps
            LoginUsuario = apps.get_model('nova', 'LoginUsuario')
            user = LoginUsuario.objects.using(alias).filter(usuario=usuario).first()
            if not user:
                raise ValueError('Usuario no encontrado.')

            # Validar/refresh token
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            except ExpiredSignatureError:
                from nova.utils.db import generar_token_jwt
                nuevo = generar_token_jwt(usuario)
                user.token = nuevo
                user.save(using=alias)
                token = nuevo
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            except InvalidTokenError:
                raise ValueError('Token inválido.')

            if payload.get("usuario") != usuario or user.token != token:
                raise ValueError('Token no coincide.')

            self._tenant_user = user

        self.db_alias = alias
        self._tenant_tienda = tienda
        return self.db_alias

    def get_serializer_context(self):
        ctx = super().get_serializer_context() if hasattr(super(), 'get_serializer_context') else {}
        if hasattr(self, 'request') and self.request:
            ctx['request'] = self.request
            try:
                ctx['db_alias'] = self._resolve_alias(self.request)
            except:
                pass
        return ctx


# ============================================================
#                    ClienteViewSet
# ============================================================
class ClienteViewSet(FacturacionTenantMixin, viewsets.ModelViewSet):
    serializer_class = ClienteSerializer

    def get_queryset(self):
        alias = self._resolve_alias(self.request)
        return Cliente.objects.using(alias).all().order_by('primer_nombre', 'apellidos', 'razon_social')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        try:
            # Resolver alias sin requerir autenticación completa
            # El token se validará por separado si es necesario
            ctx['db_alias'] = self._resolve_alias(self.request, require_auth=False)
        except Exception:
            # Si falla, usar default
            ctx['db_alias'] = 'default'
        return ctx

    def get_object(self):
        """Obtiene el cliente usando el alias de base de datos correcto"""
        obj = super().get_object()
        # No necesitamos hacer nada especial aquí porque el queryset
        # ya usa el alias correcto desde get_queryset()
        return obj

    def create(self, request, *args, **kwargs):
        """Crear un nuevo cliente"""
        try:
            # Para crear clientes, solo necesitamos el subdominio, no validamos el token
            alias = self._resolve_alias(request, require_auth=False)

            logger.info(f"ClienteViewSet.create - alias: {alias}")
            logger.info(f"ClienteViewSet.create - request.data keys: {request.data.keys()}")

            # Eliminar campos de autenticación del request.data antes de pasar al serializer
            data = request.data.copy()
            for key in ['usuario', 'token', 'subdominio']:
                data.pop(key, None)

            logger.info(f"ClienteViewSet.create - data despues de pop: {data.keys()}")

            # Pasar el db_alias en el contexto del serializer
            serializer = self.get_serializer(data=data)
            serializer.context['db_alias'] = alias
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except ValueError as e:
            # Error de validación de token/credenciales
            logger.error(f"Error creando cliente (ValueError): {str(e)}")
            return Response(
                {'detail': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            logger.error(f"Error creando cliente: {str(e)}", exc_info=True)
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def perform_create(self, serializer):
        """Guarda el cliente usando el alias correcto"""
        serializer.save()

    def update(self, request, *args, **kwargs):
        """Actualiza un cliente existente"""
        try:
            alias = self._resolve_alias(request)
            partial = kwargs.pop('partial', False)
            instance = self.get_object()

            # Asegurar que la instancia viene del queryset con el alias correcto
            # Volver a obtener la instancia explícitamente con el alias
            from .models import Cliente
            instance = Cliente.objects.using(alias).get(pk=instance.pk)

            # Eliminar campos de autenticación del request.data
            data = request.data.copy()
            for key in ['usuario', 'token', 'subdominio', 'exclude_id']:
                data.pop(key, None)

            # Crear serializer con el contexto correcto desde el inicio
            serializer = self.get_serializer(instance, data=data, partial=partial)
            # Pasar el db_alias en el contexto ANTES de validar
            serializer.context['db_alias'] = alias
            serializer.is_valid(raise_exception=True)
            serializer.save()

            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def partial_update(self, request, *args, **kwargs):
        """Actualización parcial de un cliente"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def buscar(self, request):
        """Busca clientes por nombre, cédula o RUC"""
        try:
            alias = self._resolve_alias(request)
            query = request.data.get('query', '').strip()

            if not query:
                return Response(
                    {'detail': 'Debe proporcionar un término de búsqueda'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Buscar por nombre o número de documento
            clientes = Cliente.objects.using(alias).filter(
                Q(primer_nombre__icontains=query) |
                Q(segundo_nombre__icontains=query) |
                Q(apellidos__icontains=query) |
                Q(razon_social__icontains=query) |
                Q(numero_documento__icontains=query)
            )[:10]

            serializer = self.get_serializer(clientes, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )


# ============================================================
#                    FormaPagoViewSet
# ============================================================
class FormaPagoViewSet(FacturacionTenantMixin, viewsets.ReadOnlyModelViewSet):
    """Solo lectura - las formas de pago se gestionan por configuración"""
    serializer_class = FormaPagoSerializer

    def get_queryset(self):
        alias = self._resolve_alias(self.request)
        return FormaPago.objects.using(alias).filter(activo=True)

    def list(self, request, *args, **kwargs):
        """Sobrescribimos list para aceptar POST también"""
        try:
            alias = self._resolve_alias(request)
            queryset = FormaPago.objects.using(alias).filter(activo=True)
            serializer = self.get_serializer(queryset, many=True)
            return Response({'formas_pago': serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )


# ============================================================
#                    FacturaViewSet
# ============================================================
class FacturaViewSet(FacturacionTenantMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Facturas POS
    """
    def get_queryset(self):
        alias = self._resolve_alias(self.request)
        return (
            Factura.objects.using(alias)
            .select_related('cliente', 'vendedor', 'sucursal', 'bodega', 'anulada_por')
            .prefetch_related('detalles', 'pagos')
            .order_by('-fecha_venta')
        )

    def get_serializer_class(self):
        if self.action == 'create':
            return FacturaCreateSerializer
        return FacturaSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['db_alias'] = self._resolve_alias(self.request)
        return ctx

    def create(self, request, *args, **kwargs):
        """Crear una nueva factura POS"""
        try:
            alias = self._resolve_alias(request)
            logger.info(f"FacturaViewSet.create() - alias: {alias}")
            logger.info(f"request.data keys: {request.data.keys()}")

            # Log valores específicos para debug
            logger.info(f"total_iva valor: {request.data.get('total_iva')} (tipo: {type(request.data.get('total_iva')).__name__})")
            detalles = request.data.get('detalles', [])
            for i, det in enumerate(detalles):
                logger.info(f"detalle[{i}].iva_valor: {det.get('iva_valor')} (tipo: {type(det.get('iva_valor')).__name__})")

            serializer = self.get_serializer(data=request.data)
            logger.info(f"Serializer creado: {serializer.__class__.__name__}")

            serializer.is_valid(raise_exception=True)
            logger.info(f"Serializer validado correctamente")

            factura = serializer.save()
            logger.info(f"Factura guardada con ID: {factura.id}")

            # Retornar la factura completa con detalles y pagos
            response_serializer = FacturaSerializer(factura)
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.error(f"Error creando factura: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Datos inválidos', 'detalle': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'], url_path='productos-pos')
    def productos_pos(self, request):
        """
        Retorna productos disponibles para venta POS con sus existencias
        en una bodega específica.

        Body esperado:
        {
            "usuario": "...",
            "token": "...",
            "subdominio": "...",
            "bodega_id": 1,
            "query": "",           # opcional: búsqueda por nombre/sku
            "incluir_sin_stock": false  # opcional: incluir productos sin stock
        }
        """
        try:
            alias = self._resolve_alias(request)

            bodega_id = request.data.get('bodega_id')
            if not bodega_id:
                return Response(
                    {'detail': 'bodega_id es requerido'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            query = request.data.get('query', '').strip()
            incluir_sin_stock = request.data.get('incluir_sin_stock', False)

            # Obtener productos con existencias en la bodega
            productos_qs = (
                Producto.objects.using(alias)
                .filter(existencias__bodega_id=bodega_id)
                .select_related(
                    'categoria_id', 'marca_id', 'iva_id', 'descuento', 'tipo_medida'
                )
                .prefetch_related(
                    'existencias'
                )
                .distinct()
            )

            # Filtro de búsqueda
            if query:
                productos_qs = productos_qs.filter(
                    Q(nombre__icontains=query) |
                    Q(sku__icontains=query) |
                    Q(codigo_barras__icontains=query)
                )

            # Filtrar por stock disponible
            if not incluir_sin_stock:
                productos_qs = productos_qs.filter(
                    existencias__bodega_id=bodega_id,
                    existencias__cantidad__gt=0
                )

            productos = productos_qs[:50]  # Limitar a 50 resultados

            # Construir respuesta con existencias
            data = []
            for p in productos:
                existencia = p.existencias.filter(bodega_id=bodega_id).first()
                if existencia:
                    # Obtener IVA con valor por defecto
                    if p.iva_id:
                        iva_porc = str(p.iva_id.porcentaje)
                    else:
                        # Log para productos sin IVA (solo warning)
                        logger.warning(f"Producto {p.id} ({p.nombre}) no tiene IVA asociado, usando 0%")
                        iva_porc = '0'

                    data.append({
                        'id': p.id,
                        'sku': p.sku,
                        'nombre': p.nombre,
                        'precio': str(p.precio),
                        'stock': p.stock,
                        'disponible': existencia.disponible,
                        'iva_porcentaje': iva_porc,
                        'categoria': p.categoria_id.nombre if p.categoria_id else None,
                        'marca': p.marca_id.nombre if p.marca_id else None,
                        'imagen': p.imagen_producto,
                        'codigo_barras': p.codigo_barras,
                        'imei': p.imei,
                    })

            return Response({
                'ok': True,
                'productos': data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error en productos_pos: {str(e)}")
            return Response(
                {'detail': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )

    @action(detail=True, methods=['post'], url_path='anular')
    def anular(self, request, pk=None):
        """Anular una factura y revertir el stock"""
        try:
            alias = self._resolve_alias(request)
            factura = self.get_object()

            if factura.estado == 'ANU':
                return Response(
                    {'detail': 'La factura ya está anulada'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            motivo = request.data.get('motivo_anulacion')
            if not motivo:
                return Response(
                    {'detail': 'Debe proporcionar un motivo de anulación'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic(using=alias):
                # Revertir stock de cada detalle
                for detalle in factura.detalles.using(alias).all():
                    existencia = Existencia.objects.using(alias).filter(
                        producto=detalle.producto,
                        bodega=factura.bodega
                    ).select_for_update().first()

                    if existencia:
                        # Devolver cantidad
                        existencia.cantidad += detalle.cantidad
                        existencia.save(using=alias)

                        # Actualizar cache de stock
                        from django.db.models import Sum
                        total = (Existencia.objects.using(alias)
                                 .filter(producto_id=detalle.producto_id)
                                 .aggregate(total=Sum('cantidad') - Sum('reservado'))['total'] or 0)
                        Producto.objects.using(alias).filter(
                            pk=detalle.producto_id
                        ).update(stock=total)

                # Actualizar estado de factura
                factura.estado = 'ANU'
                factura.motivo_anulacion = motivo
                factura.fecha_anulacion = timezone.now()
                factura.anulada_por = self._tenant_user
                factura.save(using=alias)

            serializer = FacturaSerializer(factura)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error anulando factura: {str(e)}")
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='ventas-hoy')
    def ventas_hoy(self, request):
        """Retorna estadísticas de ventas del día de hoy"""
        try:
            alias = self._resolve_alias(request)

            # Obtener fecha local
            hoy = timezone.now().date()

            # Filtrar facturas de hoy (pagadas)
            facturas_hoy = Factura.objects.using(alias).filter(
                fecha_venta__date=hoy,
                estado='PAG'
            )

            # Calcular agregaciones
            stats = facturas_hoy.aggregate(
                total_facturado=Sum('total'),
                cantidad=Count('id'),
                promedio=Avg('total')
            )

            return Response({
                'total_facturado': stats['total_facturado'] or '0.00',
                'cantidad': stats['cantidad'] or 0,
                'promedio': stats['promedio'] or '0.00',
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error en ventas_hoy: {str(e)}")
            return Response(
                {'detail': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )


# Import para Count y Avg
from django.db.models import Count, Avg
