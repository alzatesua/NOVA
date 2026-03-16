# main_dashboard/urls_mora.py
"""
URLs para el sistema de control de mora y lista negra de clientes
"""
from django.urls import path
from .views_mora import (
    verificar_mora_cliente,
    marcar_cliente_mora,
    quitar_mora_cliente,
    actualizar_usuario_registro_cliente,
    listar_clientes_en_mora,
    actualizar_dias_mora_todos,
    listar_clientes_con_deuda,
    resumen_deuda_cliente,
)

urlpatterns = [
    path('verificar/', verificar_mora_cliente, name='verificar_mora_cliente'),
    path('marcar/', marcar_cliente_mora, name='marcar_cliente_mora'),
    path('quitar/', quitar_mora_cliente, name='quitar_mora_cliente'),
    path('actualizar-usuario/', actualizar_usuario_registro_cliente, name='actualizar_usuario_registro_cliente'),
    path('listar/', listar_clientes_en_mora, name='listar_clientes_en_mora'),
    path('actualizar-todos/', actualizar_dias_mora_todos, name='actualizar_dias_mora_todos'),
    path('deuda/listar/', listar_clientes_con_deuda, name='listar_clientes_con_deuda'),
    path('deuda/resumen/', resumen_deuda_cliente, name='resumen_deuda_cliente'),
]
