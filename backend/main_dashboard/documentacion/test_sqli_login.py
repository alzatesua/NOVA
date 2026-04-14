#!/usr/bin/env python3
"""
Script de prueba de SQL Injection en el endpoint de login
Autor: Pruebas de Seguridad
Fecha: 2026-04-13

Este script prueba diversos payloads de SQL injection en el endpoint /api/validar/
"""

import requests
import json
import time
from typing import Dict, List, Tuple

# Configuración
BASE_URL = "http://localhost:8000"  # Ajustar según tu configuración
LOGIN_URL = f"{BASE_URL}/api/validar/"

# Colores para salida
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


class SQLInjector:
    """Clase para probar SQL Injection en el login"""

    def __init__(self, base_url: str):
        self.base_url = base_url
        self.login_url = f"{base_url}/api/validar/"
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

    def test_login(self, usuario: str, password: str, subdominio: str = None) -> Tuple[int, Dict]:
        """
        Envía una petición de login y retorna el status code y la respuesta
        """
        payload = {
            "usuario": usuario,
            "password": password
        }

        if subdominio:
            payload["subdominio"] = subdominio

        try:
            response = requests.post(
                self.login_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            return response.status_code, response.json()
        except Exception as e:
            return 0, {"error": str(e)}

    def check_timing_attack(self, usuario: str, password: str, subdominio: str = None) -> float:
        """
        Mide el tiempo de respuesta para detectar timing attacks
        """
        start_time = time.time()
        status, response = self.test_login(usuario, password, subdominio)
        end_time = time.time()
        return end_time - start_time

    # ==================== PRUEBAS DE SQL INJECTION ====================

    def test_basic_authentication_bypass(self):
        """
        Prueba 1: Bypass básico de autenticación
        Payloads clásicos como ' OR '1'='1
        """
        self.print_result("Iniciando pruebas de bypass básico", "INFO")

        payloads = [
            "' OR '1'='1",
            "' OR '1'='1'--",
            "' OR '1'='1'/*",
            "' OR 1=1--",
            "admin'--",
            "admin'/*",
            "' OR 'x'='x",
            "x' OR 1=1--",
        ]

        for payload in payloads:
            status, response = self.test_login(payload, "anything")

            # Si obtenemos 200 OK con tokens, es VULNERABLE
            if status == 200 and 'access' in response:
                self.print_result(
                    f"Bypass básico con payload: {payload[:20]}...",
                    "VULNERABLE",
                    f"Respuesta: {json.dumps(response, indent=2)[:200]}"
                )
                self.results.append(("Bypass básico", payload, True))
                return True
            elif status == 400 and 'error' in response:
                # Respuesta esperada para login fallido
                pass

        self.print_result("Bypass básico", "SAFE", "Todos los payloads fueron rechazados")
        return False

    def test_union_select(self):
        """
        Prueba 2: UNION SELECT para extraer datos
        Intenta inyectar consultas UNION para extraer información de otras tablas
        """
        self.print_result("Iniciando pruebas de UNION SELECT", "INFO")

        payloads = [
            "' UNION SELECT NULL, NULL, NULL, NULL--",
            "' UNION SELECT username, password, NULL, NULL FROM login_usuario--",
            "' UNION SELECT table_name FROM information_schema.tables--",
            "' UNION SELECT 1,2,3,4--",
        ]

        for payload in payloads:
            status, response = self.test_login(payload, "anything")

            # Si obtenemos datos inesperados, es VULNERABLE
            if status == 200:
                self.print_result(
                    f"UNION SELECT con payload: {payload[:30]}...",
                    "VULNERABLE",
                    "Posible extracción de datos"
                )
                self.results.append(("UNION SELECT", payload, True))
                return True

        self.print_result("UNION SELECT", "SAFE", "Todos los payloads fueron rechazados")
        return False

    def test_boolean_based_sqli(self):
        """
        Prueba 3: SQL Injection basado en booleanos
        Usa condiciones verdaderas/falsas para verificar si es vulnerable
        """
        self.print_result("Iniciando pruebas de SQLi basado en booleanos", "INFO")

        # Condición verdadera
        time_true = self.check_timing_attack("' AND '1'='1", "password")
        # Condición falsa
        time_false = self.check_timing_attack("' AND '1'='2", "password")

        # Si hay diferencia significativa en el mensaje de error o tiempo
        status_true, resp_true = self.test_login("' AND '1'='1", "password")
        status_false, resp_false = self.test_login("' AND '1'='2", "password")

        # Verificar si las respuestas son diferentes
        if resp_true != resp_false:
            self.print_result(
                "Boolean-based SQLi",
                "VULNERABLE",
                f"Respuestas diferentes: {resp_true.get('error', 'N/A')} vs {resp_false.get('error', 'N/A')}"
            )
            self.results.append(("Boolean-based", "' AND '1'='1", True))
            return True

        self.print_result("Boolean-based SQLi", "SAFE", "Las respuestas son consistentes")
        return False

    def test_time_based_blind_sqli(self):
        """
        Prueba 4: SQL Injection ciego basado en tiempo
        Usa SLEEP() o PG_SLEEP() para verificar vulnerabilidad
        """
        self.print_result("Iniciando pruebas de SQLi ciego basado en tiempo", "INFO")

        # Payloads para PostgreSQL
        payloads = [
            "'; SELECT PG_SLEEP(5)--",
            "' OR PG_SLEEP(5)--",
            "'; SELECT SLEEP(5)--",
            "' OR (SELECT SUBSTR(password,1,1) FROM login_usuario LIMIT 1) = 'a' AND PG_SLEEP(5)--",
        ]

        for payload in payloads:
            elapsed = self.check_timing_attack(payload, "password")

            # Si toma más de 4 segundos, probablemente es vulnerable
            if elapsed > 4:
                self.print_result(
                    f"Time-based blind SQLi con payload: {payload[:30]}...",
                    "VULNERABLE",
                    f"Tiempo de respuesta: {elapsed:.2f}s (esperado: <2s)"
                )
                self.results.append(("Time-based blind", payload, True))
                return True

        self.print_result("Time-based blind SQLi", "SAFE", "No se detectaron retrasos significativos")
        return False

    def test_error_based_sqli(self):
        """
        Prueba 5: SQL Injection basado en errores
        Provoca errores de base de datos para extraer información
        """
        self.print_result("Iniciando pruebas de SQLi basado en errores", "INFO")

        payloads = [
            "'",
            "' OR 1=CONVERT(int, (SELECT TOP 1 password FROM login_usuario))--",
            "'; DROP TABLE login_usuario--",
            "' OR 1/0--",
            "' OR CAST((SELECT 1) AS INT)--",
        ]

        for payload in payloads:
            status, response = self.test_login(payload, "password")

            # Si el error contiene información de la BD, es VULNERABLE
            if status == 500:
                error_msg = response.get('error', '') or response.get('detalle', '')
                if 'sql' in error_msg.lower() or 'syntax' in error_msg.lower() or 'database' in error_msg.lower():
                    self.print_result(
                        f"Error-based SQLi con payload: {payload[:30]}...",
                        "VULNERABLE",
                        f"Error de BD expuesto: {error_msg[:200]}"
                    )
                    self.results.append(("Error-based", payload, True))
                    return True

        self.print_result("Error-based SQLi", "SAFE", "No se exponen errores de BD")
        return False

    def test_stacked_queries(self):
        """
        Prueba 6: Stacked Queries (consultas apiladas)
        Intenta ejecutar múltiples consultas separadas por ;
        """
        self.print_result("Iniciando pruebas de Stacked Queries", "INFO")

        payloads = [
            "'; DROP TABLE login_usuario--",
            "'; INSERT INTO login_usuario (usuario, password) VALUES ('hacker', 'hacked')--",
            "'; UPDATE login_usuario SET password='hacked' WHERE usuario='admin'--",
        ]

        for payload in payloads:
            # Primero verificamos si la tabla todavía funciona
            status_before, _ = self.test_login("admin", "any_password")

            # Enviamos el payload malicioso
            self.test_login(payload, "password")

            # Verificamos si algo cambió
            status_after, resp_after = self.test_login("admin", "any_password")

            # Si el comportamiento cambió, es VULNERABLE
            if status_before != status_after:
                self.print_result(
                    f"Stacked Queries con payload: {payload[:30]}...",
                    "VULNERABLE",
                    "El comportamiento de la aplicación cambió después del payload"
                )
                self.results.append(("Stacked Queries", payload, True))
                return True

        self.print_result("Stacked Queries", "SAFE", "No se detectaron cambios en el comportamiento")
        return False

    def test_second_order_sqli(self):
        """
        Prueba 7: Second-Order SQL Injection
        Inyección que se ejecuta en una segunda consulta (por ejemplo, al registrar historial)
        """
        self.print_result("Iniciando pruebas de Second-Order SQLi", "INFO")

        # Intentamos inyectar en el campo usuario y verificar si se ejecuta al registrar historial
        malicious_username = "test' OR '1'='1"

        status, response = self.test_login(malicious_username, "password123", "nova")

        # Si el login falla pero se ejecuta algo después, podría ser vulnerable
        if status == 400:
            # El login falló (esperado), pero verificamos si se registró historial
            # Esto requeriría acceso a la BD para verificar
            self.print_result(
                "Second-Order SQLi",
                "SAFE",
                "No se detectaron inyecciones de segundo orden (requiere verificación en BD)"
            )
            return False

        self.print_result("Second-Order SQLi", "SAFE")
        return False

    def test_subdomain_injection(self):
        """
        Prueba 8: SQL Injection en el parámetro subdominio
        El subdominio se usa en una consulta LIKE (icontains)
        """
        self.print_result("Iniciando pruebas de SQLi en subdominio", "INFO")

        payloads = [
            "nova' OR '1'='1",
            "nova' UNION SELECT password FROM login_usuario--",
            "nova'; DROP TABLE login_usuario--",
            "nova%' AND '1'='1",
        ]

        for payload in payloads:
            status, response = self.test_login("admin", "password", payload)

            # Si obtenemos acceso no autorizado, es VULNERABLE
            if status == 200 and 'access' in response:
                self.print_result(
                    f"Subdominio injection con payload: {payload}",
                    "VULNERABLE",
                    "Acceso no autorizado obtenido"
                )
                self.results.append(("Subdomain injection", payload, True))
                return True

        self.print_result("Subdominio injection", "SAFE", "El parámetro subdominio está protegido")
        return False

    def generate_report(self):
        """Genera un reporte final de todas las pruebas"""
        print("\n" + "="*80)
        print(f"{BLUE}REPORTE FINAL DE PRUEBAS DE SQL INJECTION{RESET}")
        print("="*80 + "\n")

        total_tests = 8
        vulnerable_tests = sum(1 for _, _, is_vuln in self.results if is_vuln)

        print(f"Total de pruebas realizadas: {total_tests}")
        print(f"Vulnerabilidades encontradas: {RED}{vulnerable_tests}{RESET}")
        print(f"Pruebas seguras: {GREEN}{total_tests - vulnerable_tests}{RESET}\n")

        if self.results:
            print(f"{RED}⚠️  VULNERABILIDADES DETECTADAS:{RESET}\n")
            for test_type, payload, is_vuln in self.results:
                print(f"  • {test_type}: {payload[:50]}...")
        else:
            print(f"{GREEN}✅ NO SE DETECTARON VULNERABILIDADES DE SQL INJECTION{RESET}")
            print(f"{GREEN}   El endpoint de login parece estar correctamente protegido.{RESET}")

        print("\n" + "="*80)

    def run_all_tests(self):
        """Ejecuta todas las pruebas de SQL injection"""
        print(f"\n{BLUE}{'='*80}{RESET}")
        print(f"{BLUE}INICIANDO PRUEBAS DE SQL INJECTION EN /api/validar/{RESET}")
        print(f"{BLUE}{'='*80}{RESET}\n")

        # Verificar que el servidor esté accesible
        try:
            status, _ = self.test_login("test", "test")
            if status == 0:
                print(f"{RED}Error: No se puede conectar al servidor{RESET}")
                print(f"Verifica que el servidor esté corriendo en {self.base_url}")
                return
        except Exception as e:
            print(f"{RED}Error de conexión: {e}{RESET}")
            return

        # Ejecutar todas las pruebas
        self.test_basic_authentication_bypass()
        self.test_union_select()
        self.test_boolean_based_sqli()
        self.test_time_based_blind_sqli()
        self.test_error_based_sqli()
        self.test_stacked_queries()
        self.test_second_order_sqli()
        self.test_subdomain_injection()

        # Generar reporte
        self.generate_report()


if __name__ == "__main__":
    print(f"""
{BLUE}
╔═══════════════════════════════════════════════════════════════════╗
║                     SQL INJECTION TESTER                          ║
║                    Para endpoint /api/validar/                     ║
╚═══════════════════════════════════════════════════════════════════╝
{RESET}
    """)

    # Crear instancia y ejecutar pruebas
    injector = SQLInjector(BASE_URL)
    injector.run_all_tests()
