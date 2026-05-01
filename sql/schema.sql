-- Schema for Catálogo de Placas (SGC)
-- Sequences used for generating readable IDs
CREATE SEQUENCE IF NOT EXISTS seq_coleccion START 1;
CREATE SEQUENCE IF NOT EXISTS seq_placa START 1;
CREATE SEQUENCE IF NOT EXISTS seq_muestra START 1;

-- Colecciones
CREATE TABLE IF NOT EXISTS coleccion (
  coleccion_id    TEXT PRIMARY KEY DEFAULT ('COL-' || LPAD(nextval('seq_coleccion')::TEXT, 3, '0')),
  nombre_coleccion TEXT NOT NULL UNIQUE,
  institucion     TEXT,
  responsable     TEXT,
  descripcion     TEXT,
  estado_coleccion TEXT CHECK (estado_coleccion IN ('Activa', 'Cerrada')) DEFAULT 'Activa',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Personas
CREATE TABLE IF NOT EXISTS persona (
  persona_id  TEXT PRIMARY KEY,
  nombre      TEXT NOT NULL,
  rol         TEXT CHECK (rol IN ('Catalogador', 'Revisor', 'Curador', 'Administrador')),
  email       TEXT,
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Empresas
CREATE TABLE IF NOT EXISTS empresa (
  empresa_id    TEXT PRIMARY KEY,
  nombre_empresa TEXT NOT NULL UNIQUE,
  tipo_empresa  TEXT,
  pais          TEXT,
  observaciones TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Mueble
CREATE TABLE IF NOT EXISTS mueble (
  mueble_cod           TEXT PRIMARY KEY,
  material_mueble      TEXT,
  color                TEXT,
  tiene_seccion        BOOLEAN DEFAULT FALSE,
  secciones_permitidas TEXT,
  tiene_zona           BOOLEAN DEFAULT FALSE,
  zonas_permitidas     TEXT,
  max_bandejas         INTEGER,
  material_bandeja     TEXT,
  capacidad_min        INTEGER,
  capacidad_max        INTEGER,
  ubicacion_fisica     TEXT,
  observaciones        TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Ubicacion fisica
CREATE TABLE IF NOT EXISTS ubicacion_fisica (
  ubicacion_id    TEXT PRIMARY KEY,
  mueble_cod      TEXT REFERENCES mueble(mueble_cod),
  seccion         TEXT,
  zona            TEXT,
  no_bandeja      INTEGER NOT NULL,
  columna         TEXT,
  posicion_placa  INTEGER NOT NULL,
  tipo_mueble     TEXT,
  color_mueble    TEXT,
  material_bandeja TEXT,
  ocupada         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (mueble_cod, seccion, zona, no_bandeja, posicion_placa)
);

-- Placa
CREATE TABLE IF NOT EXISTS placa (
  placa_id            TEXT PRIMARY KEY DEFAULT ('PL-' || LPAD(nextval('seq_placa')::TEXT, 6, '0')),
  ubicacion_id        TEXT REFERENCES ubicacion_fisica(ubicacion_id),
  coleccion_id        TEXT REFERENCES coleccion(coleccion_id),
  clase_placa         TEXT,
  rol_placa           TEXT,
  diseno_placa        TEXT,
  total_cavidades     INTEGER,
  estado_placa        TEXT,
  tipo_rejilla        TEXT,
  cubierta            TEXT,
  tipo_abrazadera     TEXT,
  catalogador_id      TEXT REFERENCES persona(persona_id),
  estado_catalogacion TEXT DEFAULT 'En proceso' 
                      CHECK (estado_catalogacion IN ('En proceso','Incompleto','En revisión','Validado','Cerrado')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Marcado placa
CREATE TABLE IF NOT EXISTS marcado_placa (
  marcado_placa_id TEXT PRIMARY KEY,
  placa_id         TEXT REFERENCES placa(placa_id) ON DELETE CASCADE,
  tinta_negra      TEXT,
  tinta_azul       TEXT,
  tinta_roja       TEXT,
  tinta_verde      TEXT,
  lapiz            TEXT,
  impresion_negro  TEXT,
  impresion_azul   TEXT,
  observaciones    TEXT,
  catalogador_id   TEXT REFERENCES persona(persona_id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Nota manuscrita
CREATE TABLE IF NOT EXISTS nota_manuscrita (
  nota_id        TEXT PRIMARY KEY,
  placa_id       TEXT REFERENCES placa(placa_id) ON DELETE CASCADE,
  zona           TEXT CHECK (zona IN ('Izquierda','Derecha','Arriba','Abajo')),
  clave_nota     TEXT,
  texto_nota     TEXT,
  catalogador_id TEXT REFERENCES persona(persona_id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Muestra
CREATE TABLE IF NOT EXISTS muestra (
  muestra_id          TEXT PRIMARY KEY DEFAULT ('MUE-' || LPAD(nextval('seq_muestra')::TEXT, 6, '0')),
  placa_id            TEXT REFERENCES placa(placa_id) ON DELETE CASCADE,
  procedencia_muestra TEXT CHECK (procedencia_muestra IN ('Superficie','Pozo')),
  nombre_pozo         TEXT,
  tipo_muestra        TEXT,
  tipo_profundidad    TEXT CHECK (tipo_profundidad IN ('Intervalo','Puntual')),
  profundidad_puntual NUMERIC(10,2),
  profundidad_tope    NUMERIC(10,2),
  profundidad_base    NUMERIC(10,2),
  unidad_medida       TEXT,
  cod_muestra         TEXT,
  igm                 TEXT,
  no_preparacion      TEXT,
  info_inferida       BOOLEAN DEFAULT FALSE,
  estado_catalogacion TEXT DEFAULT 'En proceso'
                      CHECK (estado_catalogacion IN ('En proceso','Incompleto','En revisión','Validado','Cerrado')),
  fecha_estado        TIMESTAMPTZ,
  catalogador_id      TEXT REFERENCES persona(persona_id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Muestra Empresa
CREATE TABLE IF NOT EXISTS muestra_empresa (
  muestra_empresa_id TEXT PRIMARY KEY,
  muestra_id         TEXT REFERENCES muestra(muestra_id) ON DELETE CASCADE,
  empresa_id         TEXT REFERENCES empresa(empresa_id),
  rol                TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (muestra_id, empresa_id, rol)
);

-- Geologia
CREATE TABLE IF NOT EXISTS geologia (
  geologia_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  muestra_id         TEXT UNIQUE REFERENCES muestra(muestra_id) ON DELETE CASCADE,
  unidad_lito        TEXT,
  unidad_bio         TEXT,
  edad               TEXT,
  intervalo_muestreo NUMERIC(10,2),
  unidad_medida      TEXT,
  info_inferida      BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Microfauna
CREATE TABLE IF NOT EXISTS microfauna (
  microfauna_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  muestra_id          TEXT REFERENCES muestra(muestra_id) ON DELETE CASCADE,
  genero_especie      TEXT NOT NULL,
  abundancia          TEXT,
  estado_preservacion TEXT,
  observaciones       TEXT,
  catalogador_id      TEXT REFERENCES persona(persona_id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Disposicion material
CREATE TABLE IF NOT EXISTS disposicion_material (
  disposicion_id   TEXT PRIMARY KEY,
  muestra_id       TEXT REFERENCES muestra(muestra_id) ON DELETE CASCADE,
  tipo_cavidad     TEXT,
  cod_cavidad      TEXT,
  cavidad_nro      INTEGER,
  material_presente BOOLEAN DEFAULT FALSE,
  material_estado  TEXT,
  cantidad_cualitativa TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Estado conservacion
CREATE TABLE IF NOT EXISTS estado_conservacion (
  estado_cons_id        TEXT PRIMARY KEY,
  muestra_id            TEXT REFERENCES muestra(muestra_id) ON DELETE CASCADE,
  vidrio_estado         TEXT,
  acetato_estado        TEXT,
  abrazadera_estado     TEXT,
  presencia_hongos      BOOLEAN DEFAULT FALSE,
  crecimiento_cristales BOOLEAN DEFAULT FALSE,
  oxidacion             BOOLEAN DEFAULT FALSE,
  material_fuera_cavidad BOOLEAN DEFAULT FALSE,
  riesgo_contaminacion  BOOLEAN DEFAULT FALSE,
  observaciones         TEXT,
  catalogador_id        TEXT REFERENCES persona(persona_id),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Fuente de dato
CREATE TABLE IF NOT EXISTS fuente_dato (
  fuente_id   TEXT PRIMARY KEY,
  muestra_id  TEXT REFERENCES muestra(muestra_id) ON DELETE CASCADE,
  tipo_fuente TEXT,
  referencia  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Diccionarios
CREATE TABLE IF NOT EXISTS dic_unidad_lito (
  unidad_lito_id TEXT PRIMARY KEY,
  nombre_oficial TEXT NOT NULL,
  tipo_unidad    TEXT,
  rango          TEXT,
  edad_base      TEXT,
  edad_tope      TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sinonimo_unidad_lito (
  sinonimo_lito_id TEXT PRIMARY KEY,
  unidad_lito_id   TEXT REFERENCES dic_unidad_lito(unidad_lito_id),
  nombre_sinonimo  TEXT,
  idioma           TEXT
);

CREATE TABLE IF NOT EXISTS dic_biozona (
  biozona_id    TEXT PRIMARY KEY,
  nombre_biozona TEXT NOT NULL,
  grupo_fosil   TEXT,
  edad_base     TEXT,
  edad_tope     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sinonimo_biozona (
  sinonimo_bio_id TEXT PRIMARY KEY,
  biozona_id      TEXT REFERENCES dic_biozona(biozona_id),
  nombre_sinonimo TEXT
);

CREATE TABLE IF NOT EXISTS dic_edad (
  edad_id    TEXT PRIMARY KEY,
  nombre_edad TEXT NOT NULL,
  jerarquia  TEXT,
  base_ma    NUMERIC(8,3),
  tope_ma    NUMERIC(8,3),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sinonimo_edad (
  sinonimo_edad_id TEXT PRIMARY KEY,
  edad_id          TEXT REFERENCES dic_edad(edad_id),
  nombre_sinonimo  TEXT,
  idioma           TEXT
);

-- Auditoria
CREATE TABLE IF NOT EXISTS auditoria_cambios (
  auditoria_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tabla            TEXT,
  registro_id      TEXT,
  operacion        TEXT,
  campo_modificado TEXT,
  valor_anterior   TEXT,
  valor_nuevo      TEXT,
  usuario_id       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security placeholders
-- NOTE: These policies are templates. Adapt them to your Auth claims and persona mapping.
-- Example: Allow authenticated users to SELECT, and provide more restrictive INSERT/UPDATE rules.
-- ENABLE RLS for sensitive tables
ALTER TABLE IF EXISTS placa ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS muestra ENABLE ROW LEVEL SECURITY;

-- Simple policy allowing SELECT to authenticated users (adjust as needed)
-- Policies: use DROP ... IF EXISTS then CREATE (Postgres doesn't support CREATE POLICY IF NOT EXISTS)

-- allow SELECT to authenticated users
DROP POLICY IF EXISTS allow_select_authenticated ON placa;
CREATE POLICY allow_select_authenticated ON placa FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS allow_select_authenticated_muestra ON muestra;
CREATE POLICY allow_select_authenticated_muestra ON muestra FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to INSERT into placa and muestra (refine as needed)
DROP POLICY IF EXISTS placa_insert_auth ON placa;
CREATE POLICY placa_insert_auth ON placa FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS muestra_insert_auth ON muestra;
CREATE POLICY muestra_insert_auth ON muestra FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Catalogadores can UPDATE records where they are the catalogador (match persona.email to JWT email)
DROP POLICY IF EXISTS placa_update_catalogador ON placa;
CREATE POLICY placa_update_catalogador ON placa FOR UPDATE USING (
  (SELECT persona_id FROM persona WHERE persona.email = (auth.jwt() ->> 'email')) = placa.catalogador_id
) WITH CHECK (
  (SELECT persona_id FROM persona WHERE persona.email = (auth.jwt() ->> 'email')) = placa.catalogador_id
);

DROP POLICY IF EXISTS muestra_update_catalogador ON muestra;
CREATE POLICY muestra_update_catalogador ON muestra FOR UPDATE USING (
  (SELECT persona_id FROM persona WHERE persona.email = (auth.jwt() ->> 'email')) = muestra.catalogador_id
) WITH CHECK (
  (SELECT persona_id FROM persona WHERE persona.email = (auth.jwt() ->> 'email')) = muestra.catalogador_id
);

-- Administrador role (or Supabase internal admin) can UPDATE/DELETE any placa or muestra
DROP POLICY IF EXISTS placa_admin_update ON placa;
CREATE POLICY placa_admin_update ON placa FOR UPDATE USING (
  auth.role() = 'supabase_admin' OR (auth.jwt() ->> 'role') = 'Administrador'
) WITH CHECK (
  auth.role() = 'supabase_admin' OR (auth.jwt() ->> 'role') = 'Administrador'
);

DROP POLICY IF EXISTS placa_admin_delete ON placa;
CREATE POLICY placa_admin_delete ON placa FOR DELETE USING (
  auth.role() = 'supabase_admin' OR (auth.jwt() ->> 'role') = 'Administrador'
);

DROP POLICY IF EXISTS muestra_admin_update ON muestra;
CREATE POLICY muestra_admin_update ON muestra FOR UPDATE USING (
  auth.role() = 'supabase_admin' OR (auth.jwt() ->> 'role') = 'Administrador'
) WITH CHECK (
  auth.role() = 'supabase_admin' OR (auth.jwt() ->> 'role') = 'Administrador'
);

DROP POLICY IF EXISTS muestra_admin_delete ON muestra;
CREATE POLICY muestra_admin_delete ON muestra FOR DELETE USING (
  auth.role() = 'supabase_admin' OR (auth.jwt() ->> 'role') = 'Administrador'
);

-- NOTE: These policies are examples. Test them in your Supabase project and adapt to the actual JWT claims and persona mapping.

-- Seed basic data (colecciones, personas cortas, muebles)
INSERT INTO coleccion (coleccion_id, nombre_coleccion, institucion, responsable, estado_coleccion)
VALUES
('COL-001','Colección Personal Hermann Duque Caro (SGC)','SGC','Hermann Duque Caro','Cerrada')
ON CONFLICT (coleccion_id) DO NOTHING;

INSERT INTO coleccion (coleccion_id, nombre_coleccion, institucion, responsable, estado_coleccion)
VALUES
('COL-002','Colección Museo Geológico José Royo y Gómez (SGC)','SGC','Museo Royo','Cerrada')
ON CONFLICT (coleccion_id) DO NOTHING;

INSERT INTO coleccion (coleccion_id, nombre_coleccion, institucion, responsable, estado_coleccion)
VALUES
('COL-003','Colección Litoteca Nacional Guatiguará (SGC)','SGC','Litoteca','Activa')
ON CONFLICT (coleccion_id) DO NOTHING;

INSERT INTO coleccion (coleccion_id, nombre_coleccion, institucion, responsable, estado_coleccion)
VALUES
('COL-004','Colección Grupo Bioestratigrafía DGB (SGC)','SGC','Grupo Bioestratigrafía','Activa')
ON CONFLICT (coleccion_id) DO NOTHING;

-- Personas seed (catalogadores, revisores, administrador)
INSERT INTO persona (persona_id, nombre, rol, email, activo) VALUES
('CAT-01','Danixa Maribel Lopez Cuevas','Catalogador','dlopezc@sgc.gov.co', true),
('CAT-02','Georgina Guzmán Ospitia','Catalogador','gguzman@sgc.gov.co', true),
('CAT-03','Marlon Alejandro Suárez Díaz','Catalogador','masuarez@sgc.gov.co', true),
('CAT-04','Alejandro Díaz Vásquez','Catalogador','badiaz@sgc.gov.co', true),
('CAT-05','Jefferson S. Díaz Villamizar','Catalogador','jsdiaz@sgc.gov.co', true),
('REV-01','Diana Esperanza Vanegas','Revisor','despitia@sgc.gov.co', true),
('REV-02','Jairo Alexander Duarte Fuero','Revisor','jduarte@sgc.gov.co', true),
('ADM-01','Adrian Linares Murcia','Administrador','jlinares@sgc.gov.co', true)
ON CONFLICT (persona_id) DO NOTHING;

-- Muebles (simplified seeds)
INSERT INTO mueble (mueble_cod, material_mueble, tiene_seccion, secciones_permitidas, tiene_zona, zonas_permitidas, max_bandejas, capacidad_max)
VALUES
('HDC-1','Madera natural',TRUE,'Superior;Inferior',FALSE,NULL,28,20),
('HDC-2','Madera natural',TRUE,'Superior;Inferior',FALSE,NULL,28,20),
('HDC-3','Madera natural',TRUE,'Superior;Inferior',FALSE,NULL,28,20),
('A','Madera caoba oscuro',TRUE,'Superior;Inferior',TRUE,'Izquierda;Centro;Derecha',30,20),
('B','Madera caoba oscuro',TRUE,'Superior;Inferior',TRUE,'Izquierda;Centro;Derecha',30,20),
('C','Madera caoba oscuro',TRUE,'Superior;Inferior',TRUE,'Izquierda;Centro;Derecha',30,20)
ON CONFLICT (mueble_cod) DO NOTHING;

-- Example companies (partial list)
INSERT INTO empresa (empresa_id, nombre_empresa) VALUES
('EMP-01','Gran Tierra Energy'),
('EMP-02','Ecopetrol'),
('EMP-03','Drummond')
ON CONFLICT (empresa_id) DO NOTHING;
