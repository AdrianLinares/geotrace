import { Control, FieldErrors } from 'react-hook-form'
import { MuestraForm } from '@/lib/validations/muestra'
import { Input } from '../../../components/ui/input'

interface Props {
  control: Control<MuestraForm>
  errors: FieldErrors<MuestraForm>
}

export default function TabGeologia({ control, errors }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm">Unidad Litoestratigráfica</label>
        <Input {...control.register('geologia.unidad_lito')} placeholder="Buscar unidad..." />
      </div>
      <div>
        <label className="block text-sm">Unidad Bioestratigráfica</label>
        <Input {...control.register('geologia.unidad_bio')} placeholder="Buscar biozona..." />
      </div>
      <div>
        <label className="block text-sm">Edad</label>
        <Input {...control.register('geologia.edad')} placeholder="Seleccione edad..." />
      </div>
      <div>
        <label className="block text-sm">Intervalo de Muestreo</label>
        <Input type="number" step="0.01" {...control.register('geologia.intervalo_muestreo', { valueAsNumber: true })} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" {...control.register('geologia.info_inferida')} />
        <label className="text-sm">Información Inferida</label>
      </div>
    </div>
  )
}
