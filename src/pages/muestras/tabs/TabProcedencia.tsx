import { Control, FieldErrors, useWatch } from 'react-hook-form'
import { MuestraForm } from '../../lib/validations/muestra.js'
import { Input } from '../../../components/ui/input'

interface Props {
  control: Control<MuestraForm>
  errors: FieldErrors<MuestraForm>
}

export default function TabProcedencia({ control, errors }: Props) {
  const procedencia = useWatch({ control, name: 'procedencia_muestra' })
  const tipoProf = useWatch({ control, name: 'tipo_profundidad' })

  return (
    <div className="space-y-4">
      {/* Procedencia */}
      <div>
        <label className="block text-sm">Procedencia</label>
        <select {...control.register('procedencia_muestra')} className="w-full border p-2 rounded">
          <option value="">-</option>
          <option value="Superficie">Superficie</option>
          <option value="Pozo">Pozo</option>
        </select>
      </div>

      {/* Nombre pozo (conditional) */}
      {procedencia === 'Pozo' && (
        <div>
          <label className="block text-sm">Nombre del Pozo</label>
          <Input {...control.register('nombre_pozo')} />
        </div>
      )}

      {/* Tipo muestra */}
      <div>
        <label className="block text-sm">Tipo de Muestra</label>
        <select {...control.register('tipo_muestra')} className="w-full border p-2 rounded">
          <option value="">-</option>
          <option value="Afloramiento">Afloramiento</option>
          <option value="Núcleo Convencional">Núcleo Convencional</option>
          <option value="Sidewall core">Sidewall core</option>
          <option value="Zanja_Ripios">Zanja_Ripios</option>
        </select>
      </div>

      {/* Tipo profundidad */}
      <div>
        <label className="block text-sm">Tipo de Profundidad</label>
        <select {...control.register('tipo_profundidad')} className="w-full border p-2 rounded">
          <option value="">-</option>
          <option value="Intervalo">Intervalo</option>
          <option value="Puntual">Puntual</option>
        </select>
      </div>

      {/* Profundidad puntual */}
      {tipoProf === 'Puntual' && (
        <div>
          <label className="block text-sm">Profundidad Puntual</label>
          <Input type="number" step="0.01" {...control.register('profundidad_puntual', { valueAsNumber: true })} />
        </div>
      )}

      {/* Intervalo: tope y base */}
      {tipoProf === 'Intervalo' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm">Profundidad Tope</label>
            <Input type="number" step="0.01" {...control.register('profundidad_tope', { valueAsNumber: true })} />
          </div>
          <div>
            <label className="block text-sm">Profundidad Base</label>
            <Input type="number" step="0.01" {...control.register('profundidad_base', { valueAsNumber: true })} />
            {errors.profundidad_base && <p className="text-sm text-red-500">{errors.profundidad_base.message}</p>}
          </div>
        </div>
      )}

      {/* Unidad medida */}
      <div>
        <label className="block text-sm">Unidad de Medida</label>
        <select {...control.register('unidad_medida')} className="w-full border p-2 rounded">
          <option value="">-</option>
          <option value="pies (ft)">pies (ft)</option>
          <option value="metros (m)">metros (m)</option>
        </select>
      </div>

      {/* Códigos */}
      <div>
        <label className="block text-sm">Código Muestra</label>
        <Input {...control.register('cod_muestra')} />
      </div>
      <div>
        <label className="block text-sm">IGM</label>
        <Input {...control.register('igm')} />
      </div>
      <div>
        <label className="block text-sm">No. Preparación</label>
        <Input {...control.register('no_preparacion')} />
      </div>

      {/* Info inferida */}
      <div className="flex items-center gap-2">
        <input type="checkbox" {...control.register('info_inferida')} />
        <label className="text-sm">Información Inferida</label>
      </div>
    </div>
  )
}
