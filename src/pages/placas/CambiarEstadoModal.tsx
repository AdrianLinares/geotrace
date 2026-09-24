import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { useCambiarEstado } from '../../hooks/usePlacas'
import { Placa } from '../../types/database'

interface Props {
  isOpen: boolean
  onClose: () => void
  placa: Placa | null
}

/**
 * CambiarEstadoModal
 * - Modal para cambiar el `estado_catalogacion` de una placa.
 * - Muestra transiciones permitidas (cliente-UX). La validación final
 *   y permisos deben estar en el servidor (RLS / funciones) — esto evita
 *   que un usuario manipule peticiones directamente.
 * - Mantener `TRANSITIONS` sincronizado con cualquier regla de negocio
 *   definida en el backend.
 */

const TRANSITIONS: Record<string, Array<{ id: string; label: string }>> = {
  '1': [{ id: '2', label: 'Incompleto' }, { id: '3', label: 'En revisión' }],
  '2': [{ id: '1', label: 'En proceso' }],
  '3': [{ id: '2', label: 'Incompleto' }, { id: '4', label: 'Validado' }],
  '4': [{ id: '1', label: 'En proceso' }, { id: '5', label: 'Cerrado' }],
  '5': [],
}

export default function CambiarEstadoModal({ isOpen, onClose, placa }: Props) {
  const [nuevoEstado, setNuevoEstado] = useState<string>('')
  const cambiar = useCambiarEstado()

  const allowed = placa?.estado_catalogacion_id ? TRANSITIONS[placa.estado_catalogacion_id] || [] : []

  async function handleConfirm() {
    if (!placa || !nuevoEstado) return
    try {
      await cambiar.mutateAsync({
        placa_id: placa.placa_id,
         estado_catalogacion_id: nuevoEstado,
      })
      onClose()
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar Estado de Catalogación</DialogTitle>
          <DialogDescription>
            Placa: {placa?.placa_id} — Estado actual: {placa?.estado_catalogacion}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm">Nuevo estado</label>
            <select
              value={nuevoEstado}
              onChange={e => setNuevoEstado(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">Seleccione...</option>
               {allowed.map(est => (
                <option key={est.id} value={est.id}>{est.label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleConfirm} disabled={!nuevoEstado || cambiar.status === 'pending'}>
              {cambiar.status === 'pending' ? 'Guardando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
