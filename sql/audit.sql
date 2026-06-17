-- ============================================================
-- Tabla de auditoría unificada
-- ============================================================
-- Registra cada operación DML (INSERT, UPDATE, DELETE) que dispare
-- la función audit_trigger_func() definida en sql/triggers.sql.
-- Solo los administradores pueden leer la pista de auditoría.
-- ============================================================

-- Limpiar tabla anterior si existiera (esquema anterior)
DROP TABLE IF EXISTS public.auditoria_cambios CASCADE;
DROP TABLE IF EXISTS public.auditoria CASCADE;

CREATE TABLE public.auditoria (
  auditoria_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tabla text NOT NULL,
  operacion text NOT NULL CHECK (operacion IN ('INSERT','UPDATE','DELETE')),
  registro_id bigint NOT NULL,
  usuario_id uuid REFERENCES auth.users(id),
  cambios jsonb,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.auditoria IS 'Pista de auditoría unificada para operaciones DML.';
COMMENT ON COLUMN public.auditoria.tabla IS 'Tabla donde ocurrió la operación.';
COMMENT ON COLUMN public.auditoria.operacion IS 'Tipo de operación: INSERT, UPDATE o DELETE.';
COMMENT ON COLUMN public.auditoria.registro_id IS 'Valor de la clave primaria del registro afectado.';
COMMENT ON COLUMN public.auditoria.usuario_id IS 'Identificador de auth.users que realizó la operación.';
COMMENT ON COLUMN public.auditoria.cambios IS 'JSON con los valores del registro (old/new en UPDATE).';

-- Índices básicos para consultas de auditoría
CREATE INDEX idx_auditoria_tabla ON public.auditoria(tabla);
CREATE INDEX idx_auditoria_operacion ON public.auditoria(operacion);
CREATE INDEX idx_auditoria_registro_id ON public.auditoria(registro_id);
CREATE INDEX idx_auditoria_usuario_id ON public.auditoria(usuario_id);
CREATE INDEX idx_auditoria_created_at ON public.auditoria(created_at DESC);

-- RLS: solo administradores pueden leer la auditoría
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS auditoria_select_admin_only ON public.auditoria;
CREATE POLICY auditoria_select_admin_only ON public.auditoria
  FOR SELECT TO authenticated
  USING (current_user_has_role('Administrador'));

-- Los inserts los realiza el trigger SECURITY DEFINER, que ignora RLS.
