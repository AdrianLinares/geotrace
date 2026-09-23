# Base de Datos

Información sobre el esquema PostgreSQL oficial y sus extensiones específicas de Supabase.

## Esquema Principal

Definido en `sql/schema.sql`. Incluye tablas para usuarios, placas, ubicaciones, etc.

## Instalación local

La secuencia standalone es:

1. `sql/schema.sql` (esquema oficial, sin dependencias externas).
2. `sql/migrations/001_app_auth_sessions.sql` (sesiones del servidor local).

No ejecute `sql/helpers.sql`, `sql/rls_policies_rbac.sql`, `sql/triggers.sql` ni
`sql/audit.sql` en PostgreSQL standalone. Esos archivos requieren Supabase Auth,
JWT o roles de Supabase y están marcados explícitamente como Supabase-specific.

Los identificadores SQL no entrecomillados se resuelven en minúscula según las
reglas de PostgreSQL; el uso histórico de mayúsculas en estos archivos no crea
identificadores distintos.

## Triggers y Auditoría

- `sql/triggers.sql`: Triggers de auditoría para Supabase; no es parte de la instalación local.
- `sql/audit.sql`: Sistema de auditoría Supabase-specific; no es parte de la instalación local.

## Tipos de Datos

Usa tipos estándar de PostgreSQL. Fechas en formato ISO con zona horaria.

## Notas para Colombia

- Use formato de fecha dd/mm/yyyy en la UI, pero almacene en ISO.
- La instalación VM no debe ejecutar `sql/triggers.sql`, `sql/rls_policies_rbac.sql` ni `sql/audit.sql`: son artefactos Supabase-specific pendientes de reemplazo local. La auditoría y los controles de compliance deben implementarse como work units locales antes de activar esa operación.
