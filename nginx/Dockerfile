FROM nginx:alpine

# Copy frontend build from frontend image
COPY --from=nova-frontend:latest /usr/share/nginx/html /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]