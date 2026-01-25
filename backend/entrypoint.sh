#!/bin/bash

# Wait for db
while ! nc -z db 5432; do
  echo "Waiting for PostgreSQL..."
  sleep 1
done

# Run migrations
python manage.py migrate

# Collect static
python manage.py collectstatic --noinput

# Start server
exec "$@"