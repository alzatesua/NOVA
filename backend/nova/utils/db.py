from django.db import connections
from django.conf import settings
from datetime import datetime, timedelta
import jwt
import threading

_db_lock = threading.Lock()

def conectar_db_tienda(alias, tienda):
    with _db_lock:
        if alias not in settings.DATABASES:
            settings.DATABASES[alias] = {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': tienda.db_nombre,
                'USER': tienda.db_usuario,
                'PASSWORD': tienda.db_password,
                'HOST': settings.DATABASES['default']['HOST'],
                'PORT': '5432',
                'OPTIONS': {
                    'options': '-c search_path=public'
                },
                'CONN_HEALTH_CHECKS': False,
                'CONN_MAX_AGE': 0,
                'AUTOCOMMIT': True,
                'ATOMIC_REQUESTS': False,
                'TEST': {'NAME': None},
                'TIME_ZONE': getattr(settings, 'TIME_ZONE', 'UTC'),
            }

def generar_token_jwt(usuario, minutos_expiracion=60):
    ahora = datetime.utcnow()
    expira = ahora + timedelta(minutes=minutos_expiracion)
    payload = {
        'usuario': usuario,
        'iat': ahora,
        'exp': expira
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')