"""
Vistas para el módulo de Kardex de Inventario
"""
import logging
from datetime import datetime
from django.db import transaction
from django.db.models import Q, Count, Sum, F, Avg
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from django.apps import apps

from .models import (
    KardexAjuste,
    KardexDiferencia,
    Producto,
    Sucursales
)

logger = logging.getLogger(__name__)


def get_data_base(request):
    """Obtiene el alias de la base de datos del tenant"""
    from nova.models import Dominios
    from nova.utils.db import conectar_db_tienda

    # Obtener subdominio del request
    subdominio = request.data.get('subdominio') or request.GET.get('subdominio')

    if not subdominio:
        # Intentar extraer del Host
        host = request.get_host().split(':')[0]
        partes = host.split('.')
        if len(partes) > 2:
            subdominio = partes[0].lower()
        else:
            subdominio = host.lower()

    if not subdominio:
        return None

    # Buscar el dominio y obtener la tienda
    dominio_obj = Dominios.objects.filter(dominio__icontains=subdominio).select_related('tienda').first()
    if not dominio_obj:
        return None

    tienda = dominio_obj.tienda
    alias = f"tenant_{tienda.subdominio}"

    # Conectar a la base de datos
    conectar_db_tienda(alias, tienda)

    return alias


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def guardar_ajuste_kardex(request):
    """
    Guarda un ajuste de inventario realizado mediante Kardex

    Body esperado:
    {
        "usuario": "usuario",
        "token": "token",
        "subdominio": "subdominio",
        "fecha": "2024-01-15T10:00:00",
        "diferencias": [
            {
                "producto_id": 123,
                "cantidad_sistema": 50,
                "cantidad_fisica": 48,
                "diferencia": -2,
                "tipo": "faltante",
                "valor_diferencia": 150000
            }
        ],
        "resumen": {
            "total_productos": 100,
            "productos_cuadrados": 95,
            "productos_con_diferencia": 5,
            "porcentaje_precision": 95.0,
            "valor_total_diferencias": 500000
        }
    }
    """
    try:
        alias = get_data_base(request)
        if not alias:
            return Response({
                'success': False,
                'message': 'No se pudo identificar la base de datos del tenant'
            }, status=400)

        data = request.data
        usuario = data.get('usuario')
        token = data.get('token')
        subdominio = data.get('subdominio')

        # Obtener sucursal por defecto del usuario
        # Nota: Asumimos que hay una sucursal por defecto, esto puede ajustarse según la lógica del negocio
        from login.models import User
        try:
            user_obj = User.objects.using(alias).get(username=usuario)
            # Obtener sucursal del usuario (puedes ajustar según tu modelo de usuario)
            sucursal_id = getattr(user_obj, 'sucursal_id', None)
            if not sucursal_id:
                # Intentar obtener sucursal por defecto
                sucursal = Sucursales.objects.using(alias).filter(estatus=True).first()
            else:
                sucursal = Sucursales.objects.using(alias).filter(id=sucursal_id).first()

            if not sucursal:
                return Response({
                    'success': False,
                    'message': 'No se encontró una sucursal para el usuario'
                }, status=400)

        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Usuario no encontrado'
            }, status=404)

        diferencias_data = data.get('diferencias', [])
        resumen = data.get('resumen', {})

        with transaction.atomic(using=alias):
            # Crear el ajuste de kardex
            kardex = KardexAjuste.objects.using(alias).create(
                sucursal=sucursal,
                usuario_registro_id=user_obj.id,
                total_productos=resumen.get('total_productos', 0),
                productos_contados=resumen.get('productos_contados', 0),
                productos_cuadrados=resumen.get('productos_cuadrados', 0),
                productos_con_diferencia=resumen.get('productos_con_diferencia', 0),
                porcentaje_precision=resumen.get('porcentaje_precision', 0),
                valor_total_diferencias=resumen.get('valor_total_diferencias', 0),
                sugerencia=data.get('sugerencia', '')
            )

            # Guardar las diferencias individuales
            for diff_data in diferencias_data:
                producto = Producto.objects.using(alias).filter(
                    id=diff_data.get('producto_id')
                ).first()

                if producto:
                    KardexDiferencia.objects.using(alias).create(
                        kardex=kardex,
                        producto=producto,
                        cantidad_sistema=diff_data.get('cantidad_sistema', 0),
                        cantidad_fisica=diff_data.get('cantidad_fisica', 0),
                        diferencia=diff_data.get('diferencia', 0),
                        tipo_diferencia=diff_data.get('tipo', 'cuadrado'),
                        valor_diferencia=diff_data.get('valor_diferencia', 0),
                        snapshot_nombre_producto=producto.nombre,
                        snapshot_sku=producto.sku,
                        snapshot_precio=producto.precio
                    )

                    # Si hay una diferencia significativa, marcar el producto como revisado
                    if abs(diff_data.get('diferencia', 0)) > 0:
                        # Aquí podrías implementar lógica para marcar productos con diferencias recurrentes
                        pass

        logger.info(f"Kardex guardado exitosamente por {usuario} - Ajuste #{kardex.id}")

        return Response({
            'success': True,
            'message': 'Ajuste de Kardex guardado correctamente',
            'kardex_id': kardex.id,
            'fecha': kardex.fecha_conteo.isoformat()
        })

    except Exception as e:
        logger.error(f"Error guardando ajuste de Kardex: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error al guardar el ajuste: {str(e)}'
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_historial_kardex(request):
    """
    Obtiene el historial de ajustes de Kardex

    Query params:
    - pagina: número de página (default: 1)
    - por_pagina: cantidad por página (default: 20)
    - estado: filtrar por estado (opcional)
    """
    try:
        alias = get_data_base(request)
        if not alias:
            return Response({
                'success': False,
                'message': 'No se pudo identificar la base de datos del tenant'
            }, status=400)

        usuario = request.GET.get('usuario')
        token = request.GET.get('token')
        subdominio = request.GET.get('subdominio')
        pagina = int(request.GET.get('pagina', 1))
        por_pagina = int(request.GET.get('por_pagina', 20))
        estado = request.GET.get('estado')

        # Obtener usuario
        from login.models import User
        try:
            user_obj = User.objects.using(alias).get(username=usuario)
            sucursal_id = getattr(user_obj, 'sucursal_id', None)
        except User.DoesNotExist:
            user_obj = None
            sucursal_id = None

        # Construir query
        queryset = KardexAjuste.objects.using(alias).all()

        # Filtrar por sucursal si el usuario tiene una asignada
        if sucursal_id:
            queryset = queryset.filter(sucursal_id=sucursal_id)

        # Filtrar por estado si se especifica
        if estado:
            queryset = queryset.filter(estado=estado)

        # Ordenar
        queryset = queryset.order_by('-fecha_conteo')

        # Paginar
        total = queryset.count()
        inicio = (pagina - 1) * por_pagina
        fin = inicio + por_pagina
        ajustes = queryset[inicio:fin]

        # Serializar datos
        ajustes_data = []
        for ajuste in ajustes:
            # Obtener conteo de diferencias por tipo
            diferencias = KardexDiferencia.objects.using(alias).filter(kardex=ajuste)

            diferencias_data = []
            faltantes = diferencias.filter(tipo_diferencia='faltante').count()
            sobrantes = diferencias.filter(tipo_diferencia='sobrante').count()

            ajustes_data.append({
                'id': ajuste.id,
                'fecha_conteo': ajuste.fecha_conteo.isoformat(),
                'sucursal': ajuste.sucursal.nombre,
                'usuario_registro': ajuste.usuario_registro.username if ajuste.usuario_registro else usuario,
                'total_productos': ajuste.total_productos,
                'productos_contados': ajuste.productos_contados,
                'productos_cuadrados': ajuste.productos_cuadrados,
                'productos_con_diferencia': ajuste.productos_con_diferencia,
                'porcentaje_precision': float(ajuste.porcentaje_precision),
                'valor_total_diferencias': float(ajuste.valor_total_diferencias),
                'sugerencia': ajuste.sugerencia,
                'estado': ajuste.estado,
                'fecha_validacion': ajuste.fecha_validacion.isoformat() if ajuste.fecha_validacion else None,
                'usuario_valido': ajuste.usuario_valido.username if ajuste.usuario_valido else None,
                'observaciones': ajuste.observaciones,
                'diferencias_resumen': {
                    'faltantes': faltantes,
                    'sobrantes': sobrantes
                },
                'puede_editar': ajuste.estado == 'pendiente' and (
                    not ajuste.usuario_valido or
                    ajuste.usuario_valido == request.user
                )
            })

        return Response({
            'success': True,
            'data': ajustes_data,
            'pagination': {
                'pagina': pagina,
                'por_pagina': por_pagina,
                'total': total,
                'total_paginas': (total + por_pagina - 1) // por_pagina
            }
        })

    except Exception as e:
        logger.error(f"Error obteniendo historial de Kardex: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error al obtener el historial: {str(e)}'
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verificar_producto_critico(request, producto_id):
    """
    Verifica si un producto es crítico por diferencias recurrentes en Kardex

    Un producto se considera crítico si:
    - Ha aparecido en diferencias de faltante en al menos 3 de los últimos 5 ajustes
    - El valor acumulado de diferencias supera el 20% del valor del producto
    """
    try:
        alias = get_data_base(request)
        if not alias:
            return Response({
                'success': False,
                'message': 'No se pudo identificar la base de datos del tenant'
            }, status=400)

        usuario = request.GET.get('usuario')
        subdominio = request.GET.get('subdominio')

        # Buscar producto
        producto = Producto.objects.using(alias).filter(id=producto_id).first()
        if not producto:
            return Response({
                'success': False,
                'message': 'Producto no encontrado'
            }, status=404)

        # Obtener los últimos 5 ajustes que incluyen este producto
        ultimos_ajustes = KardexAjuste.objects.using(alias).filter(
            diferencias__producto=producto
        ).order_by('-fecha_conteo')[:5]

        if ultimos_ajustes.count() < 3:
            return Response({
                'success': True,
                'data': {
                    'producto_id': producto_id,
                    'nombre_producto': producto.nombre,
                    'es_critico': False,
                    'apariciones_kardex': ultimos_ajustes.count(),
                    'mensaje': 'Producto sin suficientes apariciones para ser critico'
                }
            })

        # Analizar las diferencias del producto
        diferencias = KardexDiferencia.objects.using(alias).filter(
            kardex__in=ultimos_ajustes,
            producto=producto
        )

        # Contar apariciones con faltantes
        apariciones_faltante = diferencias.filter(tipo_diferencia='faltante').count()
        apariciones_sobrante = diferencias.filter(tipo_diferencia='sobrante').count()
        total_diferencias = diferencias.count()

        # Calcular valor acumulado de diferencias
        valor_acumulado = diferencias.aggregate(
            total=Sum('valor_diferencia')
        )['total'] or 0

        # Obtener precio del producto
        precio_producto = float(producto.precio or 0)

        # Determinar si es crítico
        es_critico = (
            apariciones_faltante >= 3 or
            (apariciones_faltante >= 2 and valor_acumulado > (precio_producto * 5)) or
            total_diferencias >= 5
        )

        # Generar recomendación
        if es_critico:
            if apariciones_faltante >= 3:
                recomendacion = "Producto con pérdidas recurrentes. Revisar procedimientos de control y seguridad."
            elif valor_acumulado > precio_producto * 5:
                recomendacion = "Valor de pérdidas significativo. Se recomienda auditoría inmediata."
            else:
                recomendacion = "Alta frecuencia de diferencias. Revisar procesos de registro."
        else:
            recomendacion = "Producto sin patrón crítico de diferencias."

        return Response({
            'success': True,
            'data': {
                'producto_id': producto_id,
                'nombre_producto': producto.nombre,
                'sku': producto.sku,
                'es_critico': es_critico,
                'apariciones_kardex': ultimos_ajustes.count(),
                'apariciones_faltante': apariciones_faltante,
                'apariciones_sobrante': apariciones_sobrante,
                'total_diferencias': total_diferencias,
                'valor_acumulado_diferencias': float(valor_acumulado),
                'precio_producto': precio_producto,
                'recomendacion': recomendacion
            }
        })

    except Exception as e:
        logger.error(f"Error verificando producto crítico: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error al verificar producto: {str(e)}'
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_kardex(request):
    """
    Obtiene métricas del dashboard de Kardex

    Retorna:
    - Último ajuste realizado
    - Productos críticos
    - Tendencias de diferencias
    - Métricas de precisión general
    """
    try:
        alias = get_data_base(request)
        if not alias:
            return Response({
                'success': False,
                'message': 'No se pudo identificar la base de datos del tenant'
            }, status=400)

        usuario = request.GET.get('usuario')
        subdominio = request.GET.get('subdominio')

        # Obtener usuario y sucursal
        from login.models import User
        try:
            user_obj = User.objects.using(alias).get(username=usuario)
            sucursal_id = getattr(user_obj, 'sucursal_id', None)
        except User.DoesNotExist:
            user_obj = None
            sucursal_id = None

        # Construir query
        queryset = KardexAjuste.objects.using(alias).all()
        if sucursal_id:
            queryset = queryset.filter(sucursal_id=sucursal_id)

        # Último ajuste
        ultimo_ajuste = queryset.order_by('-fecha_conteo').first()

        # Productos críticos (con diferencias en los últimos 5 ajustes)
        query_criticos = KardexDiferencia.objects.using(alias).values('producto').annotate(
            total_diferencias=Count('id'),
            total_faltantes=Count('id', filter=Q(tipo_diferencia='faltante'))
        ).filter(
            total_diferencias__gte=3
        ).order_by('-total_faltantes')[:10]

        productos_criticos = []
        for critico in query_criticos:
            try:
                producto = Producto.objects.using(alias).get(id=critico['producto'])
                productos_criticos.append({
                    'id': producto.id,
                    'nombre': producto.nombre,
                    'sku': producto.sku,
                    'stock_actual': producto.stock,
                    'precio': float(producto.precio) if producto.precio else 0,
                    'total_diferencias': critico['total_diferencias'],
                    'total_faltantes': critico['total_faltantes']
                })
            except Producto.DoesNotExist:
                pass

        # Métricas generales de precisión (últimos 6 meses)
        from datetime import timedelta
        fecha_seis_meses = timezone.now() - timedelta(days=180)
        ajustes_recientes = queryset.filter(fecha_conteo__gte=fecha_seis_meses)

        if ajustes_recientes.exists():
            promedio_precision = ajustes_recientes.aggregate(
                avg_precision=Avg('porcentaje_precision')
            )['avg_precision'] or 0
        else:
            promedio_precision = 0

        # Total diferencias por mes en los últimos 6 meses
        from django.db.models.functions import TruncMonth
        diferencias_por_mes = KardexDiferencia.objects.using(alias).filter(
            kardex__in=ajustes_recientes
        ).annotate(
            mes=TruncMonth('fecha_conteo')
        ).values('mes').annotate(
            total_diferencias=Count('id'),
            valor_total=Sum('valor_diferencia')
        ).order_by('-mes')[:6]

        return Response({
            'success': True,
            'data': {
                'ultimo_ajuste': {
                    'id': ultimo_ajuste.id if ultimo_ajuste else None,
                    'fecha': ultimo_ajuste.fecha_conteo.isoformat() if ultimo_ajuste else None,
                    'productos_cuadrados': ultimo_ajuste.productos_cuadrados if ultimo_ajuste else 0,
                    'productos_con_diferencia': ultimo_ajuste.productos_con_diferencia if ultimo_ajuste else 0,
                    'porcentaje_precision': float(ultimo_ajuste.porcentaje_precision) if ultimo_ajuste else 0,
                    'estado': ultimo_ajuste.estado if ultimo_ajuste else None
                } if ultimo_ajuste else None,
                'productos_criticos': productos_criticos,
                'metricas_generales': {
                    'promedio_precision_6meses': float(promedio_precision),
                    'total_ajustes_6meses': ajustes_recientes.count(),
                    'diferencias_por_mes': list(diferencias_por_mes)
                }
            }
        })

    except Exception as e:
        logger.error(f"Error obteniendo dashboard de Kardex: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error al obtener dashboard: {str(e)}'
        }, status=500)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def validar_ajuste_kardex(request, kardex_id):
    """
    Valida o rechaza un ajuste de Kardex pendiente
    Puede cambiar el estado y agregar observaciones

    Body esperado:
    {
        "usuario": "usuario",
        "token": "token",
        "subdominio": "subdominio",
        "estado": "validado" o "rechazado",
        "observaciones": "Observaciones de la validación"
    }
    """
    try:
        alias = get_data_base(request)
        if not alias:
            return Response({
                'success': False,
                'message': 'No se pudo identificar la base de datos del tenant'
            }, status=400)

        data = request.data
        usuario = data.get('usuario')
        token = data.get('token')
        subdominio = data.get('subdominio')
        nuevo_estado = data.get('estado')
        observaciones = data.get('observaciones', '')

        # Validar estado
        estados_validos = ['validado', 'rechazado', 'aplicado']
        if nuevo_estado not in estados_validos:
            return Response({
                'success': False,
                'message': f'Estado inválido. Debe ser uno de: {", ".join(estados_validos)}'
            }, status=400)

        # Buscar el ajuste
        try:
            kardex = KardexAjuste.objects.using(alias).get(id=kardex_id)
        except KardexAjuste.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Ajuste de Kardex no encontrado'
            }, status=404)

        # Verificar que esté pendiente
        if kardex.estado != 'pendiente':
            return Response({
                'success': False,
                'message': 'Este ajuste ya fue procesado anteriormente'
            }, status=400)

        # Obtener usuario que valida
        from login.models import User
        try:
            user_obj = User.objects.using(alias).get(username=usuario)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Usuario no encontrado'
            }, status=404)

        # Actualizar ajuste
        kardex.estado = nuevo_estado
        kardex.usuario_valido_id = user_obj.id
        kardex.fecha_validacion = timezone.now()
        kardex.observaciones = observaciones
        kardex.save(using=alias)

        # Si se valida, podrías automáticamente crear ajustes de inventario
        # Esto depende de tu lógica de negocio

        logger.info(f"Kardex {kardex_id} {nuevo_estado} por {usuario}")

        return Response({
            'success': True,
            'message': f'Ajuste de Kardex {nuevo_estado} correctamente',
            'kardex_id': kardex.id
        })

    except Exception as e:
        logger.error(f"Error validando ajuste de Kardex: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error al validar ajuste: {str(e)}'
        }, status=500)
