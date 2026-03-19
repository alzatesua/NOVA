# Generated migration for adding soporte_pago field to Abono model

from django.db import migrations, models


def upload_soporte_abono(instance, filename):
    """Genera la ruta para guardar el soporte de pago del abono."""
    import uuid
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return f"abonos/soportes/{instance.cliente.id}/{filename}"


class Migration(migrations.Migration):

    dependencies = [
        ('main_dashboard', '0017_add_caja_menor_field'),
    ]

    operations = [
        migrations.AddField(
            model_name='abono',
            name='soporte_pago',
            field=models.FileField(
                blank=True,
                null=True,
                upload_to=upload_soporte_abono,
                help_text='Soporte del pago (transferencia, nequi, tarjeta)'
            ),
        ),
    ]
