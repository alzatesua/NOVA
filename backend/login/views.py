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

    return user, tienda, dominio_obj, alias  # ← Retornar alias también


@api_view(['POST'])
def login_view(request):
    """
    Endpoint de login: recibe usuario, password y opcional subdominio.
    Si subdominio no se envía, se extrae del Host.
    """
    import logging
    logger = logging.getLogger(__name__)

    logger.info(f"=== Login attempt ===")
    logger.info(f"Request data: {request.data}")
    logger.info(f"Request headers: {dict(request.headers)}")
    logger.info(f"Request host: {request.get_host()}")
    logger.info(f"Request META: {request.META.get('REMOTE_ADDR')}")

    try:
        serializer = LoginSerializer(data=request.data)
        logger.info(f"Serializer created: {serializer}")
        logger.info(f"Serializer is_valid: {serializer.is_valid()}")

        if not serializer.is_valid():
            logger.error(f"Serializer errors: {serializer.errors}")

        serializer.is_valid(raise_exception=True)
        usuario  = serializer.validated_data['usuario']
        password = serializer.validated_data['password']
        subdom   = serializer.validated_data.get('subdominio')

        logger.info(f"Subdominio del serializer: '{subdom}' (tipo: {type(subdom).__name__})")

        # Extrae subdominio del Host si no se proporciona
        if not subdom or subdom == '':
            host   = request.get_host().split(':')[0]
            partes = host.split('.')

            logger.info(f"Host: {host}, Partes: {partes}, Len: {len(partes)}")

            # Determinar si es un subdominio de tienda o el dominio principal
            # Dominios principales: nova.dagi.co, dagi.co, www.nova.dagi.co, www.dagi.co
            # Subdominio de tienda: tienda-abc.nova.dagi.co (4+ partes) o tienda-abc.dagi.co (3 partes)
            es_dominio_principal = (
                len(partes) <= 2 or  # dagi.co o localhost
                partes[0] in ['nova', 'www', 'api']  # nova.dagi.co, www.nova.dagi.co, etc.
            )

            if not es_dominio_principal and len(partes) >= 3:
                # Es un subdominio de tienda
                subdom = partes[0].lower()
                logger.info(f"Subdominio de tienda extraído del host: {subdom}")
            else:
                # Si es dominio principal (nova.dagi.co o dagi.co),
                # buscar dominio marcado como principal en BD
                logger.info(f"Acceso al dominio principal: {host}")
                try:
                    dominio_principal = Dominios.objects.using('default').filter(es_principal=True).first()
                    logger.info(f"Query de dominio principal ejecutado, resultado: {dominio_principal}")

                    if dominio_principal:
                        subdom = dominio_principal.dominio
                        logger.info(f"Usando dominio principal: {subdom}")
                    else:
                        # Si no hay dominio principal, usar el primero disponible
                        logger.info("No hay dominio principal, buscando primero disponible")
                        primer_dominio = Dominios.objects.using('default').first()
                        logger.info(f"Query de primer dominio ejecutado, resultado: {primer_dominio}")

                        if primer_dominio:
                            subdom = primer_dominio.dominio
                            logger.info(f"Usando primer dominio disponible: {subdom}")
                        else:
                            logger.error("No hay dominios configurados en la base de datos")
                            return Response({
                                'error': 'No hay tiendas configuradas. Contacta al administrador.'
                            }, status=status.HTTP_400_BAD_REQUEST)
                except Exception as e:
                    logger.error(f"Error al buscar dominio: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    return Response({
                        'error': f'Error al buscar dominio: {str(e)}'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if not subdom:
            return Response({'error': 'Subdominio no proporcionado'}, status=status.HTTP_400_BAD_REQUEST)

        user, tienda, dominio_obj, alias = autenticar_usuario(subdom, usuario, password)
        sucursal = user.id_sucursal_default

        # Generar token JWT personalizado
        from nova.utils.db import generar_token_jwt
        token_jwt = generar_token_jwt(usuario)

        # Guardar token en BD
        user.token = token_jwt
        user.save(using=alias)

        # ── Registrar historial de login ─────────────────────────────
        logger.info(f"=== INICIANDO REGISTRO DE HISTORIAL LOGIN ===")
        try:
            from main_dashboard.models import HistorialLogin
            from django.utils import timezone

            logger.info(f"Usuario: {user.usuario} (ID: {user.id})")
            logger.info(f"Alias de BD: {alias}")

            # Obtener IP del usuario
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                direccion_ip = x_forwarded_for.split(',')[0].strip()
            else:
                direccion_ip = request.META.get('REMOTE_ADDR', 'Desconocida')

            # Obtener user agent
            user_agent = request.META.get('HTTP_USER_AGENT', 'Desconocido')

            logger.info(f"IP: {direccion_ip}")
            logger.info(f"User Agent: {user_agent[:100] if len(user_agent) > 100 else user_agent}...")

            # Verificar que el modelo HistorialLogin existe
            logger.info(f"Modelo HistorialLogin: {HistorialLogin}")
            logger.info(f"Tabla en BD: {HistorialLogin._meta.db_table}")

            # Verificar que la tabla existe antes de intentar crear el registro
            from django.db import ProgrammingError
            from django.db.utils import ConnectionDoesNotExist

            try:
                # Intentar contar registros primero para verificar que la tabla existe
                count = HistorialLogin.objects.using(alias).count()
                logger.info(f"La tabla existe. Total de registros actuales: {count}")
            except Exception as tabla_error:
                logger.error(f"❌ ERROR: La tabla 'historial_login' NO EXISTE en la base de datos '{alias}'")
                logger.error(f"Error: {str(tabla_error)}")
                logger.error(f"")
                logger.error(f"📝 SOLUCIÓN: Ejecuta el siguiente SQL en la base de datos:")
                logger.error(f"   psql -U postgres -d {tienda.db_nombre} -f Z_BD/crear_historial_login.sql")
                logger.error(f"")
                raise Exception(
                    f"La tabla 'historial_login' no existe. Ejecuta: psql -U postgres -d {tienda.db_nombre} -f Z_BD/crear_historial_login.sql"
                )

            # Crear registro de historial login
            historial = HistorialLogin.objects.using(alias).create(
                usuario_id=user.id,
                usuario_correo=user.correo_usuario,
                usuario_nombre=user.usuario,
                fecha_hora_login=timezone.now(),
                direccion_ip=direccion_ip,
                user_agent=user_agent,
                exitoso=True,
                duracion_segundos=None
            )

            logger.info(f"✅ Historial de login registrado EXITOSAMENTE. ID: {historial.id_historial}")

        except Exception as e:
            logger.error(f"❌ ERROR CRÍTICO al registrar historial de login: {str(e)}")
            logger.error(f"Tipo de error: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            # IMPORTANTE: No fallar el login si falla el registro del historial
        # ──────────────────────────────────────────────────────────────

        # Generar tokens de simplejwt para refresh
        refresh = RefreshToken.for_user(user)

        # Obtener bodegas según el rol del usuario
        from main_dashboard.models import Bodega
        bodegas_data = []

        if user.rol in ['admin', 'almacen']:
            # Admin y almacacen ven TODAS las bodegas de su sucursal
            if sucursal:
                bodegas = Bodega.objects.using(alias).filter(
                    sucursal_id=sucursal.id,
                    estatus=True
                )
                bodegas_data = [
                    {
                        'id': b.id,
                        'nombre': b.nombre,
                        'codigo': b.codigo,
                        'tipo': b.tipo,
                        'es_predeterminada': b.es_predeterminada,
                    }
                    for b in bodegas
                ]
        elif user.rol in ['vendedor', 'operario']:
            # Vendedor y operario: ver sus bodegas asignadas, si no tiene, ver todas
            bodegas_asignadas = user.bodegas_asignadas.using(alias).filter(estatus=True)

            # SIEMPRE retornar bodegas (asignadas o todas según tenga)
            if bodegas_asignadas.exists():
                bodegas_data = [
                    {
                        'id': b.id,
                        'nombre': b.nombre,
                        'codigo': b.codigo,
                        'tipo': b.tipo,
                        'es_predeterminada': b.es_predeterminada,
                    }
                    for b in bodegas_asignadas
                ]
            else:
                # Si NO tiene bodegas asignadas, mostrar TODAS las de su sucursal
                if sucursal:
                    bodegas = Bodega.objects.using(alias).filter(
                        sucursal_id=sucursal.id,
                        estatus=True
                    )
                bodegas_data = [
                    {
                        'id': b.id,
                        'nombre': b.nombre,
                        'codigo': b.codigo,
                        'tipo': b.tipo,
                        'es_predeterminada': b.es_predeterminada,
                    }
                    for b in bodegas
                ]

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
            "token_usuario": token_jwt,
            'id_sucursal_default': sucursal.id if sucursal else None,
            'nombre_sucursal': sucursal.nombre if sucursal else None,
            'bodegas': bodegas_data,  # Lista de bodegas disponibles para el usuario
        }, status=status.HTTP_200_OK)



    except ValueError as ve:
        # ── Registrar intento fallido de login ─────────────────────────────
        try:
            from main_dashboard.models import HistorialLogin
            from django.utils import timezone
            from nova.models import Dominios, Tiendas

            # Intentar obtener alias para registrar el fallo
            if subdom:
                try:
                    dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
                    if dominio_obj and dominio_obj.tienda:
                        tienda = dominio_obj.tienda
                        alias = str(tienda.id)

                        # Obtener IP del usuario
                        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
                        if x_forwarded_for:
                            direccion_ip = x_forwarded_for.split(',')[0].strip()
                        else:
                            direccion_ip = request.META.get('REMOTE_ADDR', 'Desconocida')

                        # Obtener user agent
                        user_agent = request.META.get('HTTP_USER_AGENT', 'Desconocido')

                        # Crear registro de intento fallido
                        HistorialLogin.objects.using(alias).create(
                            usuario_id=0,  # No se encontró el usuario
                            usuario_correo=usuario if usuario else 'desconocido',
                            usuario_nombre=usuario if usuario else 'desconocido',
                            fecha_hora_login=timezone.now(),
                            direccion_ip=direccion_ip,
                            user_agent=user_agent,
                            exitoso=False,
                            fallo_reason=str(ve)
                        )
                except Exception as login_err:
                    logger.error(f"Error al registrar intento fallido: {str(login_err)}")
        except Exception as hist_err:
            logger.error(f"Error general al registrar historial de fallo: {str(hist_err)}")
        # ──────────────────────────────────────────────────────────────
        return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback; traceback.print_exc()
        return Response(
            {'error': 'Error interno del servidor', 'detalle': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ----------------------- BODEGAS POR SUCURSAL -----------------------

@api_view(['GET'])
def bodegas_por_sucursal(request):
    """
    Endpoint para obtener las bodegas de una sucursal.
    Requiere: sucursal_id como query parameter.
    Útil para el selector de bodegas en el login.
    """
    from main_dashboard.models import Bodega

    sucursal_id = request.query_params.get('sucursal_id')

    if not sucursal_id:
        return Response(
            {'error': 'Se requiere sucursal_id'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        bodegas = Bodega.objects.filter(
            sucursal_id=sucursal_id,
            estatus=True
        ).order_by('nombre')

        bodegas_data = [
            {
                'id': b.id,
                'nombre': b.nombre,
                'codigo': b.codigo,
                'tipo': b.get_tipo_display(),
                'es_predeterminada': b.es_predeterminada,
            }
            for b in bodegas
        ]

        return Response({
            'bodegas': bodegas_data,
            'total': len(bodegas_data)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        import traceback; traceback.print_exc()
        return Response(
            {'error': 'Error al obtener bodegas', 'detalle': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )




