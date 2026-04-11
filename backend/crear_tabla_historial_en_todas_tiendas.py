#!/usr/bin/env python
"""
Script para crear la tabla historial_login en todas las bases de datos de tiendas
"""
import os
import sys
import psycopg2
from pathlib import Path

# Leer el archivo SQL
sql_file = Path(__file__).parent / 'Z_BD' / 'crear_historial_login.sql'

if not sql_file.exists():
    print(f"❌ Error: No se encuentra el archivo {sql_file}")
    sys.exit(1)

with open(sql_file, 'r') as f:
    sql_script = f.read()

print("=" * 70)
print("CREAR TABLA HISTORIAL_LOGIN EN TODAS LAS TIENDAS")
print("=" * 70)
print()

# Conectar a la base de datos principal
try:
    conn = psycopg2.connect(
        host='localhost',
        database='nova',
        user='postgres',
        password='tu_password'  # CAMBIAR ESTO
    )
    cursor = conn.cursor()

    # Obtener todas las tiendas
    cursor.execute("""
        SELECT id, db_nombre, db_usuario, db_password, nombre_tienda
        FROM nova_tiendas
        WHERE es_activo = TRUE
        ORDER BY nombre_tienda
    """)

    tiendas = cursor.fetchall()

    if not tiendas:
        print("❌ No hay tiendas activas en la base de datos")
        sys.exit(1)

    print(f"✅ Se encontraron {len(tiendas)} tiendas activas\n")

    # Procesar cada tienda
    for tienda_id, db_nombre, db_usuario, db_password, nombre_tienda in tiendas:
        print(f"\n{'=' * 70}")
        print(f"Tienda: {nombre_tienda}")
        print(f"Database: {db_nombre}")
        print(f"{'=' * 70}")

        try:
            # Conectar a la base de datos de la tienda
            tienda_conn = psycopg2.connect(
                host='localhost',
                database=db_nombre,
                user=db_usuario,
                password=db_password
            )
            tienda_cursor = tienda_conn.cursor()

            # Verificar si la tabla ya existe
            tienda_cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'historial_login'
                )
            """)
            tabla_existe = tienda_cursor.fetchone()[0]

            if tabla_existe:
                print(f"⚠️  La tabla 'historial_login' ya existe. Omitiendo.")
            else:
                # Ejecutar el script SQL
                tienda_cursor.execute(sql_script)
                tienda_conn.commit()
                print(f"✅ Tabla 'historial_login' creada exitosamente")

            # Cerrar conexión
            tienda_cursor.close()
            tienda_conn.close()

        except Exception as e:
            print(f"❌ Error con la tienda '{nombre_tienda}': {str(e)}")

    # Cerrar conexión principal
    cursor.close()
    conn.close()

    print(f"\n{'=' * 70}")
    print("PROCESO COMPLETADO")
    print(f"{'=' * 70}\n")

except Exception as e:
    print(f"❌ Error al conectar a la base de datos principal: {str(e)}")
    sys.exit(1)
