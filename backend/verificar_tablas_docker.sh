#!/bin/bash
# Script para verificar y crear la tabla historial_login en todas las bases de datos de tiendas (Docker)

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CONTENEDOR="nova-db-1"
USUARIO="postgres"

echo "========================================================================"
echo "🔍 VERIFICACIÓN DE TABLA historial_login EN TIENDAS (Docker)"
echo "========================================================================"
echo ""

# Obtener lista de bases de datos (excluyendo las del sistema)
echo "📊 Obteniendo lista de bases de datos de tiendas..."
echo ""

DBS=$(docker exec $CONTENEDOR psql -U $USUARIO -t -c "SELECT datname FROM pg_database WHERE datname NOT IN ('postgres', 'template0', 'template1', 'bd_madre', 'cobrappx') ORDER BY datname;" 2>/dev/null)

if [ -z "$DBS" ]; then
    echo -e "${YELLOW}⚠️  No se encontraron bases de datos de tiendas${NC}"
    exit 0
fi

# Convertir la lista en array
DB_ARRAY=($DBS)
TOTAL_DBS=${#DB_ARRAY[@]}

echo -e "${GREEN}✅ Se encontraron $TOTAL_DBS bases de datos de tiendas${NC}"
echo ""

# Contadores
TABLAS_EXISTEN=0
TABLAS_CREADAS=0
TABLAS_ERROR=0

# Iterar sobre cada base de datos
for db in "${DB_ARRAY[@]}"; do
    # Limpiar espacios en blanco
    db=$(echo "$db" | xargs)

    echo "------------------------------------------------------------------------"
    echo -e "🏪 Tienda: ${BLUE}$db${NC}"
    echo "------------------------------------------------------------------------"

    # Verificar si la tabla existe
    TABLE_EXISTS=$(docker exec $CONTENEDOR psql -U $USUARIO -d "$db" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'historial_login');" 2>/dev/null | xargs)

    if [ "$TABLE_EXISTS" = "t" ]; then
        echo -e "${GREEN}✅ La tabla 'historial_login' ya existe${NC}"

        # Contar registros
        COUNT=$(docker exec $CONTENEDOR psql -U $USUARIO -d "$db" -t -c "SELECT COUNT(*) FROM historial_login;" 2>/dev/null | xargs)
        echo -e "📊 Total de registros: ${GREEN}$COUNT${NC}"

        # Mostrar últimos 3 registros si hay alguno
        if [ "$COUNT" -gt 0 ]; then
            echo ""
            echo "📝 Últimos 3 registros:"
            docker exec $CONTENEDOR psql -U $USUARIO -d "$db" -c "SELECT id_historial, usuario_nombre, exitoso, fecha_hora_login FROM historial_login ORDER BY fecha_hora_login DESC LIMIT 3;" 2>/dev/null | tail -n +2 | head -n 3
        fi

        TABLAS_EXISTEN=$((TABLAS_EXISTEN + 1))
    else
        echo -e "${YELLOW}⚠️  La tabla 'historial_login' NO existe${NC}"

        # Crear la tabla automáticamente
        echo "🔧 Creando tabla..."

        docker exec $CONTENEDOR psql -U $USUARIO -d "$db" << 'EOF' 2>/dev/null
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
EOF

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Tabla creada exitosamente${NC}"

            # Insertar dato de prueba
            echo "📝 Insertando dato de prueba..."
            docker exec $CONTENEDOR psql -U $USUARIO -d "$db" -c "INSERT INTO historial_login (usuario_id, usuario_correo, usuario_nombre, fecha_hora_login, direccion_ip, user_agent, exitoso, duracion_segundos) VALUES (1, 'admin@tienda.com', 'admin', NOW(), '127.0.0.1', 'Script de verificación', TRUE, 3600);" 2>/dev/null

            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Dato de prueba insertado${NC}"
            fi

            TABLAS_CREADAS=$((TABLAS_CREADAS + 1))
        else
            echo -e "${RED}❌ Error al crear la tabla${NC}"
            TABLAS_ERROR=$((TABLAS_ERROR + 1))
        fi
    fi

    echo ""
done

echo "========================================================================"
echo -e "${GREEN}✅ VERIFICACIÓN COMPLETADA${NC}"
echo "========================================================================"
echo ""
echo "📊 Resumen:"
echo "  - Total de bases de datos: $TOTAL_DBS"
echo -e "  - Tablas que ya existían: ${GREEN}$TABLAS_EXISTEN${NC}"
echo -e "  - Tablas creadas: ${GREEN}$TABLAS_CREADAS${NC}"
if [ $TABLAS_ERROR -gt 0 ]; then
    echo -e "  - Errores: ${RED}$TABLAS_ERROR${NC}"
fi
echo ""
echo "💡 Ahora puedes probar el login y verificar que se registre en el historial"
echo ""
