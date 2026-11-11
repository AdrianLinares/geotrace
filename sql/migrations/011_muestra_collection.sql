-- Associate samples with collections for public aggregation and discovery.
ALTER TABLE public.muestra
    ADD COLUMN IF NOT EXISTS coleccion_id bigint;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = 'public.muestra'::regclass
           AND conname = 'fk_muestra_coleccion_id'
    ) THEN
        ALTER TABLE public.muestra
            ADD CONSTRAINT fk_muestra_coleccion_id
            FOREIGN KEY (coleccion_id) REFERENCES public.coleccion(coleccion_id)
            ON DELETE SET NULL;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_muestra_coleccion_id ON public.muestra(coleccion_id);
