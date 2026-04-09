#!/bin/bash

# Script de Monitoreo de Rendimiento para Nginx Optimizado
# Recolecta métricas de latencia, throughput, errores y SSL

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables
FRONTEND_URL="https://nova.dagi.co"
API_URL="https://nova.dagi.co/api/"
LOG_FILE="/var/log/nginx-rendimiento.log"
ALERT_THRESHOLD_MS=500
ALERT_FILE="/tmp/nginx-rendimiento-alerts.log"

# Crear archivo de alertas
touch "$ALERT_FILE"

# ============================================
# FUNCIONES DE UTILIDAD
# ============================================

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_metric() {
    local label=$1
    local value=$2
    local status=$3

    if [ "$status" = "good" ]; then
        echo -e "${GREEN}✅ $label:${NC} $value"
    elif [ "$status" = "warning" ]; then
        echo -e "${YELLOW}⚠️  $label:${NC} $value"
    elif [ "$status" = "error" ]; then
        echo -e "${RED}❌ $label:${NC} $value"
    else
        echo -e "${CYAN}ℹ️  $label:${NC} $value"
    fi
}

log_alert() {
    local message="$1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ALERTA: $message" >> "$ALERT_FILE"
}

# ============================================
# MÉTRICAS DE NGINX
# ============================================

get_nginx_status() {
    print_header "Métricas de Nginx"

    local status=$(docker exec nova-nginx-1 wget -qO- http://localhost/nginx_status 2>/dev/null || echo "")

    if [ -z "$status" ]; then
        print_metric "Nginx Status" "No disponible" "error"
        return
    fi

    # Extraer métricas
    local active=$(echo "$status" | grep "Active connections" | awk '{print $3}')
    local accepts=$(echo "$status" | awk '/^[0-9]+/ {print $1}')
    local handled=$(echo "$status" | awk '/^[0-9]+/ {print $2}')
    local requests=$(echo "$status" | awk '/^[0-9]+/ {print $3}')
    local reading=$(echo "$status" | awk '/Reading:/ {print $2}')
    local writing=$(echo "$status" | awk '/Writing:/ {print $2}')
    local waiting=$(echo "$status" | awk '/Waiting:/ {print $2}')

    # Calcular métricas derivadas
    local req_per_sec=0
    if [ "$accepts" -gt 0 ]; then
        req_per_sec=$(echo "scale=2; $requests / $(docker exec nova-nginx-1 ps -o etimes= -p $(docker inspect nova-nginx-1 -f '{{.State.Pid}}') 2>/dev/null || echo 1)" | bc)
    fi

    echo -e "${CYAN}Conexiones:${NC}"
    print_metric "Active connections" "$active" "info"
    print_metric "Reading" "$reading" "info"
    print_metric "Writing" "$writing" "info"
    print_metric "Waiting" "$waiting" "info"

    echo ""
    echo -e "${CYAN}Solicitudes:${NC}"
    print_metric "Accepts" "$accepts" "info"
    print_metric "Handled" "$handled" "info"
    print_metric "Requests" "$requests" "info"
    print_metric "Req/sec" "$req_per_sec" "info"

    # Verificar alertas
    if [ "$active" -gt 500 ]; then
        print_metric "ALERTA" "Alto número de conexiones activas: $active" "warning"
        log_alert "Conexiones activas altas: $active"
    fi
}

# ============================================
# MÉTRICAS DE SSL/TLS
# ============================================

get_ssl_metrics() {
    print_header "Métricas SSL/TLS"

    # Obtener handshake SSL
    local ssl_start=$(date +%s%N)
    local ssl_check=$(openssl s_client -connect nova.dagi.co:443 -servername nova.dagi.co </dev/null 2>/dev/null | grep "Protocol\|Cipher" | head -2)
    local ssl_end=$(date +%s%N)
    local ssl_time=$(( ($ssl_end - $ssl_start) / 1000000 ))

    echo "$ssl_check"

    local protocol=$(echo "$ssl_check" | grep "Protocol" | awk '{print $2}')
    local cipher=$(echo "$ssl_check" | grep "Cipher" | awk '{print $3}')

    print_metric "SSL Handshake Time" "${ssl_time}ms" "info"
    print_metric "Protocol" "$protocol" "info"
    print_metric "Cipher" "$cipher" "info"

    # Verificar certificado
    local cert_check=$(echo | openssl s_client -connect nova.dagi.co:443 -servername nova.dagi.co 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    local cert_expiry=$(echo "$cert_check" | grep "notAfter" | cut -d= -f2)

    print_metric "Certificado expira" "$cert_expiry" "info"

    if [ "$ssl_time" -gt 500 ]; then
        print_metric "ALERTA" "SSL handshake lento: ${ssl_time}ms" "warning"
        log_alert "SSL handshake lento: ${ssl_time}ms"
    fi
}

# ============================================
# MÉTRICAS DE LATENCIA
# ============================================

get_latency_metrics() {
    print_header "Métricas de Latencia"

    # Test de latencia del frontend
    echo -e "${CYAN}Frontend:${NC}"
    for i in {1..5}; do
        local start=$(date +%s%N)
        local code=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
        local end=$(date +%s%N)
        local time=$(( ($end - $start) / 1000000 ))

        if [ "$code" = "200" ]; then
            status="good"
            [ "$time" -gt "$ALERT_THRESHOLD_MS" ] && status="warning"
            print_metric "Request $i" "${time}ms (HTTP $code)" "$status"
        else
            print_metric "Request $i" "HTTP $code - Error" "error"
        fi
    done

    echo ""
    echo -e "${CYAN}API:${NC}"

    # Test de latencia de la API
    for i in {1..5}; do
        local start=$(date +%s%N)
        local response=$(curl -s -o /dev/null -w "%{http_code}\n%{time_total}" "$API_URL")
        local code=$(echo "$response" | head -1)
        local total_time=$(echo "$response" | tail -1)
        local time_ms=$(echo "$total_time * 1000" | bc | cut -d. -f1)

        if [ "$code" = "200" ] || [ "$code" = "405" ]; then
            status="good"
            [ "$time_ms" -gt "$ALERT_THRESHOLD_MS" ] && status="warning"
            print_metric "Request $i" "${time_ms}ms (HTTP $code)" "$status"
        else
            print_metric "Request $i" "HTTP $code - Error" "error"
        fi
    done
}

# ============================================
# MÉTRICAS DE THROUGHPUT
# ============================================

get_throughput_metrics() {
    print_header "Métricas de Throughput"

    # Test de throughput con curl (múltiples solicitudes concurrentes)
    echo -e "${CYAN}Test de throughput (10 solicitudes concurrentes):${NC}"

    local start=$(date +%s%N)
    local pids=()

    for i in {1..10}; do
        (curl -s "$FRONTEND_URL" > /dev/null) &
        pids+=($!)
    done

    # Esperar a que terminen
    for pid in "${pids[@]}"; do
        wait $pid
    done

    local end=$(date +%s%N)
    local total_time=$(( ($end - $start) / 1000000 ))
    local req_per_sec=$(echo "scale=2; 10 / ($total_time / 1000)" | bc)

    print_metric "Tiempo total" "${total_time}ms" "info"
    print_metric "Throughput" "$req_per_sec req/s" "info"

    if [ "$total_time" -gt 2000 ]; then
        print_metric "ALERTA" "Throughput bajo: $req_per_sec req/s" "warning"
        log_alert "Throughput bajo: $req_per_sec req/s"
    fi
}

# ============================================
# MÉTRICAS DE ERRORES
# ============================================

get_error_metrics() {
    print_header "Métricas de Errores"

    # Verificar errores en logs de Nginx
    local error_count=$(docker exec nova-nginx-1 sh -c "grep -c 'error' /var/log/nginx/error.log 2>/dev/null || echo 0")

    print_metric "Errores en log" "$error_count" "info"

    # Verificar errores 5xx recientes
    local recent_5xx=$(docker exec nova-nginx-1 sh -c "tail -100 /var/log/nginx/access.log 2>/dev/null | grep -c ' 5[0-9][0-9] ' || echo 0")

    if [ "$recent_5xx" -gt 0 ]; then
        print_metric "Errores 5xx (últimas 100 líneas)" "$recent_5xx" "error"
        log_alert "Errores 5xx detectados: $recent_5xx"
    else
        print_metric "Errores 5xx (últimas 100 líneas)" "0" "good"
    fi

    # Verificar errores 4xx recientes
    local recent_4xx=$(docker exec nova-nginx-1 sh -c "tail -100 /var/log/nginx/access.log 2>/dev/null | grep -c ' 4[0-9][0-9] ' || echo 0")

    if [ "$recent_4xx" -gt 10 ]; then
        print_metric "Errores 4xx (últimas 100 líneas)" "$recent_4xx" "warning"
    else
        print_metric "Errores 4xx (últimas 100 líneas)" "$recent_4xx" "good"
    fi
}

# ============================================
# MÉTRICAS DEL SISTEMA
# ============================================

get_system_metrics() {
    print_header "Métricas del Sistema"

    # CPU y Memoria de contenedores
    echo -e "${CYAN}Uso de recursos:${NC}"

    for container in nova-backend-1 nova-nginx-1 nova-frontend-1 nova-db-1; do
        local stats=$(docker stats $container --no-stream --format "{{.CPUPerc}},{{.MemUsage}}" 2>/dev/null || echo "N/A")
        local cpu=$(echo "$stats" | cut -d, -f1)
        local mem=$(echo "$stats" | cut -d, -f2)

        print_metric "$container" "CPU: $cpu, Mem: $mem" "info"
    done

    echo ""
    echo -e "${CYAN}Límites del sistema:${NC}"

    local max_files=$(ulimit -n)
    print_metric "Max archivos abiertos" "$max_files" "info"

    local tcp_fin_timeout=$(sysctl -n net.ipv4.tcp_fin_timeout)
    print_metric "TCP FIN timeout" "$tcp_fin_timeout" "info"

    local somaxconn=$(sysctl -n net.core.somaxconn)
    print_metric "Somaxconn" "$somaxconn" "info"
}

# ============================================
# MÉTRICAS DE CACHE
# ============================================

get_cache_metrics() {
    print_header "Métricas de Cache"

    # Verificar effectiveness del cache
    local cache_hits=$(docker exec nova-nginx-1 sh -c "grep 'HIT' /var/log/nginx/access.log 2>/dev/null | tail -100 | wc -l")
    local cache_misses=$(docker exec nova-nginx-1 sh -c "grep 'MISS' /var/log/nginx/access.log 2>/dev/null | tail -100 | wc -l")
    local cache_total=$((cache_hits + cache_misses))

    if [ "$cache_total" -gt 0 ]; then
        local cache_hit_rate=$(echo "scale=2; ($cache_hits * 100) / $cache_total" | bc)
        print_metric "Cache hit rate (últimas 100)" "${cache_hit_rate}%" "info"

        if [ "$cache_hit_rate" -lt 50 ]; then
            print_metric "ALERTA" "Cache hit rate bajo: ${cache_hit_rate}%" "warning"
            log_alert "Cache hit rate bajo: ${cache_hit_rate}%"
        fi
    else
        print_metric "Cache hit rate" "Sin datos suficientes" "info"
    fi
}

# ============================================
# RESUMEN Y ALERTAS
# ============================================

print_summary() {
    print_header "Resumen de Monitoreo"

    echo -e "${CYAN}Alertas activas:${NC}"

    if [ -s "$ALERT_FILE" ]; then
        cat "$ALERT_FILE" | tail -10
    else
        print_metric "Estado" "Sin alertas" "good"
    fi

    echo ""
    echo -e "${CYAN}Registro de alertas:${NC} $ALERT_FILE"
    echo -e "${CYAN}Timestamp:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
}

# ============================================
# FUNCIÓN PRINCIPAL
# ============================================

main() {
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${BLUE}Monitor de Rendimiento Nginx - Nova${NC}"
    echo -e "${BLUE}===========================================${NC}"

    get_nginx_status
    get_ssl_metrics
    get_latency_metrics
    get_throughput_metrics
    get_error_metrics
    get_cache_metrics
    get_system_metrics
    print_summary

    echo ""
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${BLUE}Monitoreo completado${NC}"
    echo -e "${BLUE}===========================================${NC}"
    echo ""
}

# Ejecutar monitoreo
main
