# Arquitectura y Estructura del Proyecto

Resumen de alto nivel para entender dónde está cada cosa y cómo se comunica.

Estructura principal (carpetas relevantes):

- `src/` — Código fuente
    - `components/` — Componentes React reutilizables y layout
        - `layout/` — `AppLayout`, `Sidebar`, `TopBar` (estructura de la app)
        - `shared/` — utilidades compartidas como `roleGuards`, `AuthDebug`, `Combobox`
        - `ui/` — primitives de UI (botones, inputs, tablas, cards, dialog)
    - `pages/` — Rutas y páginas principales (Dashboard, Login, CRUDs)
        - `catalogos/`, `colecciones/`, `placas/`, `pozos/`, `muestras/`, `reportes/`, `ubicaciones/`, `usuarios/`
    - `hooks/` — Hooks personalizados (data fetching con React Query)
        - `useColecciones`, `usePlacas`, `usePozos`, `useMuestras`, `useUbicaciones`, `useCatalogos`, `useDashboard`
    - `lib/` — Integraciones y utilidades (`supabase.ts`, `AuthProvider.tsx`, `audit.ts`, `validations/`)
    - `stores/` — Zustand store para estado global ligero
    - `types/` — Tipos TypeScript de las tablas de Supabase (`database.ts`)
    - `styles.css` — Tailwind + estilos base

- `sql/` — Esquema y scripts SQL para la base de datos (nota: esquema en proceso de rediseño)
- `docs/` — Documentación del proyecto (detalles de dominio y operación)
- `tests/` — Suite de pruebas (unitarias e de integración con Vitest + React Testing Library)

Flujo de autenticación y datos:

1. `AuthProvider` (en `src/lib`) inicializa sesión desde Supabase y mantiene el usuario en `useAppStore`. Incluye `syncRoleToMetadata` para sincronizar el rol al JWT.
2. Hooks en `src/hooks` usan `supabase` y `@tanstack/react-query` para consultas y caché.
3. Los componentes UI son puros y reciben datos/handlers desde páginas o hooks.
4. `roleGuards` (`WithCatalogador`, `WithRevisor`, `WithCurador`, `WithAdmin`) protegen rutas en `App.tsx` según el rol del usuario.

Buenas prácticas observadas:

- Separación clara UI / lógica (hooks para fetching, components para render)
- Uso de React Query para sincronización y caché de datos
- Uso de Zustand para estado global mínimo (usuario, coleccion activa)

Consejos para un junior:

- Lee primero `src/lib/AuthProvider.tsx` y `src/lib/authApi.ts` para entender la sesión local basada en AD/API.
- Revisa hooks en `src/hooks` para ver cómo se hacen las consultas y añadir nuevos endpoints.
- Para añadir una página nueva: crear ruta en `App.tsx`, añadir archivo en `pages/`, y construir hooks + UI.
