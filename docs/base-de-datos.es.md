# Base de Datos

Información sobre el esquema PostgreSQL oficial y sus extensiones específicas de Supabase.

## Esquema Principal

Definido en `sql/schema.sql`. Incluye tablas para usuarios, placas, ubicaciones, etc.

## Instalación local

La secuencia standalone es:

1. `sql/schema.sql` (esquema oficial, sin dependencias externas).
2. `sql/migrations/001_app_auth_sessions.sql` (sesiones del servidor local).

No ejecute `sql/triggers.sql` ni `sql/audit.sql` en PostgreSQL standalone:
requieren Supabase Auth, JWT o roles de Supabase. Los artefactos de RLS y su
helper viven ahora en `sql/legacy-supabase/` y tampoco forman parte de la
instalación local.

Los identificadores SQL no entrecomillados se resuelven en minúscula según las
reglas de PostgreSQL; el uso histórico de mayúsculas en estos archivos no crea
identificadores distintos.

## Row Level Security

RLS no está habilitado, por decisión de arquitectura. El backend Fastify es el único cliente
de PostgreSQL, autentica contra Active Directory y autoriza cada request en el
servidor. Un RLS efectivo exigiría un rol de runtime distinto del owner, contexto
de usuario por request (`set_config`) y reescribir las políticas que hoy dependen
de `auth.uid()`/`auth.jwt()`; ese costo no aporta una barrera real en esta
arquitectura. Los archivos históricos de Supabase quedaron en
`sql/legacy-supabase/` y no deben ejecutarse.

## Triggers y Auditoría

- `sql/triggers.sql`: Triggers de auditoría para Supabase; no es parte de la instalación local.
- `sql/audit.sql`: Sistema de auditoría Supabase-specific; no es parte de la instalación local.

## Tipos de Datos

Usa tipos estándar de PostgreSQL. Fechas en formato ISO con zona horaria.

## Notas para Colombia

- Use formato de fecha dd/mm/yyyy en la UI, pero almacene en ISO.
- La instalación VM no debe ejecutar `sql/triggers.sql` ni `sql/audit.sql`: son artefactos Supabase-specific pendientes de reemplazo local. RLS quedó cerrado por decisión de arquitectura (ver arriba). La auditoría y los controles de compliance deben implementarse como work units locales antes de activar esa operación.
