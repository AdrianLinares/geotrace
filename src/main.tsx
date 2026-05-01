import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import AuthProvider from './lib/AuthProvider'
import AuthDebug from './components/shared/AuthDebug'
import './styles.css'

const queryClient = new QueryClient()

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
