import React from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

type Props = { children: React.ReactNode }

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
