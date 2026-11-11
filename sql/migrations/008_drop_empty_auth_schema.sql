-- Drop the empty Supabase auth schema left behind in local databases.
-- The local runtime never used auth.users (0 rows) and migration 007 removed the last FK that
-- pointed at it. This migration refuses to drop the schema if it holds data or unexpected tables,
-- so it is safe to re-run and never deletes user data silently.

DO $$
BEGIN
    IF to_regclass('auth.users') IS NULL THEN
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
          FROM pg_tables
         WHERE schemaname = 'auth'
           AND tablename <> 'users'
    ) THEN
        RAISE EXCEPTION 'auth schema contains unexpected tables; refusing to drop it';
    END IF;

    IF EXISTS (SELECT 1 FROM auth.users) THEN
        RAISE EXCEPTION 'auth.users is not empty; refusing to drop the auth schema';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM pg_constraint
         WHERE confrelid::regclass::text LIKE 'auth.%'
    ) THEN
        RAISE EXCEPTION 'objects still reference the auth schema; refusing to drop it';
    END IF;
END
$$;

DROP SCHEMA IF EXISTS auth CASCADE;
