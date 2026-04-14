# Instrucciones para configurar el Historial de Login

## Problema: No se guarda el historial de login

El historial de login no se guarda porque **la tabla `historial_login` no existe en las bases de datos de las tiendas**.

## Solución

### Opción 1: Crear la tabla en una tienda específica (SQL directo)

```bash
# Entra a PostgreSQL
psql -U postgres -d nombre_bd_tienda

# O ejecuta el archivo SQL directamente
psql -U postgres -d nombre_bd_tienda -f Z_BD/crear_historial_login.sql
```

### Opción 2: Crear la tabla en todas las tiendas automáticamente

1. Edita el archivo `crear_tabla_historial_en_todas_tiendas.py`:
   ```python
   # Cambia esta línea con tu password de PostgreSQL
   password='tu_password'  # CAMBIAR ESTO
   ```

2. Ejecuta el script:
   ```bash
   cd /home/dagi/nova/backend
   source env/bin/activate
   python crear_tabla_historial_en_todas_tiendas.py
   ```

### Opción 3: Ejecutar el SQL manualmente en cada tienda

Copia y ejecuta este SQL en cada base de datos de tienda:

```sql
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
```

## Verificar que funciona

Una vez creada la tabla, el sistema mostrará logs como estos:

```
✅ Historial de login registrado EXITOSAMENTE. ID: 1
```

Si la tabla no existe, verás este error:

```
❌ ERROR: La tabla 'historial_login' NO EXISTE en la base de datos 'X'
📝 SOLUCIÓN: Ejecuta el siguiente SQL en la base de datos:
   psql -U postgres -d nombre_bd -f Z_BD/crear_historial_login.sql
```

## Ver los registros en el Dashboard

1. Inicia sesión en el sistema
2. Ve al Dashboard
3. Haz clic en el botón "Historial de Login"
4. Verás la gráfica y tabla con los inicios de sesión

## Archivos modificados

- ✅ `login/views.py` - Registra login de admin
- ✅ `main_dashboard/views_auth.py` - Registra login de e-commerce
- ✅ `main_dashboard/models.py` - Modelo HistorialLogin
- ✅ `analytics/views.py` - Endpoint para consultar historial
- ✅ `frontend/src/components/DashboardView.jsx` - Botón y sección
- ✅ `frontend/src/components/dashboard/LoginHistoryChart.jsx` - Gráfica
- ✅ `frontend/src/components/dashboard/LoginHistoryTable.jsx` - Tabla

## Notas importantes

- La tabla se crea en la base de datos de **cada tienda** (tenant), no en la base de datos principal
- Cada inicio de sesión (exitoso o fallido) se registra automáticamente
- Se guarda: IP, user agent, fecha/hora, si fue exitoso, razón del fallo
- Los registros NO se eliminan al hacer logout, solo se actualiza la fecha_hora_logout
