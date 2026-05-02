import { Control, useFieldArray } from 'react-hook-form'
import { MuestraForm } from '@/lib/validations/muestra'
import { Button } from '../../../components/ui/button'

interface Props {
  control: Control<MuestraForm>
}

export default function TabEmpresas({ control }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'empresas',
  })

  return (
    <div className="space-y-4">
      <Button type="button" variant="outline" size="sm" onClick={() => append({ empresa_id: '', rol: 'Operador' })}>
        Agregar Empresa
      </Button>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Empresa</th>
            <th className="p-2 text-left">Rol</th>
            <th className="p-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => (
            <tr key={field.id} className="border-t">
              <td className="p-2">
                <input
                  {...control.register(`empresas.${index}.empresa_id` as const)}
                  className="border p-1 rounded w-full"
                />
              </td>
              <td className="p-2">
                <select
                  {...control.register(`empresas.${index}.rol` as const)}
                  className="border p-1 rounded"
                >
                  <option value="Operador">Operador</option>
                  <option value="Consultor">Consultor</option>
                  <option value="Laboratorio">Laboratorio</option>
                </select>
              </td>
              <td className="p-2">
                <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
