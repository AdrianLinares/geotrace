# Despliegue en Cloudflare Pages

Esta guía detalla cómo desplegar la aplicación en Cloudflare Pages utilizando GitHub Actions para automatización.

## Configuración de Despliegue

El proyecto está configurado para desplegarse automáticamente en Cloudflare Pages cuando se hace push a la rama `main`.

### Pasos Iniciales

1. **Configurar el proyecto en Cloudflare Pages**:
   - Vaya a Cloudflare Dashboard > Pages.
   - Conecte su repositorio de GitHub.
   - Configure el proyecto con el nombre `geotrace`.

2. **Variables de Entorno en Cloudflare**:
   Establezca las siguientes variables de entorno en la configuración de Pages:
   - `VITE_SUPABASE_URL`: URL de su proyecto Supabase
   - `VITE_SUPABASE_ANON_KEY`: Clave anónima de Supabase

3. **Secrets en GitHub**:
   En su repositorio de GitHub, configure los siguientes secrets en Settings > Secrets and variables > Actions:
   - `CLOUDFLARE_API_TOKEN`: Token de API de Cloudflare
   - `CLOUDFLARE_ACCOUNT_ID`: ID de cuenta de Cloudflare
   - `VITE_SUPABASE_URL`: URL de Supabase
   - `VITE_SUPABASE_ANON_KEY`: Clave anónima de Supabase

### Proceso de Despliegue

Cuando haga push a `main`, GitHub Actions ejecutará:
1. `npm ci` para instalar dependencias.
2. `npm run build` para construir la aplicación.
3. Despliegue de `dist/` a Cloudflare Pages.

### Verificación

Después del despliegue, la aplicación estará disponible en la URL proporcionada por Cloudflare Pages.

## Notas para Colombia

- Asegúrese de que el despliegue cumpla con regulaciones locales de alojamiento de datos.
- Configure logs y monitoreo para compliance con estándares del SGC.