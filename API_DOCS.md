# Documentación de API y puntos clave

Este archivo recoge las interfaces y puntos de integración que un desarrollador junior usará más a menudo.

1. Cliente API local
    - `src/lib/api.ts` centraliza las peticiones autenticadas al backend local.
    - `src/lib/authApi.ts` gestiona `/auth/login`, `/auth/me` y `/auth/logout`.
    - Usa hooks para encapsular consultas y mutaciones; no accedas a PostgreSQL desde el navegador.

2. Hooks de datos (React Query)
    - Ver `src/hooks/` para ejemplos: `useColecciones`, `usePlacas`, `useUbicaciones`, `usePozos`, `useMuestras`, `useCatalogos`, `useDashboard`.
    - Patrón: hook exporta `useXxx()` que internamente usa `useQuery` o `useMutation`.
    - Cache: React Query maneja revalidación y errores, usa `isLoading`, `data`, `error`.

3. Estado global mínimo
    - `useAppStore` en `src/stores/appStore.ts` mantiene `user`, `authLoading`, `activeColeccion`.
    - Cambios concurrentes: usar setters del store; no introducir lógica de negocio compleja aquí.

4. Puntos de extensión
    - Para añadir endpoint: crear hook en `src/hooks`, añadir componentes en `src/pages` y exponer ruta en `App.tsx`.

5. Tip: Sanitizar entradas
    - Todas las entradas de usuario deben validarse; hay validadores en `src/lib/validations`.
