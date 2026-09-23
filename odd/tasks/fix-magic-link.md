# Fix magic-link authentication

## Objective

Make Supabase magic-link login establish a session reliably across PKCE, token-hash, and implicit-flow callbacks.

## Scope

- `src/pages/AuthCallback.tsx`
- `src/lib/AuthProvider.tsx`
- Remote Supabase auth-link policy `persona_link_own_auth_user`

## Completed tasks

- [x] Exchange callback `code` with `exchangeCodeForSession`.
- [x] Verify `token_hash` callbacks with `verifyOtp`.
- [x] Surface OAuth callback errors and remove infinite retries.
- [x] Stop syncing authorization roles to editable `user_metadata`.
- [x] Report `auth_user_id` link errors instead of silently swallowing them.
- [x] Add a secure remote policy allowing a persona to link only to its authenticated email and user ID.

## Verification

- `pnpm run test`: passed — 4 files, 10 tests.
- `pnpm run typecheck`: blocked by pre-existing errors in `src/hooks/useDashboard.ts`, `src/pages/Dashboard.tsx`, and `src/pages/reportes/PlacasProblemas.tsx`; no errors reported in the changed files.
- Remote policy verified as `public.persona_link_own_auth_user`.

## Evidence

- Commit: `7c4900c fix(auth): handle magic link callbacks reliably`
- Supabase security advisors still report legacy policies using `user_metadata`; the changed flow no longer writes to it.

## Next step

Test a real magic link from the configured Supabase email provider and inspect the callback URL/error if delivery or redirect configuration still fails.
