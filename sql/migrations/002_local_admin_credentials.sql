-- Temporary local emergency credentials. Independent of Supabase/Auth/AD.
CREATE TABLE IF NOT EXISTS public.app_local_admin_credentials (
    persona_id bigint PRIMARY KEY REFERENCES public.persona(persona_id) ON DELETE CASCADE,
    username varchar(255) NOT NULL UNIQUE,
    password_hash text NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Keep this exactly aligned with server/passwords.ts (scrypt N=16384, r=8, p=1,
-- 16-byte salt, and 64-byte derived key, all encoded as lowercase/uppercase hex).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint
         WHERE conrelid = 'public.app_local_admin_credentials'::regclass
           AND conname = 'app_local_admin_credentials_password_hash_format'
    ) THEN
        ALTER TABLE public.app_local_admin_credentials
            ADD CONSTRAINT app_local_admin_credentials_password_hash_format
            CHECK (password_hash ~ '^scrypt\$16384\$8\$1\$[0-9a-fA-F]{32}\$[0-9a-fA-F]{128}$');
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_app_local_admin_credentials_enabled_username
    ON public.app_local_admin_credentials(enabled, lower(username));
