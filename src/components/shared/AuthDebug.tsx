import React, { useEffect, useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { AuthApiError, getMe, type AuthenticatedUser } from '../../lib/authApi'
import { Button } from '../../components/ui/button'

export default function AuthDebug() {
  const user = useAppStore((state) => state.user)
  const authLoading = useAppStore((state) => state.authLoading)
  const [sessionUser, setSessionUser] = useState<AuthenticatedUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    getMe()
      .then(({ user: currentUser }) => {
        setSessionUser(currentUser)
        setError(null)
      })
      .catch((reason: unknown) => {
        setSessionUser(null)
        setError(reason instanceof AuthApiError ? reason.message : 'Unable to inspect authentication')
      })
  }, [isOpen])

  if (!isOpen) {
    return <div className="fixed bottom-4 right-4 z-50"><Button size="sm" variant="outline" onClick={() => setIsOpen(true)} className="text-xs">🔍 Debug Auth</Button></div>
  }

  const roles = user?.roles?.length ? user.roles : user?.rol ? [user.rol] : []
  const isAdmin = roles.some(role => role.trim().toLowerCase() === 'administrador')

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-white border rounded-lg shadow-lg p-4 text-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-base">🔍 Auth Debug</h3>
        <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>✕</Button>
      </div>
      <div className="space-y-3 text-xs">
        <div className="bg-blue-50 p-2 rounded"><strong>Auth Loading:</strong> {authLoading ? '🔄 true' : '✅ false'}</div>
        <div className="bg-purple-50 p-2 rounded"><strong>App Store User:</strong><pre>{JSON.stringify(user, null, 2)}</pre></div>
        <div className="p-2 rounded bg-yellow-50"><strong>Roles:</strong> {roles.length ? roles.join(', ') : 'No autenticado'} ({isAdmin ? 'admin' : 'non-admin'})</div>
        <div className={`p-2 rounded ${sessionUser ? 'bg-green-50' : error ? 'bg-red-50' : 'bg-gray-50'}`}>
          <strong>Backend session:</strong>
          <div>{sessionUser ? `Authenticated user: ${sessionUser.username}` : error ?? 'Not authenticated'}</div>
        </div>
      </div>
      <Button size="sm" variant="outline" className="w-full mt-3 text-xs" onClick={() => window.location.reload()}>Recargar página</Button>
    </div>
  )
}
