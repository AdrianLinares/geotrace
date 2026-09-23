import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthApiError, login, toAppUser } from '../lib/authApi'
import { useAppStore } from '../stores/appStore'

export default function Login() {
  const navigate = useNavigate()
  const setUser = useAppStore((state) => state.setUser)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { user } = await login(username, password)
      const appUser = toAppUser(user)
      if (!appUser) throw new AuthApiError(401, 'Authentication rejected')
      setUser(appUser)
      navigate('/', { replace: true })
    } catch (error) {
      setMessage(error instanceof AuthApiError ? error.message : 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-lg font-semibold mb-4">Iniciar sesión</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm" htmlFor="username">Usuario</label>
            <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} className="w-full border p-2 rounded" autoComplete="username" required />
          </div>
          <div>
            <label className="block text-sm" htmlFor="password">Contraseña</label>
            <input id="password" value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="w-full border p-2 rounded" autoComplete="current-password" required />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
          {message && <div role="alert" className="text-sm text-red-600">{message}</div>}
        </form>
      </div>
    </div>
  )
}
