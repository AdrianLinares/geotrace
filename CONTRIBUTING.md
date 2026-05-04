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
    - No hay suite de tests obligatoria en el repo actualmente; cuando agregues tests, integra un comando en `package.json`.

5. Preguntas
    - Antes de grandes cambios, deja un issue describiendo la motivación.
