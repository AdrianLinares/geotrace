# Local authentication server

The server owns the authenticated read and write boundary for the resources already present in `sql/schema.sql`. Supabase is no longer part of the runtime; legacy-only catalog screens remain isolated until their schema mapping is specified.

## Configuration

Copy the names below into the process environment; the server does not load a `.env` file automatically. Do not commit credentials.

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string for the local application database. |
| `LDAP_URL` | production yes; development optional | LDAP/LDAPS server URL. In development, omit it together with `LDAP_BASE_DN` when using the local fallback. |
| `LDAP_STARTTLS` | no | Set `true` only when `LDAP_URL` uses `ldap://` and the server supports StartTLS. Production rejects plain LDAP without this explicit setting. |
| `LDAP_BASE_DN` | production yes; development optional | Search base DN. |
| `LDAP_BIND_DN` / `LDAP_BIND_PASSWORD` | no (pair) | Optional service-account bind used for the directory search. |
| `LDAP_USER_SEARCH_FILTER` | no | Search filter containing `{{username}}`; defaults to common AD attributes. |
| `SERVER_HOST` / `SERVER_PORT` | no | Listen address and port. |
| `SESSION_TTL_SECONDS` | no | Session lifetime; defaults to 8 hours. |
| `SESSION_COOKIE_NAME` | no | HttpOnly cookie name. |
| `SESSION_COOKIE_SAME_SITE` | no | `strict`, `lax`, or `none`; defaults to `lax`. |
| `SESSION_COOKIE_SECURE` | no | Set `true` behind HTTPS. Required for `SameSite=none`. |
| `SESSION_COOKIE_DOMAIN` | no | Optional cookie domain. |
| `LOCAL_ADMIN_ENABLED` | no | Defaults to `false`. Set `true` only in development/test to enable the local fallback; production rejects it. |
| `LOCAL_ADMIN_USERNAME` | when local fallback is enabled | Username for the local fallback administrator. |
| `LOCAL_ADMIN_PASSWORD_HASH` | when local fallback is enabled | Valid `scrypt$...` hash for the local fallback administrator. Never use a plaintext password. |

Run the session DDL in the local PostgreSQL database, then start the server:

```bash
pnpm install --frozen-lockfile
psql "$DATABASE_URL" -f sql/migrations/001_app_auth_sessions.sql
pnpm run dev:server
```

Production requires LDAP: provide `LDAP_URL` and `LDAP_BASE_DN`, and use LDAPS or
explicit StartTLS. Development may omit both and use the local fallback by
setting all three `LOCAL_ADMIN_*` variables above. The fallback is disabled by
default and must never be enabled in production. To disable it immediately,
set `LOCAL_ADMIN_ENABLED=false` and restart the server; also revoke or remove
the local credential from the database when appropriate.

Endpoints are `GET /health`, `POST /auth/login` (`{ "username", "password" }`), `GET /auth/me`, `POST /auth/logout`, authenticated reads, and local `MUESTRA` CRUD: `POST /api/samples`, `PUT /api/samples/:id`, and restricted `DELETE /api/samples/:id`. Lists accept bounded pagination and return `{ data, total }`; plate lists additionally accept `collectionId`, `states`, and `search`.

Authentication first binds the supplied AD user, then resolves the active `PERSONA` row by its directory login (`ad_username`, canonicalized from `sAMAccountName`/`uid`) and requires at least one active, currently valid `REL_PERSONA_ROL` assignment. No default role is granted. Session cookies contain an opaque random token; PostgreSQL stores only its hash.

Each login creates and unbinds its own LDAP client. `CAT_ROL` in the current schema has no active/inactive column, so validation can enforce `PERSONA.activo`, `REL_PERSONA_ROL.activo`, and assignment dates, but cannot independently disable a role catalog row.

Administrative user management is restricted to `Administrador`: `GET /api/admin/personas`, `GET /api/admin/roles`, and `PUT /api/admin/personas/:id`. The update body strictly accepts `nombre`, `apellidos`, `correo`, `activo`, and `role_ids`. Removed role assignments are closed with `fecha_fin`, while unchanged roles keep their original row so the assignment history stays auditable. AD authenticates identity and manages passwords; the local database owns application roles. A role change requires a new session or session restoration to be reflected because the backend revalidates roles on `/auth/me` and every protected request. Rotating the local fallback credential revokes every session issued to that persona. The repository serializes administrator changes and rejects any update that would leave no active administrator with `409`.

`POST /api/admin/import` is a local, administrator-only batch endpoint. It accepts only normalized `coleccion`, `pozo`, `placa`, and the base `muestra` columns confirmed in `sql/schema.sql`; every row is validated against a fixed Zod schema and each batch is transactional. `PERSONA`, roles, `mueble`, `ubicacion_fisica`, catalogs, dictionaries, and legacy tables are intentionally excluded. Personas and roles are administered from `/usuarios`, not through generic import. The base `MUESTRA` import does not compose `MUESTRA_SUBSUELO` or other subtype tables, and this work unit does not migrate marking, annotations, auditing, or legacy catalogs.

All operational reads currently allow any authenticated application user. `UBICACION_FISICA` is intentionally blocked: the official schema stores normalized tray/cabinet relations, while the current UI requires legacy `mueble_cod`, `seccion`, `zona`, `no_bandeja`, and `ocupada` columns; no compatibility DTO is invented here. `DIC_CAMPO`, `DIC_CONTRATO`, `EMPRESA`, and the old catalog tables have no confirmed equivalents in the official schema, so those legacy hooks remain isolated and are not part of this migration.

`PLACA` reads use only normalized columns and confirmed catalog relations. The old mueble filter is not exposed because `PLACA` has no normalized relation to `MUEBLE`. `MUESTRA` reads include the base row and its optional `MUESTRA_SUBSUELO` relation. The official schema has no `MUESTRA`-to-`PLACA` relation, so `GET /api/samples?placaId=...` is rejected instead of returning an unfiltered or fabricated result; the plate detail UI reports this limitation. `MUESTRA` CRUD uses the local API: Catalogadores create and edit only owned rows, Revisor/Curador/Administrador roles may edit review fields, and only Curador/Administrador may delete. Audit writes (`src/lib/audit.ts`), subtypes/relations, and legacy tabs require separate work units; this unit does not migrate them.
