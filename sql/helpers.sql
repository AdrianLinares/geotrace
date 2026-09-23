-- SUPABASE-SPECIFIC: no ejecutar durante la instalación PostgreSQL local.
-- Requiere Supabase Auth y sql/schema.sql ya ejecutado en una base Supabase.

-- ============================================================
-- current_user_has_role(role_name)
-- Devuelve true si el usuario autenticado de Supabase tiene una
-- asignación activa al rol indicado en REL_PERSONA_ROL.
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_user_has_role(role_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.rel_persona_rol rpr
        JOIN public.persona p ON p.persona_id = rpr.persona_id
        JOIN public.cat_rol cr ON cr.rol_id = rpr.rol_id
        WHERE p.correo = (auth.jwt() ->> 'email')
          AND cr.nombre = role_name
          AND rpr.activo = true
          AND (rpr.fecha_fin IS NULL OR rpr.fecha_fin > now())
    );
$$;

COMMENT ON FUNCTION public.current_user_has_role(text) IS
    'Resuelve si el usuario autenticado actual tiene el rol indicado a partir de REL_PERSONA_ROL y CAT_ROL.';
