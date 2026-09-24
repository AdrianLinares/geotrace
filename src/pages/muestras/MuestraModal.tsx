import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { useCreateMuestra, useUpdateMuestra } from '../../hooks/useMuestras'
import { MuestraForm, muestraSchema } from '../../lib/validations/muestra'
import { toast } from '../../components/shared/toast'
import { Input } from '../../components/ui/input'

interface Props {
  isOpen: boolean
  onClose: () => void
  muestraToEdit?: MuestraForm & { muestra_id?: string }
  placaId?: string // retained for callers; MUESTRA has no normalized PLACA relation
}

/**
 * MuestraModal
 * The local API persists only the base MUESTRA columns confirmed by sql/schema.sql.
 * Subtypes, relations, auditing, and the old multi-tab writes require a separate
 * work unit and are intentionally not sent from this modal.
 */

 export default function MuestraModal({ isOpen, onClose, muestraToEdit }: Props) {
  const isEditing = !!muestraToEdit?.muestra_id

  const methods = useForm<MuestraForm>({
    resolver: zodResolver(muestraSchema),
    defaultValues: muestraToEdit as any,
  })

  const { handleSubmit } = methods

  const create = useCreateMuestra()
  const update = useUpdateMuestra()

  useEffect(() => {
    if (muestraToEdit) {
      methods.reset(muestraToEdit as any)
    } else {
      methods.reset({})
    }
  }, [muestraToEdit, isOpen])

  async function onSubmit(values: MuestraForm) {
    try {
      const payload = {
        nombre_muestra_original: values.nombre_muestra_original,
        codigo_muestra_sistema: values.codigo_muestra_sistema,
        origen_muestra_id: values.origen_muestra_id,
        metodo_adquisicion_id: values.metodo_adquisicion_id,
        fecha_ingreso: values.fecha_ingreso,
        revisor_id: values.revisor_id,
        fecha_revision: values.fecha_revision,
        estado_catalogacion_id: values.estado_catalogacion_id,
        observaciones: values.observaciones,
      }

      let muestraId = muestraToEdit?.muestra_id
      if (isEditing) {
        await update.mutateAsync({ ...payload, muestra_id: muestraId! })
      } else {
        const newMuestra = await create.mutateAsync(payload)
        muestraId = (newMuestra as any)?.muestra_id
      }

      // Show success toast and close
      toast({ title: isEditing ? 'Muestra actualizada' : 'Muestra creada', description: muestraId })
      onClose()
    } catch (error) {
      console.error(error)
      toast({ title: 'Error al guardar muestra', description: String(error) })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Muestra' : 'Nueva Muestra'}</DialogTitle>
          <DialogDescription>
            Esta pantalla guarda únicamente los campos base normalizados de MUESTRA.
            Las pestañas de geología, microfauna, empresas, disposición y conservación,
            además de MUESTRA_SUBSUELO y otras relaciones, requieren un work unit separado.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <label className="block text-sm">Nombre original</label>
              <Input {...methods.register('nombre_muestra_original')} />
              <label className="block text-sm">Código de sistema</label>
              <Input {...methods.register('codigo_muestra_sistema')} />
              <label className="block text-sm">Origen de muestra (ID)</label>
              <Input {...methods.register('origen_muestra_id')} />
              <label className="block text-sm">Método de adquisición (ID)</label>
              <Input {...methods.register('metodo_adquisicion_id')} />
              <label className="block text-sm">Estado de catalogación (ID)</label>
              <Input {...methods.register('estado_catalogacion_id')} />
              <label className="block text-sm">Observaciones</label>
              <textarea {...methods.register('observaciones')} className="min-h-24 w-full rounded border p-2" />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={create.status === 'pending' || update.status === 'pending'}>
                {create.status === 'pending' || update.status === 'pending' ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
