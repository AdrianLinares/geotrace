import { create } from 'zustand'

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
  setUser: (u) => set({ user: u }),
  setAuthLoading: (loading) => set({ authLoading: loading }),
  setActiveColeccion: (c) => set({ activeColeccion: c }),
}))
