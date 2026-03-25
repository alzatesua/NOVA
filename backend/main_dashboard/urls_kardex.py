"""
URL configuration for Kardex module
"""
from django.urls import path
from . import views_kardex

app_name = 'kardex'

urlpatterns = [
    path('guardar-ajuste/', views_kardex.guardar_ajuste_kardex, name='guardar_ajuste_kardex'),
    path('historial/', views_kardex.obtener_historial_kardex, name='obtener_historial_kardex'),
    path('producto/<int:producto_id>/es-critico/', views_kardex.verificar_producto_critico, name='verificar_producto_critico'),
    path('dashboard/', views_kardex.dashboard_kardex, name='dashboard_kardex'),
    path('validar/<int:kardex_id>/', views_kardex.validar_ajuste_kardex, name='validar_ajuste_kardex'),
]
