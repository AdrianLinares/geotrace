# Integración con Supabase

Este documento explica cómo el proyecto se integra con Supabase para base de datos y autenticación.

## Configuración del Cliente

El cliente de Supabase se configura en `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default supabase
```

## Esquema de Base de Datos

El esquema oficial local se define en `sql/schema.sql`. Incluye tablas para:
- Usuarios y roles
- Placas micropaleontológicas
- Ubicaciones geográficas
- La auditoría local todavía está pendiente; `sql/audit.sql` es un artefacto histórico específico de Supabase y no forma parte de la instalación VM.

## Tipos de TypeScript

Los tipos de base de datos están definidos en `src/types/database.ts` (mantenidos a mano, solo el subset de tablas usado por el frontend).

## Autenticación

La aplicación usa Active Directory/LDAP para autenticar y PostgreSQL local para resolver las asignaciones de roles. Los roles se verifican en backend y se reflejan adicionalmente en `src/components/shared/roleGuards.tsx`.

## Notas para Colombia

- Configure RLS (Row Level Security) para cumplir con políticas de privacidad de datos del SGC.
- Use timestamps en zona horaria UTC-5 para registros.
- Asegúrese de que los nombres de tablas y campos cumplan con convenciones locales.
