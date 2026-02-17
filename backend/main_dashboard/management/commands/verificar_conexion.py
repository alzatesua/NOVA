# main_dashboard/management/commands/verificar_conexion.py
from django.core.management.base import BaseCommand
from nova.models import Dominios, Tiendas
from django.db import connections
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Verifica la configuración multi-tenant y el estado de las conexiones a BD'

    def add_arguments(self, parser):
        parser.add_argument(
            '--subdominio',
            type=str,
            help='Verificar un subdominio específico'
        )
        parser.add_argument(
            '--test-connection',
            action='store_true',
            help='Probar conexión a la BD de la tienda'
        )

    def handle(self, *args, **options):
        subdominio = options['subdominio']
        test_connection = options['test_connection']

        self.stdout.write(self.style.SUCCESS('=' * 70 + '\n'))
        self.stdout.write(self.style.SUCCESS('🔍 VERIFICACIÓN DE CONEXIÓN MULTI-TENANT\n'))
        self.stdout.write(self.style.SUCCESS('=' * 70 + '\n\n'))

        # 1. Verificar Dominios existentes
        self.stdout.write('📋 TABLA DOMINIOS (BD default)\n')
        self.stdout.write('-' * 70 + '\n')

        dominios = Dominios.objects.select_related('tienda').all()

        if not dominios:
            self.stdout.write(self.style.WARNING('⚠️  No hay dominios registrados\n'))
            self.stdout.write(self.style.WARNING('   Ejecuta: python manage.py crear_datos_prueba\n\n'))
        else:
            for dom in dominios:
                self.stdout.write(f'Subdominio: {self.style.SUCCESS(dom.dominio)}\n')
                self.stdout.write(f'  Tienda: {dom.tienda.nombre_tienda}\n')
                self.stdout.write(f'  DB Nombre: {dom.tienda.db_nombre}\n')
                self.stdout.write(f'  DB Usuario: {dom.tienda.db_usuario}\n')
                self.stdout.write(f'  Principal: {"Sí" if dom.es_principal else "No"}\n')
                self.stdout.write(f'  Creado: {dom.creado_en.strftime("%Y-%m-%d %H:%M")}\n')
                self.stdout.write('-' * 70 + '\n')

        # 2. Verificar tienda específica si se solicita
        if subdominio:
            self.stdout.write(f'\n🔍 VERIFICANDO SUBDOMINIO: {subdominio}\n')
            self.stdout.write('-' * 70 + '\n')

            dominio = Dominios.objects.select_related('tienda').filter(
                dominio__iexact=subdominio
            ).first()

            if not dominio:
                self.stdout.write(self.style.ERROR(f'❌ Subdominio "{subdominio}" NO encontrado\n'))
                self.stdout.write(self.style.WARNING('Sugerencia: Ejecuta python manage.py crear_datos_prueba --subdominio=%s\n\n' % subdominio))
                return
            else:
                self.stdout.write(self.style.SUCCESS('✅ Subdominio encontrado\n'))
                self.stdout.write(f'Detalles de la tienda:\n')

                tienda = dominio.tienda
                self.stdout.write(f'  ID: {tienda.id}\n')
                self.stdout.write(f'  Nombre: {tienda.nombre_tienda}\n')
                self.stdout.write(f'  NIT: {tienda.nit}\n')
                self.stdout.write(f'  Slug: {tienda.slug}\n')
                self.stdout.write(f'  Activa: {"Sí" if tienda.es_activo else "No"}\n')

                # 3. Probar conexión a la BD de la tienda
                if test_connection:
                    self.stdout.write(f'\n🔌 PROBANDO CONEXIÓN A LA BD\n')
                    self.stdout.write('-' * 70 + '\n')

                    alias = str(tienda.id)

                    # Verificar que la BD exista en settings.DATABASES
                    if alias not in settings.DATABASES:
                        self.stdout.write(self.style.WARNING(f'⚠️  La BD "{alias}" no está en settings.DATABASES\n'))
                        self.stdout.write(self.style.WARNING('   Necesita conectar primero (conectar_db_tienda)\n'))
                    else:
                        self.stdout.write(self.style.SUCCESS(f'✅ BD configurada: {alias}\n'))
                        db_config = settings.DATABASES[alias]
                        self.stdout.write(f'  NAME: {db_config["NAME"]}\n')
                        self.stdout.write(f'  USER: {db_config["USER"]}\n')
                        self.stdout.write(f'  HOST: {db_config["HOST"]}\n')
                        self.stdout.write(f'  PORT: {db_config["PORT"]}\n')

                        # Intentar conectar
                        try:
                            with connections[alias].cursor() as cursor:
                                # Verificar que exista la tabla productos
                                cursor.execute("""
                                    SELECT EXISTS (
                                        SELECT FROM information_schema.tables
                                        WHERE table_schema = 'public'
                                        AND table_name = 'productos'
                                    );
                                """)
                                existe = cursor.fetchone()[0]

                                if existe:
                                    self.stdout.write(self.style.SUCCESS('✅ Tabla "productos" existe\n'))

                                    # Contar productos
                                    cursor.execute('SELECT COUNT(*) FROM productos;')
                                    count = cursor.fetchone()[0]
                                    self.stdout.write(f'  Total de productos: {self.style.SUCCESS(str(count))}\n')

                                    # Mostrar algunos productos
                                    cursor.execute('SELECT id, sku, nombre, precio, stock FROM productos LIMIT 3;')
                                    productos = cursor.fetchall()

                                    if productos:
                                        self.stdout.write(f'\n📦 Primeros {len(productos)} productos:\n')
                                        for prod in productos:
                                            self.stdout.write(f'  ID: {prod[0]}\n')
                                            self.stdout.write(f'  SKU: {prod[1]}\n')
                                            self.stdout.write(f'  Nombre: {prod[2]}\n')
                                            self.stdout.write(f'  Precio: ${prod[3]}\n')
                                            self.stdout.write(f'  Stock: {prod[4]}\n')
                                            self.stdout.write('-' * 40 + '\n')
                                else:
                                    self.stdout.write(self.style.ERROR('❌ Tabla "productos" NO existe\n'))
                                    self.stdout.write(self.style.WARNING('   Ejecuta: python manage.py migrate --database=%s\n\n' % alias)

                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f'❌ Error al conectar: {str(e)}\n'))
                            self.stdout.write(self.style.WARNING('   Verifica que la BD exista y las credenciales sean correctas\n'))
                else:
                    self.stdout.write(self.style.WARNING('\n⚠️  Usa --test-connection para probar la conexión a la BD\n'))

        # 4. Mostrar URL de prueba
        if dominios:
            self.stdout.write('\n' + '=' * 70 + '\n')
            self.stdout.write('🌐 URLs DE PRUEBA\n')
            self.stdout.write('=' * 70 + '\n\n')

            for dom in dominios[:3]:  # Mostrar máximo 3
                self.stdout.write(f'Subdominio: {dom.dominio}\n')
                self.stdout.write(f'  URL: https://{dom.dominio}.dagi.co/\n')
                self.stdout.write(f'  API: curl -X POST https://dagi.co/api/productos/list/ \\\n')
                self.stdout.write(f'       -H "Content-Type: application/json" \\\n')
                self.stdout.write(f'       -d \'{"subdominio": "{dom.dominio}"}\'\n')
                self.stdout.write('\n')

        self.stdout.write('=' * 70 + '\n')
