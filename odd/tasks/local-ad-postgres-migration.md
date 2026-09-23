# Local AD and PostgreSQL Migration

## Objective

Run the SGC application entirely inside the institutional network without Supabase, using Active Directory for identity authentication and local PostgreSQL for application data and role assignments.

## Problem

The current browser application uses `@supabase/supabase-js` for authentication and direct data access. The target VM provides Nginx, Node.js, and PostgreSQL locally, but no Supabase services may be used.

## Scope

- Add a local Node.js/TypeScript API between the browser and PostgreSQL.
- Authenticate users against institutional Active Directory/LDAP.
- Permit login only when the authenticated AD user has an active application role assigned in PostgreSQL.
- Preserve application role hierarchy and route authorization in the frontend, with backend authorization as the security boundary.
- Replace frontend Supabase authentication and data access with the local API.
- Provide production deployment configuration for Nginx, Node.js, and PostgreSQL on the VM profile.
- Document required environment variables, AD connectivity, database initialization, health checks, and rollback.

## Out of scope

- Remote inspection or modification of any infrastructure server.
- Cloud Supabase, hosted authentication, or external database connectivity.
- Redesign of domain entities or business workflows unrelated to the transport/authentication migration.
- Automatic migration of production data until the source database and migration ownership are explicitly identified.

## Constraints

- Target baseline: Ubuntu 24.04, Nginx with HTTPS, Node.js, PostgreSQL on the secondary disk, no Docker requirement.
- AD credentials and application secrets must remain server-side and must never be shipped to the browser.
- PostgreSQL must not be exposed publicly unless infrastructure explicitly requires it.
- A user authenticated by AD but without an active application role must be rejected before an application session is issued.
- Technical artifacts remain in English; user-facing chat remains Spanish.
- `sql/schema.sql` is the authoritative local data model. The API and frontend must adapt to its normalized tables and relationships instead of recreating the legacy Supabase-shaped contract.

## Tasks

- [x] ODD-001 Define the local API boundary, session model, AD/LDAP configuration contract, and PostgreSQL role-assignment contract.
- [x] ODD-002 Add the backend foundation, health endpoint, configuration validation, structured errors, and PostgreSQL connection layer.
- [x] ODD-003 Implement AD authentication, application-role lookup, session creation, session restoration, and logout.
- [x] ODD-004 Migrate frontend authentication state, login UI, logout flow, and protected-route behavior to the local API.
- [ ] ODD-005 Migrate frontend Supabase data access to authenticated local API endpoints without exposing PostgreSQL credentials.
- [ ] ODD-006 Add database migrations/seeds needed for local roles, sessions, audit compatibility, and safe deployment.
- [ ] ODD-007 Add VM deployment assets and documentation for Node.js service, Nginx SPA/API routing, environment configuration, and rollback.
- [ ] ODD-008 Run focused tests, typecheck, production build, and deployment-readiness checks.

## Authorized scope

Repository-local source, tests, SQL migration files, deployment configuration, and documentation only. No remote execution or infrastructure mutation is authorized by this document.

## Acceptance criteria

- The browser has no Supabase dependency or database credential.
- AD authentication succeeds only for valid institutional credentials.
- A valid AD user without an active application role receives a clear rejection and no authenticated application session.
- A valid AD user with an active role receives a secure server-managed session and the role is returned from PostgreSQL-backed application data.
- Backend endpoints enforce authentication and role authorization independently of frontend guards.
- The app builds and tests locally with documented configuration and without external Supabase access.
- VM deployment is reproducible using Nginx, a Node.js service, and local PostgreSQL.

## Applicable checks

- `pnpm test`
- `pnpm run typecheck`
- `pnpm run build`
- Backend unit/integration checks for AD success, invalid credentials, missing role, inactive role, session restoration, logout, and role-protected API access.
- Configuration and deployment smoke checks documented in the VM guide.

## Progress

- Exploration completed: current application is a React/Vite SPA using Supabase Auth and direct Supabase data access; target authentication decision is Active Directory plus application-managed PostgreSQL roles.
- Remote infrastructure inspection intentionally not performed; the supplied VM was a reference example, not the target server.
- ODD-001 through ODD-003 implemented in the local backend work unit: AD/LDAP authentication, role-gated sessions, PostgreSQL session storage, health endpoint, and reusable backend role authorization.
- Security corrections applied: production LDAP transport enforcement, per-attempt LDAP clients with cleanup, role revalidation on session restore, and safe infrastructure-error handling.
- Verification: `pnpm test` passes 23 tests; `pnpm run build` passes; `pnpm run typecheck` remains blocked by pre-existing frontend errors in dashboard/reporting files.
- ODD-004 implemented in the frontend work unit: local API login/me/logout, HttpOnly-cookie session restoration, role-safe state mapping, and logout state cleanup. Temporary Supabase data access remains for later migration.
- Verification after ODD-004: `pnpm test` passes 29 tests; `pnpm run build` passes; `pnpm run typecheck` remains blocked by the same pre-existing dashboard/reporting errors.
- Data-model decision confirmed: use the current normalized `sql/schema.sql` as the source of truth; adapt API DTOs and frontend mappings rather than adding legacy tables.
- ODD-005 progress: normalized, authenticated collection and well reads; basin reference reads; collection CRUD; explicit DTO mapping; paginated totals; and runtime request validation. Remaining Supabase consumers include plates, samples, locations, dashboard, catalogs beyond basins, users, import, audit, and compound forms.
- ODD-005 progress: normalized authenticated plate and sample reads were added with schema-confirmed DTOs and explicit handling for the missing normalized sample-to-plate relationship. Legacy mutations remain isolated until transactional write endpoints are designed.
- ODD-005 progress: normalized physical-location reads were added with schema-confirmed joins, filters, pagination, and an explicit legacy limitation. Dashboard aggregation and bulk import still require separate normalized work units.
- ODD-007 progress: added Ubuntu 24.04 deployment assets for systemd, Nginx HTTPS/SPA routing, local-session migration, smoke checks, and VM operations documentation. Nginx syntax still requires validation on the target VM.
- ODD-005 progress: normalized dashboard metrics and conservation/occupancy reads were migrated behind `/api/dashboard`; local audit activity remains intentionally empty until an administrator-scoped local audit model is implemented.
- ODD-005 progress: administrative user and role management now uses local PostgreSQL `persona`, `cat_rol`, and `rel_persona_rol`, with Administrator-only authorization, transactional assignment, last-admin protection, and frontend session reconciliation after revocation.
- Engram mirror: pending because Engram tools were unavailable in this session.

## Next step

Continue ODD-005 with normalized plates, samples, and physical-storage API contracts; preserve transactional boundaries for compound forms.
