import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'

const campoSchema = z.object({
  campo_id: z.string().min(1, 'Requerido'),
  nombre_campo: z.string().min(1, 'Requerido'),
})

interface Props {
  defaultValues?: any
  onSubmit: (v: any) => void
  onCancel: () => void
}

export default function CampoForm({ defaultValues, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(campoSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm">ID Campo</label>
        <Input {...register('campo_id')} />
        {errors.campo_id && <p className="text-sm text-red-500">{String(errors.campo_id.message)}</p>}
      </div>
      <div>
        <label className="block text-sm">Nombre Campo</label>
        <Input {...register('nombre_campo')} />
        {errors.nombre_campo && <p className="text-sm text-red-500">{String(errors.nombre_campo.message)}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}
