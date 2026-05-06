import { useAppStore } from '@/stores/appStore'

export function snapshotAppStore() {
  return useAppStore.getState()
}

export function restoreAppStore(snapshot: any) {
  useAppStore.setState(snapshot)
}

export function resetAppStore() {
  useAppStore.setState({ user: null, authLoading: true, activeColeccion: null })
}
