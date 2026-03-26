# Generated migration for SolicitudAperturaCaja table

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('nova', '0001_initial'),
        ('main_dashboard', '0027_arqueo_caja_estado_caja'),
    ]

    operations = [
        migrations.CreateModel(
            name='SolicitudAperturaCaja',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha', models.DateField(db_index=True, help_text='Fecha de la caja a abrir')),
                ('estado', models.CharField(
                    choices=[('pendiente', 'Pendiente de Aprobación'), ('aprobada', 'Aprobada'), ('rechazada', 'Rechazada')],
                    db_index=True,
                    default='pendiente',
                    max_length=20
                )),
                ('motivo', models.TextField(help_text='Razón por la que necesita abrir la caja')),
                ('observaciones_admin', models.TextField(
                    blank=True,
                    help_text='Comentarios del admin al rechazar la solicitud',
                    null=True
                )),
                ('fecha_procesamiento', models.DateTimeField(
                    blank=True,
                    help_text='Cuándo se procesó la solicitud',
                    null=True
                )),
                ('creada_en', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('aprobado_por', models.ForeignKey(
                    help_text='Admin que procesó la solicitud',
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='aprobaciones_apertura_caja',
                    blank=True,
                    to='nova.loginusuario'
                )),
                ('solicitante', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='solicitudes_apertura_caja',
                    to='nova.loginusuario'
                )),
                ('sucursal', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='solicitudes_apertura_caja',
                    to='main_dashboard.sucursales'
                )),
            ],
            options={
                'verbose_name': 'Solicitud de Apertura de Caja',
                'verbose_name_plural': 'Solicitudes de Apertura de Caja',
                'db_table': 'solicitudes_apertura_caja',
                'ordering': ('-creada_en', '-fecha'),
            },
        ),
        migrations.AddIndex(
            model_name='solicitudaperturacaja',
            index=models.Index(
                fields=['estado', '-creada_en'],
                name='main_dash_sol_estado_idx'
            ),
        ),
        migrations.AddIndex(
            model_name='solicitudaperturacaja',
            index=models.Index(
                fields=['sucursal', 'fecha', 'estado'],
                name='main_dash_sol_suc_fecha_idx'
            ),
        ),
        migrations.AddIndex(
            model_name='solicitudaperturacaja',
            index=models.Index(
                fields=['solicitante', 'estado'],
                name='main_dash_sol_solic_idx'
            ),
        ),
    ]
