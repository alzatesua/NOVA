from django.urls import path
from .views import login_view, bodegas_por_sucursal

urlpatterns = [
    path('', login_view, name='login'),
    path('bodegas/', bodegas_por_sucursal, name='bodegas_por_sucursal'),
]
