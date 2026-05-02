import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { unidadLitoSchema, type UnidadLitoForm as UnidadLitoFormValues } from '../../lib/validations/unidadLito'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'

interface Props {
  defaultValues?: UnidadLitoFormValues
  onSubmit: (v: UnidadLitoFormValues) => void
  onCancel: () => void
}

export default function UnidadLitoForm({ defaultValues, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors }, control } = useForm<UnidadLitoFormValues>({
    resolver: zodResolver(unidadLitoSchema) as any,
    defaultValues: defaultValues || { sinonimos: [] },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sinonimos',
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm">ID Unidad</label>
        <Input {...register('unidad_lito_id')} />
        {errors.unidad_lito_id && <p className="text-sm text-red-500">{errors.unidad_lito_id.message}</p>}
      </div>
      <div>
        <label className="block text-sm">Nombre Oficial</label>
        <Input {...register('nombre_oficial')} />
        {errors.nombre_oficial && <p className="text-sm text-red-500">{errors.nombre_oficial.message}</p>}
      </div>
      <div>
        <label className="block text-sm">Tipo Unidad</label>
        <Input {...register('tipo_unidad')} />
      </div>
      <div>
        <label className="block text-sm">Rango</label>
        <Input {...register('rango')} />
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
            <input {...register(`sinonimos.${index}.sinonimo_lito_id` as const)} placeholder="ID sinónimo" className="border p-1 rounded flex-1" />
            <input {...register(`sinonimos.${index}.nombre_sinonimo` as const)} placeholder="Nombre sinónimo" className="border p-1 rounded flex-1" />
            <input {...register(`sinonimos.${index}.idioma` as const)} placeholder="Idioma" className="border p-1 rounded w-20" />
            <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>Eliminar</Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => append({ sinonimo_lito_id: '', nombre_sinonimo: '', idioma: '' })}>
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
