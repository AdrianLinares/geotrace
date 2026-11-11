# Legacy Supabase SQL artifacts

These files target the retired Supabase deployment. They depend on Supabase Auth
(`auth.uid()`, `auth.jwt()`) and on the Supabase `authenticated` database role, so
they must not run against the local PostgreSQL database.

GeoTrace now runs a single Node/Fastify backend. That backend authenticates
identity against Active Directory and authorizes every request in the server
(`requireRole`, plus per-operation checks in the repositories). The backend is the
security boundary, so Row Level Security is intentionally not enabled. See
`docs/roles-y-permisos.es.md` for the decision and its rationale.

- `helpers.sql`: `current_user_has_role(text)` resolves the user from the JWT email.
- `rls_policies_rbac.sql`: RBAC policy templates for the Supabase `authenticated` role.
  It still lists `CAT_PERMISO` and `REL_ROL_PERMISO`; those tables were dropped by
  `sql/migrations/009_drop_rbac_permission_tables.sql` because the application
  never used them.
- `audit.sql` and `triggers.sql`: the retired JWT/RLS-based audit implementation.
  Local auditing is implemented by `server/audit.ts` and
  `sql/migrations/010_local_audit.sql` instead.

Kept for historical reference only. The authoritative schema is `sql/schema.sql`.
