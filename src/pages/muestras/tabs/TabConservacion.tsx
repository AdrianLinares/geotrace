import { Control, useWatch } from 'react-hook-form'
import { MuestraForm } from '../../lib/validations/muestra'
import { Input } from '../../../components/ui/input'

interface Props {
  control: Control<MuestraForm>
}

export default function TabConservacion({ control }: Props) {
  const vidrio = useWatch({ control, name: 'conservacion.vidrio_estado' })
  const hongos = useWatch({ control, name: 'conservacion.presencia_hongos' })
  const riesgo = useWatch({ control, name: 'conservacion.riesgo_contaminacion' })
  const critica = hongos || riesgo || vidrio === 'Roto' || vidrio === 'Faltante'

  return (
    <div className="space-y-4">
      {critica && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ¡ALERTA! Esta muestra presenta problemas críticos de conservación.
        </div>
      )}

      <div>
        <label className="block text-sm">Estado Vidrio</label>
        <select {...control.register('conservacion.vidrio_estado')} className="w-full border p-2 rounded">
          <option value="">-</option>
          <option value="Bueno">Bueno</option>
          <option value="Roto">Roto</option>
          <option value="Faltante">Faltante</option>
        </select>
      </div>

      <div>
        <label className="block text-sm">Estado Acetato</label>
        <select {...control.register('conservacion.acetato_estado')} className="w-full border p-2 rounded">
          <option value="">-</option>
          <option value="Bueno">Bueno</option>
          <option value="Deteriorado">Deteriorado</option>
        </select>
      </div>

      <div>
        <label className="block text-sm">Estado Abrazadera</label>
        <select {...control.register('conservacion.abrazadera_estado')} className="w-full border p-2 rounded">
          <option value="">-</option>
          <option value="Bueno">Bueno</option>
          <option value="Deteriorado">Deteriorado</option>
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
