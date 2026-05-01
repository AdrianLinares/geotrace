-- Triggers for automatic auditing on placa, muestra, and other main tables
-- This SQL should be executed in your Supabase SQL Editor.

-- Function to get current user email (if set) or fallback to NULL
CREATE OR REPLACE FUNCTION get_current_user_identifier()
RETURNS TEXT AS $$
BEGIN
  -- Try to get from current_setting (set by app), else from auth.jwt() email
  RETURN COALESCE(
    current_setting('app.current_user_email', TRUE),
    (auth.jwt() ->> 'email')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  v_old JSONB;
  v_new JSONB;
  v_user TEXT;
BEGIN
  v_user := get_current_user_identifier();
  
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO auditoria_cambios (tabla, registro_id, operacion, campo_modificado, valor_anterior, valor_nuevo, usuario_id)
    VALUES (TG_TABLE_NAME, NEW.id::TEXT, 'INSERT', NULL, NULL, row_to_json(NEW)::TEXT, v_user);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Log only if any tracked field changed (simplified: log all updates)
    INSERT INTO auditoria_cambios (tabla, registro_id, operacion, campo_modificado, valor_anterior, valor_nuevo, usuario_id)
    VALUES (TG_TABLE_NAME, NEW.id::TEXT, 'UPDATE', NULL, row_to_json(OLD)::TEXT, row_to_json(NEW)::TEXT, v_user);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO auditoria_cambios (tabla, registro_id, operacion, campo_modificado, valor_anterior, valor_nuevo, usuario_id)
    VALUES (TG_TABLE_NAME, OLD.id::TEXT, 'DELETE', NULL, row_to_json(OLD)::TEXT, NULL, v_user);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to placa (assuming placa_id is the PK; adjust if id column is different)
-- First, drop if exists
DROP TRIGGER IF EXISTS audit_placa_trigger ON placa;
CREATE TRIGGER audit_placa_trigger
AFTER INSERT OR UPDATE OR DELETE ON placa
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Apply trigger to muestra
DROP TRIGGER IF EXISTS audit_muestra_trigger ON muestra;
CREATE TRIGGER audit_muestra_trigger
AFTER INSERT OR UPDATE OR DELETE ON muestra
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Apply trigger to ubicacion_fisica (optional)
DROP TRIGGER IF EXISTS audit_ubicacion_trigger ON ubicacion_fisica;
CREATE TRIGGER audit_ubicacion_trigger
AFTER INSERT OR UPDATE OR DELETE ON ubicacion_fisica
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Apply trigger to coleccion (optional)
DROP TRIGGER IF EXISTS audit_coleccion_trigger ON coleccion;
CREATE TRIGGER audit_coleccion_trigger
AFTER INSERT OR UPDATE OR DELETE ON coleccion
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Note: To make the user identifier work, the application should set:
-- SELECT set_config('app.current_user_email', 'user@example.com', FALSE);
-- before executing queries. This can be done via Supabase RPC or a custom header.
-- Alternatively, modify the trigger to use auth.uid() and join to persona table.
