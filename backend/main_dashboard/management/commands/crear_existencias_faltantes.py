from django.core.management.base import BaseCommand
from main_dashboard.models import Producto, Bodega, Existencia


class Command(BaseCommand):
    help = 'Crea existencias faltantes para todos los productos en todas las bodegas'

    def handle(self, *args, **options):
        self.stdout.write('Creando existencias faltantes...')

        productos = Producto.objects.all()
        bodegas = Bodega.objects.all()

        creados = 0
        existentes = 0

        for producto in productos:
            for bodega in bodegas:
                existencia, created = Existencia.objects.get_or_create(
                    producto=producto,
                    bodega=bodega,
                    defaults={
                        'cantidad': 0,
                        'reservado': 0,
                        'minimo': 0,
                        'maximo': None
                    }
                )

                if created:
                    creados += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Creada existencia para producto {producto.id} ({producto.nombre}) '
                            f'en bodega {bodega.id} ({bodega.nombre})'
                        )
                    )
                else:
                    existentes += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nResumen:\n'
                f'- Existencias creadas: {creados}\n'
                f'- Ya existían: {existentes}\n'
                f'- Total procesado: {creados + existentes}'
            )
        )
