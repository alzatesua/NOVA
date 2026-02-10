from django.core.management.base import BaseCommand
from main_dashboard.models import Producto, Existencia


class Command(BaseCommand):
    help = 'Sincroniza existencias con el cache de stock de productos'

    def handle(self, *args, **options):
        self.stdout.write('Sincronizando existencias con cache de productos...')

        productos = Producto.objects.all()
        actualizados = 0
        errores = 0

        for producto in productos:
            try:
                # Buscar la existencia del producto en su bodega asignada
                bodega_id = producto.bodega.id if producto.bodega else None
                if not bodega_id:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Producto {producto.id} ({producto.nombre}): No tiene bodega asignada'
                        )
                    )
                    continue

                existencia = Existencia.objects.get(
                    producto_id=producto.id,
                    bodega_id=bodega_id
                )

                # Actualizar si el cache es diferente
                if existencia.cantidad != producto.stock:
                    old_valor = existencia.cantidad
                    existencia.cantidad = producto.stock
                    existencia.save()

                    actualizados += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f'Producto {producto.id} ({producto.nombre}): '
                            f'{old_valor} → {producto.stock} '
                            f'(bodega {bodega_id})'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Producto {producto.id} ({producto.nombre}): '
                            f'Ya sincronizado ({producto.stock})'
                        )
                    )

            except Existencia.DoesNotExist:
                errores += 1
                self.stdout.write(
                    self.style.ERROR(
                        f'Producto {producto.id} NO tiene existencia en bodega {producto.bodega.id if producto.bodega else "N/A"}'
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nResumen:\n'
                f'- Actualizados: {actualizados}\n'
                f'- Errores: {errores}\n'
                f'- Total productos: {productos.count()}'
            )
        )
