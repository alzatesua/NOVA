#!/bin/bash
# Script para verificar la configuración multi-tenant y estado de conexiones
# Uso: ./verificar_conexion.sh [subdominio] [--test-connection]

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SUBDOMINIO=$1
TEST_CONNECTION=""

# Parsear argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --test-connection)
            TEST_CONNECTION="--test-connection"
            shift
            ;;
        *)
            SUBDOMINIO=$1
            shift
            ;;
    esac
done

echo -e "${GREEN}🔍 Script para verificar conexión multi-tenant${NC}"
if [ -n "$SUBDOMINIO" ]; then
    echo -e "${YELLOW}Subdominio: $SUBDOMINIO${NC}"
fi
if [ -n "$TEST_CONNECTION" ]; then
    echo -e "${YELLOW}Modo: Probar conexión a BD${NC}"
fi
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "manage.py" ]; then
    echo -e "${RED}❌ Error: manage.py no encontrado${NC}"
    echo -e "${YELLOW}Por favor ejecuta este script desde el directorio del proyecto Django${NC}"
    exit 1
fi

# Activar entorno virtual si existe
if [ -d "env" ]; then
    echo -e "${GREEN}Activando entorno virtual...${NC}"
    source env/bin/activate
fi

# Exportar settings de desarrollo
export ENVIRONMENT=development

# Ejecutar el comando de management
echo ""
echo -e "${GREEN}Ejecutando verificación...${NC}"
python manage.py verificar_conexion $SUBDOMINIO $TEST_CONNECTION

echo ""
