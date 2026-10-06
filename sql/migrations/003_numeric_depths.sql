-- Migrate subsurface and core depth columns from bigint to numeric.
-- Access stores depths as feet+inches and converts them to decimal feet; numeric preserves those
-- decimals exactly instead of rounding to whole feet.
-- This migration is idempotent and does not drop or truncate any data.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'muestra_subsuelo'
           AND column_name = 'profundidad_tope'
           AND data_type = 'bigint'
    ) THEN
        ALTER TABLE public.muestra_subsuelo ALTER COLUMN profundidad_tope TYPE numeric;
    END IF;

    IF EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'muestra_subsuelo'
           AND column_name = 'profundidad_base'
           AND data_type = 'bigint'
    ) THEN
        ALTER TABLE public.muestra_subsuelo ALTER COLUMN profundidad_base TYPE numeric;
    END IF;

    IF EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'nucleo'
           AND column_name = 'profundidad_tope'
           AND data_type = 'bigint'
    ) THEN
        ALTER TABLE public.nucleo ALTER COLUMN profundidad_tope TYPE numeric;
    END IF;

    IF EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'nucleo'
           AND column_name = 'profundidad_base'
           AND data_type = 'bigint'
    ) THEN
        ALTER TABLE public.nucleo ALTER COLUMN profundidad_base TYPE numeric;
    END IF;
END
$$;
