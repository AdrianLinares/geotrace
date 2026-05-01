import React, { useEffect, useRef } from 'react'
import supabase from './supabase'
import { useAppStore } from '../stores/appStore'

type Props = { children: React.ReactNode }

export default function AuthProvider({ children }: Props) {
  const setUser = useAppStore((s) => s.setUser)
  const setAuthLoading = useAppStore((s) => s.setAuthLoading)
  const mounted = useRef(true)
  const sessionHandled = useRef(false)

  useEffect(() => {
    mounted.current = true
    console.log('AuthProvider: Montando')

    // Single source of truth: getSession on mount
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted.current) return
      if (error) {
        console.error('AuthProvider: Error en getSession', error)
        setUser(null)
        setAuthLoading(false)
        return
      }
      if (data.session?.user) {
        console.log('AuthProvider: Sesión inicial encontrada', data.session.user.email)
        fetchPersonaAndSet(data.session.user.email).finally(() => {
          sessionHandled.current = true
          if (mounted.current) setAuthLoading(false)
        })
      } else {
        console.log('AuthProvider: Sin sesión inicial')
        setUser(null)
        sessionHandled.current = true
        setAuthLoading(false)
      }
    })

    // Only react to future sign-in / sign-out events
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted.current) return
      if (event === 'INITIAL_SESSION') return
      if (event === 'TOKEN_REFRESHED') return

      console.log('AuthProvider: onAuthStateChange', { event, hasSession: !!session })

      if (event === 'SIGNED_IN' && session?.user) {
        setAuthLoading(true)
        fetchPersonaAndSet(session.user.email).finally(() => {
          if (mounted.current) setAuthLoading(false)
        })
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => {
      mounted.current = false
      listener?.subscription.unsubscribe()
    }
  }, [])

  async function fetchPersonaAndSet(email?: string | null) {
    if (!email) { setUser(null); return }
    try {
      const { data, error } = await supabase
        .from('persona')
        .select('*')
        .ilike('email', email)
        .limit(1)

      if (error) {
        console.error('AuthProvider: Error consultando persona', error)
        setUser(null)
        return
      }
      if (!data?.length) {
        console.warn('AuthProvider: No existe persona para', email)
        setUser(null)
        return
      }
      const p = data[0]
      console.log('AuthProvider: Persona cargada', p.nombre, p.rol)
      setUser({ persona_id: p.persona_id, nombre: p.nombre, rol: p.rol })
    } catch (e) {
      console.error('AuthProvider: Error inesperado', e)
      setUser(null)
    }
  }

  return <>{children}</>
}
