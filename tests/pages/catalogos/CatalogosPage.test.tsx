import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CatalogosPage from '../../../src/pages/catalogos/CatalogosPage'

const { useCatalogos } = vi.hoisted(() => ({ useCatalogos: vi.fn() }))

vi.mock('../../../src/hooks/useCatalogos', () => ({ useCatalogos }))
vi.mock('../../../src/components/layout/AppLayout', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }))

describe('CatalogosPage', () => {
  beforeEach(() => useCatalogos.mockReset())

  it('renders the normalized grouped catalogs without legacy options or writes', () => {
    useCatalogos.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        cuencas: [{ cuenca_id: '1', nombre_cuenca: 'Llanos' }],
        clasesPlaca: [], disenosPlaca: [], estadosCatalogacion: [], estadosRevision: [],
        materialesPlaca: [], coloresPlaca: [], configuracionesCavidades: [], configuracionesRejilla: [],
        etapasUsoPlaca: [], tiposProteccion: [], sistemasEnsamble: [],
      },
    })

    render(<CatalogosPage />)

    expect(screen.getByText('Catálogos normalizados')).toBeInTheDocument()
    expect(screen.getByText('Llanos')).toBeInTheDocument()
    expect(screen.queryByText('Unidades Litoestratigráficas')).not.toBeInTheDocument()
    expect(screen.getByText(/dic_unidad_lito, dic_biozona, dic_edad, empresa/)).toBeInTheDocument()
    expect(screen.getByText(/solo lectura/)).toBeInTheDocument()
  })
})
