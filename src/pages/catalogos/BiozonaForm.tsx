import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { biozonaSchema } from '../../lib/validations/biozona'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'

interface Props {
  defaultValues?: any
  onSubmit: (v: any) => void
  onCancel: () => void
}

export default function BiozonaForm({ defaultValues, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(biozonaSchema),
    defaultValues: defaultValues || { sinonimos: [] },
  })

  const { fields, append, remove } = useFieldArray({
    name: 'sinonimos',
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm">ID Biozona</label>
        <Input {...register('biozona_id')} />
        {errors.biozona_id && <p className="text-sm text-red-500">{errors.biozona_id.message}</p>}
      </div>
      <div>
        <label className="block text-sm">Nombre Biozona</label>
        <Input {...register('nombre_biozona')} />
        {errors.nombre_biozona && <p className="text-sm text-red-500">{errors.nombre_biozona.message}</p>}
      </div>
      <div>
        <label className="block text-sm">Grupo Fósil</label>
        <Input {...register('grupo_fosil')} />
      </div>
      <div>
        <label className="block text-sm">Edad Base</label>
        <Input {...register('edad_base')} />
      </div>
      <div>
        <label className="block text-sm">Edad Tope</label>
        <Input {...register('edad_tope')} />
      </div>

      {/* Sinónimos */}
      <div>
        <h4 className="font-medium">Sinónimos</h4>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 mb-2">
            <input {...register(`sinonimos.${index}.sinonimo_bio_id` as const)} placeholder="ID sinónimo" className="border p-1 rounded flex-1" />
            <input {...register(`sinonimos.${index}.nombre_sinonimo` as const)} placeholder="Nombre sinónimo" className="border p-1 rounded flex-1" />
            <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>Eliminar</Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => append({ sinonimo_bio_id: '', nombre_sinonimo: '' })}>
          Agregar Sinónimo
        </Button>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}
