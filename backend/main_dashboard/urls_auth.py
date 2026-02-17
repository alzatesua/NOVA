"""
URLs para autenticación de e-commerce (multitenant).
"""
from django.urls import path
from .views_auth import (
    RegistroView, LoginView, RefreshTokenView, LogoutView,
    UsuarioActualView, ActivarCuentaView, SolicitarActivacionView
)

app_name = 'auth_api'
urlpatterns = [
    # Registro y login
    path('register/', RegistroView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),           # SimpleJWT
    path('refresh/', RefreshTokenView.as_view(), name='refresh'), # SimpleJWT
    path('logout/', LogoutView.as_view(), name='logout'),         # Blacklist

    # Obtener usuario actual
    path('me/', UsuarioActualView.as_view(), name='me'),

    # Activación de cuenta para clientes existentes
    path('activate-account/', ActivarCuentaView.as_view(), name='activate_account'),
    path('request-activation/', SolicitarActivacionView.as_view(), name='request_activation'),
]
