-- Validación del esquema de cupones
-- Este script verifica que las tablas de cupones tengan la estructura correcta

DO $$
DECLARE
    issues TEXT := '';
    total_issues INTEGER := 0;
BEGIN
    -- Check 1: cupones table exists
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cupones') THEN
        issues := issues || E'\n- Table "cupones" does not exist';
        total_issues := total_issues + 1;
    END IF;

    -- Check 2: cliente_cupones table exists
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cliente_cupones') THEN
        issues := issues || E'\n- Table "cliente_cupones" does not exist';
        total_issues := total_issues + 1;
    END IF;

    -- Check 3: clientes_tienda table exists (required for FK)
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'clientes_tienda') THEN
        issues := issues || E'\n- Table "clientes_tienda" does not exist (required for FK)';
        total_issues := total_issues + 1;
    END IF;

    -- Check 4: facturacion_cliente table exists (required for FK)
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'facturacion_cliente') THEN
        issues := issues || E'\n- Table "facturacion_cliente" does not exist (required for FK)';
        total_issues := total_issues + 1;
    END IF;

    -- Check 5: No FK to non-existent 'clientes' table
    IF EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.confrelid = t.oid
        WHERE c.conrelid = 'cliente_cupones'::regclass
        AND t.relname = 'clientes'
    ) THEN
        issues := issues || E'\n- Incorrect FK to "clientes" table detected (should be "clientes_tienda" or "facturacion_cliente")';
        total_issues := total_issues + 1;
    END IF;

    -- Check 6: Correct FK to clientes_tienda exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'cliente_cupones'::regclass
        AND conname = 'fk_cliente_cupones_clientetienda'
    ) THEN
        issues := issues || E'\n- Missing FK "fk_cliente_cupones_clientetienda" to clientes_tienda';
        total_issues := total_issues + 1;
    END IF;

    -- Check 7: Correct FK to facturacion_cliente exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'cliente_cupones'::regclass
        AND conname = 'fk_cliente_cupones_cliente_fiscal'
    ) THEN
        issues := issues || E'\n- Missing FK "fk_cliente_cupones_cliente_fiscal" to facturacion_cliente';
        total_issues := total_issues + 1;
    END IF;

    -- Check 8: Check constraints on cupones
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'cupones'::regclass
        AND conname = 'chk_cupones_tipo'
    ) THEN
        issues := issues || E'\n- Missing check constraint "chk_cupones_tipo" on cupones';
        total_issues := total_issues + 1;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'cupones'::regclass
        AND conname = 'chk_cupones_valor'
    ) THEN
        issues := issues || E'\n- Missing check constraint "chk_cupones_valor" on cupones';
        total_issues := total_issues + 1;
    END IF;

    -- Check 9: Required indexes exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'cliente_cupones'
        AND indexname = 'idx_cliente_cupones_activos'
    ) THEN
        issues := issues || E'\n- Missing index "idx_cliente_cupones_activos" (affects query performance)';
        total_issues := total_issues + 1;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'cupones'
        AND indexname = 'idx_cupones_vencimiento'
    ) THEN
        issues := issues || E'\n- Missing index "idx_cupones_vencimiento" (affects query performance)';
        total_issues := total_issues + 1;
    END IF;

    -- Report results
    IF total_issues = 0 THEN
        RAISE NOTICE '✅ VALIDATION PASSED: Coupon schema is healthy';
    ELSE
        RAISE NOTICE '❌ VALIDATION FAILED: % issues found:%', total_issues, issues;
    END IF;
END $$;

-- Detailed schema report
SELECT
    'SCHEMA REPORT' as report_type,
    tablename as table_name,
    CASE
        WHEN tablename = 'cupones' THEN 'Master coupon table'
        WHEN tablename = 'cliente_cupones' THEN 'Client-coupon relationships'
        ELSE 'Other'
    END as description
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%cupon%'
ORDER BY tablename;

-- Foreign keys report
SELECT
    'FOREIGN KEYS' as report_type,
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_tables t ON c.conrelid = t.tablename::regclass
WHERE t.tablename LIKE '%cupon%'
AND t.schemaname = 'public'
AND c.contype = 'f'
ORDER BY t.tablename, conname;

-- Check constraints report
SELECT
    'CHECK CONSTRAINTS' as report_type,
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_tables t ON c.conrelid = t.tablename::regclass
WHERE t.tablename LIKE '%cupon%'
AND t.schemaname = 'public'
AND c.contype = 'c'
ORDER BY t.tablename, conname;

-- Indexes report
SELECT
    'INDEXES' as report_type,
    indexname as index_name,
    pg_get_indexdef(i.oid) as definition
FROM pg_indexes i
WHERE tablename LIKE '%cupon%'
AND schemaname = 'public'
ORDER BY tablename, indexname;
