import { MuestraForm } from '@/lib/validations/muestra'
import { useQuery } from '@tanstack/react-query'
import { Control, useWatch } from 'react-hook-form'
import { apiRequest } from '@/lib/api'

type ConservationState = { id: string; name: string | null }
type ConservationReference = { vidrio: ConservationState[]; acetato: ConservationState[]; marcoPlaca: ConservationState[] }
type ConservationReferenceResponse = { data: ConservationReference }

interface Props {
  control: Control<MuestraForm>
}

async function fetchConservationReference() {
  return apiRequest<ConservationReferenceResponse>('/api/reference/conservation')
}

export default function TabConservacion({ control }: Props) {
  // Esta pestaña recoge el estado de conservación.
  // - Señala alertas críticas en la UI para que el conservador revise.
  // - Los datos se guardarán en `estado_conservacion_inicial` desde MuestraModal.
  const vidrio = useWatch({ control, name: 'conservacion.vidrio_estado_id' })
  const hongos = useWatch({ control, name: 'conservacion.presencia_hongos' })
  const riesgo = useWatch({ control, name: 'conservacion.riesgo_contaminacion' })

  const { data: conservation } = useQuery({
    queryKey: ['reference', 'conservation'],
    queryFn: fetchConservationReference,
  })
  const vidrioEstados = conservation?.data.vidrio
  const acetatoEstados = conservation?.data.acetato
  const marcoPlacaEstados = conservation?.data.marcoPlaca

  const vidrioNombre = vidrioEstados?.find(e => e.id === String(vidrio))?.name
  const critica = hongos || riesgo || vidrioNombre === 'Roto' || vidrioNombre === 'Ausente'

  return (
    <div className="space-y-4">
      {critica && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ¡ALERTA! Esta muestra presenta problemas críticos de conservación.
        </div>
      )}

      <div>
        <label className="block text-sm">Estado Vidrio</label>
        <select {...control.register('conservacion.vidrio_estado_id', { valueAsNumber: true })} className="w-full border p-2 rounded">
          <option value="">-</option>
          {vidrioEstados?.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm">Estado Acetato</label>
        <select {...control.register('conservacion.acetato_estado_id', { valueAsNumber: true })} className="w-full border p-2 rounded">
          <option value="">-</option>
          {acetatoEstados?.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm">Estado Marco de Placa</label>
        <select {...control.register('conservacion.marco_placa_estado_id', { valueAsNumber: true })} className="w-full border p-2 rounded">
          <option value="">-</option>
          {marcoPlacaEstados?.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...control.register('conservacion.presencia_hongos')} />
          Presencia de hongos
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...control.register('conservacion.crecimiento_cristales')} />
          Crecimiento de cristales
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...control.register('conservacion.oxidacion')} />
          Oxidación
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...control.register('conservacion.material_fuera_cavidad')} />
          Material fuera de cavidad
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...control.register('conservacion.riesgo_contaminacion')} />
          Riesgo de contaminación
        </label>
      </div>

      <div>
        <label className="block text-sm">Observaciones</label>
        <textarea {...control.register('conservacion.observaciones')} className="w-full border p-2 rounded" />
      </div>
    </div>
  )
}
