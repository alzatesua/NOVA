# main_dashboard/views_ecommerce_clientes.py
"""
Vistas para la autenticación y gestión de clientes del e-commerce.
"""
import json
import logging
import uuid
from datetime import datetime, timedelta

from django.db import IntegrityError
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db.models import Q

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from nova.models import ClienteEcommerce, Tiendas

logger = logging.getLogger(__name__)


def get_tienda_from_request(request):
    """
    Obtiene la tienda basada en el subdominio de la solicitud.
    """
    host = request.get_host().split(':')[0]  # Remover puerto si existe

    # En desarrollo, permitir pasar la tienda como parámetro
    tienda_slug = request.GET.get('tienda') or request.headers.get('X-Tienda-Slug')

    if tienda_slug:
        try:
            return Tiendas.objects.get(slug=tienda_slug)
        except Tiendas.DoesNotExist:
            logger.warning(f"Tienda con slug {tienda_slug} no encontrada")
            return None

    # En producción, buscar por subdominio
    parts = host.split('.')
    if len(parts) > 2:
        subdomain = parts[0]
        try:
            from nova.models import Dominios
            dominio = Dominios.objects.select_related('tienda').get(dominio=subdomain)
            return dominio.tienda
        except:
            pass

    # Si no hay tienda específica, retornar None (cliente sin tienda asociada)
    return None


def create_jwt_token(user):
    """
    Crea tokens JWT para un usuario.
    """
    refresh = RefreshToken.for_user(user)

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def cliente_to_dict(cliente):
    """
    Convierte un ClienteEcommerce a diccionario para la respuesta JSON.
    """
    return {
        'id': cliente.id_cliente,
        'email': cliente.email,
        'telefono': cliente.telefono,
        'tipo_persona': cliente.tipo_persona,
        'primer_nombre': cliente.primer_nombre,
        'segundo_nombre': cliente.segundo_nombre,
        'apellidos': cliente.apellidos,
        'razon_social': cliente.razon_social,
        'direccion': cliente.direccion,
        'ciudad': cliente.ciudad,
        'is_active': cliente.is_active,
        'tienda': cliente.tienda.id if cliente.tienda else None,
    }


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def registro_cliente(request):
    """
    Registra un nuevo cliente de e-commerce.

    POST /api/ecommerce/clientes/registro/
    {
        "email": "cliente@example.com",
        "password": "password123",
        "password_confirm": "password123",
        "datos_cliente": {
            "tipo_persona": "NAT",
            "primer_nombre": "Juan",
            "apellidos": "Pérez",
            "telefono": "3001234567",
            "direccion": "Calle 123 #45-67"
        }
    }
    """
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        password_confirm = data.get('password_confirm', '')
        datos_cliente = data.get('datos_cliente', {})

        # Validaciones básicas
        if not email:
            return Response(
                {'detail': 'El email es obligatorio'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not password:
            return Response(
                {'detail': 'La contraseña es obligatoria'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(password) < 8:
            return Response(
                {'detail': 'La contraseña debe tener al menos 8 caracteres'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if password != password_confirm:
            return Response(
                {'detail': 'Las contraseñas no coinciden'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar si el email ya existe
        if ClienteEcommerce.objects.filter(email=email).exists():
            return Response(
                {'detail': 'Ya existe un usuario con este email'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener tienda (opcional)
        tienda = get_tienda_from_request(request)

        # Crear cliente
        cliente = ClienteEcommerce(
            email=email,
            telefono=datos_cliente.get('telefono', '')[:20] if datos_cliente.get('telefono') else '',
            tipo_persona=datos_cliente.get('tipo_persona', 'NAT'),
            primer_nombre=datos_cliente.get('primer_nombre', '')[:100] if datos_cliente.get('primer_nombre') else email.split('@')[0],
            segundo_nombre=datos_cliente.get('segundo_nombre', '')[:100] if datos_cliente.get('segundo_nombre') else None,
            apellidos=datos_cliente.get('apellidos', '')[:100] if datos_cliente.get('apellidos') else None,
            razon_social=datos_cliente.get('razon_social', '')[:255] if datos_cliente.get('razon_social') else None,
            direccion=datos_cliente.get('direccion', '') if datos_cliente.get('direccion') else None,
            ciudad=datos_cliente.get('ciudad', '')[:100] if datos_cliente.get('ciudad') else None,
            tienda=tienda,
            is_active=True,  # Activado automáticamente para simplificar
            token_activacion=str(uuid.uuid4())
        )
        cliente.set_password(password)
        cliente.save()

        # Generar tokens
        tokens = create_jwt_token(cliente)

        logger.info(f"Nuevo cliente registrado: {email}")

        return Response({
            'detail': 'Usuario registrado correctamente',
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'user': cliente_to_dict(cliente)
        }, status=status.HTTP_201_CREATED)

    except json.JSONDecodeError:
        return Response(
            {'detail': 'Error en el formato JSON'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.exception(f"Error en registro: {str(e)}")
        return Response(
            {'detail': f'Error al registrar usuario: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def login_cliente(request):
    """
    Inicia sesión de un cliente de e-commerce.

    POST /api/ecommerce/clientes/login/
    {
        "email": "cliente@example.com",
        "password": "password123"
    }
    """
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return Response(
                {'detail': 'Email y contraseña son obligatorios'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Buscar cliente
        cliente = ClienteEcommerce.objects.filter(email=email).first()

        if not cliente:
            return Response(
                {'detail': 'Credenciales inválidas'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Verificar contraseña
        if not cliente.check_password(password):
            return Response(
                {'detail': 'Credenciales inválidas'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Actualizar último login
        cliente.ultimo_login = timezone.now()
        cliente.save(update_fields=['ultimo_login'])

        # Generar tokens
        tokens = create_jwt_token(cliente)

        logger.info(f"Cliente inició sesión: {email}")

        return Response({
            'detail': 'Login exitoso',
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'user': cliente_to_dict(cliente)
        }, status=status.HTTP_200_OK)

    except json.JSONDecodeError:
        return Response(
            {'detail': 'Error en el formato JSON'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.exception(f"Error en login: {str(e)}")
        return Response(
            {'detail': f'Error al iniciar sesión: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def activar_cuenta_cliente(request):
    """
    Activa la cuenta de un cliente de e-commerce (opcional, para flujos que requieran activación).

    POST /api/ecommerce/clientes/activar-cuenta/
    {
        "email": "cliente@example.com",
        "password": "password123",
        "password_confirm": "password123"
    }
    """
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()

        # Buscar cliente
        cliente = ClienteEcommerce.objects.filter(email=email).first()

        if not cliente:
            return Response(
                {'detail': 'No existe un usuario con este email'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Si ya está activo
        if cliente.is_active:
            return Response(
                {'detail': 'La cuenta ya está activa'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Activar cuenta
        cliente.is_active = True
        cliente.token_activacion = None
        cliente.save()

        logger.info(f"Cuenta activada: {email}")

        return Response({
            'detail': 'Cuenta activada correctamente'
        }, status=status.HTTP_200_OK)

    except json.JSONDecodeError:
        return Response(
            {'detail': 'Error en el formato JSON'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.exception(f"Error en activación: {str(e)}")
        return Response(
            {'detail': f'Error al activar cuenta: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def logout_cliente(request):
    """
    Cierra la sesión de un cliente de e-commerce.

    POST /api/ecommerce/clientes/logout/
    Headers:
        Authorization: Bearer <access_token>
    """
    try:
        # En una implementación más completa, aquí se agregaría el token a una blacklist
        # Por ahora, simplemente retornamos éxito
        return Response({
            'detail': 'Logout exitoso'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.exception(f"Error en logout: {str(e)}")
        return Response(
            {'detail': f'Error al cerrar sesión: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def obtener_perfil(request):
    """
    Obtiene el perfil del cliente autenticado.

    GET /api/ecommerce/clientes/perfil/
    Headers:
        Authorization: Bearer <access_token>
    """
    try:
        # Por ahora, esta vista requiere que el cliente pase su email
        # En una implementación completa, se usaría el JWT token
        email = request.GET.get('email', '').strip().lower()

        if not email:
            return Response(
                {'detail': 'Email es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cliente = ClienteEcommerce.objects.filter(email=email).first()

        if not cliente:
            return Response(
                {'detail': 'Cliente no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            'user': cliente_to_dict(cliente)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.exception(f"Error al obtener perfil: {str(e)}")
        return Response(
            {'detail': f'Error al obtener perfil: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
