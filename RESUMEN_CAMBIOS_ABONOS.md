# Resumen de Cambios - Sistema de Abonos con Soporte de Pago

## 🎯 Objetivo
Solucionar dos bugs en la gestión de mora:
1. **Evitar pagos mayores a la deuda**: Validar que no se pueda pagar más de lo que debe el cliente
2. **Subir soporte de pago**: Permitir adjuntar comprobantes para pagos digitales (transferencia, nequi, tarjeta)

---

## ✅ Cambios Implementados

### 1. Frontend ([`frontend/src/components/MoraView.jsx`](frontend/src/components/MoraView.jsx))

#### Validación de monto máximo
- **Línea 140-154**: Validación que compara el monto del abono contra la deuda total
- **Línea 665-681**: Panel informativo que muestra la deuda actual en el modal
- El input del monto ahora tiene `max` con el valor de la deuda
- Muestra el monto máximo permitido

#### Subida de soporte de pago
- **Línea 40**: Campo `soporte_pago` agregado al estado del formulario
- **Línea 706-740**: Campo para subir archivo que:
  - Aparece solo para métodos digitales (transferencia, nequi, tarjeta, otro)
  - Acepta imágenes (JPG, PNG) y PDF
  - Valida tamaño máximo de 5MB
  - Es obligatorio para métodos digitales

---

### 2. Backend

#### Modelo ([`backend/main_dashboard/models.py`](backend/main_dashboard/models.py))

**Líneas 728-760**: Actualizado el modelo `Abono`
- Agregada función `upload_soporte_abono()` para generar rutas únicas
- Campo `soporte_pago` tipo `FileField` con upload a `abonos/soportes/{cliente_id}/{uuid}`

#### Vista ([`backend/main_dashboard/views_abonos.py`](backend/main_dashboard/views_abonos.py))

**Líneas 1-11**: Importaciones actualizadas
- `MultiPartParser`, `FormParser` para manejar archivos
- `settings` de Django

**Líneas 101-180**: Función `crear_abono` actualizada
- Acepta `POST` y `PUT` con parsers para archivos
- **Validación de deuda**: Calcula la deuda total y compara con el monto
- **Validación de soporte**: Requiere archivo para métodos digitales
- **Validación de tamaño**: Máximo 5MB para archivos
- Procesa y guarda el archivo de soporte

**Líneas 74-83, 256-263**: Actualizados endpoints de listado
- Incluyen `soporte_pago` con la URL del archivo en las respuestas

#### API Frontend ([`frontend/src/services/api.js`](frontend/src/services/api.js))

**Líneas 703-741**: Nueva función `uploadFile`
- Maneja FormData para subir archivos
- Mantiene compatibilidad con el sistema de tokens

**Líneas 1536-1565**: Función `crearAbono` actualizada
- Usa FormData cuando hay archivo de soporte
- Usa JSON normal cuando no hay archivo

---

### 3. Base de Datos

#### Migración ([`backend/main_dashboard/migrations/0018_abono_soporte_pago.py`](backend/main_dashboard/migrations/0018_abono_soporte_pago.py))

- Nueva migración para agregar el campo `soporte_pago` a la tabla `facturacion_abono`
- Campo `FileField` nullable (puede estar vacío para pagos en efectivo)

---

### 4. Infraestructura

- **Directorio creado**: `/home/dagi/nova/backend/media/abonos/soportes/`
- **Configuración MEDIA**: Ya existente en [`backend/nova/settings.py`](backend/nova/settings.py:309-312)
- **URLs multimedia**: Configuradas en [`backend/nova/urls.py`](backend/nova/urls.py:50-51)

---

## 🚀 Pasos para Deploy

### 1. Aplicar migraciones
```bash
cd /home/dagi/nova/backend
./aplicar_migraciones.sh
# O manualmente:
python manage.py migrate
```

### 2. Verificar permisos del directorio media
```bash
chmod -R 755 /home/dagi/nova/backend/media/
```

### 3. Reiniciar el servidor backend
```bash
# Dependiendo de tu setup:
systemctl restart nova-backend
# o
supervisorctl restart nova
# o
gunicorn --reload
```

### 4. Reconstruir el frontend (si estás en producción)
```bash
cd /home/dagi/nova/frontend
npm run build
```

---

## 📝 Notas Importantes

1. **Compatibilidad**: Los cambios son backwards compatible. Abonos existentes sin soporte siguen funcionando.

2. **Métodos digitales requieren soporte**: Transferencia, Nequi, Tarjeta y "Otro" ahora requieren obligatoriamente un archivo de soporte.

3. **Efectivo no requiere soporte**: Los pagos en efectivo siguen funcionando como antes.

4. **Validación de deuda**: El sistema ahora previene pagos mayores a la deuda total del cliente.

5. **Almacenamiento**: Los archivos se guardan con UUID único para evitar colisiones de nombres.

6. **Multi-tenant**: Cada tienda tiene su propio directorio de soportes basado en el `cliente_id`.

---

## 🧪 Testing

### Casos a probar:

1. ✅ Pago en efectivo (sin soporte)
2. ✅ Pago con transferencia (con soporte JPG/PNG)
3. ✅ Pago con transferencia (con soporte PDF)
4. ✅ Intento de pago sin soporte en método digital → Debe dar error
5. ✅ Intento de pago mayor a la deuda → Debe dar error
6. ✅ Pago exacto de la deuda total → Debe funcionar
7. ✅ Archivo mayor a 5MB → Debe dar error
8. ✅ Ver el soporte en el historial de abonos

---

## 🔧 Troubleshooting

### Error "El campo soporte_pago es obligatorio"
- **Causa**: Método de pago digital sin archivo adjunto
- **Solución**: Adjuntar un archivo de soporte

### Error "El monto del abono no puede superar la deuda total"
- **Causa**: Monto ingresado mayor a la deuda del cliente
- **Solución**: Ingresar un monto menor o igual a la deuda

### Archivos no se suben
- **Causa**: Permisos del directorio media
- **Solución**: `chmod -R 755 /home/dagi/nova/backend/media/`

### Archivos no se muestran
- **Causa**: Configuración de MEDIA_URL/MEDIA_ROOT
- **Solución**: Verificar settings.py y urls.py

---

## 📅 Fecha de implementación
2026-03-19

---

## 👤 Autor
Claude Code Assistant
