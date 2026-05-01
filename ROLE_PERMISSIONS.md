# Matriz de Permisos por Rol — Geotrace

## Estado Actual (Base implementada)

La aplicación actualmente tiene **una única distinción de permisos**: Admin vs. No-Admin.

### Rutas y Visibilidad por Rol

| Vista                        | Ruta                          | Catalogador | Revisor | Curador | Administrador | Menú Visible    |
| ---------------------------- | ----------------------------- | ----------- | ------- | ------- | ------------- | --------------- |
| Dashboard                    | `/`                           | ✅          | ✅      | ✅      | ✅            | Sí              |
| Colecciones                  | `/colecciones`                | ✅          | ✅      | ✅      | ✅            | Sí              |
| Placas                       | `/placas`                     | ✅          | ✅      | ✅      | ✅            | Sí              |
| Ubicaciones                  | `/ubicaciones`                | ✅          | ✅      | ✅      | ✅            | Sí              |
| Reportes                     | `/reportes`                   | ✅          | ✅      | ✅      | ✅            | Sí              |
| Reportes > Inventario        | `/reportes/inventario`        | ✅          | ✅      | ✅      | ✅            | Indirecto       |
| Reportes > Placas Problemas  | `/reportes/problemas`         | ✅          | ✅      | ✅      | ✅            | Indirecto       |
| Reportes > Ocupación Muebles | `/reportes/ocupacion-muebles` | ✅          | ✅      | ✅      | ✅            | Indirecto       |
| **Catálogos**                | `/catalogos`                  | ❌          | ❌      | ❌      | ✅            | Sí (solo admin) |
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

### 4. Auditoría (✅ INIT)

- [src/lib/audit.ts](src/lib/audit.ts): Servicio de logging de operaciones CRUD
- [sql/audit.sql](sql/audit.sql): Esquema de tabla `auditoria` con RLS
- **Estado**: Estructura lista; requiere ejecutar SQL en Supabase para activar

---

## Próximos Pasos (Opcionales)

1. **Ejecutar SQL de auditoría** en Supabase para crear tabla `auditoria`

2. **Integrar logAudit** en operaciones CRUD actuales:

    ```typescript
    // Ejemplo en hooks/usePlacas.ts (o similar)
    const { mutateAsync } = useMutation({
        mutationFn: async (placa) => {
            const { error } = await supabase.from("placa").insert(placa);
            if (!error)
                logAudit(
                    "placa",
                    "CREATE",
                    placa.id,
                    user.persona_id,
                    user.nombre,
                );
        },
    });
    ```

3. **Row-Level Security (RLS) en Supabase**:
    - Catalogadores solo ven/editan sus propios registros (via `created_by` o `usuario_id`)
    - Revisores ven todo
    - Curadores + Admins sin restricción

4. **Reportes de auditoría**:
    - Nueva vista de auditoría para admins (`/auditoria`)
    - Query de cambios recientes, actividad por usuario, etc.

---

## Notas Implementación

- Estado actual: **Seguro para MVP** (admin check funciona)
- Rol por defecto si falla auth: `Catalogador` (ver [AuthProvider.tsx](src/lib/AuthProvider.tsx#L56))
- Comparación de rol: **case-insensitive** (lower-cased en guards)
