import React from 'react'
import { useAppStore } from '../../stores/appStore'
import supabase from '../../lib/supabase'
import { Button } from '../ui/button'


export default function TopBar() {
  const user = useAppStore((s) => s.user)
  const active = useAppStore((s) => s.activeColeccion)

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-white border-b border-border">
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium">Colección:</div>
        <div className="text-sm">{active ?? 'Ninguna seleccionada'}</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm">{user?.nombre ?? 'Invitado'}</div>
        {user ? (
          <Button variant="outline" size="sm" onClick={async () => { await supabase.auth.signOut(); window.location.reload() }}>Cerrar sesión</Button>
        ) : (
          <a href="/login"><Button size="sm">Iniciar sesión</Button></a>
        )}
      </div>
    </header>
  )
}
