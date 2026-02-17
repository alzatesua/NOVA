# main_dashboard/views_cupones.py
"""
Vistas para el módulo de cupones de descuento.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction

from .models import Cupon, ClienteCupon, Cliente
from .serializers import CuponSerializer, ClienteCuponSerializer
from .views_facturacion import FacturacionTenantMixin

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
            serializer = self.get_serializer(qs, many=True)
            return Response({'cupones': serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    def create(self, request, *args, **kwargs):
        try:
            alias = self._resolve_alias(request)
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            cupon = serializer.save()
            # Guardar en la BD del tenant
            cupon.save(using=alias)
            return Response(self.get_serializer(cupon).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f'Error creando cupón: {e}')
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            alias = self._resolve_alias(request)
            instance = Cupon.objects.using(alias).get(pk=kwargs['pk'])
            serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
            serializer.is_valid(raise_exception=True)
            cupon = serializer.save()
            cupon.save(using=alias)
            return Response(self.get_serializer(cupon).data)
        except Cupon.DoesNotExist:
            return Response({'detail': 'Cupón no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
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


# ============================================================
#                    ClienteCuponViewSet
# ============================================================
class ClienteCuponViewSet(FacturacionTenantMixin, viewsets.ModelViewSet):
    """
    Gestiona la asignación de cupones a clientes y su uso.

    Acciones adicionales:
    - POST /{id}/usar/  -> Usa un cupón (descuenta 1 de cantidad_disponible)
    - GET  /cliente/{cliente_id}/  -> Lista cupones de un cliente
    """
    serializer_class = ClienteCuponSerializer

    def get_queryset(self):
        alias = self._resolve_alias(self.request)
        return (
            ClienteCupon.objects.using(alias)
            .select_related('cliente', 'cupon')
            .order_by('-creado_en')
        )

    def list(self, request, *args, **kwargs):
        try:
            alias = self._resolve_alias(request)
            qs = (
                ClienteCupon.objects.using(alias)
                .select_related('cliente', 'cupon')
                .order_by('-creado_en')
            )
            serializer = self.get_serializer(qs, many=True)
            return Response({'cliente_cupones': serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    def create(self, request, *args, **kwargs):
        """Asigna uno o varios cupones a un cliente."""
        try:
            alias = self._resolve_alias(request)
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            cliente_id = serializer.validated_data['cliente'].id
            cupon_id = serializer.validated_data['cupon'].id

            # Verificar que el cliente y el cupón existen en el tenant
            cliente = Cliente.objects.using(alias).get(pk=cliente_id)
            cupon = Cupon.objects.using(alias).get(pk=cupon_id)

            obj, creado = ClienteCupon.objects.using(alias).get_or_create(
                cliente=cliente,
                cupon=cupon,
                defaults={
                    'activo': serializer.validated_data.get('activo', True),
                    'cantidad_disponible': serializer.validated_data.get('cantidad_disponible', 1),
                }
            )
            if not creado:
                # Si ya existe, sumar la cantidad
                cantidad_extra = serializer.validated_data.get('cantidad_disponible', 1)
                obj.cantidad_disponible += cantidad_extra
                obj.activo = True
                obj.save(using=alias)

            return Response(
                self.get_serializer(obj).data,
                status=status.HTTP_201_CREATED if creado else status.HTTP_200_OK
            )
        except (Cliente.DoesNotExist, Cupon.DoesNotExist) as e:
            return Response({'detail': str(e)}, status=status.HTTP_404_NOT_FOUND)
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

    @action(detail=False, methods=['get'], url_path='cliente/(?P<cliente_id>[^/.]+)')
    def por_cliente(self, request, cliente_id=None):
        """
        Lista todos los cupones asignados a un cliente específico.
        Acepta ?solo_activos=true para filtrar solo cupones vigentes.
        """
        try:
            alias = self._resolve_alias(request)
            solo_activos = request.query_params.get('solo_activos', 'false').lower() == 'true'

            qs = (
                ClienteCupon.objects.using(alias)
                .filter(cliente_id=cliente_id)
                .select_related('cupon')
            )
            if solo_activos:
                qs = qs.filter(activo=True, cantidad_disponible__gt=0)

            serializer = self.get_serializer(qs, many=True)
            return Response({'cupones': serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
