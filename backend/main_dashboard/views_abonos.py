# main_dashboard/views_abonos.py
"""
Vistas para gestionar abonos a clientes en mora
"""
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
import logging
import os

logger = logging.getLogger(__name__)


def _get_tenant_alias(request):
    """Helper para obtener el alias de BD del tenant."""
    from nova.models import Dominios
    from nova.utils.db import conectar_db_tienda

    subdom = request.data.get('subdominio') or request.query_params.get('subdominio')
    if not subdom:
        host = request.get_host().split(':')[0]
        subdom = host.split('.')[0].lower()

    dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).select_related('tienda').first()
    if not dominio_obj:
        raise ValueError('Dominio no válido.')

    tienda = dominio_obj.tienda
    alias = str(tienda.id)
    conectar_db_tienda(alias, tienda)

    return alias


@api_view(['POST'])
def listar_abonos_cliente(request):
    """
    Lista todos los abonos de un cliente específico.

    Body esperado:
    {
        "cliente_id": 123
    }
    """
    try:
        alias = _get_tenant_alias(request)

        cliente_id = request.data.get('cliente_id')
        if not cliente_id:
            return Response({
                'success': False,
                'message': 'cliente_id es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        from .models import Abono, Cliente

        # Verificar que el cliente existe
        try:
            cliente = Cliente.objects.using(alias).get(pk=cliente_id)
        except Cliente.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Cliente no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

        # Obtener abonos
        abonos = Abono.objects.using(alias).filter(cliente_id=cliente_id).order_by('-fecha_abono', '-fecha_hora_registro')

        data = []
        total_abonado = 0

        for abono in abonos:
            total_abonado += float(abono.monto)
            data.append({
                'id': abono.id,
                'monto': str(abono.monto),
                'metodo_pago': abono.get_metodo_pago_display(),
                'referencia': abono.referencia,
                'observaciones': abono.observaciones,
                'fecha_abono': abono.fecha_abono.isoformat(),
                'fecha_hora_registro': abono.fecha_hora_registro.isoformat(),
                'soporte_pago': abono.soporte_pago.url if abono.soporte_pago else None,
                'registrado_por': abono.registrado_por.usuario if abono.registrado_por else None,
            })

        return Response({
            'success': True,
            'data': data,
            'total_abonado': str(total_abonado),
            'total_abonos': len(data)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error en listar_abonos_cliente: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST', 'PUT'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def crear_abono(request):
    """
    Registra un nuevo abono a un cliente en mora.

    Body esperado (multipart/form-data para soporte):
    - cliente_id: ID del cliente
    - monto: Monto del abono
    - metodo_pago: efectivo, transferencia, nequi, tarjeta, otro
    - referencia: Referencia opcional
    - observaciones: Observaciones opcionales
    - soporte_pago: Archivo de soporte (requerido para métodos digitales)
    - fecha_abono: Fecha del abono (opcional, usa hoy por defecto)
    """
    try:
        alias = _get_tenant_alias(request)
        usuario_nombre = request.data.get('usuario', 'sistema')

        cliente_id = request.data.get('cliente_id')
        monto = request.data.get('monto')
        metodo_pago = request.data.get('metodo_pago', 'efectivo')
        referencia = request.data.get('referencia')
        observaciones = request.data.get('observaciones')
        fecha_abono = request.data.get('fecha_abono')
        soporte_pago = request.FILES.get('soporte_pago')

        if not cliente_id:
            return Response({
                'success': False,
                'message': 'cliente_id es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not monto:
            return Response({
                'success': False,
                'message': 'monto es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        from .models import Abono, Cliente
        from decimal import Decimal

        # Verificar que el cliente existe
        try:
            cliente = Cliente.objects.using(alias).get(pk=cliente_id)
        except Cliente.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Cliente no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

        # Calcular deuda total del cliente
        info_deuda = cliente.calcular_deuda_total()
        deuda_total = Decimal(str(info_deuda['deuda_total']))

        # Validar que el monto no supere la deuda
        monto_decimal = Decimal(str(monto))
        if monto_decimal > deuda_total:
            return Response({
                'success': False,
                'message': f'El monto del abono (${monto_decimal}) no puede superar la deuda total (${deuda_total})'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validar que se suba soporte para métodos digitales
        metodos_digitales = ['transferencia', 'nequi', 'tarjeta', 'otro']
        if metodo_pago in metodos_digitales and not soporte_pago:
            return Response({
                'success': False,
                'message': 'Debes adjuntar el soporte de pago para este método de pago'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validar tamaño del archivo (máximo 5MB)
        if soporte_pago:
            max_size = 5 * 1024 * 1024  # 5MB
            if soporte_pago.size > max_size:
                return Response({
                    'success': False,
                    'message': 'El archivo de soporte no puede superar los 5MB'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Crear el abono
        abono = Abono.objects.using(alias).create(
            cliente=cliente,
            monto=monto_decimal,
            metodo_pago=metodo_pago,
            referencia=referencia,
            observaciones=observaciones,
            soporte_pago=soporte_pago,
            fecha_abono=fecha_abono or timezone.now().date(),
        )

        # Crear movimiento de caja automático (conexión Abono → Caja)
        from .models import MovimientoCaja
        from django.apps import apps

        # Buscar el usuario que registra el abono
        try:
            LoginUsuario = apps.get_model('nova', 'LoginUsuario')
            usuario_obj = LoginUsuario.objects.using(alias).filter(usuario=usuario_nombre).first()
        except Exception:
            usuario_obj = None

        MovimientoCaja.objects.using(alias).create(
            usuario=usuario_obj,
            tipo='entrada',
            categoria='abono',
            monto=Decimal(str(monto)),
            metodo_pago=metodo_pago,
            descripcion=f'Abono cliente {cliente.nombre_completo} - Ref: {referencia or "N/A"}',
            fecha=abono.fecha_abono or timezone.now().date(),
            fecha_hora=timezone.now(),
            soporte_pago=soporte_pago
        )
        logger.info(f"Movimiento de caja creado para abono: cliente={cliente.id}, monto={monto}, metodo={metodo_pago}, usuario={usuario_nombre}")

        return Response({
            'success': True,
            'message': 'Abono registrado exitosamente',
            'data': {
                'id': abono.id,
                'monto': str(abono.monto),
                'metodo_pago': abono.get_metodo_pago_display(),
                'fecha_abono': abono.fecha_abono.isoformat(),
                'soporte_pago': abono.soporte_pago.url if abono.soporte_pago else None,
                'cliente_nuevo_estado': {
                    'en_mora': cliente.en_mora,
                    'dias_mora': cliente.dias_mora,
                    'fecha_ultimo_pago': cliente.fecha_ultimo_pago.isoformat() if cliente.fecha_ultimo_pago else None,
                }
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error en crear_abono: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def resumen_mora_cliente(request):
    """
    Obtiene un resumen completo de la mora de un cliente con historial de abonos.

    Body esperado:
    {
        "cliente_id": 123
    }
    """
    try:
        alias = _get_tenant_alias(request)

        cliente_id = request.data.get('cliente_id')
        if not cliente_id:
            return Response({
                'success': False,
                'message': 'cliente_id es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        from .models import Abono, Cliente

        # Verificar que el cliente existe
        try:
            cliente = Cliente.objects.using(alias).get(pk=cliente_id)
        except Cliente.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Cliente no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

        # Obtener abonos
        abonos = Abono.objects.using(alias).filter(cliente_id=cliente_id).order_by('-fecha_abono', '-fecha_hora_registro')

        total_abonado = sum(float(abono.monto) for abono in abonos)

        # Información del cliente
        info_cliente = {
            'cliente_id': cliente.id,
            'nombre': cliente.nombre_completo,
            'numero_documento': cliente.numero_documento,
            'en_mora': cliente.en_mora,
            'dias_mora': cliente.dias_mora,
            'fecha_ultimo_pago': cliente.fecha_ultimo_pago.isoformat() if cliente.fecha_ultimo_pago else None,
            'limite_credito': str(cliente.limite_credito) if cliente.limite_credito else '0.00',
            'observaciones_mora': cliente.observaciones_mora,
        }

        # Lista de abonos
        lista_abonos = []
        for abono in abonos:
            lista_abonos.append({
                'id': abono.id,
                'monto': str(abono.monto),
                'metodo_pago': abono.get_metodo_pago_display(),
                'fecha_abono': abono.fecha_abono.isoformat(),
                'observaciones': abono.observaciones,
                'soporte_pago': abono.soporte_pago.url if abono.soporte_pago else None,
                'registrado_por': abono.registrado_por.usuario if abono.registrado_por else 'Sistema',
            })

        return Response({
            'success': True,
            'cliente': info_cliente,
            'abonos': lista_abonos,
            'total_abonado': str(total_abonado),
            'cantidad_abonos': len(abonos)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error en resumen_mora_cliente: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
