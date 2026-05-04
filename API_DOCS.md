# Documentación de API y puntos clave

Este archivo recoge las interfaces y puntos de integración que un desarrollador junior usará más a menudo.

1. Cliente Supabase
    - `src/lib/supabase.ts` exporta `supabase` (cliente configurado con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`).
    - Usar `supabase.from('tabla')` para consultas. Prefiere encapsular en hooks.

2. Hooks de datos (React Query)
    - Ver `src/hooks/` para ejemplos: `useColecciones`, `usePlacas`, `useUbicaciones`.
    - Patrón: hook exporta `useXxx()` que internamente usa `useQuery` o `useMutation`.
    - Cache: React Query maneja revalidación y errores, usa `isLoading`, `data`, `error`.

3. Estado global mínimo
    - `useAppStore` en `src/stores/appStore.ts` mantiene `user`, `authLoading`, `activeColeccion`.
    - Cambios concurrentes: usar setters del store; no introducir lógica de negocio compleja aquí.

4. Puntos de extensión
    - Para añadir endpoint: crear hook en `src/hooks`, añadir componentes en `src/pages` y exponer ruta en `App.tsx`.

5. Tip: Sanitizar entradas
    - Todas las entradas de usuario deben validarse; hay validadores en `src/lib/validations`.
