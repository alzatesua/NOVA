"""
Vistas para autenticación de e-commerce (multitenant).
Integra SimpleJWT con FacturacionTenantMixin.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
import logging

from .models import ClienteTienda, Cliente
from .serializers import (
    ClienteTiendaSerializer, RegistroSerializer,
    ActivarCuentaSerializer, SolicitarActivacionSerializer
)
from .views_facturacion import FacturacionTenantMixin

# SimpleJWT
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

logger = logging.getLogger(__name__)


# ============================================================
#                    LoginView (SimpleJWT)
# ============================================================
class LoginView(FacturacionTenantMixin, TokenObtainPairView):
    """
    POST /api/auth/login/

    Login de usuario usando SimpleJWT.

    Body:
    {
        "email": "cliente@ejemplo.com",
        "password": "Password123!"
    }
    """
    permission_classes = [AllowAny]
    # Usar nuestro serializer personalizado
    serializer_class = None  # Se asigna dinámicamente

    def get_serializer_class(self):
        """Retornar nuestro serializer personalizado"""
        from .serializers import TokenObtainPairSerializer
        return TokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        try:
            # Resolver tenant y agregar al context
            alias = self._resolve_alias(request)
            tienda = self._tenant_tienda

            # Actualizar el serializer context con tenant info
            serializer_context = self.get_serializer_context()
            serializer_context.update({
                'db_alias': alias,
                'tienda_id': tienda.id
            })

            return super().post(request, *args, **kwargs)

        except Exception as e:
            logger.error(f'Error en login: {str(e)}')
            return Response({
                'error': str(e)
            }, status=status.HTTP_401_UNAUTHORIZED)


# ============================================================
#                    RefreshTokenView (SimpleJWT)
# ============================================================
class RefreshTokenView(FacturacionTenantMixin, TokenRefreshView):
    """
    POST /api/auth/refresh/

    Renueva access token usando refresh token.

    Body:
    {
        "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            alias = self._resolve_alias(request)
            tienda = self._tenant_tienda

            # Actualizar el serializer context con tenant info
            from .serializers import TokenRefreshSerializer

            # Obtener el serializer context actual
            serializer_context = self.get_serializer_context()
            serializer_context.update({
                'db_alias': alias,
                'tienda_id': tienda.id
            })

            return super().post(request, *args, **kwargs)

        except Exception as e:
            logger.error(f'Error en refresh: {str(e)}')
            return Response({
                'error': 'Token inválido o expirado'
            }, status=status.HTTP_401_UNAUTHORIZED)


# ============================================================
#                    LogoutView
# ============================================================
class LogoutView(FacturacionTenantMixin, APIView):
    """
    POST /api/auth/logout/

    Invalida el refresh token (blacklist).

    Body:
    {
        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    """
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if not refresh_token:
                return Response({
                    'error': 'refresh_token requerido'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Usar el modelo BlacklistedToken para agregar a la blacklist
            from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken

            token = RefreshToken(refresh_token)

            # Crear entrada en blacklist
            BlacklistedToken.objects.create(
                token=str(token),
                blacklisted_at=timezone.now()
            )

            return Response({
                'mensaje': 'Sesión cerrada correctamente'
            }, status=status.HTTP_200_OK)
        except TokenError:
            return Response({
                'error': 'Token inválido o expirado'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f'Error en logout: {str(e)}')
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
#                    RegistroView (CASO A)
# ============================================================
class RegistroView(FacturacionTenantMixin, APIView):
    """
    POST /api/auth/register/

    Registro de nuevo usuario desde tienda (CASO A).

    Body:
    {
        "email": "cliente@ejemplo.com",
        "password": "Password123!",
        "password_confirm": "Password123!",

        // Opcionales: datos del cliente fiscal
        "tipo_persona": "NAT",
        "primer_nombre": "Juan",
        "apellidos": "Pérez",
        "telefono": "3001234567",
        "direccion": "Calle 123",
        "ciudad": "Bogotá"
    }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Resolver tenant SIN requerir autenticación (require_auth=False)
            alias = self._resolve_alias(request, require_auth=False)
            serializer = RegistroSerializer(
                data=request.data,
                context={'db_alias': alias}
            )
            serializer.is_valid(raise_exception=True)

            usuario = serializer.save()

            # Generar tokens usando SimpleJWT
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(usuario)

            return Response({
                'mensaje': 'Registro exitoso',
                'user': ClienteTiendaSerializer(usuario, context={'db_alias': alias}).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f'Error en registro: {str(e)}')
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
#                    UsuarioActualView
# ============================================================
class UsuarioActualView(FacturacionTenantMixin, APIView):
    """
    GET /api/auth/me/

    Obtiene información del usuario autenticado.
    """
    def get(self, request):
        try:
            alias = self._resolve_alias(request)

            # Obtener usuario desde el token
            usuario = self._get_usuario_from_token(request, alias)

            if not usuario:
                return Response({
                    'error': 'Token inválido o expirado'
                }, status=status.HTTP_401_UNAUTHORIZED)

            serializer = ClienteTiendaSerializer(
                usuario,
                context={'db_alias': alias}
            )

            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f'Error obteniendo usuario: {str(e)}')
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    def _get_usuario_from_token(self, request, alias):
        """Extrae usuario desde token JWT"""
        import jwt
        from django.conf import settings

        # Obtener token desde Authorization header o query params
        auth_header = request.headers.get('Authorization', '')
        token = None

        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
        else:
            token = request.query_params.get('token') or request.data.get('access')

        if not token:
            return None

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id') or payload.get('user_id')

            if user_id:
                return ClienteTienda.objects.using(alias).get(pk=user_id)
        except Exception as e:
            logger.error(f'Error decodificando token: {str(e)}')
            return None


# ============================================================
#                    ActivarCuentaView (CASO B)
# ============================================================
class ActivarCuentaView(FacturacionTenantMixin, APIView):
    """
    POST /api/auth/activate-account/

    Activa cuenta para cliente fiscal existente (CASO B).

    Body:
    {
        "email": "cliente@ejemplo.com",
        "numero_documento": "12345678",
        "password": "Password123!",
        "password_confirm": "Password123!"
    }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            alias = self._resolve_alias(request)
            serializer = ActivarCuentaSerializer(
                data=request.data,
                context={'db_alias': alias}
            )
            serializer.is_valid(raise_exception=True)

            usuario = serializer.save()

            # Generar tokens usando SimpleJWT
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(usuario)

            return Response({
                'mensaje': 'Cuenta activada exitosamente',
                'user': ClienteTiendaSerializer(usuario, context={'db_alias': alias}).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f'Error en activación: {str(e)}')
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
#                    SolicitarActivacionView
# ============================================================
class SolicitarActivacionView(FacturacionTenantMixin, APIView):
    """
    POST /api/auth/request-activation/

    Solicita código de activación (envía email).

    Body:
    {
        "email": "cliente@ejemplo.com"
    }

    En un sistema real:
    1. Genera código único
    2. Envía email con enlace de activación
    3. Almacena código temporal

    Por ahora, retorna confirmación.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            alias = self._resolve_alias(request)
            serializer = SolicitarActivacionSerializer(
                data=request.data,
                context={'db_alias': alias}
            )
            serializer.is_valid(raise_exception=True)

            email = serializer.validated_data['email']

            # TODO: Implementar envío real de email
            # Por ahora, retornamos confirmación

            return Response({
                'mensaje': f'Se ha enviado un correo a {email} con las instrucciones de activación.',
                'email': email
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f'Error solicitando activación: {str(e)}')
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
