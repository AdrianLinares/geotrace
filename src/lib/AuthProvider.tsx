import React, { useEffect } from 'react'
import supabase from './supabase'
import { useAppStore } from '../stores/appStore'

type Props = { children: React.ReactNode }

export default function AuthProvider({ children }: Props) {
  const setUser = useAppStore((s) => s.setUser)
  const setAuthLoading = useAppStore((s) => s.setAuthLoading)

  useEffect(() => {
    console.log('AuthProvider: Montando, verificando sesión inicial')

    // fetch current session on mount
    supabase.auth.getSession().then(async (res) => {
      console.log('AuthProvider: getSession inicial', { 
        hasSession: !!res?.data?.session,
        userEmail: res?.data?.session?.user?.email,
        error: res.error
      })
      
      if (res?.data?.session?.user) {
        const u = res.data.session.user
        console.log('AuthProvider: Hay sesión, buscando persona para', u.email)
        // fetch persona by email
        await fetchPersonaAndSet(u.email)
      } else {
        console.log('AuthProvider: No hay sesión inicial')
        setUser(null)
      }
      setAuthLoading(false)
    }).catch((err) => {
      console.error('AuthProvider: Error en getSession inicial', err)
      setUser(null)
      setAuthLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: onAuthStateChange', { event, hasSession: !!session, userEmail: session?.user?.email })
      
      setAuthLoading(true)
      if (session?.user) {
        await fetchPersonaAndSet(session.user.email)
      } else {
        setUser(null)
      }
      setAuthLoading(false)
    })

    return () => {
      console.log('AuthProvider: Desmontando, limpiando listener')
      listener?.subscription.unsubscribe()
    }
  }, [])

  async function fetchPersonaAndSet(email?: string | null) {
    console.log('AuthProvider: fetchPersonaAndSet para email:', email)
    
    if (!email) {
      console.log('AuthProvider: No hay email, setUser(null)')
      setUser(null)
      return
    }
    try {
      // Use case-insensitive match and tolerate duplicates by taking the first result.
      const { data, error } = await supabase.from('persona').select('*').ilike('email', email).limit(1)
      console.log('AuthProvider: Resultado consulta persona', { data, error })
      
      if (error) {
        console.error('AuthProvider: Error fetching persona:', error)
        setUser(null)
        return
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.log('AuthProvider: No se encontró persona para', email)
        setUser(null)
        return
      }

      // data may be an array due to select; pick first row
      const persona = Array.isArray(data) ? data[0] : data
      console.log('AuthProvider: Persona encontrada, seteando user', { persona_id: persona.persona_id, nombre: persona.nombre, rol: persona.rol })
      setUser({ persona_id: persona.persona_id, nombre: persona.nombre, rol: persona.rol })
    } catch (e) {
      console.error('AuthProvider: Unexpected error fetching persona:', e)
      setUser(null)
    }
  }

  return <>{children}</>
}
