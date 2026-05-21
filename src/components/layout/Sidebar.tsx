import React from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'

function normalizeRole(role?: string): string {
  return (role ?? '').trim().toLowerCase()
}

export default function Sidebar() {
  const user = useAppStore((s) => s.user)
  const role = normalizeRole(user?.rol)
  const isAdmin = role === 'administrador'
  const isCurador = role === 'curador' || isAdmin
  const isRevisor = role === 'revisor' || isCurador
  const isAuthed = !!user

  return (
    <aside className="w-64 bg-white border-r border-border p-4 flex flex-col">
      <div className="mb-2 text-lg font-semibold">SGC - Bioestratigrafía</div>
      <div className="text-xs text-muted-foreground mb-6">{user?.nombre || 'Invitado'} ({user?.rol || 'No autenticado'})</div>
      <nav className="flex-1">
        <ul className="space-y-2">
          {/* Acceso total */}
          <li><Link to="/" className="block p-2 rounded hover:bg-surface">Dashboard</Link></li>
          <li><Link to="/colecciones" className="block p-2 rounded hover:bg-surface">Colecciones</Link></li>
          <li><Link to="/pozos" className="block p-2 rounded hover:bg-surface">Pozos</Link></li>
          <li><Link to="/placas" className="block p-2 rounded hover:bg-surface">Placas</Link></li>
          <li><Link to="/ubicaciones" className="block p-2 rounded hover:bg-surface">Ubicaciones</Link></li>
          <li><Link to="/reportes" className="block p-2 rounded hover:bg-surface">Reportes</Link></li>

          {/* Acceso Curador+ */}
          {isCurador && <hr className="my-3" />}
          {isCurador && <li className="text-xs font-semibold text-muted-foreground px-2">Curación</li>}
          {isCurador && <li><Link to="/catalogos" className="block p-2 rounded hover:bg-surface">Catálogos</Link></li>}

          {/* Acceso Admin */}
          {isAdmin && <hr className="my-3" />}
          {isAdmin && <li className="text-xs font-semibold text-muted-foreground px-2">Administración</li>}
          {isAdmin && <li><Link to="/importar" className="block p-2 rounded hover:bg-surface">Importar Datos</Link></li>}
          {isAdmin && <li><Link to="/usuarios" className="block p-2 rounded hover:bg-surface">Gestión de Usuarios</Link></li>}
        </ul>
      </nav>
      <div className="text-xs text-muted-foreground mt-4">v0.1.0</div>
    </aside>
  )
}
