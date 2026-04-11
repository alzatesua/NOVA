"""
Views para el módulo de Analytics
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
from django.utils import timezone
from decimal import Decimal

from .services import VentasService, InventarioService, KPICalculator
from .serializers import (
    KPIsGeneralesSerializer,
    VentasTotalesSerializer,
    TendenciaVentasSerializer,
    TopProductoSerializer,
    VentasPorCategoriaSerializer,
    VentasPorSucursalSerializer,
    InventarioResumenSerializer,
    ProductoStockBajoSerializer,
    ProductoSinRotacionSerializer,
    ExistenciaPorBodegaSerializer,
    ComparativaPeriodosSerializer,
)


def _parse_fecha(request, field, default=None):
    """
    Helper para parsear fechas del request

    Args:
        request: Request object
        field: str - Nombre del campo
        default: datetime - Valor por defecto

    Returns:
        datetime
    """
    fecha_str = request.query_params.get(field)
    if fecha_str:
        try:
            return datetime.fromisoformat(fecha_str.replace('Z', '+00:00'))
        except ValueError:
            return default
    return default


def _get_sucursal_id(request):
    """Obtiene sucursal_id del request si existe"""
    sucursal_id = request.query_params.get('sucursal_id')
    return int(sucursal_id) if sucursal_id else None


def _resolve_tenant_alias(request):
    """
    Resuelve el alias de la base de datos del tenant desde el request.

    Args:
        request: Django request object

    Returns:
        str: Database alias for tenant

    Raises:
        ValueError: Si no se pueden obtener credenciales o tenant
    """
    from nova.models import Dominios
    from nova.utils.db import conectar_db_tienda

    # Obtener credenciales desde body o query params
    usuario = request.data.get('usuario') or request.query_params.get('usuario')
    token = request.data.get('token') or request.query_params.get('token')
    subdom = request.data.get('subdominio') or request.query_params.get('subdominio')

    # Si no hay subdominio, usar el host
    if not subdom:
        host = request.get_host().split(':')[0]
        subdom = host.split('.')[0].lower()

    if not usuario or not token:
        raise ValueError('usuario y token son requeridos (en body o querystring).')

    # Buscar tenant por Dominios y conectar
    dominio_obj = Dominios.objects.filter(
        dominio__icontains=subdom
    ).select_related('tienda').first()

    if not dominio_obj:
        raise ValueError('Dominio no válido.')

    tienda = dominio_obj.tienda
    alias = str(tienda.id)
    conectar_db_tienda(alias, tienda)

    return alias



@api_view(['GET'])
@permission_classes([AllowAny])
def kpis_generales(request):
    """
    GET /api/analytics/kpis/

    Retorna los KPIs generales del dashboard (últimos 30 días por defecto)

    Query params:
        - dias: int (default 30)
        - sucursal_id: int (opcional)
        - usuario: str (requerido)
        - token: str (requerido)
        - subdominio: str (opcional si se usa subdomain en Host)
    """
    try:
        # Resolve tenant
        alias = _resolve_tenant_alias(request)

        dias = int(request.query_params.get('dias', 30))
        sucursal_id = _get_sucursal_id(request)

        calculator = KPICalculator(sucursal_id=sucursal_id, db_alias=alias)
        kpis = calculator.calcular_kpis_generales(dias=dias)

        return Response(kpis, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response(
            {'error': f'Error de autenticación: {str(e)}'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        return Response(
            {'error': f'Error al calcular KPIs: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def ventas_totales(request):
    """
    GET /api/analytics/ventas/totales/

    Retorna métricas de ventas totales en un período

    Query params:
        - fecha_inicio: ISO date string (default: hace 30 días)
        - fecha_fin: ISO date string (default: hoy)
        - sucursal_id: int (opcional)
        - usuario: str (requerido)
        - token: str (requerido)
        - subdominio: str (opcional si se usa subdomain en Host)
    """
    try:
        # Resolve tenant
        alias = _resolve_tenant_alias(request)

        fecha_fin = _parse_fecha(request, 'fecha_fin', timezone.now())
        fecha_inicio = _parse_fecha(
            request, 'fecha_inicio',
            fecha_fin - timedelta(days=30)
        )
        sucursal_id = _get_sucursal_id(request)

        service = VentasService()
        metrics = service.obtener_ventas_totales(
            fecha_inicio, fecha_fin, sucursal_id, db_alias=alias
        )

        # Convertir Decimal a float para JSON
        for key in metrics:
            if isinstance(metrics[key], Decimal):
                metrics[key] = float(metrics[key])

        return Response(metrics, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response(
            {'error': f'Error de autenticación: {str(e)}'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        return Response(
            {'error': f'Error al obtener ventas totales: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def ventas_tendencia(request):
    """
    GET /api/analytics/ventas/tendencia/

    Retorna gráfico de tendencia de ventas (últimos N días)

    Query params:
        - dias: int (default 30)
        - sucursal_id: int (opcional)
        - usuario: str (requerido)
        - token: str (requerido)
        - subdominio: str (opcional si se usa subdomain en Host)
    """
    try:
        # Resolve tenant
        alias = _resolve_tenant_alias(request)

        dias = int(request.query_params.get('dias', 30))
        sucursal_id = _get_sucursal_id(request)

        service = VentasService()
        tendencia = service.obtener_tendencia_ventas(dias=dias, sucursal_id=sucursal_id, db_alias=alias)

        # Formatear fechas y convertir Decimals
        for punto in tendencia:
            punto['fecha'] = punto['fecha'].isoformat()
            if punto.get('total_ventas') and isinstance(punto['total_ventas'], Decimal):
                punto['total_ventas'] = float(punto['total_ventas'])

        return Response(tendencia, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response(
            {'error': f'Error de autenticación: {str(e)}'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        return Response(
            {'error': f'Error al obtener tendencia: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def ventas_top_productos(request):
    """
    GET /api/analytics/ventas/top-productos/

    Retorna top N productos más vendidos

    Query params:
        - dias: int (default 30)
        - limite: int (default 10)
        - sucursal_id: int (opcional)
        - usuario: str (requerido)
        - token: str (requerido)
        - subdominio: str (opcional si se usa subdomain en Host)
    """
    try:
        # Resolve tenant
        alias = _resolve_tenant_alias(request)

        dias = int(request.query_params.get('dias', 30))
        limite = int(request.query_params.get('limite', 10))
        sucursal_id = _get_sucursal_id(request)

        fecha_fin = timezone.now()
        fecha_inicio = fecha_fin - timedelta(days=dias)

        service = VentasService()
        top = service.obtener_top_productos(
            fecha_inicio, fecha_fin, limite, sucursal_id, db_alias=alias
        )

        # Convertir Decimals
        for producto in top:
            if producto.get('total_ventas') and isinstance(producto['total_ventas'], Decimal):
                producto['total_ventas'] = float(producto['total_ventas'])

        return Response(top, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response(
            {'error': f'Error de autenticación: {str(e)}'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        return Response(
            {'error': f'Error al obtener top productos: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def ventas_por_categoria(request):
    """
    GET /api/analytics/ventas/por-categoria/

    Retorna ventas agrupadas por categoría

    Query params:
        - dias: int (default 30)
        - sucursal_id: int (opcional)
        - usuario: str (requerido)
        - token: str (requerido)
        - subdominio: str (opcional si se usa subdomain en Host)
    """
    try:
        # Resolve tenant
        alias = _resolve_tenant_alias(request)

        dias = int(request.query_params.get('dias', 30))
        sucursal_id = _get_sucursal_id(request)

        fecha_fin = timezone.now()
        fecha_inicio = fecha_fin - timedelta(days=dias)

        service = VentasService()
        ventas = service.obtener_ventas_por_categoria(
            fecha_inicio, fecha_fin, sucursal_id, db_alias=alias
        )

        # Convertir Decimals
        for item in ventas:
            if isinstance(item.get('total_ventas'), Decimal):
                item['total_ventas'] = float(item['total_ventas'])

        return Response(ventas, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response(
            {'error': f'Error de autenticación: {str(e)}'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        return Response(
            {'error': f'Error al obtener ventas por categoría: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def ventas_por_sucursal(request):
    """
    GET /api/analytics/ventas/por-sucursal/

    Retorna ventas agrupadas por sucursal

    Query params:
        - dias: int (default 30)
        - usuario: str (requerido)
        - token: str (requerido)
        - subdominio: str (opcional si se usa subdomain en Host)
    """
    try:
        # Resolve tenant
        alias = _resolve_tenant_alias(request)

        dias = int(request.query_params.get('dias', 30))

        fecha_fin = timezone.now()
        fecha_inicio = fecha_fin - timedelta(days=dias)

        service = VentasService()
        ventas = service.obtener_ventas_por_sucursal(fecha_inicio, fecha_fin, db_alias=alias)

        # Convertir Decimals
        for item in ventas:
            if isinstance(item.get('total_ventas'), Decimal):
                item['total_ventas'] = float(item['total_ventas'])
            if isinstance(item.get('ticket_promedio'), Decimal):
                item['ticket_promedio'] = float(item['ticket_promedio'])

        return Response(ventas, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response(
            {'error': f'Error de autenticación: {str(e)}'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        return Response(
            {'error': f'Error al obtener ventas por sucursal: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def inventario_resumen(request):
    """
    GET /api/analytics/inventario/resumen/

    Retorna resumen general del inventario

    Query params:
        - sucursal_id: int (opcional)
        - usuario: str (requerido)
        - token: str (requerido)
        - subdominio: str (opcional si se usa subdomain en Host)
    """
    try:
        # Resolve tenant
        alias = _resolve_tenant_alias(request)

        sucursal_id = _get_sucursal_id(request)

        service = InventarioService()
        resumen = service.obtener_resumen_inventario(sucursal_id, db_alias=alias)

        return Response(resumen, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response(
            {'error': f'Error de autenticación: {str(e)}'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        return Response(
            {'error': f'Error al obtener resumen de inventario: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def inventario_stock_bajo(request):
    """
    GET /api/analytics/inventario/stock-bajo/

    Retorna productos con stock bajo

    Query params:
        - limite: int (default 50)
        - sucursal_id: int (opcional)
        - usuario: str (requerido)
        - token: str (requerido)
        - subdominio: str (opcional si se usa subdomain en Host)
    """
    try:
        # Resolve tenant
        alias = _resolve_tenant_alias(request)

        limite = int(request.query_params.get('limite', 50))
        sucursal_id = _get_sucursal_id(request)

        service = InventarioService()
        productos = service.obtener_productos_stock_bajo(sucursal_id, limite, db_alias=alias)

        return Response(productos, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response(
            {'error': f'Error de autenticación: {str(e)}'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        return Response(
            {'error': f'Error al obtener productos stock bajo: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def inventario_sin_rotacion(request):
    """
    GET /api/analytics/inventario/sin-rotacion/

    Retorna productos sin rotación (sin ventas en X días)

    Query params:
        - dias: int (default 30)
        - sucursal_id: int (opcional)
        - usuario: str (requerido)
        - token: str (requerido)
        - subdominio: str (opcional si se usa subdomain en Host)
    """
    try:
        # Resolve tenant
        alias = _resolve_tenant_alias(request)

        dias = int(request.query_params.get('dias', 30))
        sucursal_id = _get_sucursal_id(request)

        service = InventarioService()
        productos = service.obtener_productos_sin_rotacion(dias, sucursal_id, db_alias=alias)

        return Response(productos, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response(
            {'error': f'Error de autenticación: {str(e)}'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        return Response(
            {'error': f'Error al obtener productos sin rotación: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def inventario_por_bodega(request):
    """
    GET /api/analytics/inventario/por-bodega/

    Retorna existencias agrupadas por bodega

    Query params:
        - sucursal_id: int (opcional)
        - usuario: str (requerido)
        - token: str (requerido)
        - subdominio: str (opcional si se usa subdomain en Host)
    """
    try:
        # Resolve tenant
        alias = _resolve_tenant_alias(request)

        sucursal_id = _get_sucursal_id(request)

        service = InventarioService()
        existencias = service.obtener_existencias_por_bodega(sucursal_id, db_alias=alias)

        return Response(existencias, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response(
            {'error': f'Error de autenticación: {str(e)}'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        return Response(
            {'error': f'Error al obtener existencias por bodega: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def comparativa_periodos(request):
    """
    GET /api/analytics/comparativa-periodos/

    Compara período actual con el anterior

    Query params:
        - dias_actual: int (default 30)
        - dias_anterior: int (default 30)
        - sucursal_id: int (opcional)
        - usuario: str (requerido)
        - token: str (requerido)
        - subdominio: str (opcional si se usa subdomain en Host)
    """
    try:
        # Resolve tenant
        alias = _resolve_tenant_alias(request)

        dias_actual = int(request.query_params.get('dias_actual', 30))
        dias_anterior = int(request.query_params.get('dias_anterior', 30))
        sucursal_id = _get_sucursal_id(request)

        calculator = KPICalculator(sucursal_id=sucursal_id, db_alias=alias)
        comparativa = calculator.calcular_comparativa_periodos(dias_actual, dias_anterior)

        return Response(comparativa, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response(
            {'error': f'Error de autenticación: {str(e)}'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        return Response(
            {'error': f'Error al calcular comparativa: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def historial_login(request):
    """
    GET /api/analytics/historial-login/

    Retorna el historial de inicio y cierre de sesión de los usuarios

    Query params:
        - dias: int (default 30) - Últimos N días
        - usuario_id: int (opcional) - Filtrar por usuario específico
        - usuario: str (requerido)
        - token: str (requerido)
        - subdominio: str (opcional si se usa subdomain en Host)
    """
    try:
        from nova.models import Dominios
        from main_dashboard.models import HistorialLogin
        from django.db.models import Q, Count, Avg
        from django.utils import timezone
        from datetime import timedelta

        # Obtener credenciales desde query params
        usuario = request.query_params.get('usuario')
        token = request.query_params.get('token')
        subdom = request.query_params.get('subdominio')

        # Si no hay subdominio, usar el host
        if not subdom:
            host = request.get_host().split(':')[0]
            subdom = host.split('.')[0].lower()

        if not usuario or not token:
            return Response(
                {'error': 'usuario y token son requeridos'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Buscar tenant por Dominios
        dominio_obj = Dominios.objects.using('default').filter(
            dominio__icontains=subdom
        ).select_related('tienda').first()

        if not dominio_obj:
            return Response(
                {'error': 'Dominio no válido'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        tienda = dominio_obj.tienda

        # Obtener el alias de la base de datos del tenant
        alias = str(tienda.id)

        # Obtener parámetros
        dias = int(request.query_params.get('dias', 30))
        usuario_id = request.query_params.get('usuario_id')

        # Calcular rango de fechas
        fecha_fin = timezone.now()
        fecha_inicio = fecha_fin - timedelta(days=dias)

        # Construir query base usando la base de datos del tenant
        queryset = HistorialLogin.objects.using(alias).filter(
            fecha_hora_login__gte=fecha_inicio,
            fecha_hora_login__lte=fecha_fin
        )

        # Filtrar por usuario si se especifica
        if usuario_id:
            queryset = queryset.filter(usuario_id=usuario_id)

        # Ordenar por fecha descendente
        queryset = queryset.order_by('-fecha_hora_login')

        # Obtener datos
        historial = queryset.values(
            'id_historial',
            'fecha_hora_login',
            'fecha_hora_logout',
            'direccion_ip',
            'user_agent',
            'exitoso',
            'fallo_reason',
            'duracion_segundos',
            'usuario_id',
            'usuario_correo',
            'usuario_nombre'
        )

        # Formatear datos para respuesta
        historial_list = []
        for item in historial:
            historial_list.append({
                'id': item['id_historial'],
                'fecha_hora_login': item['fecha_hora_login'].isoformat() if item['fecha_hora_login'] else None,
                'fecha_hora_logout': item['fecha_hora_logout'].isoformat() if item['fecha_hora_logout'] else None,
                'direccion_ip': item['direccion_ip'] or 'Desconocida',
                'user_agent': item['user_agent'] or 'Desconocido',
                'exitoso': item['exitoso'],
                'fallo_reason': item['fallo_reason'],
                'duracion_segundos': item['duracion_segundos'],
                'usuario': item['usuario_nombre'],
                'correo_usuario': item['usuario_correo'],
                'rol': 'admin'  # Por defecto, puedes obtenerlo de nova.LoginUsuario si lo necesitas
            })

        # Calcular estadísticas para la gráfica
        # Logins por día
        from django.db.models import TruncDate
        logins_por_dia = queryset.annotate(
            fecha=TruncDate('fecha_hora_login')
        ).values('fecha').annotate(
            total_logins=Count('id_historial'),
            logins_exitosos=Count('id_historial', filter=Q(exitoso=True)),
            logins_fallidos=Count('id_historial', filter=Q(exitoso=False))
        ).order_by('fecha')

        # Formatear datos de gráfica
        grafica_data = []
        for item in logins_por_dia:
            grafica_data.append({
                'fecha': item['fecha'].isoformat() if item['fecha'] else None,
                'total_logins': item['total_logins'],
                'logins_exitosos': item['logins_exitosos'],
                'logins_fallidos': item['logins_fallidos']
            })

        # Calcular estadísticas agregadas
        stats = {
            'total_logins': queryset.count(),
            'logins_exitosos': queryset.filter(exitoso=True).count(),
            'logins_fallidos': queryset.filter(exitoso=False).count(),
            'sesiones_activas': queryset.filter(fecha_hora_logout__isnull=True).count(),
            'duracion_promedio': queryset.filter(
                duracion_segundos__isnull=False
            ).aggregate(promedio=Avg('duracion_segundos'))['promedio'] or 0
        }

        return Response({
            'historial': historial_list,
            'grafica': grafica_data,
            'estadisticas': stats
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': f'Error al obtener historial de login: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def test_insertar_historial_login(request):
    """
    POST /api/analytics/test-insertar-historial-login/

    Endpoint de prueba para insertar datos de prueba en historial_login

    Body:
        - usuario: str (requerido)
        - token: str (requerido)
        - subdominio: str (opcional)
        - cantidad: int (opcional, default=10) - Cantidad de registros a crear
    """
    try:
        from nova.models import Dominios
        from main_dashboard.models import HistorialLogin
        from django.utils import timezone
        from datetime import timedelta
        import random

        # Obtener credenciales
        usuario = request.data.get('usuario')
        token = request.data.get('token')
        subdom = request.data.get('subdominio')
        cantidad = int(request.data.get('cantidad', 10))

        # Si no hay subdominio, usar el host
        if not subdom:
            host = request.get_host().split(':')[0]
            subdom = host.split('.')[0].lower()

        if not usuario or not token:
            return Response(
                {'error': 'usuario y token son requeridos'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Buscar tenant por Dominios
        dominio_obj = Dominios.objects.using('default').filter(
            dominio__icontains=subdom
        ).select_related('tienda').first()

        if not dominio_obj:
            return Response(
                {'error': 'Dominio no válido'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        tienda = dominio_obj.tienda
        alias = str(tienda.id)

        # Datos de prueba
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        ]

        ips_de_prueba = ['192.168.1.100', '190.24.56.78', '181.132.45.67', '127.0.0.1']

        # Crear registros de prueba
        registros_creados = []
        fecha_base = timezone.now()

        for i in range(cantidad):
            # Fecha aleatoria en los últimos 30 días
            dias_atras = random.randint(0, 30)
            horas_atras = random.randint(0, 23)
            minutos_atras = random.randint(0, 59)

            fecha_login = fecha_base - timedelta(
                days=dias_atras,
                hours=horas_atras,
                minutos=minutos_atras
            )

            # Algunos registros tienen logout
            if random.random() > 0.3:  # 70% tiene logout
                duracion_minutos = random.randint(5, 480)
                fecha_logout = fecha_login + timedelta(minutes=duracion_minutos)
                duracion_segundos = duracion_minutos * 60
            else:
                fecha_logout = None
                duracion_segundos = None

            # 90% exitosos, 10% fallidos
            exitoso = random.random() < 0.9

            if not exitoso:
                fallo_reason = random.choice([
                    'Contraseña incorrecta',
                    'Usuario no encontrado',
                    'Cuenta inactiva',
                ])
            else:
                fallo_reason = None

            # Crear el registro
            registro = HistorialLogin.objects.using(alias).create(
                usuario_id=1,  # Asumimos que hay al menos un usuario con ID=1
                usuario_correo='admin@tienda.com',
                usuario_nombre='admin',
                fecha_hora_login=fecha_login,
                fecha_hora_logout=fecha_logout,
                direccion_ip=random.choice(ips_de_prueba),
                user_agent=random.choice(user_agents),
                exitoso=exitoso,
                fallo_reason=fallo_reason,
                duracion_segundos=duracion_segundos
            )

            registros_creados.append({
                'id': registro.id_historial,
                'fecha': registro.fecha_hora_login.isoformat(),
                'exitoso': registro.exitoso,
            })

        # Obtener estadísticas después de insertar
        total_registros = HistorialLogin.objects.using(alias).count()
        exitosos = HistorialLogin.objects.using(alias).filter(exitoso=True).count()
        fallidos = HistorialLogin.objects.using(alias).filter(exitoso=False).count()

        return Response({
            'success': True,
            'message': f'Se insertaron {cantidad} registros de prueba',
            'registros_creados': registros_creados,
            'estadisticas_finales': {
                'total_registros': total_registros,
                'logins_exitosos': exitosos,
                'logins_fallidos': fallidos,
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        import traceback
        return Response(
            {
                'error': f'Error al insertar datos de prueba: {str(e)}',
                'traceback': traceback.format_exc()
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
