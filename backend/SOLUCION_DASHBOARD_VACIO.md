# 🚨 SOLUCIÓN: Dashboard vacío - Sin datos en historial de login

## Problema
El Dashboard muestra el historial de login vacío porque **no hay datos en la tabla**.

## Solución Paso a Paso

### Paso 1: Verificar si la tabla existe

Ejecuta este SQL en tu base de datos de tienda:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'historial_login';
```

- **Si NO retorna nada**: La tabla no existe. Ve al Paso 2.
- **Si retorna 'historial_login'**: La tabla existe. Ve al Paso 3.

### Paso 2: Crear la tabla

Si la tabla no existe, ejecuta:

```bash
psql -U postgres -d nombre_bd_tienda -f Z_BD/crear_historial_login.sql
```

O ejecuta este SQL directamente:

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

### Paso 3: Insertar datos de prueba

Opción A - **Insertar UN dato simple**:

```bash
psql -U postgres -d nombre_bd_tienda -f Z_BD/insertar_un_dato_prueba.sql
```

Opción B - **Insertar 10 datos de prueba**:

```bash
psql -U postgres -d nombre_bd_tienda -f Z_BD/insertar_datos_prueba_historial_login.sql
```

Opción C - **Insertar datos vía endpoint HTTP**:

```bash
curl -X POST http://tu-dominio.com/api/analytics/test-insertar-historial-login/ \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "tu_usuario",
    "token": "tu_token",
    "subdominio": "tu_subdominio",
    "cantidad": 10
  }'
```

### Paso 4: Verificar los datos

Ejecuta este SQL para verificar que hay datos:

```sql
SELECT COUNT(*) as total_registros 
FROM historial_login;
```

Debería retornar al menos 1 registro.

### Paso 5: Probar el Dashboard

1. **Abre la consola del navegador** (F12)
2. **Ve a la pestaña Console**
3. **Inicia sesión** en el sistema
4. **Haz clic en "Historial de Login"**
5. **Verifica los logs en la consola**:

Deberías ver logs como estos:

```
🔄 Cargando historial de login...
✅ Datos recibidos: {historial: Array(10), grafica: Array(7), estadisticas: {...}}
📈 Historial: 10 registros
📊 Gráfica: 7 puntos
```

### Paso 6: Verificar logs del backend

Si no funciona, verifica los logs de Django:

```bash
tail -f /var/log/django.log
# O donde tengas configurado los logs
```

Deberías ver logs como estos:

```
📊 ENDPOINT HISTORIAL_LOGIN INVOCADO
✅ Tabla existe. Total de registros: 10
📊 Registros en el período: 10
📊 Estadísticas calculadas:
   - Total logins: 10
   - Exitosos: 9
   - Fallidos: 1
```

## Troubleshooting

### Si el endpoint retorna error 500:

1. Verifica que la tabla existe:
   ```sql
   SELECT COUNT(*) FROM historial_login;
   ```

2. Verifica los logs del backend para ver el error específico

### Si no hay datos después de iniciar sesión:

El registro del login actual puede tardar un poco. Inserta datos de prueba primero (Paso 3).

### Si la gráfica se muestra vacía:

1. **Verifica la consola del navegador** para ver errores de JavaScript
2. **Verifica que los datos tengan el formato correcto** en la respuesta del endpoint
3. **Recarga la página** (Ctrl+F5 para forzar reload)

## Archivos creados para ayuda

- ✅ `Z_BD/crear_historial_login.sql` - Crear la tabla
- ✅ `Z_BD/insertar_un_dato_prueba.sql` - Insertar 1 dato
- ✅ `Z_BD/insertar_datos_prueba_historial_login.sql` - Insertar 10 datos
- ✅ `insertar_datos_prueba_historial.py` - Script Python (50 datos)
- ✅ `INSTRUCCIONES_HISTORIAL_LOGIN.md` - Instrucciones completas
