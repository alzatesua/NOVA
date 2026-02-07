# Script para verificar qué productos no tienen IVA asociado
# Uso: python manage.py shell < check_iva.py

from main_dashboard.models import Producto, Iva
from django.db.models import Count

# Contar productos con y sin IVA
con_iva = Producto.objects.filter(iva_id__isnull=False).count()
sin_iva = Producto.objects.filter(iva_id__isnull=True).count()

print(f"=== RESUMEN DE PRODUCTOS ===")
print(f"Total con IVA: {con_iva}")
print(f"Total sin IVA: {sin_iva}")
print(f"Total: {con_iva + sin_iva}")
print()

# Mostrar primeros 10 productos sin IVA
if sin_iva > 0:
    print("=== PRODUCTOS SIN IVA (primeros 10) ===")
    productos_sin_iva = Producto.objects.filter(iva_id__isnull=True)[:10]
    for p in productos_sin_iva:
        print(f"ID: {p.id} | SKU: {p.sku} | Nombre: {p.nombre} | IVA: NULL")
    print()

# Mostrar IVA disponible
print("=== IVAS DISPONIBLES ===")
ivas = Iva.objects.all()
for iva in ivas:
    print(f"ID: {iva.id_iva} | Porcentaje: {iva.porcentaje}%")
print()

# Asignar IVA por defecto a productos sin IVA
if sin_iva > 0 and ivas.exists():
    print(f"=== ASIGNAR IVA POR DEFECTO ===")
    iva_default = ivas.first()
    print(f"¿Deseas asignar el IVA {iva_default.porcentaje}% a los {sin_iva} productos sin IVA?")
    print("Ejecuta: Producto.objects.filter(iva_id__isnull=True).update(iva_id={iva_default.id_iva})")
