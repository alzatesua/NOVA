"""
Vistas para autenticación de e-commerce (multitenant).
Usa SimpleJWT para tokens y blacklist para logout.
"""
from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.core.exceptions import ValidationError
from django.db import transaction

from .models import ClienteTienda, Cliente
from .serializers import ClienteTiendaSerializer, ClienteSerializer
from nova.models import Dominios, Tiendas
from nova.utils.db import conectar_db_tienda
from multi_db_router import set_current_tienda_db


# ============================================================================
# SERIALIZADORES
# ============================================================================

class RegistroSerializer(serializers.Serializer):
    """Serializer para registro de usuarios de tienda"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, min_length=6)
    rol = serializers.CharField(default='cliente')

    def validate_email(self, value):
        """Verificar que el email no esté registrado"""
        db_alias = self.context.get('db_alias', 'default')
        if ClienteTienda.objects.using(db_alias).filter(email=value).exists():
            raise ValidationError("Este email ya está registrado")
        return value


class LoginSerializer(serializers.Serializer):
    """Serializer para login"""
    email = serializers.EmailField(required=True, help_text="Email del usuario")
    password = serializers.CharField(
        required=True,
        write_only=True,
        help_text="Contraseña del usuario",
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        # Obtener alias del tenant desde context
        alias = self.context.get('db_alias', 'default')

        email = attrs.get('email')
        password = attrs.get('password')

        # Buscar usuario en la BD del tenant
        try:
            user = ClienteTienda.objects.using(alias).get(email=email)

            # Verificar contraseña
            if user.check_password(password):
                # Verificar que esté activo o pendiente (ambos permiten login)
                if user.estado not in ['activo', 'pendiente']:
                    raise serializers.ValidationError({
                        'email': 'Esta cuenta no está activa.'
                    })
            else:
                raise serializers.ValidationError({
                    'email': 'Credenciales inválidas'
                })
        except ClienteTienda.DoesNotExist:
            raise serializers.ValidationError({
                'email': 'Credenciales inválidas'
            })

        # Guardar usuario en attrs para usar en la vista
        attrs['user'] = user
        return attrs


# ============================================================================
# VISTAS DE AUTENTICACIÓN
# ============================================================================

class RegistroView(APIView):
    """
    Registro de nuevo cliente de tienda (multitenant).

    POST /api/auth/register/
    Body:
        - email: Email del usuario
        - password: Contraseña (mínimo 6 caracteres)
        - rol: Rol del usuario (opcional, defecto: 'cliente')
        - subdominio: Subdominio de la tienda (REQUERIDO para desarrollo local)
        - ...campos adicionales del cliente fiscal (opcionales)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Obtener subdominio
            subdom = request.data.get('subdominio') or request.query_params.get('subdominio')

            if not subdom:
                return Response(
                    {'detail': 'El parámetro subdominio es requerido.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Resolver alias
            host = request.get_host().split(':')[0]
            subdominio = subdom if subdom else host.split('.')[0].lower()

            dominio_obj = Dominios.objects.filter(
                dominio__icontains=subdominio
            ).select_related('tienda').first()

            if not dominio_obj or not dominio_obj.tienda:
                return Response(
                    {'detail': 'Dominio no válido.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            tienda = dominio_obj.tienda
            alias = str(tienda.id)

            # Conectar a la BD de la tienda dinámicamente
            conectar_db_tienda(alias, tienda)

            # IMPORTANTE: Establecer la BD actual para el TiendaDatabaseRouter
            set_current_tienda_db({'alias': alias, 'tienda_id': tienda.id})

        except Exception as e:
            return Response({
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validar datos
        serializer = RegistroSerializer(data=request.data, context={'db_alias': alias})
        if not serializer.is_valid():
            return Response({
                'detail': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic(using=alias):
                from django.contrib.auth.hashers import make_password
                email = serializer.validated_data['email']
                password = serializer.validated_data['password']
                rol = serializer.validated_data.get('rol', 'cliente')

                # Crear usuario de tienda
                usuario = ClienteTienda(
                    email=email,
                    password=make_password(password),
                    rol=rol,
                    estado='activo'  # Usuario activo por defecto
                )
                usuario.save(using=alias)

                # Si se proporcionaron datos fiscales adicionales, crear/vincular Cliente
                cliente_data = {
                    'tipo_persona': request.data.get('tipo_persona'),
                    'tipo_documento': request.data.get('tipo_documento'),
                    'numero_documento': request.data.get('numero_documento'),
                    'correo': request.data.get('email'),
                    'telefono': request.data.get('telefono'),
                    'direccion': request.data.get('direccion'),
                    'ciudad': request.data.get('ciudad'),
                    'primer_nombre': request.data.get('primer_nombre'),
                    'segundo_nombre': request.data.get('segundo_nombre'),
                    'apellidos': request.data.get('apellidos'),
                    'razon_social': request.data.get('razon_social'),
                    'n_registro_mercantil': request.data.get('n_registro_mercantil'),
                }

                # Filtrar campos None Y vacíos
                cliente_data = {k: v for k, v in cliente_data.items() if v not in [None, '']}

                # VALIDACIÓN: NAT requiere nombre/apellidos, JUR requiere razón_social
                if cliente_data:
                    tipo_persona = cliente_data.get('tipo_persona', 'NAT')
                    crear_cliente = False

                    if tipo_persona == 'NAT':
                        crear_cliente = cliente_data.get('primer_nombre') or cliente_data.get('apellidos')
                    elif tipo_persona == 'JUR':
                        crear_cliente = cliente_data.get('razon_social') is not None

                    if crear_cliente:
                        try:
                            if cliente_data.get('numero_documento'):
                                cliente_existente = Cliente.objects.using(alias).filter(
                                    numero_documento=cliente_data['numero_documento']
                                ).first()
                                if cliente_existente:
                                    usuario.cliente = cliente_existente
                                else:
                                    nuevo_cliente = Cliente(**cliente_data)
                                    nuevo_cliente.save(using=alias)
                                    usuario.cliente = nuevo_cliente
                            else:
                                nuevo_cliente = Cliente(**cliente_data)
                                nuevo_cliente.save(using=alias)
                                usuario.cliente = nuevo_cliente
                            usuario.save(using=alias)
                        except Exception:
                            pass  # Si falla el cliente, continuamos sin él

                # Generar tokens
                refresh = RefreshToken.for_user(usuario)

                return Response({
                    'message': 'Usuario registrado exitosamente',
                    'user': ClienteTiendaSerializer(usuario).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    },
                    'tenant_info': {
                        'alias': alias,
                        'tienda_id': tienda.id,
                        'tienda_nombre': tienda.nombre_tienda,
                        'db_name': tienda.db_nombre
                    }
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'detail': f'Error al registrar: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    Login de usuario (multitenant).

    POST /api/auth/login/
    Body:
        - email: Email del usuario
        - password: Contraseña
        - subdominio: Subdominio de la tienda (REQUERIDO para desarrollo local)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Obtener subdominio
            subdom = request.data.get('subdominio') or request.query_params.get('subdominio')

            if not subdom:
                return Response(
                    {'detail': 'El parámetro subdominio es requerido.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Resolver alias
            host = request.get_host().split(':')[0]
            subdominio = subdom if subdom else host.split('.')[0].lower()

            dominio_obj = Dominios.objects.filter(
                dominio__icontains=subdominio
            ).select_related('tienda').first()

            if not dominio_obj or not dominio_obj.tienda:
                return Response(
                    {'detail': 'Dominio no válido.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            tienda = dominio_obj.tienda
            alias = str(tienda.id)

            # Conectar a la BD de la tienda dinámicamente
            conectar_db_tienda(alias, tienda)

            # IMPORTANTE: Establecer la BD actual para el TiendaDatabaseRouter
            set_current_tienda_db({'alias': alias, 'tienda_id': tienda.id})

        except Exception as e:
            return Response({
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validar credenciales con nuestro serializer
        serializer = LoginSerializer(
            data=request.data,
            context={'db_alias': alias}
        )

        if not serializer.is_valid():
            return Response({
                'detail': serializer.errors
            }, status=status.HTTP_401_UNAUTHORIZED)

        try:
            user = serializer.validated_data['user']

            # Actualizar ultimo_login
            user.ultimo_login = timezone.now()
            user.save(using=alias, update_fields=['ultimo_login'])

            # Generar tokens
            refresh = RefreshToken.for_user(user)

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': ClienteTiendaSerializer(user).data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class RefreshTokenView(APIView):
    """
    Renovar token de acceso sin validar contra modelo de usuario global.
    Esto permite que tokens de ClienteTienda (multitenant) funcionen.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        from rest_framework_simplejwt.serializers import TokenRefreshSerializer

        serializer = TokenRefreshSerializer(data=request.data)
        try:
            # Validar y refresh el token
            serializer.is_valid(raise_exception=True)
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        except InvalidToken as e:
            return Response({
                'detail': 'El refresh token no es válido o ha expirado'
            }, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({
                'detail': f'Error al renovar token: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    Cerrar sesión y agregar refresh token a blacklist.

    POST /api/auth/logout/
    Body:
        - refresh: Refresh token a invalidar
    Headers:
        - Authorization: Bearer <access_token>
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({
                    'detail': 'Refresh token requerido'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Invalidar el refresh token
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response({
                'message': 'Sesión cerrada exitosamente'
            }, status=status.HTTP_200_OK)

        except TokenError:
            return Response({
                'detail': 'Token inválido o ya expirado'
            }, status=status.HTTP_400_BAD_REQUEST)


class UsuarioActualView(APIView):
    """
    Obtener/Actualizar información del usuario autenticado.

    GET /api/auth/me/ - Obtener perfil
    PUT/PATCH /api/auth/me/ - Actualizar perfil
    Headers:
        - Authorization: Bearer <access_token>
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        serializer = ClienteTiendaSerializer(usuario)

        # Agregar información del cliente fiscal si está vinculado
        data = serializer.data
        if usuario.cliente:
            data['cliente_fiscal'] = ClienteSerializer(usuario.cliente).data

        return Response(data, status=status.HTTP_200_OK)

    def put(self, request):
        """Actualizar perfil del usuario"""
        usuario = request.user
        serializer = ClienteTiendaSerializer(
            usuario,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Perfil actualizado',
                'user': serializer.data
            }, status=status.HTTP_200_OK)

        return Response({
            'detail': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        """Actualización parcial del perfil"""
        return self.put(request)


class ActivarCuentaView(APIView):
    """
    Activar cuenta de cliente existente (multitenant).

    Permite activar clientes que ya existen en el sistema fiscal
    creando su cuenta de acceso a la tienda.

    POST /api/auth/activate-account/
    Body:
        - email: Email para la cuenta de acceso
        - numero_documento: Número de documento del cliente fiscal existente
        - password: Contraseña para la cuenta de acceso
        - password_confirm: Confirmación de contraseña
        - subdominio: Subdominio de la tienda (REQUERIDO)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Obtener subdominio
            subdom = request.data.get('subdominio') or request.query_params.get('subdominio')

            if not subdom:
                return Response(
                    {'detail': 'El parámetro subdominio es requerido.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Resolver alias
            host = request.get_host().split(':')[0]
            subdominio = subdom if subdom else host.split('.')[0].lower()

            dominio_obj = Dominios.objects.filter(
                dominio__icontains=subdominio
            ).select_related('tienda').first()

            if not dominio_obj or not dominio_obj.tienda:
                return Response(
                    {'detail': 'Dominio no válido.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            tienda = dominio_obj.tienda
            alias = str(tienda.id)

            # Conectar a la BD de la tienda dinámicamente
            conectar_db_tienda(alias, tienda)

            # IMPORTANTE: Establecer la BD actual para el TiendaDatabaseRouter
            set_current_tienda_db({'alias': alias, 'tienda_id': tienda.id})

        except Exception as e:
            return Response({
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        email = request.data.get('email')
        numero_documento = request.data.get('numero_documento')
        password = request.data.get('password')
        password_confirm = request.data.get('password_confirm')

        # Validaciones básicas
        if not email or not numero_documento or not password:
            return Response({
                'detail': 'Se requieren: email, numero_documento, password'
            }, status=status.HTTP_400_BAD_REQUEST)

        if password != password_confirm:
            return Response({
                'detail': 'Las contraseñas no coinciden'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Verificar que el email no esté ya registrado en esta tienda
        if ClienteTienda.objects.using(alias).filter(email=email).exists():
            return Response({
                'detail': 'El email ya tiene una cuenta activa en esta tienda'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Buscar cliente fiscal por documento
        cliente = Cliente.objects.using(alias).filter(
            numero_documento=numero_documento
        ).first()

        if not cliente:
            return Response({
                'detail': 'No se encontró un cliente con ese número de documento en esta tienda'
            }, status=status.HTTP_404_NOT_FOUND)

        # Crear cuenta de tienda
        try:
            from django.contrib.auth.hashers import make_password
            with transaction.atomic(using=alias):
                # Crear usuario manualmente
                usuario_tienda = ClienteTienda(
                    email=email,
                    password=make_password(password),
                    rol='cliente',
                    estado='activo',
                    cliente=cliente
                )
                # Guardar explícitamente en la BD del tenant
                usuario_tienda.save(using=alias)

                # Generar tokens
                refresh = RefreshToken.for_user(usuario_tienda)

                return Response({
                    'message': 'Cuenta activada exitosamente',
                    'user': ClienteTiendaSerializer(usuario_tienda).data,
                    'cliente_fiscal': ClienteSerializer(cliente).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class SolicitarActivacionView(APIView):
    """
    Solicitar código de activación para cuenta existente (multitenant).

    POST /api/auth/request-activation/
    Body:
        - email: Email del cliente
        - numero_documento: Número de documento del cliente
        - subdominio: Subdominio de la tienda (REQUERIDO)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Obtener subdominio
            subdom = request.data.get('subdominio') or request.query_params.get('subdominio')

            if not subdom:
                return Response(
                    {'detail': 'El parámetro subdominio es requerido.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Resolver alias
            host = request.get_host().split(':')[0]
            subdominio = subdom if subdom else host.split('.')[0].lower()

            dominio_obj = Dominios.objects.filter(
                dominio__icontains=subdominio
            ).select_related('tienda').first()

            if not dominio_obj or not dominio_obj.tienda:
                return Response(
                    {'detail': 'Dominio no válido.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            tienda = dominio_obj.tienda
            alias = str(tienda.id)

            # Conectar a la BD de la tienda dinámicamente
            conectar_db_tienda(alias, tienda)

            # IMPORTANTE: Establecer la BD actual para el TiendaDatabaseRouter
            set_current_tienda_db({'alias': alias, 'tienda_id': tienda.id})

        except Exception as e:
            return Response({
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        email = request.data.get('email')
        numero_documento = request.data.get('numero_documento')

        if not email or not numero_documento:
            return Response({
                'detail': 'Se requieren: email, numero_documento'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Verificar que el cliente existe en esta tienda
        cliente = Cliente.objects.using(alias).filter(
            numero_documento=numero_documento,
            correo__iexact=email
        ).first()

        if not cliente:
            # Por seguridad, no revelar si el cliente existe o no
            return Response({
                'message': 'Si los datos son correctos, recibirá instrucciones en su correo',
                'detail': 'Se ha enviado un correo con las instrucciones de activación'
            }, status=status.HTTP_200_OK)

        # Verificar si ya tiene cuenta en esta tienda
        if ClienteTienda.objects.using(alias).filter(email=email).exists():
            return Response({
                'detail': 'Este email ya tiene una cuenta activa en esta tienda. Si olvidó su contraseña, use la opción de recuperar contraseña'
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'message': 'Solicitud recibida',
            'detail': 'Se ha enviado un correo con las instrucciones para activar su cuenta',
            'email': email
        }, status=status.HTTP_200_OK)
