# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('main_dashboard', '0010_unique_numero_documento_cliente'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cliente',
            name='numero_documento',
            field=models.CharField(blank=True, db_index=True, max_length=50, null=True),
        ),
    ]
