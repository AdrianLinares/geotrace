import { Control, useWatch } from 'react-hook-form'
import { MUESTRAS_PLACA_LIMITATION, useMuestras } from '../../../hooks/useMuestras'
import { PlacaForm } from '../../../lib/validations/placa'

interface Props {
  control: Control<PlacaForm>
}

export default function TabMuestras({ control }: Props) {
  const placaId = useWatch({ control, name: 'placa_id' })
  const { data: muestras, isLoading, isPlateFilterUnsupported } = useMuestras(0, placaId)

  return (
    <div className="space-y-4">
      {isPlateFilterUnsupported
        ? <p className="text-sm text-muted-foreground">No se muestran muestras para esta placa: {MUESTRAS_PLACA_LIMITATION}</p>
        : !placaId
          ? <p className="text-sm text-muted-foreground">Guarda la placa primero para consultar sus muestras.</p>
          : isLoading
            ? <p>Cargando muestras...</p>
            : <p className="text-sm text-muted-foreground">No hay una consulta compatible para esta placa.</p>}
    </div>
  )
}
