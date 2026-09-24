# Integración histórica con Supabase

Este documento se conserva únicamente como referencia histórica. La aplicación
instalada en la VM no usa Supabase: utiliza Active Directory/LDAP, un backend
Node.js local y PostgreSQL local.

La configuración anterior mediante `src/lib/supabase.ts` y `VITE_SUPABASE_*`
fue retirada. No reutilice los ejemplos restantes de este documento para una
instalación nueva; consulte `docs/despliegue-vm.es.md`.

## Migración

El esquema local se instala desde `sql/schema.sql` y la sesión desde
`sql/migrations/001_app_auth_sessions.sql`. Los archivos RLS, triggers y
auditoría originales de Supabase están marcados como históricos y no forman
parte de la secuencia local.

## Esquema de Base de Datos

El esquema oficial local se define en `sql/schema.sql`. Incluye tablas para:
- Usuarios y roles
- Placas micropaleontológicas
- Ubicaciones geográficas
- La auditoría local todavía está pendiente; `sql/audit.sql` es un artefacto histórico específico de Supabase y no forma parte de la instalación VM.

## Tipos de TypeScript

Los tipos de base de datos están definidos en `src/types/database.ts` (mantenidos a mano, solo el subset de tablas usado por el frontend).

## Autenticación

La aplicación usa Active Directory/LDAP para autenticar y PostgreSQL local para resolver las asignaciones de roles. Los roles se verifican en backend y se reflejan adicionalmente en `src/components/shared/roleGuards.tsx`.

## Notas operativas

- La autorización se aplica en el backend mediante AD y roles PostgreSQL.
- Use timestamps con zona horaria y mantenga las políticas de backup del SGC.
- Asegúrese de que los nombres de tablas y campos cumplan con convenciones locales.
