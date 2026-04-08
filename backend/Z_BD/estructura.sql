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

-- Tabla de clientes de e-commerce (clientes_tienda)
CREATE TABLE IF NOT EXISTS clientes_tienda (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'cliente',
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    cliente_id BIGINT,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_rol CHECK (rol IN ('cliente', 'admin', 'vendedor')),
    CONSTRAINT chk_estado CHECK (estado IN ('activo', 'inactivo', 'pendiente'))
);

CREATE INDEX idx_clientes_tienda_email ON clientes_tienda(email);
CREATE INDEX idx_clientes_tienda_estado ON clientes_tienda(estado);
CREATE INDEX idx_clientes_tienda_cliente_id ON clientes_tienda(cliente_id);
CREATE INDEX idx_clientes_tienda_rol ON clientes_tienda(rol);

COMMENT ON TABLE clientes_tienda IS 'Clientes del e-commerce con autenticación';
COMMENT ON COLUMN clientes_tienda.rol IS 'Rol del usuario: cliente, admin, vendedor';
COMMENT ON COLUMN clientes_tienda.estado IS 'Estado del usuario: activo, inactivo, pendiente';

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








CREATE TABLE IF NOT EXISTS cupones (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(3) NOT NULL DEFAULT 'PCT',
    valor NUMERIC(10, 2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_vencimiento DATE NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_cupones_tipo CHECK (tipo IN ('PCT', 'VAL')),
    CONSTRAINT chk_cupones_valor CHECK (valor > 0)
);
CREATE TABLE IF NOT EXISTS cliente_cupones (
    id BIGSERIAL PRIMARY KEY,
    cliente_tienda_id BIGINT,
    cliente_fiscal_id BIGINT,
    cupon_id BIGINT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    cantidad_disponible INTEGER NOT NULL DEFAULT 1,
    fecha_uso TIMESTAMP NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_cupones_cantidad CHECK (cantidad_disponible >= 0),
    CONSTRAINT uq_cliente_cupon_tienda UNIQUE (cliente_tienda_id, cupon_id),
    CONSTRAINT fk_cliente_cupones_clientetienda
        FOREIGN KEY (cliente_tienda_id)
        REFERENCES clientes_tienda(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_cliente_cupones_cliente_fiscal
        FOREIGN KEY (cliente_fiscal_id)
        REFERENCES facturacion_cliente(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_cliente_cupones_cupon
        FOREIGN KEY (cupon_id)
        REFERENCES cupones(id)
        ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cliente_cupones_cliente_tienda ON cliente_cupones(cliente_tienda_id);
CREATE INDEX IF NOT EXISTS idx_cliente_cupones_cliente_fiscal ON cliente_cupones(cliente_fiscal_id);
CREATE INDEX IF NOT EXISTS idx_cliente_cupones_cupon ON cliente_cupones(cupon_id);
CREATE INDEX IF NOT EXISTS idx_cliente_cupones_activos ON cliente_cupones(cliente_tienda_id, activo, cantidad_disponible);
CREATE INDEX IF NOT EXISTS idx_cupones_activos ON cupones(activo);
CREATE INDEX IF NOT EXISTS idx_cupones_vencimiento ON cupones(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_cupones_actualizado_en ON cupones(actualizado_en);
COMMENT ON TABLE cupones IS 'Cupones de descuento: porcentaje (PCT) o valor fijo (VAL)';
COMMENT ON TABLE cliente_cupones IS 'Asignación de cupones a ClienteTienda con control de cantidad disponible';
CREATE TABLE IF NOT EXISTS contactos (
    id BIGSERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(254) NOT NULL,
    mensaje TEXT NOT NULL,
    subdominio VARCHAR(100) NOT NULL,
    tienda_id INTEGER NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    respondido BOOLEAN DEFAULT FALSE,
    fecha_respuesta TIMESTAMP,
    ip_cliente VARCHAR(45),
    user_agent TEXT,
    origen_referer VARCHAR(500),
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_contactos_email ON contactos(email);
CREATE INDEX IF NOT EXISTS idx_contactos_tienda ON contactos(tienda_id);
CREATE INDEX IF NOT EXISTS idx_contactos_subdominio ON contactos(subdominio);
CREATE INDEX IF NOT EXISTS idx_contactos_creado_en ON contactos(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_contactos_leido_respondido ON contactos(leido, respondido);
CREATE INDEX IF NOT EXISTS idx_contactos_sin_responder ON contactos(respondido) WHERE respondido = FALSE;
COMMENT ON TABLE contactos IS 'Mensajes de contacto recibidos desde el formulario web de e-commerce';
CREATE TABLE caja_movimientos (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES login_usuario(id_login_usuario) ON DELETE SET NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida')),
    categoria VARCHAR(30) NOT NULL,
    monto NUMERIC(12,2) NOT NULL,
    metodo_pago VARCHAR(20) NOT NULL DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'transferencia', 'nequi', 'daviplata', 'tarjeta', 'otro')),
    descripcion TEXT NOT NULL,
    factura_id BIGINT REFERENCES facturacion_factura(id) ON DELETE SET NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE
);
CREATE INDEX caja_movimi_fecha_c2145e_idx ON caja_movimientos(fecha, fecha_hora DESC);
CREATE INDEX caja_movimi_tipo_68aa76_idx ON caja_movimientos(tipo, fecha);
CREATE INDEX caja_movimi_metodo__0c788f_idx ON caja_movimientos(metodo_pago, fecha);
COMMENT ON TABLE caja_movimientos IS 'Movimientos de entrada y salida de dinero en caja';
CREATE TABLE caja_arqueos (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES login_usuario(id_login_usuario) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    fecha_hora_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    saldo_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_entradas NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_salidas NUMERIC(12,2) NOT NULL DEFAULT 0,
    saldo_esperado NUMERIC(12,2) NOT NULL,
    monto_contado NUMERIC(12,2) NOT NULL,
    diferencia NUMERIC(12,2) NOT NULL DEFAULT 0,
    observaciones TEXT
);
CREATE INDEX caja_arqueo_fecha_96a707_idx ON caja_arqueos(fecha, fecha_hora_registro DESC);
COMMENT ON TABLE caja_arqueos IS 'Arqueos de caja con comparación de esperado vs contado';

ALTER TABLE facturacion_cliente
ADD COLUMN IF NOT EXISTS en_mora BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fecha_ultimo_pago DATE,
ADD COLUMN IF NOT EXISTS dias_mora INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS observaciones_mora TEXT,
ADD COLUMN IF NOT EXISTS usuario_registro_id INTEGER REFERENCES login_usuario(id_login_usuario) ON DELETE SET NULL;

-- Tabla de Abonos a clientes en mora
CREATE TABLE IF NOT EXISTS facturacion_abono (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES facturacion_cliente(id) ON DELETE CASCADE,
    monto NUMERIC(12,2) NOT NULL,
    metodo_pago VARCHAR(20) NOT NULL DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'transferencia', 'nequi', 'tarjeta', 'otro')),
    referencia VARCHAR(100),
    observaciones TEXT,
    fecha_abono DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_hora_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    registrado_por_id INTEGER REFERENCES login_usuario(id_login_usuario) ON DELETE SET NULL
);

CREATE INDEX idx_abono_cliente ON facturacion_abono(cliente_id);
CREATE INDEX idx_abono_fecha ON facturacion_abono(fecha_abono DESC);

COMMENT ON TABLE facturacion_abono IS 'Abonos o pagos parciales de clientes en mora para reducir su deuda';

ALTER TABLE caja_movimientos
ADD COLUMN IF NOT EXISTS sucursal_id INTEGER;

ALTER TABLE caja_movimientos ADD COLUMN IF NOT EXISTS es_caja_menor BOOLEAN DEFAULT FALSE;

-- Función para marcar automáticamente los movimientos como caja menor según la categoría
CREATE OR REPLACE FUNCTION marcar_caja_menor()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.categoria IN (
        'reembolso_caja_menor', 'venta_caja_menor', 'abono_caja_menor', 'otra_entrada_caja_menor',
        'compra_caja_menor', 'gasto_caja_menor', 'pago_caja_menor', 'otra_salida_caja_menor'
    ) THEN
        NEW.es_caja_menor := true;
    ELSE
        NEW.es_caja_menor := false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar automáticamente la función antes de cada INSERT
DROP TRIGGER IF EXISTS trigger_marcar_caja_menor ON caja_movimientos;
CREATE TRIGGER trigger_marcar_caja_menor
    BEFORE INSERT ON caja_movimientos
    FOR EACH ROW
    EXECUTE FUNCTION marcar_caja_menor();

COMMENT ON FUNCTION marcar_caja_menor() IS 'Marca automáticamente los movimientos como caja menor según la categoría';
COMMENT ON TRIGGER trigger_marcar_caja_menor ON caja_movimientos IS 'Trigger automático para clasificar movimientos de caja menor';

ALTER TABLE facturacion_abono 
ADD COLUMN soporte_pago VARCHAR(255) NULL;
















































-- ============================================================================
-- MÓDULO DE PROVEEDORES - ESTRUCTURA SQL
-- Base de datos: PostgreSQL
-- Charset: UTF-8
-- ============================================================================

-- ============================================================================
-- TABLA: proveedores
-- Descripción: Almacena información general de proveedores
-- ============================================================================
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,

    -- Datos básicos
    nit VARCHAR(50) UNIQUE NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),

    -- Datos de contacto principal
    direccion TEXT,
    ciudad VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Colombia',
    correo_electronico VARCHAR(254),
    telefono VARCHAR(20),
    telefono_whatsapp VARCHAR(20),

    -- Persona de contacto
    contacto_principal VARCHAR(255),
    cargo_contacto VARCHAR(100),

    -- Información web
    sitio_web VARCHAR(500),
    logo_url VARCHAR(500),

    -- Condiciones comerciales
    plazo_pago_dias INTEGER,
    descuento_comercial DECIMAL(5,2) DEFAULT 0,
    limite_credito DECIMAL(12,2) DEFAULT 0,

    -- Estado y calificación
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'bloqueado')),
    calificacion_promedio DECIMAL(3,2) DEFAULT 0,
    numero_calificaciones INTEGER DEFAULT 0,

    -- Observaciones y notas
    observaciones TEXT,

    -- Metadatos
    creado_por_id INTEGER,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones
    CONSTRAINT chk_calificacion_rango CHECK (calificacion_promedio >= 0 AND calificacion_promedio <= 5),
    CONSTRAINT chk_descuento_rango CHECK (descuento_comercial >= 0 AND descuento_comercial <= 100)
);

-- Índices
CREATE INDEX idx_proveedores_razon_social ON proveedores(razon_social);
CREATE INDEX idx_proveedores_nit ON proveedores(nit);
CREATE INDEX idx_proveedores_estado ON proveedores(estado);
CREATE INDEX idx_proveedores_calificacion ON proveedores(calificacion_promedio);
CREATE INDEX idx_proveedores_creado_en ON proveedores(creado_en);

-- Comentario
COMMENT ON TABLE proveedores IS 'Tabla principal de proveedores con información comercial y de contacto';


-- ============================================================================
-- TABLA: proveedor_productos
-- Descripción: Catálogo de productos que surte cada proveedor
-- ============================================================================
CREATE TABLE IF NOT EXISTS proveedor_productos (
    id SERIAL PRIMARY KEY,

    -- Relación con proveedor
    proveedor_id INTEGER NOT NULL,

    -- Datos del producto
    nombre_producto VARCHAR(255) NOT NULL,
    codigo_producto VARCHAR(100),
    descripcion TEXT,

    -- Información de precio y disponibilidad
    precio_unitario DECIMAL(12,2) NOT NULL,
    moneda VARCHAR(10) DEFAULT 'COP',

    -- Datos de compra
    tiempo_entrega_dias INTEGER,
    minimo_pedido INTEGER,

    -- Disponibilidad
    disponible BOOLEAN DEFAULT true,
    stock_actual INTEGER,

    -- Categorización
    categoria VARCHAR(100),

    -- Observaciones
    observaciones TEXT,

    -- Metadatos
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones
    CONSTRAINT fk_proveedor_productos_proveedor
        FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_precio_positivo CHECK (precio_unitario >= 0),
    CONSTRAINT chk_stock_positivo CHECK (stock_actual IS NULL OR stock_actual >= 0)
);

-- Índices
CREATE INDEX idx_proveedor_productos_proveedor_nombre ON proveedor_productos(proveedor_id, nombre_producto);
CREATE INDEX idx_proveedor_productos_disponible ON proveedor_productos(disponible);
CREATE INDEX idx_proveedor_productos_categoria ON proveedor_productos(categoria);

-- Comentario
COMMENT ON TABLE proveedor_productos IS 'Catálogo de productos por proveedor con precios y disponibilidad';


-- ============================================================================
-- TABLA: proveedor_contactos
-- Descripción: Múltiples medios de contacto por proveedor y departamento
-- ============================================================================
CREATE TABLE IF NOT EXISTS proveedor_contactos (
    id SERIAL PRIMARY KEY,

    -- Relación con proveedor
    proveedor_id INTEGER NOT NULL,

    -- Tipo de contacto
    tipo_contacto VARCHAR(20) DEFAULT 'ventas'
        CHECK (tipo_contacto IN ('ventas', 'cobranza', 'soporte', 'logistica', 'direccion', 'otro')),

    -- Datos del contacto
    nombre VARCHAR(255) NOT NULL,
    cargo VARCHAR(100),
    correo_electronico VARCHAR(254),
    telefono VARCHAR(20),
    telefono_whatsapp VARCHAR(20),
    extension VARCHAR(10),

    -- Horario de contacto
    horario_contacto VARCHAR(100),

    -- Notas
    notas TEXT,

    -- Metadatos
    principal BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones
    CONSTRAINT fk_proveedor_contactos_proveedor
        FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id)
        ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_proveedor_contactos_proveedor_tipo ON proveedor_contactos(proveedor_id, tipo_contacto);
CREATE INDEX idx_proveedor_contactos_principal ON proveedor_contactos(principal);
CREATE INDEX idx_proveedor_contactos_activo ON proveedor_contactos(activo);

-- Comentario
COMMENT ON TABLE proveedor_contactos IS 'Múltiples contactos organizados por tipo/departmento';


-- ============================================================================
-- TABLA: proveedor_pedidos
-- Descripción: Historial de pedidos realizados a proveedores
-- ============================================================================
CREATE TABLE IF NOT EXISTS proveedor_pedidos (
    id SERIAL PRIMARY KEY,

    -- Relación con proveedor
    proveedor_id INTEGER NOT NULL,

    -- Datos del pedido
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    fecha_pedido DATE NOT NULL,
    fecha_entrega_estimada DATE,
    fecha_entrega_real DATE,

    -- Montos
    monto_subtotal DECIMAL(12,2) NOT NULL,
    monto_descuento DECIMAL(12,2) DEFAULT 0,
    monto_iva DECIMAL(12,2) DEFAULT 0,
    monto_total DECIMAL(12,2) NOT NULL,

    -- Estado
    estado VARCHAR(20) DEFAULT 'borrador'
        CHECK (estado IN ('borrador', 'solicitado', 'aprobado', 'en_transito', 'recibido', 'cancelado')),

    -- Información adicional
    observaciones TEXT,
    notas_internas TEXT,

    -- Responsables
    solicitado_por_id INTEGER,
    recibido_por_id INTEGER,

    -- Metadatos
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones
    CONSTRAINT fk_proveedor_pedidos_proveedor
        FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_montos_no_negativos CHECK (
        monto_subtotal >= 0 AND
        monto_descuento >= 0 AND
        monto_iva >= 0 AND
        monto_total >= 0
    )
);

-- Índices
CREATE INDEX idx_proveedor_pedidos_proveedor_fecha ON proveedor_pedidos(proveedor_id, fecha_pedido DESC);
CREATE INDEX idx_proveedor_pedidos_numero ON proveedor_pedidos(numero_pedido);
CREATE INDEX idx_proveedor_pedidos_estado ON proveedor_pedidos(estado);
CREATE INDEX idx_proveedor_pedidos_fecha_pedido ON proveedor_pedidos(fecha_pedido DESC);

-- Comentario
COMMENT ON TABLE proveedor_pedidos IS 'Historial de pedidos de compras a proveedores';


-- ============================================================================
-- TABLA: proveedor_pedido_detalles
-- Descripción: Detalles (líneas) de cada pedido a proveedor
-- ============================================================================
CREATE TABLE IF NOT EXISTS proveedor_pedido_detalles (
    id SERIAL PRIMARY KEY,

    -- Relación con pedido
    pedido_id INTEGER NOT NULL,

    -- Producto
    producto_id INTEGER NOT NULL,

    -- Cantidades y precios
    cantidad_solicitada INTEGER NOT NULL,
    cantidad_recibida INTEGER,
    precio_unitario DECIMAL(12,2) NOT NULL,
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0,

    -- Totales
    subtotal DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,

    -- Observaciones
    observaciones TEXT,

    -- Restricciones
    CONSTRAINT fk_pedido_detalles_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES proveedor_pedidos(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_pedido_detalles_producto
        FOREIGN KEY (producto_id)
        REFERENCES proveedor_productos(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_cantidad_positiva CHECK (cantidad_solicitada > 0),
    CONSTRAINT chk_cantidad_recibida_valida CHECK (
        cantidad_recibida IS NULL OR
        cantidad_recibida >= 0 OR
        cantidad_recibida <= cantidad_solicitada
    ),
    CONSTRAINT chk_precios_no_negativos CHECK (
        precio_unitario >= 0 AND
        subtotal >= 0 AND
        total >= 0
    ),
    CONSTRAINT chk_descuento_rango CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100)
);

-- Índice
CREATE INDEX idx_pedido_detalles_pedido ON proveedor_pedido_detalles(pedido_id);
CREATE INDEX idx_pedido_detalles_producto ON proveedor_pedido_detalles(producto_id);

-- Comentario
COMMENT ON TABLE proveedor_pedido_detalles IS 'Líneas de detalle de los pedidos (productos específicos)';


-- ============================================================================
-- TABLA: proveedor_documentos
-- Descripción: Documentación y archivos relacionados con proveedores
-- ============================================================================
CREATE TABLE IF NOT EXISTS proveedor_documentos (
    id SERIAL PRIMARY KEY,

    -- Relación con proveedor
    proveedor_id INTEGER NOT NULL,

    -- Tipo de documento
    tipo_documento VARCHAR(20) DEFAULT 'otro'
        CHECK (tipo_documento IN ('contrato', 'certificado', 'factura', 'catalogo', 'cotizacion', 'otro')),

    -- Descripción
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,

    -- Archivo
    archivo VARCHAR(500),
    url_externa VARCHAR(500),

    -- Fechas importantes
    fecha_emision DATE,
    fecha_vencimiento DATE,

    -- Sistema de alertas
    generar_alerta_vencimiento BOOLEAN DEFAULT false,
    dias_alerta INTEGER,

    -- Metadatos
    subido_por_id INTEGER,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones
    CONSTRAINT fk_proveedor_documentos_proveedor
        FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_dias_alerta CHECK (dias_alerta IS NULL OR dias_alerta > 0),
    CONSTRAINT chk_archivo_o_url CHECK (
        (archivo IS NOT NULL AND url_externa IS NULL) OR
        (archivo IS NULL AND url_externa IS NOT NULL) OR
        (archivo IS NULL AND url_externa IS NULL)
    )
);

-- Índices
CREATE INDEX idx_proveedor_documentos_proveedor_tipo ON proveedor_documentos(proveedor_id, tipo_documento);
CREATE INDEX idx_proveedor_documentos_vencimiento ON proveedor_documentos(fecha_vencimiento);
CREATE INDEX idx_proveedor_documentos_alertas ON proveedor_documentos(generar_alerta_vencimiento) WHERE generar_alerta_vencimiento = true;

-- Comentario
COMMENT ON TABLE proveedor_documentos IS 'Gestión documental de proveedores con sistema de alertas de vencimiento';


-- ============================================================================
-- TABLA: proveedor_calificaciones
-- Descripción: Calificaciones y evaluaciones internas de proveedores
-- ============================================================================
CREATE TABLE IF NOT EXISTS proveedor_calificaciones (
    id SERIAL PRIMARY KEY,

    -- Relación con proveedor
    proveedor_id INTEGER NOT NULL,

    -- Categoría de evaluación
    categoria_evaluacion VARCHAR(20) DEFAULT 'general'
        CHECK (categoria_evaluacion IN ('calidad', 'tiempos_entrega', 'servicio', 'precios', 'general')),

    -- Calificación
    calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),

    -- Comentarios
    comentario TEXT,
    puntos_fuertes TEXT,
    puntos_a_mejorar TEXT,

    -- Referencia al pedido
    pedido_referencia_id INTEGER,

    -- Metadatos
    evaluado_por_id INTEGER,
    fecha_evaluacion DATE NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones
    CONSTRAINT fk_calificaciones_proveedor
        FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_calificaciones_pedido
        FOREIGN KEY (pedido_referencia_id)
        REFERENCES proveedor_pedidos(id)
        ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_proveedor_calificaciones_proveedor_fecha ON proveedor_calificaciones(proveedor_id, fecha_evaluacion DESC);
CREATE INDEX idx_proveedor_calificaciones_categoria ON proveedor_calificaciones(categoria_evaluacion);
CREATE INDEX idx_proveedor_calificaciones_calificacion ON proveedor_calificaciones(calificacion);

-- Comentario
COMMENT ON TABLE proveedor_calificaciones IS 'Evaluaciones internas de proveedores (sistema de 1-5 estrellas)';


-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función: Actualizar calificación promedio del proveedor
CREATE OR REPLACE FUNCTION actualizar_calificacion_proveedor()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE proveedores
    SET calificacion_promedio = (
            SELECT ROUND(AVG(c.calificacion)::numeric, 2)
            FROM proveedor_calificaciones c
            WHERE c.proveedor_id = NEW.proveedor_id
        ),
        numero_calificaciones = (
            SELECT COUNT(*)
            FROM proveedor_calificaciones c
            WHERE c.proveedor_id = NEW.proveedor_id
        ),
        actualizado_en = CURRENT_TIMESTAMP
    WHERE id = NEW.proveedor_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-actualizar calificación cuando se agrega una calificación
DROP TRIGGER IF EXISTS trigger_actualizar_calificacion ON proveedor_calificaciones;
CREATE TRIGGER trigger_actualizar_calificacion
    AFTER INSERT OR UPDATE ON proveedor_calificaciones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_calificacion_proveedor();


-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista: Resumen de proveedores con métricas
CREATE OR REPLACE VIEW vista_resumen_proveedores AS
SELECT
    p.id,
    p.nit,
    p.razon_social,
    p.nombre_comercial,
    p.estado,
    p.ciudad,
    p.correo_electronico,
    p.telefono,
    p.telefono_whatsapp,
    p.calificacion_promedio,
    p.numero_calificaciones,
    p.creado_en,
    COUNT(DISTINCT pp.id) as total_productos,
    COUNT(DISTINCT pc.id) as total_contactos,
    COUNT(DISTINCT ped.id) as total_pedidos,
    COUNT(DISTINCT doc.id) as total_documentos,
    COALESCE(SUM(ped.monto_total), 0) as total_compras,
    COALESCE(MAX(ped.fecha_pedido), NULL) as ultimo_pedido
FROM proveedores p
LEFT JOIN proveedor_productos pp ON p.id = pp.proveedor_id
LEFT JOIN proveedor_contactos pc ON p.id = pc.proveedor_id AND pc.activo = true
LEFT JOIN proveedor_pedidos ped ON p.id = ped.proveedor_id
LEFT JOIN proveedor_documentos doc ON p.id = doc.proveedor_id
GROUP BY p.id, p.nit, p.razon_social, p.nombre_comercial, p.estado, p.ciudad,
         p.correo_electronico, p.telefono, p.telefono_whatsapp, p.calificacion_promedio,
         p.numero_calificaciones, p.creado_en;

-- Comentario
COMMENT ON VIEW vista_resumen_proveedores IS 'Vista resumen con métricas calculadas de proveedores';


-- Vista: Documentos por vencer o vencidos
CREATE OR REPLACE VIEW vista_alertas_documentos_proveedores AS
SELECT
    doc.id,
    doc.proveedor_id,
    p.razon_social as proveedor_nombre,
    doc.tipo_documento,
    doc.titulo,
    doc.fecha_vencimiento,
    doc.generar_alerta_vencimiento,
    doc.dias_alerta,
    CASE
        WHEN doc.fecha_vencimiento < CURRENT_DATE THEN 'vencido'
        WHEN doc.fecha_vencimiento <= CURRENT_DATE + (COALESCE(doc.dias_alerta, 30) || ' days')::interval THEN 'proximo_a_vencer'
        ELSE 'vigente'
    END as estado_documento,
    (CURRENT_DATE - doc.fecha_vencimiento)::integer as dias_vencido
FROM proveedor_documentos doc
JOIN proveedores p ON doc.proveedor_id = p.id
WHERE doc.fecha_vencimiento IS NOT NULL
  AND doc.generar_alerta_vencimiento = true;

-- Comentario
COMMENT ON VIEW vista_alertas_documentos_proveedores IS 'Alertas de documentos próximos a vencer o vencidos';


-- Vista: Proveedores mejor calificados
CREATE OR REPLACE VIEW vista_top_proveedores AS
SELECT
    p.id,
    p.nit,
    p.razon_social,
    p.ciudad,
    p.calificacion_promedio,
    p.numero_calificaciones,
    COALESCE(SUM(ped.monto_total), 0) as total_compras,
    COUNT(DISTINCT ped.id) as total_pedidos,
    ROW_NUMBER() OVER (ORDER BY p.calificacion_promedio DESC, p.numero_calificaciones DESC) as posicion_calificacion,
    ROW_NUMBER() OVER (ORDER BY SUM(ped.monto_total) DESC NULLS LAST) as posicion_compras
FROM proveedores p
LEFT JOIN proveedor_pedidos ped ON p.id = ped.proveedor_id AND ped.estado != 'cancelado'
WHERE p.calificacion_promedio > 0
GROUP BY p.id, p.nit, p.razon_social, p.ciudad, p.calificacion_promedio, p.numero_calificaciones
ORDER BY p.calificacion_promedio DESC, p.numero_calificaciones DESC;

-- Comentario
COMMENT ON VIEW vista_top_proveedores IS 'Ranking de proveedores por calificación y volumen de compras';


-- ============================================================================
-- DATOS DE EJEMPLO (OPTIONAL)
-- ============================================================================

-- Ejemplo: Insertar un proveedor de prueba
INSERT INTO proveedores (
    nit, razon_social, nombre_comercial, direccion, ciudad, pais,
    correo_electronico, telefono, telefono_whatsapp, contacto_principal,
    cargo_contacto, sitio_web, plazo_pago_dias, descuento_comercial,
    limite_credito, estado, observaciones
) VALUES (
    '900123456-1',
    'TECHNOLOGIES SAS',
    'TechProveedores',
    'Calle 123 #45-67, Edificio Empresarial',
    'Bogotá',
    'Colombia',
    'contacto@technologies.com',
    '573001234567',
    '573001234567',
    'Juan Carlos Pérez',
    'Gerente Comercial',
    'https://technologies.com',
    30,
    5.00,
    50000000,
    'activo',
    'Proveedor confiable con entrega oportuna'
);

-- Ejemplo: Insertar un producto para el proveedor
INSERT INTO proveedor_productos (
    proveedor_id, nombre_producto, codigo_producto, descripcion,
    precio_unitario, moneda, tiempo_entrega_dias, minimo_pedido,
    disponible, categoria
) VALUES (
    1,
    'Laptop HP 15.6"',
    'LAP-HP-156',
    'Laptop HP 15.6 pulgadas, Intel i5, 8GB RAM, 256GB SSD',
    2500000.00,
    'COP',
    5,
    10,
    true,
    'Computadores'
);

-- Ejemplo: Insertar un contacto
INSERT INTO proveedor_contactos (
    proveedor_id, tipo_contacto, nombre, cargo, correo_electronico,
    telefono, telefono_whatsapp, principal
) VALUES (
    1,
    'ventas',
    'María Rodríguez',
    'Ejecutiva de Ventas',
    'maria.rodriguez@technologies.com',
    '573001234568',
    '573001234568',
    true
);

-- Ejemplo: Insertar un pedido
INSERT INTO proveedor_pedidos (
    proveedor_id, numero_pedido, fecha_pedido, fecha_entrega_estimada,
    monto_subtotal, monto_descuento, monto_iva, monto_total, estado
) VALUES (
    1,
    'PED-20260319-001',
    '2026-03-19',
    '2026-03-26',
    25000000.00,
    1250000.00,
    0.00,
    23750000.00,
    'solicitado'
);

-- Ejemplo: Insertar una calificación
INSERT INTO proveedor_calificaciones (
    proveedor_id, categoria_evaluacion, calificacion, comentario,
    puntos_fuertes, puntos_a_mejorar, fecha_evaluacion
) VALUES (
    1,
    'calidad',
    5,
    'Excelente calidad de productos',
    'Productos de alta calidad, buena presentación',
    'Podrían mejorar en la variedad de productos',
    '2026-03-19'
);


-- ============================================================================
-- FIN DEL SCRIPT SQL
-- ============================================================================

















-- Crear tabla de variantes de productos
CREATE TABLE producto_variantes (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE NOT NULL,
    
    -- Características de la variante
    talla VARCHAR(50),
    color VARCHAR(100),
    color_hex VARCHAR(7),
    medida VARCHAR(100),
    
    -- SKU único para la variante
    sku_variante VARCHAR(50) UNIQUE NOT NULL,
    
    -- Stock y precio
    stock INTEGER DEFAULT 0 NOT NULL,
    precio DECIMAL(10, 2) NULL,
    
    -- Estado
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    es_predeterminado BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- Imagen específica
    imagen_variante VARCHAR(255) NULL,
    
    -- Observaciones
    observaciones TEXT NULL,
    
    -- Timestamps
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_variante_producto ON producto_variantes(producto_id);
CREATE INDEX idx_variante_color ON producto_variantes(producto_id, color);
CREATE INDEX idx_variante_talla ON producto_variantes(producto_id, talla);
CREATE INDEX idx_variante_sku ON producto_variantes(sku_variante);
CREATE INDEX idx_variante_activo ON producto_variantes(activo);

-- Comentario en la tabla
COMMENT ON TABLE producto_variantes IS 'Variantes de productos con diferentes tallas, colores y medidas';

-- Comentarios en las columnas
COMMENT ON COLUMN producto_variantes.producto_id IS 'Producto base al que pertenece la variante';
COMMENT ON COLUMN producto_variantes.talla IS 'Talla de la variante (S, M, L, XL, 38, 40, etc.)';
COMMENT ON COLUMN producto_variantes.color IS 'Nombre del color (Rojo, Azul, etc.)';
COMMENT ON COLUMN producto_variantes.color_hex IS 'Código HEX del color (#FF5733)';
COMMENT ON COLUMN producto_variantes.medida IS 'Medida de la variante (10x20cm, 500ml, 1kg, etc.)';
COMMENT ON COLUMN producto_variantes.sku_variante IS 'SKU único para identificar la variante';
COMMENT ON COLUMN producto_variantes.stock IS 'Stock específico de esta variante';
COMMENT ON COLUMN producto_variantes.precio IS 'Precio diferencial de la variante (si es null usa el precio del producto base)';
COMMENT ON COLUMN producto_variantes.activo IS 'Indica si la variante está activa';
COMMENT ON COLUMN producto_variantes.es_predeterminado IS 'Marcar como variante por defecto';
COMMENT ON COLUMN producto_variantes.imagen_variante IS 'URL de imagen específica de esta variante';

