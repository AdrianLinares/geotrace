import { useAppStore } from '@/stores/appStore'

type AppState = ReturnType<typeof useAppStore.getState>
type AppStateSnapshot = Pick<AppState, 'user' | 'authLoading' | 'activeColeccion'>

export const snapshotAppStore = (): AppStateSnapshot => {
  const { user, authLoading, activeColeccion } = useAppStore.getState()
  return { user, authLoading, activeColeccion }
}

export const restoreAppStore = (snapshot: AppStateSnapshot) => {
  useAppStore.setState(snapshot)
}

export const resetAppStore = () => {
  useAppStore.setState({
    user: null,
    authLoading: true,
    activeColeccion: null,
  })
}
