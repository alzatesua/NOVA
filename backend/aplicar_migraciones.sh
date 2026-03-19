#!/bin/bash
# Script para aplicar la migración del campo soporte_pago a la tabla abonos

echo "🔄 Aplicando migraciones de Django..."
cd /home/dagi/nova/backend

# Aplicar migraciones
python manage.py migrate

echo "✅ Migraciones aplicadas exitosamente"
echo "📁 El campo 'soporte_pago' ha sido agregado a la tabla facturacion_abono"
