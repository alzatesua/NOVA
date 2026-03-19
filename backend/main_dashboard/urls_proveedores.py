# main_dashboard/urls_proveedores.py
"""
URLs para el módulo de Proveedores
"""
from django.urls import path
from . import views_proveedores

urlpatterns = [
    # Proveedores - CRUD básico
    path('proveedores/', views_proveedores.proveedores_list, name='proveedores_list'),
    path('proveedores/<int:proveedor_id>/', views_proveedores.proveedor_detalle, name='proveedor_detalle'),

    # Productos de proveedor
    path('proveedores/<int:proveedor_id>/productos/', views_proveedores.proveedor_productos, name='proveedor_productos'),

    # Contactos de proveedor
    path('proveedores/<int:proveedor_id>/contactos/', views_proveedores.proveedor_contactos, name='proveedor_contactos'),

    # Pedidos a proveedor
    path('proveedores/<int:proveedor_id>/pedidos/', views_proveedores.proveedor_pedidos, name='proveedor_pedidos'),

    # Documentos de proveedor
    path('proveedores/<int:proveedor_id>/documentos/', views_proveedores.proveedor_documentos, name='proveedor_documentos'),

    # Calificaciones de proveedor
    path('proveedores/<int:proveedor_id>/calificaciones/', views_proveedores.proveedor_calificaciones, name='proveedor_calificaciones'),

    # Reportes y estadísticas
    path('proveedores/reportes/', views_proveedores.proveedores_reportes, name='proveedores_reportes'),
]
