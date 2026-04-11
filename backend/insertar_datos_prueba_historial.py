#!/usr/bin/env python
"""
Script para insertar datos de prueba en la tabla historial_login
"""
import os
import sys
import django
from datetime import datetime, timedelta
import random

# Configurar Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nova.settings')
os.environ.setdefault('ENVIRONMENT', 'development')
django.setup()

from nova.models import Dominios, Tiendas, LoginUsuario
from main_dashboard.models import HistorialLogin
from django.utils import timezone
from django.db import connection


def insertar_datos_prueba():
    """Inserta datos de prueba en historial_login"""

    print("=" * 70)
    print("INSERTAR DATOS DE PRUEBA EN HISTORIAL_LOGIN")
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

            if not tabla_existe:
                print(f"❌ La tabla 'historial_login' NO EXISTE")
                print(f"   Ejecuta primero: psql -U postgres -d {tienda.db_nombre} -f Z_BD/crear_historial_login.sql")
                continue

            # Obtener usuarios de esta tienda
            usuarios = LoginUsuario.objects.using(alias).all()[:5]  # Máximo 5 usuarios

            if not usuarios:
                print(f"⚠️  No hay usuarios en esta tienda")
                # Crear datos con usuario_id=0 como prueba
                usuarios = [None]

            print(f"📝 Insertando datos de prueba...")

            # Datos de prueba
            user_agents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
            ]

            ips_de_prueba = [
                '192.168.1.100',
                '190.24.56.78',
                '181.132.45.67',
                '127.0.0.1',
            ]

            # Generar datos de los últimos 30 días
            fecha_base = timezone.now()
            registros_creados = 0

            for i in range(50):  # Crear 50 registros de prueba
                usuario = usuarios[i % len(usuarios)] if usuarios else None

                # Fecha aleatoria en los últimos 30 días
                dias_atras = random.randint(0, 30)
                horas_atras = random.randint(0, 23)
                minutos_atras = random.randint(0, 59)

                fecha_login = fecha_base - timedelta(
                    days=dias_atras,
                    hours=horas_atras,
                    minutos=minutos_atras
                )

                # Algunos registros tienen logout, otros no
                if random.random() > 0.3:  # 70% tiene logout
                    duracion_minutos = random.randint(5, 480)  # Entre 5 min y 8 horas
                    fecha_logout = fecha_login + timedelta(minutes=duracion_minutos)
                    duracion_segundos = duracion_minutos * 60
                else:
                    fecha_logout = None
                    duracion_segundos = None

                # 90% exitosos, 10% fallidos
                exitoso = random.random() < 0.9

                if not exitoso:
                    fallo_reason = random.choice([
                        'Contraseña incorrecta',
                        'Usuario no encontrado',
                        'Cuenta inactiva',
                        'Token expirado',
                    ])
                else:
                    fallo_reason = None

                # Crear el registro
                if usuario:
                    registro = HistorialLogin.objects.using(alias).create(
                        usuario_id=usuario.id,
                        usuario_correo=usuario.correo_usuario,
                        usuario_nombre=usuario.usuario,
                        fecha_hora_login=fecha_login,
                        fecha_hora_logout=fecha_logout,
                        direccion_ip=random.choice(ips_de_prueba),
                        user_agent=random.choice(user_agents),
                        exitoso=exitoso,
                        fallo_reason=fallo_reason,
                        duracion_segundos=duracion_segundos
                    )
                else:
                    registro = HistorialLogin.objects.using(alias).create(
                        usuario_id=0,
                        usuario_correo='test@prueba.com',
                        usuario_nombre='test_usuario',
                        fecha_hora_login=fecha_login,
                        fecha_hora_logout=fecha_logout,
                        direccion_ip=random.choice(ips_de_prueba),
                        user_agent=random.choice(user_agents),
                        exitoso=exitoso,
                        fallo_reason=fallo_reason,
                        duracion_segundos=duracion_segundos
                    )

                registros_creados += 1

                if (i + 1) % 10 == 0:
                    print(f"   Insertados {i + 1} registros...")

            print(f"✅ Total de registros insertados: {registros_creados}")

            # Mostrar estadísticas
            total_registros = HistorialLogin.objects.using(alias).count()
            exitosos = HistorialLogin.objects.using(alias).filter(exitoso=True).count()
            fallidos = HistorialLogin.objects.using(alias).filter(exitoso=False).count()

            print(f"\n📊 Estadísticas:")
            print(f"   Total de registros en BD: {total_registros}")
            print(f"   Logins exitosos: {exitosos}")
            print(f"   Logins fallidos: {fallidos}")

        except Exception as e:
            print(f"❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()

    print(f"\n{'=' * 70}")
    print("PROCESO COMPLETADO")
    print(f"{'=' * 70}\n")


if __name__ == '__main__':
    insertar_datos_prueba()
