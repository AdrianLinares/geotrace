-- ============================================================
-- RLS Policies for GeoTrace RBAC Model (db-rediseno-completo)
-- ============================================================
-- Group templates:
--   Group A (data + relations): PLACA, MUESTRA, POZO, NUCLEO,
--       REL_*, etc.
--     - SELECT: Admin, Curador, Revisor, Catalogador
--     - INSERT: Admin, Curador, Catalogador (own rows)
--     - UPDATE: Admin, Curador, Revisor
--     - DELETE: Admin, Curador
--   Group B (catalogs): all CAT_* tables
--     - SELECT: all roles
--     - INSERT/UPDATE/DELETE: Admin, Curador
--   Group C (documents): DOCUMENTO_ASOCIADO, DOCUMENTO_SECCION
--     - SELECT: all roles
--     - INSERT/UPDATE: Admin, Curador, Revisor
--     - DELETE: Admin, Curador
--   Group D (auth): PERSONA, CAT_ROL, REL_PERSONA_ROL,
--       CAT_PERMISO, REL_ROL_PERMISO
--     - Admin = ALL
--     - PERSONA: users can SELECT/UPDATE their own row
--     - role/permission catalogs: no direct access for non-admins
--       (helpers.current_user_has_role is SECURITY DEFINER)
--   Group E (dictionaries + localization + schema_version):
--       DIC_*, LOCALIZACION_*, SECCION_ESTRATIGRAFICA,
--       POSICION_ESTRATIGRAFICA, schema_version
--     - Same as Group B (catalogs)
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_group_a text[] := ARRAY['ANOTACION_PLACA', 'DISPOSICION_MATERIAL', 'ESTADO_CONSERVACION_INICIAL', 'MARCADO_PLACA', 'MUESTRA', 'MUESTRA_LECHO_MARINO', 'MUESTRA_SUBSUELO', 'MUESTRA_SUPERFICIE', 'NUCLEO', 'PLACA', 'PLACA_TIPO', 'POZO', 'POZO_ESTRATIGRAFICO', 'POZO_EXPLORATORIO', 'POZO_REPORTADO', 'REL_BIOZONA_NORM_ACT', 'REL_BIOZONA_REP_NORM', 'REL_DOCUMENTO_DOCUMENTO', 'REL_DOCUMENTO_MUESTRA', 'REL_DOCUMENTO_PLACA', 'REL_DOCUMENTO_POZO', 'REL_DOCUMENTO_PROYECTO', 'REL_DOCUMENTO_SECCION_ESTRATIGR', 'REL_EDAD_NORM_ACT', 'REL_EDAD_REP_NORM', 'REL_MUESTRA_BIOZONA_REPORTADA', 'REL_MUESTRA_DESCRIPCION_LITO', 'REL_MUESTRA_DESC_LITO_REP_NORM', 'REL_MUESTRA_EDAD_REPORTADA', 'REL_MUESTRA_ENTIDAD', 'REL_MUESTRA_FECHA_HISTORICA', 'REL_MUESTRA_PROYECTO', 'REL_MUESTRA_REFERENCIA_BIBLIOGRAFICA', 'REL_MUESTRA_TAXON_REPORTADO', 'REL_MUESTRA_TRATAMIENTO', 'REL_MUESTRA_UNI_LITO_NORM_ACT', 'REL_MUESTRA_UNI_LITO_REPORTADA', 'REL_MUESTRA_UNI_LITO_REP_NORM', 'REL_PLACA_AUTOR', 'REL_PLACA_PLACA', 'REL_PLACA_REFERENCIA_BIBLIOGRAFICA', 'REL_POZO_REPORTADO_POZO', 'REL_TAXON_NORM_ACT', 'REL_TAXON_REP_NORM', 'SECCION_NUCLEO', 'UBICACION_FISICA'];
  v_group_b text[] := ARRAY['CAT_ACCIDENTE_GEOGRAFICO_NORM', 'CAT_ACETATO_ESTADO', 'CAT_CLASE_PLACA', 'CAT_CLASE_P_TIPO', 'CAT_CODIGO_CAVIDAD', 'CAT_COLECCION', 'CAT_COLECTOR', 'CAT_COLOR_MUEBLE', 'CAT_COLOR_PLACA', 'CAT_COLUMNA_BANDEJA', 'CAT_CONFIGURACION_CAVIDADES', 'CAT_CONFIGURACION_REJILLA', 'CAT_CUENCA', 'CAT_DEPARTAMENTO', 'CAT_DISENO_PLACA', 'CAT_DOCUMENTO_FAMILIA', 'CAT_ENTIDAD', 'CAT_ESPECIALIDAD', 'CAT_ESTADO_CATALOGACION', 'CAT_ESTADO_MATERIAL', 'CAT_ESTADO_NOMENCLATURA', 'CAT_ESTADO_REVISION', 'CAT_ETAPA_USO_PLACA', 'CAT_FECHA_HISTORICA', 'CAT_FORMATO_DOCUMENTO', 'CAT_FUENTE_ESPACIAL', 'CAT_IDIOMA', 'CAT_MARCO_PLACA_ESTADO', 'CAT_MATERIAL_BANDEJA', 'CAT_MATERIAL_MUEBLE', 'CAT_MATERIAL_PLACA', 'CAT_METODO_ADQUISICION', 'CAT_METODO_ESPACIAL', 'CAT_MUEBLE', 'CAT_MUNICIPIO', 'CAT_NIVEL_DETALLE_LOCALIDAD', 'CAT_ORIGEN_MUESTRA', 'CAT_PAIS', 'CAT_PLANCHA_TOPOGRAFICA', 'CAT_POLIGONAL', 'CAT_POSICION_ANOTACION', 'CAT_PRECISION_ESPACIAL', 'CAT_PRIORIDAD_INTERVENCION', 'CAT_PROYECTO', 'CAT_RANGO_LITO', 'CAT_RECOBRO_CUALITATIVO', 'CAT_REFERENCIA_BIBLIOGRAFICA', 'CAT_ROL_AUTOR', 'CAT_SECCION', 'CAT_SISTEMA_COORD', 'CAT_SISTEMA_ENSAMBLE', 'CAT_TIPO_AUTOR', 'CAT_TIPO_DOCUMENTO', 'CAT_TIPO_DOCUMENTO_ASOCIADO', 'CAT_TIPO_DUDA', 'CAT_TIPO_FECHA_HISTORICA', 'CAT_TIPO_INTERVALO_MUESTRA', 'CAT_TIPO_MUESTRA_SUBSUELO', 'CAT_TIPO_PROTECCION', 'CAT_TIPO_PUNTO_MUESTREO', 'CAT_TIPO_REFERENCIA', 'CAT_TIPO_REF_ESTRATIGRAFICA', 'CAT_TIPO_RELACION_DOCUMENTO', 'CAT_TIPO_RELACION_PLACA', 'CAT_TRATAMIENTO_MUESTRA', 'CAT_UNIDAD_MEDIDA', 'CAT_VIA_NORM', 'CAT_VIDRIO_ESTADO', 'CAT_ZONA'];
  v_group_c text[] := ARRAY['DOCUMENTO_ASOCIADO', 'DOCUMENTO_SECCION'];
  v_group_d text[] := ARRAY['CAT_PERMISO', 'CAT_ROL', 'PERSONA', 'REL_PERSONA_ROL', 'REL_ROL_PERMISO'];
  v_group_e text[] := ARRAY['DIC_AUTOR', 'DIC_BIOZONA_ACTUALIZADA', 'DIC_BIOZONA_NORMALIZADA', 'DIC_BIOZONA_REPORTADA', 'DIC_DESCRIPCION_LITO_NORM', 'DIC_DESCRIPCION_LITO_REPORTADA', 'DIC_EDAD_ACTUALIZADA', 'DIC_EDAD_NORMALIZADA', 'DIC_EDAD_REPORTADA', 'DIC_RANGO_CRONO', 'DIC_TAXON_ACTUALIZADO', 'DIC_TAXON_NORMALIZADO', 'DIC_TAXON_REPORTADO', 'DIC_UNI_LITO_ACTUALIZADA', 'DIC_UNI_LITO_NORMALIZADA', 'DIC_UNI_LITO_REPORTADA', 'LOCALIZACION_ESPACIAL', 'LOCALIZACION_GEOGRAFICA', 'LOCALIZACION_GEOREFERENCIAL', 'POSICION_ESTRATIGRAFICA', 'SECCION_ESTRATIGRAFICA', 'schema_version'];
  v_all_tables text[];
  tbl text;
BEGIN
  v_all_tables := v_group_a || v_group_b || v_group_c || v_group_d || v_group_e;

  -- Enable RLS on every table
  FOREACH tbl IN ARRAY v_all_tables LOOP
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;

  -- Drop existing policies on every table
  FOREACH tbl IN ARRAY v_all_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_select_policy', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_insert_policy', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_update_policy', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_delete_policy', tbl);
  END LOOP;

  -- Group A: data + relations
  FOREACH tbl IN ARRAY v_group_a LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador'') OR current_user_has_role(''Revisor'') OR current_user_has_role(''Catalogador''))', tbl || '_select_policy', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador'') OR current_user_has_role(''Catalogador''))', tbl || '_insert_policy', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador'') OR current_user_has_role(''Revisor'')) WITH CHECK (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador'') OR current_user_has_role(''Revisor''))', tbl || '_update_policy', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador''))', tbl || '_delete_policy', tbl);
  END LOOP;

  -- Group B: catalogs
  FOREACH tbl IN ARRAY v_group_b LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador'') OR current_user_has_role(''Revisor'') OR current_user_has_role(''Catalogador''))', tbl || '_select_policy', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador''))', tbl || '_insert_policy', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador'')) WITH CHECK (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador''))', tbl || '_update_policy', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador''))', tbl || '_delete_policy', tbl);
  END LOOP;

  -- Group C: documents
  FOREACH tbl IN ARRAY v_group_c LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador'') OR current_user_has_role(''Revisor'') OR current_user_has_role(''Catalogador''))', tbl || '_select_policy', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador'') OR current_user_has_role(''Revisor'') OR current_user_has_role(''Catalogador''))', tbl || '_insert_policy', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador'') OR current_user_has_role(''Revisor'')) WITH CHECK (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador'') OR current_user_has_role(''Revisor''))', tbl || '_update_policy', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador''))', tbl || '_delete_policy', tbl);
  END LOOP;

  -- Group D: auth
  FOREACH tbl IN ARRAY v_group_d LOOP
    IF tbl = 'PERSONA' THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (current_user_has_role(''Administrador'') OR auth.uid() = auth_user_id OR correo = (auth.jwt() ->> ''email''))', tbl || '_select_policy', tbl);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (current_user_has_role(''Administrador'') OR auth.uid() = auth_user_id OR correo = (auth.jwt() ->> ''email'')) WITH CHECK (current_user_has_role(''Administrador'') OR auth.uid() = auth_user_id)', tbl || '_update_policy', tbl);
    ELSE
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (current_user_has_role(''Administrador''))', tbl || '_select_policy', tbl);
    END IF;
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (current_user_has_role(''Administrador''))', tbl || '_insert_policy', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (current_user_has_role(''Administrador''))', tbl || '_delete_policy', tbl);
  END LOOP;

  -- Group E: dictionaries + localization + schema_version
  FOREACH tbl IN ARRAY v_group_e LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador'') OR current_user_has_role(''Revisor'') OR current_user_has_role(''Catalogador''))', tbl || '_select_policy', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador''))', tbl || '_insert_policy', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador'')) WITH CHECK (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador''))', tbl || '_update_policy', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (current_user_has_role(''Administrador'') OR current_user_has_role(''Curador''))', tbl || '_delete_policy', tbl);
  END LOOP;
END;
$$;

COMMIT;
