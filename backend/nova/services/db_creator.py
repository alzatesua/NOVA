import psycopg2
from psycopg2 import sql
import re
from django.contrib.auth.hashers import make_password
import jwt
import datetime as dt
import os

from django.conf import settings

ADMIN_USER = os.environ.get('DB_USER', 'postgres')
ADMIN_PW = os.environ.get('DB_PASSWORD', 'zuleta18')
DB_HOST = os.environ.get('DB_HOST', 'db')
DB_PORT = os.environ.get('DB_PORT', '5432')


def generar_token_jwt(usuario, minutos_expiracion=60):
    """
    Genera un token JWT válido que incluye expiración ('exp'), emisión ('iat') y usuario.

    Args:
        usuario (str): Nombre de usuario.
        minutos_expiracion (int): Minutos hasta que expire el token.

    Returns:
        str: Token JWT válido.
    """
    ahora = dt.datetime.utcnow()
    expira = ahora + dt.timedelta(minutes=minutos_expiracion)

    payload = {
        'usuario': usuario,
        'iat': ahora,
        'exp': expira
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token


@staticmethod
def crear_db(db_nombre, db_password, db_usuario, usuario_data):
    try:
        # 1) Conexión como superusuario (postgres)
        admin_conn = psycopg2.connect(
            dbname='postgres', user=ADMIN_USER, password=ADMIN_PW,
            host=DB_HOST, port=DB_PORT
        )
        admin_conn.autocommit = True
        admin_cur = admin_conn.cursor()

        # 1.1) Crear usuario si no existe
        admin_cur.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (db_usuario,))
        if not admin_cur.fetchone():
            admin_cur.execute(
                sql.SQL("CREATE USER {} WITH ENCRYPTED PASSWORD {}").format(
                    sql.Identifier(db_usuario),
                    sql.Literal(db_password)
                )
            )
            print(f"✅ Usuario {db_usuario} creado")

        # 1.2) Crear base de datos si no existe
        admin_cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_nombre,))
        if not admin_cur.fetchone():
            admin_cur.execute(
                sql.SQL("CREATE DATABASE {} OWNER {}").format(
                    sql.Identifier(db_nombre),
                    sql.Identifier(db_usuario)
                )
            )
            print(f"✅ Base de datos {db_nombre} creada")

        admin_cur.close()
        admin_conn.close()

        # 2) Conexión a la nueva base de datos como superusuario
        conn = psycopg2.connect(
            dbname=db_nombre, user=ADMIN_USER, password=ADMIN_PW,
            host=DB_HOST, port=DB_PORT
        )
        conn.autocommit = True
        cur = conn.cursor()

        # 3) Ejecutar estructura.sql
        ruta = "/app/Z_BD/estructura.sql"
        with open(ruta, 'r') as f:
            raw_sql = f.read()

        no_comments = re.sub(r'--.*?$', '', raw_sql, flags=re.MULTILINE)
        errors = []
        for part in no_comments.split(';'):
            stmt = part.strip()
            if not stmt or not re.match(r'^(CREATE|INSERT)', stmt, re.IGNORECASE):
                continue
            try:
                print(f"➡️ Ejecutando: {stmt[:80]}...")
                cur.execute(stmt)
            except Exception as inner_e:
                error_msg = f"Error ejecutando SQL:\n{stmt[:100]}\nDetalle: {inner_e}"
                print(f"❌ {error_msg}")
                errors.append(error_msg)

        # Fail if there were any critical errors during table creation
        if errors:
            raise Exception(f"Se produjeron {len(errors)} errores al crear las tablas. Primer error: {errors[0]}")

        # 4) Verificar que las tablas críticas existan
        tablas_criticas = ['login_usuario', 'productos', 'inventario_bodega',
                           'main_dashboard_sucursales', 'inventario_existencia']
        tablas_faltantes = []
        for tabla in tablas_criticas:
            cur.execute("""
                SELECT EXISTS (
                    SELECT 1 FROM pg_tables
                    WHERE schemaname = 'public' AND tablename = %s
                )
            """, (tabla,))
            if not cur.fetchone()[0]:
                tablas_faltantes.append(tabla)

        if tablas_faltantes:
            raise Exception(f"Faltan las siguientes tablas críticas: {', '.join(tablas_faltantes)}")

        print(f"📋 Todas las tablas críticas verificadas correctamente")

        # 5) Verificar que la tabla 'login_usuario' exista (redundante pero mantenemos para compatibilidad)
        cur.execute("""
            SELECT EXISTS (
                SELECT 1 FROM pg_tables
                WHERE schemaname = 'public' AND tablename = 'login_usuario'
            )
        """)
        usuarios_existe = cur.fetchone()[0]
        print(f"📋 ¿Tabla 'login_usuario' existe?: {usuarios_existe}")

        # 6) Insertar usuario inicial si corresponde
        if usuarios_existe and usuario_data:
            pw_hash = make_password(usuario_data['password'])
            token = generar_token_jwt(usuario_data['usuario'])
            print("🔑 Token generado:", token)
            cur.execute(
                """
                INSERT INTO login_usuario 
                (correo_usuario, password, rol, is_active, is_admin, is_superuser, creado_en, usuario, token)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    usuario_data['correo_usuario'],                   # correo_usuario
                    pw_hash,                                 # password (hasheada)
                    usuario_data.get('rol', 'admin'),        # rol
                    usuario_data.get('es_activo', True),     # is_active
                    True,                                    # is_admin
                    True,                                    # is_superuser
                    dt.datetime.utcnow(),                       # creado_en
                    usuario_data['usuario'],                 #usuario
                    token                                    #token jwt
                )
            )
            print("✅ Usuario inicial insertado correctamente")
        else:
            print("⚠️ No se insertó el usuario porque la tabla 'login_usuario' no existe.")

        # 7) Cambiar el owner de todas las tablas y secuencias al usuario de la tienda
        # Primero obtenemos todas las tablas del esquema public
        cur.execute("""
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public'
        """)
        tablas = [row[0] for row in cur.fetchall()]

        for tabla in tablas:
            cur.execute(sql.SQL("ALTER TABLE {} OWNER TO {};").format(
                sql.Identifier(tabla),
                sql.Identifier(db_usuario)
            ))
            print(f"✅ Tabla {tabla} -> owner {db_usuario}")

        # Cambiar el owner de todas las secuencias
        cur.execute("""
            SELECT sequencename FROM pg_sequences
            WHERE schemaname = 'public'
        """)
        secuencias = [row[0] for row in cur.fetchall()]

        for secuencia in secuencias:
            cur.execute(sql.SQL("ALTER SEQUENCE {} OWNER TO {};").format(
                sql.Identifier(secuencia),
                sql.Identifier(db_usuario)
            ))
            print(f"✅ Secuencia {secuencia} -> owner {db_usuario}")

        # Otorgar permisos adicionales por seguridad
        cur.execute(sql.SQL("GRANT USAGE ON SCHEMA public TO {};").format(
            sql.Identifier(db_usuario)
        ))
        cur.execute(sql.SQL("GRANT ALL ON ALL TABLES IN SCHEMA public TO {};").format(
            sql.Identifier(db_usuario)
        ))
        cur.execute(sql.SQL("GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO {};").format(
            sql.Identifier(db_usuario)
        ))
        cur.execute(sql.SQL("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO {};").format(
            sql.Identifier(db_usuario)
        ))
        cur.execute(sql.SQL("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO {};").format(
            sql.Identifier(db_usuario)
        ))
        print(f"✅ Owner y permisos configurados para {db_usuario}")

        cur.close()
        conn.close()
        print(f"✅ Base de datos '{db_nombre}' configurada exitosamente.")
        return True

    except Exception as e:
        print("❌ Error durante crear_db:", e)
        return False
