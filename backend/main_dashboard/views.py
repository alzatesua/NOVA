from jwt import ExpiredSignatureError, InvalidTokenError
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from nova.utils.db import conectar_db_tienda, generar_token_jwt
from django.apps import apps
from django.db import connections, transaction, IntegrityError
import jwt, re
from django.conf import settings
from main_dashboard.models import Sucursales
from nova.models import Dominios, Tiendas
from .serializers import SucursalSerializer, ProductoSerializer, CategoriaSerializer, MarcaSerializer, IvaSerializer, DescuentoSerializer, TipoMedidaSerializer
from .models import Sucursales, Bodega, Existencia, Traslado

from rest_framework import viewsets, status
from .serializers import BodegaSerializer

# Serializer
from nova.serializers import UsuarioSerializer

#importaciones para imagen
import os
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.views.decorators.csrf import csrf_exempt
from jwt import decode as jwt_decode, ExpiredSignatureError, InvalidTokenError

# views.py
import traceback

# 🔒 Seguridad: Importar psycopg2.sql para prevenir SQL injection en identificadores dinámicos
from psycopg2 import sql
from django.utils.text import slugify
import uuid
import logging

logger = logging.getLogger(__name__)

from nova.utils.email import enviar_correo_mailjet

from rest_framework import viewsets, status
from rest_framework.decorators import action

from .serializers import BodegaSerializer, ExistenciaSerializer, TrasladoSerializer, ProductoConExistenciasSerializer
from .models import (
    ajustar_stock, enviar_traslado, recibir_traslado, cancelar_traslado
)
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from django.db import transaction, models
from django.db.models import F, Sum, Value
from django.db.models.functions import Coalesce

# tus modelos
from .models import Existencia, Producto, ProductoVariante, Bodega

from rest_framework.exceptions import ValidationError
# (si también necesitas el de Django en el mismo archivo)
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Prefetch






# ------------------- API OBTENER INFORMACIONDE UNA TABLA EN ESPECIFICO -------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def obtener_info_tienda(request): 
    try:
        usuario = request.data.get('usuario')
        token = request.data.get('token')
        subdom = request.data.get('subdominio')
        tabla = request.data.get('tabla')
        sucursal_id = request.data.get('id_sucursal')

        if not all([usuario, token, tabla]):
            return Response({'error': 'Usuario, token y tabla son requeridos.'}, status=400)

        if not subdom:
            host = request.get_host().split(':')[0]
            subdom = host.split('.')[0].lower()

        
        dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
        if not dominio_obj:
            return Response({'error': 'Dominio no válido'}, status=400)

        tienda = dominio_obj.tienda
        alias = str(tienda.id)
        conectar_db_tienda(alias, tienda)

        LoginUsuario = apps.get_model('nova', 'LoginUsuario')
        try:
            user = LoginUsuario.objects.using(alias).get(usuario=usuario)
        except LoginUsuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=401)

        # Decodificar token
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except ExpiredSignatureError:
            # 🔄 Token expirado: generamos uno nuevo
            nuevo_token = generar_token_jwt(usuario)
            user.token = nuevo_token
            user.save(using=alias)
            token = nuevo_token  # actualiza el token para continuar
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except InvalidTokenError:
            return Response({'error': 'Token inválido o manipulado'}, status=401)

        if payload.get("usuario") != usuario:
            return Response({'error': 'El usuario del token no coincide'}, status=401)

        if user.token != token:
            return Response({'error': 'Token no coincide con el guardado'}, status=401)

        # Validar nombre de tabla
        if not re.match(r'^[a-zA-Z0-9_]+$', tabla):
            return Response({'error': 'Nombre de tabla inválido'}, status=400)

        with connections[alias].cursor() as cursor:
            # 🔒 SEGURIDAD: Prevenir SQL injection con psycopg2.sql
            table_identifier = sql.Identifier(tabla)

            if tabla == 'productos' and sucursal_id:
                # 👇 Solo si es productos e id_sucursal fue enviado
                query = sql.SQL("SELECT * FROM {} WHERE sucursal_id = %s").format(table_identifier)
                cursor.execute(query, [sucursal_id])
            elif tabla == 'inventario_bodega':
                # 📦 Filtrar bodegas según el rol del usuario
                # Nuevo parámetro 'todas_las_bodegas' para obtener TODAS las bodegas (sin filtro de asignación)
                todas_las_bodegas = request.data.get('todas_las_bodegas', False)
                # Nuevo parámetro 'excluir_sucursal_id' para obtener bodegas de OTRAS sucursales
                excluir_sucursal_id = request.data.get('excluir_sucursal_id')

                if todas_las_bodegas:
                    # 🔓 Modo especial: Traer TODAS las bodegas (sin filtro de asignación)
                    if excluir_sucursal_id is not None:
                        # ✅ Bodegas de OTRAS sucursales (excluyendo la actual)
                        query = sql.SQL("SELECT * FROM {} WHERE sucursal_id != %s AND estatus = TRUE").format(table_identifier)
                        cursor.execute(query, [excluir_sucursal_id])
                    elif sucursal_id:
                        # Traer todas las bodegas de una sucursal específica
                        query = sql.SQL("SELECT * FROM {} WHERE sucursal_id = %s AND estatus = TRUE").format(table_identifier)
                        cursor.execute(query, [sucursal_id])
                    elif user.id_sucursal_default:
                        # Traer todas las bodegas de la sucursal default del usuario
                        query = sql.SQL("SELECT * FROM {} WHERE sucursal_id = %s AND estatus = TRUE").format(table_identifier)
                        cursor.execute(query, [user.id_sucursal_default_id])
                    else:
                        # Traer todas las bodegas de todas las sucursales
                        query = sql.SQL("SELECT * FROM {} WHERE estatus = TRUE").format(table_identifier)
                        cursor.execute(query)
                elif user.rol in ['admin', 'almacen']:
                    # Admin y almacén: filtra por sucursal específica si se envía, si no, por su sucursal default
                    if sucursal_id:
                        # Si se envió sucursal_id específica (ej: admin seleccionando otra sucursal)
                        cursor.execute(
                            f"SELECT * FROM {tabla} WHERE sucursal_id = %s AND estatus = TRUE",
                            [sucursal_id]
                        )
                    elif user.id_sucursal_default:
                        # Si no, usar la sucursal default del usuario
                        cursor.execute(
                            f"SELECT * FROM {tabla} WHERE sucursal_id = %s AND estatus = TRUE",
                            [user.id_sucursal_default_id]
                        )
                    else:
                        # Si no tiene sucursal default, traer todas
                        query = sql.SQL("SELECT * FROM {} WHERE estatus = TRUE").format(table_identifier)
                        cursor.execute(query)
                elif user.rol in ['vendedor', 'operario']:
                    # Vendedor y operario: solo sus bodegas asignadas de su sucursal
                    if sucursal_id:
                        # 🔒 SEGURIDAD: Query parametrizada con filtro de sucursal
                        query = sql.SQL("""
                            SELECT b.* FROM inventario_bodega b
                            INNER JOIN login_usuario_bodega lub ON b.id = lub.id_bodega
                            WHERE lub.id_login_usuario = %s AND b.estatus = TRUE AND b.sucursal_id = %s
                        """)
                        params = [user.id, sucursal_id]
                    elif user.id_sucursal_default:
                        # 🔒 SEGURIDAD: Query parametrizada con sucursal default
                        query = sql.SQL("""
                            SELECT b.* FROM inventario_bodega b
                            INNER JOIN login_usuario_bodega lub ON b.id = lub.id_bodega
                            WHERE lub.id_login_usuario = %s AND b.estatus = TRUE AND b.sucursal_id = %s
                        """)
                        params = [user.id, user.id_sucursal_default_id]
                    else:
                        # 🔒 SEGURIDAD: Query parametrizada sin filtro de sucursal
                        query = sql.SQL("""
                            SELECT b.* FROM inventario_bodega b
                            INNER JOIN login_usuario_bodega lub ON b.id = lub.id_bodega
                            WHERE lub.id_login_usuario = %s AND b.estatus = TRUE
                        """)
                        params = [user.id]

                    cursor.execute(query, params)
                else:
                    # Otros roles: todas las bodegas activas (o filtradas por sucursal si se envía)
                    if sucursal_id:
                        cursor.execute(
                            f"SELECT * FROM {tabla} WHERE sucursal_id = %s AND estatus = TRUE",
                            [sucursal_id]
                        )
                    else:
                        query = sql.SQL("SELECT * FROM {} WHERE estatus = TRUE").format(table_identifier)
                        cursor.execute(query)
            else:
                query = sql.SQL("SELECT * FROM {}").format(table_identifier)
                cursor.execute(query)

            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            resultados = [dict(zip(columns, row)) for row in rows]


        return Response({
            'mensaje': f'Token válido. Bienvenido, {usuario}.',
            'nuevo_token': token,
            'tienda': tienda.nombre_tienda,
            'slug': tienda.slug,
            'tabla': tabla,
            'datos': resultados
        }, status=200)

    except Exception as e:
        import traceback; traceback.print_exc()
        return Response({'error': 'Error del servidor', 'detalle': str(e)}, status=500)
    


# ------------------- API PARA BUSCAR EN UNA TABLA POR UN VALOR EN ESPECIFICO Y RETORNAR COLUBNAS COLUBNAS -------------------
OPERADORES_PERMITIDOS = {"=", "LIKE", "ILIKE", "IN"}

def _get_tablas(connection_alias):
    with connections[connection_alias].cursor() as c:
        c.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
        """)
        return {row[0] for row in c.fetchall()}

def _get_columnas(connection_alias, tabla):
    with connections[connection_alias].cursor() as c:
        c.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema='public' AND table_name=%s
        """, [tabla])
        return {row[0] for row in c.fetchall()}

@api_view(['POST'])
@permission_classes([AllowAny])
def buscar_en_tabla(request):
    """
    POST body esperado:
    {
      "usuario": "foo",
      "token": "jwt...",
      "subdominio": "mi-tienda"   # opcional si usas host
      "tabla": "productos",
      "columnas": ["id", "nombre", "sku", "precio"],
      "filtro": { "columna": "codigo_barras", "operador": "=", "valor": "7501234567890" },
      "id_sucursal": 3,           # opcional
      "order_by": "-id",          # opcional: "-col" desc | "col" asc
      "limit": 50,                # opcional
      "offset": 0                 # opcional
    }
    """
    try:
        data = request.data
        usuario = data.get('usuario')
        token   = data.get('token')
        subdom  = data.get('subdominio')
        tabla   = (data.get('tabla') or '').strip()
        columnas_req = data.get('columnas') or []
        filtro  = data.get('filtro') or {}
        id_sucursal = data.get('id_sucursal')
        order_by = (data.get('order_by') or '').strip()
        limit  = data.get('limit')
        offset = data.get('offset')

        # Validaciones mínimas
        if not all([usuario, token, tabla]):
            return Response({'error': 'usuario, token y tabla son requeridos.'}, status=400)
        if not isinstance(columnas_req, list) or not columnas_req:
            return Response({'error': 'columnas debe ser un array con al menos una columna.'}, status=400)

        # subdominio desde host si no vino
        if not subdom:
            host = request.get_host().split(':')[0]
            subdom = host.split('.')[0].lower()

        dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
        if not dominio_obj:
            return Response({'error': 'Dominio no válido'}, status=400)

        tienda = dominio_obj.tienda
        alias = str(tienda.id)
        conectar_db_tienda(alias, tienda)

        # Autenticación básica como tu endpoint original
        LoginUsuario = apps.get_model('nova', 'LoginUsuario')
        try:
            user = LoginUsuario.objects.using(alias).get(usuario=usuario)
        except LoginUsuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=401)

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except ExpiredSignatureError:
            nuevo_token = generar_token_jwt(usuario)
            user.token = nuevo_token
            user.save(using=alias)
            token = nuevo_token
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except InvalidTokenError:
            return Response({'error': 'Token inválido o manipulado'}, status=401)

        if payload.get("usuario") != usuario:
            return Response({'error': 'El usuario del token no coincide'}, status=401)
        if user.token != token:
            return Response({'error': 'Token no coincide con el guardado'}, status=401)

        # ---------- Validaciones anti-inyección para identificadores ----------
        # Solo letras, números y guión bajo para nombres
        ident_re = re.compile(r'^[a-zA-Z0-9_]+$')
        if not ident_re.match(tabla):
            return Response({'error': 'Nombre de tabla inválido'}, status=400)

        tablas_validas = _get_tablas(alias)
        if tabla not in tablas_validas:
            return Response({'error': f'Tabla "{tabla}" no existe'}, status=400)

        cols_validas = _get_columnas(alias, tabla)
        # Normaliza columnas requeridas (elimina duplicados y valida)
        columnas = []
        for col in columnas_req:
            if not isinstance(col, str) or not ident_re.match(col):
                return Response({'error': f'Columna inválida: {col}'}, status=400)
            if col not in cols_validas:
                return Response({'error': f'La columna "{col}" no existe en {tabla}'}, status=400)
            if col not in columnas:
                columnas.append(col)

        # Filtro
        filtro_col = (filtro.get('columna') or '').strip()
        operador   = (filtro.get('operador') or '').upper().strip()
        valor      = filtro.get('valor', None)

        where_clauses = []
        params = []

        if filtro_col:
            if not ident_re.match(filtro_col):
                return Response({'error': 'Nombre de columna del filtro inválido'}, status=400)
            if filtro_col not in cols_validas:
                return Response({'error': f'La columna de filtro "{filtro_col}" no existe en {tabla}'}, status=400)
            if operador not in OPERADORES_PERMITIDOS:
                return Response({'error': f'Operador no permitido. Usa uno de {sorted(OPERADORES_PERMITIDOS)}'}, status=400)

            if operador == "IN":
                if not isinstance(valor, (list, tuple)) or not valor:
                    return Response({'error': 'Para operador IN, "valor" debe ser un array no vacío.'}, status=400)
                placeholders = ", ".join(["%s"] * len(valor))
                where_clauses.append(f"{filtro_col} IN ({placeholders})")
                params.extend(valor)
            elif operador in ("LIKE", "ILIKE"):
                where_clauses.append(f"{filtro_col} {operador} %s")
                params.append(str(valor))
            else:  # "="
                where_clauses.append(f"{filtro_col} = %s")
                params.append(valor)

        # Filtro opcional por sucursal
        if id_sucursal is not None and 'sucursal_id' in cols_validas:
            where_clauses.append("sucursal_id = %s")
            params.append(int(id_sucursal))

        where_sql = ""
        if where_clauses:
            where_sql = " WHERE " + " AND ".join(where_clauses)

        # ORDER BY seguro (solo una columna con prefijo opcional "-")
        order_sql = ""
        if order_by:
            desc = order_by.startswith('-')
            col  = order_by[1:] if desc else order_by
            if not ident_re.match(col):
                return Response({'error': 'order_by inválido'}, status=400)
            if col not in cols_validas:
                return Response({'error': f'order_by: la columna "{col}" no existe en {tabla}'}, status=400)
            order_sql = f" ORDER BY {col} {'DESC' if desc else 'ASC'}"

        # LIMIT / OFFSET
        limit_sql = ""
        if isinstance(limit, int) and limit > 0:
            limit_sql = " LIMIT %s"
            params.append(limit)
        if isinstance(offset, int) and offset >= 0:
            limit_sql += " OFFSET %s"
            params.append(offset)

        # Construir SELECT con columnas validadas
        select_cols = ", ".join(columnas)
        sql = f"SELECT {select_cols} FROM {tabla}{where_sql}{order_sql}{limit_sql}"

        with connections[alias].cursor() as cursor:
            cursor.execute(sql, params)
            rows = cursor.fetchall()

        resultados = [dict(zip(columnas, row)) for row in rows]

        return Response({
            #'mensaje': f'Token válido. Bienvenido, {usuario}.',
            #'nuevo_token': token,
            #'tienda': tienda.nombre_tienda,
            #'slug': tienda.slug,
            #'tabla': tabla,
            #'columnas': columnas,
            #'count': len(resultados),
            'datos': resultados
        }, status=200)

    except Exception as e:
        import traceback; traceback.print_exc()
        return Response({'error': 'Error del servidor', 'detalle': str(e)}, status=500)




# ------------------- API OBTENER INFORMACIONDE UNA TABLA EN ESPECIFICO  SIN FILTRO -------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def obtener_info_tienda_sin_filtro(request): 
    try:
        usuario = request.data.get('usuario')
        token = request.data.get('token')
        subdom = request.data.get('subdominio')
        tabla = request.data.get('tabla')
        sucursal_id = request.data.get('id_sucursal')

        if not all([usuario, token, tabla]):
            return Response({'error': 'Usuario, token y tabla son requeridos.'}, status=400)

        if not subdom:
            host = request.get_host().split(':')[0]
            subdom = host.split('.')[0].lower()

        
        dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
        if not dominio_obj:
            return Response({'error': 'Dominio no válido'}, status=400)

        tienda = dominio_obj.tienda
        alias = str(tienda.id)
        conectar_db_tienda(alias, tienda)

        LoginUsuario = apps.get_model('nova', 'LoginUsuario')
        try:
            user = LoginUsuario.objects.using(alias).get(usuario=usuario)
        except LoginUsuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=401)

        # Decodificar token
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except ExpiredSignatureError:
            # 🔄 Token expirado: generamos uno nuevo
            nuevo_token = generar_token_jwt(usuario)
            user.token = nuevo_token
            user.save(using=alias)
            token = nuevo_token  # actualiza el token para continuar
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except InvalidTokenError:
            return Response({'error': 'Token inválido o manipulado'}, status=401)

        if payload.get("usuario") != usuario:
            return Response({'error': 'El usuario del token no coincide'}, status=401)

        if user.token != token:
            return Response({'error': 'Token no coincide con el guardado'}, status=401)

        # Validar nombre de tabla
        if not re.match(r'^[a-zA-Z0-9_]+$', tabla):
            return Response({'error': 'Nombre de tabla inválido'}, status=400)

        with connections[alias].cursor() as cursor:
            # 🔒 SEGURIDAD: Prevenir SQL injection con psycopg2.sql
            table_identifier = sql.Identifier(tabla)
            query = sql.SQL("SELECT * FROM {}").format(table_identifier)
            cursor.execute(query)

            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            resultados = [dict(zip(columns, row)) for row in rows]


        return Response({
            'mensaje': f'Token válido. Bienvenido, {usuario}.',
            'nuevo_token': token,
            'tienda': tienda.nombre_tienda,
            'slug': tienda.slug,
            'tabla': tabla,
            'datos': resultados
        }, status=200)

    except Exception as e:
        import traceback; traceback.print_exc()
        return Response({'error': 'Error del servidor', 'detalle': str(e)}, status=500)
    




# ------------------- API CREAR SUCURSAL -------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def crear_sucursal(request):
    try:
        # Paso 1: Validar usuario, token y subdominio
        usuario = request.data.get('usuario')
        token = request.data.get('token')
        subdom = request.data.get('subdominio')

        if not all([usuario, token]):
            return Response({'error': 'Usuario y token son requeridos.'}, status=400)

        if not subdom:
            host = request.get_host().split(':')[0]
            subdom = host.split('.')[0].lower()

        dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
        if not dominio_obj:
            return Response({'error': 'Dominio no válido'}, status=400)

        tienda = dominio_obj.tienda
        alias = str(tienda.id)
        conectar_db_tienda(alias, tienda)

        # Paso 2: Obtener usuario
        LoginUsuario = apps.get_model('nova', 'LoginUsuario')
        try:
            user = LoginUsuario.objects.using(alias).get(usuario=usuario)
        except LoginUsuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=401)

        # Paso 3: Validar token JWT
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except ExpiredSignatureError:
            nuevo_token = generar_token_jwt(usuario)
            user.token = nuevo_token
            user.save(using=alias)
            token = nuevo_token
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except InvalidTokenError:
            return Response({'error': 'Token inválido'}, status=401)

        if payload.get("usuario") != usuario or user.token != token:
            return Response({'error': 'Token no coincide'}, status=401)

        # Paso 4: Validar datos de sucursal
        data = request.data.get('sucursal')
        if not data:
            return Response({'error': 'Datos de la sucursal requeridos'}, status=400)

        serializer = SucursalSerializer(data=data)
        if not serializer.is_valid():
            return Response({'error': 'Datos inválidos', 'detalle': serializer.errors}, status=400)

        # Paso 5: Crear y guardar la sucursal en la base de datos de la tienda
        nueva_sucursal = Sucursales(**serializer.validated_data)
        nueva_sucursal.save(using=alias)

        return Response({
            'mensaje': 'Sucursal creada exitosamente.',
            'nuevo_token': token,
            'sucursal': SucursalSerializer(nueva_sucursal).data
        }, status=201)

    except Exception as e:
        import traceback; traceback.print_exc()
        return Response({'error': 'Error interno del servidor', 'detalle': str(e)}, status=500)






# ------------------- API CREAR OPERARIO -------------------


# Usuario legacy (tabla nova_login_usuario) en el tenant DB
LoginUsuario = apps.get_model('nova', 'LoginUsuario')

@api_view(['POST'])
@permission_classes([AllowAny])
def crear_operario(request):
    try:
        # 1) Autenticación del admin (pública)
        usuario = request.data.get('usuario')
        token   = request.data.get('token')
        subdom  = (
            request.data.get('subdominio')
            or request.get_host().split(':')[0].split('.')[0].lower()
        )

        if not usuario or not token:
            return Response(
                {'error': 'Usuario y token son requeridos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
        if not dominio_obj:
            return Response(
                {'error': 'Dominio no válido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tienda = dominio_obj.tienda
        alias  = str(tienda.id)
        conectar_db_tienda(alias, tienda)

        # 2) Verificar admin en la base tenant
        try:
            admin = LoginUsuario.objects.using(alias).get(usuario=usuario)
        except LoginUsuario.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # 3) Validar / renovar JWT
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except ExpiredSignatureError:
            nuevo_token = generar_token_jwt(usuario)
            admin.token = nuevo_token
            admin.save(using=alias)
            token   = nuevo_token
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except InvalidTokenError:
            return Response(
                {'error': 'Token inválido'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if payload.get('usuario') != usuario or admin.token != token:
            return Response(
                {'error': 'Token no coincide'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # 4) Datos del operario y sucursal
        datos_op = request.data.get('operario')
        suc_id   = request.data.get('sucursal_id')
        bodegas_ids = request.data.get('bodegas_ids', [])  # Lista de IDs de bodegas a asignar

        print(f"DEBUG: bodegas_ids recibido: {bodegas_ids}")

        if not datos_op or not suc_id:
            return Response(
                {'error': 'operario y sucursal_id son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 5) Traer la sucursal en tenant DB
        try:
            sucursal = Sucursales.objects.using(alias).get(pk=suc_id)
        except Sucursales.DoesNotExist:
            return Response(
                {'error': 'Sucursal no encontrada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 6) Traer la tienda de la DB pública
        tienda_local = Tiendas.objects.get(pk=tienda.id)

        # 7a) Validar duplicados antes de guardar
        usuario_nuevo = datos_op.get('usuario')
        correo_nuevo  = datos_op.get('correo_usuario')

        if LoginUsuario.objects.using(alias).filter(usuario=usuario_nuevo).exists():
            return Response(
                {'error': 'El nombre de usuario ya existe.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if LoginUsuario.objects.using(alias).filter(correo_usuario=correo_nuevo).exists():
            return Response(
                {'error': 'El correo de usuario ya existe.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 7b) Crear el operario de forma atómica
        try:
            with transaction.atomic(using=alias):
                nuevo = LoginUsuario(
                    usuario        = usuario_nuevo,
                    correo_usuario = correo_nuevo,
                    rol            = datos_op.get('rol'),
                    tienda         = tienda_local,
                    id_sucursal_default_id = sucursal.id  # Usar _id para evitar error del database router
                )
                nuevo.set_password(datos_op.get('password'))
                nuevo.token = generar_token_jwt(nuevo.usuario)
                nuevo.save(using=alias)

                # 7c) Asignar bodegas si se proporcionaron (para vendedores y operarios)
                if bodegas_ids and nuevo.rol in ['vendedor', 'operario']:
                    LoginUsuarioBodega = apps.get_model('nova', 'LoginUsuarioBodega')
                    print(f"DEBUG: Asignando bodegas {bodegas_ids} al usuario {nuevo.usuario}")

                    # Usar bulk_create para mejor performance
                    bodegas_asignaciones = []
                    for bodega_id in bodegas_ids:
                        try:
                            # Verificar que la bodega existe y pertenezca a la sucursal
                            bodega = Bodega.objects.using(alias).get(
                                id=bodega_id,
                                sucursal_id=sucursal.id
                            )
                            bodegas_asignaciones.append(
                                LoginUsuarioBodega(
                                    id_login_usuario=nuevo,
                                    id_bodega=bodega
                                )
                            )
                            print(f"DEBUG: Bodega {bodega_id} preparada para asignación")
                        except Bodega.DoesNotExist as e:
                            print(f"DEBUG: Bodega {bodega_id} no encontrada: {e}")
                            continue

                    # Crear todas las asignaciones en una sola consulta
                    if bodegas_asignaciones:
                        LoginUsuarioBodega.objects.using(alias).bulk_create(bodegas_asignaciones)
                        print(f"DEBUG: {len(bodegas_asignaciones)} bodegas asignadas correctamente")
        except IntegrityError:
            return Response(
                {'error': 'Error de integridad: usuario o correo duplicado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 8) Responder al cliente
        return Response({
            'mensaje': 'Operario creado y asignado a sucursal.',
            'operario': {
                'id':          nuevo.id,
                'usuario':     nuevo.usuario,
                'correo':      nuevo.correo_usuario,
                'rol':         nuevo.rol,
                'sucursal_id': sucursal.id,
                'bodegas_asignadas': bodegas_ids if bodegas_ids else []
            },
            'token_operario': nuevo.token
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        import traceback; traceback.print_exc()
        return Response(
            {'error': 'Error interno del servidor', 'detalle': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

#------------------- API UDATE -------------------
#ACTUALIZAR EL VALOR DE UNA FILA

@api_view(['POST'])
@permission_classes([AllowAny])
def actualizar_datos_tienda(request):
    try:
        usuario = request.data.get('usuario')
        token = request.data.get('token')
        subdom = request.data.get('subdominio')
        tabla = request.data.get('tabla')
        filtro_columna = request.data.get('columna_filtro')   # e.g. "id"
        filtro_valor = request.data.get('valor_filtro')       # e.g. 1
        nuevos_datos = request.data.get('datos')              # e.g. {"rol": "admin", "activo": True}

        # Validación básica
        if not all([usuario, token, tabla, filtro_columna, filtro_valor, nuevos_datos]):
            return Response({'error': 'Faltan datos requeridos'}, status=400)

        # Subdominio (si no viene)
        if not subdom:
            host = request.get_host().split(':')[0]
            subdom = host.split('.')[0].lower()

        # Conexión a la tienda
        dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
        if not dominio_obj:
            return Response({'error': 'Dominio no válido'}, status=400)

        tienda = dominio_obj.tienda
        alias = str(tienda.id)
        conectar_db_tienda(alias, tienda)

        LoginUsuario = apps.get_model('nova', 'LoginUsuario')
        try:
            user = LoginUsuario.objects.using(alias).get(usuario=usuario)
        except LoginUsuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=401)

         # Decodificar token
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except ExpiredSignatureError:
            # 🔄 Token expirado: generamos uno nuevo
            nuevo_token = generar_token_jwt(usuario)
            user.token = nuevo_token
            user.save(using=alias)
            token = nuevo_token  # actualiza el token para continuar
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except InvalidTokenError:
            return Response({'error': 'Token inválido o manipulado'}, status=401)

        if payload.get("usuario") != usuario:
            return Response({'error': 'El usuario del token no coincide'}, status=401)

        if user.token != token:
            return Response({'error': 'Token no coincide con el guardado'}, status=401)

        # Validar tabla y columna
        if not re.match(r'^[a-zA-Z0-9_]+$', tabla) or not re.match(r'^[a-zA-Z0-9_]+$', filtro_columna):
            return Response({'error': 'Tabla o columna con nombre inválido'}, status=400)

        # Validar que datos a actualizar sean un dict plano
        if not isinstance(nuevos_datos, dict):
            return Response({'error': 'Datos debe ser un diccionario con campos a actualizar'}, status=400)

        # Validar que las columnas a actualizar existan en la tabla
        with connections[alias].cursor() as cursor:
            cursor.execute("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s
            """, [tabla])
            columnas_validas = {row[0] for row in cursor.fetchall()}

        # Verificar que todas las columnas a actualizar existan
        columnas_invalidas = set(nuevos_datos.keys()) - columnas_validas
        if columnas_invalidas:
            return Response({
                'error': f'Las siguientes columnas no existen en la tabla {tabla}: {", ".join(columnas_invalidas)}',
                'columnas_validas': sorted(columnas_validas)
            }, status=400)
        values = list(nuevos_datos.values()) + [filtro_valor]
        # Armar consulta
        set_clause = ", ".join([f"{key} = %s" for key in nuevos_datos.keys()])

        # Enviar correo de alerta si el stock es bajo (solo para tabla de productos)
        stock = nuevos_datos.get('stock')
        if stock is not None and tabla == 'productos':
            try:
                if int(stock) <= 5:
                    # Obtener el nombre del producto de la base de datos
                    with connections[alias].cursor() as cursor:
                        # 🔒 SEGURIDAD: Usar Identifier para el nombre de columna
                        column_identifier = sql.Identifier(filtro_columna)
                        query = sql.SQL("SELECT nombre FROM productos WHERE {} = %s").format(column_identifier)
                        cursor.execute(query, [filtro_valor])
                        result = cursor.fetchone()
                        nombre_producto = result[0] if result else "Desconocido"

                    email = "zuletajonathan18@gmail.com"
                    asunto = f"Alerta: el stock del producto: {nombre_producto} es de {stock}"
                    html = f"<h2>Hola</h2><p>Este es un correo para avisarte que el stock de tu producto es bajo</p><p>Alerta: el stock del producto: {nombre_producto} es de {stock}</p>"
                    texto = "Este es un texto alternativo"
                    enviar_correo_mailjet(email, asunto, html, texto)
            except ValueError:
                print("Stock no es un número válido")
            except Exception as e:
                print(f"Error enviando correo: {e}")
                
        query = f"""
            UPDATE {tabla}
            SET {set_clause}
            WHERE {filtro_columna} = %s
        """

        with connections[alias].cursor() as cursor:
            cursor.execute(query, values)
            updated_count = cursor.rowcount

        return Response({
            'mensaje': f'Se actualizaron {updated_count} fila(s)',
            'actualizado': nuevos_datos,
            'columna_filtro': filtro_columna,
            'valor_filtro': filtro_valor
        }, status=200)

    except Exception as e:
        import traceback; traceback.print_exc()
        return Response({'error': 'Error del servidor', 'detalle': str(e)}, status=500)





#------------------- API CREACION DE PRODUCTO -------------------


@api_view(['POST'])
@permission_classes([AllowAny])
def crear_producto_tienda(request):
    try:
        usuario = request.data.get('usuario')
        token   = request.data.get('token')
        subdom  = request.data.get('subdominio')
        datos   = request.data.get('datos')

        if not all([usuario, token, datos]):
            return Response({'error': 'Faltan campos obligatorios'}, status=400)

        if not subdom:
            host = request.get_host().split(':')[0]
            subdom = host.split('.')[0].lower()

        dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
        if not dominio_obj:
            return Response({'error': 'Dominio no válido'}, status=400)

        tienda = dominio_obj.tienda
        alias  = str(tienda.id)
        conectar_db_tienda(alias, tienda)

        LoginUsuario = apps.get_model('nova', 'LoginUsuario')
        user = LoginUsuario.objects.using(alias).filter(usuario=usuario).first()
        if not user:
            return Response({'error': 'Usuario no encontrado'}, status=401)

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except ExpiredSignatureError:
            nuevo = generar_token_jwt(usuario)
            user.token = nuevo
            user.save(using=alias)
            token = nuevo
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except InvalidTokenError:
            return Response({'error': 'Token inválido'}, status=401)

        if payload.get("usuario") != usuario or user.token != token:
            return Response({'error': 'Token no coincide'}, status=401)

        def generar_sku(categoria_id):
            return f"{categoria_id}-{uuid.uuid4().hex[:8].upper()}"

        multiple = isinstance(datos, list)

        # Inyectar SKU
        if multiple:
            for item in datos:
                cat = item.get('categoria') or item.get('categoria_id')
                item['sku'] = generar_sku(cat)
            serializer = ProductoSerializer(
                data=datos,
                many=True,
                context={'db_alias': alias}
            )
        else:
            cat = datos.get('categoria') or datos.get('categoria_id')
            datos['sku'] = generar_sku(cat)
            serializer = ProductoSerializer(
                data=datos,
                context={'db_alias': alias}
            )

        serializer.is_valid(raise_exception=True)
        productos_creados = serializer.save()

        # ✅ NUEVO: Crear existencia en inventario_existencia
        from django.db import transaction

        with transaction.atomic(using=alias):
            # Si es lista de productos
            if multiple:
                for producto in productos_creados:
                    if producto.bodega_id and producto.stock > 0:
                        # Usar raw SQL para evitar problemas con columnas faltantes
                        conn = connections[alias]
                        with conn.cursor() as cursor:
                            # Primero intentar insertar, si falla por duplicado, actualizar
                            try:
                                cursor.execute(
                                    "INSERT INTO inventario_existencia (producto_id, bodega_id, cantidad) VALUES (%s, %s, %s)",
                                    [producto.id, producto.bodega_id, producto.stock]
                                )
                            except Exception as insert_err:
                                # Si el error es por duplicado, actualizar
                                if 'duplicate' in str(insert_err).lower() or 'unique' in str(insert_err).lower():
                                    cursor.execute(
                                        "UPDATE inventario_existencia SET cantidad = cantidad + %s WHERE producto_id = %s AND bodega_id = %s",
                                        [producto.stock, producto.id, producto.bodega_id]
                                    )
                                else:
                                    raise insert_err
            # Si es un solo producto
            else:
                producto = productos_creados
                if producto.bodega_id and producto.stock > 0:
                    # Usar raw SQL para evitar problemas con columnas faltantes
                    conn = connections[alias]
                    with conn.cursor() as cursor:
                        # Primero intentar insertar, si falla por duplicado, actualizar
                        try:
                            cursor.execute(
                                "INSERT INTO inventario_existencia (producto_id, bodega_id, cantidad) VALUES (%s, %s, %s)",
                                [producto.id, producto.bodega_id, producto.stock]
                            )
                        except Exception as insert_err:
                            # Si el error es por duplicado, actualizar
                            if 'duplicate' in str(insert_err).lower() or 'unique' in str(insert_err).lower():
                                cursor.execute(
                                    "UPDATE inventario_existencia SET cantidad = cantidad + %s WHERE producto_id = %s AND bodega_id = %s",
                                    [producto.stock, producto.id, producto.bodega_id]
                                )
                            else:
                                raise insert_err

        # ✅ NUEVO: Crear variantes si se enviaron
        import logging
        logger = logging.getLogger(__name__)

        with transaction.atomic(using=alias):
            if multiple:
                for idx, producto in enumerate(productos_creados):
                    variantes_data = datos[idx].get('variantes')
                    if variantes_data and isinstance(variantes_data, list):
                        for variante_data in variantes_data:
                            # Si color es un objeto, extraer el nombre
                            color_value = variante_data.get('color')
                            if isinstance(color_value, dict):
                                color_value = color_value.get('nombre')

                            ProductoVariante.objects.using(alias).create(
                                producto=producto,
                                talla=variante_data.get('talla'),
                                color=color_value,
                                color_hex=variante_data.get('color_hex'),
                                medida=variante_data.get('medida'),
                                sku_variante=variante_data.get('sku_variante'),
                                precio=variante_data.get('precio'),
                                activo=True,
                                es_predeterminado=False
                            )
            else:
                variantes_data = datos.get('variantes')
                if variantes_data and isinstance(variantes_data, list):
                    for variante_data in variantes_data:
                        # Si color es un objeto, extraer el nombre
                        color_value = variante_data.get('color')
                        if isinstance(color_value, dict):
                            color_value = color_value.get('nombre')

                        ProductoVariante.objects.using(alias).create(
                            producto=productos_creados,
                            talla=variante_data.get('talla'),
                            color=color_value,
                            color_hex=variante_data.get('color_hex'),
                            medida=variante_data.get('medida'),
                            sku_variante=variante_data.get('sku_variante'),
                            precio=variante_data.get('precio'),
                            activo=True,
                            es_predeterminado=False
                        )

        return Response(serializer.data, status=201)

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return Response({'error': 'Error del servidor', 'detalle': str(e)}, status=500)
#------------------- API CREACION DE CATEGORIAS -------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def crear_categoria_tienda(request):
    """
    Crea una nueva Categoria en la BD del tenant,
    tras validar usuario legacy + token JWT.
    """
    try:
        # 1) Extraer credenciales + payload
        usuario  = request.data.get('usuario')
        token    = request.data.get('token')
        subdom   = request.data.get('subdominio')
        datos    = request.data.get('datos')    # debe ser {"nombre": "...", "descripcion": "..."}  

        if not all([usuario, token, datos]):
            return Response(
                {'error': 'Debe incluir usuario, token y datos de la categoría'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2) Resolver subdominio si no viene
        if not subdom:
            host = request.get_host().split(':')[0]
            subdom = host.split('.')[0].lower()

        # 3) Buscar tenant y conectar
        dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
        if not dominio_obj:
            return Response({'error': 'Dominio no válido'}, status=status.HTTP_400_BAD_REQUEST)

        tienda = dominio_obj.tienda
        alias  = str(tienda.id)
        conectar_db_tienda(alias, tienda)

        # 4) Validar usuario legacy
        LoginUsuario = apps.get_model('nova', 'LoginUsuario')
        try:
            user = LoginUsuario.objects.using(alias).get(usuario=usuario)
        except LoginUsuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_401_UNAUTHORIZED)

        # 5) Decodificar y validar token
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except ExpiredSignatureError:
            nuevo = generar_token_jwt(usuario)
            user.token = nuevo
            user.save(using=alias)
            token = nuevo
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except InvalidTokenError:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        if payload.get("usuario") != usuario or user.token != token:
            return Response({'error': 'Token no coincide con el usuario'}, status=status.HTTP_401_UNAUTHORIZED)

        # 6) Validar formato de 'datos'
        if not isinstance(datos, dict):
            return Response({'error': 'Datos debe ser un diccionario'}, status=status.HTTP_400_BAD_REQUEST)

        if 'nombre' not in datos or not isinstance(datos['nombre'], str):
            return Response({'error': "El campo 'nombre' es obligatorio"}, status=status.HTTP_400_BAD_REQUEST)

        # 7) Serializar + guardar en BD del tenant
        serializer = CategoriaSerializer(data=datos)
        serializer.is_valid(raise_exception=True)
        Categoria = apps.get_model('main_dashboard', 'Categoria')
        categoria = Categoria.objects.using(alias).create(**serializer.validated_data)

        return Response(
            CategoriaSerializer(categoria).data,
            status=status.HTTP_201_CREATED
        )

    except Exception as e:
        return Response(
            {'error': 'Error interno', 'detalle': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )




#------------------- API CREACION DE MARCAS -------------------
 
@api_view(['POST'])
@permission_classes([AllowAny])
def crear_marca_tienda(request):
    """
    Crea una nueva Marca en la BD del tenant,
    tras validar usuario legacy + token JWT.
    """
    try:
        # 1) Extraer credenciales + payload
        usuario  = request.data.get('usuario')
        token    = request.data.get('token')
        subdom   = request.data.get('subdominio')
        datos    = request.data.get('datos')    # {"nombre": "..."}
        
        if not all([usuario, token, datos]):
            return Response(
                {'error': 'Debe incluir usuario, token y datos de la marca'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 2) Resolver subdominio si no viene
        if not subdom:
            host = request.get_host().split(':')[0]
            subdom = host.split('.')[0].lower()
        
        # 3) Buscar tenant y conectar
        dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
        if not dominio_obj:
            return Response({'error': 'Dominio no válido'}, status=status.HTTP_400_BAD_REQUEST)
        
        tienda = dominio_obj.tienda
        alias  = str(tienda.id)
        conectar_db_tienda(alias, tienda)
        
        # 4) Validar usuario legacy
        LoginUsuario = apps.get_model('nova', 'LoginUsuario')
        try:
            user = LoginUsuario.objects.using(alias).get(usuario=usuario)
        except LoginUsuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # 5) Decodificar y validar token
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except ExpiredSignatureError:
            nuevo = generar_token_jwt(usuario)
            user.token = nuevo
            user.save(using=alias)
            token = nuevo
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except InvalidTokenError:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if payload.get("usuario") != usuario or user.token != token:
            return Response({'error': 'Token no coincide con el usuario'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # 6) Validar formato de 'datos'
        if not isinstance(datos, dict):
            return Response({'error': 'Datos debe ser un diccionario'}, status=status.HTTP_400_BAD_REQUEST)
        nombre = datos.get('nombre')
        if not nombre or not isinstance(nombre, str):
            return Response({'error': "El campo 'nombre' es obligatorio"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 7) Serializar + guardar en BD del tenant
        serializer = MarcaSerializer(data=datos)
        serializer.is_valid(raise_exception=True)
        Marca = apps.get_model('main_dashboard', 'Marca')
        marca = Marca.objects.using(alias).create(**serializer.validated_data)
        
        return Response(
            MarcaSerializer(marca).data,
            status=status.HTTP_201_CREATED
        )
    
    except Exception as e:
        return Response(
            {'error': 'Error interno', 'detalle': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )




#------------------- API CREACION DE IVA -------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def crear_iva_tienda(request):
    """
    Crea un nuevo Iva en la BD del tenant,
    tras validar usuario legacy + token JWT.
    """
    try:
        usuario  = request.data.get('usuario')
        token    = request.data.get('token')
        subdom   = request.data.get('subdominio')
        datos    = request.data.get('datos')  # {"porcentaje": "16.00"}

        if not all([usuario, token, datos]):
            return Response(
                {'error': 'Debe incluir usuario, token y datos del IVA'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # resolver subdominio
        if not subdom:
            host = request.get_host().split(':')[0]
            subdom = host.split('.')[0].lower()

        # buscar tenant y conectar
        dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
        if not dominio_obj:
            return Response({'error': 'Dominio no válido'}, status=status.HTTP_400_BAD_REQUEST)

        tienda = dominio_obj.tienda
        alias  = str(tienda.id)
        conectar_db_tienda(alias, tienda)

        # validar usuario legacy
        LoginUsuario = apps.get_model('nova', 'LoginUsuario')
        try:
            user = LoginUsuario.objects.using(alias).get(usuario=usuario)
        except LoginUsuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_401_UNAUTHORIZED)

        # decodificar/refresh token
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except ExpiredSignatureError:
            nuevo = generar_token_jwt(usuario)
            user.token = nuevo
            user.save(using=alias)
            token = nuevo
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except InvalidTokenError:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        if payload.get("usuario") != usuario or user.token != token:
            return Response({'error': 'Token no coincide con el usuario'}, status=status.HTTP_401_UNAUTHORIZED)

        # validar formato de datos
        if not isinstance(datos, dict):
            return Response({'error': 'Datos debe ser un diccionario'}, status=status.HTTP_400_BAD_REQUEST)

        porcentaje = datos.get('porcentaje')
        if porcentaje is None:
            return Response({'error': "El campo 'porcentaje' es obligatorio"}, status=status.HTTP_400_BAD_REQUEST)

        # serializar y guardar
        serializer = IvaSerializer(data=datos)
        serializer.is_valid(raise_exception=True)

        Iva = apps.get_model('main_dashboard', 'Iva')
        iva = Iva.objects.using(alias).create(**serializer.validated_data)

        return Response(
            IvaSerializer(iva).data,
            status=status.HTTP_201_CREATED
        )

    except Exception as e:
        return Response(
            {'error': 'Error interno', 'detalle': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


#------------------- API CREACION DE DESCUENTOS -------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def crear_descuento(request):
    """
    Crea un nuevo Iva en la BD del tenant,
    tras validar usuario legacy + token JWT.
    """
    try:
        usuario  = request.data.get('usuario')
        token    = request.data.get('token')
        subdom   = request.data.get('subdominio')
        datos    = request.data.get('datos')  # {"porcentaje": "16.00"}

        if not all([usuario, token, datos]):
            return Response(
                {'error': 'Debe incluir usuario, token y datos del DESCUENTO'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # resolver subdominio
        if not subdom:
            host = request.get_host().split(':')[0]
            subdom = host.split('.')[0].lower()

        # buscar tenant y conectar
        dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
        if not dominio_obj:
            return Response({'error': 'Dominio no válido'}, status=status.HTTP_400_BAD_REQUEST)

        tienda = dominio_obj.tienda
        alias  = str(tienda.id)
        conectar_db_tienda(alias, tienda)

        # validar usuario legacy
        LoginUsuario = apps.get_model('nova', 'LoginUsuario')
        try:
            user = LoginUsuario.objects.using(alias).get(usuario=usuario)
        except LoginUsuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_401_UNAUTHORIZED)

        # decodificar/refresh token
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except ExpiredSignatureError:
            nuevo = generar_token_jwt(usuario)
            user.token = nuevo
            user.save(using=alias)
            token = nuevo
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except InvalidTokenError:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        if payload.get("usuario") != usuario or user.token != token:
            return Response({'error': 'Token no coincide con el usuario'}, status=status.HTTP_401_UNAUTHORIZED)

        # validar formato de datos
        if not isinstance(datos, dict):
            return Response({'error': 'Datos debe ser un diccionario'}, status=status.HTTP_400_BAD_REQUEST)

        porcentaje = datos.get('Descuento')
        if porcentaje is None:
            return Response({'error': "El campo 'Descuento' es obligatorio"}, status=status.HTTP_400_BAD_REQUEST)

        # Mapear 'Descuento' a 'porcentaje' para el serializer
        datos_serializer = {'porcentaje': porcentaje}

        # serializar y guardar
        serializer = DescuentoSerializer(data=datos_serializer)
        serializer.is_valid(raise_exception=True)

        Descuento = apps.get_model('main_dashboard', 'Descuento')
        descuento = Descuento.objects.using(alias).create(**serializer.validated_data)

        return Response(
            DescuentoSerializer(descuento).data,
            status=status.HTTP_201_CREATED
        )

    except Exception as e:
        return Response(
            {'error': 'Error interno', 'detalle': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


#------------------- API CREACION DE MEDIDA -------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def crear_medida(request):
    """
    Crea un nuevo Iva en la BD del tenant,
    tras validar usuario legacy + token JWT.
    """
    try:
        usuario  = request.data.get('usuario')
        token    = request.data.get('token')
        subdom   = request.data.get('subdominio')
        datos    = request.data.get('datos')  # {"porcentaje": "16.00"}

        if not all([usuario, token, datos]):
            return Response(
                {'error': 'Debe incluir usuario, token y datos de la MEDIDA'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # resolver subdominio
        if not subdom:
            host = request.get_host().split(':')[0]
            subdom = host.split('.')[0].lower()

        # buscar tenant y conectar
        dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
        if not dominio_obj:
            return Response({'error': 'Dominio no válido'}, status=status.HTTP_400_BAD_REQUEST)

        tienda = dominio_obj.tienda
        alias  = str(tienda.id)
        conectar_db_tienda(alias, tienda)

        # validar usuario legacy
        LoginUsuario = apps.get_model('nova', 'LoginUsuario')
        try:
            user = LoginUsuario.objects.using(alias).get(usuario=usuario)
        except LoginUsuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_401_UNAUTHORIZED)

        # decodificar/refresh token
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except ExpiredSignatureError:
            nuevo = generar_token_jwt(usuario)
            user.token = nuevo
            user.save(using=alias)
            token = nuevo
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except InvalidTokenError:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        if payload.get("usuario") != usuario or user.token != token:
            return Response({'error': 'Token no coincide con el usuario'}, status=status.HTTP_401_UNAUTHORIZED)

        # validar formato de datos
        if not isinstance(datos, dict):
            return Response({'error': 'Datos debe ser un diccionario'}, status=status.HTTP_400_BAD_REQUEST)

        nombre = datos.get('nombre')
        if nombre is None:
            return Response({'error': "El campo 'nombre' es obligatorio"}, status=status.HTTP_400_BAD_REQUEST)

        # serializar y guardar
        serializer = TipoMedidaSerializer(data=datos)
        serializer.is_valid(raise_exception=True)

        Medida = apps.get_model('main_dashboard', 'TipoMedida')
        medida = Medida.objects.using(alias).create(**serializer.validated_data)

        return Response(
            DescuentoSerializer(medida).data,
            status=status.HTTP_201_CREATED
        )

    except Exception as e:
        return Response(
            {'error': 'Error interno', 'detalle': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


#------------------- API GUARDAR IMAGEN -------------------



@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def subir_imagen_producto(request, producto_id):
    """
    Sube una imagen para un producto, organizándola en carpetas
    por subdominio y categoría.
    """
    try:
        # ------------------------------
        # 1) Leer datos básicos
        # ------------------------------
        usuario      = request.data.get('usuario')
        token        = request.data.get('token')
        subdom       = request.data.get('subdominio') or request.get_host().split(':')[0].split('.')[0].lower()
        categoria_id = request.data.get('categoria_id')
        imagen_f     = request.FILES.get('imagen')

        if not all([usuario, token, categoria_id, imagen_f]):
            return Response(
                {'error': 'Debe enviar usuario, token, categoria_id y un archivo de imagen'},
                status=400
            )

        # ------------------------------
        # 2) Resolver tenant y conectar
        # ------------------------------
        Dominios = apps.get_model('nova', 'Dominios')
        dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
        if not dominio_obj:
            return Response({'error': 'Dominio no válido'}, status=400)

        tienda = dominio_obj.tienda
        alias  = str(tienda.id)
        conectar_db_tienda(alias, tienda)

        # ------------------------------
        # 3) Validar usuario y token
        # ------------------------------
        LoginUsuario = apps.get_model('nova', 'LoginUsuario')
        try:
            user = LoginUsuario.objects.using(alias).get(usuario=usuario)
        except LoginUsuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=401)

        try:
            payload = jwt_decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except ExpiredSignatureError:
            # Refrescar token
            nuevo_token = generar_token_jwt(usuario)
            user.token = nuevo_token
            user.save(using=alias)
            token   = nuevo_token
            payload = jwt_decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except InvalidTokenError:
            return Response({'error': 'Token inválido'}, status=401)

        if payload.get("usuario") != usuario or user.token != token:
            return Response({'error': 'Token no coincide con el usuario'}, status=401)

        # ------------------------------
        # 4) Obtener Producto y Categoria
        # ------------------------------
        Producto  = apps.get_model('main_dashboard', 'Producto')
        Categoria = apps.get_model('main_dashboard', 'Categoria')

        try:
            producto = Producto.objects.using(alias).get(pk=producto_id)
        except Producto.DoesNotExist:
            return Response({'error': 'Producto no encontrado'}, status=404)

        try:
            categoria = Categoria.objects.using(alias).get(pk=int(categoria_id))
        except (Categoria.DoesNotExist, ValueError):
            return Response({'error': 'Categoría no encontrada o ID inválido'}, status=404)

        # ------------------------------
        # 5) Crear carpeta y guardar imagen
        # ------------------------------
        # Extensión del archivo
        ext = imagen_f.name.rsplit('.', 1)[-1]

        # Slugify del nombre de la categoría
        slug_cat = slugify(categoria.nombre)

        # Ruta completa: MEDIA_ROOT/<subdominio>/<slug_categoria>/
        folder = os.path.join(settings.MEDIA_ROOT, subdom, slug_cat)

        # LOG: Depuración
        print(f"[IMAGEN] MEDIA_ROOT: {settings.MEDIA_ROOT}")
        print(f"[IMAGEN] Subdominio: {subdom}, Categoría: {slug_cat}")
        print(f"[IMAGEN] Folder path: {folder}")

        os.makedirs(folder, exist_ok=True)

        # LOG: Verificar carpeta creada
        print(f"[IMAGEN] Carpeta existe: {os.path.exists(folder)}")
        print(f"[IMAGEN] Permisos: {oct(os.stat(folder).st_mode) if os.path.exists(folder) else 'N/A'}")

        # Nombre del archivo: <producto_id>.<ext>
        filename = f"{producto_id}.{ext}"
        fullpath = os.path.join(folder, filename)

        # LOG: Antes de escribir
        print(f"[IMAGEN] Archivo: {filename}, Ruta: {fullpath}")
        print(f"[IMAGEN] Tamaño imagen: {imagen_f.size} bytes")

        # Escribir archivo
        with open(fullpath, 'wb+') as dest:
            for chunk in imagen_f.chunks():
                dest.write(chunk)

        # LOG: Verificar archivo creado
        if os.path.exists(fullpath):
            print(f"[IMAGEN] ✓ Archivo creado. Tamaño: {os.path.getsize(fullpath)} bytes")
        else:
            print(f"[IMAGEN] ✗ ERROR: Archivo NO creado")

        # ------------------------------
        # 6) Actualizar URL pública y guardar en BD
        # ------------------------------
        public_url = os.path.join(settings.MEDIA_URL, subdom, slug_cat, filename)
        producto.imagen_producto = public_url
        producto.save(using=alias)

        # ------------------------------
        # 7) Preparar respuesta
        # ------------------------------
        data = {'imagenUrl': public_url}
        if 'nuevo_token' in locals():
            data['nuevo_token'] = nuevo_token

        return Response(data, status=200)

    except Exception as e:
        traceback.print_exc()
        return Response(
            {'error': 'Error del servidor', 'detalle': str(e)},
            status=500
        )



#------------------- OBTENER IMAGEN -------------------

@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([FormParser, MultiPartParser, JSONParser])
def obtener_imagen(request):
    """
    Devuelve la(s) URL(s) de imagen de producto(s).
    Si envías `producto_id`, trae solo esa imagen.
    Si en su lugar envías `categoria_id`, trae todas las imágenes de esa categoría.
    Requiere los mismos datos de tenancy y auth que la vista de subida.
    """
    try:
        # 1) Extraer datos de tenancy y auth
        usuario      = request.data.get('usuario')
        token        = request.data.get('token')
        subdom       = request.data.get('subdominio') \
                         or request.get_host().split(':')[0].split('.')[0].lower()
        producto_id  = request.data.get('producto_id')
        categoria_id = request.data.get('categoria_id')

        if not all([usuario, token]) or not (producto_id or categoria_id):
            return Response(
                {'error': 'Debe enviar usuario, token y al menos producto_id o categoria_id'},
                status=400
            )

        # 2) Resolver tenant
        Dominios = apps.get_model('nova', 'Dominios')
        dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
        if not dominio_obj:
            return Response({'error': 'Dominio no válido'}, status=400)
        tienda = dominio_obj.tienda
        alias  = str(tienda.id)
        conectar_db_tienda(alias, tienda)

        # 3) Validar JWT
        LoginUsuario = apps.get_model('nova', 'LoginUsuario')
        try:
            user = LoginUsuario.objects.using(alias).get(usuario=usuario)
        except LoginUsuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=401)

        try:
            payload = jwt_decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except ExpiredSignatureError:
            # refrescar token y volver a decodificar
            nuevo_token = generar_token_jwt(usuario)
            user.token = nuevo_token
            user.save(using=alias)
            token   = nuevo_token
            payload = jwt_decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except InvalidTokenError:
            return Response({'error': 'Token inválido'}, status=401)

        if payload.get("usuario") != usuario or user.token != token:
            return Response({'error': 'Token no coincide con el usuario'}, status=401)

        # 4) Preparar modelos
        Producto  = apps.get_model('main_dashboard', 'Producto')
        Categoria = apps.get_model('main_dashboard', 'Categoria')

        urls = []

        # 5a) Si piden un producto concreto
        if producto_id:
            try:
                prod = Producto.objects.using(alias).get(pk=int(producto_id))
            except (Producto.DoesNotExist, ValueError):
                return Response({'error': 'Producto no encontrado'}, status=404)

            if prod.imagen_producto:
                urls = [prod.imagen_producto]

        # 5b) Si piden todas las imágenes de una categoría
        else:
            try:
                cat = Categoria.objects.using(alias).get(pk=int(categoria_id))
            except (Categoria.DoesNotExist, ValueError):
                return Response({'error': 'Categoría no encontrada'}, status=404)

            qs = Producto.objects.using(alias).filter(categoria_id=cat.pk)
            # Solo devolvemos las que tengan imagen
            urls = [
               p.imagen_producto 
               for p in qs 
               if p.imagen_producto
            ]
            if not urls:
                return Response({'error': 'No hay imágenes para esa categoría'}, status=404)

        # 6) Responder con la(s) URL(s)
        data = {'imagenes': urls}
        if 'nuevo_token' in locals():
            data['nuevo_token'] = nuevo_token
        return Response(data, status=200)

    except Exception as e:
        traceback.print_exc()
        return Response(
            {'error': 'Error del servidor', 'detalle': str(e)},
            status=500
        )









# =========================================================
#                     Tenant helper
# =========================================================
class TenantMixin:
    """
    Resuelve el alias de BD en cada request en base a (usuario, token, subdominio).
    Acepta los parámetros por body JSON o querystring (?usuario=&token=&subdominio=).
    """
    permission_classes = [AllowAny]
    db_alias = None
    _tenant_user = None
    _tenant_tienda = None

    def _resolve_alias(self, request):
        if self.db_alias:
            return self.db_alias

        usuario = request.data.get('usuario') or request.query_params.get('usuario')
        token   = request.data.get('token')   or request.query_params.get('token')
        subdom  = request.data.get('subdominio') or request.query_params.get('subdominio')

        if not subdom:
            host = request.get_host().split(':')[0]
            subdom = host.split('.')[0].lower()

        if not usuario or not token:
            raise ValueError('usuario y token son requeridos (en body o querystring).')

        dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).select_related('tienda').first()
        if not dominio_obj:
            raise ValueError('Dominio no válido.')

        tienda = dominio_obj.tienda
        alias = str(tienda.id)
        conectar_db_tienda(alias, tienda)

        LoginUsuario = apps.get_model('nova', 'LoginUsuario')
        user = LoginUsuario.objects.using(alias).filter(usuario=usuario).first()
        if not user:
            raise ValueError('Usuario no encontrado.')

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except ExpiredSignatureError:
            nuevo = generar_token_jwt(usuario)
            user.token = nuevo
            user.save(using=alias)
            token = nuevo
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except InvalidTokenError:
            raise ValueError('Token inválido.')

        if payload.get("usuario") != usuario or user.token != token:
            raise ValueError('Token no coincide.')

        self.db_alias = alias
        self._tenant_user = user
        self._tenant_tienda = tienda
        return self.db_alias

    # DRF hooks
    def get_queryset(self):
        alias = self._resolve_alias(self.request)
        return super().get_queryset().using(alias)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        alias = self._resolve_alias(self.request)
        ctx['db_alias'] = alias
        return ctx


# =========================================================
#           Helpers alias-aware de inventario
# =========================================================
def _actualizar_cache_stock_producto_alias(alias: str, producto_id: int, incluir_trn: bool = False):
    qs = Existencia.objects.using(alias).filter(producto_id=producto_id)
    if not incluir_trn:
        qs = qs.exclude(bodega__tipo='TRN')
    total = qs.aggregate(
        total=Coalesce(Sum(F('cantidad') - F('reservado')), Value(0))
    )['total']
    Producto.objects.using(alias).filter(pk=producto_id).update(stock=total)


@transaction.atomic
def ajustar_stock_alias(alias: str, producto_id: int, bodega_id: int, delta: int):
    with transaction.atomic(using=alias):
        exi, _ = (Existencia.objects.using(alias)
                  .select_for_update()
                  .get_or_create(producto_id=producto_id, bodega_id=bodega_id, defaults={'cantidad': 0}))
        nueva = int(exi.cantidad) + int(delta)
        if nueva < 0:
            raise ValueError('Stock insuficiente para la operación')
        exi.cantidad = nueva
        exi.save(using=alias)
        _actualizar_cache_stock_producto_alias(alias, producto_id)
        return exi

def _get_bodega_transito_para_alias(alias: str, origen: Bodega) -> Bodega:
    b = Bodega.objects.using(alias).filter(sucursal=origen.sucursal, tipo='TRN').first()
    if not b:
        b = Bodega.objects.using(alias).create(
            sucursal=origen.sucursal, nombre='En tránsito', tipo='TRN',
            estatus=True, es_predeterminada=False
        )
    return b

@transaction.atomic
def enviar_traslado_alias(alias: str, traslado_id: int) -> Traslado:
    with transaction.atomic(using=alias):
        t = (Traslado.objects.using(alias)
             .select_for_update()
             .select_related('bodega_origen', 'bodega_destino')
             .prefetch_related('lineas')
             .get(pk=traslado_id))
        if t.estado != 'BOR':
            raise ValueError('Solo se puede ENVIAR un traslado en estado BORRADOR.')
        if not t.lineas.exists():
            raise ValueError('El traslado no tiene líneas.')
        bodega_trn = _get_bodega_transito_para_alias(alias, t.bodega_origen) if t.usar_bodega_transito else None

        for ln in t.lineas.select_for_update():
            ajustar_stock_alias(alias, ln.producto_id, t.bodega_origen_id, -int(ln.cantidad))
            if bodega_trn:
                ajustar_stock_alias(alias, ln.producto_id, bodega_trn.id, +int(ln.cantidad))

        t.estado = 'ENV'
        from django.utils import timezone
        t.enviado_en = timezone.now()
        t.save(using=alias)
        return t

@transaction.atomic
def recibir_traslado_alias(alias: str, traslado_id: int, cantidades_map: dict | None) -> Traslado:
    with transaction.atomic(using=alias):
        t = (Traslado.objects.using(alias)
             .select_for_update()
             .select_related('bodega_origen', 'bodega_destino')
             .prefetch_related('lineas')
             .get(pk=traslado_id))
        if t.estado != 'ENV':
            raise ValueError('Solo se puede RECIBIR un traslado ENVIADO.')
        bodega_trn = _get_bodega_transito_para_alias(alias, t.bodega_origen) if t.usar_bodega_transito else None

        for ln in t.lineas.select_for_update():
            pendiente = max(0, int(ln.cantidad) - int(ln.cantidad_recibida))
            if pendiente == 0:
                continue
            qty = cantidades_map.get(ln.producto_id, pendiente) if cantidades_map else pendiente
            qty = int(qty)
            if qty <= 0 or qty > pendiente:
                raise ValueError(f'Cantidad inválida para producto {ln.producto_id}.')
            if bodega_trn:
                ajustar_stock_alias(alias, ln.producto_id, bodega_trn.id, -qty)
            ajustar_stock_alias(alias, ln.producto_id, t.bodega_destino_id, +qty)
            ln.cantidad_recibida = int(ln.cantidad_recibida) + qty
            ln.save(using=alias)

        if all(int(l.cantidad_recibida) >= int(l.cantidad) for l in t.lineas.all()):
            t.estado = 'REC'
            from django.utils import timezone
            t.recibido_en = timezone.now()
        t.save(using=alias)
        return t

@transaction.atomic
def cancelar_traslado_alias(alias: str, traslado_id: int) -> Traslado:
    with transaction.atomic(using=alias):
        t = (Traslado.objects.using(alias)
             .select_for_update()
             .select_related('bodega_origen', 'bodega_destino')
             .prefetch_related('lineas')
             .get(pk=traslado_id))
        if t.estado == 'REC':
            raise ValueError('No se puede cancelar un traslado ya recibido.')
        if t.estado == 'CAN':
            return t

        if t.estado == 'ENV':
            bodega_trn = _get_bodega_transito_para_alias(alias, t.bodega_origen) if t.usar_bodega_transito else None
            for ln in t.lineas.select_for_update():
                qty_pend = max(0, int(ln.cantidad) - int(ln.cantidad_recibida))
                if qty_pend <= 0:
                    continue
                if bodega_trn:
                    ajustar_stock_alias(alias, ln.producto_id, bodega_trn.id, -qty_pend)
                ajustar_stock_alias(alias, ln.producto_id, t.bodega_origen_id, +qty_pend)

        t.estado = 'CAN'
        t.save(using=alias)
        return t


# =========================================================
#                   ViewSets alias-aware
# =========================================================
class BodegaViewSet(viewsets.ModelViewSet):
    serializer_class = BodegaSerializer

    # ---------- resolver alias ----------
    def _resolve_alias(self, request):
        # 1) si viene alias directo, úsalo
        alias = request.data.get('alias') or request.query_params.get('alias')
        if alias:
            return str(alias)

        # 2) tomar subdominio del body / query / Host
        sub = (request.data.get('subdominio')
               or request.query_params.get('subdominio'))
        if not sub:
            # ej: tienda.midominio.com -> 'tienda'
            host = request.get_host().split(':')[0]
            sub = host.split('.')[0].lower()

        # 3) buscar tenant por Dominios y conectar
        dom = Dominios.objects.filter(dominio__icontains=sub).select_related('tienda').first()
        if not dom:
            raise ValidationError({'subdominio': 'Dominio no válido'})

        tienda = dom.tienda
        alias = str(tienda.id)
        # si usas conexión dinámica por alias:
        try:
            conectar_db_tienda(alias, tienda)
        except Exception:
            # si ya estaba conectada o no usas multi DB dinámico, puedes ignorar
            pass
        return alias

    # ---------- (opcional) validar token y existencia del usuario en el tenant ----------
    def _ensure_user_in_tenant(self, request, alias: str):
        usuario = request.data.get('usuario') or request.query_params.get('usuario')
        token   = request.data.get('token')   or request.query_params.get('token')
        if not usuario:
            raise ValidationError({'usuario': 'Campo requerido'})
        if not token:
            raise AuthenticationFailed('Token requerido')

        # validar/decodificar token
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except ExpiredSignatureError:
            raise AuthenticationFailed('Token expirado')
        except InvalidTokenError:
            raise AuthenticationFailed('Token inválido')

        if payload.get("usuario") != usuario:
            raise AuthenticationFailed('Token no coincide con el usuario')

        # debe existir en el tenant
        exists = LoginUsuario.objects.using(alias).filter(usuario__iexact=usuario).exists()
        if not exists:
            raise ValidationError({'usuario': f"Usuario '{usuario}' no existe en el tenant {alias}."})

    # ---------- queryset/context ----------
    def get_queryset(self):
        alias = self._resolve_alias(self.request)
        # (opcional) exigir autenticación por token:
        # self._ensure_user_in_tenant(self.request, alias)
        return Bodega.objects.using(alias).select_related('sucursal', 'responsable')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['db_alias'] = self._resolve_alias(self.request)
        ctx['request']  = self.request   # el serializer leerá 'usuario' de aquí
        return ctx

    # ---------- respuestas con mensaje ----------
    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        self.perform_create(ser)
        return Response(
            {"ok": True, "mensaje": "Bodega creada correctamente.", "data": ser.data},
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        ser = self.get_serializer(instance, data=request.data, partial=partial)
        ser.is_valid(raise_exception=True)
        self.perform_update(ser)
        return Response(
            {"ok": True, "mensaje": "Bodega actualizada correctamente.", "data": ser.data},
            status=status.HTTP_200_OK
        )

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({"ok": True, "mensaje": "Bodega eliminada correctamente."}, status=status.HTTP_200_OK)

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        ser = self.get_serializer(page or qs, many=True)
        if page is not None:
            pag = self.get_paginated_response(ser.data)
            pag.data['ok'] = True
            pag.data['mensaje'] = "Listado de bodegas."
            pag.data['data'] = pag.data.pop('results', ser.data)
            return pag
        return Response({"ok": True, "mensaje": "Listado de bodegas.", "data": ser.data})

    def retrieve(self, request, *args, **kwargs):
        ser = self.get_serializer(self.get_object())
        return Response({"ok": True, "mensaje": "Detalle de bodega.", "data": ser.data})
        









class ExistenciaViewSet(TenantMixin, viewsets.ModelViewSet):
    queryset = (Existencia.objects
                .all()
                .select_related('producto', 'bodega', 'bodega__sucursal'))
    serializer_class = ExistenciaSerializer

    # (opcional) filtros para listar/buscar
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = {'producto': ['exact', 'in'], 'bodega': ['exact', 'in']}
    ordering_fields = ['actualizado_en', 'cantidad', 'reservado', 'id']
    ordering = ['-actualizado_en']
    search_fields = ['producto__sku', 'bodega__nombre']

    # si tu serializer usa el alias en el contexto, puedes inyectarlo:
    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        # no hace falta resolver alias aquí (ya se resuelve en get_queryset),
        # pero si tu serializer lo necesita, descomenta:
        # ctx['db_alias'] = self._resolve_alias(self.request)
        ctx['request'] = self.request
        return ctx

    @action(detail=False, methods=['post'])
    def ajustar(self, request):
        """
        Ajuste de stock por (producto, bodega).
        Acepta credenciales de tenant en body o querystring.

        Body de ejemplo:
        {
          "usuario": "juanprueba",
          "token": "JWT...",
          "subdominio": "cruz-verde-b678df",
          "producto": 1,
          "bodega": 2,
          "delta": 5   // + entra, - sale
        }
        """
        # 1) resolver alias del tenant con tu mixin
        try:
            alias = self._resolve_alias(request)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        # 2) validar payload del ajuste
        pid = request.data.get('producto')
        bid = request.data.get('bodega')
        delta = request.data.get('delta')
        if pid is None or bid is None or delta is None:
            return Response({'detail': 'producto, bodega y delta son requeridos.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # 3) ajustar stock en la BD del alias
        try:
            exi = ajustar_stock_alias(alias, int(pid), int(bid), int(delta))
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # 4) serializar (tu modelo ya tiene .disponible como @property)
        data = self.get_serializer(exi).data
        return Response(data, status=200)

    @action(detail=False, methods=['post'])
    def productos_por_bodega(self, request):
        """
        Obtiene productos con su stock en una bodega específica.
        Útil para el componente de traslados.

        Body de ejemplo:
        {
          "usuario": "juanprueba",
          "token": "JWT...",
          "subdominio": "cruz-verde-b678df",
          "bodega_id": 1,
          "solo_con_stock": true  // opcional, solo productos con cantidad > 0
        }
        """
        import logging
        logger = logging.getLogger(__name__)

        logger.info(f'[productos_por_bodega] Request recibido. Data: {request.data}')

        # 1) resolver alias del tenant
        try:
            alias = self._resolve_alias(request)
            logger.info(f'[productos_por_bodega] Alias resuelto: {alias}')
        except Exception as e:
            logger.error(f'[productos_por_bodega] Error resolviendo alias: {e}')
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        # 2) obtener parámetros
        bodega_id = request.data.get('bodega_id') or request.query_params.get('bodega_id')
        solo_con_stock = request.data.get('solo_con_stock', True)

        logger.info(f'[productos_por_bodega] Parámetros - bodega_id: {bodega_id}, solo_con_stock: {solo_con_stock}')

        if not bodega_id:
            logger.warning('[productos_por_bodega] bodega_id no proporcionado')
            return Response({'detail': 'bodega_id es requerido.'},
                          status=status.HTTP_400_BAD_REQUEST)

        try:
            bodega_id = int(bodega_id)
        except (ValueError, TypeError):
            logger.error(f'[productos_por_bodega] bodega_id inválido: {bodega_id}')
            return Response({'detail': 'bodega_id debe ser un número entero.'},
                          status=status.HTTP_400_BAD_REQUEST)

        # 3) buscar existencias en la bodega
        try:
            queryset = (Existencia.objects.using(alias)
                       .filter(bodega_id=bodega_id)
                       .select_related('producto'))

            logger.info(f'[productos_por_bodega] Queryset creado. Count antes de filtro: {queryset.count()}')

            # filtrar solo con stock si se solicita
            if solo_con_stock:
                queryset = queryset.filter(cantidad__gt=0)
                logger.info(f'[productos_por_bodega] Aplicado filtro solo_con_stock. Count después: {queryset.count()}')

            # 4) construir respuesta con datos del producto + existencia
            resultados = []
            for existencia in queryset:
                producto = existencia.producto
                resultados.append({
                    'id': producto.id,
                    'nombre': producto.nombre,
                    'sku': producto.sku,
                    'precio': float(producto.precio) if producto.precio else 0,
                    'imagen_producto': producto.imagen_producto,
                    'stock_bodega': existencia.cantidad,
                    'reservado_bodega': existencia.reservado,
                    'disponible_bodega': existencia.disponible,
                    'stock_total': producto.stock,  # cache del stock total
                    'id_categoria': producto.categoria_id.pk if producto.categoria_id else None,
                    'id_marca': producto.marca_id.pk if producto.marca_id else None,
                    'id_iva': producto.iva_id.pk if producto.iva_id else None,
                    'sucursal_id': producto.sucursal_id,
                    'activo': getattr(producto, 'activo', True),
                    'bodega_id': bodega_id,
                    'existencia_id': existencia.id,
                })

            logger.info(f'[productos_por_bodega] Resultados generados: {len(resultados)} productos')

            response = Response({'datos': resultados}, status=200)
            logger.info(f'[productos_por_bodega] Respuesta enviada exitosamente')
            return response

        except Exception as e:
            logger.error(f'[productos_por_bodega] Exception: {e}', exc_info=True)
            return Response({'detail': f'Error interno: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TrasladoViewSet(TenantMixin, viewsets.ModelViewSet):
    queryset = (Traslado.objects
                .all()
                .select_related('bodega_origen', 'bodega_destino')
                .prefetch_related('lineas'))
    serializer_class = TrasladoSerializer

    @action(detail=True, methods=['post'])
    def enviar(self, request, pk=None):
        """
        Envía un traslado.
        Solo actualiza inventario_existencia (resta de bodega origen).
        NO modifica productos.stock (el stock total no cambia, solo se mueve).
        """
        try:
            alias = self._resolve_alias(request)
            # Solo enviar el traslado, sin tocar productos.stock
            t = enviar_traslado_alias(alias, int(pk))
            ser = self.get_serializer(t)
            return Response(ser.data, status=200)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def recibir(self, request, pk=None):
        try:
            alias = self._resolve_alias(request)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        cantidades = request.data.get('cantidades')
        mapa = None
        if cantidades:
            try:
                mapa = {int(item['producto']): int(item['cantidad']) for item in cantidades}
            except Exception:
                return Response({'detail': 'Formato inválido en "cantidades".'},
                                status=status.HTTP_400_BAD_REQUEST)

        from django.db import transaction
        from django.db.models import F
        from main_dashboard.models import Producto

        try:
            with transaction.atomic(using=alias):

                traslado = (
                    Traslado.objects.using(alias)
                    .select_for_update()   # 🔒 bloquea el traslado
                    .prefetch_related('lineas')
                    .get(pk=pk)
                )

                productos_cantidades = mapa or {
                    linea.producto_id: linea.cantidad
                    for linea in traslado.lineas.all()
                }

                # 🔐 1. BLOQUEAR PRODUCTOS y VALIDAR STOCK
                productos = (
                    Producto.objects.using(alias)
                    .select_for_update()
                    .filter(pk__in=productos_cantidades.keys())
                )

                productos_map = {p.id: p for p in productos}

                for producto_id, cantidad in productos_cantidades.items():
                    if producto_id not in productos_map:
                        raise Exception(f"Producto {producto_id} no existe")

                    if productos_map[producto_id].stock < cantidad:
                        raise Exception(
                            f"Stock insuficiente para producto {producto_id}. "
                            f"Disponible: {productos_map[producto_id].stock}, "
                            f"Requerido: {cantidad}"
                        )

                # ✅ 2. RECIBIR TRASLADO (actualiza inventario_existencia)
                t = recibir_traslado_alias(alias, int(pk), mapa)

                # ✅ 3. DESCONTAR STOCK (GARANTIZADO)
                for producto_id, cantidad in productos_cantidades.items():
                    Producto.objects.using(alias).filter(pk=producto_id).update(
                        stock=F('stock') - cantidad
                    )

            ser = self.get_serializer(t)
            return Response(ser.data, status=200)

        except Exception as e:
            return Response(
                {'detail': f'Error al recibir traslado: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )



    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        try:
            alias = self._resolve_alias(request)
            t = cancelar_traslado_alias(alias, int(pk))
            ser = self.get_serializer(t)
            return Response(ser.data, status=200)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'post'])
    def por_destino(self, request):
        """
        Lista traslados filtrados por bodega_destino_id.
        Acepta GET y POST.
        
        Parámetros:
        - bodega_destino_id: Puede ser:
            * Un ID único: 14
            * Un array de IDs: [14, 15, 16]
            * IDs separados por comas: "14,15,16"
        - estado: (opcional) Filtrar por estado: BOR, ENV, REC
        
        Ejemplos:
        
        # Una bodega
        POST /api/traslados/por-destino/
        {
            "usuario": "juanprueba",
            "token": "...",
            "subdominio": "...",
            "bodega_destino_id": 14
        }
        
        # Múltiples bodegas
        POST /api/traslados/por-destino/
        {
            "usuario": "juanprueba",
            "token": "...",
            "subdominio": "...",
            "bodega_destino_id": [14, 15, 16]
        }
        
        # Con filtro de estado
        POST /api/traslados/por-destino/
        {
            "usuario": "juanprueba",
            "token": "...",
            "subdominio": "...",
            "bodega_destino_id": [14, 15, 16],
            "estado": "ENV"
        }
        """

        # Obtener alias desde tu lógica existente
        try:
            alias = self._resolve_alias(request)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        # Obtener parámetro bodega_destino_id
        bodega_destino_id = (
            request.query_params.get("bodega_destino_id")
            or request.data.get("bodega_destino_id")
        )

        if not bodega_destino_id:
            return Response(
                {'detail': 'Debe enviar bodega_destino_id.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Normalizar a lista de IDs
        bodega_ids = []
        
        if isinstance(bodega_destino_id, list):
            # Ya es una lista: [14, 15, 16]
            bodega_ids = bodega_destino_id
        elif isinstance(bodega_destino_id, str):
            # Puede ser "14" o "14,15,16"
            if ',' in bodega_destino_id:
                # IDs separados por comas
                bodega_ids = [bid.strip() for bid in bodega_destino_id.split(',')]
            else:
                # ID único como string
                bodega_ids = [bodega_destino_id]
        else:
            # Es un número directo
            bodega_ids = [bodega_destino_id]

        # Convertir a enteros y validar
        try:
            bodega_ids = [int(bid) for bid in bodega_ids if str(bid).strip()]
        except (ValueError, TypeError):
            return Response(
                {'detail': 'Los IDs de bodega deben ser numéricos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not bodega_ids:
            return Response(
                {'detail': 'Debe enviar al menos un ID de bodega válido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Filtrar por bodega(s) destino usando __in
        queryset = self.get_queryset().filter(bodega_destino_id__in=bodega_ids)

        # Filtro opcional por estado
        estado = request.query_params.get("estado") or request.data.get("estado")
        if estado:
            queryset = queryset.filter(estado=estado)

        # Ordenar por fecha de creación (más recientes primero)
        queryset = queryset.order_by('-creado_en')

        # Serializar y retornar
        ser = self.get_serializer(queryset, many=True)
        return Response(ser.data, status=200)





@api_view(['GET'])
@permission_classes([AllowAny])
def debug_inventario(request):
    tx = TenantMixin()
    alias = tx._resolve_alias(request)  # usa usuario/token/subdominio del request
    conn = connections[alias]
    with conn.cursor() as cur:
        cur.execute("SHOW search_path;")
        search_path = cur.fetchone()[0]
        cur.execute("""
          SELECT table_schema, table_name
          FROM information_schema.tables
          WHERE table_name IN (
            'main_dashboard_sucursales','inventario_bodega','inventario_existencia',
            'inventario_traslado','inventario_traslado_linea'
          )
          ORDER BY table_schema, table_name
        """)
        tablas = cur.fetchall()
    return Response({
        "alias": alias,
        "db_name": conn.settings_dict.get('NAME'),
        "search_path": search_path,
        "tablas_encontradas": tablas,
    })





#------------------- obtener existencias por producto -------------------

from django.apps import apps
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Prefetch
import logging

logger = logging.getLogger(__name__)

class ProductoExistenciasView(TenantMixin, APIView):
    """
    Retorna todos los productos con sus existencias por bodega
    POST /api/productos-existencias/list/
    """
    
    def post(self, request):
        # Usar el método del mixin para resolver el alias y conectar la BD
        try:
            alias = self._resolve_alias(request)
        except Exception as e:
            return Response(
                {'ok': False, 'detail': str(e)}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Obtener el usuario autenticado desde el mixin
        user = self._tenant_user
        
        if not user:
            return Response(
                {'ok': False, 'detail': 'Usuario no encontrado'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        # 🔍 DEBUG: Verificar información del usuario
        logger.info(f"Usuario: {user.usuario}")
        logger.info(f"Rol: {user.rol}")
        logger.info(f"Sucursal ID: {user.id_sucursal_default_id}")
        logger.info(f"Sucursal Nombre: {user.id_sucursal_default.nombre if user.id_sucursal_default else 'None'}")

        # Determinar el queryset base según el rol
        if user.rol == 'admin':
            # ADMIN: Ve TODOS los productos sin restricción
            logger.info("Modo ADMIN: Cargando TODOS los productos")
            
            productos_qs = (
                Producto.objects.using(alias)
                .select_related(
                    'categoria_id',
                    'marca_id',
                    'sucursal',
                    'bodega',
                    'descuento',
                    'tipo_medida',
                    'iva_id'
                )
                .prefetch_related(
                    Prefetch(
                        'existencias',
                        queryset=Existencia.objects.using(alias)
                            .select_related('bodega', 'bodega__sucursal')
                            .order_by('bodega__nombre'),
                    )
                )
            )
        else:
            # VENDEDOR/ALMACEN/OPERARIO: Solo productos de su sucursal
            sucursal_id = user.id_sucursal_default_id
            
            logger.info(f"Modo {user.rol.upper()}: Filtrando por sucursal_id={sucursal_id}")
            
            if not sucursal_id:
                return Response(
                    {'ok': False, 'detail': 'El usuario no tiene una sucursal asignada'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Obtener IDs de bodegas de la sucursal del usuario
            bodegas_ids = list(
                Bodega.objects.using(alias)
                .filter(sucursal_id=sucursal_id, estatus=True)
                .values_list('id', flat=True)
            )
            
            # 🔍 DEBUG: Ver qué bodegas encontró
            logger.info(f"Bodegas encontradas para sucursal {sucursal_id}: {bodegas_ids}")
            
            # También loguear los nombres de las bodegas
            bodegas_info = Bodega.objects.using(alias).filter(
                sucursal_id=sucursal_id, estatus=True
            ).values('id', 'nombre', 'sucursal__nombre')
            logger.info(f"Detalles de bodegas: {list(bodegas_info)}")
            
            if not bodegas_ids:
                return Response(
                    {'ok': False, 'detail': 'No hay bodegas activas en su sucursal'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Filtrar productos que tienen existencias en las bodegas de su sucursal
            productos_qs = (
                Producto.objects.using(alias)
                .filter(existencias__bodega_id__in=bodegas_ids)
                .distinct()
                .select_related(
                    'categoria_id',
                    'marca_id',
                    'sucursal',
                    'bodega',
                    'descuento',
                    'tipo_medida',
                    'iva_id'
                )
                .prefetch_related(
                    Prefetch(
                        'existencias',
                        queryset=Existencia.objects.using(alias)
                            .filter(bodega_id__in=bodegas_ids)  # ← CRÍTICO: Filtrar existencias
                            .select_related('bodega', 'bodega__sucursal')
                            .order_by('bodega__nombre'),
                    )
                )
            )
            
            # 🔍 DEBUG: Contar productos filtrados
            total_productos_filtrados = productos_qs.count()
            logger.info(f"Total productos después del filtro: {total_productos_filtrados}")

        # Construir la respuesta
        data = []
        for producto in productos_qs:
            existencias_list = producto.existencias.all()
            
            # 🔍 DEBUG: Ver existencias de cada producto
            if user.rol != 'admin':
                logger.debug(f"Producto {producto.id} ({producto.nombre}): {len(existencias_list)} existencias")
                for ex in existencias_list:
                    logger.debug(f"  - Bodega: {ex.bodega.nombre} (ID: {ex.bodega_id}, Sucursal: {ex.bodega.sucursal.nombre})")
            
            # Para no-admin: si no tiene existencias en su sucursal, omitir
            if user.rol != 'admin' and not existencias_list:
                continue
            
            existencias = ExistenciaSerializer(
                existencias_list,
                many=True
            ).data

            data.append({
                "id": producto.id,
                "sku": producto.sku,
                "nombre": producto.nombre,
                "descripcion": producto.descripcion,
                "precio": str(producto.precio),
                "stock": producto.stock,
                "stock_total": producto.stock_total,
                
                # Relaciones ForeignKey
                "categoria": {
                    "id": producto.categoria_id.id_categoria if producto.categoria_id else None,
                    "nombre": producto.categoria_id.nombre if producto.categoria_id else None,
                } if producto.categoria_id else None,
                
                "marca": {
                    "id": producto.marca_id.id_marca if producto.marca_id else None,
                    "nombre": producto.marca_id.nombre if producto.marca_id else None,
                } if producto.marca_id else None,
                
                "sucursal": {
                    "id": producto.sucursal.id if producto.sucursal else None,
                    "nombre": producto.sucursal.nombre if producto.sucursal else None,
                    "ciudad": producto.sucursal.ciudad if producto.sucursal else None,
                } if producto.sucursal else None,
                
                "bodega": {
                    "id": producto.bodega.id if producto.bodega else None,
                    "nombre": producto.bodega.nombre if producto.bodega else None,
                } if producto.bodega else None,
                
                "descuento": {
                    "id": producto.descuento.id_descuento if producto.descuento else None,
                    "porcentaje": str(producto.descuento.porcentaje) if producto.descuento else None,
                } if producto.descuento else None,
                
                "tipo_medida": {
                    "id": producto.tipo_medida.id_tipo_medida if producto.tipo_medida else None,
                    "nombre": producto.tipo_medida.nombre if producto.tipo_medida else None,
                } if producto.tipo_medida else None,
                
                "iva": {
                    "id": producto.iva_id.id_iva if producto.iva_id else None,
                    "porcentaje": str(producto.iva_id.porcentaje) if producto.iva_id else None,
                } if producto.iva_id else None,
                
                # Campos adicionales
                "codigo_barras": producto.codigo_barras,
                "imei": producto.imei,
                "imagen_producto": producto.imagen_producto,
                "atributo": producto.atributo,
                "valor_atributo": producto.valor_atributo,
                "creado_en": producto.creado_en,
                
                # Existencias por bodega
                "existencias": existencias
            })

        logger.info(f"Productos finales en respuesta: {len(data)}")

        return Response({
            "ok": True,
            "mensaje": f"Listado de productos con existencias ({user.get_rol_display()})",
            "total_productos": len(data),
            "rol": user.rol,
            "sucursal_id": user.id_sucursal_default_id if user.rol != 'admin' else None,
            "sucursal": user.id_sucursal_default.nombre if user.id_sucursal_default and user.rol != 'admin' else None,
            "data": data
        }, status=status.HTTP_200_OK)


# ============================================================
#                 Endpoint para listar Sucursales
# ============================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def listar_sucursales(request):
    """
    Lista todas las sucursales disponibles para el usuario autenticado.
    Los admin ven todas las sucursales, los usuarios no-admin solo ven la suya.
    """
    try:
        # Obtener credenciales desde query params
        usuario = request.query_params.get('usuario')
        token = request.query_params.get('token')
        subdominio = request.query_params.get('subdominio')

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
        logger.error(f"Error en listar_sucursales: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)