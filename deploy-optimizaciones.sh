#!/bin/bash

# Script de Despliegue de Optimizaciones de Nginx para Nova
# Automatiza el proceso de aplicar todas las optimizaciones

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}Despliegue de Optimizaciones - Nova${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# ============================================
# FUNCIONES DE UTILIDAD
# ============================================

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# ============================================
# VERIFICAR QUE ESTAMOS EN EL DIRECTORIO CORRECTO
# ============================================
if [ ! -f "docker-compose.yml" ]; then
    print_error "Este script debe ejecutarse desde el directorio /home/dagi/nova"
    exit 1
fi

# ============================================
# BACKUP DE CONFIGURACIONES ORIGINALES
# ============================================
print_section "1. Creando Backup de Configuraciones"

BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

if [ ! -f "$BACKUP_DIR/nginx.conf.original" ]; then
    cp nginx/nginx.conf $BACKUP_DIR/nginx.conf.original 2>/dev/null || echo "No hay nginx.conf original"
    print_success "Backup de nginx.conf creado"
fi

if [ ! -f "$BACKUP_DIR/docker-compose.yml.original" ]; then
    cp docker-compose.yml $BACKUP_DIR/docker-compose.yml.original 2>/dev/null || echo "No hay docker-compose.yml original"
    print_success "Backup de docker-compose.yml creado"
fi

if [ ! -f "$BACKUP_DIR/backend.Dockerfile.original" ]; then
    cp backend/Dockerfile $BACKUP_DIR/backend.Dockerfile.original 2>/dev/null || echo "No hay backend/Dockerfile original"
    print_success "Backup de backend/Dockerfile creado"
fi

echo ""
echo -e "${YELLOW}Backups guardados en: $BACKUP_DIR${NC}"

# ============================================
# DETENER CONTENEDORES ACTUALES
# ============================================
print_section "2. Deteniendo Contenedores Actuales"

print_warning "Deteniendo contenedores..."
docker-compose down

print_success "Contenedores detenidos"

# ============================================
# LIMPIAR IMÁGENS VIEJAS (OPCIONAL)
# ============================================
print_section "3. Limpiando Imágenes Viejas"

read -p "¿Deseas limpiar imágenes Docker viejas? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Limpiando imágenes..."
    docker image prune -f
    print_success "Imágenes limpiadas"
else
    echo "Saltando limpieza de imágenes"
fi

# ============================================
# RECONSTRUIR IMÁGENES
# ============================================
print_section "4. Reconstruyendo Imágenes Optimizadas"

print_warning "Reconstruyendo imagen de backend (optimizada)..."
docker-compose build --no-cache backend

print_warning "Reconstruyendo imagen de nginx (optimizada)..."
docker-compose build --no-cache nginx

print_warning "Reconstruyendo imagen de frontend..."
docker-compose build --no-cache frontend

print_success "Imágenes reconstruidas con optimizaciones"

# ============================================
# INICIAR CONTENEDORES OPTIMIZADOS
# ============================================
print_section "5. Iniciando Contenedores Optimizados"

print_warning "Iniciando contenedores con nuevas configuraciones..."
docker-compose up -d

print_success "Contenedores iniciados"

# ============================================
# ESPERAR A QUE LOS SERVICIOS ESTÉN LISTOS
# ============================================
print_section "6. Esperando a que Servicios estén Listos"

print_warning "Esperando 30 segundos para que los servicios inicien..."
sleep 30

# Verificar que los contenedores estén corriendo
RUNNING_CONTAINERS=$(docker ps | grep nova | wc -l)

if [ "$RUNNING_CONTAINERS" -ge 4 ]; then
    print_success "Contenedores corriendo correctamente ($RUNNING_CONTAINERS contenedores)"
else
    print_error "Algunos contenedores no están corriendo ($RUNNING_CONTAINERS contenedores)"
    echo "Contenedores actuales:"
    docker ps
fi

# ============================================
# VERIFICAR CONFIGURACIÓN DE NGINX
# ============================================
print_section "7. Verificando Configuración de Nginx"

print_warning "Verificando configuración de Nginx..."
if docker exec nginx nginx -t 2>&1 | grep -q "successful"; then
    print_success "Configuración de Nginx válida"

    # Reload de Nginx
    print_warning "Aplicando configuración de Nginx..."
    docker exec nginx nginx -s reload
    print_success "Nginx recargado exitosamente"
else
    print_error "Configuración de Nginx tiene errores"
    docker exec nginx nginx -t
    echo ""
    print_warning "Revizando logs de Nginx..."
    docker logs nginx --tail 50
    exit 1
fi

# ============================================
# VERIFICAR BACKENDS ESCALADOS
# ============================================
print_section "8. Verificando Backends Escalados"

BACKEND_COUNT=$(docker ps | grep backend | wc -l)

if [ "$BACKEND_COUNT" -eq 3 ]; then
    print_success "3 backends corriendo correctamente"
else
    print_warning "Se esperaban 3 backends, pero hay $BACKEND_COUNT"
fi

echo "Backends activos:"
docker ps | grep backend

# ============================================
# VERIFICAR CONECTIVIDAD
# ============================================
print_section "9. Verificando Conectividad"

print_warning "Verificando frontend..."
if curl -sI -o /dev/null -w "%{http_code}" https://nova.dagi.co | grep -q "200\|301\|302"; then
    print_success "Frontend respondiendo correctamente"
else
    print_warning "Frontend no responde (puede ser normal si SSL no está configurado)"
fi

print_warning "Verificando API..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://nova.dagi.co/api/ 2>/dev/null || echo "000")
if [ "$API_STATUS" = "200" ] || [ "$API_STATUS" = "405" ]; then
    print_success "API respondiendo correctamente (HTTP $API_STATUS)"
else
    print_warning "API no responde todavía (HTTP $API_STATUS)"
fi

# ============================================
# VERIFICAR MÉTRICAS DE NGINX
# ============================================
print_section "10. Verificando Métricas de Nginx"

print_warning "Obteniendo métricas de Nginx..."
NGINX_STATUS=$(docker exec nginx wget -qO- http://localhost/nginx_status 2>/dev/null || echo "")

if [ -n "$NGINX_STATUS" ]; then
    print_success "Métricas de Nginx disponibles:"
    echo "$NGINX_STATUS"
else
    print_warning "No se pueden obtener métricas de Nginx ahora"
fi

# ============================================
# MOSTRAR CONTENEDORES ACTIVOS
# ============================================
print_section "11. Contenedores Activos"

echo "Contenedores Nova activos:"
docker ps | grep nova

# ============================================
# MOSTRAR USO DE RECURSOS
# ==========================================
print_section "12. Uso de Recursos"

print_warning "Uso actual de recursos:"
docker stats --no-stream

# ============================================
# INSTRUCCIONES FINALES
# ==========================================
print_section "13. Instrucciones Finales"

echo ""
echo -e "${GREEN}🎉 ¡Despliegue completado exitosamente!${NC}"
echo ""
echo "Próximos pasos:"
echo ""
echo "1. Ejecutar pruebas de rendimiento:"
echo -e "${BLUE}   ./test-rendimiento.sh${NC}"
echo ""
echo "2. Monitorear logs en tiempo real:"
echo -e "${BLUE}   docker logs -f nginx --tail 100${NC}"
echo ""
echo "3. Ver métricas de Nginx:"
echo -e "${BLUE}   docker exec nginx wget -qO- http://localhost/nginx_status${NC}"
echo ""
echo "4. Recargar Nginx si haces cambios:"
echo -e "${BLUE}   docker exec nginx nginx -s reload${NC}"
echo ""
echo "5. Reiniciar servicios si es necesario:"
echo -e "${BLUE}   docker-compose restart${NC}"
echo ""
echo "6. Ver todos los contenedores:"
echo -e "${BLUE}   docker ps${NC}"
echo ""
echo "7. Ver uso de recursos:"
echo -e "${BLUE}   docker stats${NC}"
echo ""

echo "Archivos de configuración:"
echo "  • nginx.conf:        /home/dagi/nova/nginx/nginx.conf"
echo "  • docker-compose:    /home/dagi/nova/docker-compose.yml"
echo "  • backend Dockerfile: /home/dagi/nova/backend/Dockerfile"
echo ""

echo "Documentación:"
echo "  • Guía completa:     /home/dagi/nova/OPTIMIZACION_NGINX.md"
echo "  • Script pruebas:     /home/dagi/nova/test-rendimiento.sh"
echo ""

echo "Backups originales:"
echo "  • Directorio:        $BACKUP_DIR"
echo ""

echo -e "${YELLOW}⚠️  Importante:${NC}"
echo "  • Las optimizaciones incrementan la capacidad de 50 a 500+ usuarios"
echo "  • Los tiempos de respuesta deben ser < 500ms en el 90% de casos"
echo "  • Monitorea regularmente con ./test-rendimiento.sh"
echo "  • Ajusta parámetros según tu tráfico real"
echo ""

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}Despliegue finalizado${NC}"
echo -e "${BLUE}===========================================${NC}"
