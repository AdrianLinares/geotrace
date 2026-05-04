import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AuthDebug from './components/shared/AuthDebug'
import AuthProvider from './lib/AuthProvider'
import './styles.css'

// QueryClient: centraliza la configuración de React Query (caché, retries, etc.)
const queryClient = new QueryClient()

// Punto de entrada de la aplicación:
// - `QueryClientProvider` provee caching y hooks (useQuery/useMutation)
// - `AuthProvider` se encarga de inicializar la sesión con Supabase y mantener el usuario
// - `AuthDebug` sólo se renderiza en desarrollo para inspeccionar estado de Auth
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        {import.meta.env.DEV && <AuthDebug />}
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
