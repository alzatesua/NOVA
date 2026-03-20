# main_dashboard/views_caja.py
"""
Vistas para el módulo de Caja y Cuadre de Caja
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Q, Sum, Count
from django.utils import timezone
from django.db import transaction
from decimal import Decimal

from .models import MovimientoCaja, ArqueoCaja, Factura, Pago, Sucursales
from .serializers import (
    MovimientoCajaSerializer,
    MovimientoCajaCreateSerializer,
    ArqueoCajaSerializer,
    ArqueoCajaCreateSerializer,
    SucursalSerializer
)
from .views_facturacion import FacturacionTenantMixin
from nova.models import Dominios
from nova.utils.db import conectar_db_tienda
import jwt
from django.conf import settings
from jwt import ExpiredSignatureError, InvalidTokenError
import logging

logger = logging.getLogger(__name__)


# ============================================================
#                    TenantMixin para Caja
# ============================================================
class CajaTenantMixin:
    """
    Mixin para resolver el alias de BD en cada request para caja.
    """
    permission_classes = [AllowAny]
    db_alias = None
    _tenant_user = None
    _tenant_tienda = None

    def _resolve_alias(self, request, require_auth=True):
        """
        Resuelve el alias de BD del tenant.

        Args:
            request: El request HTTP
            require_auth: Si True, requiere usuario y token. Si False, solo resuelve el tenant por subdominio.
        """
        if self.db_alias:
            return self.db_alias

        # Obtener credenciales desde body o query params
        usuario = request.data.get('usuario') or request.query_params.get('usuario')
        token = request.data.get('token') or request.query_params.get('token')
        subdom = request.data.get('subdominio') or request.query_params.get('subdominio')

        # Si no hay subdominio, usar el host
        if not subdom:
            host = request.get_host().split(':')[0]
            subdom = host.split('.')[0].lower()

        # Buscar tenant por Dominios y conectar
        dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).select_related('tienda').first()
        if not dominio_obj:
            raise ValueError('Dominio no válido.')

        tienda = dominio_obj.tienda
        alias = str(tienda.id)
        conectar_db_tienda(alias, tienda)

        # Si se requiere autenticación, validar usuario y token
        if require_auth:
            if not usuario or not token:
                raise ValueError('usuario y token son requeridos (en body o querystring).')

            # Validar usuario en tenant DB
            from django.apps import apps
            LoginUsuario = apps.get_model('nova', 'LoginUsuario')
            user = LoginUsuario.objects.using(alias).filter(usuario=usuario).first()
            if not user:
                raise ValueError('Usuario no encontrado.')

            # Validar/refresh token
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            except ExpiredSignatureError:
                from nova.utils.db import generar_token_jwt
                nuevo = generar_token_jwt(usuario)
                user.token = nuevo
                user.save(using=alias)
                token = nuevo
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            except InvalidTokenError:
                raise ValueError('Token inválido.')

            if payload.get("usuario") != usuario or user.token != token:
                raise ValueError('Token no coincide.')

            self._tenant_user = user

        self.db_alias = alias
        self._tenant_tienda = tienda
        return self.db_alias


# ============================================================
#                    Endpoints de Caja
# ============================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def estadisticas_caja(request):
    try:
        mixin = CajaTenantMixin()
        alias = mixin._resolve_alias(request)

        fecha_str = request.data.get('fecha')
        if fecha_str:
            from datetime import datetime
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        else:
            fecha = timezone.now().date()

        id_sucursal = request.data.get('id_sucursal')
        logger.info(f"📊 estadisticas_caja - id_sucursal: {id_sucursal}, fecha: {fecha}")

        # ── Saldo inicial: último arqueo filtrado por sucursal ──
        arqueo_qs = ArqueoCaja.objects.using(alias).filter(fecha__lt=fecha)
        if id_sucursal:
            arqueo_qs = arqueo_qs.filter(sucursal_id=id_sucursal)  # 👈 por sede
        ultimo_arqueo = arqueo_qs.order_by('-fecha', '-fecha_hora_registro').first()

        saldo_inicial = ultimo_arqueo.monto_contado if ultimo_arqueo else Decimal('0')

        # ── Movimientos del día filtrados por sucursal ──
        movimientos_dia = MovimientoCaja.objects.using(alias).filter(fecha=fecha)
        if id_sucursal:
            movimientos_dia = movimientos_dia.filter(sucursal_id=id_sucursal)  # 👈 por sede
        # Si id_sucursal es None → trae TODAS las sedes (vista admin global)

        total_entradas = movimientos_dia.filter(tipo='entrada').aggregate(
            total=Sum('monto')
        )['total'] or Decimal('0')

        total_salidas = movimientos_dia.filter(tipo='salida').aggregate(
            total=Sum('monto')
        )['total'] or Decimal('0')

        saldo_actual = saldo_inicial + total_entradas - total_salidas
        total_transacciones = movimientos_dia.count()

        logger.info(f"📊 RESULTADOS ESTADÍSTICAS - Sucursal: {id_sucursal}")
        logger.info(f"   Saldo inicial: {saldo_inicial}")
        logger.info(f"   Total entradas: {total_entradas}")
        logger.info(f"   Total salidas: {total_salidas}")
        logger.info(f"   Saldo actual: {saldo_actual}")

        return Response({
            'success': True,
            'data': {
                'saldo_inicial': str(saldo_inicial),
                'total_entradas': str(total_entradas),
                'total_salidas': str(total_salidas),
                'saldo_actual': str(saldo_actual),
                'total_transacciones': total_transacciones,
            }
        }, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Error en estadisticas_caja: {str(e)}", exc_info=True)
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)



@api_view(['POST'])
@permission_classes([AllowAny])
def listar_movimientos(request):
    try:
        mixin = CajaTenantMixin()
        alias = mixin._resolve_alias(request)

        fecha_str = request.data.get('fecha')
        tipo = request.data.get('tipo', 'todos')
        pagina = int(request.data.get('pagina', 1))
        por_pagina = int(request.data.get('por_pagina', 20))
        id_sucursal = request.data.get('id_sucursal')  # ← agregar

        por_pagina = min(por_pagina, 100)

        queryset = MovimientoCaja.objects.using(alias)

        if fecha_str:
            from datetime import datetime
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
            queryset = queryset.filter(fecha=fecha)

        if tipo and tipo != 'todos':
            queryset = queryset.filter(tipo=tipo)

        # Filtrar por sucursal si se proporciona
        if id_sucursal:
            queryset = queryset.filter(sucursal_id=id_sucursal)

        queryset = queryset.order_by('-fecha_hora')

        from django.core.paginator import Paginator
        paginator = Paginator(queryset, por_pagina)
        page_obj = paginator.get_page(pagina)

        serializer = MovimientoCajaSerializer(page_obj, many=True)

        return Response({
            'success': True,
            'data': {
                'movimientos': serializer.data,
                'total_paginas': paginator.num_pages,
                'pagina_actual': pagina,
                'total_items': paginator.count,
            }
        }, status=status.HTTP_200_OK)

    except ValueError as e:
        logger.error(f"Error en listar_movimientos (ValueError): {str(e)}")
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Error en listar_movimientos: {str(e)}", exc_info=True)
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def registrar_movimiento(request):
    logger.info(f"🔔 Petición recibida en registrar_movimiento desde {request.META.get('REMOTE_ADDR')}")
    try:
        mixin = CajaTenantMixin()
        alias = mixin._resolve_alias(request)
        user = mixin._tenant_user

        # ── DEBUG: Log de datos recibidos ──
        logger.info(f"📥 Datos recibidos en registrar_movimiento: {request.data}")
        logger.info(f"📥 es_caja_menor en request.data: {request.data.get('es_caja_menor')}")

        serializer = MovimientoCajaCreateSerializer(
            data=request.data,
            context={
                'db_alias': alias,
                'request': request,      # ← ya estaba, verificar que está
                'usuario': user
            }
        )
        serializer.is_valid(raise_exception=True)

        # ── DEBUG: Log de datos validados ──
        logger.info(f"✅ Datos validados: {serializer.validated_data}")
        logger.info(f"✅ es_caja_menor en validated_data: {serializer.validated_data.get('es_caja_menor')}")

        movimiento = serializer.save()

        # ── DEBUG: Log del movimiento guardado ──
        logger.info(f"💾 Movimiento guardado - es_caja_menor: {movimiento.es_caja_menor}")

        if user and not movimiento.usuario:
            movimiento.usuario = user
            movimiento.save(using=alias, update_fields=['usuario'])

        # ── NUEVO: si aún no tiene sucursal, asignar la del usuario ──
        if not movimiento.sucursal and user and user.id_sucursal_default:
            movimiento.sucursal = user.id_sucursal_default
            movimiento.save(using=alias, update_fields=['sucursal'])
            logger.info(f"Sucursal asignada como fallback desde usuario: {user.id_sucursal_default}")

        if movimiento.sucursal:
            logger.info(f"Movimiento guardado con sucursal_id: {movimiento.sucursal_id}")
        else:
            logger.warning("⚠️ Movimiento guardado SIN sucursal — revisar datos enviados")

        response_serializer = MovimientoCajaSerializer(movimiento)
        return Response({
            'success': True,
            'data': response_serializer.data,
            'message': 'Movimiento registrado exitosamente'
        }, status=status.HTTP_201_CREATED)

    except ValueError as e:
        logger.error(f"Error en registrar_movimiento (ValueError): {str(e)}")
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Error en registrar_movimiento: {str(e)}", exc_info=True)
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def cuadre_caja(request):
    """
    Obtiene el cuadre de caja completo para una fecha específica.

    Body esperado:
    {
        "usuario": "...",
        "token": "...",
        "subdominio": "...",
        "fecha": "2024-01-15"  # opcional, por defecto hoy
    }

    Retorna:
    {
        "success": true,
        "data": {
            "saldo_inicial": 0,
            "total_entradas": 0,
            "total_salidas": 0,
            "saldo_esperado": 0,
            "monto_arqueo": null,  # si existe arqueo
            "diferencia": 0,
            "por_metodo": [...],
            "total_transacciones": 0,
            "cantidad_entradas": 0,
            "cantidad_salidas": 0
        }
    }
    """
    try:
        mixin = CajaTenantMixin()
        alias = mixin._resolve_alias(request)
        user = mixin._tenant_user

        fecha_str = request.data.get('fecha')
        if fecha_str:
            from datetime import datetime
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        else:
            fecha = timezone.now().date()

        logger.info(f"Generando cuadre de caja para fecha: {fecha}")

        # Filtrar por sucursal si se proporciona
        id_sucursal = request.data.get('id_sucursal')
        print(f"DEBUG CUADRE - id_sucursal recibido: {id_sucursal} (tipo: {type(id_sucursal)})")
        print(f"DEBUG CUADRE - Todos los datos: {request.data}")
        sucursal_filter = {}
        if id_sucursal:
            sucursal_filter['sucursal_id'] = id_sucursal
            print(f"DEBUG CUADRE - Filtrando por sucursal_id: {id_sucursal}")

        # Obtener saldo inicial
        ultimo_arqueo_query = ArqueoCaja.objects.using(alias).filter(
            fecha__lt=fecha
        )
        if sucursal_filter:
            ultimo_arqueo_query = ultimo_arqueo_query.filter(**sucursal_filter)
        ultimo_arqueo = ultimo_arqueo_query.order_by('-fecha', '-fecha_hora_registro').first()

        if ultimo_arqueo:
            saldo_inicial = ultimo_arqueo.monto_contado
        else:
            saldo_inicial = Decimal('0')

        # Calcular totales
        movimientos_dia = MovimientoCaja.objects.using(alias).filter(fecha=fecha)
        if id_sucursal:
            movimientos_dia = movimientos_dia.filter(sucursal_id=id_sucursal)

        total_entradas = movimientos_dia.filter(tipo='entrada').aggregate(
            total=Sum('monto')
        )['total'] or Decimal('0')

        total_salidas = movimientos_dia.filter(tipo='salida').aggregate(
            total=Sum('monto')
        )['total'] or Decimal('0')

        saldo_esperado = saldo_inicial + total_entradas - total_salidas

        # Buscar arqueo del día filtrado por sucursal
        arqueo_dia_query = ArqueoCaja.objects.using(alias).filter(fecha=fecha)
        if id_sucursal:
            arqueo_dia_query = arqueo_dia_query.filter(sucursal_id=id_sucursal)
        arqueo_dia = arqueo_dia_query.first()

        monto_arqueo = arqueo_dia.monto_contado if arqueo_dia else None
        diferencia = arqueo_dia.diferencia if arqueo_dia else Decimal('0')

        # Desglose por método de pago
        metodos_pago = ['efectivo', 'transferencia', 'nequi', 'daviplata', 'tarjeta', 'otro']
        por_metodo = []

        for metodo in metodos_pago:
            entradas = movimientos_dia.filter(tipo='entrada', metodo_pago=metodo).aggregate(
                total=Sum('monto')
            )['total'] or Decimal('0')

            salidas = movimientos_dia.filter(tipo='salida', metodo_pago=metodo).aggregate(
                total=Sum('monto')
            )['total'] or Decimal('0')

            neto = entradas - salidas

            if neto != 0 or entradas > 0 or salidas > 0:
                por_metodo.append({
                    'metodo': metodo,
                    'entradas': str(entradas),
                    'salidas': str(salidas),
                    'neto': str(neto)
                })

        # Contar transacciones
        total_transacciones = movimientos_dia.count()
        cantidad_entradas = movimientos_dia.filter(tipo='entrada').count()
        cantidad_salidas = movimientos_dia.filter(tipo='salida').count()

        logger.info(f"📊 RESULTADOS CUADRE - Sucursal: {id_sucursal}")
        logger.info(f"   Saldo inicial: {saldo_inicial}")
        logger.info(f"   Total entradas: {total_entradas}")
        logger.info(f"   Total salidas: {total_salidas}")
        logger.info(f"   Saldo esperado: {saldo_esperado}")
        logger.info(f"   Monto arqueo: {monto_arqueo}")
        logger.info(f"   Diferencia: {diferencia}")

        return Response({
            'success': True,
            'data': {
                'saldo_inicial': str(saldo_inicial),
                'total_entradas': str(total_entradas),
                'total_salidas': str(total_salidas),
                'saldo_esperado': str(saldo_esperado),
                'monto_arqueo': str(monto_arqueo) if monto_arqueo else None,
                'diferencia': str(diferencia) if monto_arqueo else None,
                'por_metodo': por_metodo,
                'total_transacciones': total_transacciones,
                'cantidad_entradas': cantidad_entradas,
                'cantidad_salidas': cantidad_salidas,
            }
        }, status=status.HTTP_200_OK)

    except ValueError as e:
        logger.error(f"Error en cuadre_caja (ValueError): {str(e)}")
        return Response(
            {'success': False, 'message': str(e)},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        logger.error(f"Error en cuadre_caja: {str(e)}", exc_info=True)
        return Response(
            {'success': False, 'message': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def realizar_arqueo(request):
    """
    Registra un arqueo de caja para una fecha específica.

    Body esperado:
    {
        "usuario": "...",
        "token": "...",
        "subdominio": "...",
        "fecha": "2024-01-15",     # opcional, por defecto hoy
        "monto_contado": 500.00
    }

    Retorna:
    {
        "success": true,
        "data": {...}
    }
    """
    try:
        mixin = CajaTenantMixin()
        alias = mixin._resolve_alias(request)
        user = mixin._tenant_user

        fecha_str = request.data.get('fecha')
        if fecha_str:
            from datetime import datetime
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        else:
            fecha = timezone.now().date()

        monto_contado = request.data.get('monto_contado')
        if not monto_contado:
            return Response({
                'success': False,
                'message': 'El monto contado es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        from decimal import Decimal
        monto_contado = Decimal(str(monto_contado))

        logger.info(f"Realizando arqueo de caja para fecha: {fecha}, monto: {monto_contado}")

        # Filtrar por sucursal si se proporciona
        id_sucursal = request.data.get('id_sucursal')
        sucursal_filter = {}
        if id_sucursal:
            sucursal_filter['sucursal_id'] = id_sucursal

        # Obtener saldo inicial
        ultimo_arqueo_query = ArqueoCaja.objects.using(alias).filter(
            fecha__lt=fecha
        )
        if sucursal_filter:
            ultimo_arqueo_query = ultimo_arqueo_query.filter(**sucursal_filter)
        ultimo_arqueo = ultimo_arqueo_query.order_by('-fecha', '-fecha_hora_registro').first()

        saldo_inicial = ultimo_arqueo.monto_contado if ultimo_arqueo else Decimal('0')

        # Calcular totales del día
        movimientos_dia = MovimientoCaja.objects.using(alias).filter(fecha=fecha)
        if id_sucursal:
            movimientos_dia = movimientos_dia.filter(sucursal_id=id_sucursal)

        total_entradas = movimientos_dia.filter(tipo='entrada').aggregate(
            total=Sum('monto')
        )['total'] or Decimal('0')

        total_salidas = movimientos_dia.filter(tipo='salida').aggregate(
            total=Sum('monto')
        )['total'] or Decimal('0')

        saldo_esperado = saldo_inicial + total_entradas - total_salidas

        # Verificar si ya existe arqueo para esta fecha
        arqueo_existente_query = ArqueoCaja.objects.using(alias).filter(fecha=fecha)
        if sucursal_filter:
            arqueo_existente_query = arqueo_existente_query.filter(**sucursal_filter)
        arqueo_existente = arqueo_existente_query.first()

        # Obtener sucursal si se proporcionó
        from .models import Sucursales
        sucursal_obj = None
        if id_sucursal:
            try:
                sucursal_obj = Sucursales.objects.using(alias).get(id=id_sucursal)
            except Sucursales.DoesNotExist:
                logger.warning(f"Sucursal con id {id_sucursal} no encontrada")

        if arqueo_existente:
            # Actualizar arqueo existente
            arqueo_existente.monto_contado = monto_contado
            arqueo_existente.saldo_inicial = saldo_inicial
            arqueo_existente.total_entradas = total_entradas
            arqueo_existente.total_salidas = total_salidas
            arqueo_existente.saldo_esperado = saldo_esperado
            arqueo_existente.usuario = user
            if sucursal_obj:
                arqueo_existente.sucursal = sucursal_obj
            arqueo_existente.save(using=alias)
            arqueo = arqueo_existente
        else:
            # Crear nuevo arqueo
            arqueo = ArqueoCaja.objects.using(alias).create(
                fecha=fecha,
                saldo_inicial=saldo_inicial,
                total_entradas=total_entradas,
                total_salidas=total_salidas,
                saldo_esperado=saldo_esperado,
                monto_contado=monto_contado,
                usuario=user,
                sucursal=sucursal_obj
            )

        # Serializar y retornar
        serializer = ArqueoCajaSerializer(arqueo)

        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Arqueo realizado exitosamente'
        }, status=status.HTTP_201_CREATED if not arqueo_existente else status.HTTP_200_OK)

    except ValueError as e:
        logger.error(f"Error en realizar_arqueo (ValueError): {str(e)}")
        return Response(
            {'success': False, 'message': str(e)},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        logger.error(f"Error en realizar_arqueo: {str(e)}", exc_info=True)
        return Response(
            {'success': False, 'message': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def listar_movimientos_caja_menor(request):
    """
    Lista los movimientos de caja menor para una fecha específica.

    Body esperado:
    {
        "usuario": "...",
        "token": "...",
        "subdominio": "...",
        "fecha": "2024-01-15",  # opcional, por defecto hoy
        "id_sucursal": 1        # opcional, para filtrar por sucursal
    }

    Retorna:
    {
        "success": true,
        "movimientos": [...]
    }
    """
    try:
        mixin = CajaTenantMixin()
        alias = mixin._resolve_alias(request)

        fecha_str = request.data.get('fecha')
        if fecha_str:
            from datetime import datetime
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        else:
            fecha = timezone.now().date()

        id_sucursal = request.data.get('id_sucursal')

        # Filtrar movimientos de caja menor
        queryset = MovimientoCaja.objects.using(alias).filter(
            fecha=fecha,
            es_caja_menor=True
        )

        if id_sucursal:
            queryset = queryset.filter(sucursal_id=id_sucursal)

        queryset = queryset.order_by('-fecha_hora')

        serializer = MovimientoCajaSerializer(queryset, many=True)

        return Response({
            'success': True,
            'movimientos': serializer.data
        }, status=status.HTTP_200_OK)

    except ValueError as e:
        logger.error(f"Error en listar_movimientos_caja_menor (ValueError): {str(e)}")
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Error en listar_movimientos_caja_menor: {str(e)}", exc_info=True)
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def listar_sucursales_caja(request):
    """
    Lista las sucursales disponibles para filtrado en el módulo de caja.
    Los admin ven todas las sucursales, los usuarios no-admin solo ven la suya.
    """
    try:
        # Obtener credenciales desde request.data
        usuario = request.data.get('usuario')
        token = request.data.get('token')
        subdominio = request.data.get('subdominio')

        if not all([usuario, token, subdominio]):
            return Response({
                'success': False,
                'message': 'Se requieren usuario, token y subdominio'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Conectar a la base de datos del tenant
        from nova.utils.db import conectar_db_tienda
        from nova.models import Dominios

        # Obtener tenant por subdominio
        dominio_obj = Dominios.objects.filter(dominio__icontains=subdominio).select_related('tienda').first()
        if not dominio_obj:
            return Response({
                'success': False,
                'message': 'Dominio no válido'
            }, status=status.HTTP_404_NOT_FOUND)

        tienda = dominio_obj.tienda
        alias = str(tienda.id)
        conectar_db_tienda(alias, tienda)

        # Validar usuario
        from django.apps import apps
        LoginUsuario = apps.get_model('nova', 'LoginUsuario')
        user = LoginUsuario.objects.using(alias).filter(usuario=usuario).first()
        if not user:
            return Response({
                'success': False,
                'message': 'Usuario no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

        # Validar token
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except (ExpiredSignatureError, InvalidTokenError):
            return Response({
                'success': False,
                'message': 'Token inválido o expirado'
            }, status=status.HTTP_401_UNAUTHORIZED)

        if payload.get("usuario") != usuario or user.token != token:
            return Response({
                'success': False,
                'message': 'Token no coincide'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Obtener sucursales según el rol
        if user.rol == 'admin':
            # Admin ve todas las sucursales
            sucursales = Sucursales.objects.using(alias).all().order_by('nombre')
        else:
            # No-admin solo ve su sucursal asignada
            if user.id_sucursal_default:
                sucursales = Sucursales.objects.using(alias).filter(
                    id=user.id_sucursal_default_id
                )
            else:
                sucursales = Sucursales.objects.using(alias).none()

        # Serializar
        serializer = SucursalSerializer(sucursales, many=True)

        return Response({
            'success': True,
            'data': serializer.data,
            'es_admin': user.rol == 'admin',
            'sucursal_asignada': user.id_sucursal_default_id if user.id_sucursal_default else None
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error en listar_sucursales_caja: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
