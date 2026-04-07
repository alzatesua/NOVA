"""
Configuración base de Django - compartida entre development y production
"""
from pathlib import Path
import os
import datetime
from datetime import timedelta
from django.utils import timezone
from corsheaders.defaults import default_headers

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Variable para fechas
dt_naive = datetime.datetime.now()
dt_aware = timezone.make_aware(dt_naive, timezone=datetime.timezone.utc)

# Application definition
INSTALLED_APPS = [
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework.authtoken',
    'rest_auth',
    'cities_light',
    'nova',
    'login',
    'django_extensions',
    'main_dashboard',
    'django_filters',
    'analytics',  # Analytics y Reportes
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'main_dashboard.middleware.DisableCSRFForAPIMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'nova.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'nova.wsgi.application'

# Modelo de usuario personalizado
AUTH_USER_MODEL = 'nova.LoginUsuario'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ),
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
}

# JWT configuration
# Access token de 4 horas con refresh token de 7 días
# El refresh proactivo del frontend renovará el token 5 minutos antes de expirar
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=4),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,  # Rotar refresh token al renovar
    'BLACKLIST_AFTER_ROTATION': True,  # Invalidar refresh token antiguo
}

# CORS configuration
CORS_ALLOW_HEADERS = list(default_headers) + [
    'authorization',
    'x-csrftoken',
    'content-type',
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https:\/\/([a-z0-9-]+\.)*dagi\.co$",
]

# Dominio base
BASE_DOMAIN = os.environ.get('BASE_DOMAIN', 'dagi.co')

# Mailjet - Credenciales
MAILJET_API_KEY = os.environ.get('MAILJET_API_KEY', '78eeb3d1a064eee752054c93d5317fbf')
MAILJET_API_SECRET = os.environ.get('MAILJET_API_SECRET', 'ef3c1d75feaebea65382a59a7e4546f7')
MAILJET_EMAIL_FROM = os.environ.get('MAILJET_EMAIL_FROM', 'nova@dagi.co')

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
}

# API prefix - ELIMINADO: causaba doble /api/api/ en las URLs
# El frontend ya maneja las rutas con /api correctamente
USE_X_FORWARDED_HOST = True

# ✅ Configuración adicional para endpoints de exportación (archivos binarios)
# Headers adicionales necesarios para CORS con archivos binarios
CORS_ALLOW_HEADERS += [
    'accept',
    'content-disposition',
    'x-requested-with',
]

# Exponer headers necesarios para que el frontend pueda leer Content-Disposition
CORS_EXPOSE_HEADERS = [
    'content-disposition',
    'content-type',
]
