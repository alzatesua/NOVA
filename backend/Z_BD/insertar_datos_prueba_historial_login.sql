-- ============================================================================
-- INSERTAR DATOS DE PRUEBA EN HISTORIAL_LOGIN
-- Ejecutar este SQL en la base de datos de cada tienda
-- ============================================================================

-- Insertar 10 registros de prueba recientes
INSERT INTO historial_login (
    usuario_id,
    usuario_correo,
    usuario_nombre,
    fecha_hora_login,
    fecha_hora_logout,
    direccion_ip,
    user_agent,
    exitoso,
    fallo_reason,
    duracion_segundos
) VALUES
-- Registro 1: Login exitoso de hace 1 hora
(1, 'admin@tienda.com', 'admin', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', TRUE, NULL, 1800),

-- Registro 2: Login exitoso de hace 3 horas
(1, 'admin@tienda.com', 'admin', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', TRUE, NULL, 3600),

-- Registro 3: Login exitoso de ayer
(2, 'vendedor@tienda.com', 'vendedor', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '8 hours', '190.24.56.78', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', TRUE, NULL, 28800),

-- Registro 4: Login fallido de hace 2 días
(0, 'desconocido@falso.com', 'desconocido', NOW() - INTERVAL '2 days', NULL, '181.132.45.67', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15', FALSE, 'Contraseña incorrecta', NULL),

-- Registro 5: Login exitoso de hace 3 días
(1, 'admin@tienda.com', 'admin', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '2 hours', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', TRUE, NULL, 7200),

-- Registro 6: Login exitoso de hace 5 días
(2, 'vendedor@tienda.com', 'vendedor', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '6 hours', '190.24.56.78', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', TRUE, NULL, 21600),

-- Registro 7: Login fallido de hace 1 semana
(0, 'intruso@intento.com', 'intruso', NOW() - INTERVAL '7 days', NULL, '200.45.67.89', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', FALSE, 'Usuario no encontrado', NULL),

-- Registro 8: Login exitoso de hace 10 días
(3, 'almacen@tienda.com', 'almacen', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '4 hours', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', TRUE, NULL, 14400),

-- Registro 9: Login exitoso de hace 2 semanas
(1, 'admin@tienda.com', 'admin', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days' + INTERVAL '10 hours', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', TRUE, NULL, 36000),

-- Registro 10: Login exitoso hoy (sesión activa sin logout)
(1, 'admin@tienda.com', 'admin', NOW() - INTERVAL '30 minutes', NULL, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', TRUE, NULL, NULL);

-- Verificar los datos insertados
SELECT
    usuario_nombre,
    usuario_correo,
    exitoso,
    fallo_reason,
    fecha_hora_login,
    fecha_hora_logout,
    direccion_ip,
    CASE
        WHEN duracion_segundos IS NOT NULL THEN
            duracion_segundos || ' segundos = ' ||
            FLOOR(duracion_segundos / 3600) || 'h ' ||
            FLOOR((duracion_segundos % 3600) / 60) || 'm'
        ELSE 'Sesión activa'
    END as duracion_formateada
FROM historial_login
ORDER BY fecha_hora_login DESC;

-- Estadísticas
SELECT
    COUNT(*) as total_registros,
    COUNT(*) FILTER (WHERE exitoso = TRUE) as logins_exitosos,
    COUNT(*) FILTER (WHERE exitoso = FALSE) as logins_fallidos,
    COUNT(*) FILTER (WHERE fecha_hora_logout IS NULL) as sesiones_activas
FROM historial_login;
