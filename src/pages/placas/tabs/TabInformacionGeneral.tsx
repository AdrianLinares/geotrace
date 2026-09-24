import { Control, FieldErrors, useWatch } from 'react-hook-form'
import { Input } from '../../../components/ui/input'
import { PlacaForm } from '../../../lib/validations/placa'

interface Props {
  control: Control<PlacaForm>
  errors: FieldErrors<PlacaForm>
}

export default function TabInformacionGeneral({ control, errors }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm">Colección ID</label>
        <Input {...control.register('coleccion_id')} />
        {errors.coleccion_id && <p className="text-sm text-red-500">{errors.coleccion_id.message}</p>}
      </div>
      <div>
        <label className="block text-sm">Código de ubicación</label>
        <Input {...control.register('codigo_ubicacion')} />
      </div>
      <div>
        <label className="block text-sm">Código de placa</label>
        <Input {...control.register('codigo_placa')} />
      </div>
    </div>
  )
}
