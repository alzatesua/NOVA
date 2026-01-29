"""
Servicio para cálculos de métricas de ventas
"""
from django.db import models
from django.db.models import Sum, Count, Avg, F, DecimalField
from django.db.models.functions import TruncDate, TruncDay, TruncMonth
from datetime import datetime, timedelta
from decimal import Decimal


class VentasService:
    """Servicio para métricas relacionadas con ventas"""

    @staticmethod
    def obtener_ventas_totales(fecha_inicio, fecha_fin, sucursal_id=None):
        """
        Obtiene las ventas totales en un período

        Args:
            fecha_inicio: datetime
            fecha_fin: datetime
            sucursal_id: int (opcional) - Filtrar por sucursal

        Returns:
            dict con métricas de ventas
        """
        from main_dashboard.models import Factura

        queryset = Factura.objects.filter(
            fecha_venta__range=(fecha_inicio, fecha_fin),
            estado='ACT'  # Solo facturas activas
        )

        if sucursal_id:
            queryset = queryset.filter(sucursal_id=sucursal_id)

        # Métricas agregadas
        aggregations = queryset.aggregate(
            total_ventas=Sum('total'),
            total_facturas=Count('id'),
            total_subtotal=Sum('subtotal'),
            total_descuento=Sum('total_descuento'),
            total_iva=Sum('total_iva'),
            ticket_promedio=Avg('total')
        )

        return {
            'total_ventas': aggregations['total_ventas'] or Decimal('0.00'),
            'cantidad_facturas': aggregations['total_facturas'] or 0,
            'total_subtotal': aggregations['total_subtotal'] or Decimal('0.00'),
            'total_descuentos': aggregations['total_descuento'] or Decimal('0.00'),
            'total_iva': aggregations['total_iva'] or Decimal('0.00'),
            'ticket_promedio': aggregations['ticket_promedio'] or Decimal('0.00'),
        }

    @staticmethod
    def obtener_tendencia_ventas(dias=30, sucursal_id=None):
        """
        Obtiene la tendencia de ventas por día

        Args:
            dias: int - Número de días a analizar
            sucursal_id: int (opcional)

        Returns:
            list de dict con ventas por día
        """
        from main_dashboard.models import Factura

        fecha_fin = datetime.now()
        fecha_inicio = fecha_fin - timedelta(days=dias)

        queryset = Factura.objects.filter(
            fecha_venta__range=(fecha_inicio, fecha_fin),
            estado='ACT'
        ).annotate(
            fecha=TruncDate('fecha_venta')
        ).values('fecha').annotate(
            total_ventas=Sum('total'),
            cantidad_facturas=Count('id')
        ).order_by('fecha')

        if sucursal_id:
            queryset = queryset.filter(sucursal_id=sucursal_id)

        return list(queryset)

    @staticmethod
    def obtener_top_productos(fecha_inicio, fecha_fin, limite=10, sucursal_id=None):
        """
        Obtiene los productos más vendidos

        Args:
            fecha_inicio: datetime
            fecha_fin: datetime
            limite: int - Cantidad de productos a retornar
            sucursal_id: int (opcional)

        Returns:
            list de dict con top productos
        """
        from main_dashboard.models import FacturaDetalle

        queryset = FacturaDetalle.objects.filter(
            factura__fecha_venta__range=(fecha_inicio, fecha_fin),
            factura__estado='ACT'
        ).values(
            'producto_id',
            'producto_nombre',
            'producto_sku'
        ).annotate(
            cantidad_vendida=Sum('cantidad'),
            total_ventas=Sum('total')
        ).order_by('-cantidad_vendida')[:limite]

        if sucursal_id:
            queryset = queryset.filter(factura__sucursal_id=sucursal_id)

        return list(queryset)

    @staticmethod
    def obtener_ventas_por_categoria(fecha_inicio, fecha_fin, sucursal_id=None):
        """
        Obtiene las ventas agrupadas por categoría

        Args:
            fecha_inicio: datetime
            fecha_fin: datetime
            sucursal_id: int (opcional)

        Returns:
            list de dict con ventas por categoría
        """
        from main_dashboard.models import FacturaDetalle, Producto

        queryset = FacturaDetalle.objects.filter(
            factura__fecha_venta__range=(fecha_inicio, fecha_fin),
            factura__estado='ACT'
        ).select_related('producto__categoria_id')

        if sucursal_id:
            queryset = queryset.filter(factura__sucursal_id=sucursal_id)

        # Agrupar por categoría
        resultados = {}
        for detalle in queryset:
            categoria = detalle.producto.categoria_id.nombre if detalle.producto.categoria_id else 'Sin categoría'
            if categoria not in resultados:
                resultados[categoria] = {
                    'categoria': categoria,
                    'total_ventas': Decimal('0.00'),
                    'cantidad_productos': 0
                }
            resultados[categoria]['total_ventas'] += detalle.total
            resultados[categoria]['cantidad_productos'] += detalle.cantidad

        return sorted(resultados.values(), key=lambda x: x['total_ventas'], reverse=True)

    @staticmethod
    def obtener_ventas_por_sucursal(fecha_inicio, fecha_fin):
        """
        Obtiene las ventas agrupadas por sucursal

        Args:
            fecha_inicio: datetime
            fecha_fin: datetime

        Returns:
            list de dict con ventas por sucursal
        """
        from main_dashboard.models import Factura

        queryset = Factura.objects.filter(
            fecha_venta__range=(fecha_inicio, fecha_fin),
            estado='ACT'
        ).values('sucursal_id', 'sucursal__nombre').annotate(
            total_ventas=Sum('total'),
            cantidad_facturas=Count('id'),
            ticket_promedio=Avg('total')
        ).order_by('-total_ventas')

        return list(queryset)
