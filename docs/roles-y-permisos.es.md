# Roles y Permisos

El sistema utiliza un sistema de roles para controlar el acceso a diferentes funcionalidades.

## Roles Disponibles

- **Catalogador**: Usuario por defecto. Puede catalogar nuevas placas.
- **Revisor**: Puede revisar y editar catálogos existentes.
- **Curador**: Acceso a catálogos y gestión avanzada.
- **Administrador**: Acceso completo, incluyendo gestión de usuarios.

Los roles no distinguen mayúsculas/minúsculas.

## Matriz de Permisos

| Funcionalidad | Catalogador | Revisor | Curador | Administrador |
|---------------|-------------|---------|---------|---------------|
| Ver colecciones | ✅ | ✅ | ✅ | ✅ |
| Catalogar placas | ✅ | ✅ | ✅ | ✅ |
| Revisar placas | ❌ | ✅ | ✅ | ✅ |
| Gestionar catálogos | ❌ | ❌ | ✅ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ❌ | ✅ |

## Protección de Rutas

Las rutas están protegidas en `src/App.tsx`:
- Públicas: `/login` y `/auth/callback`
- Todas las demás: requieren sesión activa (guard `WithCatalogador`)
- `/catalogos`: Curador+
- `/usuarios` e `/importar`: Solo Admin

## Autorización y RLS

La autorización efectiva vive en el backend: `requireRole` y las comprobaciones
por operación de los repositorios. Active Directory valida la identidad,
PostgreSQL concede los roles vía `rel_persona_rol`, y el servidor revalida los
roles en cada request.

RLS no está habilitado por decisión de arquitectura. El backend es el único
cliente de PostgreSQL y conecta con el rol owner, que bypassea RLS salvo que se
use `FORCE ROW LEVEL SECURITY`. Habilitarlo de verdad exigiría un rol de runtime
separado, contexto de usuario por request (`set_config`) y políticas nuevas que
no dependan de `auth.uid()`/`auth.jwt()`. Los archivos históricos de Supabase
quedaron en `sql/legacy-supabase/` y no deben ejecutarse.

## Notas para Colombia

- Alinee permisos con jerarquías del SGC.
- Considere auditorías para cambios en roles.