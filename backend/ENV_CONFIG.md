# Configuración de Variables de Entorno - Nova Project

## 📝 Archivo .env

El archivo `.env` en `/backend/.env` contiene todas las variables de entorno sensibles del sistema.

### Variables Configuradas

```bash
# Django
SECRET_KEY=<tu_clave_secreta_generada_aleatoriamente>
DEBUG=False
ENVIRONMENT=production

# Database
DB_NAME=bd_madre
DB_USER=postgres
DB_PASSWORD=<tu_contraseña>
DB_HOST=db
DB_PORT=5432

# Mailjet (Email)
MAILJET_API_KEY=<tu_api_key>
MAILJET_API_SECRET=<tu_api_secret>
MAILJET_EMAIL_FROM=nova@dagi.co

# Domain
BASE_DOMAIN=dagi.co
```

## 🔒 Seguridad

- ✅ El archivo `.env` está en `.gitignore` (NO se sube al repositorio)
- ✅ Se usa `python-dotenv` para cargar las variables automáticamente
- ✅ `SECRET_KEY` se genera de forma aleatoria y segura
- ✅ Todas las credenciales están en variables de entorno

## 🚀 Uso

### Desarrollo Local

El archivo `.env` se carga automáticamente desde:
- `/backend/.env` (recomendado)

### Producción (Docker)

Las variables se cargan desde el archivo `.env` usando `env_file` en docker-compose.yml:

```yaml
backend:
  build: ./backend
  env_file:
    - ./backend/.env
```

## ⚠️ IMPORTANTE - Cambio de SECRET_KEY

Al cambiar la `SECRET_KEY`, **TODOS los tokens JWT existentes se vuelven inválidos**.

### Solución para Usuarios Existentes

Después de cambiar la SECRET_KEY, los usuarios deben:

1. **Cerrar sesión**
2. **Iniciar sesión nuevamente**

Esto generará un nuevo token válido con la nueva SECRET_KEY.

## 🔄 Regenerar SECRET_KEY

Si necesitas generar una nueva SECRET_KEY, ejecuta:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

Luego actualiza la línea `SECRET_KEY=...` en el archivo `.env`.

## 📁 Estructura de Settings

```
backend/nova/settings/
├── __init__.py       # Carga .env y determina el entorno
├── base.py           # Configuración compartida
├── development.py    # Configuración de desarrollo
└── production.py     # Configuración de producción

backend/nova/
└── settings.py       # Settings original (respaldo, también usa .env)
```

## 🛠️ Instalación de Dependencias

Al agregar el soporte para `.env`, se instaló `python-dotenv`:

```bash
pip install python-dotenv
```

O reconstruye el contenedor Docker:

```bash
docker-compose down
docker-compose build backend
docker-compose up -d
```

## 📋 Checklist de Despliegue

- [x] Crear archivo `.env` con variables sensibles
- [x] Agregar `python-dotenv` a requirements.txt
- [x] Configurar settings para cargar desde .env
- [x] Actualizar docker-compose.yml
- [x] Verificar que .env está en .gitignore
- [ ] **Los usuarios deben hacer logout/login después del cambio**

---

**Nota:** Si recibes errores de "Token inválido o manipulado", es porque la SECRET_KEY cambió. Solución: cierra sesión y vuelve a iniciar.
