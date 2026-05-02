import React, { useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useCambiarEstado } from '../../hooks/usePlacas'
import { Placa } from '../../types/database'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'

interface Props {
  isOpen: boolean
  onClose: () => void
  placa: Placa | null
}

const TRANSITIONS: Record<string, string[]> = {
  'En proceso': ['Incompleto', 'En revisión'],
  'En revisión': ['Validado', 'Incompleto'],
  'Incompleto': ['En proceso'],
  'Validado': [], // only Curador/Admin via special permission
}

export default function CambiarEstadoModal({ isOpen, onClose, placa }: Props) {
  const user = useAppStore(s => s.user)
  const [nuevoEstado, setNuevoEstado] = useState<string>('')
  const [obs, setObs] = useState('')
  const cambiar = useCambiarEstado()

  const allowed = placa?.estado_catalogacion
    ? (placa.estado_catalogacion === 'Validado'
        ? (['Curador', 'Administrador'].includes(user?.rol || '') ? ['En proceso'] : [])
        : TRANSITIONS[placa.estado_catalogacion] || [])
    : []

  async function handleConfirm() {
    if (!placa || !nuevoEstado) return
    try {
      await cambiar.mutateAsync({
        placa_id: placa.placa_id,
        nuevoEstado,
        observaciones: obs,
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
          {placa?.estado_catalogacion === 'Validado' && !['Curador', 'Administrador'].includes(user?.rol || '') && (
            <p className="text-red-500">No tienes permisos para cambiar el estado de una placa Validada.</p>
          )}

          <div>
            <label className="block text-sm">Nuevo estado</label>
            <select
              value={nuevoEstado}
              onChange={e => setNuevoEstado(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">Seleccione...</option>
              {allowed.map(est => (
                <option key={est} value={est}>{est}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm">Observaciones</label>
            <Textarea value={obs} onChange={e => setObs(e.target.value)} />
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
