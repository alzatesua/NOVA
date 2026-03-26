# main_dashboard/urls_caja.py
"""
URLs para el módulo de Caja y Cuadre de Caja
"""
from django.urls import path
from .views_caja import (
    estadisticas_caja,
    listar_movimientos,
    listar_movimientos_caja_menor,
    balance_caja_menor,
    registrar_movimiento,
    cuadre_caja,
    realizar_arqueo,
    listar_sucursales_caja,
    verificar_estado_caja,
    abrir_caja,
    # Solicitudes de apertura
    crear_solicitud_apertura,
    listar_solicitudes_pendientes,
    aprobar_solicitud,
    rechazar_solicitud,
    listar_solicitudes_usuario,
)

app_name = 'caja_api'

urlpatterns = [
    # Estadísticas de caja (dashboard)
    path('estadisticas/', estadisticas_caja, name='estadisticas_caja'),

    # Listado de movimientos
    path('movimientos/', listar_movimientos, name='listar_movimientos'),

    # Listado de movimientos de caja menor
    path('movimientos_caja_menor/', listar_movimientos_caja_menor, name='listar_movimientos_caja_menor'),

    # Balance acumulado de caja menor
    path('balance_caja_menor/', balance_caja_menor, name='balance_caja_menor'),

    # Registrar movimiento (entrada/salida)
    path('registrar_movimiento/', registrar_movimiento, name='registrar_movimiento'),

    # Cuadre de caja completo
    path('cuadre/', cuadre_caja, name='cuadre_caja'),

    # Realizar arqueo
    path('realizar_arqueo/', realizar_arqueo, name='realizar_arqueo'),

    # Verificar estado de caja (abierta/cerrada)
    path('verificar_estado/', verificar_estado_caja, name='verificar_estado_caja'),

    # Abrir caja (solo admin)
    path('abrir_caja/', abrir_caja, name='abrir_caja'),

    # Listar sucursales (para el selector en el frontend)
    path('sucursales/', listar_sucursales_caja, name='listar_sucursales_caja'),

    # ========================================================================
    # Solicitudes de apertura de caja
    # ========================================================================
    # Crear solicitud de apertura (usuarios no-admin)
    path('solicitudes/crear/', crear_solicitud_apertura, name='crear_solicitud_apertura'),

    # Listar solicitudes pendientes (solo admins)
    path('solicitudes/pendientes/', listar_solicitudes_pendientes, name='listar_solicitudes_pendientes'),

    # Aprobar solicitud (solo admins)
    path('solicitudes/aprobar/', aprobar_solicitud, name='aprobar_solicitud'),

    # Rechazar solicitud (solo admins)
    path('solicitudes/rechazar/', rechazar_solicitud, name='rechazar_solicitud'),

    # Listar mis solicitudes (para ver el estado)
    path('solicitudes/mis_solicitudes/', listar_solicitudes_usuario, name='listar_solicitudes_usuario'),
]
