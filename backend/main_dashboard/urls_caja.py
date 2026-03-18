# main_dashboard/urls_caja.py
"""
URLs para el módulo de Caja y Cuadre de Caja
"""
from django.urls import path
from .views_caja import (
    estadisticas_caja,
    listar_movimientos,
    listar_movimientos_caja_menor,
    registrar_movimiento,
    cuadre_caja,
    realizar_arqueo,
    listar_sucursales_caja,
)

app_name = 'caja_api'

urlpatterns = [
    # Estadísticas de caja (dashboard)
    path('estadisticas/', estadisticas_caja, name='estadisticas_caja'),

    # Listado de movimientos
    path('movimientos/', listar_movimientos, name='listar_movimientos'),

    # Listado de movimientos de caja menor
    path('movimientos_caja_menor/', listar_movimientos_caja_menor, name='listar_movimientos_caja_menor'),

    # Registrar movimiento (entrada/salida)
    path('registrar_movimiento/', registrar_movimiento, name='registrar_movimiento'),

    # Cuadre de caja completo
    path('cuadre/', cuadre_caja, name='cuadre_caja'),

    # Realizar arqueo
    path('realizar_arqueo/', realizar_arqueo, name='realizar_arqueo'),

    # Listar sucursales (para el selector en el frontend)
    path('sucursales/', listar_sucursales_caja, name='listar_sucursales_caja'),
]
