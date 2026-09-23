import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import TabConservacion from '../../../../src/pages/muestras/tabs/TabConservacion'
import { apiRequest } from '../../../../src/lib/api'
import type { MuestraForm } from '../../../../src/lib/validations/muestra'

vi.mock('../../../../src/lib/api', () => ({ apiRequest: vi.fn() }))

function ConservationForm() {
  const { control } = useForm<MuestraForm>({
    defaultValues: { placa_id: 'placa-1', conservacion: { vidrio_estado_id: 1 } },
  })

  return <TabConservacion control={control} />
}

describe('TabConservacion', () => {
  it('uses the grouped data response for vidrio, acetato and marcoPlaca', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      data: {
        vidrio: [{ id: '1', name: 'Roto' }],
        acetato: [{ id: '2', name: 'Opaco' }],
        marcoPlaca: [{ id: '3', name: 'Deformado' }],
      },
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <ConservationForm />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(6))

    const selects = screen.getAllByRole('combobox')
    expect(selects[0]).toHaveTextContent('Roto')
    expect(selects[1]).toHaveTextContent('Opaco')
    expect(selects[2]).toHaveTextContent('Deformado')
    expect(screen.getByText('¡ALERTA! Esta muestra presenta problemas críticos de conservación.')).toBeInTheDocument()
  })
})
