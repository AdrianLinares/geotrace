import { create } from 'zustand'

/**
 * Estado global mínimo de la aplicación (Zustand)
 * - `user`: información mínima de la persona autenticada (id, nombre, rol)
 * - `authLoading`: bandera para controlar carga inicial de auth
 * - `activeColeccion`: id de la colección actualmente activa en la UI (si aplica)
 *
 * Notas:
 * - Mantener el store simple: lógica compleja debe ir en hooks o en el backend.
 * - `rol` se utiliza en `roleGuards.tsx` para controlar accesos.
 */
type User = {
  persona_id?: string
  nombre?: string
  rol?: 'Catalogador' | 'Revisor' | 'Curador' | 'Administrador' | string
}

type AppState = {
  user: User | null
  authLoading: boolean
  activeColeccion?: string | null
  setUser: (u: User | null) => void
  setAuthLoading: (loading: boolean) => void
  setActiveColeccion: (c?: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  authLoading: true,
  activeColeccion: null,
  // Setters sencillos; evita lógica asíncrona aquí para mantener el store predecible
  setUser: (u) => set({ user: u }),
  setAuthLoading: (loading) => set({ authLoading: loading }),
  setActiveColeccion: (c) => set({ activeColeccion: c }),
}))
