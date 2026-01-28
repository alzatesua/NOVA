"""
Script para crear datos semilla de facturación.

Ejecutar con:
    python manage.py shell < seed_facturacion.py

O desde Django shell:
    >>> exec(open('main_dashboard/seed_facturacion.py').read())
"""

from main_dashboard.models import FormaPago

def crear_formas_pago():
    """Crear formas de pago por defecto"""
    formas_pago = [
        {
            'codigo': 'EFE',
            'nombre': 'Efectivo',
            'activo': True,
            'requiere_referencia': False,
            'permite_cambio': True
        },
        {
            'codigo': 'TDC',
            'nombre': 'Tarjeta de Crédito',
            'activo': True,
            'requiere_referencia': True,
            'permite_cambio': False
        },
        {
            'codigo': 'TDE',
            'nombre': 'Tarjeta de Débito',
            'activo': True,
            'requiere_referencia': True,
            'permite_cambio': True
        },
        {
            'codigo': 'TRF',
            'nombre': 'Transferencia Bancaria',
            'activo': True,
            'requiere_referencia': True,
            'permite_cambio': False
        },
        {
            'codigo': 'CDP',
            'nombre': 'Código QR / Nequi',
            'activo': True,
            'requiere_referencia': True,
            'permite_cambio': False
        },
    ]

    for fp_data in formas_pago:
        forma_pago, created = FormaPago.objects.get_or_create(
            codigo=fp_data['codigo'],
            defaults=fp_data
        )
        if created:
            print(f"✓ Creada forma de pago: {forma_pago.nombre}")
        else:
            print(f"- Ya existe: {forma_pago.nombre}")

    print(f"\nTotal formas de pago: {FormaPago.objects.count()}")

def main():
    print("🌱 Creando datos semilla de facturación...")
    print("=" * 50)

    try:
        crear_formas_pago()
        print("\n✅ Datos semilla creados exitosamente")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise

if __name__ == '__main__':
    main()
