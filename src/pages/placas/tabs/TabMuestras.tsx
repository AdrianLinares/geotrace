import { Control, useWatch } from 'react-hook-form'
import { PlacaForm } from '../../../lib/validations/placa'
import { useMuestras } from '../../../hooks/useMuestras'
import { Button } from '../../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Badge } from '../../../components/ui/badge'

interface Props {
  control: Control<PlacaForm>
}

export default function TabMuestras({ control }: Props) {
  const placaId = useWatch({ control, name: 'placa_id' })
  const { data: muestras, isLoading } = useMuestras(0, placaId)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => alert('Abrir MuestraModal (pendiente)')}>
          Nueva Muestra
        </Button>
      </div>

      {isLoading ? <p>Cargando muestras...</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Pozo</TableHead>
              <TableHead>Profundidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {muestras?.data?.map(m => (
              <TableRow key={m.muestra_id}>
                <TableCell>{m.muestra_id}</TableCell>
                <TableCell>{m.nombre_pozo}</TableCell>
                <TableCell>
                  {m.tipo_profundidad === 'Puntual' ? m.profundidad_puntual : `${m.profundidad_tope} - ${m.profundidad_base}`}
                </TableCell>
                <TableCell>
                  <Badge variant={m.estado_catalogacion === 'Validado' ? 'default' : 'secondary'}>
                    {m.estado_catalogacion}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => alert('Editar muestra (pendiente)')}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
