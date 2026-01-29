"""
Configuración de Django para Producción
"""
from .base import *

# SECURITY WARNING: keep the secret key used in production secret!
# IMPORTANTE: Establecer SECRET_KEY en variables de entorno
SECRET_KEY = os.environ.get('SECRET_KEY')

if not SECRET_KEY:
    raise ValueError("No SECRET_KEY set in environment variables for production")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = [
    'dagi.co',
    '31.97.14.61',
    '.dagi.co',
    'backend',
    'nginx',
    'frontend'
]

# Database - Producción
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'bd_madre'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'zuleta18'),
        'HOST': os.environ.get('DB_HOST', 'db'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    },
}

# CORS - Producción (más restrictivo)
CORS_ALLOWED_ORIGINS = [
    "https://dagi.co",
    "http://31.97.14.61",
]

CSRF_TRUSTED_ORIGINS = [
    "http://31.97.14.61",
    "https://dagi.co",
    "https://*.dagi.co",
]

# Logging más detallado en producción
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'nova': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
