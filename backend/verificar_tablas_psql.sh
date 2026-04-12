#!/bin/bash
# Script para verificar y crear la tabla historial_login en todas las bases de datos de tiendas

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "========================================================================"
echo "🔍 VERIFICACIÓN DE TABLA historial_login EN TIENDAS"
echo "========================================================================"
echo ""

# Obtener lista de bases de datos de tiendas (excluyendo las bases de datos del sistema)
echo "📊 Obteniendo lista de bases de datos de tiendas..."
echo ""

# Conectar a PostgreSQL y obtener bases de datos que empiezan con 'tienda' o contienen 'tienda'
DBS=$(sudo -u postgres psql -t -c "SELECT datname FROM pg_database WHERE datname LIKE '%tienda%' OR datname LIKE '%Tienda%';" 2>/dev/null)

if [ -z "$DBS" ]; then
    echo -e "${YELLOW}⚠️  No se encontraron bases de datos de tiendas${NC}"
    echo ""
    echo "Posibles razones:"
    echo "  1. No hay tiendas creadas aún"
    echo "  2. Las bases de datos tienen un nombre diferente"
    echo ""
    echo "Para ver todas las bases de datos disponibles, ejecuta:"
    echo "  sudo -u postgres psql -l"
    echo ""
    exit 0
fi

# Convertir la lista en array
DB_ARRAY=($DBS)
TOTAL_DBS=${#DB_ARRAY[@]}

echo -e "${GREEN}✅ Se encontraron $TOTAL_DBS bases de datos de tiendas${NC}"
echo ""

# Iterar sobre cada base de datos
for db in "${DB_ARRAY[@]}"; do
    # Limpiar espacios en blanco
    db=$(echo "$db" | xargs)

    echo "========================================================================"
    echo -e "🏪 Tienda: ${GREEN}$db${NC}"
    echo "========================================================================"

    # Verificar si la tabla existe
    TABLE_EXISTS=$(sudo -u postgres psql -d "$db" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'historial_login');" 2>/dev/null | xargs)

    if [ "$TABLE_EXISTS" = "t" ]; then
        echo -e "${GREEN}✅ La tabla 'historial_login' ya existe${NC}"

        # Contar registros
        COUNT=$(sudo -u postgres psql -d "$db" -t -c "SELECT COUNT(*) FROM historial_login;" 2>/dev/null | xargs)
        echo -e "📊 Total de registros: ${GREEN}$COUNT${NC}"

        # Mostrar últimos 5 registros
        echo ""
        echo "📝 Últimos 5 registros:"
        sudo -u postgres psql -d "$db" -c "SELECT id_historial, usuario_nombre, usuario_correo, exitoso, fecha_hora_login FROM historial_login ORDER BY fecha_hora_login DESC LIMIT 5;" 2>/dev/null
    else
        echo -e "${YELLOW}⚠️  La tabla 'historial_login' NO existe${NC}"
        echo ""
        echo "¿Deseas crear la tabla ahora? (s/n): "
        read -r respuesta

        if [ "$respuesta" = "s" ] || [ "$respuesta" = "S" ]; then
            echo "Creando tabla..."

            # Crear la tabla
            sudo -u postgres psql -d "$db" << 'EOF' 2>/dev/null
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
                echo "Insertando dato de prueba..."
                sudo -u postgres psql -d "$db" -c "INSERT INTO historial_login (usuario_id, usuario_correo, usuario_nombre, fecha_hora_login, direccion_ip, user_agent, exitoso, duracion_segundos) VALUES (1, 'admin@tienda.com', 'admin', NOW(), '127.0.0.1', 'Script de verificación', TRUE, 3600);" 2>/dev/null

                if [ $? -eq 0 ]; then
                    echo -e "${GREEN}✅ Dato de prueba insertado${NC}"
                else
                    echo -e "${RED}❌ Error al insertar dato de prueba${NC}"
                fi
            else
                echo -e "${RED}❌ Error al crear la tabla${NC}"
            fi
        else
            echo "⏭️  Omitiendo esta tienda"
        fi
    fi

    echo ""
done

echo "========================================================================"
echo -e "${GREEN}✅ VERIFICACIÓN COMPLETADA${NC}"
echo "========================================================================"
echo ""
echo "Resumen:"
echo "  - Bases de datos verificadas: $TOTAL_DBS"
echo ""
echo "Para verificar manualmente una base de datos específica:"
echo "  sudo -u postgres psql -d nombre_bd_tienda -c 'SELECT COUNT(*) FROM historial_login;'"
echo ""
