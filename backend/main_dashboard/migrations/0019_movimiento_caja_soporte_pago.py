# Generated migration for adding soporte_pago field to MovimientoCaja model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main_dashboard', '0018_abono_soporte_pago'),
    ]

    operations = [
        migrations.AddField(
            model_name='movimientocaja',
            name='soporte_pago',
            field=models.FileField(
                blank=True,
                null=True,
                upload_to='caja/soportes/',
                help_text='Soporte del pago (transferencia, nequi, tarjeta)'
            ),
        ),
    ]
