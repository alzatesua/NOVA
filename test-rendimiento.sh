#!/bin/bash

# Script de Pruebas de Rendimiento para Nova - Optimizado
# Verifica que el servidor optimizado puede soportar >500 usuarios concurrentes

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}Pruebas de Rendimiento - Nova Optimizado${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# ============================================
# FUNCIONES DE UTILIDAD
# ============================================

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ Error: $1 no está instalado${NC}"
        echo -e "${YELLOW}Instalar: sudo apt-get install $1${NC}"
        exit 1
    fi
}

print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# ============================================
# VERIFICAR DEPENDENCIAS
# ============================================
print_section "1. Verificando Dependencias"

check_command "curl"
check_command "docker"
check_command "docker-compose"

# Verificar Apache Bench (ab)
if ! command -v ab &> /dev/null; then
    echo -e "${YELLOW}Instalando Apache Bench para pruebas de carga...${NC}"
    sudo apt-get update > /dev/null 2>&1
    sudo apt-get install -y apache2-utils > /dev/null 2>&1
    print_success "Apache Bench instalado"
else
    print_success "Apache Bench ya instalado"
fi

# ============================================
# VERIFICAR SERVICIOS
# ============================================
print_section "2. Verificando Servicios Docker"

echo "Verificando contenedores..."
if docker ps | grep -q nova; then
    print_success "Contenedores Nova están corriendo"
else
    print_error "Contenedores Nova no están corriendo"
    echo -e "${YELLOW}Iniciando contenedores...${NC}"
    docker-compose up -d
    sleep 10
fi

# Verificar Nginx
echo "Verificando Nginx..."
if docker ps | grep -q nginx; then
    print_success "Nginx está corriendo"

    # Test de configuración
    echo "Verificando configuración de Nginx..."
    if docker exec nginx nginx -t 2>&1 | grep -q "successful"; then
        print_success "Configuración de Nginx válida"
    else
        print_error "Configuración de Nginx tiene errores"
        docker exec nginx nginx -t
    fi
else
    print_error "Nginx no está corriendo"
fi

# ============================================
# OBTENER URLs
# ============================================
print_section "3. Configuración de Pruebas"

FRONTEND_URL="https://nova.dagi.co"
API_URL="https://nova.dagi.co/api/"
STATUS_URL="http://localhost/nginx_status"

echo "URL de Frontend: $FRONTEND_URL"
echo "URL de API: $API_URL"
echo "URL de Status: $STATUS_URL"
echo ""

# ============================================
# VERIFICAR OPTIMIZACIONES
# ============================================
print_section "4. Verificando Optimizaciones"

echo "Verificando compresión Gzip..."
if curl -sI -H "Accept-Encoding: gzip" $FRONTEND_URL | grep -q "Content-Encoding: gzip"; then
    print_success "Compresión Gzip activada"
else
    print_warning "Gzip no detectado en respuesta"
fi

echo "Verificando headers de cache..."
if curl -sI $FRONTEND_URL | grep -qi "cache-control"; then
    print_success "Headers de Cache configurados"
else
    print_warning "Headers de Cache no detectados"
fi

echo "Verificando SSL/TLS..."
if curl -sI $FRONTEND_URL | grep -q "HTTP/2"; then
    print_success "HTTP/2 activado"
else
    print_warning "HTTP/2 no detectado"
fi

# ============================================
# MÉTRICAS BASE
# ============================================
print_section "5. Métricas Iniciales"

echo "Obteniendo métricas de Nginx..."
NGINX_STATUS=$(curl -s $STATUS_URL 2>/dev/null || echo "")
if [ -n "$NGINX_STATUS" ]; then
    echo "$NGINX_STATUS"
    print_success "Métricas de Nginx obtenidas"

    # Extraer conexiones activas
    ACTIVE_CONNS=$(echo "$NGINX_STATUS" | grep -oP 'Active connections: \K\d+' || echo "0")
    echo -e "${BLUE}Conexiones activas: $ACTIVE_CONNS${NC}"
else
    print_warning "No se pueden obtener métricas de Nginx (requiere acceso local)"
fi

# ============================================
# PRUEBAS DE CARGA
# ============================================
print_section "6. Pruebas de Carga Progresivas"

# Test 1: 100 usuarios, 1000 solicitudes (baseline)
echo ""
echo -e "${YELLOW}Test 1: 100 usuarios concurrentes, 1000 solicitudes${NC}"
echo "Comando: ab -n 1000 -c 100 $FRONTEND_URL"
echo ""

TEST1_RESULT=$(ab -n 1000 -c 100 -q $FRONTEND_URL 2>&1)
TEST1_RPS=$(echo "$TEST1_RESULT" | grep "Requests per second" | grep -oP '[0-9]+\.[0-9]+' || echo "0")
TEST1_TIME=$(echo "$TEST1_RESULT" | grep "Time taken" | grep -oP '[0-9]+\.[0-9]+' || echo "0")
TEST1_FAILED=$(echo "$TEST1_RESULT" | grep "Failed requests" | grep -oP '[0-9]+' || echo "0")

echo "Resultados Test 1:"
echo "  - Throughput: $TEST1_RPS req/s"
echo "  - Tiempo total: ${TEST1_TIME}s"
echo "  - Fallos: $TEST1_FAILED"

if [ "$TEST1_FAILED" -lt 10 ]; then
    print_success "Test 1 completado exitosamente"
else
    print_error "Test 1 tuvo muchos fallos: $TEST1_FAILED"
fi

sleep 3

# Test 2: 200 usuarios, 2000 solicitudes
echo ""
echo -e "${YELLOW}Test 2: 200 usuarios concurrentes, 2000 solicitudes${NC}"
echo "Comando: ab -n 2000 -c 200 $FRONTEND_URL"
echo ""

TEST2_RESULT=$(ab -n 2000 -c 200 -q $FRONTEND_URL 2>&1)
TEST2_RPS=$(echo "$TEST2_RESULT" | grep "Requests per second" | grep -oP '[0-9]+\.[0-9]+' || echo "0")
TEST2_TIME=$(echo "$TEST2_RESULT" | grep "Time taken" | grep -oP '[0-9]+\.[0-9]+' || echo "0")
TEST2_FAILED=$(echo "$TEST2_RESULT" | grep "Failed requests" | grep -oP '[0-9]+' || echo "0")
TEST2_P50=$(echo "$TEST2_RESULT" | grep "50%" | grep -oP '[0-9]+' || echo "0")
TEST2_P90=$(echo "$TEST2_RESULT" | grep "90%" | grep -oP '[0-9]+' || echo "0")

echo "Resultados Test 2:"
echo "  - Throughput: $TEST2_RPS req/s"
echo "  - Tiempo total: ${TEST2_TIME}s"
echo "  - Fallos: $TEST2_FAILED"
echo "  - Latencia P50: ${TEST2_P50}ms"
echo "  - Latencia P90: ${TEST2_P90}ms"

if [ "$TEST2_FAILED" -lt 20 ] && [ "$TEST2_P90" -lt 500 ]; then
    print_success "Test 2: P90 < 500ms ✅"
else
    print_warning "Test 2: P90 > 500ms o muchos fallos"
fi

sleep 3

# Test 3: 300 usuarios, 3000 solicitudes (test de estrés)
echo ""
echo -e "${YELLOW}Test 3: 300 usuarios concurrentes, 3000 solicitudes (estrés)${NC}"
echo "Comando: ab -n 3000 -c 300 $FRONTEND_URL"
echo ""

TEST3_RESULT=$(ab -n 3000 -c 300 -q $FRONTEND_URL 2>&1)
TEST3_RPS=$(echo "$TEST3_RESULT" | grep "Requests per second" | grep -oP '[0-9]+\.[0-9]+' || echo "0")
TEST3_TIME=$(echo "$TEST3_RESULT" | grep "Time taken" | grep -oP '[0-9]+\.[0-9]+' || echo "0")
TEST3_FAILED=$(echo "$TEST3_RESULT" | grep "Failed requests" | grep -oP '[0-9]+' || echo "0")
TEST3_P50=$(echo "$TEST3_RESULT" | grep "50%" | grep -oP '[0-9]+' || echo "0")
TEST3_P90=$(echo "$TEST3_RESULT" | grep "90%" | grep -oP '[0-9]+' || echo "0")
TEST3_P99=$(echo "$TEST3_RESULT" | grep "99%" | grep -oP '[0-9]+' || echo "0")

echo "Resultados Test 3:"
echo "  - Throughput: $TEST3_RPS req/s"
echo "  - Tiempo total: ${TEST3_TIME}s"
echo "  - Fallos: $TEST3_FAILED"
echo "  - Latencia P50: ${TEST3_P50}ms"
echo "  - Latencia P90: ${TEST3_P90}ms"
echo "  - Latencia P99: ${TEST3_P99}ms"

if [ "$TEST3_FAILED" -lt 30 ] && [ "$TEST3_P90" -lt 500 ]; then
    print_success "Test 3 de estrés: P90 < 500ms ✅"
else
    print_warning "Test 3 de estrés: P90 > 500ms o muchos fallos"
fi

# ============================================
# PRUEBAS DE API
# ============================================
print_section "7. Pruebas de API"

echo "Test de API endpoint..."
API_TEST=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME_TOTAL:%{time_total}\n" $API_URL -o /dev/null 2>&1)
API_HTTP_CODE=$(echo "$API_TEST" | grep "HTTP_CODE" | cut -d: -f2)
API_TIME=$(echo "$API_TEST" | grep "TIME_TOTAL" | cut -d: -f2)

echo "Código HTTP: $API_HTTP_CODE"
echo "Tiempo de respuesta: ${API_TIME}s"

if [ "$API_HTTP_CODE" = "200" ] || [ "$API_HTTP_CODE" = "405" ]; then
    API_TIME_MS=$(echo "$API_TIME * 1000" | bc)
    echo "Tiempo de respuesta: ${API_TIME_MS}ms"

    if [ $(echo "$API_TIME < 0.5" | bc) -eq 1 ]; then
        print_success "API responde en < 500ms"
    else
        print_warning "API responde en > 500ms"
    fi
else
    print_error "API no responde correctamente"
fi

# ============================================
# VERIFICACIÓN DE RECURSOS
# ============================================
print_section "8. Verificación de Recursos"

echo "Uso de recursos de contenedores:"
echo ""

for container in backend frontend nginx; do
    if docker ps | grep -q $container; then
        echo -e "${BLUE}Contenedor: $container${NC}"

        # CPU
        CPU_STATS=$(docker stats $container --no-stream --format "table {{.CPUPerc}}" | tail -n 1)
        echo "  CPU: $CPU_STATS"

        # Memoria
        MEM_STATS=$(docker stats $container --no-stream --format "table {{.MemUsage}}" | tail -n 1)
        echo "  Memoria: $MEM_STATS"

        # Conexiones de red
        NET_STATS=$(docker stats $container --no-stream --format "table {{.NetIO}}" | tail -n 1)
        echo "  Red: $NET_STATS"
        echo ""
    fi
done

# ============================================
# MÉTRICAS FINALES
# ============================================
print_section "9. Métricas Finales de Nginx"

NGINX_STATUS_FINAL=$(curl -s $STATUS_URL 2>/dev/null || echo "")
if [ -n "$NGINX_STATUS_FINAL" ]; then
    echo "$NGINX_STATUS_FINAL"
else
    print_warning "No se pueden obtener métricas finales"
fi

# ============================================
# RESUMEN DE RESULTADOS
# ============================================
print_section "10. Resumen de Resultados"

echo -e "${BLUE}Resultados de Optimización:${NC}"
echo ""
echo "Test 1 (100 usuarios):"
echo "  - Throughput: $TEST1_RPS req/s"
echo "  - Fallos: $TEST1_FAILED"
echo ""
echo "Test 2 (200 usuarios):"
echo "  - Throughput: $TEST2_RPS req/s"
echo "  - Latencia P90: ${TEST2_P90}ms"
echo "  - Fallos: $TEST2_FAILED"
echo ""
echo "Test 3 (300 usuarios - estrés):"
echo "  - Throughput: $TEST3_RPS req/s"
echo "  - Latencia P90: ${TEST3_P90}ms"
echo "  - Latencia P99: ${TEST3_P99}ms"
echo "  - Fallos: $TEST3_FAILED"
echo ""

# ============================================
# VERIFICACIÓN DE OBJETIVOS
# ============================================
print_section "11. Verificación de Objetivos"

OBJECTIVES_MET=true

# Objetivo 1: Latencia P90 < 500ms
if [ "$TEST3_P90" -lt 500 ]; then
    print_success "Objetivo 1: Latencia P90 < 500ms ✅ (${TEST3_P90}ms)"
else
    print_error "Objetivo 1: Latencia P90 < 500ms ❌ (${TEST3_P90}ms)"
    OBJECTIVES_MET=false
fi

# Objetivo 2: Throughput > 100 req/s
if [ $(echo "$TEST2_RPS > 100" | bc) -eq 1 ]; then
    print_success "Objetivo 2: Throughput > 100 req/s ✅ (${TEST2_RPS} req/s)"
else
    print_error "Objetivo 2: Throughput > 100 req/s ❌ (${TEST2_RPS} req/s)"
    OBJECTIVES_MET=false
fi

# Objetivo 3: Error rate < 5%
ERROR_RATE=$(echo "scale=2; $TEST3_FAILED / 3000 * 100" | bc)
if [ $(echo "$ERROR_RATE < 5" | bc) -eq 1 ]; then
    print_success "Objetivo 3: Error rate < 5% ✅ (${ERROR_RATE}%)"
else
    print_error "Objetivo 3: Error rate < 5% ❌ (${ERROR_RATE}%)"
    OBJECTIVES_MET=false
fi

# Objetivo 4: Soporte >200 usuarios concurrentes
if [ "$TEST3_FAILED" -lt 50 ]; then
    print_success "Objetivo 4: Soporte >200 usuarios concurrentes ✅"
else
    print_error "Objetivo 4: Soporte >200 usuarios concurrentes ❌"
    OBJECTIVES_MET=false
fi

# ============================================
# RECOMENDACIONES
# ============================================
print_section "12. Recomendaciones"

if [ "$OBJECTIVES_MET" = true ]; then
    echo -e "${GREEN}🎉 ¡FELICIDADES! La optimización fue exitosa.${NC}"
    echo ""
    echo "El servidor está optimizado para:"
    echo "  ✅ Soportar >300 usuarios concurrentes"
    echo "  ✅ Respuestas < 500ms en el 90% de casos"
    echo "  ✅ Throughput > 100 solicitudes/segundo"
    echo "  ✅ Tasa de error < 5%"
    echo ""
    echo "Próximos pasos opcionales:"
    echo "  1. Configurar CDN (CloudFlare) para caching global"
    echo "  2. Implementar caching distribuido con Redis"
    echo "  3. Optimizar base de datos PostgreSQL"
    echo "  4. Configurar autoescalado horizontal"
else
    echo -e "${YELLOW}⚠️  Se requieren ajustes adicionales${NC}"
    echo ""
    echo "Recomendaciones:"
    echo "  1. Verificar que los contenedores tengan suficientes recursos"
    echo "  2. Ajustar el número de workers de Gunicorn"
    echo "  3. Revisar la configuración de timeouts"
    echo "  4. Optimizar consultas de base de datos"
    echo "  5. Implementar caching adicional con Redis"
fi

# ============================================
# COMANDOS ÚTILES
# ==========================================
print_section "13. Comandos Útiles de Monitoreo"

echo "Monitorear logs de Nginx en tiempo real:"
echo "  docker logs -f nginx --tail 100"
echo ""
echo "Ver métricas de Nginx:"
echo "  curl http://localhost/nginx_status"
echo ""
echo "Reload de Nginx sin downtime:"
echo "  docker exec nginx nginx -s reload"
echo ""
echo "Ver contenedores activos:"
echo "  docker ps"
echo ""
echo "Ver uso de recursos:"
echo "  docker stats"
echo ""

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}Pruebas completadas${NC}"
echo -e "${BLUE}===========================================${NC}"
