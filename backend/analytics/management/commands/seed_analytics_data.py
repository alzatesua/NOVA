"""
Management command para generar datos de simulación para el dashboard de Analytics
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta
from decimal import Decimal
import random

from main_dashboard.models import (
    Sucursales, Categoria, Marca, Iva,
    Producto, Bodega, Existencia, Cliente, FormaPago,
    Factura, FacturaDetalle, Pago
)


class Command(BaseCommand):
    help = """
    Genera datos de simulación para probar los endpoints de analytics.

    MODO MULTI-TENANT:
    Este comando requiere el parámetro --tenant para especificar la base de datos
    del tenant donde se insertarán los datos.

    Ejemplos:
        python manage.py seed_analytics_data --tenant=dagi --limpiar
        python manage.py seed_analytics_data --tenant=123 --dias-historia=90
        python manage.py seed_analytics_data --tenant=miempresa --facturas-por-dia=20
    """

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant',
            type=str,
            help='Nombre del tenant (subdominio) o ID de tienda. Requerido para modo multi-tenant.'
        )
        parser.add_argument(
            '--dias-historia',
            type=int,
            default=60,
            help='Días de historia a generar (default: 60)'
        )
        parser.add_argument(
            '--sucursales',
            type=int,
            default=3,
            help='Número de sucursales a crear (default: 3)'
        )
        parser.add_argument(
            '--productos',
            type=int,
            default=50,
            help='Número de productos a crear (default: 50)'
        )
        parser.add_argument(
            '--facturas-por-dia',
            type=int,
            default=15,
            help='Facturas promedio por día (default: 15)'
        )
        parser.add_argument(
            '--limpiar',
            action='store_true',
            help='Eliminar datos existentes antes de generar nuevos'
        )

    def resolver_tenant(self, tenant_identifier):
        """
        Resuelve el tenant y conecta a su base de datos.

        Args:
            tenant_identifier: str - Subdominio o ID de tienda

        Returns:
            tuple: (tienda_obj, db_alias)
        """
        from nova.models import Tiendas, Dominios
        from nova.utils.db import conectar_db_tienda

        # Intentar como ID numérico
        if tenant_identifier.isdigit():
            tienda = Tiendas.objects.filter(id=int(tenant_identifier)).first()
        else:
            # Buscar por subdominio
            dominio_obj = Dominios.objects.filter(
                dominio__icontains=tenant_identifier
            ).select_related('tienda').first()
            tienda = dominio_obj.tienda if dominio_obj else None

        if not tienda:
            raise ValueError(f"Tenant '{tenant_identifier}' no encontrado")

        if not tienda.es_activo:
            raise ValueError(f"Tienda '{tienda.nombre_tienda}' está inactiva")

        alias = str(tienda.id)
        conectar_db_tienda(alias, tienda)

        return tienda, alias

    def validar_estructura_tenant(self, alias):
        """
        Verifica que el tenant tiene las tablas necesarias.

        Args:
            alias: str - Database alias
        """
        from django.db import connections

        tablas_requeridas = [
            'productos',
            'main_dashboard_sucursales',
            'main_dashboard_categoria',
            'main_dashboard_marca',
            'main_dashboard_iva',
            'inventario_bodega',
            'inventario_existencia',
            'facturacion_factura',
            'facturacion_factura_detalle',
            'facturacion_pago',
            'facturacion_cliente',
            'facturacion_forma_pago',
            'login_usuario',  # Para vendedor
        ]

        with connections[alias].cursor() as cursor:
            cursor.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
            """)
            tablas_existentes = {row[0] for row in cursor.fetchall()}

        faltantes = set(tablas_requeridas) - tablas_existentes
        if faltantes:
            raise ValueError(
                f"El tenant no tiene las tablas requeridas: {', '.join(faltantes)}"
            )

    def handle(self, *args, **options):
        # Extract tenant parameter
        tenant_identifier = options.get('tenant')

        if not tenant_identifier:
            self.stdout.write(self.style.ERROR(
                'ERROR: El parámetro --tenant es requerido.\n'
                'Uso: python manage.py seed_analytics_data --tenant=dagi'
            ))
            return

        # Resolve tenant
        try:
            tienda, alias = self.resolver_tenant(tenant_identifier)
            self.stdout.write(self.style.SUCCESS(
                f'\n🎯 Tenant: {tienda.nombre_tienda} (DB: {tienda.db_nombre})'
            ))
        except ValueError as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
            return

        # Double-check we're not seeding to default
        if alias == 'default':
            self.stdout.write(self.style.ERROR(
                'ERROR: No se puede hacer seed a la base de datos "default" (bd_madre).'
            ))
            return

        # Validate database structure
        try:
            self.validar_estructura_tenant(alias)
            self.stdout.write(self.style.SUCCESS('✅ Estructura de base de datos validada'))
        except ValueError as e:
            self.stdout.write(self.style.ERROR(f'Error de validación: {str(e)}'))
            return

        # Store alias as instance variable for use in other methods
        self.db_alias = alias

        # Extract other parameters
        dias_historia = options['dias_historia']
        num_sucursales = options['sucursales']
        num_productos = options['productos']
        facturas_por_dia = options['facturas_por_dia']
        limpiar = options['limpiar']

        self.stdout.write(self.style.SUCCESS(f'\n🚀 Iniciando generación de datos para Analytics'))
        self.stdout.write(f'   - Días de historia: {dias_historia}')
        self.stdout.write(f'   - Sucursales: {num_sucursales}')
        self.stdout.write(f'   - Productos: {num_productos}')
        self.stdout.write(f'   - Facturas/día: {facturas_por_dia}\n')

        if limpiar:
            self.stdout.write(self.style.WARNING('🗑️  Limpiando datos existentes...'))
            self.limpiar_datos()

        # Paso 1: Crear datos maestros
        self.stdout.write(self.style.SUCCESS('📋 Creando datos maestros...'))
        self.crear_maestros()

        # Paso 2: Crear sucursales y bodegas
        self.stdout.write(self.style.SUCCESS('🏪 Creando sucursales y bodegas...'))
        sucursales = self.crear_sucursales_y_bodegas(num_sucursales)

        # Paso 3: Crear productos
        self.stdout.write(self.style.SUCCESS('📦 Creando productos...'))
        productos = self.crear_productos(num_productos, sucursales)

        # Paso 4: Crear clientes y formas de pago
        self.stdout.write(self.style.SUCCESS('👥 Creando clientes y formas de pago...'))
        clientes = self.crear_clientes(30)
        formas_pago = self.crear_formas_pago()

        # Paso 5: Generar ventas históricas
        self.stdout.write(self.style.SUCCESS('💰 Generando ventas históricas...'))
        self.generar_ventas_historicas(
            sucursales,
            productos,
            clientes,
            formas_pago,
            dias_historia,
            facturas_por_dia
        )

        self.stdout.write(self.style.SUCCESS('\n✅ Datos de simulación generados correctamente!'))
        self.stdout.write(self.style.SUCCESS('\n📊 Endpoints disponibles para probar:\n'))
        self.stdout.write('   GET /api/analytics/kpis/')
        self.stdout.write('   GET /api/analytics/ventas/totales/')
        self.stdout.write('   GET /api/analytics/ventas/tendencia/')
        self.stdout.write('   GET /api/analytics/ventas/top-productos/')
        self.stdout.write('   GET /api/analytics/ventas/por-categoria/')
        self.stdout.write('   GET /api/analytics/ventas/por-sucursal/')
        self.stdout.write('   GET /api/analytics/inventario/resumen/')
        self.stdout.write('   GET /api/analytics/inventario/stock-bajo/')
        self.stdout.write('   GET /api/analytics/inventario/sin-rotacion/')
        self.stdout.write('   GET /api/analytics/inventario/por-bodega/')
        self.stdout.write('   GET /api/analytics/comparativa-periodos/\n')

    def limpiar_datos(self):
        """Elimina datos de prueba usando SQL directo para evitar problemas con el modelo Producto"""
        from django.db import connections

        with connections[self.db_alias].cursor() as cursor:
            # Eliminar en orden correcto por foreign keys
            cursor.execute("DELETE FROM facturacion_pago")
            cursor.execute("DELETE FROM facturacion_factura_detalle")
            cursor.execute("DELETE FROM facturacion_factura")
            cursor.execute("DELETE FROM inventario_traslado_linea")
            cursor.execute("DELETE FROM inventario_traslado")
            cursor.execute("DELETE FROM inventario_existencia")
            cursor.execute("DELETE FROM productos")
            cursor.execute("DELETE FROM inventario_bodega")
            cursor.execute("DELETE FROM facturacion_cliente")
            cursor.execute("DELETE FROM facturacion_forma_pago")
            cursor.execute("DELETE FROM main_dashboard_sucursales")
            cursor.execute("DELETE FROM main_dashboard_categoria")
            cursor.execute("DELETE FROM main_dashboard_marca")

    def crear_maestros(self):
        """Crea datos maestros (categorías, marcas, IVA, etc.)"""
        categorias_data = [
            'Electrónicos', 'Ropa', 'Hogar', 'Deportes',
            'Juguetes', 'Alimentos', 'Bebidas', 'Librería',
            'Calzado', 'Accesorios'
        ]

        marcas_data = [
            'TechBrand', 'SportMax', 'HomeStyle', 'FashionPro',
            'KidsWorld', 'FoodCorp', 'DrinkCo', 'OfficePlus'
        ]

        for nombre in categorias_data:
            Categoria.objects.using(self.db_alias).get_or_create(nombre=nombre)

        for nombre in marcas_data:
            Marca.objects.using(self.db_alias).get_or_create(nombre=nombre)

        # Crear IVA
        Iva.objects.using(self.db_alias).get_or_create(porcentaje=19, defaults={'porcentaje': 19})
        Iva.objects.using(self.db_alias).get_or_create(porcentaje=0, defaults={'porcentaje': 0})
        Iva.objects.using(self.db_alias).get_or_create(porcentaje=5, defaults={'porcentaje': 5})

    def crear_sucursales_y_bodegas(self, num_sucursales):
        """Crea sucursales y sus bodegas"""
        ciudades = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena']
        sucursales = []

        for i in range(num_sucursales):
            ciudad = ciudades[i % len(ciudades)]
            sucursal = Sucursales.objects.using(self.db_alias).create(
                nombre=f'Sucursal {ciudad} {i+1}',
                direccion=f'Calle {random.randint(1, 100)} # {random.randint(1, 100)}',
                ciudad=ciudad,
                pais='Colombia',
                estatus=True
            )
            sucursales.append(sucursal)

            # Crear bodegas para cada sucursal
            Bodega.objects.using(self.db_alias).create(
                sucursal=sucursal,
                nombre=f'Bodega Principal {sucursal.nombre}',
                codigo=f'BOD-{sucursal.id}-01',
                tipo='SUC',
                es_predeterminada=True,
                estatus=True
            )

            Bodega.objects.using(self.db_alias).create(
                sucursal=sucursal,
                nombre=f'Almacén {sucursal.nombre}',
                codigo=f'ALM-{sucursal.id}-01',
                tipo='ALM',
                es_predeterminada=False,
                estatus=True
            )

        return sucursales

    def crear_productos(self, num_productos, sucursales):
        """Crea productos con existencias en las bodegas"""
        from django.db import connections

        categorias = list(Categoria.objects.using(self.db_alias).all())
        marcas = list(Marca.objects.using(self.db_alias).all())
        ivas = list(Iva.objects.using(self.db_alias).all())
        bodegas = list(Bodega.objects.using(self.db_alias).filter(es_predeterminada=True))

        productos = []

        for i in range(num_productos):
            categoria = random.choice(categorias)
            marca = random.choice(marcas)
            iva = random.choice([ivas[0], ivas[1]])  # 19% o 0%
            sucursal = random.choice(sucursales)

            precio_base = random.randint(10000, 500000)
            sku = f'PROD-{str(i+1).zfill(4)}'

            # Insertar producto usando SQL directo para evitar problemas con el modelo
            with connections[self.db_alias].cursor() as cursor:
                cursor.execute("""
                    INSERT INTO productos (nombre, sku, descripcion, precio, stock, id_categoria, id_marca, id_iva, codigo_barras, sucursal_id, imagen_producto, creado_en)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    RETURNING id
                """, [
                    f'Producto {categoria.nombre} {i+1}',
                    sku,
                    f'Descripción del producto {sku} de {categoria.nombre}',
                    precio_base,
                    0,
                    categoria.id_categoria,
                    marca.id_marca,
                    iva.id_iva,
                    f'{random.randint(1000000000, 9999999999)}',
                    sucursal.id,
                    f'productos/producto_{i+1}.jpg'
                ])
                producto_id = cursor.fetchone()[0]

            # Crear objeto producto para referencia (solo con ID)
            producto = Producto(id=producto_id, nombre=f'Producto {categoria.nombre} {i+1}', sku=sku, precio=precio_base)
            productos.append(producto)

            # Crear existencias en bodegas aleatorias
            for bodega in random.sample(bodegas, min(len(bodegas), 2)):
                stock = random.randint(10, 200)
                minimo = random.randint(5, 20)
                Existencia.objects.using(self.db_alias).create(
                    producto_id=producto_id,
                    bodega=bodega,
                    cantidad=stock,
                    reservado=random.randint(0, 5),
                    minimo=minimo,
                    maximo=min(500, minimo * 10)
                )

        return productos

    def crear_clientes(self, num_clientes):
        """Crea clientes de prueba"""
        clientes = []

        nombres = ['Juan', 'Maria', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Miguel', 'Carmen']
        apellidos = ['Garcia', 'Perez', 'Martinez', 'Rodriguez', 'Lopez', 'Sanchez']

        for i in range(num_clientes):
            tipo_persona = random.choice(['NAT', 'JUR'])

            if tipo_persona == 'NAT':
                primer_nombre = random.choice(nombres)
                apellidos_cliente = f'{random.choice(apellidos)} {random.choice(apellidos)}'

                cliente = Cliente.objects.using(self.db_alias).create(
                    tipo_persona='NAT',
                    primer_nombre=primer_nombre,
                    apellidos=apellidos_cliente,
                    tipo_documento='CC',
                    numero_documento=f'{random.randint(10000000, 99999999)}',
                    correo=f'{primer_nombre.lower()}{i}@email.com',
                    telefono=f'{random.randint(3000000000, 3999999999)}',
                    direccion=f'Calle {random.randint(1, 100)} # {random.randint(1, 100)}',
                    ciudad=random.choice(['Bogota', 'Medellin', 'Cali']),
                    estatus=True
                )
            else:
                cliente = Cliente.objects.using(self.db_alias).create(
                    tipo_persona='JUR',
                    razon_social=f'Empresa {i+1} S.A.S.',
                    tipo_documento='NIT',
                    numero_documento=f'{random.randint(800000000, 999999999)}',
                    correo=f'contacto@empresa{i+1}.com',
                    telefono=f'{random.randint(6010000000, 6999999999)}',
                    direccion=f'Carrera {random.randint(1, 100)} # {random.randint(1, 100)}',
                    ciudad=random.choice(['Bogota', 'Medellin', 'Cali']),
                    limite_credito=random.randint(1000000, 10000000),
                    dias_credito=random.choice([15, 30, 45, 60]),
                    estatus=True
                )

            clientes.append(cliente)

        return clientes

    def crear_formas_pago(self):
        """Crea formas de pago"""
        formas = [
            {'codigo': 'EFE', 'nombre': 'Efectivo', 'activo': True, 'requiere_referencia': False, 'permite_cambio': True},
            {'codigo': 'TDC', 'nombre': 'Tarjeta de Crédito', 'activo': True, 'requiere_referencia': True, 'permite_cambio': True},
            {'codigo': 'TDE', 'nombre': 'Tarjeta Débito', 'activo': True, 'requiere_referencia': True, 'permite_cambio': True},
            {'codigo': 'TRF', 'nombre': 'Transferencia', 'activo': True, 'requiere_referencia': True, 'permite_cambio': False},
        ]

        for forma in formas:
            FormaPago.objects.using(self.db_alias).get_or_create(codigo=forma['codigo'], defaults=forma)

        return list(FormaPago.objects.using(self.db_alias).all())

    def generar_ventas_historicas(self, sucursales, productos, clientes, formas_pago, dias, facturas_por_dia):
        """Genera ventas históricas distribuidas en el tiempo"""
        from django.db import connections

        hoy = timezone.now()
        bodegas = {b.sucursal_id: b for b in Bodega.objects.using(self.db_alias).filter(es_predeterminada=True)}

        facturas_creadas = 0
        detalles_creados = 0

        # Obtener vendedor (usuario) - una sola vez
        from nova.models import LoginUsuario
        vendedor = LoginUsuario.objects.using(self.db_alias).first()

        for dia in range(dias, 0, -1):
            fecha_venta = hoy - timedelta(days=dia)

            # Variar el número de facturas por día (algunos días más, otros menos)
            num_facturas_hoy = int(facturas_por_dia * random.uniform(0.5, 1.5))

            for _ in range(num_facturas_hoy):
                sucursal = random.choice(sucursales)
                bodega = bodegas.get(sucursal.id)
                cliente = random.choice(clientes + [None])
                cliente_id = cliente.id if cliente else None

                # Calcular consecutivo
                consecutivo = str(facturas_creadas + 1).zfill(6)
                numero_factura = f'FACT-{consecutivo}'

                # Crear factura usando SQL directo para controlar la fecha_venta
                # (el modelo tiene auto_now_add=True que siempre usa la fecha actual)
                with connections[self.db_alias].cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO facturacion_factura
                        (numero_factura, estado, cliente_id, vendedor_id, sucursal_id, bodega_id,
                         fecha_venta, subtotal, total_descuento, total_iva, total, total_pagado, cambio)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, [
                        numero_factura,
                        'PAG',
                        cliente_id,
                        vendedor.id if vendedor else None,
                        sucursal.id,
                        bodega.id,
                        fecha_venta,
                        0,  # subtotal
                        0,  # total_descuento
                        0,  # total_iva
                        0,  # total
                        0,  # total_pagado
                        0   # cambio
                    ])
                    factura_id = cursor.fetchone()[0]

                # Agregar productos a la factura
                num_productos_factura = random.randint(1, 5)
                productos_factura = random.sample(productos, min(num_productos_factura, len(productos)))

                for producto in productos_factura:
                    # Obtener el producto completo de la BD para tener el IVA
                    try:
                        producto_completo = Producto.objects.using(self.db_alias).get(id=producto.id)
                        iva_porcentaje = producto_completo.iva.porcentaje if producto_completo.iva else Decimal('0')
                    except:
                        iva_porcentaje = Decimal('19')

                    cantidad = random.randint(1, 3)
                    precio_unitario = Decimal(str(producto.precio)) * Decimal('0.9')

                    descuento_porcentaje = Decimal(str(random.choice([0, 5, 10, 15])))
                    descuento_valor = (precio_unitario * cantidad * descuento_porcentaje / 100).quantize(Decimal('0.01'))

                    iva_valor = ((precio_unitario * cantidad - descuento_valor) * iva_porcentaje / 100).quantize(Decimal('0.01'))

                    subtotal = (precio_unitario * cantidad).quantize(Decimal('0.01'))
                    total = (subtotal - descuento_valor + iva_valor).quantize(Decimal('0.01'))

                    # Crear detalle usando SQL directo
                    with connections[self.db_alias].cursor() as cursor:
                        cursor.execute("""
                            INSERT INTO facturacion_factura_detalle
                            (factura_id, producto_id, producto_nombre, producto_sku,
                             cantidad, precio_unitario, descuento_porcentaje, descuento_valor,
                             iva_porcentaje, iva_valor, subtotal, total, cantidad_devuelta, creado_en)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                        """, [
                            factura_id, producto.id, producto.nombre, producto.sku,
                            cantidad, precio_unitario, descuento_porcentaje, descuento_valor,
                            iva_porcentaje, iva_valor, subtotal, total, 0
                        ])

                    detalles_creados += 1

                # Calcular totales de la factura usando SQL
                with connections[self.db_alias].cursor() as cursor:
                    cursor.execute("""
                        SELECT
                            COALESCE(SUM(subtotal), 0) as subtotal,
                            COALESCE(SUM(descuento_valor), 0) as total_descuento,
                            COALESCE(SUM(iva_valor), 0) as total_iva,
                            COALESCE(SUM(total), 0) as total
                        FROM facturacion_factura_detalle
                        WHERE factura_id = %s
                    """, [factura_id])
                    totales = cursor.fetchone()

                subtotal, total_descuento, total_iva, total = totales

                # Actualizar totales de la factura
                with connections[self.db_alias].cursor() as cursor:
                    cursor.execute("""
                        UPDATE facturacion_factura
                        SET subtotal = %s, total_descuento = %s, total_iva = %s, total = %s,
                            total_pagado = %s, cambio = 0
                        WHERE id = %s
                    """, [subtotal, total_descuento, total_iva, total, total, factura_id])

                # Crear pagos
                monto_total = total
                while monto_total > 0:
                    forma_pago = random.choice(formas_pago)
                    if forma_pago.permite_cambio and monto_total > 50000:
                        monto_pago = (monto_total + random.randint(0, 20000)).quantize(Decimal('100'))
                    else:
                        monto_pago = monto_total

                    with connections[self.db_alias].cursor() as cursor:
                        cursor.execute("""
                            INSERT INTO facturacion_pago
                            (factura_id, forma_pago_id, monto, referencia, autorizacion, creado_en)
                            VALUES (%s, %s, %s, %s, %s, NOW())
                        """, [
                            factura_id,
                            forma_pago.id,
                            monto_pago,
                            f'{random.randint(1000, 9999)}' if forma_pago.requiere_referencia else '',
                            f'AUTH-{random.randint(100000, 999999)}' if forma_pago.requiere_referencia else ''
                        ])

                    monto_total -= monto_pago

                facturas_creadas += 1

            if dia % 10 == 0:
                self.stdout.write(f'   Progreso: {dias - dia}/{dias} días completados...')

        self.stdout.write(f'   ✅ {facturas_creadas} facturas creadas')
        self.stdout.write(f'   ✅ {detalles_creados} detalles de factura creados')
