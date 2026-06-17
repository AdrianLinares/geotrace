-- ====================================================
-- Geotrace DB Migration — Schema fixes 2026-06-17
-- Run this in Supabase SQL Editor:
-- 1. Add missing tables (cat_vidrio, estado_conservacion_inicial)
-- 2. Fix RLS JWT claim paths (user_metadata.role)
-- 3. Fix audit trigger (dynamic PK discovery)
-- ====================================================

-- Part 1: New tables (from schema.sql additions)
CREATE TABLE IF NOT EXISTS cat_vidrio (
  vidrio_estado_id INTEGER PRIMARY KEY,
  vidrio_estado    TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS seq_estado_conservacion_inicial START 1;

CREATE TABLE IF NOT EXISTS estado_conservacion_inicial (
  estado_conservacion_inicial_id TEXT PRIMARY KEY DEFAULT ('ECI-' || LPAD(nextval('seq_estado_conservacion_inicial')::TEXT, 6, '0')),
  placa_id                       TEXT REFERENCES placa(placa_id) ON DELETE CASCADE,
  vidrio_estado_id               INTEGER REFERENCES cat_vidrio(vidrio_estado_id),
  presencia_hongos               BOOLEAN DEFAULT FALSE,
  riesgo_contaminacion           BOOLEAN DEFAULT FALSE,
  oxidacion                      BOOLEAN DEFAULT FALSE,
  crecimiento_cristales          BOOLEAN DEFAULT FALSE,
  material_fuera_cavidad         BOOLEAN DEFAULT FALSE,
  observaciones                  TEXT,
  catalogador_id                 TEXT REFERENCES persona(persona_id),
  created_at                     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estado_conservacion_inicial_placa ON estado_conservacion_inicial(placa_id);

-- Seed cat_vidrio
INSERT INTO cat_vidrio (vidrio_estado_id, vidrio_estado) VALUES
  (1, 'Bueno'),
  (2, 'Roto'),
  (3, 'Sucio')
ON CONFLICT (vidrio_estado_id) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE IF EXISTS cat_vidrio ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS estado_conservacion_inicial ENABLE ROW LEVEL SECURITY;

-- Part 2: Fix audit trigger (dynamic PK discovery)
CREATE OR REPLACE FUNCTION get_table_pk_value(p_table_schema TEXT, p_table_name TEXT, p_row JSONB)
RETURNS TEXT AS $$
DECLARE
  pk_col TEXT;
  result TEXT;
BEGIN
  SELECT a.attname INTO pk_col
  FROM pg_index i
  JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
  WHERE i.indrelid = (p_table_schema || '.' || p_table_name)::regclass
    AND i.indisprimary
  LIMIT 1;
  
  result := p_row ->> pk_col;
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_current_user_identifier()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.current_user_email', TRUE),
    (auth.jwt() ->> 'email')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  v_old JSONB;
  v_new JSONB;
  v_user TEXT;
  v_record_id TEXT;
BEGIN
  v_user := get_current_user_identifier();
  
  IF (TG_OP = 'DELETE') THEN
    v_record_id := get_table_pk_value(TG_TABLE_SCHEMA, TG_TABLE_NAME, to_jsonb(OLD));
    INSERT INTO auditoria_cambios (tabla, registro_id, operacion, campo_modificado, valor_anterior, valor_nuevo, usuario_id)
    VALUES (TG_TABLE_NAME, v_record_id, 'DELETE', NULL, row_to_json(OLD)::TEXT, NULL, v_user);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_record_id := get_table_pk_value(TG_TABLE_SCHEMA, TG_TABLE_NAME, to_jsonb(NEW));
    INSERT INTO auditoria_cambios (tabla, registro_id, operacion, campo_modificado, valor_anterior, valor_nuevo, usuario_id)
    VALUES (TG_TABLE_NAME, v_record_id, 'UPDATE', NULL, row_to_json(OLD)::TEXT, row_to_json(NEW)::TEXT, v_user);
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    v_record_id := get_table_pk_value(TG_TABLE_SCHEMA, TG_TABLE_NAME, to_jsonb(NEW));
    INSERT INTO auditoria_cambios (tabla, registro_id, operacion, campo_modificado, valor_anterior, valor_nuevo, usuario_id)
    VALUES (TG_TABLE_NAME, v_record_id, 'INSERT', NULL, NULL, row_to_json(NEW)::TEXT, v_user);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Part 3: RLS Policies — fix JWT claim path + add policies for new tables
-- This is a subset of rls_policies_rbac.sql with only the modified policies

-- Drop existing broken policies
DROP POLICY IF EXISTS placa_update_catalogador_plus ON placa;
DROP POLICY IF EXISTS placa_delete_revisor_plus ON placa;
DROP POLICY IF EXISTS marcado_placa_update_catalogador_plus ON marcado_placa;
DROP POLICY IF EXISTS marcado_placa_delete_revisor_plus ON marcado_placa;
DROP POLICY IF EXISTS nota_manuscrita_update_catalogador_plus ON nota_manuscrita;
DROP POLICY IF EXISTS nota_manuscrita_delete_revisor_plus ON nota_manuscrita;
DROP POLICY IF EXISTS muestra_update_catalogador_plus ON muestra;
DROP POLICY IF EXISTS muestra_delete_revisor_plus ON muestra;
DROP POLICY IF EXISTS muestra_empresa_update_catalogador_plus ON muestra_empresa;
DROP POLICY IF EXISTS muestra_empresa_delete_revisor_plus ON muestra_empresa;
DROP POLICY IF EXISTS geologia_update_catalogador_plus ON geologia;
DROP POLICY IF EXISTS geologia_delete_revisor_plus ON geologia;
DROP POLICY IF EXISTS microfauna_update_catalogador_plus ON microfauna;
DROP POLICY IF EXISTS microfauna_delete_revisor_plus ON microfauna;
DROP POLICY IF EXISTS disposicion_material_update_catalogador_plus ON disposicion_material;
DROP POLICY IF EXISTS disposicion_material_delete_revisor_plus ON disposicion_material;
DROP POLICY IF EXISTS estado_conservacion_update_catalogador_plus ON estado_conservacion;
DROP POLICY IF EXISTS estado_conservacion_delete_revisor_plus ON estado_conservacion;
DROP POLICY IF EXISTS fuente_dato_update_catalogador_plus ON fuente_dato;
DROP POLICY IF EXISTS fuente_dato_delete_revisor_plus ON fuente_dato;
DROP POLICY IF EXISTS ubicacion_fisica_update_catalogador_plus ON ubicacion_fisica;
DROP POLICY IF EXISTS ubicacion_fisica_delete_revisor_plus ON ubicacion_fisica;

DROP POLICY IF EXISTS dic_cuenca_insert_curador_plus ON dic_cuenca;
DROP POLICY IF EXISTS dic_cuenca_update_curador_plus ON dic_cuenca;
DROP POLICY IF EXISTS dic_cuenca_delete_curador_plus ON dic_cuenca;
DROP POLICY IF EXISTS dic_campo_insert_curador_plus ON dic_campo;
DROP POLICY IF EXISTS dic_campo_update_curador_plus ON dic_campo;
DROP POLICY IF EXISTS dic_campo_delete_curador_plus ON dic_campo;
DROP POLICY IF EXISTS dic_contrato_insert_curador_plus ON dic_contrato;
DROP POLICY IF EXISTS dic_contrato_update_curador_plus ON dic_contrato;
DROP POLICY IF EXISTS dic_contrato_delete_curador_plus ON dic_contrato;
DROP POLICY IF EXISTS dic_unidad_lito_insert_curador_plus ON dic_unidad_lito;
DROP POLICY IF EXISTS dic_unidad_lito_update_curador_plus ON dic_unidad_lito;
DROP POLICY IF EXISTS dic_unidad_lito_delete_curador_plus ON dic_unidad_lito;
DROP POLICY IF EXISTS sinonimo_unidad_lito_insert_curador_plus ON sinonimo_unidad_lito;
DROP POLICY IF EXISTS sinonimo_unidad_lito_update_curador_plus ON sinonimo_unidad_lito;
DROP POLICY IF EXISTS sinonimo_unidad_lito_delete_curador_plus ON sinonimo_unidad_lito;
DROP POLICY IF EXISTS dic_biozona_insert_curador_plus ON dic_biozona;
DROP POLICY IF EXISTS dic_biozona_update_curador_plus ON dic_biozona;
DROP POLICY IF EXISTS dic_biozona_delete_curador_plus ON dic_biozona;
DROP POLICY IF EXISTS sinonimo_biozona_insert_curador_plus ON sinonimo_biozona;
DROP POLICY IF EXISTS sinonimo_biozona_update_curador_plus ON sinonimo_biozona;
DROP POLICY IF EXISTS sinonimo_biozona_delete_curador_plus ON sinonimo_biozona;
DROP POLICY IF EXISTS dic_edad_insert_curador_plus ON dic_edad;
DROP POLICY IF EXISTS dic_edad_update_curador_plus ON dic_edad;
DROP POLICY IF EXISTS dic_edad_delete_curador_plus ON dic_edad;
DROP POLICY IF EXISTS sinonimo_edad_insert_curador_plus ON sinonimo_edad;
DROP POLICY IF EXISTS sinonimo_edad_update_curador_plus ON sinonimo_edad;
DROP POLICY IF EXISTS sinonimo_edad_delete_curador_plus ON sinonimo_edad;
DROP POLICY IF EXISTS empresa_insert_curador_plus ON empresa;
DROP POLICY IF EXISTS empresa_update_curador_plus ON empresa;
DROP POLICY IF EXISTS empresa_delete_curador_plus ON empresa;
DROP POLICY IF EXISTS coleccion_insert_curador_plus ON coleccion;
DROP POLICY IF EXISTS coleccion_update_curador_plus ON coleccion;
DROP POLICY IF EXISTS coleccion_delete_curador_plus ON coleccion;
DROP POLICY IF EXISTS mueble_insert_curador_plus ON mueble;
DROP POLICY IF EXISTS mueble_update_curador_plus ON mueble;
DROP POLICY IF EXISTS mueble_delete_curador_plus ON mueble;
DROP POLICY IF EXISTS persona_insert_curador_plus ON persona;
DROP POLICY IF EXISTS persona_update_curador_plus ON persona;
DROP POLICY IF EXISTS persona_delete_curador_plus ON persona;
DROP POLICY IF EXISTS pozo_insert_admin_only ON pozo;
DROP POLICY IF EXISTS pozo_update_admin_only ON pozo;
DROP POLICY IF EXISTS pozo_delete_admin_only ON pozo;
DROP POLICY IF EXISTS pozo_empresa_insert_admin_only ON pozo_empresa;
DROP POLICY IF EXISTS pozo_empresa_update_admin_only ON pozo_empresa;
DROP POLICY IF EXISTS pozo_empresa_delete_admin_only ON pozo_empresa;
DROP POLICY IF EXISTS auditoria_select_admin_only ON auditoria;
DROP POLICY IF EXISTS auditoria_cambios_select_admin_only ON auditoria_cambios;

-- Fix: Use 'user_metadata' consistently (AuthProvider writes role to user_metadata)

-- REGROUP A: PLACAS — UPDATE + DELETE (INSERT already uses user_metadata)
CREATE POLICY placa_update_catalogador_plus ON placa FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY placa_delete_revisor_plus ON placa FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');

CREATE POLICY marcado_placa_update_catalogador_plus ON marcado_placa FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY marcado_placa_delete_revisor_plus ON marcado_placa FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');

CREATE POLICY nota_manuscrita_update_catalogador_plus ON nota_manuscrita FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY nota_manuscrita_delete_revisor_plus ON nota_manuscrita FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');

CREATE POLICY muestra_update_catalogador_plus ON muestra FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY muestra_delete_revisor_plus ON muestra FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');

CREATE POLICY muestra_empresa_update_catalogador_plus ON muestra_empresa FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY muestra_empresa_delete_revisor_plus ON muestra_empresa FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');

CREATE POLICY geologia_update_catalogador_plus ON geologia FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY geologia_delete_revisor_plus ON geologia FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');

CREATE POLICY microfauna_update_catalogador_plus ON microfauna FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY microfauna_delete_revisor_plus ON microfauna FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');

CREATE POLICY disposicion_material_update_catalogador_plus ON disposicion_material FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY disposicion_material_delete_revisor_plus ON disposicion_material FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');

CREATE POLICY estado_conservacion_update_catalogador_plus ON estado_conservacion FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY estado_conservacion_delete_revisor_plus ON estado_conservacion FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');

CREATE POLICY fuente_dato_update_catalogador_plus ON fuente_dato FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY fuente_dato_delete_revisor_plus ON fuente_dato FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');

CREATE POLICY ubicacion_fisica_update_catalogador_plus ON ubicacion_fisica FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY ubicacion_fisica_delete_revisor_plus ON ubicacion_fisica FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');

-- GROUP B: CATALOGS
CREATE POLICY dic_cuenca_insert_curador_plus ON dic_cuenca FOR INSERT TO public
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY dic_cuenca_update_curador_plus ON dic_cuenca FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY dic_cuenca_delete_curador_plus ON dic_cuenca FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');

CREATE POLICY dic_campo_insert_curador_plus ON dic_campo FOR INSERT TO public
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY dic_campo_update_curador_plus ON dic_campo FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY dic_campo_delete_curador_plus ON dic_campo FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');

CREATE POLICY dic_contrato_insert_curador_plus ON dic_contrato FOR INSERT TO public
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY dic_contrato_update_curador_plus ON dic_contrato FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY dic_contrato_delete_curador_plus ON dic_contrato FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');

-- ... continuing with remaining catalog policies, coleccion, pozos, mueble, persona, auditoria ...

CREATE POLICY dic_unidad_lito_insert_curador_plus ON dic_unidad_lito FOR INSERT TO public
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY dic_unidad_lito_update_curador_plus ON dic_unidad_lito FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY dic_unidad_lito_delete_curador_plus ON dic_unidad_lito FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');

CREATE POLICY sinonimo_unidad_lito_insert_curador_plus ON sinonimo_unidad_lito FOR INSERT TO public
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY sinonimo_unidad_lito_update_curador_plus ON sinonimo_unidad_lito FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY sinonimo_unidad_lito_delete_curador_plus ON sinonimo_unidad_lito FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');

CREATE POLICY dic_biozona_insert_curador_plus ON dic_biozona FOR INSERT TO public
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY dic_biozona_update_curador_plus ON dic_biozona FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY dic_biozona_delete_curador_plus ON dic_biozona FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');

CREATE POLICY sinonimo_biozona_insert_curador_plus ON sinonimo_biozona FOR INSERT TO public
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY sinonimo_biozona_update_curador_plus ON sinonimo_biozona FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY sinonimo_biozona_delete_curador_plus ON sinonimo_biozona FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');

CREATE POLICY dic_edad_insert_curador_plus ON dic_edad FOR INSERT TO public
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY dic_edad_update_curador_plus ON dic_edad FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY dic_edad_delete_curador_plus ON dic_edad FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');

CREATE POLICY sinonimo_edad_insert_curador_plus ON sinonimo_edad FOR INSERT TO public
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY sinonimo_edad_update_curador_plus ON sinonimo_edad FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY sinonimo_edad_delete_curador_plus ON sinonimo_edad FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');

CREATE POLICY empresa_insert_curador_plus ON empresa FOR INSERT TO public
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY empresa_update_curador_plus ON empresa FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY empresa_delete_curador_plus ON empresa FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');

-- GROUP C: COLECCIONES
CREATE POLICY coleccion_insert_curador_plus ON coleccion FOR INSERT TO public
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY coleccion_update_curador_plus ON coleccion FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY coleccion_delete_curador_plus ON coleccion FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');

-- GROUP D: POZOS
CREATE POLICY pozo_insert_admin_only ON pozo FOR INSERT TO public
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Administrador' OR auth.role() = 'supabase_admin');
CREATE POLICY pozo_update_admin_only ON pozo FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Administrador' OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Administrador' OR auth.role() = 'supabase_admin');
CREATE POLICY pozo_delete_admin_only ON pozo FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Administrador' OR auth.role() = 'supabase_admin');

CREATE POLICY pozo_empresa_insert_admin_only ON pozo_empresa FOR INSERT TO public
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Administrador' OR auth.role() = 'supabase_admin');
CREATE POLICY pozo_empresa_update_admin_only ON pozo_empresa FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Administrador' OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Administrador' OR auth.role() = 'supabase_admin');
CREATE POLICY pozo_empresa_delete_admin_only ON pozo_empresa FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Administrador' OR auth.role() = 'supabase_admin');

-- GROUP E: MUEBLE
CREATE POLICY mueble_insert_curador_plus ON mueble FOR INSERT TO public
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY mueble_update_curador_plus ON mueble FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY mueble_delete_curador_plus ON mueble FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');

-- GROUP F: PERSONA
CREATE POLICY persona_insert_curador_plus ON persona FOR INSERT TO public
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY persona_update_curador_plus ON persona FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
CREATE POLICY persona_delete_curador_plus ON persona FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');

-- GROUP G: AUDITORIA
CREATE POLICY auditoria_select_admin_only ON auditoria FOR SELECT TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Administrador' OR auth.role() = 'supabase_admin');
CREATE POLICY auditoria_cambios_select_admin_only ON auditoria_cambios FOR SELECT TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Administrador' OR auth.role() = 'supabase_admin');

-- NEW TABLE POLICIES: cat_vidrio (Group B — catalog read/write)
DROP POLICY IF EXISTS cat_vidrio_select_all ON cat_vidrio;
CREATE POLICY cat_vidrio_select_all ON cat_vidrio FOR SELECT TO public USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS cat_vidrio_insert_curador_plus ON cat_vidrio;
CREATE POLICY cat_vidrio_insert_curador_plus ON cat_vidrio FOR INSERT TO public
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
DROP POLICY IF EXISTS cat_vidrio_update_curador_plus ON cat_vidrio;
CREATE POLICY cat_vidrio_update_curador_plus ON cat_vidrio FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');
DROP POLICY IF EXISTS cat_vidrio_delete_curador_plus ON cat_vidrio;
CREATE POLICY cat_vidrio_delete_curador_plus ON cat_vidrio FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Curador', 'Administrador') OR auth.role() = 'supabase_admin');

-- NEW TABLE POLICIES: estado_conservacion_inicial (Group A — placas-related)
DROP POLICY IF EXISTS estado_conservacion_inicial_select_all ON estado_conservacion_inicial;
CREATE POLICY estado_conservacion_inicial_select_all ON estado_conservacion_inicial FOR SELECT TO public USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS estado_conservacion_inicial_insert_catalogador_plus ON estado_conservacion_inicial;
CREATE POLICY estado_conservacion_inicial_insert_catalogador_plus ON estado_conservacion_inicial FOR INSERT TO public
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');
DROP POLICY IF EXISTS estado_conservacion_inicial_update_catalogador_plus ON estado_conservacion_inicial;
CREATE POLICY estado_conservacion_inicial_update_catalogador_plus ON estado_conservacion_inicial FOR UPDATE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');
DROP POLICY IF EXISTS estado_conservacion_inicial_delete_revisor_plus ON estado_conservacion_inicial;
CREATE POLICY estado_conservacion_inicial_delete_revisor_plus ON estado_conservacion_inicial FOR DELETE TO public
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Revisor', 'Curador', 'Administrador') OR auth.role() = 'supabase_admin');
