from django.db import models

class LoginUsuarioGeneral(models.Model):
    correo_usuario = models.EmailField(unique=True)
    password = models.CharField(max_length=128)


    class Meta:
        db_table = "login_usuarios"

class InfProveedores(models.Model):
    razon_social = models.CharField(max_length=255)
    correo = models.EmailField()
    telefono = models.CharField(max_length=20)
    direccion = models.CharField(max_length=255)
    n_registro_mercantil = models.CharField(max_length=100)
    nit = models.CharField(max_length=50)
    # agrega otros campos si los tienes
