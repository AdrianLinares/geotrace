import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'

const cuencaSchema = z.object({
  cuenca_id: z.string().min(1, 'Requerido'),
  nombre_cuenca: z.string().min(1, 'Requerido'),
})

interface Props {
  defaultValues?: any
  onSubmit: (v: any) => void
  onCancel: () => void
}

export default function CuencaForm({ defaultValues, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(cuencaSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm">ID Cuenca</label>
        <Input {...register('cuenca_id')} />
        {errors.cuenca_id && <p className="text-sm text-red-500">{String(errors.cuenca_id.message)}</p>}
      </div>
      <div>
        <label className="block text-sm">Nombre Cuenca</label>
        <Input {...register('nombre_cuenca')} />
        {errors.nombre_cuenca && <p className="text-sm text-red-500">{String(errors.nombre_cuenca.message)}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}
