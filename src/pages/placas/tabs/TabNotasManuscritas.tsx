import { Control, useFieldArray } from 'react-hook-form'
import { Button } from '../../../components/ui/button'
import { PlacaForm } from '../../../lib/validations/placa'

interface Props {
  control: Control<PlacaForm>
}

export default function TabNotasManuscritas({ control }: Props) {
  // Notas manuscritas vinculadas a la placa.
  // - El id de nota se genera en `PlacaModal` al persistir.
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'notas',
  })

  return (
    <div className="space-y-4">
      <Button type="button" variant="outline" size="sm" onClick={() => append({ zona: 'Izquierda', clave_nota: '', texto_nota: '' })}>
        Agregar Nota
      </Button>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Zona</th>
            <th className="p-2 text-left">Clave</th>
            <th className="p-2 text-left">Texto</th>
            <th className="p-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => (
            <tr key={field.id} className="border-t">
              <td className="p-2">
                <select
                  {...control.register(`notas.${index}.zona` as const)}
                  className="border p-1 rounded"
                >
                  <option value="Izquierda">Izquierda</option>
                  <option value="Derecha">Derecha</option>
                  <option value="Arriba">Arriba</option>
                  <option value="Abajo">Abajo</option>
                </select>
              </td>
              <td className="p-2">
                <input
                  {...control.register(`notas.${index}.clave_nota` as const)}
                  className="border p-1 rounded w-full"
                />
              </td>
              <td className="p-2">
                <input
                  {...control.register(`notas.${index}.texto_nota` as const)}
                  className="border p-1 rounded w-full"
                />
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
