# Catálogo de Placas (SGC)

Aplicación web para la catalogación y gestión de placas micropaleontológicas desarrollada para el Servicio Geológico Colombiano (SGC).

Este repositorio contiene el frontend en React + TypeScript, integrado con Supabase (Postgres + Auth) y desplegable en Cloudflare Pages.

Resumen rápido:

- Stack principal: React 18 + TypeScript + Vite, Tailwind CSS, Supabase, TanStack Query, Zustand
- Carpeta de código: `src/` — componentes, páginas, hooks y librerías
- Esquema de base de datos y SQL auxiliar: `sql/`

Requisitos mínimos:

1. Copiar `.env.example` → `.env` y configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
2. Instalar dependencias: `npm install`
3. Levantar entorno de desarrollo: `npm run dev`
4. (Opcional) Aplicar esquema a Supabase: `psql < sql/schema.sql` o usar la consola SQL de Supabase

Archivos y guías importantes (en español):

- Documentación principal del proyecto: [docs/README.es.md](docs/README.es.md)
- Guía de inicio rápido: [QUICKSTART.md](QUICKSTART.md)
- Arquitectura y estructura: [ARCHITECTURE.md](ARCHITECTURE.md)
- Variables de entorno: [ENVIRONMENT.md](ENVIRONMENT.md)
- Guía de contribución: [CONTRIBUTING.md](CONTRIBUTING.md)
- API y puntos importantes: [API_DOCS.md](API_DOCS.md)
- Solución de problemas: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

Si eres un desarrollador junior: sigue primero `QUICKSTART.md` y luego repasa `ARCHITECTURE.md` para entender la organización del código.

Contacto / Notas:

- Para preguntas sobre el dominio (roles, definiciones de campos) revisa `docs/roles-y-permisos.es.md`.
- Los scripts de despliegue están configurados para Cloudflare Pages y se ejecutan vía GitHub Actions en la rama `main`.
