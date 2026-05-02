import { Control, FieldErrors } from 'react-hook-form'
import { PlacaForm } from '@/lib/validations/placa'
import { Input } from '../../../components/ui/input'

interface Props {
  control: Control<PlacaForm>
  errors: FieldErrors<PlacaForm>
}

export default function TabMarcado({ control, errors }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm">Tinta Negra</label>
        <Input {...control.register('marcado.tinta_negra')} />
      </div>
      <div>
        <label className="block text-sm">Tinta Azul</label>
        <Input {...control.register('marcado.tinta_azul')} />
      </div>
      <div>
        <label className="block text-sm">Tinta Roja</label>
        <Input {...control.register('marcado.tinta_roja')} />
      </div>
      <div>
        <label className="block text-sm">Tinta Verde</label>
        <Input {...control.register('marcado.tinta_verde')} />
      </div>
      <div>
        <label className="block text-sm">Lápiz</label>
        <Input {...control.register('marcado.lapiz')} />
      </div>
      <div>
        <label className="block text-sm">Impresión Negro</label>
        <Input {...control.register('marcado.impresion_negro')} />
      </div>
      <div>
        <label className="block text-sm">Impresión Azul</label>
        <Input {...control.register('marcado.impresion_azul')} />
      </div>
      <div>
        <label className="block text-sm">Observaciones</label>
        <textarea {...control.register('marcado.observaciones')} className="w-full border p-2 rounded" />
      </div>
    </div>
  )
}
