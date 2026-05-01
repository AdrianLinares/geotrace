import supabase from './supabase'

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'READ'

export interface AuditLog {
    tabla: string
    accion: AuditAction
    registro_id: string
    usuario_id?: string
    usuario_nombre?: string
    cambios?: Record<string, any>
    timestamp?: string
}

/**
 * Registra una operación en la tabla de auditoría (si existe)
 * Manejo tolerante: si la tabla no existe, solo log a consola
 */
export async function logAudit(
    tabla: string,
    accion: AuditAction,
    registro_id: string,
    usuario_id?: string,
    usuario_nombre?: string,
    cambios?: Record<string, any>
) {
    try {
        // Intenta insertar en tabla de auditoría
        await supabase.from('auditoria').insert({
            tabla,
            accion,
            registro_id,
            usuario_id,
            usuario_nombre,
            cambios: cambios || null,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        // Si la tabla no existe, solo log a console (no rompe la operación)
        console.debug(`[Audit] ${accion} en ${tabla}/${registro_id} por ${usuario_nombre || usuario_id}`, {
            cambios,
            error,
        })
    }
}

/**
 * Wrapper para operaciones CRUD que registra automáticamente
 */
export async function withAudit<T>(
    operacion: () => Promise<T>,
    auditData: Omit<Parameters<typeof logAudit>[0], 'accion'>
): Promise<T> {
    try {
        const result = await operacion()
        return result
    } finally {
        // Log siempre, independientemente de éxito/error
        // (en un caso real, podrías diferenciar entre CREATE/UPDATE/DELETE)
        logAudit(
            auditData as Parameters<typeof logAudit>[0],
            'UPDATE',
            auditData as Parameters<typeof logAudit>[2]
        )
    }
}
