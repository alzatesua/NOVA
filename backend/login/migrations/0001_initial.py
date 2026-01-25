from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='LoginUsuarioGeneral',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('correo_usuario', models.EmailField(unique=True)),
                ('password', models.CharField(max_length=128)),
            ],
            options={
                'db_table': 'login_usuarios',
            },
        ),
        migrations.CreateModel(
            name='InfProveedores',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('razon_social', models.CharField(max_length=255)),
                ('correo', models.EmailField()),
                ('telefono', models.CharField(max_length=20)),
                ('direccion', models.CharField(max_length=255)),
                ('n_registro_mercantil', models.CharField(max_length=100)),
                ('nit', models.CharField(max_length=50)),
            ],
        ),
    ]