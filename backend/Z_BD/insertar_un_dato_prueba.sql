-- ============================================================================
-- INSERTAR UN DATO DE PRUEBA SIMPLE EN HISTORIAL_LOGIN
-- Ejecutar este SQL directamente en tu base de datos de tienda
-- ============================================================================

-- Primero verificar si la tabla existe
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'historial_login';

-- Si la tabla no existe, crearla primero:
-- \i Z_BD/crear_historial_login.sql

-- Insertar UN registro de prueba simple
INSERT INTO historial_login (
    usuario_id,
    usuario_correo,
    usuario_nombre,
    fecha_hora_login,
    direccion_ip,
    user_agent,
    exitoso,
    duracion_segundos
) VALUES (
    1,                                      -- ID de usuario (puede ser cualquiera)
    'admin@tienda.com',                    -- Email
    'admin',                                -- Nombre de usuario
    NOW(),                                  -- Fecha y hora actual
    '192.168.1.100',                        -- IP
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', -- Browser
    TRUE,                                   -- Exitoso
    3600                                    -- Duración en segundos (1 hora)
);

-- Verificar que se insertó
SELECT
    id_historial,
    usuario_nombre,
    usuario_correo,
    exitoso,
    fecha_hora_login,
    direccion_ip
FROM historial_login
ORDER BY fecha_hora_login DESC
LIMIT 5;

-- Contar total de registros
SELECT COUNT(*) as total_registros FROM historial_login;
