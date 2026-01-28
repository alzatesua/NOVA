-- ==========================================
-- SQL PARA POSTGRESQL - TABLAS DE FACTURACIÓN
-- Sistema de Facturación POS
-- Generado desde Django migration 0006
-- ==========================================

-- 1. TABLA: facturacion_forma_pago (Formas de Pago)
-- ================================================
CREATE TABLE facturacion_forma_pago (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    requiere_referencia BOOLEAN DEFAULT FALSE NOT NULL,
    permite_cambio BOOLEAN DEFAULT TRUE NOT NULL
);

COMMENT ON TABLE facturacion_forma_pago IS 'Formas de Pago (Efectivo, Tarjetas, Transferencias)';

-- 2. TABLA: facturacion_cliente (Clientes)
-- ==========================================
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
    CONSTRAINT check_tipo_persona CHECK (tipo_persona IN ('NAT', 'JUR'))
);

COMMENT ON TABLE facturacion_cliente IS 'Clientes (Naturales y Jurídicos)';

-- Índices para cliente
CREATE INDEX facturacion_numero_idx ON facturacion_cliente(numero_documento);
CREATE INDEX facturacion_tipo_doc_idx ON facturacion_cliente(tipo_documento, numero_documento);

-- 3. TABLA: facturacion_config (Configuración de Facturación)
-- =======================================================
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

-- 4. TABLA: facturacion_factura (Cabecera de Facturas)
-- ======================================================
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
        REFERENCES auth_user(id) ON DELETE SET NULL
);

COMMENT ON TABLE facturacion_factura IS 'Cabecera de Facturas';

-- Índices para factura
CREATE INDEX facturacion_numero_factura_idx ON facturacion_factura(numero_factura);
CREATE INDEX facturacion_fecha_venta_idx ON facturacion_factura(fecha_venta);
CREATE INDEX facturacion_estado_idx ON facturacion_factura(estado);
CREATE INDEX facturacion_cliente_idx ON facturacion_factura(cliente_id);

-- 5. TABLA: facturacion_factura_detalle (Detalles de Factura)
-- ===========================================================
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
        REFERENCES main_dashboard_producto(id) ON DELETE RESTRICT
);

COMMENT ON TABLE facturacion_factura_detalle IS 'Detalles de líneas de productos en facturas';

-- Índice para detalles
CREATE INDEX facturacion_detalle_factura_producto_idx ON facturacion_factura_detalle(factura_id, producto_id);

-- 6. TABLA: facturacion_pago (Pagos de Factura)
-- ============================================
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

-- 7. TABLA: inventario_traslado (Traslados entre bodegas)
-- =====================================================
CREATE TABLE inventario_traslado (
    id BIGSERIAL PRIMARY KEY,
    estado VARCHAR(3) DEFAULT 'BOR' NOT NULL,
    usar_bodega_transito BOOLEAN DEFAULT TRUE NOT NULL,
    observaciones TEXT,
    enviado_en TIMESTAMP,
    recibido_en TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    bodega_destino_id BIGINT NOT NULL,
    bodega_origen_id BIGINT NOT NULL,
    creado_por_id INTEGER,
    CONSTRAINT check_estado_traslado CHECK (estado IN ('BOR', 'ENV', 'REC', 'CAN')),
    CONSTRAINT fk_traslado_bodega_destino FOREIGN KEY (bodega_destino_id)
        REFERENCES inventario_bodega(id) ON DELETE RESTRICT,
    CONSTRAINT fk_traslado_bodega_origen FOREIGN KEY (bodega_origen_id)
        REFERENCES inventario_bodega(id) ON DELETE RESTRICT,
    CONSTRAINT fk_traslado_creado_por FOREIGN KEY (creado_por_id)
        REFERENCES auth_user(id) ON DELETE SET NULL
);

COMMENT ON TABLE inventario_traslado IS 'Traslados de stock entre bodegas';

-- 8. TABLA: inventario_traslado_linea (Líneas de Traslado)
-- ==========================================================
CREATE TABLE inventario_traslado_linea (
    id BIGSERIAL PRIMARY KEY,
    cantidad INTEGER NOT NULL,
    cantidad_recibida INTEGER DEFAULT 0 NOT NULL,
    producto_id BIGINT NOT NULL,
    traslado_id BIGINT NOT NULL,
    CONSTRAINT fk_traslado_linea_producto FOREIGN KEY (producto_id)
        REFERENCES main_dashboard_producto(id) ON DELETE RESTRICT,
    CONSTRAINT fk_traslado_linea_traslado FOREIGN KEY (traslado_id)
        REFERENCES inventario_traslado(id) ON DELETE CASCADE,
    CONSTRAINT uniq_linea_por_producto_en_traslado UNIQUE (traslado_id, producto_id)
);

COMMENT ON TABLE inventario_traslado_linea IS 'Líneas de productos en traslados';

-- Índices para traslado línea
CREATE INDEX inventorio_traslado_linea_traslado_idx ON inventario_traslado_linea(traslado_id);
CREATE INDEX inventorio_traslado_linea_producto_idx ON inventorio_traslado_linea(producto_id);

-- ==========================================
-- DATOS SEMILLA: FORMAS DE PAGO
-- ==========================================

INSERT INTO facturacion_forma_pago (codigo, nombre, activo, requiere_referencia, permite_cambio) VALUES
('EFE', 'Efectivo', TRUE, FALSE, TRUE),
('TDC', 'Tarjeta de Crédito', TRUE, TRUE, FALSE),
('TDE', 'Tarjeta de Débito', TRUE, TRUE, TRUE),
('TRF', 'Transferencia Bancaria', TRUE, TRUE, FALSE),
('CDP', 'Código QR / Nequi', TRUE, TRUE, FALSE);

COMMENT ON TABLE facturacion_forma_pago IS 'Formas de pago por defecto del sistema';

-- ==========================================
-- FINALIZAR
-- ==========================================
-- Para verificar las tablas creadas:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public'
--   AND tablename LIKE 'facturacion%' OR tablename LIKE '%traslado%';
