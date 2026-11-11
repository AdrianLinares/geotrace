-- Remove the last Supabase remnant from PERSONA.
-- Authentication is owned by AD/local credentials plus app_auth_sessions; auth.users was never
-- used by the local runtime and is empty. This migration is idempotent and preserves all rows.

ALTER TABLE public.persona
    DROP CONSTRAINT IF EXISTS persona_auth_user_id_fkey;

ALTER TABLE public.persona
    DROP CONSTRAINT IF EXISTS uq_persona_auth_user_id;

DROP INDEX IF EXISTS public.idx_persona_auth_user_id;

ALTER TABLE public.persona
    DROP COLUMN IF EXISTS auth_user_id;
