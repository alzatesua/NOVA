# main_dashboard/views_cupones.py
"""
Vistas para el módulo de cupones de descuento.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from django.core.exceptions import ValidationError

from .models import Cupon, ClienteCupon, Cliente, ClienteTienda
from .serializers import CuponSerializer, ClienteCuponSerializer
from .views_facturacion import FacturacionTenantMixin
from nova.models import Dominios

import logging

logger = logging.getLogger(__name__)


# ============================================================
#                    CuponViewSet
# ============================================================
class CuponViewSet(FacturacionTenantMixin, viewsets.ModelViewSet):
    """
    CRUD de cupones de descuento.

    Todos los endpoints requieren body con: usuario, token, subdominio
    """
    serializer_class = CuponSerializer

    def get_queryset(self):
        alias = self._resolve_alias(self.request)
        return Cupon.objects.using(alias).all().order_by('-creado_en')

    def list(self, request, *args, **kwargs):
        try:
            alias = self._resolve_alias(request)
            solo_activos = request.query_params.get('activos', 'false').lower() == 'true'
            qs = Cupon.objects.using(alias).all().order_by('-creado_en')
            if solo_activos:
                qs = qs.filter(activo=True)

            logger.info(f'[CUPONES] Listando cupones: alias={alias}, activos={solo_activos}, count={qs.count()}')

            serializer = self.get_serializer(qs, many=True)
            return Response({'cupones': serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f'[CUPONES] Error listando: {e}')
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    def create(self, request, *args, **kwargs):
        try:
            alias = self._resolve_alias(request)
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            logger.info(f'[CUPONES] Creando cupón: alias={alias}, data={serializer.validated_data}')

            # Crear el objeto sin guardar en BD todavía
            cupon = Cupon(**serializer.validated_data)
            # Validar a nivel modelo (llama a clean())
            cupon.full_clean()
            # Ahora guardar en la BD del tenant
            cupon.save(using=alias)

            logger.info(f'[CUPONES] Cupón creado: id={cupon.id}, nombre={cupon.nombre}')

            return Response(self.get_serializer(cupon).data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            # Convertir Django ValidationError a formato DRF
            logger.error(f'[CUPONES] ValidationError: {e}')
            error_dict = e.message_dict if hasattr(e, 'message_dict') else {'detail': str(e)}
            return Response(error_dict, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f'Error creando cupón: {e}')
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            alias = self._resolve_alias(request)
            instance = Cupon.objects.using(alias).get(pk=kwargs['pk'])
            serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
            serializer.is_valid(raise_exception=True)

            # Actualizar los campos de la instancia
            for attr, value in serializer.validated_data.items():
                setattr(instance, attr, value)

            # Validar a nivel modelo
            instance.full_clean()
            # Guardar en la BD del tenant
            instance.save(using=alias)

            return Response(self.get_serializer(instance).data)
        except Cupon.DoesNotExist:
            return Response({'detail': 'Cupón no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            error_dict = e.message_dict if hasattr(e, 'message_dict') else {'detail': str(e)}
            return Response(error_dict, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            alias = self._resolve_alias(request)
            cupon = Cupon.objects.using(alias).get(pk=kwargs['pk'])
            cupon.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Cupon.DoesNotExist:
            return Response({'detail': 'Cupón no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='clientes-tienda')
    def listar_clientes_tienda(self, request):
        """
        Lista los ClienteTienda (usuarios e-commerce) para asignar cupones.
        Acepta ?query= para filtrar por email.
        """
        try:
            alias = self._resolve_alias(request)
            query = request.query_params.get('query', '').strip()

            qs = ClienteTienda.objects.using(alias).filter(rol='cliente')
            if query:
                qs = qs.filter(email__icontains=query)

            qs = qs.order_by('-creado_en')[:50]  # Limitar a 50 resultados

            clientes_data = [{
                'id': c.id,
                'email': c.email,
                'nombre': c.email,  # Por ahora usamos email como nombre
                'cliente_fiscal_id': c.cliente_id,
            } for c in qs]

            return Response({'clientes_tienda': clientes_data}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f'[CUPONES] Error listando clientes tienda: {e}')
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
#                    ClienteCuponViewSet
# ============================================================
class ClienteCuponViewSet(FacturacionTenantMixin, viewsets.ModelViewSet):
    """
    Gestiona la asignación de cupones a ClienteTienda y su uso.

    Acciones adicionales:
    - POST /{id}/usar/  -> Usa un cupón (descuenta 1 de cantidad_disponible)
    - GET  /cliente/{cliente_tienda_id}/  -> Lista cupones de un cliente
    """
    serializer_class = ClienteCuponSerializer

    def get_queryset(self):
        alias = self._resolve_alias(self.request)
        return (
            ClienteCupon.objects.using(alias)
            .select_related('cliente_tienda', 'cliente_fiscal', 'cupon')
            .order_by('-creado_en')
        )

    def list(self, request, *args, **kwargs):
        try:
            alias = self._resolve_alias(request)
            qs = (
                ClienteCupon.objects.using(alias)
                .select_related('cliente_tienda', 'cliente_fiscal', 'cupon')
                .order_by('-creado_en')
            )
            serializer = self.get_serializer(qs, many=True)
            return Response({'cliente_cupones': serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    def create(self, request, *args, **kwargs):
        """
        Asigna uno o varios cupones a un ClienteTienda.

        Body esperado:
        {
            "subdominio": "tienda-abc",    // Requerido: identifica la tienda/BD
            "usuario": "admin",              // Requerido: usuario de autenticación
            "token": "xxx",                  // Requerido: token de autenticación
            "cliente_tienda_id": 15,        // Requerido: ID del ClienteTienda (usuario e-commerce)
            "cupon_id": 1,                   // Requerido: ID del cupón
            "activo": true,                  // Opcional (default: true)
            "cantidad_disponible": 1         // Opcional (default: 1)
        }

        O también puedes enviar subdominio, usuario y token por query params:
        POST /api/cupones/cliente-cupones/?subdominio=tienda-abc&usuario=admin&token=xxx
        """
        from .models import ClienteTienda
        from nova.utils.db import conectar_db_tienda

        try:
            alias = self._resolve_alias(request)

            # Conectar a la BD de la tienda dinámicamente
            subdom = request.data.get('subdominio') or request.query_params.get('subdominio')
            if not subdom:
                host = request.get_host().split(':')[0]
                subdom = host.split('.')[0].lower()

            dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).select_related('tienda').first()
            if not dominio_obj or not dominio_obj.tienda:
                return Response(
                    {'detail': 'Dominio no válido.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            tienda = dominio_obj.tienda
            alias = str(tienda.id)
            conectar_db_tienda(alias, tienda)

            # Validar que cliente_tienda_id venga en la petición
            if not request.data.get('cliente_tienda_id'):
                return Response(
                    {'detail': 'El campo cliente_tienda_id es requerido.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            # Obtener IDs de los campos _id
            cliente_tienda_id = serializer.validated_data['cliente_tienda_id']
            cupon_id = serializer.validated_data['cupon_id']
            cantidad = serializer.validated_data.get('cantidad_disponible', 1)

            logger.info(f'[CUPONES] Asignando cupón {cupon_id} al cliente {cliente_tienda_id}')

            # Transacción atómica para toda la operación
            with transaction.atomic(using=alias):
                # Verificar que el ClienteTienda existe
                try:
                    cliente_tienda = ClienteTienda.objects.using(alias).get(pk=cliente_tienda_id)
                except ClienteTienda.DoesNotExist:
                    return Response(
                        {'detail': f'Cliente con ID {cliente_tienda_id} no encontrado.'},
                        status=status.HTTP_404_NOT_FOUND
                    )

                # Verificar que el cupón existe y está activo
                try:
                    cupon = Cupon.objects.using(alias).get(pk=cupon_id)
                except Cupon.DoesNotExist:
                    return Response(
                        {'detail': f'Cupón con ID {cupon_id} no encontrado.'},
                        status=status.HTTP_404_NOT_FOUND
                    )

                # Validaciones del cupón
                if not cupon.activo:
                    return Response(
                        {'detail': 'No se pueden asignar cupones inactivos.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if cupon.fecha_vencimiento and cupon.fecha_vencimiento < timezone.now().date():
                    return Response(
                        {'detail': 'No se pueden asignar cupones vencidos.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Obtener el cliente_fiscal si existe
                cliente_fiscal = None
                if cliente_tienda.cliente_id:
                    try:
                        cliente_fiscal = Cliente.objects.using(alias).get(pk=cliente_tienda.cliente_id)
                    except Cliente.DoesNotExist:
                        pass

                # Crear o actualizar la asignación
                obj, creado = ClienteCupon.objects.using(alias).get_or_create(
                    cliente_tienda=cliente_tienda,
                    cupon=cupon,
                    defaults={
                        'cliente_fiscal': cliente_fiscal,
                        'activo': serializer.validated_data.get('activo', True),
                        'cantidad_disponible': cantidad,
                    }
                )

                if not creado:
                    # Si ya existe, sumar la cantidad
                    obj.cantidad_disponible += cantidad
                    obj.activo = True
                    # Actualizar cliente_fiscal si ahora existe y antes no
                    if cliente_fiscal and not obj.cliente_fiscal:
                        obj.cliente_fiscal = cliente_fiscal
                    # Validar a nivel modelo antes de guardar
                    obj.full_clean()
                    obj.save(using=alias)
                else:
                    # Objeto recién creado, validar también
                    obj.full_clean()
                    obj.save(using=alias)

                logger.info(
                    f'[CUPONES] Cupón asignado exitosamente. '
                    f'Creado: {creado}, Cantidad total: {obj.cantidad_disponible}'
                )

            return Response(
                self.get_serializer(obj).data,
                status=status.HTTP_201_CREATED if creado else status.HTTP_200_OK
            )

        except ValidationError as e:
            logger.error(f'Error de validación: {e}')
            error_dict = e.message_dict if hasattr(e, 'message_dict') else {'detail': str(e)}
            return Response(error_dict, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f'Error asignando cupón: {e}')
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='usar')
    def usar(self, request, pk=None):
        """
        Usa un cupón: decrementa cantidad_disponible en 1.
        Si llega a 0 lo marca como inactivo y registra la fecha de uso.

        Body: { usuario, token, subdominio }
        """
        try:
            alias = self._resolve_alias(request)
            with transaction.atomic(using=alias):
                obj = ClienteCupon.objects.using(alias).select_for_update().get(pk=pk)

                if not obj.activo:
                    return Response(
                        {'detail': 'Este cupón ya no está activo.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                if obj.cantidad_disponible <= 0:
                    return Response(
                        {'detail': 'No hay cupones disponibles para este cliente.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Verificar vencimiento del cupón
                if obj.cupon.fecha_vencimiento and obj.cupon.fecha_vencimiento < timezone.now().date():
                    return Response(
                        {'detail': 'El cupón ha vencido.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                obj.cantidad_disponible -= 1
                obj.fecha_uso = timezone.now()
                if obj.cantidad_disponible == 0:
                    obj.activo = False
                obj.save(using=alias)

            return Response(self.get_serializer(obj).data, status=status.HTTP_200_OK)
        except ClienteCupon.DoesNotExist:
            return Response({'detail': 'Asignación de cupón no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f'Error usando cupón: {e}')
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='cliente/(?P<cliente_tienda_id>[^/.]+)')
    def por_cliente(self, request, cliente_tienda_id=None):
        """
        Lista todos los cupones asignados a un ClienteTienda específico.
        Acepta ?solo_activos=true para filtrar solo cupones vigentes.
        """
        try:
            alias = self._resolve_alias(request)
            solo_activos = request.query_params.get('solo_activos', 'false').lower() == 'true'

            qs = (
                ClienteCupon.objects.using(alias)
                .filter(cliente_tienda_id=cliente_tienda_id)
                .select_related('cupon', 'cliente_fiscal')
            )
            if solo_activos:
                qs = qs.filter(activo=True, cantidad_disponible__gt=0)

            serializer = self.get_serializer(qs, many=True)
            return Response({'cupones': serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'post'], url_path='mis-cupones')
    def mis_cupones(self, request):
        """
        Lista los cupones del ClienteTienda por correo (API pública).

        Acepta parámetros en query string o en el body:
        - correo: Correo del ClienteTienda (requerido)
        - subdominio: Subdominio de la tienda (requerido)

        Retorna:
        - cupones: Lista de cupones con detalles
        - total_cupones: Cantidad total de cupones disponibles para redimir
        """
        try:
            # Obtener subdominio de query params o body
            subdom = request.query_params.get('subdominio') or request.data.get('subdominio')
            correo = request.query_params.get('correo') or request.data.get('correo')

            if not subdom:
                return Response(
                    {'detail': 'El parámetro subdominio es requerido.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not correo:
                return Response(
                    {'detail': 'El parámetro correo es requerido.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Resolver alias solo con subdominio (sin requerir usuario/token)
            host = request.get_host().split(':')[0]
            subdominio = subdom if subdom else host.split('.')[0].lower()

            dominio_obj = Dominios.objects.filter(dominio__icontains=subdominio).select_related('tienda').first()
            if not dominio_obj or not dominio_obj.tienda:
                return Response(
                    {'detail': 'Dominio no válido.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            tienda = dominio_obj.tienda
            alias = str(tienda.id)

            # Conectar a la BD de la tienda dinámicamente
            from nova.utils.db import conectar_db_tienda
            conectar_db_tienda(alias, tienda)

            # Buscar ClienteTienda por correo (usuario e-commerce)
            from .models import ClienteTienda
            cliente_tienda = ClienteTienda.objects.using(alias).filter(email__iexact=correo).first()
            logger.info(f'[CUPONES] Buscando ClienteTienda para correo={correo}, encontrado={cliente_tienda is not None}')

            if not cliente_tienda:
                # No existe ningún usuario e-commerce con ese correo
                logger.warning(f'[CUPONES] No se encontró ningún ClienteTienda con correo={correo}')
                return Response(
                    {'detail': 'No se encontró un cliente con ese correo.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Obtener cupones del cliente_tienda (solo activos y con disponibilidad)
            qs = (
                ClienteCupon.objects.using(alias)
                .filter(cliente_tienda=cliente_tienda, activo=True, cantidad_disponible__gt=0)
                .select_related('cupon', 'cliente_fiscal')
            )
            logger.info(f'[CUPONES] ClienteTienda ID={cliente_tienda.id}, cupones encontrados (antes de filtro vencimiento)={len(qs)}')

            # Filtrar cupones no vencidos
            hoy = timezone.now().date()
            qs = [obj for obj in qs if obj.cupon.fecha_vencimiento is None or obj.cupon.fecha_vencimiento >= hoy]
            logger.info(f'[CUPONES] Cupones después de filtro vencimiento={len(qs)}')

            # Calcular total de cupones disponibles
            total_cupones = sum(obj.cantidad_disponible for obj in qs)
            logger.info(f'[CUPONES] Total cupones disponibles={total_cupones}')

            serializer = self.get_serializer(qs, many=True)

            # Obtener nombre del cliente (fiscal si existe, sino email del tienda)
            cliente_nombre = correo
            if cliente_tienda.cliente_id:
                try:
                    cliente_fiscal = Cliente.objects.using(alias).get(pk=cliente_tienda.cliente_id)
                    if cliente_fiscal.tipo_persona == 'JUR':
                        cliente_nombre = cliente_fiscal.razon_social or correo
                    else:
                        partes = filter(None, [cliente_fiscal.primer_nombre, cliente_fiscal.segundo_nombre, cliente_fiscal.apellidos])
                        cliente_nombre = ' '.join(partes) or correo
                except Cliente.DoesNotExist:
                    pass

            return Response({
                'cliente_tienda_id': cliente_tienda.id,
                'cliente_id': cliente_tienda.cliente_id,
                'cliente_nombre': cliente_nombre,
                'cupones': serializer.data,
                'total_cupones': total_cupones
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f'Error obteniendo cupones del cliente: {e}')
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
