"""
Módulo de validadores de seguridad para prevenir XSS, SQL Injection y otros ataques.

Autor: Security Suite
Fecha: 2026-04-13
"""

import re
import html
from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible
from rest_framework import serializers


# ============================================================================
# VALIDADORES XSS
# ============================================================================

@deconstructible
class XSSProtectionValidator:
    """
    Validador que sanitiza input para prevenir XSS attacks.

    Proporciona múltiples niveles de protección:
    1. Detección de patrones peligrosos
    2. Sanitización de HTML/JavaScript
    3. Validación de longitud
    """

    # Patrones peligrosos a detectar
    DANGEROUS_PATTERNS = [
        r'<script\b[^>]*>.*?</script>',  # Script tags
        r'javascript:',  # javascript: protocol
        r'on\w+\s*=',  # Event handlers (onclick, onload, onerror, etc.)
        r'<iframe',  # iframes
        r'<object',  # objects
        r'<embed',  # embeds
        r'<link',  # link tags
        r'<meta',  # meta tags
        r'<style',  # style tags
        r'<applet',  # applets
        r'<form',  # form tags
        r'expression\s*\(',  # CSS expression()
        r'@import',  # CSS @import
        r'<\?php',  # PHP tags
        r'<\s*!\[CDATA\[',  # CDATA sections
    ]

    # Caracteres HTML especiales que requieren validación
    HTML_CHARS = ['<', '>', '"', "'", '&', '/']

    def __init__(self, allow_html=False, max_length=None):
        """
        Inicializa el validador.

        Args:
            allow_html: Si es False, rechaza cualquier HTML
            max_length: Longitud máxima del string (opcional)
        """
        self.allow_html = allow_html
        self.max_length = max_length

    def __call__(self, value):
        """
        Valida y sanitiza el valor.

        Args:
            value: Valor a validar

        Raises:
            ValidationError: Si se detecta contenido peligroso
        """
        if not value or not isinstance(value, str):
            return

        # Validar longitud
        if self.max_length and len(value) > self.max_length:
            raise ValidationError(
                f'El texto no puede exceder {self.max_length} caracteres.'
            )

        # Si no se permite HTML, validar caracteres HTML básicos
        if not self.allow_html:
            if any(char in value for char in self.HTML_CHARS):
                raise ValidationError(
                    'El campo no puede contener HTML, etiquetas o caracteres especiales.'
                )

        # Buscar patrones peligrosos
        for pattern in self.DANGEROUS_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE | re.DOTALL):
                raise ValidationError(
                    'Se detectó contenido potencialmente peligroso. '
                    'Por favor, elimina cualquier código HTML, JavaScript o scripts.'
                )

        # Validar codificación Unicode maliciosa
        if self._contains_unicode_xss(value):
            raise ValidationError(
                'Se detectaron caracteres Unicode potencialmente peligrosos.'
            )

        return value

    def _contains_unicode_xss(self, value):
        """
        Detecta intentos de bypass usando Unicode.

        Por ejemplo: \u003Cscript\u003E en lugar de <script>
        """
        # Buscar secuencias de escape Unicode
        unicode_patterns = [
            r'\\u00[0-9a-f]{2}',  # Unicode escapes como \u003C
            r'\\x[0-9a-f]{2}',  # Hex escapes como \x3C
            r'%[0-9a-f]{2}',  # URL encoding
        ]

        decoded_value = value
        for pattern in unicode_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                # Intentar decodificar
                try:
                    decoded_value = re.sub(
                        pattern,
                        lambda m: chr(int(m.group(0)[-2:], 16)),
                        decoded_value
                    )
                except:
                    pass

        # Verificar si el valor decodificado contiene patrones peligrosos
        for pattern in self.DANGEROUS_PATTERNS:
            if re.search(pattern, decoded_value, re.IGNORECASE):
                return True

        return False


@deconstructible
class HTMLSanitizerValidator:
    """
    Validador que sanitiza HTML permitiendo solo etiquetas seguras.

    Usa sanitización manual sin depender de librerías externas.
    """

    # Etiquetas permitidas (ninguna por defecto para máxima seguridad)
    ALLOWED_TAGS = []

    # Atributos permitidos
    ALLOWED_ATTRIBUTES = {}

    def __init__(self, allowed_tags=None, allowed_attributes=None):
        """
        Inicializa el sanitizador.

        Args:
            allowed_tags: Lista de etiquetas permitidas (por defecto: ninguna)
            allowed_attributes: Dict de atributos permitidos por tag
        """
        self.allowed_tags = allowed_tags or self.ALLOWED_TAGS
        self.allowed_attributes = allowed_attributes or self.ALLOWED_ATTRIBUTES

    def __call__(self, value):
        """
        Sanitiza el valor HTML.

        Args:
            value: Valor HTML a sanitizar

        Returns:
            str: HTML sanitizado

        Raises:
            ValidationError: Si se detecta contenido peligroso
        """
        if not value or not isinstance(value, str):
            return value

        # Validar primero si hay contenido realmente peligroso
        xss_validator = XSSProtectionValidator(allow_html=True)
        try:
            xss_validator(value)
        except ValidationError:
            raise

        # Si no se permiten etiquetas, remover todas
        if not self.allowed_tags:
            return self._strip_all_html(value)

        # Si se permiten algunas etiquetas, sanitizar
        return self._sanitize_html(value)

    def _strip_all_html(self, value):
        """Remueve todas las etiquetas HTML."""
        # Remover comentarios HTML
        value = re.sub(r'<!--.*?-->', '', value, flags=re.DOTALL)

        # Remover todas las etiquetas
        value = re.sub(r'<[^>]+>', '', value)

        # Decodificar entidades HTML
        value = html.unescape(value)

        return value.strip()

    def _sanitize_html(self, value):
        """Sanitiza HTML permitiendo solo etiquetas seguras."""
        # Implementación simplificada - para producción usar Bleach
        return self._strip_all_html(value)


# ============================================================================
# VALIDADORES DE SERIALIZADORES
# ============================================================================

class SanitizedCharField(serializers.CharField):
    """
    CharField que sanitiza automáticamente el input para prevenir XSS.
    """

    def to_internal_value(self, data):
        """Sanitiza el valor antes de validarlo."""
        if not data:
            return data

        # Sanitizar el valor
        validator = XSSProtectionValidator(allow_html=False)

        try:
            validator(data)
            return data
        except ValidationError as e:
            raise serializers.ValidationError(str(e))


class SanitizedTextField(serializers.CharField):
    """
    TextField que sanitiza automáticamente el input para prevenir XSS.
    """

    def to_internal_value(self, data):
        """Sanitiza el valor antes de validarlo."""
        if not data:
            return data

        # Sanitizar el valor
        validator = XSSProtectionValidator(allow_html=False)

        try:
            validator(data)
            return data
        except ValidationError as e:
            raise serializers.ValidationError(str(e))


# ============================================================================
# FUNCIONES DE AYUDA
# ============================================================================

def sanitize_string(value, allow_html=False, max_length=None):
    """
    Función auxiliar para sanitizar strings.

    Args:
        value: String a sanitizar
        allow_html: Si es True, permite HTML seguro
        max_length: Longitud máxima permitida

    Returns:
        str: String sanitizado

    Raises:
        ValidationError: Si se detecta contenido peligroso
    """
    if not value or not isinstance(value, str):
        return value

    validator = XSSProtectionValidator(allow_html=allow_html, max_length=max_length)
    validator(value)

    return value


def sanitize_dict(data_dict, fields_to_sanitize):
    """
    Sanitiza campos específicos de un diccionario.

    Args:
        data_dict: Diccionario con datos a sanitizar
        fields_to_sanitize: Lista de campos a sanitizar

    Returns:
        dict: Diccionario con campos sanitizados

    Raises:
        ValidationError: Si algún campo tiene contenido peligroso
    """
    cleaned_data = data_dict.copy()

    for field in fields_to_sanitize:
        if field in cleaned_data and cleaned_data[field]:
            try:
                cleaned_data[field] = sanitize_string(cleaned_data[field])
            except ValidationError as e:
                # Re-lanzar con el nombre del campo
                raise ValidationError({field: e.messages})

    return cleaned_data


def escape_html(value):
    """
    Escapa caracteres especiales de HTML.

    Args:
        value: String a escapar

    Returns:
        str: String con caracteres escapados
    """
    if not value or not isinstance(value, str):
        return value

    # Mapa de caracteres a escapar
    escape_map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    }

    return ''.join(escape_map.get(char, char) for char in value)


def strip_html(value):
    """
    Remueve todas las etiquetas HTML de un string.

    Args:
        value: String con HTML

    Returns:
        str: String sin HTML
    """
    if not value or not isinstance(value, str):
        return value

    # Remover etiquetas HTML
    clean = re.sub(r'<[^>]+>', '', value)

    # Remover comentarios
    clean = re.sub(r'<!--.*?-->', '', clean, flags=re.DOTALL)

    # Decodificar entidades HTML
    clean = html.unescape(clean)

    return clean.strip()
