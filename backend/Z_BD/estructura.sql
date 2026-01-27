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
