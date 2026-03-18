# main_dashboard/views_mora.py
"""
Vistas para el control de mora y lista negra de clientes
"""
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


def _get_tenant_alias(request):
    """
    Helper para obtener el alias de BD del tenant.
    Reutiliza la lógica de FacturacionTenantMixin sin importarlo directamente.
    """
    from nova.models import Dominios
    from nova.utils.db import conectar_db_tienda

    # Obtener subdominio
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

    return alias


@api_view(['POST'])
def verificar_mora_cliente(request):
    """
    Verifica si un cliente está en mora antes de permitir una venta.

    Body esperado:
    {
        "cliente_id": 123
    }
    """
    try:
        logger.info(f"=== verificar_mora_cliente INICIO ===")
        logger.info(f"request.data: {request.data}")

        cliente_id = request.data.get('cliente_id')
        if not cliente_id:
            logger.error("cliente_id es requerido")
            return Response({
                'success': False,
                'message': 'cliente_id es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"cliente_id: {cliente_id}")

        logger.info("Obteniendo alias de tenant...")
        alias = _get_tenant_alias(request)
        logger.info(f"alias resuelto: {alias}")

        # Buscar cliente
        from .models import Cliente
        try:
            cliente = Cliente.objects.using(alias).get(pk=cliente_id)
        except Cliente.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Cliente no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

        # Obtener valores con manejo seguro de campos que pueden no existir
        en_mora = getattr(cliente, 'en_mora', False)
        dias_mora = getattr(cliente, 'dias_mora', 0)
        fecha_ultimo_pago = getattr(cliente, 'fecha_ultimo_pago', None)
        observaciones_mora = getattr(cliente, 'observaciones_mora', None)
        limite_credito = getattr(cliente, 'limite_credito', 0)

        # Calcular días de mora si hay fecha de último pago
        if fecha_ultimo_pago:
            hoy = timezone.now().date()
            delta = hoy - fecha_ultimo_pago
            dias_mora = delta.days

            # Actualizar si es necesario y si los campos existen
            if hasattr(cliente, 'dias_mora') and hasattr(cliente, 'en_mora'):
                if cliente.dias_mora != dias_mora:
                    cliente.dias_mora = dias_mora
                    cliente.en_mora = dias_mora > 30
                    cliente.save(using=alias, update_fields=['dias_mora', 'en_mora'])

        en_mora = en_mora or (dias_mora > 30)

        respuesta = {
            'success': True,
            'data': {
                'cliente_id': cliente.id,
                'nombre': cliente.nombre_completo,
                'numero_documento': cliente.numero_documento,
                'en_mora': en_mora,
                'dias_mora': dias_mora,
                'fecha_ultimo_pago': fecha_ultimo_pago.isoformat() if fecha_ultimo_pago else None,
                'observaciones_mora': observaciones_mora,
                'limite_credito': str(limite_credito) if limite_credito else '0.00',
            }
        }

        # Si está en mora, agregar advertencia
        if en_mora:
            respuesta['data']['mensaje_advertencia'] = (
                f"CLIENTE EN MORA: {dias_mora} días sin pagar. "
                f"{f'Límite de crédito: ${limite_credito}' if limite_credito > 0 else ''}"
            )

        return Response(respuesta, status=status.HTTP_200_OK)

        respuesta = {
            'success': True,
            'data': {
                'cliente_id': cliente.id,
                'nombre': cliente.nombre_completo,
                'numero_documento': cliente.numero_documento,
                'en_mora': en_mora,
                'dias_mora': dias_mora,
                'fecha_ultimo_pago': cliente.fecha_ultimo_pago.isoformat() if cliente.fecha_ultimo_pago else None,
                'observaciones_mora': cliente.observaciones_mora,
                'limite_credito': str(cliente.limite_credito) if cliente.limite_credito else '0.00',
            }
        }

        # Si está en mora, agregar advertencia
        if en_mora:
            respuesta['data']['mensaje_advertencia'] = (
                f"CLIENTE EN MORA: {dias_mora} días sin pagar. "
                f"{'Límite de crédito: $' + str(cliente.limite_credito) if cliente.limite_credito > 0 else ''}"
            )

        return Response(respuesta, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error en verificar_mora_cliente: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def marcar_cliente_mora(request):
    """
    Marca manualmente un cliente como en mora.

    Body esperado:
    {
        "cliente_id": 123,
        "observaciones": "Cliente no ha pagado en 45 días"
    }
    """
    try:
        alias = _get_tenant_alias(request)
        usuario_nombre = request.data.get('usuario', 'sistema')

        cliente_id = request.data.get('cliente_id')
        observaciones = request.data.get('observaciones')

        if not cliente_id:
            return Response({
                'success': False,
                'message': 'cliente_id es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        from .models import Cliente
        cliente = Cliente.objects.using(alias).filter(pk=cliente_id).first()

        if not cliente:
            return Response({
                'success': False,
                'message': 'Cliente no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

        # Marcar como en mora
        if observaciones:
            observaciones_completas = f"Marcado en mora por {usuario_nombre}: {observaciones}"
        else:
            observaciones_completas = f"Marcado en mora por {usuario_nombre}"

        cliente.marcar_como_mora(observaciones_completas)

        return Response({
            'success': True,
            'message': 'Cliente marcado en mora exitosamente',
            'data': {
                'cliente_id': cliente.id,
                'en_mora': cliente.en_mora,
                'dias_mora': cliente.dias_mora,
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error en marcar_cliente_mora: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def quitar_mora_cliente(request):
    """
    Quita a un cliente de la lista negra de mora.

    Body esperado:
    {
        "cliente_id": 123,
        "observaciones": "Cliente pagó deuda completa"
    }
    """
    try:
        alias = _get_tenant_alias(request)

        cliente_id = request.data.get('cliente_id')
        observaciones = request.data.get('observaciones')

        if not cliente_id:
            return Response({
                'success': False,
                'message': 'cliente_id es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        from .models import Cliente
        cliente = Cliente.objects.using(alias).filter(pk=cliente_id).first()

        if not cliente:
            return Response({
                'success': False,
                'message': 'Cliente no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

        # Quitar mora (sin usuario específico, el modelo ya maneja las observaciones)
        cliente.quitar_mora(observaciones)

        return Response({
            'success': True,
            'message': 'Cliente quitado de lista negra exitosamente',
            'data': {
                'cliente_id': cliente.id,
                'en_mora': cliente.en_mora,
                'dias_mora': cliente.dias_mora,
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error en quitar_mora_cliente: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def actualizar_usuario_registro_cliente(request):
    """
    Actualiza el usuario que registró a un cliente (para seguimiento).

    Body esperado:
    {
        "cliente_id": 123,
        "usuario_registro_id": 5
    }
    """
    try:
        alias = _get_tenant_alias(request)

        cliente_id = request.data.get('cliente_id')
        usuario_registro_id = request.data.get('usuario_registro_id')

        if not cliente_id:
            return Response({
                'success': False,
                'message': 'cliente_id es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        from .models import Cliente
        cliente = Cliente.objects.using(alias).filter(pk=cliente_id).first()

        if not cliente:
            return Response({
                'success': False,
                'message': 'Cliente no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

        # Actualizar usuario de registro
        cliente.usuario_registro_id = usuario_registro_id
        cliente.save(using=alias)

        return Response({
            'success': True,
            'message': 'Usuario de registro actualizado exitosamente',
            'data': {
                'cliente_id': cliente.id,
                'usuario_registro_id': usuario_registro_id,
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error en actualizar_usuario_registro_cliente: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def listar_clientes_en_mora(request):
    """
    Lista todos los clientes en mora para un tenant.

    Body esperado:
    {
        "usuario": "...",
        "token": "...",
        "subdominio": "..."
    }
    """
    try:
        alias = _get_tenant_alias(request)

        from .models import Cliente
        clientes_en_mora = Cliente.objects.using(alias).filter(
            Q(en_mora=True) | Q(dias_mora__gt=30)
        ).order_by('-dias_mora', '-fecha_ultimo_pago')

        data = []
        for cliente in clientes_en_mora:
            # Calcular días reales de mora
            if cliente.fecha_ultimo_pago:
                dias_reales = (timezone.now().date() - cliente.fecha_ultimo_pago).days
            else:
                dias_reales = cliente.dias_mora or 0

            data.append({
                'cliente_id': cliente.id,
                'nombre': cliente.nombre_completo,
                'numero_documento': cliente.numero_documento,
                'correo': cliente.correo,
                'telefono': cliente.telefono,
                'dias_mora': dias_reales,
                'fecha_ultimo_pago': cliente.fecha_ultimo_pago.isoformat() if cliente.fecha_ultimo_pago else None,
                'limite_credito': str(cliente.limite_credito) if cliente.limite_credito else '0.00',
                'observaciones_mora': cliente.observaciones_mora,
            })

        return Response({
            'success': True,
            'data': data,
            'total': len(data)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error en listar_clientes_en_mora: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def actualizar_dias_mora_todos(request):
    """
    Actualiza los días de mora de todos los clientes (job programado).
    Debería ejecutarse diariamente via scheduler.
    """
    try:
        alias = _get_tenant_alias(request)

        from .models import Cliente
        clientes = Cliente.objects.using(alias).filter(fecha_ultimo_pago__isnull=False)

        actualizados = 0
        for cliente in clientes:
            try:
                cliente.actualizar_estado_mora()
                actualizados += 1
            except Exception as e:
                logger.error(f"Error actualizando cliente {cliente.id}: {str(e)}")

        return Response({
            'success': True,
            'message': f'Días de mora actualizados para {actualizados} clientes',
            'data': {
                'total_clientes': clientes.count(),
                'actualizados': actualizados,
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error en actualizar_dias_mora_todos: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def listar_clientes_con_deuda(request):
    """
    Lista todos los clientes que deben dinero (tienen deuda > 0).
    Incluye clientes en mora y clientes con crédito vigente.
    Incluye el detalle de productos llevados a crédito (fiado).
    Incluye el detalle de abonos realizados con métodos de pago.

    Body esperado:
    {
        "usuario": "...",
        "token": "...",
        "subdominio": "...",
        "solo_mora": false  # opcional: si es true, solo retorna clientes en mora
    }
    """
    try:
        logger.info("=== INICIO listar_clientes_con_deuda ===")
        alias = _get_tenant_alias(request)
        solo_mora = request.data.get('solo_mora', False)

        from .models import Cliente, Factura, FacturaDetalle, Abono
        from django.db.models import Sum, Q

        logger.info(f"Modelos importados correctamente. Alias: {alias}")

        # Obtener todos los clientes
        clientes = Cliente.objects.using(alias).filter(estatus=True)
        logger.info(f"Total clientes: {clientes.count()}")

        data = []
        total_deuda_general = 0

        for cliente in clientes:
            logger.info(f"Procesando cliente {cliente.id} - {cliente.nombre_completo}")

            # Calcular deuda usando el método del modelo
            info_deuda = cliente.calcular_deuda_total()
            logger.info(f"Info deuda: {info_deuda}")

            # Solo incluir si tiene deuda
            if info_deuda['tiene_deuda']:
                # Si solo_mora es true, verificar que esté en mora
                if solo_mora and not cliente.en_mora:
                    logger.info(f"Cliente {cliente.id} excluido por filtro solo_mora")
                    continue

                total_deuda_general += info_deuda['deuda_total']

                # ==================== OBTENER PRODUCTOS FIADOS ====================
                facturas_credito = Factura.objects.using(alias).filter(
                    cliente=cliente,
                    tipo_factura='credito'
                ).exclude(estado='ANU').order_by('-fecha_venta')

                logger.info(f"Facturas de crédito encontradas: {facturas_credito.count()}")

                productos_fiados = []
                for factura in facturas_credito:
                    logger.info(f"Procesando factura {factura.id}")
                    try:
                        detalles = factura.detalles.all().using(alias)
                        logger.info(f"Detalles de factura {factura.id}: {detalles.count()}")
                        for detalle in detalles:
                            productos_fiados.append({
                                'producto_id': detalle.producto_id,
                                'producto_nombre': detalle.producto_nombre,
                                'producto_sku': detalle.producto_sku,
                                'cantidad': detalle.cantidad,
                                'valor_unitario': round(float(detalle.precio_unitario), 2),
                                'valor_total': round(float(detalle.total), 2),
                                'fecha_venta': factura.fecha_venta.isoformat(),
                                'numero_factura': factura.numero_factura,
                                'factura_id': factura.id,
                            })
                    except Exception as e:
                        logger.error(f"Error obteniendo detalles de factura {factura.id}: {str(e)}", exc_info=True)

                logger.info(f"Total productos fiados: {len(productos_fiados)}")

                # ==================== OBTENER ABONOS REALIZADOS ====================
                abonos_realizados = []
                try:
                    abonos_queryset = Abono.objects.using(alias).filter(
                        cliente=cliente
                    ).order_by('-fecha_abono', '-fecha_hora_registro')

                    logger.info(f"Abonos encontrados: {abonos_queryset.count()}")

                    for abono in abonos_queryset:
                        abonos_realizados.append({
                            'abono_id': abono.id,
                            'monto': round(float(abono.monto), 2),
                            'fecha_abono': abono.fecha_abono.isoformat(),
                            'fecha_hora_registro': abono.fecha_hora_registro.isoformat(),
                            'metodo_pago': abono.get_metodo_pago_display(),
                            'metodo_pago_codigo': abono.metodo_pago,
                            'referencia': abono.referencia,
                            'observaciones': abono.observaciones,
                        })
                except Exception as e:
                    logger.error(f"Error obteniendo abonos: {str(e)}", exc_info=True)

                logger.info(f"Total abonos realizados: {len(abonos_realizados)}")

                data.append({
                    'cliente_id': cliente.id,
                    'nombre': cliente.nombre_completo,
                    'numero_documento': cliente.numero_documento,
                    'correo': cliente.correo,
                    'telefono': cliente.telefono,
                    'en_mora': cliente.en_mora,
                    'dias_mora': cliente.dias_mora,
                    'fecha_ultimo_pago': cliente.fecha_ultimo_pago.isoformat() if cliente.fecha_ultimo_pago else None,
                    'deuda_total': round(info_deuda['deuda_total'], 2),
                    'total_facturas_credito': round(info_deuda['total_facturas_credito'], 2),
                    'total_abonos': round(info_deuda['total_abonos'], 2),
                    'limite_credito': round(float(cliente.limite_credito), 2) if cliente.limite_credito else 0,
                    'observaciones_mora': cliente.observaciones_mora,
                    'productos_fiados': productos_fiados,
                    'total_productos_fiados': len(productos_fiados),
                    'abonos_realizados': abonos_realizados,
                    'total_abonos_count': len(abonos_realizados),
                })

                logger.info(f"Cliente agregado a data. Productos fiados: {len(productos_fiados)}, Abonos: {len(abonos_realizados)}")

        # Ordenar por deuda (mayor a menor)
        data.sort(key=lambda x: x['deuda_total'], reverse=True)

        return Response({
            'success': True,
            'version_codigo': '2.0-productos-abonos',  # Campo de prueba para verificar actualización
            'data': data,
            'resumen': {
                'total_clientes_con_deuda': len(data),
                'total_deuda_general': round(total_deuda_general, 2),
                'clientes_en_mora': sum(1 for c in data if c['en_mora']),
                'total_deuda_mora': round(sum(c['deuda_total'] for c in data if c['en_mora']), 2),
                'clientes_con_credito_vigente': sum(1 for c in data if not c['en_mora']),
                'total_deuda_credito_vigente': round(sum(c['deuda_total'] for c in data if not c['en_mora']), 2),
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error en listar_clientes_con_deuda: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def resumen_deuda_cliente(request):
    """
    Obtiene un resumen detallado de la deuda de un cliente específico.
    Incluye facturas de crédito y abonos realizados.
    
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
        
        from .models import Cliente, Factura, Abono
        
        cliente = Cliente.objects.using(alias).filter(pk=cliente_id).first()
        if not cliente:
            return Response({
                'success': False,
                'message': 'Cliente no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Calcular deuda
        info_deuda = cliente.calcular_deuda_total()
        
        # Obtener facturas de crédito con detalles de productos
        facturas = Factura.objects.using(alias).filter(
            cliente=cliente,
            tipo_factura='credito',
        ).exclude(estado='ANU')

        lista_facturas = []
        productos_fiados = []
        for f in facturas:
            lista_facturas.append({
                'factura_id': f.id,
                'numero_factura': f.numero_factura,
                'fecha': f.fecha_venta.isoformat(),
                'total': float(f.total),
            })

            # Obtener detalles de productos de esta factura
            try:
                detalles = f.detalles.all().using(alias)
                for detalle in detalles:
                    productos_fiados.append({
                        'producto_id': detalle.producto_id,
                        'producto_nombre': detalle.producto_nombre,
                        'producto_sku': detalle.producto_sku,
                        'cantidad': detalle.cantidad,
                        'valor_unitario': round(float(detalle.precio_unitario), 2),
                        'valor_total': round(float(detalle.total), 2),
                        'fecha_venta': f.fecha_venta.isoformat(),
                        'numero_factura': f.numero_factura,
                        'factura_id': f.id,
                    })
            except Exception as e:
                logger.error(f"Error obteniendo detalles de factura {f.id}: {str(e)}")
        
        # Obtener abonos
        abonos = Abono.objects.using(alias).filter(
            cliente=cliente
        ).order_by('-fecha_abono', '-fecha_hora_registro')
        
        lista_abonos = []
        for a in abonos:
            lista_abonos.append({
                'abono_id': a.id,
                'monto': float(a.monto),
                'fecha_abono': a.fecha_abono.isoformat(),
                'metodo_pago': a.get_metodo_pago_display(),
                'referencia': a.referencia,
                'observaciones': a.observaciones,
            })
        
        return Response({
            'success': True,
            'cliente': {
                'cliente_id': cliente.id,
                'nombre': cliente.nombre_completo,
                'numero_documento': cliente.numero_documento,
                'en_mora': cliente.en_mora,
                'dias_mora': cliente.dias_mora,
                'fecha_ultimo_pago': cliente.fecha_ultimo_pago.isoformat() if cliente.fecha_ultimo_pago else None,
            },
            'deuda': info_deuda,
            'facturas_credito': lista_facturas,
            'abonos': lista_abonos,
            'productos_fiados': productos_fiados,
            'total_productos_fiados': len(productos_fiados),
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error en resumen_deuda_cliente: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
