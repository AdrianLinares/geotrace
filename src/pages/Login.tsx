import React, { useState } from 'react'
import supabase from '../lib/supabase'

/**
 * Página de Login
 * - Implementa inicio por "magic link" usando Supabase Auth (OTP por email)
 * - Incluye lógica de cooldown para evitar rate-limits del proveedor
 *
 * Notas:
 * - `cooldownUntil` guarda un timestamp en ms hasta el que no se permiten nuevos envíos
 * - Se detecta `rate limit` en el mensaje de error y se aplica un cooldown mayor (15 min)
 */
export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<number>(0)

  // Calcula segundos restantes del cooldown (>= 0)
  const cooldownRemaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
  const isOnCooldown = cooldownRemaining > 0

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()

    if (isOnCooldown) {
      setMessage(`Espera ${cooldownRemaining}s antes de solicitar otro enlace.`)
      return
    }

    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    setLoading(false)

    if (error) {
      // Detectamos patrones comunes de rate limit en el mensaje del error
      const rateLimited = /rate limit|too many|exceeded|429/i.test(error.message)
      if (rateLimited) {
        // Aplicamos cooldown largo cuando Supabase bloquea solicitudes
        setCooldownUntil(Date.now() + 15 * 60_000) // 15 minutos
        setMessage('Supabase bloqueó el envío por límite de velocidad. ESPERA 15 MINUTOS antes de reintentar.')
        return
      }

      setMessage('Error: ' + error.message)
      return
    }

    // Envío exitoso: cooldown corto para evitar doble envío inmediato
    setCooldownUntil(Date.now() + 60_000)
    setMessage('Se envió un enlace mágico a tu correo. Revisa tu bandeja y espera antes de pedir otro.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-lg font-semibold mb-4">Iniciar sesión</h2>
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label className="block text-sm">Correo electrónico</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full border p-2 rounded" />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded" disabled={loading || isOnCooldown}>
              {loading ? 'Enviando...' : isOnCooldown ? `Espera ${cooldownRemaining}s` : 'Enviar enlace mágico'}
            </button>
          </div>
          {message && <div className="text-sm text-muted-foreground">{message}</div>}
        </form>
      </div>
    </div>
  )
}
