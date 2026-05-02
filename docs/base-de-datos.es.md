# Base de Datos

Información sobre el esquema de base de datos PostgreSQL usado en Supabase.

## Esquema Principal

Definido en `sql/schema.sql`. Incluye tablas para usuarios, placas, ubicaciones, etc.

## Triggers y Auditoría

- `sql/triggers.sql`: Triggers para mantener integridad.
- `sql/audit.sql`: Sistema de auditoría para cambios.

## Tipos de Datos

Usa tipos estándar de PostgreSQL. Fechas en formato ISO con zona horaria.

## Notas para Colombia

- Use formato de fecha dd/mm/yyyy en la UI, pero almacene en ISO.
- Configure triggers para compliance con normativas locales.