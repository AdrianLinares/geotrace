import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'

/**
 * roleGuards.tsx
 * - Provee wrappers (Higher Order Components) para proteger rutas por rol.
 * - Uso: envolver una ruta con `<WithAdmin>...</WithAdmin>` para restringir.
 * - Importante: los roles deben venir del `AuthProvider` y ser comparados
 *   normalizados (lowercase) para evitar problemas con mayúsculas.
 */

interface GuardProps {
    children: React.ReactNode
}

/**
 * Normaliza el rol a minúsculas y sin espacios para comparación consistente
 */
function normalizeRole(role?: string): string {
    return (role ?? '').trim().toLowerCase()
}

function hasRole(user: { rol?: string; roles?: string[] } | null, ...requiredRoles: string[]): boolean {
    const assignedRoles = (user?.roles?.length ? user.roles : [user?.rol]).map(normalizeRole)
    return requiredRoles.some(role => assignedRoles.includes(normalizeRole(role)))
}

/**
 * Guard para Administrador
 * - Control total del sistema
 * - Gestión de usuarios, importación, catálogos, auditoría
 */
export function WithAdmin({ children }: GuardProps) {
    const user = useAppStore((s) => s.user)
    const authLoading = useAppStore((s) => s.authLoading)

    if (authLoading) return null

    if (!user) {
        return <Navigate to="/login" replace />
    }

    const isAdmin = hasRole(user, 'Administrador')

    if (!isAdmin) {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}

/**
 * Guard para Curador
 * - Edición de catálogos (biozonas, unidades litoestratigráficas, edades)
 * - Gestión de empresas/personas
 * - Cambio de estado de colecciones
 * - Acceso a revisión de datos
 */
export function WithCurador({ children }: GuardProps) {
    const user = useAppStore((s) => s.user)
    const authLoading = useAppStore((s) => s.authLoading)

    if (authLoading) return null

    if (!user) {
        return <Navigate to="/login" replace />
    }

    const isCurador = hasRole(user, 'Curador', 'Administrador')

    if (!isCurador) {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}

/**
 * Guard para Revisor
 * - Lectura y edición de todas las muestras/placas
 * - Gestión de estado/validación de registros
 * - Acceso a reportes avanzados
 */
export function WithRevisor({ children }: GuardProps) {
    const user = useAppStore((s) => s.user)
    const authLoading = useAppStore((s) => s.authLoading)

    if (authLoading) return null

    if (!user) {
        return <Navigate to="/login" replace />
    }

    const isRevisor = hasRole(user, 'Revisor', 'Curador', 'Administrador')

    if (!isRevisor) {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}

/**
 * Guard para Catalogador
 * - Acceso a creación y edición de muestras/placas/ubicaciones
 * - Lectura total
 * - Edición de propias creaciones (idealmente, con RLS en BD)
 */
export function WithCatalogador({ children }: GuardProps) {
    const user = useAppStore((s) => s.user)
    const authLoading = useAppStore((s) => s.authLoading)

    if (authLoading) return null

    // Todos los roles autenticados son al menos Catalogadores
    const isAuthed = !!user

    if (!isAuthed) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}
