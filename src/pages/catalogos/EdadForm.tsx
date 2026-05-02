import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { edadSchema } from '../../lib/validations/edad'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'

interface Props {
  defaultValues?: any
  onSubmit: (v: any) => void
  onCancel: () => void
}

export default function EdadForm({ defaultValues, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(edadSchema),
    defaultValues: defaultValues || {},
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm">ID Edad</label>
        <Input {...register('edad_id')} />
        {errors.edad_id && <p className="text-sm text-red-500">{String(errors.edad_id.message)}</p>}
      </div>
      <div>
        <label className="block text-sm">Nombre Edad</label>
        <Input {...register('nombre_edad')} />
        {errors.nombre_edad && <p className="text-sm text-red-500">{String(errors.nombre_edad.message)}</p>}
      </div>
      <div>
        <label className="block text-sm">Jerarquía</label>
        <Input {...register('jerarquia')} />
      </div>
      <div>
        <label className="block text-sm">Base (Ma)</label>
        <Input type="number" step="0.001" {...register('base_ma', { valueAsNumber: true })} />
      </div>
      <div>
        <label className="block text-sm">Tope (Ma)</label>
        <Input type="number" step="0.001" {...register('tope_ma', { valueAsNumber: true })} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}
