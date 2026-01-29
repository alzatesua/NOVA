"""
Views para el módulo de Analytics
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
from django.utils import timezone

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


@api_view(['GET'])
@permission_classes([AllowAny])
def kpis_generales(request):
    """
    GET /api/analytics/kpis/

    Retorna los KPIs generales del dashboard (últimos 30 días por defecto)

    Query params:
        - dias: int (default 30)
        - sucursal_id: int (opcional)
    """
    try:
        dias = int(request.query_params.get('dias', 30))
        sucursal_id = _get_sucursal_id(request)

        calculator = KPICalculator(sucursal_id=sucursal_id)
        kpis = calculator.calcular_kpis_generales(dias=dias)

        return Response(kpis, status=status.HTTP_200_OK)

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
    """
    try:
        fecha_fin = _parse_fecha(request, 'fecha_fin', timezone.now())
        fecha_inicio = _parse_fecha(
            request, 'fecha_inicio',
            fecha_fin - timedelta(days=30)
        )
        sucursal_id = _get_sucursal_id(request)

        service = VentasService()
        metrics = service.obtener_ventas_totales(
            fecha_inicio, fecha_fin, sucursal_id
        )

        # Convertir Decimal a float para JSON
        for key in metrics:
            if isinstance(metrics[key], Decimal):
                metrics[key] = float(metrics[key])

        return Response(metrics, status=status.HTTP_200_OK)

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
    """
    try:
        dias = int(request.query_params.get('dias', 30))
        sucursal_id = _get_sucursal_id(request)

        service = VentasService()
        tendencia = service.obtener_tendencia_ventas(dias=dias, sucursal_id=sucursal_id)

        # Formatear fechas y convertir Decimals
        for punto in tendencia:
            punto['fecha'] = punto['fecha'].isoformat()
            if punto.get('total_ventas') and isinstance(punto['total_ventas'], Decimal):
                punto['total_ventas'] = float(punto['total_ventas'])

        return Response(tendencia, status=status.HTTP_200_OK)

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
    """
    try:
        dias = int(request.query_params.get('dias', 30))
        limite = int(request.query_params.get('limite', 10))
        sucursal_id = _get_sucursal_id(request)

        fecha_fin = timezone.now()
        fecha_inicio = fecha_fin - timedelta(days=dias)

        service = VentasService()
        top = service.obtener_top_productos(
            fecha_inicio, fecha_fin, limite, sucursal_id
        )

        # Convertir Decimals
        for producto in top:
            if producto.get('total_ventas') and isinstance(producto['total_ventas'], Decimal):
                producto['total_ventas'] = float(producto['total_ventas'])

        return Response(top, status=status.HTTP_200_OK)

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
    """
    try:
        dias = int(request.query_params.get('dias', 30))
        sucursal_id = _get_sucursal_id(request)

        fecha_fin = timezone.now()
        fecha_inicio = fecha_fin - timedelta(days=dias)

        service = VentasService()
        ventas = service.obtener_ventas_por_categoria(
            fecha_inicio, fecha_fin, sucursal_id
        )

        # Convertir Decimals
        for item in ventas:
            if isinstance(item.get('total_ventas'), Decimal):
                item['total_ventas'] = float(item['total_ventas'])

        return Response(ventas, status=status.HTTP_200_OK)

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
    """
    try:
        dias = int(request.query_params.get('dias', 30))

        fecha_fin = timezone.now()
        fecha_inicio = fecha_fin - timedelta(days=dias)

        service = VentasService()
        ventas = service.obtener_ventas_por_sucursal(fecha_inicio, fecha_fin)

        # Convertir Decimals
        for item in ventas:
            if isinstance(item.get('total_ventas'), Decimal):
                item['total_ventas'] = float(item['total_ventas'])
            if isinstance(item.get('ticket_promedio'), Decimal):
                item['ticket_promedio'] = float(item['ticket_promedio'])

        return Response(ventas, status=status.HTTP_200_OK)

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
    """
    try:
        sucursal_id = _get_sucursal_id(request)

        service = InventarioService()
        resumen = service.obtener_resumen_inventario(sucursal_id)

        return Response(resumen, status=status.HTTP_200_OK)

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
    """
    try:
        limite = int(request.query_params.get('limite', 50))
        sucursal_id = _get_sucursal_id(request)

        service = InventarioService()
        productos = service.obtener_productos_stock_bajo(sucursal_id, limite)

        return Response(productos, status=status.HTTP_200_OK)

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
    """
    try:
        dias = int(request.query_params.get('dias', 30))
        sucursal_id = _get_sucursal_id(request)

        service = InventarioService()
        productos = service.obtener_productos_sin_rotacion(dias, sucursal_id)

        return Response(productos, status=status.HTTP_200_OK)

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
    """
    try:
        sucursal_id = _get_sucursal_id(request)

        service = InventarioService()
        existencias = service.obtener_existencias_por_bodega(sucursal_id)

        return Response(existencias, status=status.HTTP_200_OK)

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
    """
    try:
        dias_actual = int(request.query_params.get('dias_actual', 30))
        dias_anterior = int(request.query_params.get('dias_anterior', 30))
        sucursal_id = _get_sucursal_id(request)

        calculator = KPICalculator(sucursal_id=sucursal_id)
        comparativa = calculator.calcular_comparativa_periodos(dias_actual, dias_anterior)

        return Response(comparativa, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': f'Error al calcular comparativa: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
