"""
URLs para el módulo de contactos.
"""
from django.urls import path
from .views_contacto import ContactoPublicView

contacto_enviar = ContactoPublicView.as_view()

app_name = 'contacto_api'
urlpatterns = [
    path('enviar/', contacto_enviar, name='contacto_enviar'),
]
