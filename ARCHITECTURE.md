# Arquitectura y Estructura del Proyecto

Resumen de alto nivel para entender dónde está cada cosa y cómo se comunica.

Estructura principal (carpetas relevantes):

- `src/` — Código fuente
    - `components/` — Componentes React reutilizables y layout
        - `layout/` — `AppLayout`, `Sidebar`, `TopBar` (estructura de la app)
        - `shared/` — utilidades compartidas como `roleGuards`, `AuthDebug`
        - `ui/` — primitives de UI (botones, inputs, tablas, cards)
    - `pages/` — Rutas y páginas principales (Dashboard, Login, CRUDs)
    - `hooks/` — Hooks personalizados (data fetching con React Query)
    - `lib/` — Integraciones y utilidades (ej. `supabase.ts`, `AuthProvider`)
    - `stores/` — Zustand store para estado global ligero
    - `styles.css` — Tailwind + estilos base

- `sql/` — Esquema y scripts SQL para la base de datos
- `docs/` — Documentación del proyecto (detalles de dominio y operación)

Flujo de autenticación y datos:

1. `AuthProvider` (en `src/lib`) inicializa sesión desde Supabase y mantiene el usuario en `useAppStore`.
2. Hooks en `src/hooks` usan `supabase` y `@tanstack/react-query` para consultas y caché.
3. Los componentes UI son puros y reciben datos/handlers desde páginas o hooks.

Buenas prácticas observadas:

- Separación clara UI / lógica (hooks para fetching, components para render)
- Uso de React Query para sincronización y caché de datos
- Uso de Zustand para estado global mínimo (usuario, coleccion activa)

Consejos para un junior:

- Lee primero `src/lib/AuthProvider.tsx` y `src/lib/supabase.ts` para entender la integración con Supabase.
- Revisa hooks en `src/hooks` para ver cómo se hacen las consultas y añadir nuevos endpoints.
- Para añadir una página nueva: crear ruta en `App.tsx`, añadir archivo en `pages/`, y construir hooks + UI.
