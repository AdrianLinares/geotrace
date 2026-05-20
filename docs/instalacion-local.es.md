# Instalación Local

Esta guía explica cómo configurar y ejecutar el proyecto Catálogo de Placas localmente en su máquina.

## Prerrequisitos

- Node.js 20 o superior
- pnpm
- Cuenta de Supabase

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

3. **Configurar variables de entorno**:
   Copie el archivo `.env.example` a `.env` y complete las variables necesarias:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=public-anon-key
   ```
   Reemplace los valores con las credenciales reales de su proyecto Supabase.

4. **Aplicar el esquema de base de datos**:
   Use la interfaz SQL de Supabase o psql para ejecutar los archivos en `/sql/`:
   - `sql/schema.sql`
   - `sql/triggers.sql`
   - `sql/audit.sql`

5. **Levantar el servidor de desarrollo**:
   ```bash
   pnpm run dev
   ```
   El proyecto estará disponible en `http://localhost:5173`.

## Notas para Colombia

- Asegúrese de que las fechas en la base de datos y la aplicación usen el formato dd/mm/yyyy.
- Configure la zona horaria del servidor a UTC-5 para alinearse con la hora colombiana (COT).
- Verifique el cumplimiento con políticas de datos del SGC para muestras geológicas.