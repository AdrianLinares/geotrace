# Base de Datos

Información sobre el esquema PostgreSQL oficial y sus extensiones específicas de Supabase.

## Esquema Principal

Definido en `sql/schema.sql`. Incluye tablas para usuarios, placas, ubicaciones, etc.

## Instalación local

La secuencia standalone es:

1. `sql/schema.sql` (esquema oficial, sin dependencias externas).
2. `sql/migrations/001_app_auth_sessions.sql` (sesiones del servidor local).

No ejecute los archivos de `sql/legacy-supabase/` en PostgreSQL standalone:
requieren Supabase Auth, JWT o roles de Supabase. La auditoría local se aplica
con `sql/migrations/010_local_audit.sql`.

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

## Auditoría local

La tabla `public.auditoria` registra operaciones exitosas del backend local:
inserciones, actualizaciones, eliminaciones, importaciones, login y logout. Cada
entrada conserva la persona autenticada, tabla, operación, registro, cambios y
fecha. Solo Administrador puede consultar `GET /api/admin/audit`.

La escritura ocurre después de completar exitosamente cada operación en la capa
HTTP del backend; un fallo de auditoría no debe hacer pasar una operación de
negocio como exitosa, porque el request propaga el error.

## Tipos de Datos

Usa tipos estándar de PostgreSQL. Fechas en formato ISO con zona horaria.

## Notas para Colombia

- Use formato de fecha dd/mm/yyyy en la UI, pero almacene en ISO.
- La instalación VM no debe ejecutar los archivos de `sql/legacy-supabase/`. RLS quedó cerrado por decisión de arquitectura (ver arriba).
