# Operación y Gotchas

Consejos para operar el sistema y evitar problemas comunes.

## Gotchas Comunes

- `AuthDebug` solo visible en desarrollo (`import.meta.env.DEV`).
- `dist/` está committed, no en .gitignore.
- Alias de path: `@/` → `src/`.
- Build target: ES2020.

## Monitoreo

- Use logs de Supabase.
- Monitoree despliegues en Cloudflare.

## Notas para Colombia

- Configure alertas para zona horaria COT.
- Asegúrese de backups para datos geológicos críticos.