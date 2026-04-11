-- ============================================================================
-- TABLA: historial_login
-- Descripción: Historial de inicios y cierres de sesión de usuarios
-- Nota: Ejecutar este archivo DESPUÉS de estructura.sql
-- ============================================================================

CREATE TABLE historial_login (
    id_historial BIGSERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    usuario_correo VARCHAR(255) NOT NULL,
    usuario_nombre VARCHAR(100) NOT NULL,
    fecha_hora_login TIMESTAMP NOT NULL,
    fecha_hora_logout TIMESTAMP NULL,
    direccion_ip VARCHAR(45) NULL,
    user_agent TEXT NULL,
    exitoso BOOLEAN NOT NULL DEFAULT TRUE,
    fallo_reason VARCHAR(255) NULL,
    duracion_segundos INTEGER NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX historial_l_usuario_2c5cff_idx ON historial_login(usuario_id);
CREATE INDEX historial_l_fecha_h_8fa8ac_idx ON historial_login(fecha_hora_login);
CREATE INDEX historial_l_direcci_1745f7_idx ON historial_login(direccion_ip);
CREATE INDEX historial_l_fecha_h_3d798d_idx ON historial_login(fecha_hora_login DESC, usuario_id);
CREATE INDEX historial_l_exitoso_98cab1_idx ON historial_login(exitoso);

COMMENT ON TABLE historial_login IS 'Historial de inicios y cierres de sesión de usuarios';
COMMENT ON COLUMN historial_login.usuario_id IS 'ID del usuario en la tabla login_usuario (base de datos principal)';
COMMENT ON COLUMN historial_login.usuario_correo IS 'Correo del usuario para referencia rápida';
COMMENT ON COLUMN historial_login.usuario_nombre IS 'Nombre de usuario para referencia rápida';
COMMENT ON COLUMN historial_login.fecha_hora_login IS 'Fecha y hora de inicio de sesión';
COMMENT ON COLUMN historial_login.fecha_hora_logout IS 'Fecha y hora de cierre de sesión';
COMMENT ON COLUMN historial_login.direccion_ip IS 'Dirección IP del usuario (IPv4 o IPv6)';
COMMENT ON COLUMN historial_login.user_agent IS 'User agent del navegador';
COMMENT ON COLUMN historial_login.exitoso IS 'Indica si el login fue exitoso';
COMMENT ON COLUMN historial_login.fallo_reason IS 'Razón del fallo si no fue exitoso';
COMMENT ON COLUMN historial_login.duracion_segundos IS 'Duración de la sesión en segundos';
COMMENT ON COLUMN historial_login.creado_en IS 'Fecha de creación del registro';
