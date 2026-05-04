# Variables de Entorno y Configuración

Variables principales requeridas en `.env` (basadas en `.env.example`):

- `VITE_SUPABASE_URL` — URL pública del proyecto Supabase (ej. https://xyzcompany.supabase.co)
- `VITE_SUPABASE_ANON_KEY` — Key pública (publishable) para el cliente frontend

Notas de seguridad:

- Nunca comitear `VITE_SUPABASE_ANON_KEY` o `.env` en repositorios públicos.
- Las keys de servidor/servicios deben almacenarse en secrets del deploy (Cloudflare/Netlify/etc).

Cómo obtener las claves:

1. Crea un proyecto en https://app.supabase.com
2. En Settings -> API copia `URL` y `anon` key
3. Pega en `.env`

Otras configuraciones útiles:

- `VITE_SOME_FEATURE_FLAG` — (opcional) para activar características experimentales en dev
