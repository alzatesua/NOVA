"""
Middleware de seguridad para Nova E-commerce

Proporciona headers de seguridad HTTP incluyendo:
- Content Security Policy (CSP)
- X-XSS-Protection
- X-Frame-Options
- X-Content-Type-Options
- Otros headers de seguridad

Autor: Security Suite
Fecha: 2026-04-13
"""

from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
import re
import logging

logger = logging.getLogger('security')


class ContentSecurityPolicyMiddleware(MiddlewareMixin):
    """
    Middleware que agrega headers de seguridad CSP y otros headers de protección.

    Content Security Policy (CSP) es una capa de seguridad adicional que ayuda
    a detectar y mitigar ciertos tipos de ataques, incluyendo Cross Site Scripting (XSS)
    y data injection attacks.
    """

    # Políticas CSP según el entorno
    CSP_POLICIES = {
        'development': (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "img-src 'self' data: https: http://localhost:*; "
            "font-src 'self' https://fonts.gstatic.com; "
            "connect-src 'self' http://localhost:* https://api.stripe.com ws://localhost:*; "
            "frame-src 'self'; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "frame-ancestors 'self'; "
            "upgrade-insecure-requests; "
        ),
        'production': (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "img-src 'self' data: https:; "
            "font-src 'self' https://fonts.gstatic.com; "
            "connect-src 'self' https://api.stripe.com; "
            "frame-src 'none'; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "frame-ancestors 'none'; "
            "upgrade-insecure-requests; "
        ),
    }

    def process_request(self, request):
        """
        Procesa cada request antes de llegar a la vista.

        Se puede usar para logging de seguridad, detección de anomalías, etc.
        """
        # Detectar patrones sospechosos en la URL
        self._check_suspicious_patterns(request)

        return None

    def process_response(self, request, response):
        """
        Agrega headers de seguridad a la respuesta.
        """
        # Solo agregar headers a respuestas HTTP exitosas
        if response.status_code >= 400:
            return response

        # Determinar entorno
        env = getattr(settings, 'ENVIRONMENT', 'development')

        # Content Security Policy
        csp_policy = self.CSP_POLICIES.get(
            env,
            self.CSP_POLICIES['development']
        )
        response['Content-Security-Policy'] = csp_policy

        # X-XSS-Protection (obsoleto pero útil para browsers antiguos)
        response['X-XSS-Protection'] = '1; mode=block'

        # X-Frame-Options - Prevenir clickjacking
        response['X-Frame-Options'] = 'DENY'

        # X-Content-Type-Options - Prevenir MIME-sniffing
        response['X-Content-Type-Options'] = 'nosniff'

        # Referrer-Policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Permissions-Policy (antes Feature-Policy)
        response['Permissions-Policy'] = (
            'geolocation=(), '
            'microphone=(), '
            'camera=(), '
            'payment=(), '
            'usb=(), '
            'magnetometer=(), '
            'gyroscope=(), '
            'accelerometer=()'
        )

        # Strict-Transport-Security (solo en HTTPS)
        if request.is_secure():
            response['Strict-Transport-Security'] = (
                'max-age=31536000; '
                'includeSubDomains; '
                'preload'
            )

        # Additional security headers
        response['X-Permitted-Cross-Domain-Policies'] = 'none'
        response['Cross-Origin-Opener-Policy'] = 'same-origin'
        response['Cross-Origin-Resource-Policy'] = 'same-origin'

        # Remove server information
        response.pop('Server', None)

        return response

    def _check_suspicious_patterns(self, request):
        """
        Detecta patrones sospechosos en el request.

        Busca indicadores de ataques como:
        - XSS en parámetros
        - SQL injection
        - Path traversal
        """
        # Patrones sospechosos
        suspicious_patterns = [
            r'<script',  # XSS
            r'javascript:',  # XSS
            r'on\w+\s*=',  # Event handlers
            r'\.\./',  # Path traversal
            r'union.*select',  # SQL injection
            r'drop.*table',  # SQL injection
        ]

        # Verificar query parameters
        for param, value in request.GET.items():
            for pattern in suspicious_patterns:
                if re.search(pattern, value, re.IGNORECASE):
                    # Loggear intento sospechoso
                    logger.warning(
                        f"Suspicious pattern detected in query param '{param}': "
                        f"IP={self._get_client_ip(request)}, "
                        f"Pattern={pattern}"
                    )

        # Verificar body si es JSON
        if hasattr(request, 'body') and request.body:
            try:
                body_str = request.body.decode('utf-8', errors='ignore')
                for pattern in suspicious_patterns:
                    if re.search(pattern, body_str, re.IGNORECASE):
                        logger.warning(
                            f"Suspicious pattern detected in request body: "
                            f"IP={self._get_client_ip(request)}, "
                            f"Pattern={pattern}"
                        )
            except:
                pass

    def _get_client_ip(self, request):
        """
        Obtiene la IP real del cliente considerando proxies.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')


class XssProtectionMiddleware(MiddlewareMixin):
    """
    Middleware específico para protección XSS.

    Añade una capa adicional de validación y sanitización.
    """

    def process_request(self, request):
        """
        Valida y sanitiza input del usuario.
        """
        # Sanitizar query parameters
        self._sanitize_query_params(request)

        return None

    def _sanitize_query_params(self, request):
        """
        Sanitiza parámetros de query para prevenir reflected XSS.
        """
        from .validators import sanitize_string

        sanitized_get = {}
        for key, value in request.GET.items():
            if isinstance(value, str):
                try:
                    sanitized_get[key] = sanitize_string(value)
                except:
                    # Si hay error, usar el valor original
                    sanitized_get[key] = value
            else:
                sanitized_get[key] = value

        # Reemplazar GET con versión sanitizada
        request.GET = sanitized_get


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware que agrega headers de seguridad adicionales.
    """

    def process_response(self, request, response):
        """
        Agrega headers de seguridad a la respuesta.
        """
        # Server header removal
        response.pop('Server', None)
        response.pop('X-Powered-By', None)

        # Additional headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'

        return response


class RateLimitMiddleware(MiddlewareMixin):
    """
    Middleware para limitar la tasa de requests y prevenir ataques de fuerza bruta.
    """

    # Configuración de rate limiting
    RATE_LIMITS = {
        'default': (100, 3600),  # 100 requests por hora
        'login': (5, 300),  # 5 intentos por 5 minutos
        'api': (1000, 3600),  # 1000 requests por hora para APIs
    }

    def process_request(self, request):
        """
        Verifica si el cliente ha excedido el rate limit.
        """
        from django.core.cache import cache

        # Obtener IP del cliente
        client_ip = self._get_client_ip(request)

        # Determinar tipo de request
        request_type = self._get_request_type(request)

        # Obtener rate limit
        max_requests, window = self.RATE_LIMITS.get(
            request_type,
            self.RATE_LIMITS['default']
        )

        # Clave para cache
        cache_key = f'rate_limit_{client_ip}_{request_type}'

        # Obtener contador actual
        current_count = cache.get(cache_key, 0)

        if current_count >= max_requests:
            # Rate limit excedido
            logger.warning(
                f"Rate limit exceeded: IP={client_ip}, "
                f"Type={request_type}, Count={current_count}"
            )

            from django.http import HttpResponseForbidden
            return HttpResponseForbidden(
                '{"error": "Too many requests. Please try again later."}',
                content_type='application/json'
            )

        # Incrementar contador
        cache.set(cache_key, current_count + 1, window)

        return None

    def _get_request_type(self, request):
        """
        Determina el tipo de request para aplicar rate limiting diferenciado.
        """
        path = request.path.lower()

        if '/login' in path or '/auth/' in path:
            return 'login'
        elif '/api/' in path:
            return 'api'
        else:
            return 'default'

    def _get_client_ip(self, request):
        """
        Obtiene la IP real del cliente.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')
