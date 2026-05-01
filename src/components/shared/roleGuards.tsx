import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'

interface GuardProps {
    children: React.ReactNode
}

/**
 * Normaliza el rol a minúsculas y sin espacios para comparación consistente
 */
function normalizeRole(role?: string): string {
    return (role ?? '').trim().toLowerCase()
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

    const role = normalizeRole(user?.rol)
    const isAdmin = role === 'administrador'

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

    const role = normalizeRole(user?.rol)
    const isCurador = role === 'curador' || role === 'administrador'

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

    const role = normalizeRole(user?.rol)
    const isRevisor = role === 'revisor' || role === 'curador' || role === 'administrador'

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
