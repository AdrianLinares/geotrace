import { useAppStore } from '@/stores/appStore'

type AppState = ReturnType<typeof useAppStore.getState>

export const resetAppStore = () => {
  useAppStore.setState({
    user: null,
    authLoading: true,
    activeColeccion: null,
  })
}

export const snapshotAppStore = () => {
  return useAppStore.getState()
}

export const restoreAppStore = (snapshot: AppState) => {
  useAppStore.setState(snapshot)
}
