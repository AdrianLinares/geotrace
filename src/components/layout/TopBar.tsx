import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'
import { logout } from '../../lib/authApi'
import { Button } from '../ui/button'


export default function TopBar() {
  const user = useAppStore((s) => s.user)
  const setUser = useAppStore((s) => s.setUser)
  const setActiveColeccion = useAppStore((s) => s.setActiveColeccion)
  const active = useAppStore((s) => s.activeColeccion)
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // Clear local state even when the server is unavailable.
    } finally {
      setUser(null)
      setActiveColeccion(null)
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-white border-b border-border">
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium">Colección:</div>
        <div className="text-sm">{active ?? 'Ninguna seleccionada'}</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm">{user?.nombre ?? 'Invitado'}</div>
        {user ? (
          <Button variant="outline" size="sm" onClick={handleLogout}>Cerrar sesión</Button>
        ) : (
          <a href="/login"><Button size="sm">Iniciar sesión</Button></a>
        )}
      </div>
    </header>
  )
}
