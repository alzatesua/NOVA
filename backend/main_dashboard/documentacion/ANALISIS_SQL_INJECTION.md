# Análisis de Seguridad - SQL Injection en Login

**Fecha:** 2026-04-13
**Proyecto:** Nova E-commerce
**Analista:** Pruebas de Seguridad

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Endpoint Analizado](#endpoint-analizado)
3. [Metodología de Prueba](#metodología-de-prueba)
4. [Análisis del Código](#análisis-del-código)
5. [Vulnerabilidades Identificadas](#vulnerabilidades-identificadas)
6. [Recomendaciones](#recomendaciones)
7. [Cómo Ejecutar las Pruebas](#cómo-ejecutar-las-pruebas)

---

## 🎯 Resumen Ejecutivo

Se ha realizado un análisis exhaustivo del endpoint de login `/api/validar/` en búsqueda de vulnerabilidades de **SQL Injection**. El análisis incluye:

- ✅ Revisión del código fuente del backend
- ✅ Análisis de las consultas a la base de datos
- ✅ Identificación de vectores de ataque potenciales
- ✅ Creación de script automatizado de pruebas

**Estado Preliminar:** El código utiliza el **ORM de Django** que proporciona protección contra SQL injection en la mayoría de los casos, pero se requieren pruebas activas para confirmar.

---

## 🔍 Endpoint Analizado

### URL: `/api/validar/`
**Método:** `POST`

**Parámetros de entrada:**
```json
{
  "usuario": "string",      // Email o nombre de usuario
  "password": "string",     // Contraseña en texto plano
  "subdominio": "string"    // Subdominio de la tienda (opcional)
}
```

**Archivos relacionados:**
- Backend: [backend/login/views.py](backend/login/views.py)
- Serializer: [backend/login/serializers.py](backend/login/serializers.py)
- Frontend: [frontend/src/login/login.jsx](frontend/src/login/login.jsx)

---

## 🛠 Metodología de Prueba

### 1. Análisis Estático (Código Fuente)

Se revisaron los siguientes aspectos:

#### ✅ Protecciones Identificadas:

1. **Uso del ORM de Django**
   - `LoginUsuario.objects.using(alias).get(usuario=usuario)`
   - Django escapa automáticamente los parámetros

2. **Serializadores de Django REST Framework**
   - Validación de tipos de datos
   - Sanitización automática de entradas

3. **Funciones de autenticación seguras**
   - `check_password()` de Django
   - No hay concatenación de strings en consultas SQL

#### ⚠️ Puntos de Atención:

1. **Consulta con icontains (LIKE)**
   ```python
   # backend/login/views.py:28
   dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
   ```
   - Aunque el ORM escapa, `icontains` genera consultas LIKE
   - Requiere prueba activa para confirmar seguridad

2. **Registro de historial**
   ```python
   # backend/login/views.py:324-333
   HistorialLogin.objects.using(alias).create(
       usuario_correo=usuario if usuario else 'desconocido',
       ...
   )
   ```
   - El valor `usuario` se registra directamente
   - Si bien no es SQLi, podría ser un riesgo si se usa en otra consulta

### 2. Análisis Dinámico (Pruebas Activas)

Se ha creado el script `test_sqli_login.py` que prueba 8 tipos de SQL injection:

1. **Bypass básico de autenticación**
   - Payloads como `' OR '1'='1`
   - Intenta acceder sin credenciales válidas

2. **UNION SELECT**
   - Intenta extraer datos de otras tablas
   - Payloads como `' UNION SELECT NULL, NULL, NULL`

3. **Boolean-based blind SQLi**
   - Usa condiciones verdaderas/falsas
   - Verifica diferencias en respuestas

4. **Time-based blind SQLi**
   - Usa `PG_SLEEP()` para retrasar respuestas
   - Detecta vulnerabilidades sin cambios visibles

5. **Error-based SQLi**
   - Provoca errores de BD
   - Intenta extraer info de mensajes de error

6. **Stacked Queries**
   - Intenta ejecutar múltiples consultas
   - Payloads como `'; DROP TABLE--`

7. **Second-Order SQLi**
   - Inyección que se ejecuta en consultas posteriores
   - Por ejemplo, al registrar historial

8. **Subdomain injection**
   - Inyección en el parámetro `subdominio`
   - Usa operador LIKE en backend

---

## 📊 Análisis del Código

### Flujo de Autenticación:

```python
# backend/login/views.py:23-56
def autenticar_usuario(subdom, usuario, password):
    # 1. Buscar dominio
    dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()

    # 2. Buscar usuario
    user = LoginUsuario.objects.using(alias).get(usuario=usuario)

    # 3. Verificar contraseña
    if not check_password(password, user.password):
        raise ValueError("Contraseña incorrecta")

    return user
```

### Análisis de Seguridad por Capa:

| Capa | Método | ¿Seguro? | Notas |
|------|--------|----------|-------|
| **Frontend** | `fetch()` con JSON | ✅ | Los datos viajan en body, no en URL |
| **Serializer** | `LoginSerializer` | ✅ | Valida tipos y formato |
| **ORM Django** | `objects.get()` | ✅ | Escapa parámetros automáticamente |
| **Password Check** | `check_password()` | ✅ | Función segura de Django |
| **LIKE query** | `icontains` | ⚠️ | Requiere prueba activa |

---

## 🔓 Vulnerabilidades Identificadas

### Estado Actual: 🔍 **PENDIENTE DE CONFIRMACIÓN**

Las siguientes vulnerabilidades **PODRÍAN** existir según el análisis estático:

#### ⚠️ Posible SQL Injection en `icontains`

**Ubicación:** `backend/login/views.py:28`
```python
dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).first()
```

**Riesgo:**
- El parámetro `subdom` viene del usuario sin validación estricta
- `icontains` genera una consulta SQL LIKE
- Aunque Django escapa, hay casos edge reportados

**Prueba requerida:**
```bash
python test_sqli_login.py
```

#### ⚠️ Otros Endpoints con SQL Raw

Se identificaron otros endpoints que usan SQL raw:

**Ubicación:** `backend/main_dashboard/views.py:122-200`
```python
with connections[alias].cursor() as cursor:
    cursor.execute(f"SELECT * FROM {tabla} WHERE sucursal_id = %s", [sucursal_id])
```

**Protección:** ✅ El nombre de tabla está validado con regex:
```python
if not re.match(r'^[a-zA-Z0-9_]+$', tabla):
    return Response({'error': 'Nombre de tabla inválido'}, status=400)
```

---

## 🛡️ Recomendaciones

### 1. Implementar Validación Adicional de Entrada

**Para el parámetro `subdominio`:**
```python
import re

def validate_subdomain(subdom: str) -> bool:
    """Valida que el subdominio sea seguro"""
    if not subdom:
        return False

    # Solo permitir: letras, números, guiones
    pattern = r'^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    if not re.match(pattern, subdom.lower()):
        return False

    # Longitud máxima
    if len(subdom) > 63:
        return False

    # No permitir guiones consecutivos
    if '--' in subdom:
        return False

    return True

# Uso en login_view
if subdom and not validate_subdomain(subdom):
    return Response({'error': 'Subdominio inválido'}, status=400)
```

### 2. Usar `psycopg2.sql` para Queries Dinámicas

Para SQL raw, usar la librería `psycopg2.sql`:

```python
from psycopg2 import sql

# En lugar de:
cursor.execute(f"SELECT * FROM {tabla}")

# Usar:
query = sql.SQL("SELECT * FROM {}").format(
    sql.Identifier(tabla)
)
cursor.execute(query)
```

### 3. Implementar Rate Limiting

```python
from django.core.cache import cache
from django.http import HttpResponseForbidden

def check_rate_limit(request, max_attempts=5, window=300):
    """Limita intentos de login"""
    ip = request.META.get('REMOTE_ADDR')
    key = f'login_attempts_{ip}'

    attempts = cache.get(key, 0)
    if attempts >= max_attempts:
        return False

    cache.set(key, attempts + 1, window)
    return True
```

### 4. Log de Intentos Sospechosos

```python
import logging

logger = logging.getLogger('security')

def log_suspicious_attempt(request, reason):
    """Registra intentos sospechosos"""
    logger.warning(
        f"Suspicious login attempt - "
        f"IP: {request.META.get('REMOTE_ADDR')}, "
        f"User: {request.data.get('usuario')}, "
        f"Reason: {reason}"
    )
```

### 5. Sanitizar Input en Frontend

```javascript
// frontend/src/login/login.jsx
const sanitizeInput = (input) => {
  // Eliminar caracteres peligrosos
  return input.replace(/[;'"]/g, '');
};

const handleLogin = async (e) => {
  e.preventDefault();

  const sanitizedUser = sanitizeInput(correoUsuario);

  const response = await fetch(`${API_URL}/validar/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usuario: sanitizedUser,
      password: password
    })
  });
  // ...
};
```

---

## 🚀 Cómo Ejecutar las Pruebas

### Requisitos Previos:

1. **Servidor corriendo:**
   ```bash
   cd /home/dagi/nova/backend
   source env/bin/activate
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Instalar dependencias:**
   ```bash
   pip install requests
   ```

### Ejecutar Pruebas Automatizadas:

```bash
cd /home/dagi/nova/backend
python test_sqli_login.py
```

### Salida Esperada:

```
╔═══════════════════════════════════════════════════════════════════╗
║                     SQL INJECTION TESTER                          ║
║                    Para endpoint /api/validar/                     ║
╚═══════════════════════════════════════════════════════════════════╝

================================================================================
INICIANDO PRUEBAS DE SQL INJECTION EN /api/validar/
================================================================================

ℹ️  INFO: Iniciando pruebas de bypass básico
✅ SAFE: Bypass básico
ℹ️  INFO: Iniciando pruebas de UNION SELECT
...

================================================================================
REPORTE FINAL DE PRUEBAS DE SQL INJECTION
================================================================================

Total de pruebas realizadas: 8
Vulnerabilidades encontradas: 0
Pruebas seguras: 8

✅ NO SE DETECTARON VULNERABILIDADES DE SQL INJECTION
   El endpoint de login parece estar correctamente protegido.
================================================================================
```

### Pruebas Manuales con cURL:

```bash
# Prueba básica
curl -X POST http://localhost:8000/api/validar/ \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "admin'"'"' OR '"'"'1'"'"'='"'"'1",
    "password": "anything"
  }'

# Prueba con subdominio
curl -X POST http://localhost:8000/api/validar/ \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "admin",
    "password": "password",
    "subdominio": "nova'"'"' UNION SELECT * FROM login_usuario--"
  }'
```

---

## 📝 Conclusión

**El sistema parece estar bien protegido contra SQL Injection** gracias al uso del ORM de Django. Sin embargo, se recomienda:

1. ✅ **Ejecutar las pruebas automatizadas** para confirmar
2. ✅ **Implementar las validaciones adicionales** sugeridas
3. ✅ **Realizar auditorías periódicas** de seguridad
4. ✅ **Monitorear logs** de intentos sospechosos
5. ✅ **Mantener Django actualizado** con los últimos parches de seguridad

---

## 📚 Referencias

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [Django Security](https://docs.djangoproject.com/en/stable/topics/security/)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)

---

**Documento generado por:** Claude Code - Security Testing Suite
**Fecha:** 2026-04-13
