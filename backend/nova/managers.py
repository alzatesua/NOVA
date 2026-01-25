from django.contrib.auth.base_user import BaseUserManager

class UsuarioManager(BaseUserManager):
    def create_user(self, correo_usuario, password=None, **extra_fields):
        if not correo_usuario:
            raise ValueError('El usuario debe tener un correo electrónico')
        correo_usuario = self.normalize_email(correo_usuario)
        user = self.model(correo_usuario=correo_usuario, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, correo_usuario, password, **extra_fields):
        extra_fields.setdefault('is_admin', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_admin') is not True:
            raise ValueError('El superusuario debe tener is_admin=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El superusuario debe tener is_superuser=True.')

        return self.create_user(correo_usuario, password, **extra_fields)
