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
import datetime

from .models import MovimientoCaja, ArqueoCaja, Factura, Pago, Sucursales, SolicitudAperturaCaja
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

        serializer = MovimientoCajaSerializer(page_obj, many=True, context={'request': request})

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

        # ── VALIDACIÓN: Verificar que la caja esté abierta ──
        from datetime import datetime
        fecha_movimiento = request.data.get('fecha')
        if fecha_movimiento:
            fecha = datetime.strptime(fecha_movimiento, '%Y-%m-%d').date()
        else:
            fecha = timezone.now().date()

        id_sucursal = request.data.get('id_sucursal')

        # Si no hay sucursal especificada, usar la del usuario
        if not id_sucursal and user and user.id_sucursal_default:
            id_sucursal = user.id_sucursal_default_id

        # Verificar si la caja está cerrada
        if id_sucursal:
            if not ArqueoCaja.caja_esta_abierta(id_sucursal, fecha, alias):
                logger.warning(f"⚠️ Intento de registrar movimiento en caja cerrada - Sucursal: {id_sucursal}, Fecha: {fecha}")
                return Response({
                    'success': False,
                    'message': 'La caja está cerrada para esta fecha. No se pueden registrar movimientos.',
                    'error_code': 'CAJA_CERRADA'
                }, status=status.HTTP_403_FORBIDDEN)

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

        # Obtener sucursal (usar la del usuario si no se proporciona)
        id_sucursal = request.data.get('id_sucursal')
        if not id_sucursal and user and user.id_sucursal_default:
            id_sucursal = user.id_sucursal_default_id
            logger.info(f"Usando sucursal por defecto del usuario: {id_sucursal}")

        sucursal_filter = {}
        if id_sucursal:
            sucursal_filter['sucursal_id'] = id_sucursal
            logger.info(f"Filtrando por sucursal_id: {id_sucursal}")

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

        # Obtener sucursal (usar la del usuario si no se proporciona)
        id_sucursal = request.data.get('id_sucursal')
        if not id_sucursal and user and user.id_sucursal_default:
            id_sucursal = user.id_sucursal_default_id
            logger.info(f"Realizar arqueo - Usando sucursal por defecto del usuario: {id_sucursal}")

        sucursal_filter = {}
        if id_sucursal:
            sucursal_filter['sucursal_id'] = id_sucursal
            logger.info(f"Realizar arqueo - Filtrando por sucursal_id: {id_sucursal}")

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

            # Cerrar la caja automáticamente
            arqueo_existente.cerrar_caja(user)
            arqueo = arqueo_existente
        else:
            # Crear nuevo arqueo con caja cerrada
            arqueo = ArqueoCaja.objects.using(alias).create(
                fecha=fecha,
                saldo_inicial=saldo_inicial,
                total_entradas=total_entradas,
                total_salidas=total_salidas,
                saldo_esperado=saldo_esperado,
                monto_contado=monto_contado,
                usuario=user,
                sucursal=sucursal_obj,
                estado_caja='cerrada'  # CERRAR LA CAJA automáticamente
            )

            # Cerrar la caja estableciendo fecha y usuario
            arqueo.cerrar_caja(user)

        logger.info(f"✅ Arqueo realizado y caja cerrada - Fecha: {fecha}, Sucursal: {id_sucursal or 'default'}, Usuario: {user.usuario if user else 'N/A'}")

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
    Cada sede ve solo su propia caja menor. Solo admin puede filtrar por otras sedes.

    Body esperado:
    {
        "usuario": "...",
        "token": "...",
        "subdominio": "...",
        "fecha": "2024-01-15",  # opcional, por defecto hoy
        "id_sucursal": 1        # opcional, solo admin puede especificar
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
        user = mixin._tenant_user

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

        # Filtrar por sucursal según rol del usuario
        if user.rol == 'admin':
            # Admin puede filtrar por cualquier sucursal o ver todas
            if id_sucursal:
                queryset = queryset.filter(sucursal_id=id_sucursal)
            # Si id_sucursal es null, admin ve todas las sucursales
        else:
            # Usuario no-admin SOLO ve su sucursal asignada
            if user.id_sucursal_default:
                queryset = queryset.filter(sucursal_id=user.id_sucursal_default_id)
            else:
                # Si no tiene sucursal asignada, no ve nada
                queryset = queryset.none()

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
def balance_caja_menor(request):
    """
    Obtiene el balance acumulado de caja menor (todos los movimientos históricos).
    Cada sede ve solo su propia caja menor. Solo admin puede filtrar por otras sedes.

    Body esperado:
    {
        "usuario": "...",
        "token": "...",
        "subdominio": "...",
        "id_sucursal": 1        # opcional, solo admin puede especificar
    }

    Retorna:
    {
        "success": true,
        "balance": {
            "ingresos": 1000.00,
            "egresos": 500.00,
            "total": 500.00
        }
    }
    """
    try:
        mixin = CajaTenantMixin()
        alias = mixin._resolve_alias(request)
        user = mixin._tenant_user

        id_sucursal = request.data.get('id_sucursal')

        # Filtrar movimientos de caja menor (todos los históricos, sin filtro de fecha)
        queryset = MovimientoCaja.objects.using(alias).filter(
            es_caja_menor=True
        )

        # Filtrar por sucursal según rol del usuario
        if user.rol == 'admin':
            # Admin puede filtrar por cualquier sucursal o ver todas
            if id_sucursal:
                queryset = queryset.filter(sucursal_id=id_sucursal)
            # Si id_sucursal es null, admin ve todas las sucursales
        else:
            # Usuario no-admin SOLO ve su sucursal asignada
            if user.id_sucursal_default:
                queryset = queryset.filter(sucursal_id=user.id_sucursal_default_id)
            else:
                # Si no tiene sucursal asignada, no ve nada
                queryset = queryset.none()

        # Calcular balance acumulado
        ingresos = queryset.filter(tipo='entrada').aggregate(
            total=Sum('monto')
        )['total'] or Decimal('0')

        egresos = queryset.filter(tipo='salida').aggregate(
            total=Sum('monto')
        )['total'] or Decimal('0')

        total = ingresos - egresos

        return Response({
            'success': True,
            'balance': {
                'ingresos': str(ingresos),
                'egresos': str(egresos),
                'total': str(total)
            }
        }, status=status.HTTP_200_OK)

    except ValueError as e:
        logger.error(f"Error en balance_caja_menor (ValueError): {str(e)}")
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Error en balance_caja_menor: {str(e)}", exc_info=True)
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


@api_view(['POST'])
@permission_classes([AllowAny])
def verificar_estado_caja(request):
    """
    Verifica si la caja está abierta o cerrada para una fecha y sucursal específicas.

    Body esperado:
    {
        "usuario": "...",
        "token": "...",
        "subdominio": "...",
        "fecha": "2024-01-15",     # opcional, por defecto hoy
        "id_sucursal": 1            # opcional, usa sucursal del usuario
    }

    Retorna:
    {
        "success": true,
        "caja_abierta": true/false,
        "estado": "abierta"/"cerrada",
        "fecha_cierre": "2024-01-15T18:30:00"  # si está cerrada
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

        id_sucursal = request.data.get('id_sucursal')

        # Si no hay sucursal especificada, usar la del usuario
        if not id_sucursal and user and user.id_sucursal_default:
            id_sucursal = user.id_sucursal_default_id
            logger.info(f"Usando sucursal por defecto del usuario: {id_sucursal}")

        if not id_sucursal:
            return Response({
                'success': False,
                'message': 'No se pudo determinar la sucursal. El usuario no tiene sucursal por defecto.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Buscar el arqueo más reciente para esta fecha y sucursal
        logger.info(f"🔍 Buscando arqueo para sucursal_id={id_sucursal}, fecha={fecha}")

        arqueo = ArqueoCaja.objects.using(alias).filter(
            sucursal_id=id_sucursal,
            fecha=fecha
        ).order_by('-fecha_hora_registro').first()

        logger.info(f"🔍 Resultado búsqueda arqueo: {arqueo}")
        if arqueo:
            logger.info(f"   - ID: {arqueo.id}")
            logger.info(f"   - estado_caja: {arqueo.estado_caja}")
            logger.info(f"   - sucursal_id: {arqueo.sucursal_id}")
            logger.info(f"   - fecha_hora_registro: {arqueo.fecha_hora_registro}")

        # Si no hay arqueo con sucursal, intentar buscar ANY arqueo de esa fecha (fallback)
        if not arqueo:
            logger.warning(f"⚠️ No se encontró arqueo con sucursal_id={id_sucursal}, buscando sin filtro de sucursal...")
            todos_los_arqueos = ArqueoCaja.objects.using(alias).filter(
                fecha=fecha
            ).order_by('-fecha_hora_registro')

            logger.info(f"🔍 Total de arqueos para fecha {fecha}: {todos_los_arqueos.count()}")
            for a in todos_los_arqueos[:5]:  # Mostrar primeros 5
                logger.info(f"   - Arqueo ID={a.id}, sucursal_id={a.sucursal_id}, estado={a.estado_caja}")

            # Si solo hay un arqueo para esa fecha, usarlo aunque no tenga sucursal
            if todos_los_arqueos.count() == 1:
                arqueo = todos_los_arqueos.first()
                logger.info(f"✅ Usando único arqueo disponible (sin sucursal): ID={arqueo.id}, estado={arqueo.estado_caja}")

        if not arqueo:
            # No hay arqueo, la caja está abierta
            logger.info(f"✅ No hay arqueo - Caja ABIERTA (por defecto)")
            return Response({
                'success': True,
                'caja_abierta': True,
                'estado': 'abierta',
                'message': 'No hay arqueo registrado para esta fecha'
            }, status=status.HTTP_200_OK)

        caja_abierta = arqueo.estado_caja == 'abierta'
        logger.info(f"{'✅ Caja ABIERTA' if caja_abierta else '🔒 Caja CERRADA'} - estado: {arqueo.estado_caja}")

        response_data = {
            'success': True,
            'caja_abierta': caja_abierta,
            'estado': arqueo.estado_caja,
        }

        if not caja_abierta:
            response_data['fecha_cierre'] = arqueo.fecha_hora_cierre.isoformat() if arqueo.fecha_hora_cierre else None
            response_data['cerrado_por'] = arqueo.cerrado_por.usuario if arqueo.cerrado_por else None

        return Response(response_data, status=status.HTTP_200_OK)

    except ValueError as e:
        logger.error(f"Error en verificar_estado_caja (ValueError): {str(e)}")
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Error en verificar_estado_caja: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def abrir_caja(request):
    """
    Abre la caja para una fecha y sucursal específicas.
    Solo administradores pueden reabrir una caja cerrada.

    Body esperado:
    {
        "usuario": "...",
        "token": "...",
        "subdominio": "...",
        "fecha": "2024-01-15",     # opcional, por defecto hoy
        "id_sucursal": 1            # requerido
    }

    Retorna:
    {
        "success": true,
        "message": "Caja abierta exitosamente"
    }
    """
    try:
        mixin = CajaTenantMixin()
        alias = mixin._resolve_alias(request)
        user = mixin._tenant_user

        # Verificar que el usuario sea administrador
        if user.rol != 'admin':
            return Response({
                'success': False,
                'message': 'Solo los administradores pueden reabrir la caja'
            }, status=status.HTTP_403_FORBIDDEN)

        fecha_str = request.data.get('fecha')
        if fecha_str:
            from datetime import datetime
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        else:
            fecha = timezone.now().date()

        id_sucursal = request.data.get('id_sucursal')
        if not id_sucursal:
            return Response({
                'success': False,
                'message': 'El id_sucursal es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Buscar el arqueo más reciente para esta fecha y sucursal
        arqueo = ArqueoCaja.objects.using(alias).filter(
            sucursal_id=id_sucursal,
            fecha=fecha
        ).order_by('-fecha_hora_registro').first()

        if not arqueo:
            return Response({
                'success': False,
                'message': 'No hay arqueo para esta fecha'
            }, status=status.HTTP_404_NOT_FOUND)

        # Abrir la caja
        arqueo.abrir_caja(user)

        logger.info(f"✅ Caja reabierta - Sucursal: {id_sucursal}, Fecha: {fecha}, Por: {user.usuario}")

        return Response({
            'success': True,
            'message': 'Caja abierta exitosamente'
        }, status=status.HTTP_200_OK)

    except ValueError as e:
        logger.error(f"Error en abrir_caja (ValueError): {str(e)}")
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Error en abrir_caja: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# SOLICITUDES DE APERTURA DE CAJA
# ============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def crear_solicitud_apertura(request):
    """
    Crea una solicitud de apertura de caja.
    Los usuarios no-admin pueden solicitar que se abra una caja cerrada.

    Body esperado:
    {
        "usuario": "...",
        "token": "...",
        "subdominio": "...",
        "id_sucursal": 1,
        "fecha": "2024-01-15",
        "motivo": "Necesito facturar una venta"
    }

    Retorna:
    {
        "success": true,
        "solicitud": {...}
    }
    """
    try:
        from .serializers import SolicitudAperturaCajaCreateSerializer, SolicitudAperturaCajaSerializer

        mixin = CajaTenantMixin()
        alias = mixin._resolve_alias(request)
        user = mixin._tenant_user

        # No admins - ellos pueden abrir directamente
        if user.rol == 'admin':
            return Response({
                'success': False,
                'message': 'Los administradores pueden abrir la caja directamente'
            }, status=status.HTTP_403_FORBIDDEN)

        fecha_str = request.data.get('fecha')
        if fecha_str:
            from datetime import datetime
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        else:
            fecha = timezone.now().date()

        id_sucursal = request.data.get('id_sucursal')
        motivo = request.data.get('motivo')

        if not id_sucursal:
            return Response({
                'success': False,
                'message': 'El id_sucursal es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not motivo:
            return Response({
                'success': False,
                'message': 'El motivo es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Verificar que la caja esté cerrada
        if ArqueoCaja.caja_esta_abierta(id_sucursal, fecha, alias):
            return Response({
                'success': False,
                'message': 'La caja ya está abierta para esta fecha'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Buscar la sucursal
        from .models import Sucursales
        try:
            sucursal = Sucursales.objects.using(alias).get(id=id_sucursal)
        except Sucursales.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Sucursal no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)

        # Verificar si ya existe una solicitud pendiente para esta caja y fecha
        from .models import SolicitudAperturaCaja
        solicitud_existente = SolicitudAperturaCaja.objects.using(alias).filter(
            sucursal=sucursal,
            fecha=fecha,
            estado='pendiente'
        ).first()

        if solicitud_existente:
            return Response({
                'success': False,
                'message': 'Ya existe una solicitud pendiente para esta fecha y sucursal',
                'solicitud_existente': SolicitudAperturaCajaSerializer(solicitud_existente).data
            }, status=status.HTTP_400_BAD_REQUEST)

        # Crear la solicitud
        solicitud = SolicitudAperturaCaja.objects.using(alias).create(
            solicitante=user,
            sucursal=sucursal,
            fecha=fecha,
            motivo=motivo
        )

        logger.info(f"📤 Solicitud de apertura creada - ID: {solicitud.id}, Sucursal: {sucursal.nombre}, Fecha: {fecha}, Solicitante: {user.usuario}")

        return Response({
            'success': True,
            'message': 'Solicitud creada exitosamente',
            'solicitud': SolicitudAperturaCajaSerializer(solicitud).data
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error en crear_solicitud_apertura: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def listar_solicitudes_pendientes(request):
    """
    Lista las solicitudes de apertura pendientes.
    Solo administradores pueden ver estas solicitudes.

    Query params:
    - subdominio: requerido
    - usuario: requerido
    - token: requerido

    Retorna:
    {
        "success": true,
        "solicitudes": [...]
    }
    """
    try:
        from .serializers import SolicitudAperturaCajaSerializer

        mixin = CajaTenantMixin()
        alias = mixin._resolve_alias(request)
        user = mixin._tenant_user

        # Solo admins
        if user.rol != 'admin':
            return Response({
                'success': False,
                'message': 'Solo los administradores pueden ver las solicitudes'
            }, status=status.HTTP_403_FORBIDDEN)

        from .models import SolicitudAperturaCaja
        solicitudes = SolicitudAperturaCaja.objects.using(alias).filter(
            estado='pendiente'
        ).select_related('solicitante', 'sucursal', 'aprobado_por').order_by('-creada_en')

        serializer = SolicitudAperturaCajaSerializer(solicitudes, many=True)

        return Response({
            'success': True,
            'solicitudes': serializer.data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error en listar_solicitudes_pendientes: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def aprobar_solicitud(request):
    """
    Aprueba una solicitud de apertura de caja.
    Solo administradores pueden aprobar solicitudes.

    Body esperado:
    {
        "usuario": "...",
        "token": "...",
        "subdominio": "...",
        "solicitud_id": 1
    }

    Retorna:
    {
        "success": true,
        "message": "Solicitud aprobada y caja abierta"
    }
    """
    try:
        mixin = CajaTenantMixin()
        alias = mixin._resolve_alias(request)
        user = mixin._tenant_user

        # Solo admins
        if user.rol != 'admin':
            return Response({
                'success': False,
                'message': 'Solo los administradores pueden aprobar solicitudes'
            }, status=status.HTTP_403_FORBIDDEN)

        solicitud_id = request.data.get('solicitud_id')
        if not solicitud_id:
            return Response({
                'success': False,
                'message': 'El solicitud_id es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        from .models import SolicitudAperturaCaja
        try:
            solicitud = SolicitudAperturaCaja.objects.using(alias).get(id=solicitud_id)
        except SolicitudAperturaCaja.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Solicitud no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)

        if solicitud.estado != 'pendiente':
            return Response({
                'success': False,
                'message': f'La solicitud ya fue {solicitud.get_estado_display()}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Aprobar la solicitud (esto también abre la caja)
        solicitud.aprobar(user)

        logger.info(f"✅ Solicitud de apertura aprobada - ID: {solicitud.id}, Sucursal: {solicitud.sucursal.nombre}, Fecha: {solicitud.fecha}, Por: {user.usuario}")

        return Response({
            'success': True,
            'message': 'Solicitud aprobada y caja abierta exitosamente'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error en aprobar_solicitud: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def rechazar_solicitud(request):
    """
    Rechaza una solicitud de apertura de caja.
    Solo administradores pueden rechazar solicitudes.

    Body esperado:
    {
        "usuario": "...",
        "token": "...",
        "subdominio": "...",
        "solicitud_id": 1,
        "observaciones": "No se puede abrir porque..."  // opcional
    }

    Retorna:
    {
        "success": true,
        "message": "Solicitud rechazada"
    }
    """
    try:
        mixin = CajaTenantMixin()
        alias = mixin._resolve_alias(request)
        user = mixin._tenant_user

        # Solo admins
        if user.rol != 'admin':
            return Response({
                'success': False,
                'message': 'Solo los administradores pueden rechazar solicitudes'
            }, status=status.HTTP_403_FORBIDDEN)

        solicitud_id = request.data.get('solicitud_id')
        if not solicitud_id:
            return Response({
                'success': False,
                'message': 'El solicitud_id es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        observaciones = request.data.get('observaciones', '')

        from .models import SolicitudAperturaCaja
        try:
            solicitud = SolicitudAperturaCaja.objects.using(alias).get(id=solicitud_id)
        except SolicitudAperturaCaja.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Solicitud no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)

        if solicitud.estado != 'pendiente':
            return Response({
                'success': False,
                'message': f'La solicitud ya fue {solicitud.get_estado_display()}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Rechazar la solicitud
        solicitud.rechazar(user, observaciones)

        logger.info(f"❌ Solicitud de apertura rechazada - ID: {solicitud.id}, Sucursal: {solicitud.sucursal.nombre}, Fecha: {solicitud.fecha}, Por: {user.usuario}")

        return Response({
            'success': True,
            'message': 'Solicitud rechazada'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error en rechazar_solicitud: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def listar_solicitudes_usuario(request):
    """
    Lista las solicitudes del usuario actual (para ver el estado de sus solicitudes).

    Query params:
    - subdominio: requerido
    - usuario: requerido
    - token: requerido

    Retorna:
    {
        "success": true,
        "solicitudes": [...]
    }
    """
    try:
        from .serializers import SolicitudAperturaCajaSerializer

        mixin = CajaTenantMixin()
        alias = mixin._resolve_alias(request)
        user = mixin._tenant_user

        from .models import SolicitudAperturaCaja
        solicitudes = SolicitudAperturaCaja.objects.using(alias).filter(
            solicitante=user
        ).select_related('sucursal', 'aprobado_por').order_by('-creada_en')

        serializer = SolicitudAperturaCajaSerializer(solicitudes, many=True)

        return Response({
            'success': True,
            'solicitudes': serializer.data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error en listar_solicitudes_usuario: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def historial_arqueos(request):
    """
    Obtiene el historial de arqueos de caja.

    Query params:
    - subdominio: requerido
    - usuario: requerido
    - token: requerido
    - id_sucursal: opcional (filtra por sucursal)
    - fecha_desde: opcional (YYYY-MM-DD)
    - fecha_hasta: opcional (YYYY-MM-DD)
    - limite: opcional (default 50)

    Retorna:
    {
        "success": true,
        "arqueos": [...]
    }
    """
    try:
        mixin = CajaTenantMixin()
        alias = mixin._resolve_alias(request)
        user = mixin._tenant_user

        # Obtener parámetros de filtro
        id_sucursal = request.data.get('id_sucursal')
        fecha_desde = request.data.get('fecha_desde')
        fecha_hasta = request.data.get('fecha_hasta')
        limite = int(request.data.get('limite', 50))

        # Si no hay sucursal especificada, usar la del usuario
        if not id_sucursal and user and user.id_sucursal_default:
            id_sucursal = user.id_sucursal_default_id
            logger.info(f"Historial arqueos - Usando sucursal por defecto del usuario: {id_sucursal}")

        # Construir filtros
        filtros = {}
        if id_sucursal:
            filtros['sucursal_id'] = id_sucursal
        if fecha_desde:
            filtros['fecha__gte'] = fecha_desde
        if fecha_hasta:
            filtros['fecha__lte'] = fecha_hasta

        # Obtener arqueos
        arqueos = ArqueoCaja.objects.using(alias).filter(
            **filtros
        ).select_related(
            'usuario', 'sucursal', 'cerrado_por'
        ).order_by('-fecha', '-fecha_hora_registro')[:limite]

        # Serializar
        from .serializers import ArqueoCajaSerializer
        serializer = ArqueoCajaSerializer(arqueos, many=True)

        logger.info(f"Historial arqueos - Encontrados {len(arqueos)} registros")

        return Response({
            'success': True,
            'arqueos': serializer.data,
            'total': len(arqueos)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error en historial_arqueos: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# FIN DE SOLICITUDES DE APERTURA DE CAJA
# ============================================================================


# ============================================================================
# EXPORTACIÓN DE ARQUEOS
# ============================================================================

from django.http import HttpResponse, StreamingHttpResponse  # ✅ Agregado StreamingHttpResponse
from urllib.parse import quote
from django.views.decorators.csrf import csrf_exempt  # ✅ Agregado csrf_exempt

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt  # ✅ Eximir de CSRF para descargas de archivos
def exportar_historial_arqueos_excel(request):
    """
    Exporta el historial de arqueos a Excel.

    Body esperado:
    {
        "usuario": "...",
        "token": "...",
        "subdominio": "...",
        "id_sucursal": 1,          # opcional
        "fecha_desde": "2024-01-01",  # opcional
        "fecha_hasta": "2024-01-31",  # opcional
        "modo_exportacion": true    # clave: sin límites
    }

    Retorna: Archivo Excel (.xlsx)
    """
    try:
        from .exportadores import exportar_arqueos_excel

        mixin = CajaTenantMixin()
        alias = mixin._resolve_alias(request)
        user = mixin._tenant_user

        # Obtener parámetros
        id_sucursal = request.data.get('id_sucursal')
        fecha_desde = request.data.get('fecha_desde')
        fecha_hasta = request.data.get('fecha_hasta')
        modo_exportacion = request.data.get('modo_exportacion', False)

        # Si no hay sucursal, usar la del usuario
        if not id_sucursal and user and user.id_sucursal_default:
            id_sucursal = user.id_sucursal_default_id

        # Construir filtros
        filtros = {}
        if id_sucursal:
            filtros['sucursal_id'] = id_sucursal
        if fecha_desde:
            filtros['fecha__gte'] = fecha_desde
        if fecha_hasta:
            filtros['fecha__lte'] = fecha_hasta

        # MODO EXPORTACIÓN: Sin límites PERO con hard-cap defensivo
        if not modo_exportacion:
            # Fallback: si no se especifica modo exportación, usar límite grande
            limite = 10000
        else:
            # ✅ HARD-CAP DEFENSIVO: Evitar ataques de exportación masiva
            MAX_EXPORT_ROWS = 200000
            limite = None

        # Obtener arqueos base QuerySet
        arqueos_qs_base = ArqueoCaja.objects.using(alias).filter(
            **filtros
        )

        # ✅ VALIDACIÓN DEFENSIVA: Verificar hard-cap antes de procesar
        if modo_exportacion:
            count = arqueos_qs_base.count()
            if count > MAX_EXPORT_ROWS:
                logger.warning(
                    "⚠️ Exportación rechazada por exceder límite máximo",
                    extra={
                        "requested_rows": count,
                        "max_rows": MAX_EXPORT_ROWS,
                        "user": user.usuario
                    }
                )
                return Response({
                    'success': False,
                    'message': f'La exportación excede el límite máximo de {MAX_EXPORT_ROWS:,} registros. Por favor aplique filtros más específicos.'
                }, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

        # Obtener arqueos con select_related
        arqueos_qs = arqueos_qs_base.select_related(
            'usuario', 'sucursal', 'cerrado_por'
        ).order_by('-fecha', '-fecha_hora_registro')

        # Aplicar límite solo si no es modo exportación
        if limite:
            arqueos_qs = arqueos_qs[:limite]

        # Obtener nombre de sucursal
        sucursal_nombre = None
        if id_sucursal:
            try:
                from .models import Sucursales
                sucursal = Sucursales.objects.using(alias).get(id=id_sucursal)
                sucursal_nombre = sucursal.nombre
            except Sucursales.DoesNotExist:
                pass

        # Convertir fechas a objetos date si son strings
        if fecha_desde:
            fecha_desde = datetime.datetime.strptime(fecha_desde, '%Y-%m-%d').date()
        if fecha_hasta:
            fecha_hasta = datetime.datetime.strptime(fecha_hasta, '%Y-%m-%d').date()

        # Exportar
        excel_buffer = exportar_arqueos_excel(
            arqueos_qs,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            sucursal_nombre=sucursal_nombre,
            usuario_nombre=user.usuario if user else None
        )

        # Generar nombre de archivo
        from django.utils.timezone import now
        fecha_archivo = now().strftime('%Y%m%d_%H%M%S')
        filename = f'historial_arqueos_{fecha_archivo}.xlsx'

        # Crear respuesta HTTP con Streaming (mejor para archivos grandes)
        excel_buffer.seek(0)
        response = StreamingHttpResponse(
            excel_buffer,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename*=UTF-8\'\'{quote(filename)}'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'

        logger.info(
            "✅ Excel exportado",
            extra={
                "records": len(arqueos_qs),
                "user": user.usuario,
                "sucursal": sucursal_nombre,
                "file_name": filename
            }
        )

        return response

    except ValueError as e:
        logger.error(f"Error en exportar_historial_arqueos_excel (ValueError): {str(e)}")
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Error en exportar_historial_arqueos_excel: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt  # ✅ Eximir de CSRF para descargas de archivos
def exportar_historial_arqueos_pdf(request):
    """
    Exporta el historial de arqueos a PDF.

    Body esperado:
    {
        "usuario": "...",
        "token": "...",
        "subdominio": "...",
        "id_sucursal": 1,          # opcional
        "fecha_desde": "2024-01-01",  # opcional
        "fecha_hasta": "2024-01-31",  # opcional
        "modo_exportacion": true    # clave: sin límites
    }

    Retorna: Archivo PDF (.pdf)
    """
    try:
        from .exportadores import exportar_arqueos_pdf

        mixin = CajaTenantMixin()
        alias = mixin._resolve_alias(request)
        user = mixin._tenant_user

        # Obtener parámetros
        id_sucursal = request.data.get('id_sucursal')
        fecha_desde = request.data.get('fecha_desde')
        fecha_hasta = request.data.get('fecha_hasta')
        modo_exportacion = request.data.get('modo_exportacion', False)

        # Si no hay sucursal, usar la del usuario
        if not id_sucursal and user and user.id_sucursal_default:
            id_sucursal = user.id_sucursal_default_id

        # Construir filtros
        filtros = {}
        if id_sucursal:
            filtros['sucursal_id'] = id_sucursal
        if fecha_desde:
            filtros['fecha__gte'] = fecha_desde
        if fecha_hasta:
            filtros['fecha__lte'] = fecha_hasta

        # MODO EXPORTACIÓN: Sin límites PERO con hard-cap defensivo
        if not modo_exportacion:
            limite = 10000
        else:
            # ✅ HARD-CAP DEFENSIVO: Evitar ataques de exportación masiva
            MAX_EXPORT_ROWS = 200000
            limite = None

        # Obtener arqueos base QuerySet
        arqueos_qs_base = ArqueoCaja.objects.using(alias).filter(
            **filtros
        )

        # ✅ VALIDACIÓN DEFENSIVA: Verificar hard-cap antes de procesar
        if modo_exportacion:
            count = arqueos_qs_base.count()
            if count > MAX_EXPORT_ROWS:
                logger.warning(
                    "⚠️ Exportación rechazada por exceder límite máximo",
                    extra={
                        "requested_rows": count,
                        "max_rows": MAX_EXPORT_ROWS,
                        "user": user.usuario
                    }
                )
                return Response({
                    'success': False,
                    'message': f'La exportación excede el límite máximo de {MAX_EXPORT_ROWS:,} registros. Por favor aplique filtros más específicos.'
                }, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

        # Obtener arqueos con select_related
        arqueos_qs = arqueos_qs_base.select_related(
            'usuario', 'sucursal', 'cerrado_por'
        ).order_by('-fecha', '-fecha_hora_registro')

        if limite:
            arqueos_qs = arqueos_qs[:limite]

        # Obtener nombre de sucursal
        sucursal_nombre = None
        if id_sucursal:
            try:
                from .models import Sucursales
                sucursal = Sucursales.objects.using(alias).get(id=id_sucursal)
                sucursal_nombre = sucursal.nombre
            except Sucursales.DoesNotExist:
                pass

        # Convertir fechas
        if fecha_desde:
            fecha_desde = datetime.datetime.strptime(fecha_desde, '%Y-%m-%d').date()
        if fecha_hasta:
            fecha_hasta = datetime.datetime.strptime(fecha_hasta, '%Y-%m-%d').date()

        # Exportar
        pdf_buffer = exportar_arqueos_pdf(
            arqueos_qs,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            sucursal_nombre=sucursal_nombre,
            usuario_nombre=user.usuario if user else None
        )

        # Generar nombre de archivo
        from django.utils.timezone import now
        fecha_archivo = now().strftime('%Y%m%d_%H%M%S')
        filename = f'historial_arqueos_{fecha_archivo}.pdf'

        # Crear respuesta HTTP con Streaming (mejor para archivos grandes)
        pdf_buffer.seek(0)
        response = StreamingHttpResponse(
            pdf_buffer,
            content_type='application/pdf'
        )
        response['Content-Disposition'] = f'attachment; filename*=UTF-8\'\'{quote(filename)}'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'

        logger.info(
            "✅ PDF exportado",
            extra={
                "records": len(arqueos_qs),
                "user": user.usuario,
                "sucursal": sucursal_nombre,
                "file_name": filename
            }
        )

        return response

    except ValueError as e:
        logger.error(f"Error en exportar_historial_arqueos_pdf (ValueError): {str(e)}")
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Error en exportar_historial_arqueos_pdf: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
