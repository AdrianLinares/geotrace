# Instalación Local

Esta guía explica cómo configurar y ejecutar el proyecto Catálogo de Placas localmente en su máquina.

## Prerrequisitos

- Node.js 20 o superior
- pnpm
- PostgreSQL standalone

## Pasos de Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/geotrace.git
   cd geotrace
   ```

2. **Instalar dependencias**:
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno de la aplicación**:
   Configure las variables del servidor local según `server/README.md`. No es
   necesario configurar Supabase para instalar el esquema standalone.
   ```
   DATABASE_URL=postgresql://...
   ```
   No versionar secretos ni modificar `.env` como parte de esta instalación.

4. **Aplicar el esquema de base de datos**:
   Ejecute primero el esquema oficial y después la migración de sesiones:
   ```bash
   psql "$DATABASE_URL" -f sql/schema.sql
   pnpm run db:migrate:local-sessions
   ```
   No ejecute `sql/triggers.sql` ni `sql/audit.sql`: están marcados como
   Supabase-specific y todavía no tienen equivalente local. Los archivos
   históricos de RLS quedaron en `sql/legacy-supabase/` y no forman parte de la
   instalación.

5. **Verificar el esquema sin PostgreSQL**:
   ```bash
   pnpm run check:local-schema
   ```

6. **Levantar el servidor de desarrollo**:
   ```bash
   pnpm run dev
   ```
   El proyecto estará disponible en `http://localhost:5173`.

## Notas para Colombia

- Asegúrese de que las fechas en la base de datos y la aplicación usen el formato dd/mm/yyyy.
- Configure la zona horaria del servidor a UTC-5 para alinearse con la hora colombiana (COT).
- Verifique el cumplimiento con políticas de datos del SGC para muestras geológicas.
