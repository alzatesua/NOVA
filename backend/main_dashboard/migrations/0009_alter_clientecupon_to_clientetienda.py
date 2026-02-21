# Generated manually - Modificar ClienteCupon para usar ClienteTienda

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main_dashboard', '0008_cupon_clientetienda_clientecupon'),
    ]

    operations = [
        # Paso 1: Agregar el nuevo campo cliente_tienda (nullable por ahora)
        migrations.AddField(
            model_name='clientecupon',
            name='cliente_tienda',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='cupones_asignados',
                to='main_dashboard.clientetienda'
            ),
        ),
        # Paso 2: Renombrar el campo 'cliente' a 'cliente_fiscal' y hacerlo nullable
        migrations.RenameField(
            model_name='clientecupon',
            old_name='cliente',
            new_name='cliente_fiscal',
        ),
        migrations.AlterField(
            model_name='clientecupon',
            name='cliente_fiscal',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='cupones_fiscales',
                to='main_dashboard.cliente'
            ),
        ),
        # Paso 3: Eliminar la restricción unique_together antigua
        migrations.AlterUniqueTogether(
            name='clientecupon',
            unique_together=set(),
        ),
        # Paso 4: Agregar la nueva restricción unique_together
        migrations.AlterUniqueTogether(
            name='clientecupon',
            unique_together={('cliente_tienda', 'cupon')},
        ),
    ]
