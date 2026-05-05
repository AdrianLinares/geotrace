import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useCreateMuestra, useUpdateMuestra } from '../../hooks/useMuestras'
import { supabase } from '../../lib/supabase'
import { MuestraForm, muestraSchema } from '../../lib/validations/muestra'
import { useAppStore } from '../../stores/appStore'
import { toast } from '../../components/shared/toast'
import TabConservacion from './tabs/TabConservacion'
import TabDisposicion from './tabs/TabDisposicion'
import TabEmpresas from './tabs/TabEmpresas'
import TabGeologia from './tabs/TabGeologia'
import TabMicrofauna from './tabs/TabMicrofauna'
import TabProcedencia from './tabs/TabProcedencia'

interface Props {
  isOpen: boolean
  onClose: () => void
  muestraToEdit?: MuestraForm & { muestra_id?: string }
  placaId?: string // if creating from a placa
}

/**
 * MuestraModal
 * - Modal para crear/editar una `muestra`, dividido en pestañas por áreas
 *   (procedencia, geología, microfauna, etc.).
 * - Almacena datos en múltiples tablas relacionadas; las operaciones actuales
 *   realizan deletes/inserts/upserts desde el cliente.
 *
 * Consejos para juniors:
 * - Estas operaciones no son atómicas: usar una función del servidor (RPC)
 *   para agrupar validación y persistencia en una transacción.
 * - Mantener la validación primaria en `zod` y validar permisos en el backend.
 */

export default function MuestraModal({ isOpen, onClose, muestraToEdit, placaId }: Props) {
  const user = useAppStore(s => s.user)
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
      methods.reset({ placa_id: placaId } as any)
    }
  }, [muestraToEdit, isOpen])

  async function onSubmit(values: MuestraForm) {
    try {
      const payload = {
        ...values,
        placa_id: values.placa_id || placaId,
        catalogador_id: user?.persona_id,
      }

      let muestraId = muestraToEdit?.muestra_id
      if (isEditing) {
        await update.mutateAsync({ ...payload, muestra_id: muestraId! })
      } else {
        const newMuestra = await create.mutateAsync(payload)
        muestraId = (newMuestra as any)?.muestra_id
      }

      // Save geologia
      if (values.geologia && muestraId) {
        await supabase.from('geologia').upsert({
          muestra_id: muestraId,
          ...values.geologia,
        }, { onConflict: 'muestra_id' })
      }

      // Save microfauna
      if (values.microfauna && muestraId) {
        // Delete existing and insert new (simpler)
        await supabase.from('microfauna').delete().eq('muestra_id', muestraId)
        for (const m of values.microfauna) {
          await supabase.from('microfauna').insert({
            muestra_id: muestraId,
            genero_especie: m.genero_especie,
            abundancia: m.abundancia,
            estado_preservacion: m.estado_preservacion,
            observaciones: m.observaciones,
            catalogador_id: user?.persona_id,
          })
        }
      }

      // Save empresas
      if (values.empresas && muestraId) {
        await supabase.from('muestra_empresa').delete().eq('muestra_id', muestraId)
        for (const e of values.empresas) {
          await supabase.from('muestra_empresa').insert({
            muestra_id: muestraId,
            empresa_id: e.empresa_id,
            rol: e.rol,
          })
        }
      }

      // Save disposicion
      if (values.disposicion && muestraId) {
        await supabase.from('disposicion_material').delete().eq('muestra_id', muestraId)
        for (const d of values.disposicion) {
          await supabase.from('disposicion_material').insert({
            muestra_id: muestraId,
            ...d,
          })
        }
      }

      // Save conservacion
      if (values.conservacion && muestraId) {
        await supabase.from('estado_conservacion').upsert({
          muestra_id: muestraId,
          ...values.conservacion,
          catalogador_id: user?.persona_id,
        }, { onConflict: 'muestra_id' })
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
            Complete la información en las pestañas y guarde.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="procedencia">
              <TabsList>
                <TabsTrigger value="procedencia">Procedencia</TabsTrigger>
                <TabsTrigger value="geologia">Geología</TabsTrigger>
                <TabsTrigger value="microfauna">Microfauna</TabsTrigger>
                <TabsTrigger value="empresas">Empresas</TabsTrigger>
                <TabsTrigger value="disposicion">Disposición</TabsTrigger>
                <TabsTrigger value="conservacion">Conservación</TabsTrigger>
              </TabsList>

              <TabsContent value="procedencia">
                <TabProcedencia control={methods.control} errors={methods.formState.errors} />
              </TabsContent>
              <TabsContent value="geologia">
                <TabGeologia control={methods.control} errors={methods.formState.errors} />
              </TabsContent>
              <TabsContent value="microfauna">
                <TabMicrofauna control={methods.control} />
              </TabsContent>
              <TabsContent value="empresas">
                <TabEmpresas control={methods.control} />
              </TabsContent>
              <TabsContent value="disposicion">
                <TabDisposicion control={methods.control} />
              </TabsContent>
              <TabsContent value="conservacion">
                <TabConservacion control={methods.control} />
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
