import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'

const empresaSchema = z.object({
  empresa_id: z.string().min(1, 'Requerido'),
  nombre_empresa: z.string().min(1, 'Requerido'),
  tipo_empresa: z.string().optional(),
  pais: z.string().optional(),
  observaciones: z.string().optional(),
})

interface Props {
  defaultValues?: any
  onSubmit: (v: any) => void
  onCancel: () => void
}

export default function EmpresaForm({ defaultValues, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(empresaSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm">ID Empresa</label>
        <Input {...register('empresa_id')} />
        {errors.empresa_id && <p className="text-sm text-red-500">{errors.empresa_id.message}</p>}
      </div>
      <div>
        <label className="block text-sm">Nombre Empresa</label>
        <Input {...register('nombre_empresa')} />
        {errors.nombre_empresa && <p className="text-sm text-red-500">{errors.nombre_empresa.message}</p>}
      </div>
      <div>
        <label className="block text-sm">Tipo Empresa</label>
        <Input {...register('tipo_empresa')} />
      </div>
      <div>
        <label className="block text-sm">País</label>
        <Input {...register('pais')} />
      </div>
      <div>
        <label className="block text-sm">Observaciones</label>
        <textarea {...register('observaciones')} className="w-full border p-2 rounded" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}
