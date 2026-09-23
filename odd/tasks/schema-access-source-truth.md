# Schema aligned to Access cataloging module

## Objective

Make the PostgreSQL schema represent the Access export in `sql/modulo_catalogacion_placas_pozos/`, which is the authoritative source for the cataloging domain.

## Problem

The current `sql/schema.sql` contains a redesigned model that diverges from the authoritative module in physical storage, catalog vocabulary, well identity, depth detail, conservation fields, and relationship cardinality.

## Scope

- Adapt the schema and its seed/reference definitions to the authoritative Access entities and catalogs.
- Preserve the existing RBAC and Supabase integration unless the source module requires a compatible FK/name change.
- Do not migrate data or update application hooks/types in this work unit unless required to keep the schema internally executable; those are follow-up work.
- Do not overwrite or clean pre-existing user changes in the working tree.

## Constraints

- Source of truth: `sql/modulo_catalogacion_placas_pozos/`.
- SQL artifacts and comments remain in English.
- Use additive, reviewable work units with Conventional Commits.
- Existing untracked module files are input data and must not be altered.

## Tasks

- [x] ODD-001 Establish the Access-to-PostgreSQL mapping for the core and physical entities in this work unit.
- [ ] ODD-002 Align core cataloging entities: collection, plate, sample, physical location, cabinet/zone/tray, marking, annotations, conservation, and material disposition.
- [ ] ODD-003 Align subsurface entities: reported wells, wells, samples, cores, core sections, authors, taxa, and relationship tables, including depth provenance.
- [ ] ODD-004 Add/align controlled catalogs and enforce source-supported cardinality and uniqueness constraints.
- [ ] ODD-005 Validate schema execution and migration assumptions; record unresolved mapping decisions and verification evidence.

## Authorized scope

- `sql/schema.sql`
- Related SQL seed/migration files only when required by the schema changes.
- `odd/tasks/schema-access-source-truth.md`

## Acceptance criteria

1. Every authoritative Access table has an explicit PostgreSQL target or a documented intentional exclusion.
2. Every source relationship and one-to-one/one-to-many cardinality is represented or documented.
3. Source catalog values are not silently replaced by the previous schema vocabulary.
4. The schema remains executable as a transaction and validation results are recorded.
5. No unrelated existing working-tree changes are modified.

## Verification

- Structural comparison against the complete module inventory.
- SQL parsing/execution validation using the repository-supported PostgreSQL/Supabase tooling, if available.
- Targeted checks for FK order, unique constraints, circular references, and source catalog values.

## Work unit mapping: core and physical entities

The Access module is authoritative. PostgreSQL keeps the Access entity names for the
tables in this unit; `created_at` and `updated_at` remain technical audit columns used
by the existing schema and are not source fields.

| Access table | PostgreSQL target | Key and nullability | Relationships and source-backed uniqueness |
| --- | --- | --- | --- |
| `COLECCION` | `public.COLECCION` | `ColeccionID` → `coleccion_id` identity primary key; all source attributes nullable | No non-primary unique index is present in Access; `CodigoColeccion`, `NombreColeccion`, and `EstadoColeccion` are preserved as nullable text without the previous state check. |
| `PLACA` | `public.PLACA` | `PlacaID` → `placa_id` identity primary key; all source attributes nullable | `ColeccionID` → `COLECCION` (many plates to zero-or-one collection); catalog/person/review FKs are nullable. `CodigoPlaca` has the Access unique index. `CodigoUbicacion` is retained as nullable source text. |
| `MUEBLE` | `public.MUEBLE` | `MuebleID` → `mueble_id` identity primary key; all source attributes nullable | `MaterialMuebleID` and `ColorMuebleID` map to their existing catalogs. No Access uniqueness is imposed on `CodigoMueble`. `TieneSecciones` and `TieneZonas` are boolean. |
| `ZONA_MUEBLE` | `public.ZONA_MUEBLE` | `ZonaMuebleID` → `zona_mueble_id` identity primary key; all source attributes nullable | `SeccionMuebleID` maps to `CAT_SECCION.seccion_id`; one section can have many zones. No additional Access unique index is present. |
| `BANDEJA` | `public.BANDEJA` | `BandejaID` → `bandeja_id` identity primary key; all source attributes nullable | `ZonaMuebleID` → `ZONA_MUEBLE`; `MaterialBandejaID` → `CAT_MATERIAL_BANDEJA`. A zone can have many trays. No composite unique index is present in Access. |
| `UBICACION_FISICA` | `public.UBICACION_FISICA` | `UbicacionFisicaID` → `ubicacion_fisica_id` identity primary key; all source attributes nullable | `BandejaID` and `ColumnaBandejaID` are nullable FKs; `PosicionBandeja` preserves Access validation `1..22`. Access has unique `PlacaID` and unique `(BandejaID, ColumnaBandejaID, PosicionBandeja)`. |

### Circularity decision

The source relationship is represented in one authoritative direction: nullable,
unique `UBICACION_FISICA.PlacaID` references `PLACA.PlacaID`. The old redesigned
`PLACA.ubicacion_id` FK and column are removed. The source `PLACA.CodigoUbicacion`
field remains as text, so the Access relationship/code is not discarded while the
PostgreSQL DDL has no circular foreign-key dependency.

### Scope exclusions and blocking decisions

The remaining Access tables are intentionally not aligned by this work unit:
`ANOTACION_PLACA`, `CAT_*`, `DIC_AUTOR`, `DIC_TAXON_REPORTADO`,
`DISPOSICION_MATERIAL`, `ESTADO_CONSERVACION_INICIAL`, `MARCADO_PLACA`,
`MUESTRA`, `MUESTRA_SUBSUELO`, `NUCLEO`, `PERSONA`, `POZO_REPORTADO`,
`REL_MUESTRA_TAXON_REPORTADO`, `REL_PLACA_AUTOR`, and `SECCION_NUCLEO`.
The derived Access queries `BANDEJAS_POR_MUEBLE` and `BANDEJAS_POR_ZONA`
are also intentionally excluded as reporting/query artifacts rather than base
entities.
Existing definitions are retained unless required as an FK target for this unit;
their source-alignment remains follow-up work. No data migration, sample/subsurface
alignment, frontend change, or module-file change was performed.

## Work unit progress and verification evidence

- `sql/schema.sql` now contains the six target entities and their Access-backed keys,
  nullable source attributes, FKs, cardinalities, validation, and unique constraints.
- `sql/modulo_catalogacion_placas_pozos/` was read-only; no file in that directory was modified.
- `git diff --check`: PASS.
- `psql --version`: `psql (PostgreSQL) 18.6`.
- `pg_isready`: server accepting connections on `/run/postgresql:5432`.
- Full isolated execution attempt: BLOCKED because the local PostgreSQL cluster has no
  `jlinares` role, and the environment does not permit passwordless execution as
  `postgres` (`FATAL: role "jlinares" does not exist`; `sudo: a password is required`).
  No database was changed by the failed attempt.
- Static targeted review: PASS for the absence of `PLACA.ubicacion_id`, presence of
  `UBICACION_FISICA(PlacaID) UNIQUE`, the tray-position check, and the Access table
  targets listed above. Full PostgreSQL execution remains the blocking verification item.

## Progress

- Branch: `feat/schema-access-source-truth`
- Work-unit commit: `1aa0dce feat(db): align core schema with Access module`.
- Remote migrations applied: `align_access_core_physical_entities`, `align_access_cataloging_subsurface_entities`, `add_role_based_rls_for_access_model`, and `enable_rls_on_access_catalogs`.
- Remote verification: core Access entities, sample/subsurface entities, keys, FKs, uniqueness checks, and tray position validation are present; all public tables currently have RLS enabled.
- Current state: local core/physical mapping and remote cataloging/subsurface work implemented; module source files unchanged.
- Open security work: 35 catalog tables have RLS enabled without policies (closed by default); legacy policies still reference `auth.users.user_metadata`, and three legacy SECURITY DEFINER functions remain advisor findings.
- Next step: complete catalog policy coverage and replace legacy authorization references with `auth.uid()`/application-role checks before functional API testing.
