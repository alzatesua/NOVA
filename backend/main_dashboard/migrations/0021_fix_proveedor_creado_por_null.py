# Generated migration for fixing proveedor creado_por null constraint
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('main_dashboard', '0020_agregar_modelos_proveedores'),
    ]

    operations = [
        migrations.AlterField(
            model_name='proveedor',
            name='creado_por',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='proveedores_creados',
                to='nova.loginusuario'
            ),
        ),
    ]
