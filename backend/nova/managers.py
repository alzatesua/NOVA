from django.contrib.auth.base_user import BaseUserManager
from django.core.exceptions import ValidationError

class UsuarioManager(BaseUserManager):
    def create_user(self, correo_usuario, password=None, **extra_fields):
        if not correo_usuario:
            raise ValueError('El usuario debe tener un correo electrónico')
        correo_usuario = self.normalize_email(correo_usuario)
        user = self.model(correo_usuario=correo_usuario, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, correo_usuario, password=None, **extra_fields):
        extra_fields.setdefault('is_admin', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('rol', 'admin')

        if extra_fields.get('is_admin') is not True:
            raise ValueError('El superusuario debe tener is_admin=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El superusuario debe tener is_superuser=True.')

        # Verificar que se haya proporcionado una tienda
        from .models import Tiendas
        tienda_id = extra_fields.get('tienda')

        if not tienda_id:
            # Buscar la primera tienda disponible
            primera_tienda = Tiendas.objects.first()
            if not primera_tienda:
                raise ValidationError(
                    'No existe ninguna tienda en el sistema. '
                    'Primero debe crear una tienda antes de crear un superusuario.\n'
                    'Use: python manage.py shell\n'
                    '>>> from nova.models import Tiendas, Direccion, Documento\n'
                    '>>> from nova.models import Pais, Ciudad\n'
                    '>>> tienda = Tiendas.objects.create(...)'
                )
            tienda_id = primera_tienda
            extra_fields['tienda'] = tienda_id

        return self.create_user(correo_usuario, password, **extra_fields)
