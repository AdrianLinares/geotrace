-- Add CAT_CUERPO_PLACA_ESTADO catalogue and link it to ESTADO_CONSERVACION_INICIAL.
-- Access references CuerpoPlacaEstadoID from 199 ESTADO_CONSERVACION_INICIAL rows; the 0
-- placeholders are normalized to NULL exactly like other optional foreign keys.
-- This migration is idempotent and does not drop or truncate any data.

CREATE TABLE IF NOT EXISTS public.CAT_CUERPO_PLACA_ESTADO (
    cuerpo_placa_estado_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    cuerpo_placa_estado varchar(255),
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_cuerpo_placa_estado PRIMARY KEY (cuerpo_placa_estado_id)
);

COMMENT ON TABLE public.CAT_CUERPO_PLACA_ESTADO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX IF NOT EXISTS idx_cat_cuerpo_placa_estado_cuerpo_placa_estado_id
    ON public.CAT_CUERPO_PLACA_ESTADO(cuerpo_placa_estado_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'estado_conservacion_inicial'
           AND column_name = 'cuerpo_placa_estado_id'
    ) THEN
        ALTER TABLE public.estado_conservacion_inicial
            ADD COLUMN cuerpo_placa_estado_id bigint;
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint
         WHERE conrelid = 'public.estado_conservacion_inicial'::regclass
           AND conname = 'fk_estado_conservacion_inicial_cuerpo_placa_estado_id'
    ) THEN
        ALTER TABLE public.estado_conservacion_inicial
            ADD CONSTRAINT fk_estado_conservacion_inicial_cuerpo_placa_estado_id
            FOREIGN KEY (cuerpo_placa_estado_id) REFERENCES public.CAT_CUERPO_PLACA_ESTADO(cuerpo_placa_estado_id)
            ON DELETE SET NULL;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_estado_conservacion_inicial_cuerpo_placa_estado_id
    ON public.estado_conservacion_inicial(cuerpo_placa_estado_id);
