"""
Servicio para cálculos de métricas de inventario
"""
from django.db.models import Sum, Count, Q, F
from django.db.models.functions import Coalesce
from datetime import datetime, timedelta
from decimal import Decimal


class InventarioService:
    """Servicio para métricas relacionadas con inventario"""

    @staticmethod
    def obtener_resumen_inventario(sucursal_id=None, db_alias='default'):
        """
        Obtiene resumen general del inventario

        Args:
            sucursal_id: int (opcional) - Filtrar por sucursal
            db_alias: str - Alias de la base de datos a utilizar

        Returns:
            dict con resumen de inventario
        """
        from main_dashboard.models import Producto, Existencia

        # Filtrar productos por sucursal si se especifica
        productos_qs = Producto.objects.using(db_alias).all()
        if sucursal_id:
            productos_qs = productos_qs.filter(sucursal_id=sucursal_id)

        # Total productos únicos
        total_productos = productos_qs.count()

        # Suma de stock total (usando el campo cacheado)
        stock_total = productos_qs.aggregate(
            total=Sum('stock')
        )['total'] or 0

        # Valor del inventario usando agregación (sin iterar)
        valor_data = productos_qs.aggregate(
            valor_total=Sum(F('stock') * F('precio'))
        )
        valor_inventario = valor_data['valor_total'] or Decimal('0.00')

        # Usar existencias para más precisión
        existencias_qs = Existencia.objects.using(db_alias).select_related('bodega__sucursal')
        if sucursal_id:
            existencias_qs = existencias_qs.filter(bodega__sucursal_id=sucursal_id)

        total_unidades = existencias_qs.aggregate(
            total=Sum('cantidad')
        )['total'] or 0

        total_reservado = existencias_qs.aggregate(
            total=Sum('reservado')
        )['total'] or 0

        return {
            'total_productos': total_productos,
            'total_unidades': total_unidades,
            'total_reservado': total_reservado,
            'unidades_disponibles': total_unidades - total_reservado,
            'valor_inventario': float(valor_inventario),
        }

    @staticmethod
    def obtener_productos_stock_bajo(sucursal_id=None, limite=50, db_alias='default'):
        """
        Obtiene productos con stock bajo

        Args:
            sucursal_id: int (opcional)
            limite: int - Stock mínimo para considerar como bajo
            db_alias: str - Alias de la base de datos a utilizar

        Returns:
            list de dict con productos stock bajo
        """
        from main_dashboard.models import Producto

        queryset = Producto.objects.using(db_alias).filter(
            stock__lt=limite
        ).select_related('categoria_id', 'marca_id').order_by('stock')

        if sucursal_id:
            queryset = queryset.filter(sucursal_id=sucursal_id)

        # Usar values() para evitar problemas con campos inexistentes
        productos_data = queryset.values(
            'id',
            'nombre',
            'sku',
            'stock',
            'precio',
            'categoria_id__nombre',
            'marca_id__nombre'
        )

        productos = []
        for prod in productos_data:
            productos.append({
                'id': prod['id'],
                'nombre': prod['nombre'],
                'sku': prod['sku'],
                'stock_actual': prod['stock'],
                'precio': float(prod['precio']),
                'categoria': prod.get('categoria_id__nombre'),
                'marca': prod.get('marca_id__nombre'),
            })

        return productos

    @staticmethod
    def obtener_productos_sin_rotacion(dias_sin_venta=30, sucursal_id=None, db_alias='default'):
        """
        Obtiene productos que no se han vendido en X días

        Args:
            dias_sin_venta: int - Días sin venta
            sucursal_id: int (opcional)
            db_alias: str - Alias de la base de datos a utilizar

        Returns:
            list de dict con productos sin rotación
        """
        from main_dashboard.models import Producto, FacturaDetalle

        fecha_limite = datetime.now() - timedelta(days=dias_sin_venta)

        # Encontrar productos que SÍ se vendieron
        productos_vendidos = FacturaDetalle.objects.using(db_alias).filter(
            factura__fecha_venta__gte=fecha_limite,
            factura__estado='ACT'
        ).values_list('producto_id', flat=True).distinct()

        # Productos que NO se vendieron - usar values()
        queryset = Producto.objects.using(db_alias).exclude(
            id__in=productos_vendidos
        ).select_related('categoria_id')

        if sucursal_id:
            queryset = queryset.filter(sucursal_id=sucursal_id)

        # Usar values() para evitar problemas
        productos_data = queryset.values(
            'id',
            'nombre',
            'sku',
            'stock',
            'precio',
            'categoria_id__nombre'
        )

        productos = []
        for prod in productos_data:
            productos.append({
                'id': prod['id'],
                'nombre': prod['nombre'],
                'sku': prod['sku'],
                'stock_actual': prod['stock'],
                'valor_stock': float(prod['precio'] * prod['stock']),
                'categoria': prod.get('categoria_id__nombre'),
            })

        return productos

    @staticmethod
    def obtener_existencias_por_bodega(sucursal_id=None, db_alias='default'):
        """
        Obtiene existencias agrupadas por bodega

        Args:
            sucursal_id: int (opcional)
            db_alias: str - Alias de la base de datos a utilizar

        Returns:
            list de dict con existencias por bodega
        """
        from main_dashboard.models import Existencia

        queryset = Existencia.objects.using(db_alias).select_related(
            'bodega',
            'bodega__sucursal',
            'producto'
        )

        if sucursal_id:
            queryset = queryset.filter(bodega__sucursal_id=sucursal_id)

        # Agrupar por bodega
        resultados = {}
        for existencia in queryset:
            bodega_key = existencia.bodega.id
            if bodega_key not in resultados:
                resultados[bodega_key] = {
                    'bodega_id': existencia.bodega.id,
                    'bodega_nombre': existencia.bodega.nombre,
                    'sucursal': existencia.bodega.sucursal.nombre if existencia.bodega.sucursal else None,
                    'total_productos': 0,
                    'total_unidades': 0,
                    'unidades_disponibles': 0,
                }

            resultados[bodega_key]['total_productos'] += 1
            resultados[bodega_key]['total_unidades'] += existencia.cantidad
            resultados[bodega_key]['unidades_disponibles'] += (existencia.cantidad - existencia.reservado)

        return sorted(resultados.values(), key=lambda x: x['total_unidades'], reverse=True)

    @staticmethod
    def obtener_traslados_periodo(fecha_inicio, fecha_fin, sucursal_id=None, db_alias='default'):
        """
        Obtiene traslados realizados en un período

        Args:
            fecha_inicio: datetime
            fecha_fin: datetime
            sucursal_id: int (opcional)
            db_alias: str - Alias de la base de datos a utilizar

        Returns:
            dict con estadísticas de traslados
        """
        from main_dashboard.models import Traslado

        queryset = Traslado.objects.using(db_alias).filter(
            fecha_creacion__range=(fecha_inicio, fecha_fin)
        )

        if sucursal_id:
            queryset = queryset.filter(
                Q(bodega_origen__sucursal_id=sucursal_id) |
                Q(bodega_destino__sucursal_id=sucursal_id)
            )

        # Contar por estado
        por_estado = queryset.values('estado').annotate(
            cantidad=Count('id')
        ).order_by('estado')

        return {
            'total_traslados': queryset.count(),
            'por_estado': list(por_estado),
        }
