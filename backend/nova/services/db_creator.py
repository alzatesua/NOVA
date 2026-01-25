import psycopg2
from psycopg2 import sql
import re
from django.contrib.auth.hashers import make_password
import jwt
import datetime as dt

from django.conf import settings

ADMIN_USER = 'postgres'
ADMIN_PW = 'zuleta18'


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
            host='localhost', port='5432'
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
            host='localhost', port='5432'
        )
        conn.autocommit = True
        cur = conn.cursor()

        # 3) Ejecutar estructura.sql
        ruta = "/home/dagi/nova/backend/Z_BD/estructura.sql"
        with open(ruta, 'r') as f:
            raw_sql = f.read()

        no_comments = re.sub(r'--.*?$', '', raw_sql, flags=re.MULTILINE)
        for part in no_comments.split(';'):
            stmt = part.strip()
            if not stmt or not re.match(r'^(CREATE|INSERT)', stmt, re.IGNORECASE):
                continue
            try:
                print(f"➡️ Ejecutando: {stmt[:80]}...")
                cur.execute(stmt)
            except Exception as inner_e:
                print(f"❌ Error ejecutando SQL:\n{stmt[:100]}")
                print("📛 Detalle:", inner_e)

        # 4) Verificar que la tabla 'login_usuario' exista
        cur.execute("""
            SELECT EXISTS (
                SELECT 1 FROM pg_tables 
                WHERE schemaname = 'public' AND tablename = 'login_usuario'
            )
        """)
        usuarios_existe = cur.fetchone()[0]
        print(f"📋 ¿Tabla 'login_usuario' existe?: {usuarios_existe}")

        # 5) Insertar usuario inicial si corresponde
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

        # 6) Otorgar permisos al usuario sobre el esquema y objetos
        cur.execute(sql.SQL("GRANT USAGE ON SCHEMA public TO {};").format(
            sql.Identifier(db_usuario)
        ))
        cur.execute(sql.SQL("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO {};").format(
            sql.Identifier(db_usuario)
        ))
        cur.execute(sql.SQL("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO {};").format(
            sql.Identifier(db_usuario)
        ))
        cur.execute(sql.SQL("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO {};").format(
            sql.Identifier(db_usuario)
        ))
        cur.execute(sql.SQL("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO {};").format(
            sql.Identifier(db_usuario)
        ))
        print(f"✅ Permisos otorgados a {db_usuario}")

        cur.close()
        conn.close()
        print(f"✅ Base de datos '{db_nombre}' configurada exitosamente.")
        return True

    except Exception as e:
        print("❌ Error durante crear_db:", e)
        return False
