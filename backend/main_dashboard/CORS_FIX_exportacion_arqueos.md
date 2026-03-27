# Solución al Error CORS en Exportación de Arqueos

## Problema Identificado

Al implementar los endpoints de exportación, se encontró el siguiente error:

```
Access to fetch at 'https://dagi.co/caja/historial_arqueos/export/excel/'
from origin 'https://dagi-4a4487.dagi.co' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Causa Raíz

Los nuevos endpoints de exportación retornan archivos binarios (Excel/PDF) y necesitaban:

1. **Headers CORS adicionales:** `accept`, `content-disposition`, `x-requested-with`
2. **Exponer headers:** `content-disposition`, `content-type` (para que el frontend pueda leer el nombre del archivo)
3. **Exención de CSRF:** Las descargas de archivos no requieren protección CSRF

## Solución Aplicada

### 1. Configuración CORS Adicional

**Archivo:** `/home/dagi/nova/backend/nova/settings/base.py`

Se agregó al final del archivo:

```python
# ✅ Configuración adicional para endpoints de exportación (archivos binarios)
# Headers adicionales necesarios para CORS con archivos binarios
CORS_ALLOW_HEADERS += [
    'accept',
    'content-disposition',
    'x-requested-with',
]

# Exponer headers necesarios para que el frontend pueda leer Content-Disposition
CORS_EXPOSE_HEADERS = [
    'content-disposition',
    'content-type',
]
```

### 2. Exención de CSRF

**Archivo:** `/home/dagi/nova/backend/main_dashboard/views_caja.py`

Se agregó el decorador `@csrf_exempt` a ambos endpoints:

```python
from django.views.decorators.csrf import csrf_exempt

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt  # ✅ Eximir de CSRF para descargas de archivos
def exportar_historial_arqueos_excel(request):
    # ... código del endpoint

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt  # ✅ Eximir de CSRF para descargas de archivos
def exportar_historial_arqueos_pdf(request):
    # ... código del endpoint
```

## Por qué Estas Soluciones

### Headers CORS Adicionales

- **`accept`**: El navegador envía este header en el preflight OPTIONS para indicar qué tipo de respuesta acepta
- **`content-disposition`**: Necesario para descargar el archivo con el nombre correcto
- **`x-requested-with`**: Indica que es una petición AJAX

### CORS_EXPOSE_HEADERS

Por defecto, los navegadores solo pueden exponer ciertos headers "simples" (safe-listed). Headers como `content-disposition` no están en esa lista, así que debemos exponerlos explícitamente.

### @csrf_exempt

Las descargas de archivos no requieren tokens CSRF porque:
1. No son peticiones que modifican estado
2. El archivo se genera dinámicamente en el servidor
3. El token ya se valida en el cuerpo de la petición (usuario, token)

## Recarga del Servidor

Después de aplicar estos cambios, se recargó el servidor gunicorn:

```bash
kill -HUP <PID>
```

O reiniciado completamente:

```bash
sudo systemctl reload gunicorn
# o
sudo service gunicorn restart
```

## Verificación

Para verificar que todo funciona:

1. **Verificar que los endpoints responden:**
```bash
curl -X POST https://dagi.co/api/caja/historial_arqueos/export/excel/ \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","token":"...","subdominio":"...","modo_exportacion":true}' \
  -I
```

2. **Verificar headers CORS en la respuesta:**
```bash
curl -X OPTIONS https://dagi.co/api/caja/historial_arqueos/export/excel/ \
  -H "Origin: https://dagi-4a4487.dagi.co" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type, authorization" \
  -v
```

Debería ver:
```
Access-Control-Allow-Origin: https://dagi-4a4487.dagi.co
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: content-disposition, content-type
```

## Resultado Esperado

✅ El preflight OPTIONS debería pasar exitosamente
✅ Las exportaciones a Excel y PDF deberían funcionar
✅ Los archivos se descargarán con los nombres correctos
✅ No más errores de CORS

---

**Archivos Modificados:**
- `/home/dagi/nova/backend/nova/settings/base.py` - Configuración CORS
- `/home/dagi/nova/backend/main_dashboard/views_caja.py` - Decoradores csrf_exempt

**Fecha de Solución:** 2026-03-27
**Versión:** 1.0
