#!/bin/bash
# Script para crear datos de prueba para el e-commerce multi-tenant
# Uso: ./crear_datos_prueba.sh [subdominio] [cantidad]

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Valores por defecto
SUBDOMINIO=${1:-"mi-tienda"}
CANTIDAD=${2:-10}

echo -e "${GREEN}🚀 Script para crear datos de prueba${NC}"
echo -e "${YELLOW}Subdominio: ${SUBDOMINIO}${NC}"
echo -e "${YELLOW}Cantidad de productos: ${CANTIDAD}${NC}"
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
echo -e "${GREEN}Ejecutando comando de Django...${NC}"
python manage.py crear_datos_prueba \
    --subdominio "$SUBDOMINIO" \
    --cantidad "$CANTIDAD"

# Verificar resultado
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Datos de prueba creados exitosamente!${NC}"
    echo -e "${GREEN}URL de prueba: https://${SUBDOMINIO}.nova.dagi.co/${NC}"
    echo ""
    echo -e "${YELLOW}Para probar la API ejecuta:${NC}"
    echo -e "curl -X POST https://dagi.co/api/productos/list/ \\"
    echo -e "  -H 'Content-Type: application/json' \\"
    echo -e "  -d '{\"subdominio\": \"${SUBDOMINIO}\"}'"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Error al crear datos de prueba${NC}"
    echo -e "${YELLOW}Verifica los logs arriba para más detalles${NC}"
    exit 1
fi
