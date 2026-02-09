-- Script para crear existencias faltantes
-- Crea registros en inventario_existencia para cada producto en cada bodega
-- que no tengan ya un registro

INSERT INTO inventario_existencia (producto_id, bodega_id, cantidad, reservado, minimo, creado_en, actualizado_en)
SELECT DISTINCT
    p.id as producto_id,
    b.id as bodega_id,
    0 as cantidad,
    0 as reservado,
    0 as minimo,
    NOW() as creado_en,
    NOW() as actualizado_en
FROM productos p
CROSS JOIN inventario_bodega b
WHERE NOT EXISTS (
    SELECT 1
    FROM inventario_existencia e
    WHERE e.producto_id = p.id
    AND e.bodega_id = b.id
);
