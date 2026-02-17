# Guía de Datos de Prueba y Verificación de Conexión

Esta guía te ayuda a crear datos de prueba y verificar la conexión multi-tenant entre el frontend y backend.

## 📋 Contenido

1. [Crear Datos de Prueba](#crear-datos-de-prueba)
2. [Verificar Conexión](#verificar-conexión)
3. [Probar la API Manualmente](#probar-la-api-manualmente)
4. [Troubleshooting](#troubleshooting)

---

## 1. Crear Datos de Prueba

### Método 1: Script de Shell (Recomendado)

```bash
cd /home/dagi/nova/backend

# Usar valores por defecto (subdominio: mi-tienda, 10 productos)
./crear_datos_prueba.sh

# Especificar subdominio
./crear_datos_prueba.sh mi-tienda-deportiva

# Especificar subdominio y cantidad de productos
./crear_datos_prueba.sh mi-tienda-electronica 25
```

**Output esperado**:
```
🚀 Script para crear datos de prueba
Subdominio: mi-tienda-deportiva
Cantidad de productos: 25

Activando entorno virtual...
Ejecutando comando de Django...
🚀 Iniciando creación de datos de prueba...
✅ Tienda creada: Tienda mi-tienda-deportiva
   - DB Nombre: mi-tienda-deportiva-abc123
   - DB Usuario: 9001234567_def456
✅ Dominio creado: mi-tienda-deportiva
📦 Creando 25 productos en la BD de la tienda...
   ✓ 5/25 productos creados...
   ✓ 10/25 productos creados...
   ✓ 15/25 productos creados...
   ✓ 20/25 productos creados...
   ✓ 25/25 productos creados...

✅ 25/25 productos creados exitosamente!

✅ Datos de prueba creados exitosamente!
Subdominio: mi-tienda-deportiva
URL de prueba: https://mi-tienda-deportiva.dagi.co/
```

### Método 2: Comando de Django Directo

```bash
cd /home/dagi/nova/backend

# Activar entorno virtual
source env/bin/activate

# Crear con valores por defecto
python manage.py crear_datos_prueba

# Crear con opciones específicas
python manage.py crear_datos_prueba \
    --subdominio mi-tienda \
    --cantidad 20

# Crear solo tienda y dominio (sin productos)
python manage.py crear_datos_prueba \
    --subdominio mi-tienda \
    --skip-productos
```

### Opciones Disponibles

| Opción | Descripción | Por Defecto |
|--------|-------------|-------------|
| `--subdominio` | Subdominio a crear | `mi-tienda` |
| `--cantidad` | Cantidad de productos a crear | `10` |
| `--skip-productos` | No crear productos en la BD | `False` |

### Qué Crea el Comando

El comando crea automáticamente:

1. **Tienda** (si no existe):
   - Dirección en Bogotá, Colombia
   - NIT: 900123456-7
   - Usuario admin de prueba
   - Base de datos autogenerada

2. **Dominio**:
   - Subdominio especificado
   - Marcado como principal

3. **Productos** en la BD de la tienda:
   - Categorías (Movilidad Eléctrica, Scooters, Bicicletas, etc.)
   - Marcas (EcoMotion, EcoRide, UrbanGlide, etc.)
   - IVA: 19%
   - Descuento: 10% (cada 2 productos)
   - Tipo de medida: Unidad
   - Stock incremental
   - SKU único
   - Código de barras

---

## 2. Verificar Conexión

### Método 1: Script de Shell (Recomendado)

```bash
cd /home/dagi/nova/backend

# Verificar todos los dominios
./verificar_conexion.sh

# Verificar un subdominio específico
./verificar_conexion.sh mi-tienda

# Verificar y probar conexión a BD
./verificar_conexion.sh mi-tienda --test-connection
```

**Output esperado**:
```
🔍 Script para verificar conexión multi-tenant
Subdominio: mi-tienda
Modo: Probar conexión a BD

Activando entorno virtual...
Ejecutando verificación...

======================================================================
🔍 VERIFICACIÓN DE CONEXIÓN MULTI-TENANT
======================================================================

📋 TABLA DOMINIOS (BD default)
----------------------------------------------------------------------
Subdominio: mi-tienda
 Tienda: Tienda mi-tienda
 DB Nombre: mi-tienda-abc123
 DB Usuario: 9001234567_abc123
 Principal: Sí
 Creado: 2025-01-15 10:30
----------------------------------------------------------------------

🔍 VERIFICANDO SUBDOMINIO: mi-tienda
----------------------------------------------------------------------
✅ Subdominio encontrado
Detalles de la tienda:
  ID: 1
  Nombre: Tienda mi-tienda
  NIT: 900123456-7
  Slug: mi-tienda-def456
  Activa: Sí

🔌 PROBANDO CONEXIÓN A LA BD
----------------------------------------------------------------------
✅ BD configurada: 1
  NAME: mi-tienda-abc123
  USER: 9001234567_abc123
  HOST: localhost
  PORT: 5432
✅ Tabla "productos" existe
 Total de productos: 10

📦 Primeros 3 productos:
 ID: 1
 SKU: TEST-MI-TIENDA-001
 Nombre: Producto Prueba 1 - mi-tienda
 Precio: $99.99
 Stock: 10
----------------------------------------
 ID: 2
 SKU: TEST-MI-TIENDA-002
 Nombre: Producto Prueba 2 - mi-tienda
 Precio: $199.98
 Stock: 20
----------------------------------------
 ID: 3
 SKU: TEST-MI-TIENDA-003
 Nombre: Producto Prueba 3 - mi-tienda
 Precio: $299.97
 Stock: 30
----------------------------------------

======================================================================
🌐 URLs DE PRUEBA
======================================================================

Subdominio: mi-tienda
 URL: https://mi-tienda.dagi.co/
 API: curl -X POST https://dagi.co/api/productos/list/ \
       -H "Content-Type: application/json" \
       -d '{"subdominio": "mi-tienda"}'

======================================================================
```

### Método 2: Comando de Django Directo

```bash
cd /home/dagi/nova/backend

source env/bin/activate

# Verificar todos los dominios
python manage.py verificar_conexion

# Verificar subdominio específico
python manage.py verificar_conexion --subdominio mi-tienda

# Verificar y probar conexión
python manage.py verificar_conexion \
    --subdominio mi-tienda \
    --test-connection
```

### Opciones Disponibles

| Opción | Descripción |
|--------|-------------|
| `--subdominio` | Verificar un subdominio específico |
| `--test-connection` | Probar conexión a la BD de la tienda |

---

## 3. Probar la API Manualmente

### Método 1: Curl (Desde Terminal)

```bash
# Petición básica
curl -X POST https://dagi.co/api/productos/list/ \
  -H "Content-Type: application/json" \
  -d '{"subdominio": "mi-tienda"}'

# Con formato de respuesta legible
curl -X POST https://dagi.co/api/productos/list/ \
  -H "Content-Type: application/json" \
  -d '{"subdominio": "mi-tienda"}' | jq

# Guardar respuesta en archivo
curl -X POST https://dagi.co/api/productos/list/ \
  -H "Content-Type: application/json" \
  -d '{"subdominio": "mi-tienda"}' \
  -o response.json

# Verificar contenido
cat response.json | jq '.data | length'  # Cantidad de productos
cat response.json | jq '.data[0]'      # Primer producto
```

### Método 2: Navegador Web (Console JavaScript)

1. Abrir https://dagi.co/
2. Abrir DevTools (F12)
3. Ir a la pestaña Console
4. Ejecutar:

```javascript
// Petición a la API
fetch('https://dagi.co/api/productos/list/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subdominio: 'mi-tienda'
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ Respuesta:', data);
  console.log('Total productos:', data.total_productos);
  console.log('Primer producto:', data.data[0]);
})
.catch(error => {
  console.error('❌ Error:', error);
});
```

### Método 3: Python (Script de Prueba)

Crear archivo `test_api.py`:

```python
#!/usr/bin/env python3
import requests
import json

URL = "https://dagi.co/api/productos/list/"
SUBDOMINIO = "mi-tienda"

response = requests.post(
    URL,
    headers={"Content-Type": "application/json"},
    json={"subdominio": SUBDOMINIO}
)

if response.status_code == 200:
    data = response.json()
    print(f"✅ Éxito!")
    print(f"Total productos: {data['total_productos']}")
    print(f"Mensaje: {data['mensaje']}")
    print(f"\nPrimeros 3 productos:")
    for i, prod in enumerate(data['data'][:3], 1):
        print(f"{i}. {prod['nombre']} - ${prod['precio']}")
else:
    print(f"❌ Error: {response.status_code}")
    print(f"Detalle: {response.text}")
```

Ejecutar:
```bash
python test_api.py
```

---

## 4. Troubleshooting

### Problema: "command not found: manage.py"

**Causa**: No estás en el directorio correcto del proyecto Django.

**Solución**:
```bash
cd /home/dagi/nova/backend
ls manage.py  # Debería existir
```

### Problema: "No module named 'django'"

**Causa**: Entorno virtual no activado.

**Solución**:
```bash
cd /home/dagi/nova/backend
source env/bin/activate  # Linux/Mac
# o
env\Scripts\activate  # Windows
```

### Problema: "Subdominio no encontrado"

**Causa**: El subdominio no existe en la tabla `dominios`.

**Solución**:
```bash
# Crear datos de prueba para ese subdominio
./crear_datos_prueba.sh mi-tienda-nuevo

# O verificar qué subdominios existen
./verificar_conexion.sh
```

### Problema: "Error al conectar a la base de datos"

**Causa**: La BD de la tienda no existe o las credenciales son incorrectas.

**Solución**:
```bash
# 1. Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# 2. Verificar que la BD exista
psql -U postgres -l | grep tienda

# 3. Verificar credenciales en la BD default
python manage.py shell
>>> from nova.models import Tiendas
>>> t = Tiendas.objects.first()
>>> print(f"DB: {t.db_nombre}")
>>> print(f"User: {t.db_usuario}")
>>> print(f"Pass: {t.db_password}")

# 4. Conectarse manualmente
psql -h localhost -U t.db_usuario -d t.db_nombre
```

### Problema: "Tabla 'productos' no existe"

**Causa**: No se han ejecutado las migraciones en la BD de la tienda.

**Solución**:
```bash
# Ejecutar migraciones para la BD específica
python manage.py migrate --database=1  # Usar el ID de la tienda

# O para todas las BDs
python manage.py migrate --database=default
python manage.py migrate --database=2
# ... etc
```

### Problema: La API retorna productos vacíos

**Causa**: La tabla `productos` en la BD de la tienda está vacía.

**Solución**:
```bash
# Crear productos de prueba
./crear_datos_prueba.sh mi-tienda 20

# O agregar manualmente en Python shell
python manage.py shell
>>> from main_dashboard.models import Producto
>>> from nova.models import Tiendas
>>> tienda = Tiendas.objects.first()
>>> alias = str(tienda.id)
>>>
>>> # Crear un producto
>>> Producto.objects.using(alias).create(
...     sku='TEST-001',
...     nombre='Producto Manual',
...     descripcion='Creado manualmente',
...     precio=99.99,
...     stock=10
... )
```

### Problema: Error CORS en el navegador

**Causa**: El servidor Django no tiene CORS configurado para el dominio del frontend.

**Solución**:
```python
# En settings.py
INSTALLED_APPS = [
    ...
    'corsheaders',
    ...
]

CORS_ALLOWED_ORIGINS = [
    "https://dagi.co",
    "http://localhost:3000",
]

CORS_ALLOW_CREDENTIALS = True

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    ...
]
```

### Problema: "SubdomainMixin no encontrado"

**Causa**: La vista no está importando el mixin correctamente o el archivo no existe.

**Solución**:
```bash
# Verificar que el archivo exista
ls -la main_dashboard/views_productosEcomerce.py

# Verificar importación
head -20 main_dashboard/views_productosEcomerce.py

# Debe tener:
# from nova.models import Dominios
# from nova.utils.db import conectar_db_tienda
```

---

## Flujos de Trabajo Comunes

### Flujo 1: Configuración Inicial

```bash
# 1. Ir al directorio del backend
cd /home/dagi/nova/backend

# 2. Activar entorno virtual
source env/bin/activate

# 3. Crear datos de prueba (tienda + dominio + productos)
./crear_datos_prueba.sh mi-tienda 15

# 4. Verificar que todo esté correcto
./verificar_conexion.sh mi-tienda --test-connection

# 5. Probar la API con curl
curl -X POST https://dagi.co/api/productos/list/ \
  -H "Content-Type: application/json" \
  -d '{"subdominio": "mi-tienda"}'
```

### Flujo 2: Agregar Nueva Tienda

```bash
# 1. Crear nueva tienda con productos
./crear_datos_prueba.sh otra-tienda 20

# 2. Verificar que se creó correctamente
./verificar_conexion.sh otra-tienda --test-connection

# 3. Actualizar /etc/hosts (solo desarrollo local)
echo "127.0.0.1 otra-tienda.dagi.co" | sudo tee -a /etc/hosts

# 4. Probar en navegador
# Abrir https://otra-tienda.dagi.co/
# Debería mostrar los productos de esa tienda
```

### Flujo 3: Debug de Problemas

```bash
# 1. Verificar estado de todas las tiendas
./verificar_conexion.sh

# 2. Identificar el subdominio problemático
./verificar_conexion.sh subdominio-problema

# 3. Probar conexión a su BD
./verificar_conexion.sh subdominio-problema --test-connection

# 4. Si la BD no tiene tabla productos
python manage.py migrate --database=<id_tienda>

# 5. Si la BD está vacía
./crear_datos_prueba.sh subdominio-problema 15
```

---

## Archivos Creados

### Scripts de Shell
- **[backend/crear_datos_prueba.sh](backend/crear_datos_prueba.sh)** - Script para crear datos de prueba
- **[backend/verificar_conexion.sh](backend/verificar_conexion.sh)** - Script para verificar conexiones

### Management Commands
- **[backend/main_dashboard/management/commands/crear_datos_prueba.py](backend/main_dashboard/management/commands/crear_datos_prueba.py)** - Comando Django para crear datos
- **[backend/main_dashboard/management/commands/verificar_conexion.py](backend/main_dashboard/management/commands/verificar_conexion.py)** - Comando Django para verificar conexión

### Documentación
- **[backend/main_dashboard/GUIA_DATOS_PRUEBA.md](backend/main_dashboard/GUIA_DATOS_PRUEBA.md)** - Esta guía

---

## Resumen Rápido

```bash
# Crear datos de prueba
cd /home/dagi/nova/backend
./crear_datos_prueba.sh mi-tienda 10

# Verificar todo
./verificar_conexion.sh mi-tienda --test-connection

# Probar API
curl -X POST https://dagi.co/api/productos/list/ \
  -H "Content-Type: application/json" \
  -d '{"subdominio": "mi-tienda"}' | jq
```

¡Listo! Tienes datos de prueba y herramientas para verificar que todo funcione correctamente.
