# main_dashboard/urls_abonos.py
"""
URLs para la gestión de abonos a clientes en mora
"""
from django.urls import path
from .views_abonos import (
    listar_abonos_cliente,
    crear_abono,
    resumen_mora_cliente,
)

urlpatterns = [
    path('listar/<int:cliente_id>/', listar_abonos_cliente, name='listar_abonos_cliente'),
    path('crear/', crear_abono, name='crear_abono'),
    path('resumen/', resumen_mora_cliente, name='resumen_mora_cliente'),
]
