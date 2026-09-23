import React, { useEffect, useRef } from 'react'
import { useAppStore } from '../stores/appStore'
import { AuthApiError, getMe, toAppUser } from './authApi'

type Props = { children: React.ReactNode }

export default function AuthProvider({ children }: Props) {
  const setUser = useAppStore((state) => state.setUser)
  const setAuthLoading = useAppStore((state) => state.setAuthLoading)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    setAuthLoading(true)

    getMe()
      .then(({ user }) => {
        if (mounted.current) setUser(toAppUser(user))
      })
      .catch((error: unknown) => {
        if (!mounted.current) return
        if (!(error instanceof AuthApiError) || error.status !== 401) {
          console.error('AuthProvider: failed to restore authentication', error)
        }
        setUser(null)
      })
      .finally(() => {
        if (mounted.current) setAuthLoading(false)
      })

    return () => {
      mounted.current = false
    }
  }, [setAuthLoading, setUser])

  return <>{children}</>
}
