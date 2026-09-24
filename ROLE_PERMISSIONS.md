# Matriz de Permisos por Rol — Geotrace

## Estado Actual (Base implementada)

La aplicación usa **guards granulares por rol** implementados en `src/components/shared/roleGuards.tsx` (`WithCatalogador`, `WithRevisor`, `WithCurador`, `WithAdmin`).

### Rutas y Visibilidad por Rol

| Vista                        | Ruta                          | Catalogador | Revisor | Curador | Administrador | Menú Visible    |
| ---------------------------- | ----------------------------- | ----------- | ------- | ------- | ------------- | --------------- |
| Dashboard                    | `/`                           | ✅          | ✅      | ✅      | ✅            | Sí              |
| Colecciones                  | `/colecciones`                | ✅          | ✅      | ✅      | ✅            | Sí              |
| Pozos                        | `/pozos`                      | ✅          | ✅      | ✅      | ✅            | Sí              |
| Placas                       | `/placas`                     | ✅          | ✅      | ✅      | ✅            | Sí              |
| Ubicaciones                  | `/ubicaciones`                | ✅          | ✅      | ✅      | ✅            | Sí              |
| Reportes                     | `/reportes`                   | ✅          | ✅      | ✅      | ✅            | Sí              |
| Reportes > Inventario        | `/reportes/inventario`        | ✅          | ✅      | ✅      | ✅            | Indirecto       |
| Reportes > Placas Problemas  | `/reportes/problemas`         | ✅          | ✅      | ✅      | ✅            | Indirecto       |
| Reportes > Ocupación Muebles | `/reportes/ocupacion-muebles` | ✅          | ✅      | ✅      | ✅            | Indirecto       |
| **Catálogos**                | `/catalogos`                  | ❌          | ❌      | ✅      | ✅            | Sí (curador+)   |
| **Importar Datos**           | `/importar`                   | ❌          | ❌      | ❌      | ✅            | Sí (solo admin) |
| **Gestión de Usuarios**      | `/usuarios`                   | ❌          | ❌      | ❌      | ✅            | Sí (solo admin) |

---

## Recomendaciones por Dominio (Biomuseología)

### Catalogador

**Rol**: Usuario base que puede crear y consultar datos.

- ✅ Acceso de **lectura total** a todas las vistas públicas
- ✅ Crear nuevas **muestras, placas, ubicaciones**
- ✅ Editar **sus propias creaciones**
- ❌ Aprobar/revisar catálogos (solo para Revisor/Curador)
- ❌ Gestión de usuarios

### Revisor

**Rol**: Valida calidad y completitud de datos creados por Catalogadores.

- ✅ Lectura total + Edición de **todas las muestras/placas** (audit trail recomendado)
- ✅ Gestión de **estado/validación** de registros
- ✅ Acceso a **reportes avanzados**
- ❌ Modificar catálogos de referencias (Curador)
- ❌ Gestión de usuarios

### Curador

**Rol**: Responsable de integridad y consistencia de colecciones.

- ✅ Todas las permisos de Revisor
- ✅ **Editar catálogos** (unidades litoestratigráficas, biozonas, edades, etc.)
- ✅ **Gestionar empresas/personas** asociadas
- ✅ Cambiar **estado de colecciones**
- ❌ Gestión de usuarios (solo Admin)

### Administrador

**Rol**: Control total de sistema, configuración y acceso.

- ✅ **Todas las funcionalidades**
- ✅ Gestión de usuarios (roles, activación, desactivación)
- ✅ Importación masiva de datos
- ✅ Auditoría completa

---

## Guard Actual

```typescript
// src/components/shared/roleGuards.tsx
// Guards reutilizables por nivel de permisos:

export function WithAdmin({ children }): renders admin-only routes
export function WithCurador({ children }): renders curador+ routes
export function WithRevisor({ children }): renders revisor+ routes
export function WithCatalogador({ children }): renders catalogador+ routes (all authenticated)
```

**Estado**: ✅ **Implementado**

- Guards creados en [src/components/shared/roleGuards.tsx](src/components/shared/roleGuards.tsx)
- Rutas actualizadas en [src/App.tsx](src/App.tsx) para usar guards granulares
- Menú lateral actualizado en [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx) para mostrar opciones por rol
- Comparación de rol: **case-insensitive** (lower-cased en guards)

---

## Implementación Completada ✅

### 1. Guards Granulares (✅ HECHO)

```
src/components/shared/roleGuards.tsx
  - WithAdmin
  - WithCurador
  - WithRevisor
  - WithCatalogador
```

### 2. Rutas Actualizadas (✅ HECHO)

- [src/App.tsx](src/App.tsx): Rutas protegidas con guards específicos por nivel

### 3. Menú Diferenciado por Rol (✅ HECHO)

- [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx)
    - Muestra usuario actual y rol
    - Secciones colapsables por permiso (Curación, Administración)
    - Links condicionales según nivel

### 4. Auditoría (⏳ PENDIENTE EN RUNTIME LOCAL)

- Auditoría local: pendiente de implementación en un servicio backend administrativo; no se usan los artefactos Supabase legacy.
- [sql/audit.sql](sql/audit.sql): Esquema de tabla `auditoria` con RLS
- **Estado**: `sql/schema.sql` no crea `public.auditoria`; `sql/audit.sql` es Supabase-específico y no se ejecuta como parte del runtime local. Por eso el dashboard devuelve `actividadReciente: []` y no expone auditoría a usuarios no administradores.

---

## Próximos Pasos (Opcionales)

1. **Diseñar la migración de auditoría local** sin asumir `auth.users`; queda fuera de este work unit y no se aplica `sql/audit.sql`.

2. **Crear un endpoint administrativo separado** para auditoría, protegido por rol de administrador, cuando exista una tabla local compatible.

3. Integrar auditoría únicamente mediante un servicio backend local cuando exista
   una tabla compatible; los hooks del navegador no deben escribir directamente en
   PostgreSQL.

4. **Row-Level Security (RLS) en Supabase**:
    - Catalogadores solo ven/editan sus propios registros (via `created_by` o `usuario_id`)
    - Revisores ven todo
    - Curadores + Admins sin restricción

5. **Reportes de auditoría** (pendiente; las rutas de reportes de auditoría no están registradas todavía):
     - Nueva vista de auditoría para admins (`/auditoria`), con endpoint/rol separado
     - Query de cambios recientes, actividad por usuario, etc.

---

## Notas Implementación

- Estado actual: **Seguro para MVP** (admin check funciona)
- Rol por defecto si falla auth: `Catalogador` (ver [AuthProvider.tsx](src/lib/AuthProvider.tsx#L56))
- Comparación de rol: **case-insensitive** (lower-cased en guards)
