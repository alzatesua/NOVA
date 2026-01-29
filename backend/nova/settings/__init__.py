"""
Configuración de Django para el proyecto Nova.
Este módulo carga automáticamente la configuración correcta según el entorno.
"""
import os
from pathlib import Path

# Cargar variables de entorno desde .env
# Buscar .env en el directorio del proyecto backend
backend_dir = Path(__file__).resolve().parent.parent
env_file = backend_dir / '.env'

if env_file.exists():
    from dotenv import load_dotenv
    load_dotenv(env_file)

# Determinar el entorno (development o production)
# Por defecto es production si no se especifica ENVIRONMENT
environment = os.environ.get('ENVIRONMENT', 'production')

if environment == 'production':
    from .production import *
else:
    from .development import *
