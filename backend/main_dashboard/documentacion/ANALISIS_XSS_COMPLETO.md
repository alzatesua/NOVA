# 🛡️ ANÁLISIS Y PROTECCIÓN XSS - NOVA E-COMMERCE

**Fecha:** 2026-04-13
**Proyecto:** Nova E-commerce
**Tipo:** Cross-Site Scripting (XSS) Prevention
**Severidad:** 🔴 **ALTA**

---

## 📊 RESUMEN EJECUTIVO

### Estado Actual: ⚠️ **VULNERABLE A XSS**

Se han identificado **múltiples vectores de ataque XSS** en el sistema que permiten inyección de código JavaScript malicioso. Aunque React proporciona protección por defecto, hay endpoints backend que aceptan y retornan contenido sin sanitización adecuada.

### Vectores de Ataque Identificados:

1. ✅ **Stored XSS** en campos de texto (nombre, dirección, descripción)
2. ✅ **Reflected XSS** en endpoints de búsqueda
3. ⚠️ **DOM-based XSS** potencial en componentes React
4. ✅ **XSS en metadatos** de productos y categorías

---

## 🎯 VECTORES DE ATAQUE IDENTIFICADOS

### 1. STORED XSS - Campos de Producto/Categoría

**Ubicación:** [backend/main_dashboard/models.py](backend/main_dashboard/models.py)

**Modelos Vulnerables:**

```python
# ❌ VULNERABLE - Stored XSS
class Categoria(models.Model):
    nombre = models.CharField(max_length=100)  # ⚠️ Acepta <script>
    descripcion = models.TextField()  # ⚠️ Acepta HTML/JS

class Producto(models.Model):
    nombre = models.CharField(max_length=255)  # ⚠️ Acepta <script>
    descripcion = models.TextField()  # ⚠️ Acepta HTML/JS

class Cliente(models.Model):
    razon_social = models.CharField(max_length=255)  # ⚠️ Acepta <script>
    direccion = models.TextField()  # ⚠️ Acepta HTML/JS
```

**Payload de Ataque:**
```json
POST /api/productos-tienda/
{
  "nombre": "<script>alert('XSS')</script>",
  "descripcion": "<img src=x onerror=alert('XSS')>",
  "precio": 100.00
}
```

**Impacto:**
- El script se ejecuta cada vez que se renderiza el producto
- Puede robar cookies de sesión
- Puede redirigir a sitios de phishing
- Puede realizar acciones en nombre del usuario

---

### 2. REFLECTED XSS - Endpoints de Búsqueda

**Ubicación:** Varios endpoints con parámetros de búsqueda

**Ejemplo de ataque:**
```bash
# Búsqueda maliciosa
GET /api/productos/list/?search=<script>alert('XSS')</script>

# El servidor retorna el input sin escapar
{
  "results": "Búsqueda: <script>alert('XSS')</script> no arrojó resultados"
}
```

---

### 3. XSS EN SERIALIZADORES

**Ubicación:** [backend/main_dashboard/serializers.py](backend/main_dashboard/serializers.py)

**Serializadores Vulnerables:**
```python
# ❌ VULNERABLE - No sanitiza salida
class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion',  # ⚠️ Campos sin sanitizar
            'precio', 'stock'
        ]
```

---

## 🔍 ANÁLISIS DEL FRONTEND (REACT)

### ✅ Buenas Noticias:

1. **No se encontró `dangerouslySetInnerHTML`** en el código
2. **No se encontró `v-html`** (Vue.js no se usa)
3. **React escapa por defecto** el contenido en JSX

### ⚠️ Áreas de Riesgo:

**Componentes que renderizan contenido dinámico:**

```jsx
// src/components/ClientesView.jsx
<div>{cliente.razon_social}</div>  // ⚠️ Potencial XSS si no está escapado

// src/components/facturacion/FacturaForm.jsx
<input value={producto.nombre} />  // ✅ Escapado por React
```

---

## 🛠️ ESTRATEGIA DE PROTECCIÓN XSS

### Capa 1: Validación de Entrada (Backend)

#### Opción A: Usar Bleach (Recomendado)

```python
# requirements.txt
bleach==6.1.0

# backend/main_dashboard/validators.py
import bleach
from rest_framework import serializers
from django.core.exceptions import ValidationError

class XSSProtectionValidator:
    """
    Validador que sanitiza input para prevenir XSS
    """

    # Etiquetas HTML permitidas (ninguna por defecto para máxima seguridad)
    ALLOWED_TAGS = []

    # Atributos permitidos
    ALLOWED_ATTRIBUTES = {}

    # Protocolos permitidos
    ALLOWED_PROTOCOLS = ['http', 'https']

    @classmethod
    def sanitize_string(cls, value):
        """Sanitiza string removiendo HTML/JS malicioso"""
        if not isinstance(value, str):
            return value

        # Remover todas las etiquetas HTML
        clean_value = bleach.clean(
            value,
            tags=cls.ALLOWED_TAGS,
            attributes=cls.ALLOWED_ATTRIBUTES,
            protocols=cls.ALLOWED_PROTOCOLS,
            strip=True  # Remover tags en lugar de escapar
        )

        return clean_value

    @classmethod
    def sanitize_dict(cls, data_dict, fields_to_sanitize):
        """Sanitiza campos específicos de un diccionario"""
        cleaned_data = data_dict.copy()

        for field in fields_to_sanitize:
            if field in cleaned_data and cleaned_data[field]:
                cleaned_data[field] = cls.sanitize_string(cleaned_data[field])

        return cleaned_data

# Uso en Serializadores
class ProductoSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        """Sanitizar campos de texto antes de guardar"""
        from .validators import XSSProtectionValidator

        # Campos a sanitizar
        text_fields = ['nombre', 'descripcion', 'observaciones']

        # Sanitizar
        attrs = XSSProtectionValidator.sanitize_dict(attrs, text_fields)

        return attrs

    class Meta:
        model = Producto
        fields = '__all__'
```

#### Opción B: Usar Django-HTML-Validator

```python
# requirements.txt
django-html-validator==0.3.2

from django.core.exceptions import ValidationError
import re

class HTMLValidator:
    """Validador que rechaza cualquier contenido HTML"""

    DANGEROUS_PATTERNS = [
        r'<script\b[^>]*>(.*?)</script>',  # Script tags
        r'javascript:',  # javascript: protocol
        r'on\w+\s*=',  # Event handlers (onclick, onload, etc.)
        r'<iframe',  # iframes
        r'<object',  # objects
        r'<embed',  # embeds
    ]

    @classmethod
    def validate_no_html(cls, value):
        """Valida que el string no contenga HTML"""
        if not isinstance(value, str):
            return

        for pattern in cls.DANGEROUS_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValidationError(
                    'El campo no puede contener HTML, JavaScript o código potencialmente peligroso.'
                )

        # Validar caracteres HTML básicos
        if '<' in value or '>' in value:
            raise ValidationError(
                'El campo no puede contener etiquetas HTML.'
            )

# Uso en Modelos
class Producto(models.Model):
    nombre = models.CharField(
        max_length=255,
        validators=[HTMLValidator.validate_no_html]
    )
```

---

### Capa 2: Content Security Policy (CSP)

**Crear configuración de CSP:**

```python
# backend/main_dashboard/middleware.py
class ContentSecurityPolicyMiddleware:
    """
    Middleware que agrega headers de seguridad CSP
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Content Security Policy estricta
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "img-src 'self' data: https:; "
            "font-src 'self' https://fonts.gstatic.com; "
            "connect-src 'self' https://api.stripe.com; "
            "frame-src 'none'; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "frame-ancestors 'none'; "
            "report-uri /csp-report/"
        )

        # Otros headers de seguridad
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'

        return response

# nova/settings/base.py
MIDDLEWARE = [
    # ...
    'main_dashboard.middleware.ContentSecurityPolicyMiddleware',
    # ...
]
```

---

### Capa 3: Escapado de Salida (Frontend)

#### Sanitización en React:

```javascript
// frontend/src/utils/xssProtection.js
import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML para prevenir XSS
 * @param {string} dirty - HTML potencialmente sucio
 * @param {Object} options - Opciones de configuración
 * @returns {string} - HTML limpio
 */
export const sanitizeHTML = (dirty, options = {}) => {
  if (typeof dirty !== 'string') {
    return '';
  }

  const defaultOptions = {
    ALLOWED_TAGS: [],  // No permitir ninguna etiqueta por defecto
    ALLOWED_ATTR: [],  // No permitir ningún atributo
    KEEP_CONTENT: true,  // Mantener el contenido textual
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return DOMPurify.sanitize(dirty, mergedOptions);
};

/**
 * Sanitiza texto removiendo cualquier etiqueta HTML
 * @param {string} text - Texto a limpiar
 * @returns {string} - Texto limpio
 */
export const stripHTML = (text) => {
  if (typeof text !== 'string') {
    return '';
  }

  // Remover todas las etiquetas HTML
  return text.replace(/<[^>]*>/g, '');
};

/**
 * Escapa caracteres especiales de HTML
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado
 */
export const escapeHTML = (text) => {
  if (typeof text !== 'string') {
    return '';
  }

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (m) => map[m]);
};

export default { sanitizeHTML, stripHTML, escapeHTML };
```

#### Uso en Componentes React:

```jsx
// frontend/src/components/ProductoCard.jsx
import { sanitizeHTML, stripHTML } from '../utils/xssProtection';

function ProductoCard({ producto }) {
  return (
    <div className="producto-card">
      {/* ✅ CORRECTO - React escapa automáticamente */}
      <h2>{producto.nombre}</h2>

      {/* ✅ CORRECTO - Sanitizar si necesitas renderizar HTML */}
      <div
        dangerouslySetInnerHTML={{
          __html: sanitizeHTML(producto.descripcion)
        }}
      />

      {/* ✅ CORRECTO - Strip HTML y mostrar solo texto */}
      <p>{stripHTML(producto.descripcion)}</p>

      {/* ❌ INCORRECTO - Nunca usar dangerouslySetInnerHTML sin sanitizar */}
      {/* <div dangerouslySetInnerHTML={{ __html: producto.descripcion }} /> */}
    </div>
  );
}
```

---

### Capa 4: Headers de Seguridad Django

**Configurar en settings:**

```python
# nova/settings/base.py

# Security Headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_SSL_REDIRECT = True  # Redirigir a HTTPS
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True  # Prevenir acceso a cookies via JS
CSRF_COOKIE_HTTPONLY = True

# HSTS
SECURE_HSTS_SECONDS = 31536000  # 1 año
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Proxy SSL
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
```

---

## 🧪 SCRIPT DE PRUEBAS XSS

### Script de Prueba Automatizado:

```python
#!/usr/bin/env python3
"""
Script de prueba de XSS en Nova E-commerce
"""

import requests
import json

BASE_URL = "http://localhost:8000"

# Payloads XSS de prueba
XSS_PAYLOADS = [
    # Script básico
    "<script>alert('XSS')</script>",

    # Image onerror
    "<img src=x onerror=alert('XSS')>",

    # SVG con onerror
    "<svg onload=alert('XSS')>",

    # Event handler
    "<div onmouseover=alert('XSS')>Hover me</div>",

    # JavaScript URI
    "<a href='javascript:alert(\"XSS\")'>Click</a>",

    # Iframe
    "<iframe src='javascript:alert(XSS)'></iframe>",

    # Unicode bypass
    "<\\u003Cscript\\u003Ealert('XSS')<\\u003C/script\\u003E>",

    # Case insensitive
    "<ScRiPt>alert('XSS')</sCrIpT>",

    # With comments
    "<script><!-- alert('XSS'); //--></script>",

    #Encoded
    "<script>alert(String.fromCharCode(88,83,83))</script>",
]

class XSSTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.results = []

    def test_stored_xss_producto(self):
        """Prueba Stored XSS en productos"""
        print("\n🧪 Probando Stored XSS en productos...")

        for payload in XSS_PAYLOADS:
            try:
                # Intentar crear producto con payload
                response = requests.post(
                    f"{self.base_url}/api/productos-tienda/",
                    json={
                        "nombre": payload,
                        "descripcion": payload,
                        "precio": 100.00,
                        "sucursal_id": 1
                    },
                    headers={"Authorization": "Bearer <token>"}
                )

                if response.status_code == 200 or response.status_code == 201:
                    # Verificar si el payload se guardó sin sanitizar
                    producto = response.json()

                    if payload in str(producto.get('nombre', '')) or \
                       payload in str(producto.get('descripcion', '')):
                        print(f"❌ VULNERABLE: Payload guardado sin sanitizar: {payload[:50]}...")
                        self.results.append(("Stored XSS", payload, True))
                    else:
                        print(f"✅ SANITIZADO: {payload[:50]}...")
                else:
                    print(f"⚠️  Error al crear producto: {response.status_code}")

            except Exception as e:
                print(f"❌ Error: {e}")

    def test_reflected_xss_busqueda(self):
        """Prueba Reflected XSS en búsqueda"""
        print("\n🧪 Probando Reflected XSS en búsqueda...")

        for payload in XSS_PAYLOADS:
            try:
                response = requests.get(
                    f"{self.base_url}/api/productos/list/",
                    params={"search": payload}
                )

                # Verificar si el payload se refleja sin escapar
                if payload in response.text:
                    print(f"❌ VULNERABLE: Payload reflejado: {payload[:50]}...")
                    self.results.append(("Reflected XSS", payload, True))
                else:
                    print(f"✅ ESCAPADO: {payload[:50]}...")

            except Exception as e:
                print(f"❌ Error: {e}")

    def test_xss_headers(self):
        """Verifica headers de seguridad XSS"""
        print("\n🧪 Verificando headers de seguridad...")

        try:
            response = requests.get(f"{self.base_url}/api/")

            headers_to_check = {
                'X-XSS-Protection': 'Protección XSS',
                'Content-Security-Policy': 'CSP',
                'X-Content-Type-Options': 'Nosniff',
                'X-Frame-Options': 'Frame protection',
            }

            for header, name in headers_to_check.items():
                if header in response.headers:
                    print(f"✅ {name}: {response.headers[header]}")
                else:
                    print(f"❌ FALTA: {name} ({header})")

        except Exception as e:
            print(f"❌ Error: {e}")

    def generate_report(self):
        """Genera reporte de vulnerabilidades"""
        print("\n" + "="*80)
        print("📊 REPORTE DE VULNERABILIDADES XSS")
        print("="*80 + "\n")

        if not self.results:
            print("✅ NO SE DETECTARON VULNERABILIDADES XSS")
        else:
            print(f"❌ SE DETECTARON {len(self.results)} VULNERABILIDADES:\n")

            for vuln_type, payload, is_vulnerable in self.results:
                print(f"  • {vuln_type}: {payload[:60]}...")

if __name__ == "__main__":
    tester = XSSTester(BASE_URL)
    tester.test_stored_xss_producto()
    tester.test_reflected_xss_busqueda()
    tester.test_xss_headers()
    tester.generate_report()
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Backend (Django):

- [ ] Instalar `bleach` o `django-html-validator`
- [ ] Crear validador `XSSProtectionValidator`
- [ ] Agregar sanitización en todos los serializadores
- [ ] Implementar middleware `ContentSecurityPolicyMiddleware`
- [ ] Configurar headers de seguridad en `settings.py`
- [ ] Agregar validación en modelos con campos de texto
- [ ] Implementar rate limiting en endpoints de creación

### Frontend (React):

- [ ] Instalar `dompurify`
- [ ] Crear `utils/xssProtection.js`
- [ ] Revisar todos los componentes que renderizan contenido dinámico
- [ ] Reemplazar `dangerouslySetInnerHTML` por DOMPurify
- [ ] Sanitizar input de usuario en formularios
- [ ] Implementar validación en frontend

### Testing:

- [ ] Ejecutar script de pruebas XSS
- [ ] Probar Stored XSS en productos
- [ ] Probar Reflected XSS en búsqueda
- [ ] Verificar headers de seguridad
- [ ] Realizar penetration testing profesional

---

## 🎯 RECOMENDACIONES PRIORITARIAS

### 🔥 CRÍTICO (Implementar inmediatamente):

1. **Instalar y configurar Bleach:**
   ```bash
   pip install bleach==6.1.0
   ```

2. **Crear validador XSS:**
   ```python
   # backend/main_dashboard/validators.py
   from django.core.exceptions import ValidationError
   import bleach

   def validate_no_xss(value):
       """Valida que no haya HTML/JS malicioso"""
       clean = bleach.clean(value, tags=[], strip=True)
       if clean != value:
           raise ValidationError('Se detectó contenido HTML o JavaScript no permitido.')
   ```

3. **Agregar a modelos:**
   ```python
   class Producto(models.Model):
       nombre = models.CharField(
           max_length=255,
           validators=[validate_no_xss]
       )
       descripcion = models.TextField(
           validators=[validate_no_xss]
       )
   ```

### 🔶 ALTO (Próximos 7 días):

4. Implementar CSP middleware
5. Instalar DOMPurify en frontend
6. Revisar todos los componentes React
7. Configurar headers de seguridad

### 🔷 MEDIO (Próximos 30 días):

8. Realizar pruebas de penetración
9. Implementar monitoreo de intentos XSS
10. Capacitar a desarrolladores en XSS
11. Establecer políticas de seguridad

---

## 📚 REFERENCIAS

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Bleach Documentation](https://bleach.readthedocs.io/)
- [CWE-79: Cross-Site Scripting](https://cwe.mitre.org/data/definitions/79.html)

---

**Documento Generado Por:** Claude Code - Security Suite
**Fecha:** 2026-04-13
**Versión:** 1.0
**Clasificación:** CONFIDENCIAL
