-- ====================================================
-- Migration: RLS Policies for GeoTrace RBAC Model
-- Version: 1.0.0
-- Description:
--   Implements complete Row-Level Security for all tables
--   based on the RBAC hierarchy:
--     Invitado < Catalogador < Revisor < Curador < Administrador
--
-- Role checks via JWT claim: (auth.jwt() ->> 'role')
-- Supabase admin override:   auth.role() = 'supabase_admin'
--
-- Permission Matrix:
--   SELECT:     auth.role() = 'authenticated' (all tables)
--   Placa-group:  INSERT/DELETE = Revisor+, UPDATE = Catalogador+
--   Catalog-group: INSERT/UPDATE/DELETE = Curador+
--   Pozo-group:    INSERT/UPDATE/DELETE = Administrador only
--   Auditoria:     SELECT = Administrador only, INSERT = authenticated
-- ====================================================

BEGIN;

-- ====================================================
-- 1. ENABLE ROW LEVEL SECURITY on all tables
--    (idempotent — safe to re-run)
-- ====================================================

ALTER TABLE IF EXISTS public.coleccion              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.persona                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.empresa                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mueble                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ubicacion_fisica        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.placa                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.marcado_placa           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.nota_manuscrita         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.muestra                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.muestra_empresa         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.geologia               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.microfauna             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.disposicion_material    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.estado_conservacion     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fuente_dato            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dic_unidad_lito         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sinonimo_unidad_lito    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dic_biozona             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sinonimo_biozona        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dic_edad               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sinonimo_edad           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dic_cuenca             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dic_campo              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dic_contrato           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pozo                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pozo_empresa            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.auditoria_cambios       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.auditoria              ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- 2. DROP EXISTING POLICIES (all of them, to rebuild cleanly)
-- ====================================================

-- Placa
DROP POLICY IF EXISTS allow_select_authenticated ON public.placa;
DROP POLICY IF EXISTS placa_insert_auth ON public.placa;
DROP POLICY IF EXISTS placa_update_catalogador ON public.placa;
DROP POLICY IF EXISTS placa_admin_update ON public.placa;
DROP POLICY IF EXISTS placa_admin_delete ON public.placa;

-- Muestra
DROP POLICY IF EXISTS allow_select_authenticated_muestra ON public.muestra;
DROP POLICY IF EXISTS muestra_insert_auth ON public.muestra;
DROP POLICY IF EXISTS muestra_update_catalogador ON public.muestra;
DROP POLICY IF EXISTS muestra_admin_update ON public.muestra;
DROP POLICY IF EXISTS muestra_admin_delete ON public.muestra;

-- Diccionarios (existing admin-only policies)
DROP POLICY IF EXISTS cuenca_select_authenticated ON public.dic_cuenca;
DROP POLICY IF EXISTS cuenca_admin_insert ON public.dic_cuenca;
DROP POLICY IF EXISTS cuenca_admin_update ON public.dic_cuenca;
DROP POLICY IF EXISTS cuenca_admin_delete ON public.dic_cuenca;
DROP POLICY IF EXISTS campo_select_authenticated ON public.dic_campo;
DROP POLICY IF EXISTS campo_admin_insert ON public.dic_campo;
DROP POLICY IF EXISTS campo_admin_update ON public.dic_campo;
DROP POLICY IF EXISTS campo_admin_delete ON public.dic_campo;
DROP POLICY IF EXISTS contrato_select_authenticated ON public.dic_contrato;
DROP POLICY IF EXISTS contrato_admin_insert ON public.dic_contrato;
DROP POLICY IF EXISTS contrato_admin_update ON public.dic_contrato;
DROP POLICY IF EXISTS contrato_admin_delete ON public.dic_contrato;

-- Pozos
DROP POLICY IF EXISTS pozo_select_authenticated ON public.pozo;
DROP POLICY IF EXISTS pozo_insert_authenticated ON public.pozo;
DROP POLICY IF EXISTS pozo_admin_update ON public.pozo;
DROP POLICY IF EXISTS pozo_admin_delete ON public.pozo;
DROP POLICY IF EXISTS pozo_empresa_select_authenticated ON public.pozo_empresa;
DROP POLICY IF EXISTS pozo_empresa_insert_authenticated ON public.pozo_empresa;
DROP POLICY IF EXISTS pozo_empresa_admin_update ON public.pozo_empresa;
DROP POLICY IF EXISTS pozo_empresa_admin_delete ON public.pozo_empresa;

-- Coleccion
DROP POLICY IF EXISTS coleccion_select_authenticated ON public.coleccion;
DROP POLICY IF EXISTS coleccion_admin_insert ON public.coleccion;
DROP POLICY IF EXISTS coleccion_admin_update ON public.coleccion;
DROP POLICY IF EXISTS coleccion_admin_delete ON public.coleccion;

-- Empresa
DROP POLICY IF EXISTS empresa_select_authenticated ON public.empresa;
DROP POLICY IF EXISTS empresa_admin_insert ON public.empresa;
DROP POLICY IF EXISTS empresa_admin_update ON public.empresa;
DROP POLICY IF EXISTS empresa_admin_delete ON public.empresa;

-- Auditoria
DROP POLICY IF EXISTS audit_read_admin ON public.auditoria;
DROP POLICY IF EXISTS audit_insert_authenticated ON public.auditoria;

-- ====================================================
-- 3. CREATE POLICIES BY GROUP
-- ====================================================

-- ----------------------------------------------------
-- GROUP A: PLACAS-RELATED TABLES
--   Tables: placa, marcado_placa, nota_manuscrita, muestra,
--           muestra_empresa, geologia, microfauna,
--           disposicion_material, estado_conservacion,
--           fuente_dato, ubicacion_fisica
--
--   Rules:
--     SELECT  => auth.role() = 'authenticated'
--     INSERT  => (auth.jwt() ->> 'role') IN ('Revisor','Curador','Administrador')
--                OR auth.role() = 'supabase_admin'
--     UPDATE  => (auth.jwt() ->> 'role') IN ('Catalogador','Revisor','Curador','Administrador')
--                OR auth.role() = 'supabase_admin'
--     DELETE  => (auth.jwt() ->> 'role') IN ('Revisor','Curador','Administrador')
--                OR auth.role() = 'supabase_admin'
-- ----------------------------------------------------

-- placa
DROP POLICY IF EXISTS placa_select_all ON public.placa;
CREATE POLICY placa_select_all ON public.placa
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS placa_insert_revisor_plus ON public.placa;
CREATE POLICY placa_insert_revisor_plus ON public.placa
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS placa_update_catalogador_plus ON public.placa;
CREATE POLICY placa_update_catalogador_plus ON public.placa
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS placa_delete_revisor_plus ON public.placa;
CREATE POLICY placa_delete_revisor_plus ON public.placa
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- marcado_placa
DROP POLICY IF EXISTS marcado_placa_select_all ON public.marcado_placa;
CREATE POLICY marcado_placa_select_all ON public.marcado_placa
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS marcado_placa_insert_revisor_plus ON public.marcado_placa;
CREATE POLICY marcado_placa_insert_revisor_plus ON public.marcado_placa
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS marcado_placa_update_catalogador_plus ON public.marcado_placa;
CREATE POLICY marcado_placa_update_catalogador_plus ON public.marcado_placa
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS marcado_placa_delete_revisor_plus ON public.marcado_placa;
CREATE POLICY marcado_placa_delete_revisor_plus ON public.marcado_placa
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- nota_manuscrita
DROP POLICY IF EXISTS nota_manuscrita_select_all ON public.nota_manuscrita;
CREATE POLICY nota_manuscrita_select_all ON public.nota_manuscrita
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS nota_manuscrita_insert_revisor_plus ON public.nota_manuscrita;
CREATE POLICY nota_manuscrita_insert_revisor_plus ON public.nota_manuscrita
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS nota_manuscrita_update_catalogador_plus ON public.nota_manuscrita;
CREATE POLICY nota_manuscrita_update_catalogador_plus ON public.nota_manuscrita
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS nota_manuscrita_delete_revisor_plus ON public.nota_manuscrita;
CREATE POLICY nota_manuscrita_delete_revisor_plus ON public.nota_manuscrita
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- muestra
DROP POLICY IF EXISTS muestra_select_all ON public.muestra;
CREATE POLICY muestra_select_all ON public.muestra
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS muestra_insert_revisor_plus ON public.muestra;
CREATE POLICY muestra_insert_revisor_plus ON public.muestra
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS muestra_update_catalogador_plus ON public.muestra;
CREATE POLICY muestra_update_catalogador_plus ON public.muestra
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS muestra_delete_revisor_plus ON public.muestra;
CREATE POLICY muestra_delete_revisor_plus ON public.muestra
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- muestra_empresa
DROP POLICY IF EXISTS muestra_empresa_select_all ON public.muestra_empresa;
CREATE POLICY muestra_empresa_select_all ON public.muestra_empresa
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS muestra_empresa_insert_revisor_plus ON public.muestra_empresa;
CREATE POLICY muestra_empresa_insert_revisor_plus ON public.muestra_empresa
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS muestra_empresa_update_catalogador_plus ON public.muestra_empresa;
CREATE POLICY muestra_empresa_update_catalogador_plus ON public.muestra_empresa
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS muestra_empresa_delete_revisor_plus ON public.muestra_empresa;
CREATE POLICY muestra_empresa_delete_revisor_plus ON public.muestra_empresa
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- geologia
DROP POLICY IF EXISTS geologia_select_all ON public.geologia;
CREATE POLICY geologia_select_all ON public.geologia
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS geologia_insert_revisor_plus ON public.geologia;
CREATE POLICY geologia_insert_revisor_plus ON public.geologia
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS geologia_update_catalogador_plus ON public.geologia;
CREATE POLICY geologia_update_catalogador_plus ON public.geologia
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS geologia_delete_revisor_plus ON public.geologia;
CREATE POLICY geologia_delete_revisor_plus ON public.geologia
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- microfauna
DROP POLICY IF EXISTS microfauna_select_all ON public.microfauna;
CREATE POLICY microfauna_select_all ON public.microfauna
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS microfauna_insert_revisor_plus ON public.microfauna;
CREATE POLICY microfauna_insert_revisor_plus ON public.microfauna
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS microfauna_update_catalogador_plus ON public.microfauna;
CREATE POLICY microfauna_update_catalogador_plus ON public.microfauna
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS microfauna_delete_revisor_plus ON public.microfauna;
CREATE POLICY microfauna_delete_revisor_plus ON public.microfauna
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- disposicion_material
DROP POLICY IF EXISTS disposicion_material_select_all ON public.disposicion_material;
CREATE POLICY disposicion_material_select_all ON public.disposicion_material
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS disposicion_material_insert_revisor_plus ON public.disposicion_material;
CREATE POLICY disposicion_material_insert_revisor_plus ON public.disposicion_material
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS disposicion_material_update_catalogador_plus ON public.disposicion_material;
CREATE POLICY disposicion_material_update_catalogador_plus ON public.disposicion_material
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS disposicion_material_delete_revisor_plus ON public.disposicion_material;
CREATE POLICY disposicion_material_delete_revisor_plus ON public.disposicion_material
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- estado_conservacion
DROP POLICY IF EXISTS estado_conservacion_select_all ON public.estado_conservacion;
CREATE POLICY estado_conservacion_select_all ON public.estado_conservacion
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS estado_conservacion_insert_revisor_plus ON public.estado_conservacion;
CREATE POLICY estado_conservacion_insert_revisor_plus ON public.estado_conservacion
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS estado_conservacion_update_catalogador_plus ON public.estado_conservacion;
CREATE POLICY estado_conservacion_update_catalogador_plus ON public.estado_conservacion
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS estado_conservacion_delete_revisor_plus ON public.estado_conservacion;
CREATE POLICY estado_conservacion_delete_revisor_plus ON public.estado_conservacion
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- fuente_dato
DROP POLICY IF EXISTS fuente_dato_select_all ON public.fuente_dato;
CREATE POLICY fuente_dato_select_all ON public.fuente_dato
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS fuente_dato_insert_revisor_plus ON public.fuente_dato;
CREATE POLICY fuente_dato_insert_revisor_plus ON public.fuente_dato
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS fuente_dato_update_catalogador_plus ON public.fuente_dato;
CREATE POLICY fuente_dato_update_catalogador_plus ON public.fuente_dato
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS fuente_dato_delete_revisor_plus ON public.fuente_dato;
CREATE POLICY fuente_dato_delete_revisor_plus ON public.fuente_dato
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- ubicacion_fisica
DROP POLICY IF EXISTS ubicacion_fisica_select_all ON public.ubicacion_fisica;
CREATE POLICY ubicacion_fisica_select_all ON public.ubicacion_fisica
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS ubicacion_fisica_insert_revisor_plus ON public.ubicacion_fisica;
CREATE POLICY ubicacion_fisica_insert_revisor_plus ON public.ubicacion_fisica
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS ubicacion_fisica_update_catalogador_plus ON public.ubicacion_fisica;
CREATE POLICY ubicacion_fisica_update_catalogador_plus ON public.ubicacion_fisica
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS ubicacion_fisica_delete_revisor_plus ON public.ubicacion_fisica;
CREATE POLICY ubicacion_fisica_delete_revisor_plus ON public.ubicacion_fisica
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Revisor', 'Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- ----------------------------------------------------
-- GROUP B: MASTER CATALOGS (diccionarios)
--   Tables: dic_cuenca, dic_campo, dic_contrato,
--           dic_unidad_lito, sinonimo_unidad_lito,
--           dic_biozona, sinonimo_biozona,
--           dic_edad, sinonimo_edad,
--           empresa
--
--   Rules:
--     SELECT  => auth.role() = 'authenticated'
--     INSERT  => (auth.jwt() ->> 'role') IN ('Curador','Administrador')
--                OR auth.role() = 'supabase_admin'
--     UPDATE  => (auth.jwt() ->> 'role') IN ('Curador','Administrador')
--                OR auth.role() = 'supabase_admin'
--     DELETE  => (auth.jwt() ->> 'role') IN ('Curador','Administrador')
--                OR auth.role() = 'supabase_admin'
-- ----------------------------------------------------

-- dic_cuenca
DROP POLICY IF EXISTS dic_cuenca_select_all ON public.dic_cuenca;
CREATE POLICY dic_cuenca_select_all ON public.dic_cuenca
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS dic_cuenca_insert_curador_plus ON public.dic_cuenca;
CREATE POLICY dic_cuenca_insert_curador_plus ON public.dic_cuenca
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS dic_cuenca_update_curador_plus ON public.dic_cuenca;
CREATE POLICY dic_cuenca_update_curador_plus ON public.dic_cuenca
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS dic_cuenca_delete_curador_plus ON public.dic_cuenca;
CREATE POLICY dic_cuenca_delete_curador_plus ON public.dic_cuenca
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- dic_campo
DROP POLICY IF EXISTS dic_campo_select_all ON public.dic_campo;
CREATE POLICY dic_campo_select_all ON public.dic_campo
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS dic_campo_insert_curador_plus ON public.dic_campo;
CREATE POLICY dic_campo_insert_curador_plus ON public.dic_campo
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS dic_campo_update_curador_plus ON public.dic_campo;
CREATE POLICY dic_campo_update_curador_plus ON public.dic_campo
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS dic_campo_delete_curador_plus ON public.dic_campo;
CREATE POLICY dic_campo_delete_curador_plus ON public.dic_campo
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- dic_contrato
DROP POLICY IF EXISTS dic_contrato_select_all ON public.dic_contrato;
CREATE POLICY dic_contrato_select_all ON public.dic_contrato
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS dic_contrato_insert_curador_plus ON public.dic_contrato;
CREATE POLICY dic_contrato_insert_curador_plus ON public.dic_contrato
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS dic_contrato_update_curador_plus ON public.dic_contrato;
CREATE POLICY dic_contrato_update_curador_plus ON public.dic_contrato
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS dic_contrato_delete_curador_plus ON public.dic_contrato;
CREATE POLICY dic_contrato_delete_curador_plus ON public.dic_contrato
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- dic_unidad_lito
DROP POLICY IF EXISTS dic_unidad_lito_select_all ON public.dic_unidad_lito;
CREATE POLICY dic_unidad_lito_select_all ON public.dic_unidad_lito
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS dic_unidad_lito_insert_curador_plus ON public.dic_unidad_lito;
CREATE POLICY dic_unidad_lito_insert_curador_plus ON public.dic_unidad_lito
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS dic_unidad_lito_update_curador_plus ON public.dic_unidad_lito;
CREATE POLICY dic_unidad_lito_update_curador_plus ON public.dic_unidad_lito
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS dic_unidad_lito_delete_curador_plus ON public.dic_unidad_lito;
CREATE POLICY dic_unidad_lito_delete_curador_plus ON public.dic_unidad_lito
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- sinonimo_unidad_lito
DROP POLICY IF EXISTS sinonimo_unidad_lito_select_all ON public.sinonimo_unidad_lito;
CREATE POLICY sinonimo_unidad_lito_select_all ON public.sinonimo_unidad_lito
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS sinonimo_unidad_lito_insert_curador_plus ON public.sinonimo_unidad_lito;
CREATE POLICY sinonimo_unidad_lito_insert_curador_plus ON public.sinonimo_unidad_lito
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS sinonimo_unidad_lito_update_curador_plus ON public.sinonimo_unidad_lito;
CREATE POLICY sinonimo_unidad_lito_update_curador_plus ON public.sinonimo_unidad_lito
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS sinonimo_unidad_lito_delete_curador_plus ON public.sinonimo_unidad_lito;
CREATE POLICY sinonimo_unidad_lito_delete_curador_plus ON public.sinonimo_unidad_lito
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- dic_biozona
DROP POLICY IF EXISTS dic_biozona_select_all ON public.dic_biozona;
CREATE POLICY dic_biozona_select_all ON public.dic_biozona
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS dic_biozona_insert_curador_plus ON public.dic_biozona;
CREATE POLICY dic_biozona_insert_curador_plus ON public.dic_biozona
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS dic_biozona_update_curador_plus ON public.dic_biozona;
CREATE POLICY dic_biozona_update_curador_plus ON public.dic_biozona
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS dic_biozona_delete_curador_plus ON public.dic_biozona;
CREATE POLICY dic_biozona_delete_curador_plus ON public.dic_biozona
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- sinonimo_biozona
DROP POLICY IF EXISTS sinonimo_biozona_select_all ON public.sinonimo_biozona;
CREATE POLICY sinonimo_biozona_select_all ON public.sinonimo_biozona
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS sinonimo_biozona_insert_curador_plus ON public.sinonimo_biozona;
CREATE POLICY sinonimo_biozona_insert_curador_plus ON public.sinonimo_biozona
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS sinonimo_biozona_update_curador_plus ON public.sinonimo_biozona;
CREATE POLICY sinonimo_biozona_update_curador_plus ON public.sinonimo_biozona
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS sinonimo_biozona_delete_curador_plus ON public.sinonimo_biozona;
CREATE POLICY sinonimo_biozona_delete_curador_plus ON public.sinonimo_biozona
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- dic_edad
DROP POLICY IF EXISTS dic_edad_select_all ON public.dic_edad;
CREATE POLICY dic_edad_select_all ON public.dic_edad
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS dic_edad_insert_curador_plus ON public.dic_edad;
CREATE POLICY dic_edad_insert_curador_plus ON public.dic_edad
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS dic_edad_update_curador_plus ON public.dic_edad;
CREATE POLICY dic_edad_update_curador_plus ON public.dic_edad
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS dic_edad_delete_curador_plus ON public.dic_edad;
CREATE POLICY dic_edad_delete_curador_plus ON public.dic_edad
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- sinonimo_edad
DROP POLICY IF EXISTS sinonimo_edad_select_all ON public.sinonimo_edad;
CREATE POLICY sinonimo_edad_select_all ON public.sinonimo_edad
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS sinonimo_edad_insert_curador_plus ON public.sinonimo_edad;
CREATE POLICY sinonimo_edad_insert_curador_plus ON public.sinonimo_edad
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS sinonimo_edad_update_curador_plus ON public.sinonimo_edad;
CREATE POLICY sinonimo_edad_update_curador_plus ON public.sinonimo_edad
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS sinonimo_edad_delete_curador_plus ON public.sinonimo_edad;
CREATE POLICY sinonimo_edad_delete_curador_plus ON public.sinonimo_edad
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- empresa
DROP POLICY IF EXISTS empresa_select_all ON public.empresa;
CREATE POLICY empresa_select_all ON public.empresa
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS empresa_insert_curador_plus ON public.empresa;
CREATE POLICY empresa_insert_curador_plus ON public.empresa
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS empresa_update_curador_plus ON public.empresa;
CREATE POLICY empresa_update_curador_plus ON public.empresa
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS empresa_delete_curador_plus ON public.empresa;
CREATE POLICY empresa_delete_curador_plus ON public.empresa
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- ----------------------------------------------------
-- GROUP C: COLECCIONES
--   Rules: Curador+ for writes (same as master catalogs)
-- ----------------------------------------------------

-- coleccion
DROP POLICY IF EXISTS coleccion_select_all ON public.coleccion;
CREATE POLICY coleccion_select_all ON public.coleccion
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS coleccion_insert_curador_plus ON public.coleccion;
CREATE POLICY coleccion_insert_curador_plus ON public.coleccion
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS coleccion_update_curador_plus ON public.coleccion;
CREATE POLICY coleccion_update_curador_plus ON public.coleccion
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS coleccion_delete_curador_plus ON public.coleccion;
CREATE POLICY coleccion_delete_curador_plus ON public.coleccion
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- ----------------------------------------------------
-- GROUP D: POZOS (read-only for everyone except Admin)
--   Rules:
--     SELECT  => auth.role() = 'authenticated'
--     INSERT  => (auth.jwt() ->> 'role') = 'Administrador'
--                OR auth.role() = 'supabase_admin'
--     UPDATE  => (auth.jwt() ->> 'role') = 'Administrador'
--                OR auth.role() = 'supabase_admin'
--     DELETE  => (auth.jwt() ->> 'role') = 'Administrador'
--                OR auth.role() = 'supabase_admin'
-- ----------------------------------------------------

-- pozo
DROP POLICY IF EXISTS pozo_select_all ON public.pozo;
CREATE POLICY pozo_select_all ON public.pozo
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS pozo_insert_admin_only ON public.pozo;
CREATE POLICY pozo_insert_admin_only ON public.pozo
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'Administrador'
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS pozo_update_admin_only ON public.pozo;
CREATE POLICY pozo_update_admin_only ON public.pozo
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') = 'Administrador'
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'Administrador'
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS pozo_delete_admin_only ON public.pozo;
CREATE POLICY pozo_delete_admin_only ON public.pozo
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') = 'Administrador'
    OR auth.role() = 'supabase_admin'
  );

-- pozo_empresa
DROP POLICY IF EXISTS pozo_empresa_select_all ON public.pozo_empresa;
CREATE POLICY pozo_empresa_select_all ON public.pozo_empresa
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS pozo_empresa_insert_admin_only ON public.pozo_empresa;
CREATE POLICY pozo_empresa_insert_admin_only ON public.pozo_empresa
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'Administrador'
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS pozo_empresa_update_admin_only ON public.pozo_empresa;
CREATE POLICY pozo_empresa_update_admin_only ON public.pozo_empresa
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') = 'Administrador'
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'Administrador'
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS pozo_empresa_delete_admin_only ON public.pozo_empresa;
CREATE POLICY pozo_empresa_delete_admin_only ON public.pozo_empresa
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') = 'Administrador'
    OR auth.role() = 'supabase_admin'
  );

-- ----------------------------------------------------
-- GROUP E: INFRASTRUCTURE / MUEBLE
--   Mueble acts as a catalog of storage furniture.
--   Rules: Curador+ for writes (same as master catalogs)
-- ----------------------------------------------------

-- mueble
DROP POLICY IF EXISTS mueble_select_all ON public.mueble;
CREATE POLICY mueble_select_all ON public.mueble
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS mueble_insert_curador_plus ON public.mueble;
CREATE POLICY mueble_insert_curador_plus ON public.mueble
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS mueble_update_curador_plus ON public.mueble;
CREATE POLICY mueble_update_curador_plus ON public.mueble
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS mueble_delete_curador_plus ON public.mueble;
CREATE POLICY mueble_delete_curador_plus ON public.mueble
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- ----------------------------------------------------
-- GROUP F: PERSONA (employee directory — Curador+ for writes)
--   Per the requirement: persona is listed in the catalogs group.
-- ----------------------------------------------------

-- persona
DROP POLICY IF EXISTS persona_select_all ON public.persona;
CREATE POLICY persona_select_all ON public.persona
  FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS persona_insert_curador_plus ON public.persona;
CREATE POLICY persona_insert_curador_plus ON public.persona
  FOR INSERT TO public
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS persona_update_curador_plus ON public.persona;
CREATE POLICY persona_update_curador_plus ON public.persona
  FOR UPDATE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS persona_delete_curador_plus ON public.persona;
CREATE POLICY persona_delete_curador_plus ON public.persona
  FOR DELETE TO public
  USING (
    (auth.jwt() ->> 'role') IN ('Curador', 'Administrador')
    OR auth.role() = 'supabase_admin'
  );

-- ----------------------------------------------------
-- GROUP G: AUDITORIA TABLES
--   auditoria: SELECT = Admin only, INSERT = authenticated
--   auditoria_cambios: SELECT = Admin only, INSERT = authenticated
--   (UPDATE/DELETE not allowed via RLS — audit trail immutability)
-- ----------------------------------------------------

-- auditoria (re-creating policies from audit.sql with consistent naming)
DROP POLICY IF EXISTS auditoria_select_admin_only ON public.auditoria;
CREATE POLICY auditoria_select_admin_only ON public.auditoria
  FOR SELECT TO public
  USING (
    (auth.jwt() ->> 'role') = 'Administrador'
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS auditoria_insert_authenticated ON public.auditoria;
CREATE POLICY auditoria_insert_authenticated ON public.auditoria
  FOR INSERT TO public
  WITH CHECK (auth.role() = 'authenticated');

-- auditoria_cambios
DROP POLICY IF EXISTS auditoria_cambios_select_admin_only ON public.auditoria_cambios;
CREATE POLICY auditoria_cambios_select_admin_only ON public.auditoria_cambios
  FOR SELECT TO public
  USING (
    (auth.jwt() ->> 'role') = 'Administrador'
    OR auth.role() = 'supabase_admin'
  );

DROP POLICY IF EXISTS auditoria_cambios_insert_authenticated ON public.auditoria_cambios;
CREATE POLICY auditoria_cambios_insert_authenticated ON public.auditoria_cambios
  FOR INSERT TO public
  WITH CHECK (auth.role() = 'authenticated');

-- ====================================================
-- 4. APPLY RLS TO DEFAULT PRIVILEGES (future tables)
-- ====================================================
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;

-- ====================================================
-- 5. VALIDATE — list all policies created
-- ====================================================
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

COMMIT;
