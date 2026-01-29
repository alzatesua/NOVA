"""
Calculadora de KPIs principales del dashboard
"""
from datetime import datetime, timedelta
from decimal import Decimal


class KPICalculator:
    """Calculadora de KPIs para el dashboard principal"""

    def __init__(self, sucursal_id=None):
        """
        Inicializa calculadora

        Args:
            sucursal_id: int (opcional) - Filtrar por sucursal
        """
        self.sucursal_id = sucursal_id
        self.ventas_service = __import__('analytics.services.ventas_service', fromlist=['VentasService']).VentasService()
        self.inventario_service = __import__('analytics.services.inventario_service', fromlist=['InventarioService']).InventarioService()

    def calcular_kpis_generales(self, dias=30):
        """
        Calcula los KPIs generales para el dashboard

        Args:
            dias: int - Período a analizar (default 30 días)

        Returns:
            dict con todos los KPIs calculados
        """
        fecha_fin = datetime.now()
        fecha_inicio = fecha_fin - timedelta(days=dias)

        # KPIs de Ventas
        ventas_metricas = self.ventas_service.obtener_ventas_totales(
            fecha_inicio, fecha_fin, self.sucursal_id
        )

        # KPIs de Inventario
        inventario_metricas = self.inventario_service.obtener_resumen_inventario(
            self.sucursal_id
        )

        # Productos con stock bajo
        stock_bajo = self.inventario_service.obtener_productos_stock_bajo(
            self.sucursal_id, limite=10
        )

        # Tendencia de ventas
        tendencia = self.ventas_service.obtener_tendencia_ventas(
            dias, self.sucursal_id
        )

        return {
            'periodo': {
                'dias': dias,
                'fecha_inicio': fecha_inicio.isoformat(),
                'fecha_fin': fecha_fin.isoformat(),
            },
            'ventas': ventas_metricas,
            'inventario': inventario_metricas,
            'alertas': {
                'productos_stock_bajo': len(stock_bajo),
            },
            'tendencia_ventas': tendencia,
        }

    def calcular_comparativa_periodos(self, dias_actual=30, dias_anterior=30):
        """
        Compara el período actual con el anterior

        Args:
            dias_actual: int - Días del período actual
            dias_anterior: int - Días del período anterior

        Returns:
            dict con comparativa
        """
        fecha_fin_actual = datetime.now()
        fecha_inicio_actual = fecha_fin_actual - timedelta(days=dias_actual)

        fecha_fin_anterior = fecha_inicio_actual - timedelta(days=1)
        fecha_inicio_anterior = fecha_fin_anterior - timedelta(days=dias_anterior)

        # Ventas período actual
        ventas_actual = self.ventas_service.obtener_ventas_totales(
            fecha_inicio_actual, fecha_fin_actual, self.sucursal_id
        )

        # Ventas período anterior
        ventas_anterior = self.ventas_service.obtener_ventas_totales(
            fecha_inicio_anterior, fecha_fin_anterior, self.sucursal_id
        )

        # Cálculo de variación porcentual
        variacion_ventas = self._calcular_variacion(
            ventas_actual['total_ventas'],
            ventas_anterior['total_ventas']
        )

        variacion_facturas = self._calcular_variacion(
            ventas_actual['cantidad_facturas'],
            ventas_anterior['cantidad_facturas']
        )

        return {
            'periodo_actual': {
                'ventas_totales': float(ventas_actual['total_ventas']),
                'cantidad_facturas': ventas_actual['cantidad_facturas'],
            },
            'periodo_anterior': {
                'ventas_totales': float(ventas_anterior['total_ventas']),
                'cantidad_facturas': ventas_anterior['cantidad_facturas'],
            },
            'variacion': {
                'ventas_porcentual': variacion_ventas,
                'facturas_porcentual': variacion_facturas,
            }
        }

    @staticmethod
    def _calcular_variacion(valor_actual, valor_anterior):
        """
        Calcula variación porcentual entre dos valores

        Args:
            valor_actual: Decimal
            valor_anterior: Decimal

        Returns:
            float - Variación porcentual
        """
        if valor_anterior == 0:
            return 100.0 if valor_actual > 0 else 0.0

        return float(((valor_actual - valor_anterior) / valor_anterior) * 100)
