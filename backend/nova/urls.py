# ROOT urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from nova.views import TipoDocumentoViewSet, crear_tienda, test_enviar_correo
from . import views

router = DefaultRouter()
router.register(r'tipos-documento', TipoDocumentoViewSet, basename='tipodocumento')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/tiendas/', crear_tienda, name='crear_tienda'),
    path('api/validar/', include('login.urls')),

    # Analytics API
    path('api/analytics/', include('analytics.urls')),

    # tus includes existentes (si los necesitas)
    path('api/obtener/datos/', include('main_dashboard.urls')),
    path('api/actualizar/datos/', include('main_dashboard.urls')),
    path('api/crear/datos/', include('main_dashboard.urls')),
    path('api/crear/nuevos/', include('main_dashboard.urls')),
    path('api/subir/', include('main_dashboard.urls')),

    # >>>>> SOLO UNA VEZ montas el API DRF <<<<<
    path('api/', include(router.urls)),  # Add router before urls_traslados to avoid conflicts
    path('api/', include('main_dashboard.urls')),  # Incluir rutas de productos e-commerce
    path('api/', include('main_dashboard.urls_traslados')),
    path('api/facturacion/', include('main_dashboard.urls_facturacion')),

    path('api/refresh_custom/', views.refresh_token_custom_view),
    path('api/countries/', views.get_countries, name='get_countries'),
    path('api/regions/', views.get_regions, name='get_regions'),
    path('api/subregions/', views.get_subregions, name='get_subregions'),
    path('api/cities/', views.get_cities, name='get_cities'),
    path('api/activar-tienda/', views.activar_tienda, name='activar_tienda'),
    path("api/test-correo/", test_enviar_correo, name="test_correo"),
]

# Media files (solo en desarrollo o si DEBUG=True)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
