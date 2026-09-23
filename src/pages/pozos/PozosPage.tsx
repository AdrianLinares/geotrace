import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { usePozos } from '../../hooks/usePozos'
import { useCuencas } from '../../hooks/useCatalogos'

export default function PozosPage() {
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const { data: pozoData, isLoading: loadingPozos } = usePozos(page, q)
  const { data: cuencas } = useCuencas()

  const cuencaMap = new Map(cuencas?.map(c => [c.cuenca_id, c.nombre_cuenca]) ?? [])

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Pozos</h2>
        <div className="flex items-center gap-2">
          <Input value={q} onChange={e => { setQ(e.target.value); setPage(0) }} placeholder="Buscar pozo..." className="w-64" />
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        {loadingPozos ? <div>Cargando...</div> : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cuenca</TableHead>
                  <TableHead>Localización geográfica</TableHead>
                  <TableHead>Localización espacial</TableHead>
                  <TableHead>Estado catalogación</TableHead>
                  <TableHead>Estado revisión</TableHead>
                  <TableHead>Observaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pozoData?.data.map(p => (
                  <TableRow key={p.pozo_id}>
                    <TableCell className="font-medium">{p.codigo_pozo ?? '-'}</TableCell>
                    <TableCell>{p.nombre_pozo ?? '-'}</TableCell>
                    <TableCell>{cuencaMap.get(p.cuenca_id ?? '') ?? '-'}</TableCell>
                    <TableCell>{p.localizacion_geografica_id ?? '-'}</TableCell>
                    <TableCell>{p.localizacion_espacial_id ?? '-'}</TableCell>
                    <TableCell>{p.estado_catalogacion_id ?? '-'}</TableCell>
                    <TableCell>{p.estado_revision_id ?? '-'}</TableCell>
                    <TableCell>{p.observaciones ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>{pozoData?.total ?? 0} pozos en total</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={!pozoData || (page + 1) * 20 >= (pozoData.total ?? 0)} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
