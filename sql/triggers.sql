-- ============================================================
-- Triggers de auditoría para tablas del esquema GeoTrace
-- ============================================================
-- Se genera un registro en la tabla `auditoria` por cada
-- INSERT, UPDATE o DELETE sobre las tablas auditable del sistema.
-- La clave primaria se descubre dinámicamente a partir de
-- TG_RELID para no depender de una columna fija llamada `id`.
-- ============================================================

-- Limpiar función anterior si existiera
DROP FUNCTION IF EXISTS audit_trigger_func() CASCADE;

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pk_col text;
  rec_id bigint;
  v_cambios jsonb;
BEGIN
  -- Descubrir la columna de la clave primaria
  SELECT a.attname INTO pk_col
  FROM pg_index i
  JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
  WHERE i.indrelid = TG_RELID
    AND i.indisprimary
  LIMIT 1;

  IF pk_col IS NULL THEN
    RAISE EXCEPTION 'No primary key found for table %', TG_TABLE_NAME;
  END IF;

  IF TG_OP = 'DELETE' THEN
    rec_id := (to_jsonb(OLD) ->> pk_col)::bigint;
    INSERT INTO auditoria (tabla, operacion, registro_id, usuario_id, cambios)
    VALUES (TG_TABLE_NAME, TG_OP, rec_id, auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    rec_id := (to_jsonb(NEW) ->> pk_col)::bigint;
    INSERT INTO auditoria (tabla, operacion, registro_id, usuario_id, cambios)
    VALUES (TG_TABLE_NAME, TG_OP, rec_id, auth.uid(), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    rec_id := (to_jsonb(NEW) ->> pk_col)::bigint;
    v_cambios := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    INSERT INTO auditoria (tabla, operacion, registro_id, usuario_id, cambios)
    VALUES (TG_TABLE_NAME, TG_OP, rec_id, auth.uid(), v_cambios);
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION audit_trigger_func() IS
  'Trigger genérico que registra operaciones DML en la tabla auditoria.';

-- Tablas auditable: Group A (datos + relaciones) + Group C (documentos)
DO $$
DECLARE
  v_auditable text[] := ARRAY[
    'PLACA', 'MARCADO_PLACA', 'ANOTACION_PLACA', 'DISPOSICION_MATERIAL',
    'ESTADO_CONSERVACION_INICIAL', 'UBICACION_FISICA', 'MUESTRA',
    'MUESTRA_SUPERFICIE', 'MUESTRA_SUBSUELO', 'MUESTRA_LECHO_MARINO',
    'POZO', 'POZO_REPORTADO', 'POZO_EXPLORATORIO', 'POZO_ESTRATIGRAFICO',
    'NUCLEO', 'SECCION_NUCLEO', 'PLACA_TIPO',
    'REL_PLACA_PLACA', 'REL_PLACA_AUTOR', 'REL_PLACA_REFERENCIA_BIBLIOGRAFICA',
    'REL_MUESTRA_TRATAMIENTO', 'REL_MUESTRA_PROYECTO', 'REL_MUESTRA_ENTIDAD',
    'REL_MUESTRA_FECHA_HISTORICA', 'REL_MUESTRA_TAXON_REPORTADO',
    'REL_MUESTRA_BIOZONA_REPORTADA', 'REL_MUESTRA_EDAD_REPORTADA',
    'REL_MUESTRA_UNI_LITO_REPORTADA', 'REL_MUESTRA_UNI_LITO_REP_NORM',
    'REL_MUESTRA_UNI_LITO_NORM_ACT', 'REL_MUESTRA_DESCRIPCION_LITO',
    'REL_MUESTRA_DESC_LITO_REP_NORM', 'REL_MUESTRA_REFERENCIA_BIBLIOGRAFICA',
    'REL_DOCUMENTO_MUESTRA', 'REL_DOCUMENTO_PLACA', 'REL_DOCUMENTO_POZO',
    'REL_DOCUMENTO_PROYECTO', 'REL_DOCUMENTO_SECCION_ESTRATIGR',
    'REL_DOCUMENTO_DOCUMENTO', 'REL_POZO_REPORTADO_POZO',
    'REL_TAXON_REP_NORM', 'REL_TAXON_NORM_ACT',
    'REL_BIOZONA_REP_NORM', 'REL_BIOZONA_NORM_ACT',
    'REL_EDAD_REP_NORM', 'REL_EDAD_NORM_ACT',
    'DOCUMENTO_ASOCIADO', 'DOCUMENTO_SECCION'
  ];
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY v_auditable LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()',
      tbl, tbl
    );
  END LOOP;
END;
$$;
