-- Local backend audit trail. Rows are written by the authenticated Fastify
-- backend, which already knows the application persona performing the action.
CREATE TABLE IF NOT EXISTS public.auditoria (
    auditoria_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tabla text NOT NULL,
    operacion text NOT NULL CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'IMPORT')),
    registro_id text,
    persona_id bigint REFERENCES public.persona(persona_id) ON DELETE SET NULL,
    cambios jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON public.auditoria(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_persona_id ON public.auditoria(persona_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabla_operacion ON public.auditoria(tabla, operacion);
