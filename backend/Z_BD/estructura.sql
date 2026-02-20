CREATE TABLE main_dashboard_sucursales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(255),
    ciudad VARCHAR(100),
    pais VARCHAR(100),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estatus BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS login_usuario (
    id_login_usuario SERIAL PRIMARY KEY,
    correo_usuario VARCHAR(255) NOT NULL UNIQUE,
    usuario VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(128) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'admin',
    tienda_id INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    token VARCHAR(255),
    id_sucursal_default INTEGER
        REFERENCES main_dashboard_sucursales(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- Tabla de relación many-to-many entre usuarios y bodegas
CREATE TABLE IF NOT EXISTS login_usuario_bodega (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL
        REFERENCES login_usuario(id_login_usuario) ON DELETE CASCADE,
    bodega_id INTEGER NOT NULL
        REFERENCES inventario_bodega(id) ON DELETE CASCADE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_usuario_bodega UNIQUE (usuario_id, bodega_id)
);

CREATE INDEX IF NOT EXISTS idx_usuario_bodega_usuario ON login_usuario_bodega(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_bodega_bodega ON login_usuario_bodega(bodega_id);

COMMENT ON TABLE login_usuario_bodega IS 'Relación many-to-many entre usuarios y bodegas para filtrado de productos';

CREATE TABLE IF NOT EXISTS tipo_documento (
    id        SERIAL PRIMARY KEY,
    nombre    VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO tipo_documento (nombre)
  VALUES ('C.C.'), ('NIT'), ('Pasaporte')
  ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS documento (
    id           SERIAL PRIMARY KEY,
    tipo_id      INTEGER NOT NULL
                 REFERENCES tipo_documento(id)
                   ON DELETE RESTRICT,
    documento    VARCHAR(50) NOT NULL,
    creado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documento_tipo   ON documento(tipo_id);
CREATE INDEX IF NOT EXISTS idx_documento_numero ON documento(documento);

CREATE TABLE IF NOT EXISTS dominios (
    id            SERIAL PRIMARY KEY,
    dominio       VARCHAR(255) NOT NULL UNIQUE,
    es_principal  BOOLEAN     NOT NULL DEFAULT FALSE,
    creado_en     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dominios_dominio ON dominios(dominio);

CREATE TABLE IF NOT EXISTS main_dashboard_categoria (
    id_categoria SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS descuentos (
    id_descuento SERIAL PRIMARY KEY,
    porcentaje NUMERIC(5,2) NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tipos_medida (
    id_tipo_medida SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS main_dashboard_marca (
    id_marca          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS main_dashboard_iva (
    id_iva          SERIAL PRIMARY KEY,
    porcentaje  NUMERIC(5,2) NOT NULL,
    creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- MOVED BEFORE productos to fix FK dependency issue
CREATE TABLE IF NOT EXISTS inventario_bodega (
  id                  SERIAL PRIMARY KEY,
  sucursal_id         INTEGER NOT NULL REFERENCES main_dashboard_sucursales(id) ON DELETE RESTRICT,
  nombre              VARCHAR(100) NOT NULL,
  codigo              VARCHAR(20),
  tipo                CHAR(3) NOT NULL DEFAULT 'SUC',
  direccion           VARCHAR(255),
  es_predeterminada   BOOLEAN NOT NULL DEFAULT FALSE,
  estatus             BOOLEAN NOT NULL DEFAULT TRUE,
  responsable_id      INTEGER REFERENCES login_usuario(id_login_usuario) ON DELETE SET NULL,
  notas               TEXT,
  fecha_creacion      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_bodega_nombre_por_sucursal ON inventario_bodega (sucursal_id, nombre);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_bodega_codigo_por_sucursal ON inventario_bodega (sucursal_id, codigo);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_bodega_predeterminada_por_sucursal
  ON inventario_bodega (sucursal_id) WHERE es_predeterminada = TRUE;

CREATE INDEX IF NOT EXISTS idx_bodega_sucursal_estatus ON inventario_bodega (sucursal_id, estatus);
CREATE INDEX IF NOT EXISTS idx_bodega_sucursal_tipo   ON inventario_bodega (sucursal_id, tipo);

-- productos can now reference inventario_bodega
CREATE TABLE IF NOT EXISTS productos (
    id               SERIAL PRIMARY KEY,
    nombre           VARCHAR(255)      NOT NULL,
    sku              VARCHAR(50)       NOT NULL UNIQUE,
    descripcion      TEXT,
    precio           NUMERIC(10,2)     NOT NULL,
    stock            INTEGER           NOT NULL DEFAULT 0,
    id_categoria     INTEGER REFERENCES main_dashboard_categoria(id_categoria) ON DELETE SET NULL,
    id_marca         INTEGER REFERENCES main_dashboard_marca(id_marca) ON DELETE SET NULL,
    sucursal_id      INTEGER REFERENCES main_dashboard_sucursales(id) ON DELETE SET NULL,
    bodega_id        INTEGER REFERENCES inventario_bodega(id) ON DELETE SET NULL,
    descuento_id     INTEGER REFERENCES descuentos(id_descuento) ON DELETE SET NULL,
    tipo_medida_id   INTEGER REFERENCES tipos_medida(id_tipo_medida) ON DELETE SET NULL,
    codigo_barras    VARCHAR(50),
    imei             VARCHAR(50),
    imagen_producto  VARCHAR(255),
    id_iva           INTEGER REFERENCES main_dashboard_iva(id_iva) ON DELETE SET NULL,
    atributo         VARCHAR(50),
    valor_atributo   VARCHAR(50),
    creado_en        TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS producto_sku_idx ON productos (sku);

CREATE TABLE IF NOT EXISTS inventario_existencia (
  id             SERIAL PRIMARY KEY,
  producto_id    INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  bodega_id      INTEGER NOT NULL REFERENCES inventario_bodega(id) ON DELETE RESTRICT,
  cantidad       INTEGER NOT NULL DEFAULT 0,
  reservado      INTEGER NOT NULL DEFAULT 0,
  minimo         INTEGER NOT NULL DEFAULT 0,
  maximo         INTEGER,
  creado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uniq_existencia_producto_bodega UNIQUE (producto_id, bodega_id),
  CONSTRAINT chk_existencia_nonneg CHECK (cantidad >= 0 AND reservado >= 0)
);
CREATE INDEX IF NOT EXISTS idx_existencia_bodega   ON inventario_existencia (bodega_id);
CREATE INDEX IF NOT EXISTS idx_existencia_producto ON inventario_existencia (producto_id);

CREATE TABLE IF NOT EXISTS inventario_traslado (
  id                SERIAL PRIMARY KEY,
  bodega_origen_id  INTEGER NOT NULL REFERENCES inventario_bodega(id) ON DELETE RESTRICT,
  bodega_destino_id INTEGER NOT NULL REFERENCES inventario_bodega(id) ON DELETE RESTRICT,
  estado            CHAR(3)  NOT NULL DEFAULT 'BOR',
  usar_bodega_transito BOOLEAN NOT NULL DEFAULT TRUE,
  observaciones     TEXT,
  creado_por_id     INTEGER REFERENCES login_usuario(id_login_usuario) ON DELETE SET NULL,
  enviado_en        TIMESTAMP,
  recibido_en       TIMESTAMP,
  creado_en         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_traslado_estado CHECK (estado IN ('BOR','ENV','REC','CAN')),
  CONSTRAINT chk_traslado_bodegas_distintas CHECK (bodega_origen_id <> bodega_destino_id)
);

CREATE TABLE IF NOT EXISTS inventario_traslado_linea (
  id                 SERIAL PRIMARY KEY,
  traslado_id        INTEGER NOT NULL REFERENCES inventario_traslado(id) ON DELETE CASCADE,
  producto_id        INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad           INTEGER NOT NULL,
  cantidad_recibida  INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT uniq_linea_por_producto_en_traslado UNIQUE (traslado_id, producto_id),
  CONSTRAINT chk_linea_cantidades CHECK (cantidad > 0 AND cantidad_recibida >= 0 AND cantidad_recibida <= cantidad)
);
CREATE INDEX IF NOT EXISTS idx_tlin_traslado ON inventario_traslado_linea (traslado_id);
CREATE INDEX IF NOT EXISTS idx_tlin_producto ON inventario_traslado_linea (producto_id);

























CREATE TABLE facturacion_forma_pago (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    requiere_referencia BOOLEAN DEFAULT FALSE NOT NULL,
    permite_cambio BOOLEAN DEFAULT TRUE NOT NULL
);

COMMENT ON TABLE facturacion_forma_pago IS 'Formas de Pago (Efectivo, Tarjetas, Transferencias)';

CREATE TABLE facturacion_cliente (
    id BIGSERIAL PRIMARY KEY,
    tipo_persona VARCHAR(3) DEFAULT 'NAT' NOT NULL,
    primer_nombre VARCHAR(100),
    segundo_nombre VARCHAR(100),
    apellidos VARCHAR(100),
    razon_social VARCHAR(255),
    n_registro_mercantil VARCHAR(100),
    tipo_documento VARCHAR(3),
    numero_documento VARCHAR(50),
    correo VARCHAR(254),
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    ciudad VARCHAR(100),
    limite_credito NUMERIC(12,2) DEFAULT 0 NOT NULL,
    dias_credito INTEGER DEFAULT 0 NOT NULL,
    estatus BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_tipo_persona CHECK (tipo_persona IN ('NAT', 'JUR')),
    CONSTRAINT chk_correo_formato CHECK (correo IS NULL OR correo ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE facturacion_cliente IS 'Clientes (Naturales y Jurídicos)';

CREATE INDEX facturacion_numero_idx ON facturacion_cliente(numero_documento);
CREATE INDEX facturacion_tipo_doc_idx ON facturacion_cliente(tipo_documento, numero_documento);

CREATE TABLE facturacion_config (
    id BIGSERIAL PRIMARY KEY,
    prefijo_factura VARCHAR(10) DEFAULT 'FACT' NOT NULL,
    consecutivo_actual INTEGER DEFAULT 1 NOT NULL,
    longitud_consecutivo INTEGER DEFAULT 6 NOT NULL,
    formato_impresion VARCHAR(10) DEFAULT '80mm' NOT NULL,
    nombre_empresa VARCHAR(255) NOT NULL,
    nit_empresa VARCHAR(50) NOT NULL,
    direccion_empresa VARCHAR(255) NOT NULL,
    telefono_empresa VARCHAR(20) NOT NULL,
    ciudad_empresa VARCHAR(100),
    pie_de_pagina TEXT,
    sucursal_id BIGINT NOT NULL UNIQUE,
    CONSTRAINT check_formato_impresion CHECK (formato_impresion IN ('58mm', '80mm', 'a4'))
);

COMMENT ON TABLE facturacion_config IS 'Configuración de Facturación por Sucursal (numeración, impresión)';

CREATE TABLE facturacion_factura (
    id BIGSERIAL PRIMARY KEY,
    numero_factura VARCHAR(50) UNIQUE NOT NULL,
    estado VARCHAR(3) DEFAULT 'BOR' NOT NULL,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_anulacion TIMESTAMP,
    subtotal NUMERIC(12,2) DEFAULT 0 NOT NULL,
    total_descuento NUMERIC(12,2) DEFAULT 0 NOT NULL,
    total_iva NUMERIC(12,2) DEFAULT 0 NOT NULL,
    total NUMERIC(12,2) DEFAULT 0 NOT NULL,
    total_pagado NUMERIC(12,2) DEFAULT 0 NOT NULL,
    cambio NUMERIC(12,2) DEFAULT 0 NOT NULL,
    observaciones TEXT,
    motivo_anulacion TEXT,
    anulada_por INTEGER,
    bodega_id BIGINT NOT NULL,
    cliente_id BIGINT,
    sucursal_id BIGINT NOT NULL,
    vendedor_id INTEGER,
    CONSTRAINT check_estado_factura CHECK (estado IN ('BOR', 'PAG', 'ANU')),
    CONSTRAINT fk_factura_bodega FOREIGN KEY (bodega_id)
        REFERENCES inventario_bodega(id) ON DELETE RESTRICT,
    CONSTRAINT fk_factura_cliente FOREIGN KEY (cliente_id)
        REFERENCES facturacion_cliente(id) ON DELETE SET NULL,
    CONSTRAINT fk_factura_sucursal FOREIGN KEY (sucursal_id)
        REFERENCES main_dashboard_sucursales(id) ON DELETE RESTRICT,
    CONSTRAINT fk_factura_vendedor FOREIGN KEY (vendedor_id)
        REFERENCES login_usuario(id_login_usuario) ON DELETE SET NULL,
    CONSTRAINT fk_factura_anulada_por FOREIGN KEY (anulada_por)
        REFERENCES login_usuario(id_login_usuario) ON DELETE SET NULL
);

COMMENT ON TABLE facturacion_factura IS 'Cabecera de Facturas';

CREATE INDEX facturacion_numero_factura_idx ON facturacion_factura(numero_factura);
CREATE INDEX facturacion_fecha_venta_idx ON facturacion_factura(fecha_venta);
CREATE INDEX facturacion_estado_idx ON facturacion_factura(estado);
CREATE INDEX facturacion_cliente_idx ON facturacion_factura(cliente_id);

CREATE TABLE facturacion_factura_detalle (
    id BIGSERIAL PRIMARY KEY,
    producto_nombre VARCHAR(255) NOT NULL,
    producto_sku VARCHAR(50) NOT NULL,
    producto_imei VARCHAR(50),
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,
    descuento_porcentaje NUMERIC(5,2) DEFAULT 0 NOT NULL,
    descuento_valor NUMERIC(10,2) DEFAULT 0 NOT NULL,
    iva_porcentaje NUMERIC(5,2) NOT NULL,
    iva_valor NUMERIC(10,2) DEFAULT 0 NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    cantidad_devuelta INTEGER DEFAULT 0 NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    factura_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    CONSTRAINT fk_detalle_factura FOREIGN KEY (factura_id)
        REFERENCES facturacion_factura(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id)
        REFERENCES productos(id) ON DELETE RESTRICT
);

COMMENT ON TABLE facturacion_factura_detalle IS 'Detalles de líneas de productos en facturas';

CREATE INDEX facturacion_detalle_factura_producto_idx ON facturacion_factura_detalle(factura_id, producto_id);

CREATE TABLE facturacion_pago (
    id BIGSERIAL PRIMARY KEY,
    monto NUMERIC(10,2) NOT NULL,
    referencia VARCHAR(100),
    autorizacion VARCHAR(100),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    factura_id BIGINT NOT NULL,
    forma_pago_id BIGINT NOT NULL,
    CONSTRAINT fk_pago_factura FOREIGN KEY (factura_id)
        REFERENCES facturacion_factura(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_forma_pago FOREIGN KEY (forma_pago_id)
        REFERENCES facturacion_forma_pago(id) ON DELETE RESTRICT
);

COMMENT ON TABLE facturacion_pago IS 'Pagos asociados a cada factura';

INSERT INTO facturacion_forma_pago (codigo, nombre, activo, requiere_referencia, permite_cambio) VALUES
('EFE', 'Efectivo', TRUE, FALSE, TRUE),
('TDC', 'Tarjeta de Crédito', TRUE, TRUE, FALSE),
('TDE', 'Tarjeta de Débito', TRUE, TRUE, TRUE),
('TRF', 'Transferencia Bancaria', TRUE, TRUE, FALSE),
('CDP', 'Código QR / Nequi', TRUE, TRUE, FALSE)
ON CONFLICT (codigo) DO NOTHING;

COMMENT ON TABLE facturacion_forma_pago IS 'Formas de pago por defecto del sistema';









-- Tabla de cupones (maestro)
CREATE TABLE cupones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(3) NOT NULL DEFAULT 'PCT',
    valor DECIMAL(10, 2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_vencimiento DATE NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de asignaciones de cupones a clientes
CREATE TABLE cliente_cupones (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL,
    cupon_id INTEGER NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    cantidad_disponible INTEGER NOT NULL DEFAULT 1,
    fecha_uso TIMESTAMP NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (cliente_id, cupon_id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (cupon_id) REFERENCES cupones(id) ON DELETE CASCADE
);

-- Índices recomendados para mejor rendimiento
CREATE INDEX idx_cliente_cupones_cliente ON cliente_cupones(cliente_id);
CREATE INDEX idx_cliente_cupones_cupon ON cliente_cupones(cupon_id);
CREATE INDEX idx_cupones_activos ON cupones(activo);
CREATE INDEX idx_cupones_vencimiento ON cupones(fecha_vencimiento);

-- Comentario sobre las tablas
COMMENT ON TABLE cupones IS 'Cupones de descuento: porcentaje (PCT) o valor fijo (VAL)';
COMMENT ON TABLE cliente_cupones IS 'Asignación de cupones a clientes con control de cantidad disponible';

-- ============================================================
-- TABLA DE CONTACTOS RECIBIDOS DESDE EL FORMULARIO WEB
-- ============================================================
CREATE TABLE IF NOT EXISTS contactos (
    id BIGSERIAL PRIMARY KEY,

    -- Datos del formulario
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(254) NOT NULL,
    mensaje TEXT NOT NULL,

    -- Tracking multitenant
    subdominio VARCHAR(100) NOT NULL,
    tienda_id INTEGER NOT NULL,

    -- Estado y procesamiento
    leido BOOLEAN DEFAULT FALSE,
    respondido BOOLEAN DEFAULT FALSE,
    fecha_respuesta TIMESTAMP,

    -- Metadata para auditoría
    ip_cliente VARCHAR(45),
    user_agent TEXT,
    origen_referer VARCHAR(500),

    -- Timestamps
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_contactos_email ON contactos(email);
CREATE INDEX IF NOT EXISTS idx_contactos_tienda ON contactos(tienda_id);
CREATE INDEX IF NOT EXISTS idx_contactos_subdominio ON contactos(subdominio);
CREATE INDEX IF NOT EXISTS idx_contactos_creado_en ON contactos(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_contactos_leido_respondido ON contactos(leido, respondido);
CREATE INDEX IF NOT EXISTS idx_contactos_sin_responder ON contactos(respondido) WHERE respondido = FALSE;

COMMENT ON TABLE contactos IS 'Mensajes de contacto recibidos desde el formulario web de e-commerce';
