import React from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

type Props = { children: React.ReactNode }

/**
 * AppLayout
 * - Layout principal de la aplicación que contiene `Sidebar` y `TopBar`.
 * - Las páginas se renderizan en `main`.
 * - Para un junior: modifica este componente si quieres cambiar la estructura global
 *   (por ejemplo añadir un footer o ajustar padding/global container).
 */
export default function AppLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
