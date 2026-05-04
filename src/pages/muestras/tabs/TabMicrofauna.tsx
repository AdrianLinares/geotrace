import { MuestraForm } from '@/lib/validations/muestra'
import { Control, useFieldArray } from 'react-hook-form'
import { Button } from '../../../components/ui/button'

interface Props {
  control: Control<MuestraForm>
}

export default function TabMicrofauna({ control }: Props) {
  // Tabla dinámica para microfauna; se persiste borrando e insertando
  // registros desde el cliente. Para grandes volúmenes, migrar a RPC.
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'microfauna',
  })

  return (
    <div className="space-y-4">
      <Button type="button" variant="outline" size="sm" onClick={() => append({
        genero_especie: '',
        abundancia: undefined,
        estado_preservacion: undefined,
        observaciones: '',
      })}>
        Agregar Microfauna
      </Button>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Género/Especie</th>
            <th className="p-2 text-left">Abundancia</th>
            <th className="p-2 text-left">Estado Preservación</th>
            <th className="p-2 text-left">Observaciones</th>
            <th className="p-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => (
            <tr key={field.id} className="border-t">
              <td className="p-2">
                <input
                  {...control.register(`microfauna.${index}.genero_especie` as const)}
                  className="border p-1 rounded w-full"
                />
              </td>
              <td className="p-2">
                <select
                  {...control.register(`microfauna.${index}.abundancia` as const)}
                  className="border p-1 rounded"
                >
                  <option value="">-</option>
                  <option value="Nulo">Nulo</option>
                  <option value="Escaso">Escaso</option>
                  <option value="Moderado">Moderado</option>
                  <option value="Abundante">Abundante</option>
                  <option value="Muy abundante">Muy abundante</option>
                </select>
              </td>
              <td className="p-2">
                <select
                  {...control.register(`microfauna.${index}.estado_preservacion` as const)}
                  className="border p-1 rounded"
                >
                  <option value="">-</option>
                  <option value="Excelente">Excelente</option>
                  <option value="Bueno">Bueno</option>
                  <option value="Regular">Regular</option>
                  <option value="Malo">Malo</option>
                </select>
              </td>
              <td className="p-2">
                <input
                  {...control.register(`microfauna.${index}.observaciones` as const)}
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
