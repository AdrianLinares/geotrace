# Catálogo de Placas (SGC)

Proyecto para catalogación y gestión de placas micropaleontológicas del Servicio Geológico Colombiano (SGC).

Estructura inicial y schema SQL incluidos en /sql/schema.sql

Instrucciones rápidas:

- Copiar .env.example a .env y rellenar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
- Instalar dependencias: npm install
- Levantar entorno de desarrollo: npm run dev
- Aplicar schema a Supabase: psql < sql/schema.sql (o usar la interfaz SQL de Supabase)

## Documentación

- [Documentación en Español](docs/README.es.md)
- [Instalación Local](docs/instalacion-local.es.md)
- [Despliegue en Cloudflare Pages](docs/despliegue-cloudflare-pages.es.md)
- [Integración con Supabase](docs/supabase-integracion.es.md)
- [Roles y Permisos](docs/roles-y-permisos.es.md)
- [Base de Datos](docs/base-de-datos.es.md)
- [Importación de Datos](docs/importacion-datos.es.md)
- [Operación y Gotchas](docs/operacion-y-gotchas.es.md)
