# main_dashboard/urls.py

from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from .views import (
    obtener_info_tienda,
    obtener_info_tienda_sin_filtro,
    crear_sucursal,
    crear_operario,
    actualizar_datos_tienda,
    crear_producto_tienda,
    crear_categoria_tienda,
    crear_marca_tienda,
    crear_iva_tienda,
    subir_imagen_producto,
    obtener_imagen,
    crear_descuento,
    crear_medida,
    buscar_en_tabla,
    ProductoExistenciasView,  # ← Cambiar de ViewSet a View
)

# Router DRF
router = DefaultRouter()
# REMOVER esta línea:
# router.register(r'productos-existencias', ProductoExistenciasViewSet, basename='productos-existencias')

urlpatterns = [
    path('info-tienda/', obtener_info_tienda, name='info_tienda'),
    path('info-tienda-columna/', buscar_en_tabla, name='buscar_en_tabla'),
    path('all-info-tienda/', obtener_info_tienda_sin_filtro, name='info_tienda_sin_filtro'),
    path('sucursal/', crear_sucursal, name='crear_sucursal'),
    path('api/crear-operario/', crear_operario, name='crear_operario'),
    path('valores-tienda/', actualizar_datos_tienda, name='actualizar_datos_tienda'),
    path('productos-tienda/', crear_producto_tienda, name='crear_producto_tienda'),
    path('categorias-tienda/', crear_categoria_tienda, name='crear_categoria_tienda'),
    path('marcas/', crear_marca_tienda, name='crear_marca_tienda'),
    path('iva/', crear_iva_tienda, name='crear_iva_tienda'),
    path('descuentos/', crear_descuento, name='crear_descuento'),
    path('medida/', crear_medida, name='crear_medida'),

    path('<int:producto_id>/imagen-producto/', subir_imagen_producto, name='subir_imagen_producto'),
    path('obtener_imagen/', obtener_imagen, name='obtener_imagen'),
    
    # ← AGREGAR ESTA LÍNEA:
    path('productos-existencias/list/', ProductoExistenciasView.as_view(), name='productos_existencias_list'),
]

# Agregar rutas del ViewSet (si tienes otros ViewSets)
urlpatterns += router.urls

# Media
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)