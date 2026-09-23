# Local authentication server

This work unit adds the server-side authentication boundary only. Existing frontend Supabase data access is intentionally unchanged.

## Configuration

Copy the names below into the process environment; do not commit a `.env` file or credentials.

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string for the local application database. |
| `LDAP_URL` | yes | LDAP/LDAPS server URL. |
| `LDAP_STARTTLS` | no | Set `true` only when `LDAP_URL` uses `ldap://` and the server supports StartTLS. Production rejects plain LDAP without this explicit setting. |
| `LDAP_BASE_DN` | yes | Search base DN. |
| `LDAP_BIND_DN` / `LDAP_BIND_PASSWORD` | no (pair) | Optional service-account bind used for the directory search. |
| `LDAP_USER_SEARCH_FILTER` | no | Search filter containing `{{username}}`; defaults to common AD attributes. |
| `SERVER_HOST` / `SERVER_PORT` | no | Listen address and port. |
| `SESSION_TTL_SECONDS` | no | Session lifetime; defaults to 8 hours. |
| `SESSION_COOKIE_NAME` | no | HttpOnly cookie name. |
| `SESSION_COOKIE_SAME_SITE` | no | `strict`, `lax`, or `none`; defaults to `lax`. |
| `SESSION_COOKIE_SECURE` | no | Set `true` behind HTTPS. Required for `SameSite=none`. |
| `SESSION_COOKIE_DOMAIN` | no | Optional cookie domain. |

Run the session DDL in the local PostgreSQL database, then start the server:

```bash
pnpm install --frozen-lockfile
psql "$DATABASE_URL" -f sql/migrations/001_app_auth_sessions.sql
pnpm run dev:server
```

Endpoints are `GET /health`, `POST /auth/login` (`{ "username", "password" }`), `GET /auth/me`, and `POST /auth/logout`.

Authentication first binds the supplied AD user, then requires an active `PERSONA` row and at least one active, currently valid `REL_PERSONA_ROL` assignment. No default role is granted. Session cookies contain an opaque random token; PostgreSQL stores only its hash.

Each login creates and unbinds its own LDAP client. `CAT_ROL` in the current schema has no active/inactive column, so validation can enforce `PERSONA.activo`, `REL_PERSONA_ROL.activo`, and assignment dates, but cannot independently disable a role catalog row.
