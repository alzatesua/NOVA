#!/usr/bin/env python
"""
Script para reparar los permisos de las bases de datos existentes.
Cambia el owner de todas las tablas y secuencias al usuario correspondiente de cada tienda.
"""
import psycopg2
from psycopg2 import sql
import os

# Configuración de conexión
ADMIN_USER = os.environ.get('DB_USER', 'postgres')
ADMIN_PW = os.environ.get('DB_PASSWORD', 'zuleta18')
DB_HOST = os.environ.get('DB_HOST', 'db')
DB_PORT = os.environ.get('DB_PORT', '5432')

# Mapeo de bases de datos a sus usuarios correspondientes
BASES_DATOS = {
    'dagi-4a4487': 'sin_nit_4a4487',
    'edwin10-50d56e': '900011214545_50d56e',
    'ejemplo-99b940': 'sin_nit_99b940',
}


def reparar_base_de_datos(db_nombre, db_usuario):
    """Repara los permisos de una base de datos específica."""
    print(f"\n{'='*60}")
    print(f"Reparando base de datos: {db_nombre}")
    print(f"Usuario destino: {db_usuario}")
    print(f"{'='*60}")

    try:
        # Conectar a la base de datos como superusuario
        conn = psycopg2.connect(
            dbname=db_nombre,
            user=ADMIN_USER,
            password=ADMIN_PW,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.autocommit = True
        cur = conn.cursor()

        # 1. Obtener todas las tablas del esquema public
        cur.execute("""
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
        """)
        tablas = [row[0] for row in cur.fetchall()]
        print(f"\n📋 Encontradas {len(tablas)} tablas")

        # 2. Cambiar el owner de cada tabla
        for tabla in tablas:
            try:
                cur.execute(sql.SQL("ALTER TABLE {} OWNER TO {};").format(
                    sql.Identifier(tabla),
                    sql.Identifier(db_usuario)
                ))
                print(f"  ✅ Tabla {tabla} -> owner {db_usuario}")
            except Exception as e:
                print(f"  ❌ Error alterando tabla {tabla}: {e}")

        # 3. Obtener todas las secuencias del esquema public
        cur.execute("""
            SELECT sequencename FROM pg_sequences
            WHERE schemaname = 'public'
            ORDER BY sequencename
        """)
        secuencias = [row[0] for row in cur.fetchall()]
        print(f"\n📋 Encontradas {len(secuencias)} secuencias")

        # 4. Cambiar el owner de cada secuencia
        for secuencia in secuencias:
            try:
                cur.execute(sql.SQL("ALTER SEQUENCE {} OWNER TO {};").format(
                    sql.Identifier(secuencia),
                    sql.Identifier(db_usuario)
                ))
                print(f"  ✅ Secuencia {secuencia} -> owner {db_usuario}")
            except Exception as e:
                print(f"  ❌ Error alterando secuencia {secuencia}: {e}")

        # 5. Otorgar permisos adicionales
        print(f"\n🔐 Otorgando permisos adicionales...")
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
        print(f"  ✅ Permisos otorgados")

        cur.close()
        conn.close()
        print(f"\n✅ Base de datos '{db_nombre}' reparada exitosamente\n")
        return True

    except Exception as e:
        print(f"\n❌ Error reparando base de datos '{db_nombre}': {e}\n")
        return False


def main():
    """Función principal que repara todas las bases de datos."""
    print("\n" + "="*60)
    print("SCRIPT DE REPARACIÓN DE BASES DE DATOS")
    print("="*60)

    resultados = {}

    for db_nombre, db_usuario in BASES_DATOS.items():
        resultados[db_nombre] = reparar_base_de_datos(db_nombre, db_usuario)

    # Resumen final
    print("\n" + "="*60)
    print("RESUMEN DE REPARACIÓN")
    print("="*60)

    for db_nombre, exito in resultados.items():
        estado = "✅ EXITOSO" if exito else "❌ FALLÓ"
        print(f"{db_nombre}: {estado}")

    total = len(resultados)
    exitosas = sum(1 for v in resultados.values() if v)
    print(f"\nTotal: {exitosas}/{total} bases de datos reparadas")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
