import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ColeccionesPage from '../../../src/pages/colecciones/ColeccionesPage'

const { useColecciones } = vi.hoisted(() => ({ useColecciones: vi.fn() }))

vi.mock('../../../src/hooks/useColecciones', () => ({
  useColecciones,
  useCreateColeccion: () => ({ mutateAsync: vi.fn() }),
  useUpdateColeccion: () => ({ mutateAsync: vi.fn() }),
  useDeleteColeccion: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('../../../src/components/layout/AppLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('ColeccionesPage', () => {
  beforeEach(() => {
    useColecciones.mockReset()
  })

  it('keeps the total and pagination controls when the current page has no rows', () => {
    useColecciones.mockReturnValue({ data: { data: [], total: 21 }, isLoading: false, isError: false })

    render(<ColeccionesPage />)

    expect(screen.getByText('21 colecciones en total')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeInTheDocument()
    expect(screen.queryByText('No hay colecciones para mostrar.')).not.toBeInTheDocument()
  })

  it('shows the empty state without pagination when there are no collections', () => {
    useColecciones.mockReturnValue({ data: { data: [], total: 0 }, isLoading: false, isError: false })

    render(<ColeccionesPage />)

    expect(screen.getByText('No hay colecciones para mostrar.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Anterior' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument()
  })
})
