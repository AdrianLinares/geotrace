import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

const personaSchema = z.object({
  persona_id: z.string().min(1, 'Requerido'),
  nombre: z.string().min(1, 'Requerido'),
  rol: z.enum(['Catalogador', 'Revisor', 'Curador', 'Administrador']),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  activo: z.boolean().optional(),
})

interface Props {
  defaultValues?: any
  onSubmit: (v: any) => void
  onCancel: () => void
}

export default function PersonaForm({ defaultValues, onSubmit, onCancel }: Props) {
  const initialValues = React.useMemo(() => {
    const base = defaultValues || {};
    return {
      ...base,
      email: base.email ?? ''
    };
  }, [defaultValues])

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(personaSchema),
    defaultValues: initialValues,
  })

  // Reset form when defaultValues change (edit different user)
  React.useEffect(() => {
    reset(initialValues)
  }, [initialValues, reset])

  return (
    <form onSubmit={handleSubmit((v) => { console.log('PersonaForm submit:', v); onSubmit(v) })} className="space-y-4">
      <div>
        <label className="block text-sm">ID Persona</label>
        {/* Use readOnly so the value stays in form state (disabled inputs are omitted from submission) */}
        <Input {...register('persona_id')} readOnly={!!defaultValues?.persona_id} className="bg-gray-50" />
        {errors.persona_id && <p className="text-sm text-red-500">{String(errors.persona_id.message)}</p>}
      </div>
      <div>
        <label className="block text-sm">Nombre</label>
        <Input {...register('nombre')} />
        {errors.nombre && <p className="text-sm text-red-500">{String(errors.nombre.message)}</p>}
      </div>
      <div>
        <label className="block text-sm">Rol</label>
        <select {...register('rol')} className="w-full border p-2 rounded" defaultValue={defaultValues?.rol || 'Catalogador'}>
          <option value="Catalogador">Catalogador</option>
          <option value="Revisor">Revisor</option>
          <option value="Curador">Curador</option>
          <option value="Administrador">Administrador</option>
        </select>
      </div>
      <div>
        <label className="block text-sm">Email</label>
        <Input type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-red-500">{String(errors.email.message)}</p>}
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" {...register('activo')} />
        <label className="text-sm">Activo</label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}
