-- Drop the unused RBAC permission tables.
-- Authorization is role-based (CAT_ROL + REL_PERSONA_ROL); CAT_PERMISO and
-- REL_ROL_PERMISO were never populated or read by the application. The guard
-- refuses to drop a table that still holds rows, so no data is deleted silently
-- and the migration is safe to re-run.

DO $$
BEGIN
    IF to_regclass('public.cat_permiso') IS NOT NULL
       AND EXISTS (SELECT 1 FROM public.cat_permiso) THEN
        RAISE EXCEPTION 'cat_permiso is not empty; refusing to drop it';
    END IF;

    IF to_regclass('public.rel_rol_permiso') IS NOT NULL
       AND EXISTS (SELECT 1 FROM public.rel_rol_permiso) THEN
        RAISE EXCEPTION 'rel_rol_permiso is not empty; refusing to drop it';
    END IF;
END
$$;

DROP TABLE IF EXISTS public.rel_rol_permiso CASCADE;
DROP TABLE IF EXISTS public.cat_permiso CASCADE;
