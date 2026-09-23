import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const handleCallback = async () => {
      try {
        const queryParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const oauthError = queryParams.get('error') || hashParams.get('error')
        const oauthErrorDescription =
          queryParams.get('error_description') || hashParams.get('error_description')

        if (oauthError) {
          setError(
            `Error de autenticación (${oauthError}): ${oauthErrorDescription || 'solicitud rechazada'}`
          )
          return
        }

        // PKCE callbacks must exchange the code before reading the session.
        const code = queryParams.get('code')
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            setError('Error al procesar la autenticación: ' + exchangeError.message)
            return
          }
        } else {
          // Custom email templates can deliver a token hash instead of a PKCE code.
          const tokenHash = queryParams.get('token_hash') || hashParams.get('token_hash')
          if (tokenHash) {
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'email'
            })
            if (verifyError) {
              setError('Error al verificar el enlace: ' + verifyError.message)
              return
            }
          }
        }

        if (cancelled) return

        // For implicit-flow magic links, the client processes the hash before this
        // component runs. Reading the session preserves compatibility with that flow.
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (cancelled) return

        if (sessionError) {
          setError('Error al recuperar la sesión: ' + sessionError.message)
          return
        }

        if (sessionData.session) {
          navigate('/', { replace: true })
        } else {
          setError('No se pudo establecer la sesión. El enlace puede haber expirado o ya fue usado.')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        setError('Error inesperado: ' + message)
      }
    }

    handleCallback()

    return () => {
      cancelled = true
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
