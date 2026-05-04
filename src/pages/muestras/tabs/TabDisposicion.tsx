import { MuestraForm } from '@/lib/validations/muestra'
import { Control, useFieldArray } from 'react-hook-form'
import { Button } from '../../../components/ui/button'

interface Props {
  control: Control<MuestraForm>
}

export default function TabDisposicion({ control }: Props) {
  // Maneja una lista dinámica de disposiciones (useFieldArray).
  // - useFieldArray facilita agregar/eliminar filas en formularios complejos.
  // - Al persistir, MuestraModal borra las previas y vuelve a insertar.
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'disposicion',
  })

  return (
    <div className="space-y-4">
      <Button type="button" variant="outline" size="sm" onClick={() => append({
        tipo_cavidad: '',
        cod_cavidad: '',
        cavidad_nro: 0,
        material_presente: false,
        material_estado: '',
        cantidad_cualitativa: undefined,
      })}>
        Agregar Disposición
      </Button>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Tipo Cavidad</th>
            <th className="p-2 text-left">Cod. Cavidad</th>
            <th className="p-2 text-left">Nro. Cavidad</th>
            <th className="p-2 text-left">Material Presente</th>
            <th className="p-2 text-left">Estado</th>
            <th className="p-2 text-left">Cantidad</th>
            <th className="p-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => (
            <tr key={field.id} className="border-t">
              <td className="p-2">
                <input
                  {...control.register(`disposicion.${index}.tipo_cavidad` as const)}
                  className="border p-1 rounded w-full"
                />
              </td>
              <td className="p-2">
                <input
                  {...control.register(`disposicion.${index}.cod_cavidad` as const)}
                  className="border p-1 rounded w-full"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  {...control.register(`disposicion.${index}.cavidad_nro` as const, { valueAsNumber: true })}
                  className="border p-1 rounded w-full"
                />
              </td>
              <td className="p-2 text-center">
                <input
                  type="checkbox"
                  {...control.register(`disposicion.${index}.material_presente` as const)}
                />
              </td>
              <td className="p-2">
                <input
                  {...control.register(`disposicion.${index}.material_estado` as const)}
                  className="border p-1 rounded w-full"
                />
              </td>
              <td className="p-2">
                <select
                  {...control.register(`disposicion.${index}.cantidad_cualitativa` as const)}
                  className="border p-1 rounded"
                >
                  <option value="">-</option>
                  <option value="Escaso">Escaso</option>
                  <option value="Moderado">Moderado</option>
                  <option value="Abundante">Abundante</option>
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
