# Guía de Contribución

Pequeña guía para contribuir al proyecto de forma consistente y amigable para desarrolladores junior.

1. Flujo de trabajo
    - Crea una rama con prefijo `feat/`, `fix/` o `docs/`: ej. `feat/login-improvements`.
    - Realiza cambios pequeños y bien comentados.
    - Abre un Pull Request con descripción clara del cambio y pasos para probar.

2. Estándares de código
    - TypeScript estricto: respeta los tipos existentes.
    - Formatea con `prettier` si está habilitado en el editor.
    - Evita cambios globales de formato en PRs de funcionalidad.

3. Convenciones
    - Componentes React: archivos `.tsx`, nombres en PascalCase.
    - Hooks: `useXxx` en `/src/hooks`.
    - Componentes UI pequeños en `/src/components/ui`.

4. Tests y verificación
    - El repo usa Vitest + React Testing Library. Ejecuta `pnpm test` (o `pnpm run test`) antes de abrir un PR.
    - La suite incluye tests unitarios e de integración (ver `tests/integration/README.md` para la plantilla).
    - Se ejecuta automáticamente en CI (`pnpm run test` en GitHub Actions).

5. Preguntas
    - Antes de grandes cambios, deja un issue describiendo la motivación.
