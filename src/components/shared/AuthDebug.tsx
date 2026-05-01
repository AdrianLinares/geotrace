import React, { useEffect, useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import supabase from '../../lib/supabase'
import { Button } from '../../components/ui/button'

/**
 * Componente de debug para diagnosticar problemas de autenticación y permisos
 * Muestra: sesión actual, datos de persona en BD, rol normalizado, etc.
 */
export default function AuthDebug() {
    const user = useAppStore((s) => s.user)
    const authLoading = useAppStore((s) => s.authLoading)
    const [sessionUser, setSessionUser] = useState<any>(null)
    const [personaData, setPersonaData] = useState<any>(null)
    const [dbError, setDbError] = useState<string | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (!isOpen) return

        const checkAuth = async () => {
            try {
                // 1. Obtener sesión actual
                const { data: session } = await supabase.auth.getSession()
                setSessionUser(session?.user || null)

                // 2. Si hay email, buscar en persona
                if (session?.user?.email) {
                    const { data: persona, error } = await supabase
                        .from('persona')
                        .select('*')
                        .eq('email', session.user.email)
                        .single()

                    if (error) {
                        setDbError(`Error buscando en persona: ${error.message}`)
                        setPersonaData(null)
                    } else {
                        setPersonaData(persona)
                        setDbError(null)
                    }
                }
            } catch (e: any) {
                setDbError(e.message)
            }
        }

        checkAuth()
    }, [isOpen])

    if (!isOpen) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsOpen(true)}
                    className="text-xs"
                >
                    🔍 Debug Auth
                </Button>
            </div>
        )
    }

    const normalizeRole = (role?: string) => (role ?? '').trim().toLowerCase()
    const displayRole = user?.rol || 'No autenticado'
    const normalizedRole = normalizeRole(user?.rol)
    const isAdmin = normalizedRole === 'administrador'

    return (
        <div className="fixed bottom-4 right-4 z-50 w-96 bg-white border rounded-lg shadow-lg p-4 max-h-96 overflow-auto text-sm">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-base">🔍 Auth Debug</h3>
                <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>✕</Button>
            </div>

            <div className="space-y-3 text-xs">
                {/* Estado de carga */}
                <div className="bg-blue-50 p-2 rounded">
                    <strong>Auth Loading:</strong> {authLoading ? '🔄 true' : '✅ false'}
                </div>

                {/* Datos de App Store */}
                <div className="bg-purple-50 p-2 rounded">
                    <strong>App Store User:</strong>
                    <pre className="mt-1 bg-white p-1 rounded text-xs overflow-auto max-h-24">
                        {JSON.stringify(user, null, 2)}
                    </pre>
                </div>

                {/* Rol normalizado */}
                <div className={`p-2 rounded ${isAdmin ? 'bg-green-50 border border-green-300' : 'bg-yellow-50 border border-yellow-300'}`}>
                    <strong>Rol Display:</strong> <code className="bg-white px-1 rounded">{displayRole}</code>
                    <br />
                    <strong>Rol Normalizado:</strong> <code className="bg-white px-1 rounded">{normalizedRole}</code>
                    <br />
                    <strong>Es Admin:</strong> {isAdmin ? '✅ SÍ' : '❌ NO'}
                </div>

                {/* Sesión Supabase */}
                <div className="bg-gray-50 p-2 rounded">
                    <strong>Supabase Session:</strong>
                    <pre className="mt-1 bg-white p-1 rounded text-xs overflow-auto max-h-20">
                        {sessionUser?.email ? `Email: ${sessionUser.email}\nID: ${sessionUser.id}` : 'Sin sesión'}
                    </pre>
                </div>

                {/* Datos de persona en BD */}
                <div className={`p-2 rounded ${personaData ? 'bg-green-50' : dbError ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <strong>Datos en tabla persona:</strong>
                    {personaData ? (
                        <pre className="mt-1 bg-white p-1 rounded text-xs overflow-auto max-h-24">
                            {JSON.stringify(personaData, null, 2)}
                        </pre>
                    ) : dbError ? (
                        <div className="mt-1 text-red-600">❌ {dbError}</div>
                    ) : (
                        <div className="mt-1 text-gray-600">⏳ Cargando...</div>
                    )}
                </div>

                {/* Recomendación */}
                {!isAdmin && personaData?.rol && (
                    <div className="bg-yellow-100 border border-yellow-400 p-2 rounded">
                        <strong>⚠️ Problema detectado:</strong>
                        <div className="mt-1">
                            Rol en BD: <code className="bg-white px-1 rounded">{personaData.rol}</code>
                            <br />
                            Normalizado: <code className="bg-white px-1 rounded">{normalizeRole(personaData.rol)}</code>
                            <br />
                            Esperado: <code className="bg-white px-1 rounded">administrador</code>
                        </div>
                    </div>
                )}

                {!personaData && !dbError && (
                    <div className="bg-red-100 border border-red-400 p-2 rounded">
                        <strong>❌ Usuario no encontrado en BD:</strong>
                        <div className="mt-1">
                            Email: <code className="bg-white px-1 rounded">{sessionUser?.email}</code>
                            <br />
                            Verifica que exista en la tabla <code className="bg-white px-1 rounded">persona</code>
                        </div>
                    </div>
                )}
            </div>

            <Button
                size="sm"
                variant="outline"
                className="w-full mt-3 text-xs"
                onClick={() => window.location.reload()}
            >
                Recargar página
            </Button>
        </div>
    )
}
