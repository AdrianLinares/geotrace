import React, { useEffect, useRef } from 'react'
import { useAppStore } from '../stores/appStore'
import supabase from './supabase'

type Props = { children: React.ReactNode }

/**
 * AuthProvider
 * - Inicializa el estado de autenticación desde Supabase al montar la app
 * - Escucha eventos de autenticación (signin/signout) y actualiza `useAppStore`
 * - Encapsula la lógica de cargar la `persona` desde la tabla `persona`
 *
 * Notas importantes para un junior:
 * - `mounted` evita actualizaciones después del desmontaje (race conditions)
 * - `sessionHandled` se usa para marcar que la carga inicial se completó
 * - Se ignoran eventos `INITIAL_SESSION` y `TOKEN_REFRESHED` porque
 *   `getSession()` ya entrega el estado inicial.
 */
export default function AuthProvider({ children }: Props) {
  const setUser = useAppStore((s) => s.setUser)
  const setAuthLoading = useAppStore((s) => s.setAuthLoading)
  const mounted = useRef(true)
  const sessionHandled = useRef(false)

  useEffect(() => {
    mounted.current = true
    console.log('AuthProvider: Montando')

    // Obtener la sesión inicial una sola vez al montar
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted.current) return
      if (error) {
        console.error('AuthProvider: Error en getSession', error)
        setUser(null)
        setAuthLoading(false)
        return
      }

      if (data.session?.user) {
        // Si hay sesión, cargamos la persona asociada por email
        console.log('AuthProvider: Sesión inicial encontrada', data.session.user.email)
        fetchPersonaAndSet(data.session.user.email, data.session.user.id).finally(() => {
          sessionHandled.current = true
          if (mounted.current) setAuthLoading(false)
        })
      } else {
        // No hay sesión: usuario nulo
        console.log('AuthProvider: Sin sesión inicial')
        setUser(null)
        sessionHandled.current = true
        setAuthLoading(false)
      }
    })

    // Listener para cambios posteriores en el estado de auth (signin/signout)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted.current) return
      // Filtramos eventos que no requieren acción manual
      if (event === 'INITIAL_SESSION') return
      if (event === 'TOKEN_REFRESHED') return

      console.log('AuthProvider: onAuthStateChange', { event, hasSession: !!session })

      if (event === 'SIGNED_IN' && session?.user) {
        // Cuando un usuario firma, recargamos su `persona` desde la tabla
        setAuthLoading(true)
        fetchPersonaAndSet(session.user.email, session.user.id).finally(() => {
          if (mounted.current) setAuthLoading(false)
        })
      } else if (event === 'SIGNED_OUT') {
        // Al cerrar sesión, limpiamos el usuario en el store
        setUser(null)
      }
    })

    return () => {
      // Evitar actualizaciones asíncronas después del desmontaje
      mounted.current = false
      listener?.subscription.unsubscribe()
    }
  }, [])

  /**
   * Busca la fila `persona` que corresponde al email y la carga en el store.
   * - Si no encuentra persona, setUser(null)
   * - Se usa `ilike` para coincidencia case-insensitive
   */
  function resolveRol(relaciones?: any[]): string {
    if (!relaciones || relaciones.length === 0) return 'Catalogador'

    const roles = relaciones
      .filter(
        (r: any) =>
          r.activo !== false &&
          (r.fecha_fin == null || new Date(r.fecha_fin) > new Date())
      )
      .map((r: any) => r.CAT_ROL)
      .filter(Boolean)

    const highest = roles.sort(
      (a: any, b: any) => (b.jerarquia || 0) - (a.jerarquia || 0)
    )[0]

    return highest?.nombre || 'Catalogador'
  }

  async function fetchPersonaAndSet(email?: string | null, userId?: string | null) {
    if (!email) { setUser(null); return }
    try {
      const { data, error } = await supabase
        .from('PERSONA')
        .select('*, REL_PERSONA_ROL(rol_id, activo, fecha_fin, CAT_ROL(nombre, jerarquia))')
        .ilike('correo', email)
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

      // Resolve effective role: prefer explicit legacy/new field, otherwise
      // pick the active CAT_ROL with the highest hierarchy.
      const rolAsignado = p.rol || resolveRol(p.REL_PERSONA_ROL)
      console.log('AuthProvider: Persona cargada', p.nombre, rolAsignado)

      // One-time link: associate Supabase auth user with persona record
      if (p && !p.auth_user_id && userId) {
        try {
          await supabase
            .from('PERSONA')
            .update({ auth_user_id: userId })
            .eq('persona_id', p.persona_id)
        } catch (e) {
          console.warn('AuthProvider: No se pudo vincular auth_user_id', e)
        }
      }

      // Sync role to JWT user_metadata so RLS policies can read it
      await syncRoleToMetadata(rolAsignado)

      // Mapeo mínimo: persona_id, nombre y rol (usado por roleGuards)
      setUser({ persona_id: p.persona_id, nombre: p.nombre, rol: rolAsignado })
    } catch (e) {
      console.error('AuthProvider: Error inesperado', e)
      setUser(null)
    }
  }

  async function syncRoleToMetadata(rol: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { role: rol }
      })
      if (error) {
        console.warn('AuthProvider: No se pudo sincronizar rol al JWT', error.message)
      } else {
        console.log('AuthProvider: Rol sincronizado al JWT user_metadata')
      }
    } catch (e) {
      console.warn('AuthProvider: Error sincronizando rol', e)
    }
  }

  return <>{children}</>
}
