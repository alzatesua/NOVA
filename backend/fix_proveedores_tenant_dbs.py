#!/usr/bin/env python
"""
Script para corregir la columna creado_por_id en todas las BD de tenants
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nova.settings')
django.setup()

from django.db import connections
from nova.models import Tiendas, Dominios

def fix_proveedor_table(alias, db_name):
    """Alterar tabla proveedores en una BD específica"""
    try:
        with connections[alias].cursor() as cursor:
            # Verificar si la columna existe y tiene restricción NOT NULL
            cursor.execute("""
                SELECT column_default, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'proveedores'
                AND column_name = 'creado_por_id'
            """)
            result = cursor.fetchone()

            if result:
                is_nullable = result[1]
                print(f"  BD {db_name}: creado_por_id is_nullable={is_nullable}")

                if is_nullable == 'NO':
                    print(f"  🔧 Alterando tabla proveedores en BD {db_name}...")
                    cursor.execute("""
                        ALTER TABLE proveedores
                        ALTER COLUMN creado_por_id DROP NOT NULL
                    """)
                    print(f"  ✅ BD {db_name}: columna creado_por_id ahora permite NULL")
                else:
                    print(f"  ✅ BD {db_name}: ya permite NULL")
            else:
                print(f"  ⚠️  BD {db_name}: tabla proveedores no existe o columna no encontrada")

    except Exception as e:
        print(f"  ❌ Error en BD {db_name}: {str(e)}")

def main():
    print("=== CORRIGIENDO TABLA proveedores EN TODAS LAS BDs ===\n")

    # Primero corregir en la BD por defecto
    print("1. Base de datos DEFAULT:")
    fix_proveedor_table('default', 'default')

    # Conectar a cada BD de tenant y corregir
    print("\n2. Bases de datos de TENANTS:")
    tiendas = Tiendas.objects.using('default').all()

    for tienda in tiendas:
        print(f"\n  Tienda: {tienda.nombre_tienda} (ID: {tienda.id})")
        alias = str(tienda.id)

        # Conectar a la BD del tenant
        from nova.utils.db import conectar_db_tienda
        try:
            conectar_db_tienda(alias, tienda)
            fix_proveedor_table(alias, tienda.db_nombre)
        except Exception as e:
            print(f"  ❌ No se pudo conectar a {tienda.db_nombre}: {str(e)}")

    print("\n=== PROCESO COMPLETADO ===")

if __name__ == '__main__':
    main()
