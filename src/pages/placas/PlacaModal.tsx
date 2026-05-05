import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useCreatePlaca, useUpdatePlaca } from '../../hooks/usePlacas'
import { supabase } from '../../lib/supabase'
import { PlacaForm, placaSchema } from '../../lib/validations/placa'
import { useAppStore } from '../../stores/appStore'
import TabInformacionGeneral from './tabs/TabInformacionGeneral'
import TabMarcado from './tabs/TabMarcado'
import TabMuestras from './tabs/TabMuestras'
import TabNotasManuscritas from './tabs/TabNotasManuscritas'
import { toast } from '../../components/shared/toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  placaToEdit?: PlacaForm & { placa_id?: string }
}

/**
 * PlacaModal
 * - Modal para crear/editar una `placa` con pestañas para secciones relacionadas:
 *   información general, marcado, notas manuscritas y muestras.
 * - Usa `react-hook-form` con `zod` (resolver) para validación.
 * - Persiste datos en varias tablas (`placa`, `marcado_placa`, `nota_manuscrita`).
 *
 * Consejos para desarrolladores junior:
 * - Las upserts múltiples aquí no son atómicas: en producción prefiera
 *   una RPC/transaction en el servidor que haga todas las operaciones en una
 *   sola transacción y valide permisos.
 * - Evite lógica de negocio compleja en el cliente; úselo sólo para UX.
 */

export default function PlacaModal({ isOpen, onClose, placaToEdit }: Props) {
  const user = useAppStore(s => s.user)
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
      // Add catalogador_id from current user if not set
      const payload = {
        ...values,
        catalogador_id: user?.persona_id || undefined,
      }

      let placaId = placaToEdit?.placa_id
      if (isEditing) {
        await update.mutateAsync({ ...payload, placa_id: placaId! })
      } else {
        const newPlaca = await create.mutateAsync(payload)
        placaId = (newPlaca as any)?.placa_id
      }

      // Save marcado_placa if present
      if (values.marcado && placaId) {
        const marcado = {
          marcado_placa_id: `MP-${placaId}`,
          placa_id: placaId,
          ...values.marcado,
          catalogador_id: user?.persona_id,
        }
        await supabase.from('marcado_placa').upsert(marcado, { onConflict: 'marcado_placa_id' })
      }

      // Save notas manuscritas if present
      if (values.notas && placaId) {
        for (const nota of values.notas) {
          const notaId = `${placaId}_${nota.zona}_${Math.random().toString(36).slice(2, 6)}`
          await supabase.from('nota_manuscrita').upsert({
            nota_id: notaId,
            placa_id: placaId,
            zona: nota.zona,
            clave_nota: nota.clave_nota,
            texto_nota: nota.texto_nota,
            catalogador_id: user?.persona_id,
          }, { onConflict: 'nota_id' })
        }
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
            Complete la información en las pestañas y guarde.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="general">
              <TabsList>
                <TabsTrigger value="general">Información General</TabsTrigger>
                <TabsTrigger value="marcado">Marcado</TabsTrigger>
                <TabsTrigger value="notas">Notas Manuscritas</TabsTrigger>
                <TabsTrigger value="muestras">Muestras</TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <TabInformacionGeneral control={methods.control} errors={errors} />
              </TabsContent>
              <TabsContent value="marcado">
                <TabMarcado control={methods.control} errors={errors} />
              </TabsContent>
              <TabsContent value="notas">
                <TabNotasManuscritas control={methods.control} />
              </TabsContent>
              <TabsContent value="muestras">
                <TabMuestras control={methods.control} />
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
