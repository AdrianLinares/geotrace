import { Control, FieldErrors, useWatch } from 'react-hook-form'
import { Input } from '../../../components/ui/input'
import { useColecciones } from '../../../hooks/useColecciones'
import { useUbicaciones } from '../../../hooks/useUbicaciones'
import { PlacaForm } from '../../../lib/validations/placa'

interface Props {
  control: Control<PlacaForm>
  errors: FieldErrors<PlacaForm>
}

export default function TabInformacionGeneral({ control, errors }: Props) {
  // Información general de la placa.
  // - Carga colecciones y ubicaciones (hooks paginados). Si la lista crece,
  //   convertir en autocompletes con búsqueda remota.
  const { data: colecciones } = useColecciones(0)
  const { data: ubicaciones } = useUbicaciones(0)

  // We'll use useWatch to get values if needed
  const coleccionId = useWatch({ control, name: 'coleccion_id' })
  const ubicacionId = useWatch({ control, name: 'ubicacion_id' })

  return (
    <div className="space-y-4">
      {/* Colección */}
      <div>
        <label className="block text-sm">Colección</label>
        <select
          {...control.register('coleccion_id')}
          className="w-full border p-2 rounded"
        >
          <option value="">Seleccione...</option>
          {colecciones?.data?.map(c => (
            <option key={c.coleccion_id} value={c.coleccion_id}>{c.nombre_coleccion}</option>
          ))}
        </select>
        {errors.coleccion_id && <p className="text-sm text-red-500">{errors.coleccion_id.message}</p>}
      </div>

      {/* Ubicación */}
      <div>
        <label className="block text-sm">Ubicación</label>
        <select
          {...control.register('ubicacion_id')}
          className="w-full border p-2 rounded"
        >
          <option value="">Seleccione...</option>
          {ubicaciones?.data?.map(u => (
            <option key={u.ubicacion_id} value={u.ubicacion_id}>{u.ubicacion_id}</option>
          ))}
        </select>
        {errors.ubicacion_id && <p className="text-sm text-red-500">{errors.ubicacion_id.message}</p>}
      </div>

      {/* Clase placa */}
      <div>
        <label className="block text-sm">Clase de placa</label>
        <select {...control.register('clase_placa')} className="w-full border p-2 rounded">
          <option value="">-</option>
          <option value="Asociación">Asociación</option>
          <option value="Tipo">Tipo</option>
        </select>
      </div>

      {/* Rol placa */}
      <div>
        <label className="block text-sm">Rol</label>
        <select {...control.register('rol_placa')} className="w-full border p-2 rounded">
          <option value="">-</option>
          <option value="picking">picking</option>
          <option value="organización">organización</option>
          <option value="intención_organización">intención_organización</option>
          <option value="vacía_picking">vacía_picking</option>
        </select>
      </div>

      {/* Diseño placa */}
      <div>
        <label className="block text-sm">Diseño</label>
        <Input {...control.register('diseno_placa')} placeholder="Orificios_circulares, etc." />
      </div>

      {/* Total cavidades */}
      <div>
        <label className="block text-sm">Total cavidades</label>
        <Input type="number" {...control.register('total_cavidades', { valueAsNumber: true })} />
      </div>

      {/* Estado placa */}
      <div>
        <label className="block text-sm">Estado placa</label>
        <select {...control.register('estado_placa')} className="w-full border p-2 rounded">
          <option value="">-</option>
          <option value="Con material">Con material</option>
          <option value="Vacía">Vacía</option>
        </select>
      </div>

      {/* Cubierta */}
      <div>
        <label className="block text-sm">Cubierta</label>
        <select {...control.register('cubierta')} className="w-full border p-2 rounded">
          <option value="">-</option>
          <option value="Vidrio">Vidrio</option>
          <option value="Acetato">Acetato</option>
        </select>
      </div>

      {/* Tipo abrazadera */}
      <div>
        <label className="block text-sm">Tipo abrazadera</label>
        <select {...control.register('tipo_abrazadera')} className="w-full border p-2 rounded">
          <option value="">-</option>
          <option value="Aluminio">Aluminio</option>
          <option value="Cartón">Cartón</option>
        </select>
      </div>

      {/* Estado catalogación (read-only) */}
      <div>
        <label className="block text-sm">Estado catalogación</label>
        <Input {...control.register('estado_catalogacion')} readOnly className="bg-gray-100" />
      </div>
    </div>
  )
}
