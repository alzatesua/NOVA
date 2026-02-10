# main_dashboard/urls_facturacion.py
from django.urls import path
from .views_facturacion import (
    ClienteViewSet,
    FormaPagoViewSet,
    FacturaViewSet,
)

# Cliente
cliente_list = ClienteViewSet.as_view({'get': 'list', 'post': 'create'})
cliente_detail = ClienteViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
cliente_buscar = ClienteViewSet.as_view({'post': 'buscar'})

# Forma Pago
forma_pago_list = FormaPagoViewSet.as_view({'post': 'list'})
forma_pago_detail = FormaPagoViewSet.as_view({'post': 'retrieve'})

# Factura
factura_list = FacturaViewSet.as_view({'get': 'list', 'post': 'create'})
factura_detail = FacturaViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update'
})
factura_productos_pos = FacturaViewSet.as_view({'post': 'productos_pos'})
factura_anular = FacturaViewSet.as_view({'post': 'anular'})
factura_ventas_hoy = FacturaViewSet.as_view({'get': 'ventas_hoy'})

app_name = 'facturacion_api'
urlpatterns = [
    # Clientes
    path('clientes/', cliente_list, name='cliente_list'),
    path('clientes/<int:pk>/', cliente_detail, name='cliente_detail'),
    path('clientes/buscar/', cliente_buscar, name='cliente_buscar'),

    # Formas de Pago
    path('formas-pago/', forma_pago_list, name='forma_pago_list'),
    path('formas-pago/<int:pk>/', forma_pago_detail, name='forma_pago_detail'),

    # Facturas
    path('facturas/', factura_list, name='factura_list'),
    path('facturas/<int:pk>/', factura_detail, name='factura_detail'),
    path('facturas/productos-pos/', factura_productos_pos, name='factura_productos_pos'),
    path('facturas/<int:pk>/anular/', factura_anular, name='factura_anular'),
    path('facturas/ventas-hoy/', factura_ventas_hoy, name='factura_ventas_hoy'),
]
