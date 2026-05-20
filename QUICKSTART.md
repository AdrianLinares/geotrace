# Guía de Inicio Rápido

Objetivo: poner la aplicación en marcha localmente en 5–10 minutos.

Requisitos:

- Node.js 20+ y pnpm
- Acceso a una instancia de Supabase (puede ser la gratuita)

Pasos:

1. Clonar el repositorio

```bash
git clone <repo-url>
cd geotrace
```

2. Copiar variables de entorno

```bash
cp .env.example .env
# Edita .env y añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
```

3. Instalar dependencias

```bash
pnpm install
```

4. Levantar el servidor de desarrollo

```bash
pnpm run dev
# Abre http://localhost:5173 (o el puerto que indique Vite)
```

5. Probar autenticación (en local)

- Registra una instancia Supabase y crea un usuario de prueba via correo (magic link).
- Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env`.

Notas rápidas:

- Si ves warnings sobre variables de entorno en consola, revisa `.env`.
- La carpeta `sql/` contiene el esquema que puedes aplicar en tu proyecto Supabase.
