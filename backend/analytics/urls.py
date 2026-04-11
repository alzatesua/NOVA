"""
URLs para el módulo de Analytics
"""
from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    # KPIs Generales
    path('kpis/', views.kpis_generales, name='kpis_generales'),

    # Ventas
    path('ventas/totales/', views.ventas_totales, name='ventas_totales'),
    path('ventas/tendencia/', views.ventas_tendencia, name='ventas_tendencia'),
    path('ventas/top-productos/', views.ventas_top_productos, name='ventas_top_productos'),
    path('ventas/por-categoria/', views.ventas_por_categoria, name='ventas_por_categoria'),
    path('ventas/por-sucursal/', views.ventas_por_sucursal, name='ventas_por_sucursal'),

    # Inventario
    path('inventario/resumen/', views.inventario_resumen, name='inventario_resumen'),
    path('inventario/stock-bajo/', views.inventario_stock_bajo, name='inventario_stock_bajo'),
    path('inventario/sin-rotacion/', views.inventario_sin_rotacion, name='inventario_sin_rotacion'),
    path('inventario/por-bodega/', views.inventario_por_bodega, name='inventario_por_bodega'),

    # Comparativa
    path('comparativa-periodos/', views.comparativa_periodos, name='comparativa_periodos'),

    # Historial de Login
    path('historial-login/', views.historial_login, name='historial_login'),

    # Test: Insertar datos de prueba en historial
    path('test-insertar-historial-login/', views.test_insertar_historial_login, name='test_insertar_historial_login'),
]
