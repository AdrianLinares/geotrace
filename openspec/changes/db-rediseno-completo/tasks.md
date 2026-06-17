# Tasks: db-rediseno-completo

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 4,000–5,500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 |
| Delivery strategy | ask-always → user chose chained PRs |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No — user selected feature-branch-chain
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation: RBAC + core catalogs + helper functions | PR 1 | base = feature branch; ~20 tables + `current_user_has_role()` |
| 2 | Core data: placas + muestras + pozos + ubicaciones + autores | PR 2 | base = PR 1 branch; ~60 tables, heaviest FK surface |
| 3 | Scientific pipelines: taxonomía + biozonas + crono + lito | PR 3 | base = PR 2 branch; ~40 tables, 3-stage pattern |
| 4 | Documents + relations + localization | PR 4 | base = PR 3 branch; ~25 tables, all REL_* junctions |
| 5 | RLS policies + AuthProvider + seed + triggers + audit | PR 5 | base = PR 4 branch; replaces 3 SQL files + 1 TS file |

## Phase 1: Foundation (PR 1 — ~20 tables)

- [x] 1.1 Replace `sql/schema.sql` header: add `schema_version` table (version, applied_at) and `DROP TABLE IF EXISTS ... CASCADE` block for all legacy tables
- [x] 1.2 Add `PERSONA` table with `bigint GENERATED ALWAYS AS IDENTITY` PK, `auth_user_id UUID REFERENCES auth.users(id)` nullable, `email`, `nombre`, `activo`, audit timestamps
- [x] 1.3 Add RBAC tables: `CAT_ROL` (id, nombre, jerarquia), `CAT_PERMISO`, `REL_ROL_PERMISO`, `REL_PERSONA_ROL` — seed 4 roles (Catalogador=1, Revisor=2, Curador=3, Administrador=4)
- [x] 1.4 Add `CAT_ESTADO_CATALOGACION` (seed: En proceso, Incompleto, En revisión, Validado, Cerrado) and `CAT_ESTADO_REVISION`
- [x] 1.5 Add `CAT_COLECCION` with CHECK on `estado`, plus `CAT_TIPO_AUTOR`, `CAT_ROL_AUTOR`, `CAT_ESPECIALIDAD`, `DIC_AUTOR`
- [x] 1.6 Add `current_user_has_role(text) → boolean` SECURITY DEFINER function in `sql/schema.sql` (joins PERSONA.auth_user_id → REL_PERSONA_ROL → CAT_ROL)
- [x] 1.7 Add generic `set_updated_at()` trigger function for `updated_at` auto-stamp

## Phase 2: Core Data (PR 2 — ~60 tables)

- [x] 2.1 Append to `sql/schema.sql`: all 18 plate catalogs (`CAT_CLASE_PLACA`, `CAT_COLOR_PLACA`, `CAT_CONFIGURACION_CAVIDADES`, etc. per schema-catalogos spec)
- [x] 2.2 Append `PLACA` table with IDENTITY PK, FKs to 18 catalogs (nullable), 5 audit columns, FK to `CAT_COLECCION` and `UBICACION_FISICA`
- [x] 2.3 Append `MARCADO_PLACA` (1:1, ON DELETE CASCADE), `ANOTACION_PLACA` (1:N), `DISPOSICION_MATERIAL`, `ESTADO_CONSERVACION_INICIAL`, `REL_PLACA_PLACA` (CHECK: no self-relation), `REL_PLACA_AUTOR`
- [x] 2.4 Append storage furniture catalogs: `CAT_MUEBLE`, `CAT_MATERIAL_MUEBLE`, `CAT_COLOR_MUEBLE`, `CAT_SECCION`, `CAT_ZONA`, `CAT_MATERIAL_BANDEJA`, `CAT_COLUMNA_BANDEJA`, `CAT_CODIGO_CAVIDAD`
- [x] 2.5 Append `UBICACION_FISICA` with composite UNIQUE (mueble, seccion, zona, bandeja, columna, posicion)
- [x] 2.6 Append sample domain: `MUESTRA` (parent), `MUESTRA_SUPERFICIE`, `MUESTRA_SUBSUELO`, `MUESTRA_LECHO_MARINO` (1:1 subtypes), 9 sample catalogs (`CAT_ORIGEN_MUESTRA`, `CAT_COLECTOR`, `CAT_PROYECTO`, etc.)
- [x] 2.7 Append sample relations: `REL_MUESTRA_TRATAMIENTO`, `REL_MUESTRA_PROYECTO`, `REL_MUESTRA_ENTIDAD`, `REL_MUESTRA_FECHA_HISTORICA`, `REL_MUESTRA_AUTOR`
- [x] 2.8 Append well domain: `POZO`, `POZO_REPORTADO`, `REL_POZO_REPORTADO_POZO`, `POZO_EXPLORATORIO`, `POZO_ESTRATIGRAFICO`, `NUCLEO`, `SECCION_NUCLEO`
- [x] 2.9 Append well catalogs: `CAT_CUENCA`, `CAT_CAMPO`, `CAT_CONTRATO`, `CAT_UNIDAD_MEDIDA`, `CAT_TIPO_MUESTRA_SUBSUELO`, `CAT_TIPO_INTERVALO_MUESTRA`, `CAT_ENTIDAD`

## Phase 3: Scientific Pipelines (PR 3 — ~40 tables)

- [x] 3.1 Append taxonomy 3-stage: `DIC_TAXON_REPORTADO`, `DIC_TAXON_NORMALIZADO`, `DIC_TAXON_ACTUALIZADO` + stage relations `REL_TAXON_REP_NORM`, `REL_TAXON_NORM_ACT`
- [x] 3.2 Append `REL_MUESTRA_TAXON_REPORTADO` with `CAT_TIPO_DUDA` FK and `orden_registro`; seed `CAT_TIPO_DUDA` (Nombre ilegible, Parcialmente ilegible, Código ilegible, Abreviatura ambigua)
- [x] 3.3 Append biozone 3-stage: `DIC_BIOZONA_REPORTADA`, `DIC_BIOZONA_NORMALIZADA`, `DIC_BIOZONA_ACTUALIZADA` + `REL_BIOZONA_REP_NORM`, `REL_BIOZONA_NORM_ACT`
- [x] 3.4 Append `REL_MUESTRA_BIOZONA_REPORTADA` with `TipoDudaID` FK and `ComentarioCatalogador`
- [x] 3.5 Append chronostratigraphy 3-stage: `DIC_EDAD_REPORTADA`, `DIC_EDAD_NORMALIZADA`, `DIC_EDAD_ACTUALIZADA` + `DIC_RANGO_CRONO` (self-ref tree with `parent_id`) and `CAT_TIPO_REF_ESTRATIGRAFICA`
- [x] 3.6 Append `REL_MUESTRA_EDAD_REPORTADA`, `REL_EDAD_REP_NORM`, `REL_EDAD_NORM_ACT`
- [x] 3.7 Append lithostratigraphy 3-stage: `DIC_UNI_LITO_REPORTADA`, `DIC_UNI_LITO_NORMALIZADA`, `DIC_UNI_LITO_ACTUALIZADA` + `CAT_RANGO_LITO`, `CAT_ESTADO_NOMENCLATURA` (seed: Vigente, En desuso, Sinónimo, Propuesto, Revisado)
- [x] 3.8 Append `DIC_DESCRIPCION_LITO_REPORTADA`, `DIC_DESCRIPCION_LITO_NORM` + stage relations (`REL_MUESTRA_DESCRIPCION_LITO`, `REL_MUESTRA_DESC_LITO_REP_NORM`, `REL_MUESTRA_UNI_LITO_REPORTADA`, `REL_MUESTRA_UNI_LITO_REP_NORM`, `REL_MUESTRA_UNI_LITO_NORM_ACT`)
- [x] 3.9 Append `CAT_REFERENCIA_BIBLIOGRAFICA`, `CAT_TIPO_DOCUMENTO`, `CAT_TIPO_REFERENCIA`, `REL_MUESTRA_REFERENCIA_BIBLIOGRAFICA`, `REL_PLACA_REFERENCIA_BIBLIOGRAFICA`

## Phase 4: Documents + Relations + Localization (PR 4 — ~25 tables)

- [ ] 4.1 Append `DOCUMENTO_ASOCIADO` with audit columns, `CAT_IDIOMA`, `CAT_FORMATO_DOCUMENTO`, `CAT_TIPO_DOCUMENTO_ASOCIADO`, `CAT_DOCUMENTO_FAMILIA`
- [ ] 4.2 Append `DOCUMENTO_SECCION`, `REL_DOCUMENTO_DOCUMENTO` with `CAT_TIPO_RELACION_DOCUMENTO`
- [ ] 4.3 Append document-entity relations: `REL_DOCUMENTO_MUESTRA`, `REL_DOCUMENTO_PLACA`, `REL_DOCUMENTO_POZO`, `REL_DOCUMENTO_PROYECTO`, `REL_DOCUMENTO_SECCION_ESTRATIGR`
- [ ] 4.4 Append localization: `CAT_PAIS`, `CAT_DEPARTAMENTO`, `CAT_MUNICIPIO`, `LOCALIZACION_GEOGRAFICA`, `LOCALIZACION_ESPACIAL`, `LOCALIZACION_GEOREFERENCIAL`
- [ ] 4.5 Append spatial catalogs: `CAT_SISTEMA_COORD`, `CAT_METODO_ESPACIAL`, `CAT_FUENTE_ESPACIAL`, `CAT_PRECISION_ESPACIAL`, `CAT_CUENCA_GEOG`, `CAT_PLANCHA_TOPOGRAFICA`, `CAT_NIVEL_DETALLE_LOCALIDAD`
- [ ] 4.6 Append stratigraphic: `SECCION_ESTRATIGRAFICA`, `POSICION_ESTRATIGRAFICA`, `CAT_TIPO_REF_ESTRATIGRAFICA`, `CAT_VIA_NORM`, `CAT_ACCIDENTE_GEOGRAFICO_NORM`

## Phase 5: RLS + Auth + Seed + Triggers + Audit (PR 5)

- [ ] 5.1 Replace `sql/rls_policies_rbac.sql`: enable RLS on all 146 tables; apply Group A (data), B (catalogs), C (documents), D (auth) policy templates using `current_user_has_role()`
- [ ] 5.2 Replace `sql/triggers.sql`: adapt `audit_trigger_func()` to use `NEW.id::TEXT` → dynamic PK column name via `TG_RELID`; attach to all auditable tables
- [ ] 5.3 Replace `sql/audit.sql`: merge `auditoria` + `auditoria_cambios` into unified table with `bigint` PK references; add RLS (Group G: Admin-only SELECT)
- [ ] 5.4 Create `sql/seed.sql`: extract reference data from DEV Excel for tables that have seed data; leave empty tables for frontend testing
- [ ] 5.5 Modify `src/lib/AuthProvider.tsx`: after fetching persona, write `auth_user_id` from `auth.uid()` to `PERSONA.auth_user_id` if not already set (one-time link)
- [ ] 5.6 Add `sql/tests/` directory with `DO $$ ... END $$` blocks: verify FK integrity, CHECK constraints, RLS per group template, seed row counts
