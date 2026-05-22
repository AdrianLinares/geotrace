import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'

const contratoSchema = z.object({
  contrato_id: z.string().min(1, 'Requerido'),
  nombre_contrato: z.string().min(1, 'Requerido'),
})

interface Props {
  defaultValues?: any
  onSubmit: (v: any) => void
  onCancel: () => void
}

export default function ContratoForm({ defaultValues, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(contratoSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm">ID Contrato</label>
        <Input {...register('contrato_id')} />
        {errors.contrato_id && <p className="text-sm text-red-500">{String(errors.contrato_id.message)}</p>}
      </div>
      <div>
        <label className="block text-sm">Nombre Contrato</label>
        <Input {...register('nombre_contrato')} />
        {errors.nombre_contrato && <p className="text-sm text-red-500">{String(errors.nombre_contrato.message)}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}
