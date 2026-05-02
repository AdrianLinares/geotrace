import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { coleccionSchema } from '../../lib/validations/coleccion'
import type { ColeccionForm } from '../../lib/validations/coleccion'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'

type Props = {
  defaultValues?: Partial<ColeccionForm>
  onSubmit: (v: ColeccionForm) => void
  onCancel?: () => void
}

export default function ColeccionForm({ defaultValues, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<ColeccionForm>({
    resolver: zodResolver(coleccionSchema) as any,
    defaultValues: defaultValues as any
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm">Nombre de colección</label>
        <Input {...register('nombre_coleccion')} />
        {errors.nombre_coleccion && <p className="text-sm text-red-500">{errors.nombre_coleccion.message}</p>}
      </div>

      <div>
        <label className="block text-sm">Institución</label>
        <Input {...register('institucion')} />
      </div>

      <div>
        <label className="block text-sm">Responsable</label>
        <Input {...register('responsable')} />
      </div>

      <div>
        <label className="block text-sm">Descripción</label>
        <textarea {...register('descripcion')} className="w-full border p-2 rounded" />
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}
