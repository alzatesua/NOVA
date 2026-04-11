#!/usr/bin/env python
"""
Script para verificar si la tabla historial_login existe y puede insertar registros
"""
import os
import sys
import django

# Configurar Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nova.settings')
os.environ.setdefault('ENVIRONMENT', 'development')
django.setup()

from nova.models import Dominios, Tiendas
from main_dashboard.models import HistorialLogin
from django.utils import timezone
from django.db import connection

def verificar_tabla_historial():
    """Verifica si la tabla historial_login existe"""

    print("=" * 70)
    print("VERIFICACIÓN DE TABLA HISTORIAL_LOGIN")
    print("=" * 70)

    # Obtener todas las tiendas activas
    tiendas = Tiendas.objects.filter(es_activo=True)

    if not tiendas.exists():
        print("\n❌ No hay tiendas activas en la base de datos")
        return

    print(f"\n✅ Found {tiendas.count()} active tiendas")

    for tienda in tiendas:
        print(f"\n{'=' * 70}")
        print(f"Tienda: {tienda.nombre_tienda}")
        print(f"DB Name: {tienda.db_nombre}")
        print(f"DB User: {tienda.db_usuario}")
        print(f"{'=' * 70}")

        alias = str(tienda.id)

        try:
            # Verificar si la tabla existe
            with connection.cursor() as cursor:
                cursor.execute(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_name = 'historial_login'
                    )
                """)
                tabla_existe = cursor.fetchone()[0]

            if tabla_existe:
                print(f"✅ Tabla 'historial_login' EXISTE en la base de datos")

                # Intentar crear un registro de prueba
                try:
                    test_registro = HistorialLogin.objects.using(alias).create(
                        usuario_id=9999,
                        usuario_correo='test@prueba.com',
                        usuario_nombre='test_usuario',
                        fecha_hora_login=timezone.now(),
                        direccion_ip='127.0.0.1',
                        user_agent='Test Agent',
                        exitoso=True,
                        duracion_segundos=60
                    )

                    print(f"✅ Registro de prueba creado: ID {test_registro.id_historial}")

                    # Intentar leer el registro
                    registros = HistorialLogin.objects.using(alias).count()
                    print(f"✅ Total de registros en historial_login: {registros}")

                    # Eliminar el registro de prueba
                    test_registro.delete()
                    print(f"✅ Registro de prueba eliminado")

                except Exception as e:
                    print(f"❌ Error al crear registro de prueba: {str(e)}")
                    import traceback
                    traceback.print_exc()

            else:
                print(f"❌ La tabla 'historial_login' NO EXISTE en la base de datos")
                print(f"\n📝 Para crear la tabla, ejecuta:")
                print(f"   psql -U postgres -d {tienda.db_nombre} -f Z_BD/crear_historial_login.sql")

        except Exception as e:
            print(f"❌ Error al verificar tabla: {str(e)}")
            import traceback
            traceback.print_exc()

    print(f"\n{'=' * 70}")
    print("VERIFICACIÓN COMPLETADA")
    print(f"{'=' * 70}\n")

if __name__ == '__main__':
    verificar_tabla_historial()
