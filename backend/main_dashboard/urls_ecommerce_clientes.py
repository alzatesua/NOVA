# main_dashboard/urls_ecommerce_clientes.py
"""
URLs para la autenticación y gestión de clientes del e-commerce.
"""
from django.urls import path
from .views_ecommerce_clientes import (
    registro_cliente,
    login_cliente,
    activar_cuenta_cliente,
    logout_cliente,
    obtener_perfil,
)

app_name = 'ecommerce_clientes'

urlpatterns = [
    # Registro y autenticación
    path('ecommerce/clientes/registro/', registro_cliente, name='registro_cliente'),
    path('ecommerce/clientes/login/', login_cliente, name='login_cliente'),
    path('ecommerce/clientes/activar-cuenta/', activar_cuenta_cliente, name='activar_cuenta_cliente'),
    path('ecommerce/clientes/logout/', logout_cliente, name='logout_cliente'),

    # Perfil
    path('ecommerce/clientes/perfil/', obtener_perfil, name='obtener_perfil'),
]
