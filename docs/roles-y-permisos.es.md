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
- `/colecciones`, `/placas`, `/ubicaciones`, `/reportes`: Todos autenticados
- `/catalogos`: Curador+
- `/usuarios`: Solo Admin

## Notas para Colombia

- Alinee permisos con jerarquías del SGC.
- Considere auditorías para cambios en roles.