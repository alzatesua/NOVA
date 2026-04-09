FROM nginx:alpine

# Instalar dependencias adicionales para optimización SSL y monitoreo
RUN apk add --no-cache \
    openssl \
    curl \
    bind-tools \
    netcat-openbsd \
    procps \
    bash

# Crear directorios necesarios para optimizaciones
RUN mkdir -p /var/cache/nginx \
    /var/log/nginx \
    /var/www/certbot \
    /etc/ssl/certs \
    /etc/ssl/private

# Configurar permisos
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx

# Copy frontend build from frontend image
COPY --from=nova-frontend:latest /usr/share/nginx/html /usr/share/nginx/html

# Copy nginx main config (replaces the default nginx.conf)
COPY nginx.conf /etc/nginx/nginx.conf

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost/nginx_status || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]