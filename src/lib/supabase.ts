import { createClient } from '@supabase/supabase-js'

// Variables inyectadas por Vite (ver .env.example)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Aviso útil para desarrolladores que corran la app sin configurar .env
  console.warn('Supabase environment variables are not set. Check .env')
}

// Cliente compartido de Supabase usado por hooks y librerías
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export default supabase
