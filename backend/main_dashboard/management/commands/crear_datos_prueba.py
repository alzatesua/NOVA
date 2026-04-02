# main_dashboard/management/commands/crear_datos_prueba.py
from django.core.management.base import BaseCommand
from django.db import transaction
from nova.models import Tiendas, Dominios, Direccion
from main_dashboard.models import Producto, Categoria, Marca, Iva, Descuento, TipoMedida
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Crea datos de prueba para el e-commerce multi-tenant'

    def add_arguments(self, parser):
        parser.add_argument(
            '--subdominio',
            type=str,
            default='mi-tienda',
            help='Subdominio a crear (default: mi-tienda)'
        )
        parser.add_argument(
            '--cantidad',
            type=int,
            default=10,
            help='Cantidad de productos a crear (default: 10)'
        )
        parser.add_argument(
            '--skip-productos',
            action='store_true',
            help='No crear productos en la BD de la tienda'
        )

    @transaction.atomic
    def handle(self, *args, **options):
        subdominio = options['subdominio']
        cantidad = options['cantidad']
        skip_productos = options['skip_productos']

        self.stdout.write(self.style.SUCCESS('🚀 Iniciando creación de datos de prueba...\n'))

        # 1. Buscar o crear tienda
        tienda = self._crear_o_obtener_tienda(subdominio)

        # 2. Crear dominio si no existe
        dominio = self._crear_dominio(subdominio, tienda)

        # 3. Crear productos si no se skip
        if not skip_productos:
            self._crear_productos_en_tienda(tienda, cantidad)
        else:
            self.stdout.write(self.style.WARNING('⏭️  Skip: No se crean productos\n'))

        self.stdout.write(self.style.SUCCESS('\n✅ Datos de prueba creados exitosamente!\n'))
        self.stdout.write(self.style.SUCCESS(f'Subdominio: {subdominio}\n'))
        self.stdout.write(self.style.SUCCESS(f'URL de prueba: https://{subdominio}.nova.dagi.co/\n'))

    def _crear_o_obtener_tienda(self, subdominio):
        """Crea una tienda de prueba o retorna una existente"""
        # Buscar si ya existe una tienda con este subdominio
        try:
            dominio_existente = Dominios.objects.select_related('tienda').filter(dominio__iexact=subdominio).first()
            if dominio_existente:
                tienda = dominio_existente.tienda
                self.stdout.write(self.style.SUCCESS(f'✅ Tienda existente encontrada: {tienda.nombre_tienda}\n'))
                return tienda
        except:
            pass

        # Crear dirección
        self.stdout.write('📍 Creando dirección...\n')
        direccion = Direccion.objects.create(
            calle_numero="Calle 123 #45-67",
            ciudad_estado="Bogotá",
            codigo_postal="110001",
            pais="Colombia"
        )

        # Crear tienda
        self.stdout.write('🏪 Creando tienda...\n')
        tienda = Tiendas.objects.create(
            nombre_tienda=f"Tienda {subdominio}",
            nit="900123456-7",
            nombre_completo=f"Tienda {subdominio} SAS",
            telefono="+57 1 123 4567",
            direccion=direccion,
            nombre_propietario="Propietario Prueba",
            usuario=f"admin@{subdominio}.com",
            correo_usuario=f"admin@{subdominio}.com",
            es_activo=True
        )

        self.stdout.write(self.style.SUCCESS(f'✅ Tienda creada: {tienda.nombre_tienda}\n'))
        self.stdout.write(self.style.SUCCESS(f'   - DB Nombre: {tienda.db_nombre}\n'))
        self.stdout.write(self.style.SUCCESS(f'   - DB Usuario: {tienda.db_usuario}\n'))
        return tienda

    def _crear_dominio(self, subdominio, tienda):
        """Crea un dominio para la tienda"""
        # Verificar si ya existe
        if Dominios.objects.filter(dominio__iexact=subdominio).exists():
            self.stdout.write(self.style.SUCCESS(f'✅ Dominio ya existe: {subdominio}\n'))
            return

        self.stdout.write('🌐 Creando dominio...\n')
        dominio = Dominios.objects.create(
            tienda=tienda,
            dominio=subdominio,
            es_principal=True
        )
        self.stdout.write(self.style.SUCCESS(f'✅ Dominio creado: {dominio.dominio}\n'))
        return dominio

    def _crear_productos_en_tienda(self, tienda, cantidad):
        """Crea productos de prueba en la BD de la tienda"""
        alias = str(tienda.id)
        self.stdout.write(f'📦 Creando {cantidad} productos en la BD de la tienda...\n')
        self.stdout.write(f'   Alias BD: {alias}\n')
        self.stdout.write(f'   BD Nombre: {tienda.db_nombre}\n')

        try:
            # Verificar que la BD exista y tenga las tablas necesarias
            self._verificar_tablas_productos(alias)

            # Crear categorías
            categorias = self._crear_categorias(alias, cantidad // 3 + 1)

            # Crear marcas
            marcas = self._crear_marcas(alias, cantidad // 5 + 1)

            # Crear IVA
            iva = self._crear_iva(alias)

            # Crear descuento
            descuento = self._crear_descuento(alias)

            # Crear tipo de medida
            tipo_medida = self._crear_tipo_medida(alias)

            # Crear productos
            productos_creados = 0
            for i in range(1, cantidad + 1):
                try:
                    categoria = categorias[i % len(categorias)]
                    marca = marcas[i % len(marcas)]

                    producto = Producto.objects.using(alias).create(
                        sku=f'TEST-{subdominio.upper()}-{i:03d}',
                        nombre=f'Producto Prueba {i} - {subdominio}',
                        descripcion=f'Este es un producto de prueba #{i} para la tienda {subdominio}. Producto de alta calidad para ecommerce.',
                        precio=99.99 * i,
                        stock=10 * i,
                        categoria_id=categoria,
                        marca_id=marca,
                        iva_id=iva,
                        descuento=descuento if i % 2 == 0 else None,  # Cada 2 productos con descuento
                        tipo_medida=tipo_medida,
                        codigo_barras=f'780{subdominio[:3].upper()}{i:0>12}',
                        imei=None,
                        imagen_producto=f'/media/productos/producto-{i}.jpg',
                        atributo='color',
                        valor_atributo='negro' if i % 2 == 0 else 'azul'
                    )
                    productos_creados += 1

                    if productos_creados % 5 == 0:
                        self.stdout.write(f'   ✓ {productos_creados}/{cantidad} productos creados...\n')

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'   ✗ Error creando producto {i}: {str(e)}\n'))

            self.stdout.write(self.style.SUCCESS(f'\n✅ {productos_creados}/{cantidad} productos creados exitosamente!\n'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n❌ Error al crear productos: {str(e)}\n'))
            self.stdout.write(self.style.WARNING('⚠️  Asegúrate de que la BD de la tienda exista y tenga las tablas necesarias.\n'))
            raise

    def _verificar_tablas_productos(self, alias):
        """Verifica que las tablas necesarias existan en la BD"""
        from django.db import connections

        with connections[alias].cursor() as cursor:
            # Verificar que existan las tablas
            cursor.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name IN ('productos', 'categorias', 'marcas', 'ivas', 'descuentos', 'tipos_medida')
                ORDER BY table_name;
            """)
            tablas = {row[0] for row in cursor.fetchall()}

            tablas_faltantes = []
            for tabla in ['productos', 'categorias', 'marcas', 'ivas', 'descuentos', 'tipos_medida']:
                if tabla not in tablas:
                    tablas_faltantes.append(tabla)

            if tablas_faltantes:
                self.stdout.write(self.style.WARNING(f'⚠️  Tablas faltantes: {", ".join(tablas_faltantes)}\n'))
                self.stdout.write(self.style.WARNING('Ejecuta las migraciones en la BD de la tienda:\n'))
                self.stdout.write(self.style.WARNING(f'  python manage.py migrate --database={alias}\n'))
                raise Exception(f'Faltan tablas necesarias: {tablas_faltantes}')

    def _crear_categorias(self, alias, cantidad):
        """Crea categorías de prueba"""
        nombres = [
            'Movilidad Eléctrica',
            'Scooters',
            'Bicicletas',
            'Hoverboards',
            'Accesorios',
            'Baterías',
        ]

        categorias = []
        for i in range(min(cantidad, len(nombres))):
            cat, created = Categoria.objects.using(alias).get_or_create(
                id_categoria=i + 1,
                defaults={'nombre': nombres[i]}
            )
            categorias.append(cat)

        return categorias

    def _crear_marcas(self, alias, cantidad):
        """Crea marcas de prueba"""
        nombres = [
            'EcoMotion',
            'EcoRide',
            'UrbanGlide',
            'TechGlide',
            'CityEco',
            'PowerCell',
        ]

        marcas = []
        for i in range(min(cantidad, len(nombres))):
            marca, created = Marca.objects.using(alias).get_or_create(
                id_marca=i + 1,
                defaults={'nombre': nombres[i]}
            )
            marcas.append(marca)

        return marcas

    def _crear_iva(self, alias):
        """Crea IVA de prueba"""
        iva, created = Iva.objects.using(alias).get_or_create(
            id_iva=1,
            defaults={'porcentaje': '19.00'}
        )
        return iva

    def _crear_descuento(self, alias):
        """Crea descuento de prueba"""
        descuento, created = Descuento.objects.using(alias).get_or_create(
            id_descuento=1,
            defaults={'porcentaje': '10.00'}
        )
        return descuento

    def _crear_tipo_medida(self, alias):
        """Crea tipo de medida de prueba"""
        tipo, created = TipoMedida.objects.using(alias).get_or_create(
            id_tipo_medida=1,
            defaults={'nombre': 'Unidad'}
        )
        return tipo
