# main_dashboard/urls_traslados.py
from django.urls import path
from .views import BodegaViewSet, ExistenciaViewSet, TrasladoViewSet, debug_inventario, ProductoExistenciasView

# Enlaces explícitos a los métodos del ViewSet
bodega_list     = BodegaViewSet.as_view({'get': 'list', 'post': 'create'})
bodega_detail   = BodegaViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})

existencia_list     = ExistenciaViewSet.as_view({'get': 'list', 'post': 'create'})
existencia_detail   = ExistenciaViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})
existencia_ajustar  = ExistenciaViewSet.as_view({'post': 'ajustar'})

traslado_list     = TrasladoViewSet.as_view({'get': 'list', 'post': 'create'})
traslado_detail   = TrasladoViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})
traslado_enviar   = TrasladoViewSet.as_view({'post': 'enviar'})
traslado_recibir  = TrasladoViewSet.as_view({'post': 'recibir'})
traslado_cancelar = TrasladoViewSet.as_view({'post': 'cancelar'})
por_destino = TrasladoViewSet.as_view({'post': 'por_destino'})

app_name = 'main_dashboard_api'
urlpatterns = [
    path('bodegas/', bodega_list, name='bodega_list'),
    path('bodegas/<int:pk>/', bodega_detail, name='bodega_detail'),

    path('existencias/', existencia_list, name='existencia_list'),
    path('existencias/<int:pk>/', existencia_detail, name='existencia_detail'),
    path('existencias/ajustar/', existencia_ajustar, name='existencia_ajustar'),

    path('traslados/', traslado_list, name='traslado_list'),
    path('traslados/<int:pk>/', traslado_detail, name='traslado_detail'),
    path('traslados/<int:pk>/enviar/',  traslado_enviar,  name='traslado_enviar'),
    path('traslados/<int:pk>/recibir/', traslado_recibir, name='traslado_recibir'),
    path('traslados/<int:pk>/cancelar/', traslado_cancelar, name='traslado_cancelar'),
    path('traslados/por-destino/', por_destino, name='traslado_por_destino'),
    
    path('productos-existencias/list/', ProductoExistenciasView.as_view(), name='productos_existencias_list'),  # ← AGREGAR ESTA LÍNEA

    path('debug/inventario/', debug_inventario),
]