# main_dashboard/urls_cupones.py
from django.urls import path
from .views_cupones import CuponViewSet, ClienteCuponViewSet

# --- Cupones ---
cupon_list   = CuponViewSet.as_view({'get': 'list',     'post': 'create'})
cupon_detail = CuponViewSet.as_view({
    'get': 'retrieve', 'put': 'update',
    'patch': 'partial_update', 'delete': 'destroy'
})
cupon_clientes_tienda = CuponViewSet.as_view({'get': 'listar_clientes_tienda'})

# --- ClienteCupones ---
cliente_cupon_list   = ClienteCuponViewSet.as_view({'get': 'list', 'post': 'create'})
cliente_cupon_detail = ClienteCuponViewSet.as_view({
    'get': 'retrieve', 'put': 'update',
    'patch': 'partial_update', 'delete': 'destroy'
})
cliente_cupon_usar      = ClienteCuponViewSet.as_view({'post': 'usar'})
cliente_cupon_por_cliente = ClienteCuponViewSet.as_view({'get': 'por_cliente'})
cliente_cupon_mis_cupones = ClienteCuponViewSet.as_view({'get': 'mis_cupones', 'post': 'mis_cupones'})

app_name = 'cupones_api'
urlpatterns = [
    # Cupones maestro
    path('', cupon_list, name='cupon_list'),
    path('<int:pk>/', cupon_detail, name='cupon_detail'),
    path('clientes-tienda/', cupon_clientes_tienda, name='cupon_clientes_tienda'),

    # Asignaciones cliente-cupón
    path('cliente-cupones/', cliente_cupon_list, name='cliente_cupon_list'),
    path('cliente-cupones/<int:pk>/', cliente_cupon_detail, name='cliente_cupon_detail'),
    path('cliente-cupones/<int:pk>/usar/', cliente_cupon_usar, name='cliente_cupon_usar'),
    path('cliente-cupones/cliente/<int:cliente_id>/', cliente_cupon_por_cliente, name='cliente_cupon_por_cliente'),
    path('cliente-cupones/mis-cupones/', cliente_cupon_mis_cupones, name='cliente_cupon_mis_cupones'),
]
