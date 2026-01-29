"""
Serializers para el módulo de Analytics
"""
from rest_framework import serializers
from datetime import datetime
from decimal import Decimal


class KPIsGeneralesSerializer(serializers.Serializer):
    """Serializer para KPIs generales del dashboard"""
    periodo = serializers.DictField()
    ventas = serializers.DictField()
    inventario = serializers.DictField()
    alertas = serializers.DictField()
    tendencia_ventas = serializers.ListField()


class VentasTotalesSerializer(serializers.Serializer):
    """Serializer para métricas de ventas totales"""
    total_ventas = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    cantidad_facturas = serializers.IntegerField(read_only=True)
    total_subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_descuentos = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_iva = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    ticket_promedio = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)


class TendenciaVentasSerializer(serializers.Serializer):
    """Serializer para tendencia de ventas"""
    fecha = serializers.DateField(read_only=True)
    total_ventas = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    cantidad_facturas = serializers.IntegerField(read_only=True)


class TopProductoSerializer(serializers.Serializer):
    """Serializer para top productos vendidos"""
    producto_id = serializers.IntegerField(read_only=True)
    producto_nombre = serializers.CharField(read_only=True)
    producto_sku = serializers.CharField(read_only=True)
    cantidad_vendida = serializers.IntegerField(read_only=True)
    total_ventas = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)


class VentasPorCategoriaSerializer(serializers.Serializer):
    """Serializer para ventas por categoría"""
    categoria = serializers.CharField(read_only=True)
    total_ventas = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    cantidad_productos = serializers.IntegerField(read_only=True)


class VentasPorSucursalSerializer(serializers.Serializer):
    """Serializer para ventas por sucursal"""
    sucursal_id = serializers.IntegerField(read_only=True)
    sucursal__nombre = serializers.CharField(read_only=True)
    total_ventas = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    cantidad_facturas = serializers.IntegerField(read_only=True)
    ticket_promedio = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)


class InventarioResumenSerializer(serializers.Serializer):
    """Serializer para resumen de inventario"""
    total_productos = serializers.IntegerField(read_only=True)
    total_unidades = serializers.IntegerField(read_only=True)
    total_reservado = serializers.IntegerField(read_only=True)
    unidades_disponibles = serializers.IntegerField(read_only=True)
    valor_inventario = serializers.FloatField(read_only=True)


class ProductoStockBajoSerializer(serializers.Serializer):
    """Serializer para productos con stock bajo"""
    id = serializers.IntegerField(read_only=True)
    nombre = serializers.CharField(read_only=True)
    sku = serializers.CharField(read_only=True)
    stock_actual = serializers.IntegerField(read_only=True)
    precio = serializers.FloatField(read_only=True)
    categoria = serializers.CharField(allow_null=True, read_only=True)
    marca = serializers.CharField(allow_null=True, read_only=True)


class ProductoSinRotacionSerializer(serializers.Serializer):
    """Serializer para productos sin rotación"""
    id = serializers.IntegerField(read_only=True)
    nombre = serializers.CharField(read_only=True)
    sku = serializers.CharField(read_only=True)
    stock_actual = serializers.IntegerField(read_only=True)
    valor_stock = serializers.FloatField(read_only=True)
    categoria = serializers.CharField(allow_null=True, read_only=True)


class ExistenciaPorBodegaSerializer(serializers.Serializer):
    """Serializer para existencias por bodega"""
    bodega_id = serializers.IntegerField(read_only=True)
    bodega_nombre = serializers.CharField(read_only=True)
    sucursal = serializers.CharField(allow_null=True, read_only=True)
    total_productos = serializers.IntegerField(read_only=True)
    total_unidades = serializers.IntegerField(read_only=True)
    unidades_disponibles = serializers.IntegerField(read_only=True)


class ComparativaPeriodosSerializer(serializers.Serializer):
    """Serializer para comparativa de períodos"""
    periodo_actual = serializers.DictField()
    periodo_anterior = serializers.DictField()
    variacion = serializers.DictField()
