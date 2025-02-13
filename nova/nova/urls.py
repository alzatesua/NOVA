"""
URL configuration for nova project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from .views import login_view, login_page, logout_view, logout_page, email_request, reset_password_confirm, recuperar_contrasena
urlpatterns = [
    path('', login_page),
    path('admin/', admin.site.urls),
    path('login/', login_page, name='login_page'),  # Muestra el HTML
    path('api/login/', login_view, name='login_api'),  # API para autenticación
    path('api/logout/', logout_view, name='logout'),
    path('logout/', logout_page, name='login_page'),  # Muestra el HTML
    path('api/restablecer-contrasena/', email_request, name='restablecer-contrasena'),
    path('api/reset-password-confirm/<uidb64>/<token>/', reset_password_confirm, name='peticion_restablecer'),
    path('pedir_cambio_contrasena/', recuperar_contrasena , name='recuperar_contrasena'),

]
