# main_dashboard/urls_facturacion.py
# Rutas específicas para el módulo de facturación
# Estas rutas se incluyen en nova/urls.py con el prefijo 'api/facturacion/'

from django.urls import path
from .views import (
    buscar_cliente,
    crear_cliente,
    obtener_formas_pago,
    buscar_productos_pos,
    crear_factura,
    anular_factura,
    ventas_hoy,
    listar_facturas,
)

urlpatterns = [
    # Clientes
    path('clientes/buscar/', buscar_cliente, name='buscar_cliente'),
    path('clientes/', crear_cliente, name='crear_cliente'),

    # Formas de pago
    path('formas-pago/', obtener_formas_pago, name='obtener_formas_pago'),

    # Productos para POS
    path('facturas/productos-pos/', buscar_productos_pos, name='buscar_productos_pos'),

    # Facturas
    path('facturas/ventas-hoy/', ventas_hoy, name='ventas_hoy'),
    path('facturas/', listar_facturas, name='listar_facturas'),
    path('facturas/crear/', crear_factura, name='crear_factura'),
    path('facturas/<int:factura_id>/anular/', anular_factura, name='anular_factura'),
]
