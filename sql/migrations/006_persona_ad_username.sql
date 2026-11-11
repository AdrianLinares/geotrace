-- Separate the login identity (AD) from the editable contact email.
-- ad_username holds the directory identifier (sAMAccountName or uid) used by the login flow;
-- correo stays as an editable contact address and is no longer the authentication key.
-- Existing non-placeholder correo values are copied so current AD logins keep working. Access
-- seed placeholders (sin-correo+<id>@access.invalid) are not real identities and stay NULL.
-- This migration is idempotent and does not drop or truncate any data.

ALTER TABLE public.persona
    ADD COLUMN IF NOT EXISTS ad_username varchar(255);

UPDATE public.persona
   SET ad_username = correo
 WHERE ad_username IS NULL
   AND correo NOT LIKE '%@access.invalid';

CREATE UNIQUE INDEX IF NOT EXISTS uq_persona_ad_username_lower
    ON public.persona (lower(ad_username))
    WHERE ad_username IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_persona_correo_lower
    ON public.persona (lower(correo));

COMMENT ON COLUMN public.persona.ad_username
    IS 'Identificador de login en AD (sAMAccountName o uid); NULL si la persona no inicia sesión.';
COMMENT ON COLUMN public.persona.correo
    IS 'Email de contacto editable; no se usa para autenticar.';
COMMENT ON TABLE public.persona
    IS 'Personas que interactúan con el catálogo; ad_username identifica la cuenta AD y correo es el email de contacto.';
