#!/usr/bin/env python
"""
Script para verificar y crear la tabla historial_login en todas las tiendas.

Este script:
1. Obtiene todas las tiendas registradas en nova
2. Verifica si la tabla historial_login existe en cada BD
3. Si no existe, la crea automáticamente
4. Inserta un dato de prueba para verificar que funciona

Uso:
    cd backend
    source env/bin/activate
    export DJANGO_SETTINGS_MODULE=nova.settings.development
    export SECRET_KEY='tu-secret-key'
    python verificar_y_crear_historial_login.py
"""
import os
import sys

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configurar variables de entorno necesarias
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nova.settings.development')
if 'SECRET_KEY' not in os.environ:
    os.environ['SECRET_KEY'] = 'clave-secreta-temporal-para-script'

import django
django.setup()

from nova.models import Tiendas
from django.db import connections, connection
from django.utils import timezone
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def tabla_existe(db_alias, table_name='historial_login'):
    """Verifica si una tabla existe en la base de datos especificada."""
    try:
        with connections[db_alias].cursor() as cursor:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = %s
                );
            """, [table_name])
            return cursor.fetchone()[0]
    except Exception as e:
        logger.error(f"Error al verificar tabla en {db_alias}: {str(e)}")
        return False


def crear_tabla_historial_login(db_alias):
    """Crea la tabla historial_login en la base de datos especificada."""
    sql_create = """
    CREATE TABLE historial_login (
        id_historial BIGSERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL,
        usuario_correo VARCHAR(255) NOT NULL,
        usuario_nombre VARCHAR(100) NOT NULL,
        fecha_hora_login TIMESTAMP NOT NULL,
        fecha_hora_logout TIMESTAMP NULL,
        direccion_ip VARCHAR(45) NULL,
        user_agent TEXT NULL,
        exitoso BOOLEAN NOT NULL DEFAULT TRUE,
        fallo_reason VARCHAR(255) NULL,
        duracion_segundos INTEGER NULL,
        creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX historial_l_usuario_2c5cff_idx ON historial_login(usuario_id);
    CREATE INDEX historial_l_fecha_h_8fa8ac_idx ON historial_login(fecha_hora_login);
    CREATE INDEX historial_l_direcci_1745f7_idx ON historial_login(direccion_ip);
    CREATE INDEX historial_l_fecha_h_3d798d_idx ON historial_login(fecha_hora_login DESC, usuario_id);
    CREATE INDEX historial_l_exitoso_98cab1_idx ON historial_login(exitoso);
    """

    try:
        with connections[db_alias].cursor() as cursor:
            cursor.execute(sql_create)
            connections[db_alias].commit()
        logger.info(f"✅ Tabla creada exitosamente en {db_alias}")
        return True
    except Exception as e:
        logger.error(f"❌ Error al crear tabla en {db_alias}: {str(e)}")
        return False


def insertar_dato_prueba(db_alias, tienda_id):
    """Inserta un dato de prueba para verificar que la tabla funciona."""
    from main_dashboard.models import HistorialLogin

    try:
        # Importar conectar_db_tienda
        from nova.utils.db import conectar_db_tienda
        from multi_db_router import set_current_tienda_db

        # Obtener tienda
        tienda = Tiendas.objects.get(id=tienda_id)
        alias = str(tienda.id)

        # Conectar a BD
        conectar_db_tienda(alias, tienda)
        set_current_tienda_db({'alias': alias, 'tienda_id': tienda.id})

        # Insertar dato de prueba
        historial = HistorialLogin.objects.using(alias).create(
            usuario_id=1,
            usuario_correo='admin@tienda.com',
            usuario_nombre='admin',
            fecha_hora_login=timezone.now(),
            direccion_ip='127.0.0.1',
            user_agent='Script de verificación',
            exitoso=True,
            duracion_segundos=3600
        )

        logger.info(f"✅ Dato de prueba insertado en {db_alias} (ID: {historial.id_historial})")
        return True
    except Exception as e:
        logger.error(f"❌ Error al insertar dato de prueba en {db_alias}: {str(e)}")
        return False


def verificar_tienda(tienda):
    """Verifica y crea la tabla historial_login para una tienda específica."""
    tienda_id = str(tienda.id)
    tienda_nombre = tienda.nombre_tienda
    db_nombre = tienda.db_nombre

    logger.info(f"\n{'='*70}")
    logger.info(f"🏪 Tienda: {tienda_nombre} (ID: {tienda_id}, BD: {db_nombre})")
    logger.info(f"{'='*70}")

    # Verificar si la tabla existe
    if tabla_existe(tienda_id):
        logger.info(f"✅ La tabla 'historial_login' ya existe")

        # Contar registros
        try:
            from main_dashboard.models import HistorialLogin
            count = HistorialLogin.objects.using(tienda_id).count()
            logger.info(f"📊 Total de registros: {count}")
        except Exception as e:
            logger.warning(f"⚠️  No se pudieron contar registros: {str(e)}")
    else:
        logger.warning(f"⚠️  La tabla 'historial_login' NO existe")

        # Preguntar si desea crear
        print(f"\n¿Deseas crear la tabla en la tienda '{tienda_nombre}'? (s/n): ", end='')
        respuesta = input().strip().lower()

        if respuesta == 's':
            if crear_tabla_historial_login(tienda_id):
                # Insertar dato de prueba
                insertar_dato_prueba(tienda_id, tienda.id)
            else:
                logger.error(f"❌ No se pudo crear la tabla en {tienda_nombre}")
        else:
            logger.info(f"⏭️  Omitiendo tienda '{tienda_nombre}'")


def main():
    """Función principal."""
    logger.info("\n" + "="*70)
    logger.info("🔍 VERIFICACIÓN DE TABLA historial_login EN TIENDAS")
    logger.info("="*70 + "\n")

    # Obtener todas las tiendas
    tiendas = Tiendas.objects.all()

    if not tiendas.exists():
        logger.warning("⚠️  No hay tiendas registradas en el sistema")
        return

    logger.info(f"📊 Total de tiendas encontradas: {tiendas.count()}\n")

    # Verificar cada tienda
    for tienda in tiendas:
        verificar_tienda(tienda)

    logger.info("\n" + "="*70)
    logger.info("✅ VERIFICACIÓN COMPLETADA")
    logger.info("="*70 + "\n")


if __name__ == '__main__':
    main()
