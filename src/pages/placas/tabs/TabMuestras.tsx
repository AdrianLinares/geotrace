import { Control, useWatch } from 'react-hook-form'
import { useState } from 'react'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { useMuestras } from '../../../hooks/useMuestras'
import MuestraModal from '../../muestras/MuestraModal'
import { PlacaForm } from '../../../lib/validations/placa'
import { useDeleteMuestra } from '../../../hooks/useMuestras'
import { toast } from '../../../components/shared/toast'

interface Props {
  control: Control<PlacaForm>
}

export default function TabMuestras({ control }: Props) {
  // Muestra una lista de muestras vinculadas a la placa.
  // - Botones de 'Nueva' / 'Editar' deben abrir `MuestraModal`.
  // - Current implementation usa `alert()` como placeholder.
  const placaId = useWatch({ control, name: 'placa_id' })
  const { data: muestras, isLoading } = useMuestras(0, placaId)

  const [muestraModalOpen, setMuestraModalOpen] = useState(false)
  const [muestraToEdit, setMuestraToEdit] = useState<any>(null)
  const deleteMuestra = useDeleteMuestra()

  // Only show muestras for this placa when placaId is present. If placa isn't saved yet,
  // avoid showing all muestras and prevent creating a muestra without placa.
  const displayMuestras = placaId ? (muestras?.data ?? []) : []

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={!placaId}
            onClick={() => {
              setMuestraToEdit(null)
              setMuestraModalOpen(true)
            }}
            title={!placaId ? 'Guarda la placa primero para poder agregar muestras' : undefined}
          >
            Nueva Muestra
          </Button>
          {!placaId && <p className="text-sm text-muted-foreground">Guarda la placa primero para agregar muestras</p>}
        </div>
      </div>

      {isLoading ? <p>Cargando muestras...</p> : (
        <>
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
              {displayMuestras.map(m => (
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
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setMuestraToEdit(m); setMuestraModalOpen(true) }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (!confirm(`¿Eliminar muestra ${m.muestra_id}? Esta acción no se puede deshacer.`)) return
                          deleteMuestra.mutate({ muestra_id: m.muestra_id }, {
                            onSuccess() { toast({ title: 'Muestra eliminada', description: m.muestra_id }) },
                            onError(err: any) { toast({ title: 'Error', description: String(err) }) }
                          })
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <MuestraModal
            isOpen={muestraModalOpen}
            onClose={() => { setMuestraModalOpen(false); setMuestraToEdit(null) }}
            muestraToEdit={muestraToEdit}
            placaId={placaId}
          />
        </>
      )}
    </div>
  )
}
