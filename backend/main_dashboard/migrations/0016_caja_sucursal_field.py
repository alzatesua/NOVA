# Generated migration for adding sucursal field to Caja models

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('main_dashboard', '0015_factura_dia_pago_cuotas'),
    ]

    operations = [
        migrations.AddField(
            model_name='movimientocaja',
            name='sucursal',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='movimientos_caja',
                to='main_dashboard.sucursales'
            ),
        ),
        migrations.AddField(
            model_name='arqueocaja',
            name='sucursal',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='arqueos_caja',
                to='main_dashboard.sucursales'
            ),
        ),
    ]
