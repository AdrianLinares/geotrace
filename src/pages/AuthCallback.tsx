import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('AuthCallback: URL actual', window.location.href)
        console.log('AuthCallback: Hash', window.location.hash)
        console.log('AuthCallback: Search', window.location.search)

        // Esperar un momento para que Supabase procese la URL
        await new Promise(resolve => setTimeout(resolve, 500))

        // Forzar a Supabase a procesar la URL actual (importante para magic links)
        const { data: urlData, error: urlError } = await supabase.auth.getSession()
        console.log('AuthCallback: getSession result', { session: !!urlData.session, error: urlError })

        if (urlError) {
          console.error('Error getting session:', urlError)
          setError('Error al procesar la autenticación: ' + urlError.message)
          setTimeout(() => navigate('/login', { replace: true }), 5000)
          return
        }

        if (urlData.session) {
          console.log('AuthCallback: Sesión establecida, redirigiendo a /')
          navigate('/', { replace: true })
        } else {
          // Verificar si hay parámetros en la URL que Supabase debió procesar
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const queryParams = new URLSearchParams(window.location.search)
          const hasAuthParams = hashParams.has('access_token') || hashParams.has('token_hash') || queryParams.has('code') || queryParams.has('token_hash')

          console.log('AuthCallback: No hay sesión. Parámetros en URL:', { 
            hash: window.location.hash, 
            search: window.location.search,
            hasAuthParams 
          })

          if (hasAuthParams) {
            // Hay parámetros pero no se procesaron, reintentar
            console.log('AuthCallback: Parámetros encontrados pero no sesión, reintentando...')
            setTimeout(() => handleCallback(), 1500)
            return
          }

          setError('No se pudo establecer la sesión. El enlace puede haber expirado o ya fue usado.')
          setTimeout(() => navigate('/login', { replace: true }), 5000)
        }
      } catch (err: any) {
        console.error('Callback error:', err)
        setError('Error inesperado: ' + err.message)
        setTimeout(() => navigate('/login', { replace: true }), 5000)
      }
    }

    handleCallback()
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
