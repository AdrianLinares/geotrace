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
         unidadesLitoestratigraficas: { reportada: [{ uni_lito_reportada_id: '1', codigo_uni_lito_reportada: 'L-1', nombre_reportado: 'Lito reportada' }], normalizada: [], actualizada: [] },
         biozonas: { reportada: [], normalizada: [{ biozona_normalizada_id: '2', nombre_normalizado: 'Biozona normalizada' }], actualizada: [] },
         edades: { reportada: [], normalizada: [], actualizada: [{ edad_actualizada_id: '3', nombre_actualizado: 'Edad actualizada' }] },
      },
    })

    render(<CatalogosPage />)

    expect(screen.getByText('Catálogos normalizados')).toBeInTheDocument()
    expect(screen.getByText('Llanos')).toBeInTheDocument()
    expect(screen.getByText('Unidades litoestratigráficas')).toBeInTheDocument()
    expect(screen.getByText('Lito reportada')).toBeInTheDocument()
    expect(screen.getByText('Biozonas')).toBeInTheDocument()
    expect(screen.getByText('Edades')).toBeInTheDocument()
    expect(screen.getByText(/Empresa, dic_campo y dic_contrato permanecen no disponibles/)).toBeInTheDocument()
    expect(screen.getByText(/Esta pantalla es de solo lectura/)).toBeInTheDocument()
  })
})
