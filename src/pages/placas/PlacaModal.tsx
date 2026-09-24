import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useCreatePlaca, useUpdatePlaca } from '../../hooks/usePlacas'
import { PlacaForm, placaSchema } from '../../lib/validations/placa'
import TabInformacionGeneral from './tabs/TabInformacionGeneral'
import { toast } from '../../components/shared/toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  placaToEdit?: PlacaForm & { placa_id?: string }
}

/**
 * PlacaModal
 * - Modal para crear/editar las columnas normalizadas de `placa`.
 * - Usa `react-hook-form` con `zod` (resolver) para validación.
 * - Este work unit persiste solamente columnas normalizadas de `placa`.
 *
 * Consejos para desarrolladores junior:
 * - Las upserts múltiples aquí no son atómicas: en producción prefiera
 *   una RPC/transaction en el servidor que haga todas las operaciones en una
 *   sola transacción y valide permisos.
 * - Evite lógica de negocio compleja en el cliente; úselo sólo para UX.
 */

export default function PlacaModal({ isOpen, onClose, placaToEdit }: Props) {
  const isEditing = !!placaToEdit?.placa_id

  const methods = useForm<PlacaForm>({
    resolver: zodResolver(placaSchema),
    defaultValues: placaToEdit as any,
  })

  const { handleSubmit, formState: { errors } } = methods

  const create = useCreatePlaca()
  const update = useUpdatePlaca()

  useEffect(() => {
    if (placaToEdit) {
      methods.reset(placaToEdit as any)
    } else {
      methods.reset({} as any)
    }
  }, [placaToEdit, isOpen])

  async function onSubmit(values: PlacaForm) {
    try {
      let placaId = placaToEdit?.placa_id
      if (isEditing) {
        await update.mutateAsync({ ...values, placa_id: placaId! })
      } else {
        const newPlaca = await create.mutateAsync(values)
        placaId = (newPlaca as any)?.placa_id
      }

      onClose()
    } catch (error) {
      console.error(error)
      toast({ title: 'Error al guardar placa', description: String(error) })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Placa' : 'Nueva Placa'}</DialogTitle>
          <DialogDescription>
            Complete los IDs y campos normalizados de PLACA y guarde.
          </DialogDescription>
          <p className="text-sm text-amber-700">Limitación de esta migración: MARCADO_PLACA, ANOTACION_PLACA y MUESTRA requieren work units separados y no se guardarán parcialmente.</p>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="general">
              <TabsList>
                <TabsTrigger value="general">Información General</TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <TabInformacionGeneral control={methods.control} errors={errors} />
              </TabsContent>
            </Tabs>

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
