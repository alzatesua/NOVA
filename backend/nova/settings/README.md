# Configuración de Settings para Django - Nova Project

Este proyecto ahora utiliza una estructura de configuración separada por entornos (development/production).

**IMPORTANTE**: Por defecto usa **PRODUCTION** por seguridad.

## 📁 Estructura de Archivos

```
nova/
├── settings/
│   ├── __init__.py          # Carga automática según entorno
│   ├── base.py              # Configuración compartida
│   ├── development.py       # Configuración de desarrollo
│   ├── production.py        # Configuración de producción
│   └── README.md            # Este archivo
└── settings.py              # Configuración original (respaldo)
```

## 🔧 Uso

### Desarrollo

**Opción 1: Local (sin Docker)**
```bash
export ENVIRONMENT=development
python manage.py runserver
```

**Opción 2: Con Docker Compose**
```bash
# Usar el override de desarrollo
docker-compose -f docker-compose.yml -f docker-compose.dev.yml.example up
```

### Producción (Por Defecto)

**Opción 1: Docker Compose (Recomendado)**
```bash
# Por defecto usa production (ver ENVIRONMENT=production en docker-compose.yml)
docker-compose up -d
```

**Opción 2: Local**
```bash
# Por defecto usa production si no se especifica ENVIRONMENT
export SECRET_KEY=tu_clave_secreta_aqui
python manage.py runserver
```

## 🔐 Variables de Entorno Requeridas (Producción)

Crear un archivo `.env` en la raíz del proyecto con:

```bash
# Django
SECRET_KEY=tu_clave_secreta_muy_larga_y_segura_aqui
DEBUG=False

# Base de Datos
DB_NAME=bd_madre
DB_USER=postgres
DB_PASSWORD=tu_contraseña_segura_aqui
DB_HOST=db
DB_PORT=5432

# Mailjet (Email)
MAILJET_API_KEY=tu_mailjet_api_key
MAILJET_API_SECRET=tu_mailjet_api_secret
MAILJET_EMAIL_FROM=nova@dagi.co

# Dominio
BASE_DOMAIN=dagi.co

# Ambiente
ENVIRONMENT=production
```

## ✅ Correcciones Realizadas

1. **AUTH_USER_MODEL unificado**: Solo `nova.LoginUsuario` (eliminada duplicación)
2. **SECRET_KEY unificada**: Solo una definición (eliminada duplicación)
3. **Credenciales en variables de entorno**: Mailjet y DB ahora usan `os.environ.get()`
4. **Imports duplicados eliminados**: Código más limpio
5. **Configuración separada por entornos**: Mejor seguridad y organización

## 📝 Notas Importantes

- El archivo `settings.py` original se mantiene como respaldo
- Para usar la nueva estructura, no es necesario modificar `manage.py`
- El sistema detecta automáticamente el entorno mediante la variable `ENVIRONMENT`
- Si no se define `ENVIRONMENT`, se usa `development` por defecto

## 🚀 Migración desde settings.py Original

El archivo `settings.py` original sigue funcionando. Para migrar a la nueva estructura:

1. Configurar las variables de entorno necesarias
2. Opcional: Actualizar Docker/compose para usar `ENVIRONMENT=production`
3. La nueva estructura se cargará automáticamente según el entorno
