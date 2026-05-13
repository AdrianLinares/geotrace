import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const timeouts: ReturnType<typeof setTimeout>[] = []

    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(() => { if (!cancelled) fn() }, ms)
      timeouts.push(id)
    }

    const handleCallback = async () => {
      try {
        // Esperar un momento para que Supabase procese la URL
        await new Promise(resolve => setTimeout(resolve, 500))

        if (cancelled) return

        // Forzar a Supabase a procesar la URL actual (importante para magic links)
        const { data: urlData, error: urlError } = await supabase.auth.getSession()

        if (cancelled) return

        if (urlError) {
          setError('Error al procesar la autenticación: ' + urlError.message)
          schedule(() => navigate('/login', { replace: true }), 5000)
          return
        }

        if (urlData.session) {
          navigate('/', { replace: true })
        } else {
          // Verificar si hay parámetros en la URL que Supabase debió procesar
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const queryParams = new URLSearchParams(window.location.search)
          const hasAuthParams = hashParams.has('access_token') || hashParams.has('token_hash') || queryParams.has('code') || queryParams.has('token_hash')

          if (hasAuthParams) {
            // Hay parámetros pero no se procesaron, reintentar
            schedule(() => { handleCallback() }, 1500)
            return
          }

          setError('No se pudo establecer la sesión. El enlace puede haber expirado o ya fue usado.')
          schedule(() => navigate('/login', { replace: true }), 5000)
        }
      } catch (err: any) {
        setError('Error inesperado: ' + err.message)
        schedule(() => navigate('/login', { replace: true }), 5000)
      }
    }

    handleCallback()

    return () => {
      cancelled = true
      timeouts.forEach(clearTimeout)
    }
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="bg-white p-6 rounded shadow w-96 text-center">
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="bg-white p-6 rounded shadow w-96 text-center">
        <p>Procesando autenticación...</p>
      </div>
    </div>
  )
}
