-- Local server-side sessions. Store only a SHA-256 token hash, never the cookie value.
CREATE TABLE IF NOT EXISTS public.app_auth_sessions (
    token_hash text PRIMARY KEY,
    persona_id bigint NOT NULL REFERENCES public."PERSONA"(persona_id) ON DELETE CASCADE,
    username varchar(255) NOT NULL,
    user_name varchar(511) NOT NULL,
    roles text[] NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_auth_sessions_expires_at ON public.app_auth_sessions(expires_at);
