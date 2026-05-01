import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'

interface Props {
  children: React.ReactNode
}

export default function WithAdmin({ children }: Props) {
  const user = useAppStore((s) => s.user)
  const authLoading = useAppStore((s) => s.authLoading)

  if (authLoading) {
    return null
  }

  const role = (user?.rol ?? '').trim().toLowerCase()
  const isAdmin = role === 'administrador' || role === 'admin'

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
