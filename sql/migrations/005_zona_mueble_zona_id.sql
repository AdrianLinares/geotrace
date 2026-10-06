-- Add normalized zona_id relationship from ZONA_MUEBLE to CAT_ZONA.
-- NombreZona is preserved as free-text source/display value; zona_id resolves it to the
-- authoritative six-zone catalogue (Izquierda, Central, Derecha, Única, Central Izquierda,
-- Central Derecha). CAT_SECCION remains limited to Superior/Inferior/Única, so only section
-- IDs 1-3 map to CAT_SECCION and local contextual IDs > 3 keep seccion_mueble_id = NULL.
-- This migration is idempotent and does not drop or truncate any data.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'zona_mueble'
           AND column_name = 'zona_id'
    ) THEN
        ALTER TABLE public.ZONA_MUEBLE
            ADD COLUMN zona_id bigint;
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint
         WHERE conrelid = 'public.zona_mueble'::regclass
           AND conname = 'fk_zona_mueble_zona_id'
    ) THEN
        ALTER TABLE public.ZONA_MUEBLE
            ADD CONSTRAINT fk_zona_mueble_zona_id
            FOREIGN KEY (zona_id) REFERENCES public.CAT_ZONA(zona_id)
            ON DELETE SET NULL;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_zona_mueble_zona_id
    ON public.ZONA_MUEBLE(zona_id);
