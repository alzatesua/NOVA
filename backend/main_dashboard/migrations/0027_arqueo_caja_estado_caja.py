# Generated migration for ArqueoCaja estado_caja fields

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('main_dashboard', '0026_remove_productovariante_stock_kardexajuste_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='arqueocaja',
            name='estado_caja',
            field=models.CharField(
                choices=[('abierta', 'Caja Abierta'), ('cerrada', 'Caja Cerrada')],
                default='abierta',
                max_length=20,
                db_index=True,
                help_text='Estado de la caja después del arqueo'
            ),
        ),
        migrations.AddField(
            model_name='arqueocaja',
            name='fecha_hora_cierre',
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text='Fecha y hora en que se cerró la caja'
            ),
        ),
        migrations.AddField(
            model_name='arqueocaja',
            name='cerrado_por',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.SET_NULL,
                null=True,
                blank=True,
                related_name='cajas_cerradas',
                to='nova.loginusuario',
                help_text='Usuario que cerró la caja'
            ),
        ),
        migrations.AddField(
            model_name='arqueocaja',
            name='detalle_conteo',
            field=models.JSONField(
                blank=True,
                null=True,
                help_text='Detalle del conteo de billetes, monedas y otros métodos'
            ),
        ),
        migrations.AddField(
            model_name='arqueocaja',
            name='modificado_despues_cierre',
            field=models.BooleanField(
                default=False,
                help_text='Indica si el arqueo fue modificado después de cerrar la caja'
            ),
        ),
        migrations.AddIndex(
            model_name='arqueocaja',
            index=models.Index(
                fields=['estado_caja', 'fecha'],
                name='main_dash_arqueo_estado_idx'
            ),
        ),
        migrations.AddIndex(
            model_name='arqueocaja',
            index=models.Index(
                fields=['sucursal', 'fecha', 'estado_caja'],
                name='main_dash_arqueo_suc_fecha_idx'
            ),
        ),
    ]
