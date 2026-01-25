import re
import logging

from django.conf import settings
from django.db import connections
from django.db.models import Q
from django.contrib.auth.hashers import check_password

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from nova.utils.db import conectar_db_tienda
from django.apps import apps

from nova.models import Tiendas, Dominios, LoginUsuario
from login.serializers import LoginSerializer



# ----------------------- LOGIN -----------------------

def autenticar_usuario(subdom, usuario, password):
    """
    Autentica al usuario contra la base de datos dinámica según subdominio.
    """
    # 1. Buscamos el dominio
    dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
    if not dominio_obj:
        raise ValueError("Dominio no válido")

    tienda = dominio_obj.tienda
    alias  = f"tienda_{tienda.id}"
    conectar_db_tienda(alias, tienda)

    # 2. Cargamos el modelo de usuario
    LoginUsuario = apps.get_model('nova', 'LoginUsuario')
    try:
        user = LoginUsuario.objects.using(alias).get(usuario=usuario)
    except LoginUsuario.DoesNotExist:
        raise ValueError("Usuario no encontrado")

    # 3. Verificamos contraseña
    if not check_password(password, user.password):
        raise ValueError("Contraseña incorrecta")

    # 4. Validación de estado del usuario
    if not getattr(user, 'is_active', True):
        # Asumimos que el campo se llama `is_active`
        raise ValueError("Usuario inactivo")

    # 5. Validación de estado de la tienda
    if not tienda.es_activo:
        raise ValueError("Tienda inactiva")

    return user, tienda, dominio_obj


@api_view(['POST'])
def login_view(request):
    """
    Endpoint de login: recibe usuario, password y opcional subdominio.
    Si subdominio no se envía, se extrae del Host.
    """
    try:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario  = serializer.validated_data['usuario']
        password = serializer.validated_data['password']
        subdom   = serializer.validated_data.get('subdominio')

        # Extrae subdominio del Host si no se proporciona
        if not subdom:
            host   = request.get_host().split(':')[0]
            subdom = host.split('.')[0].lower()

        if not subdom:
            return Response({'error': 'Subdominio no proporcionado'}, status=status.HTTP_400_BAD_REQUEST)

        user, tienda, dominio_obj = autenticar_usuario(subdom, usuario, password)
        sucursal = user.id_sucursal_default
        refresh = RefreshToken.for_user(user)
        return Response({
            'message':   'Login exitoso',
            'usuario':   user.usuario,
            'id_tienda': tienda.id,
            'dominio':   dominio_obj.dominio,
            'access':    str(refresh.access_token),
            'refresh':   str(refresh),
            "rol": user.rol,
            "tienda": tienda.nombre_tienda,
            "tienda_slug": tienda.slug,
            "token_usuario": user.token,
            'id_sucursal_default': sucursal.id if sucursal else None,
            'nombre_sucursal': sucursal.nombre if sucursal else None, 

        }, status=status.HTTP_200_OK)



    except ValueError as ve:
        return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback; traceback.print_exc()
        return Response(
            {'error': 'Error interno del servidor', 'detalle': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )




