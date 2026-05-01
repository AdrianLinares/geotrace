-- Tabla de Auditoría para registrar operaciones CRUD
-- Ejecutar este script en Supabase después de crear el resto del esquema

CREATE TABLE IF NOT EXISTS auditoria (
  id BIGSERIAL PRIMARY KEY,
  tabla TEXT NOT NULL,
  accion TEXT NOT NULL CHECK (accion IN ('CREATE', 'UPDATE', 'DELETE', 'READ')),
  registro_id TEXT NOT NULL,
  usuario_id UUID,
  usuario_nombre TEXT,
  cambios JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Índices para búsqueda rápida
  CONSTRAINT tabla_registro_idx UNIQUE (tabla, registro_id, timestamp)
);

-- Índices para optimizar consultas comunes
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_tabla ON auditoria(tabla);
CREATE INDEX idx_auditoria_accion ON auditoria(accion);
CREATE INDEX idx_auditoria_timestamp ON auditoria(timestamp DESC);

-- Habilitar RLS (Row-Level Security)
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- Política: solo admins pueden ver/eliminar auditoría
CREATE POLICY audit_read_admin ON auditoria FOR SELECT
  USING (
    auth.role() = 'supabase_admin' OR
    (auth.jwt() ->> 'role') = 'Administrador'
  );

-- Política: cualquier usuario autenticado puede crear registros de auditoría
CREATE POLICY audit_insert_authenticated ON auditoria FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Comentarios
COMMENT ON TABLE auditoria IS 'Registro de auditoría para todas las operaciones CRUD en el sistema';
COMMENT ON COLUMN auditoria.tabla IS 'Nombre de la tabla donde ocurrió la operación';
COMMENT ON COLUMN auditoria.accion IS 'Tipo de operación: CREATE, UPDATE, DELETE, READ';
COMMENT ON COLUMN auditoria.registro_id IS 'ID del registro afectado';
COMMENT ON COLUMN auditoria.usuario_id IS 'ID del usuario (de auth.users)';
COMMENT ON COLUMN auditoria.usuario_nombre IS 'Nombre del usuario para referencia rápida';
COMMENT ON COLUMN auditoria.cambios IS 'JSON con campos antes/después de UPDATE (opcional)';
