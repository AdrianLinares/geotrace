import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { usePozos } from '../../hooks/usePozos'
import { useCuencas, useCampos, useContratos } from '../../hooks/useCatalogos'

export default function PozosPage() {
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const { data: pozoData, isLoading: loadingPozos } = usePozos(page, q)
  const { data: cuencas } = useCuencas()
  const { data: campos } = useCampos()
  const { data: contratos } = useContratos()

  const cuencaMap = new Map(cuencas?.map(c => [c.cuenca_id, c.nombre_cuenca]) ?? [])
  const campoMap = new Map(campos?.map(c => [c.campo_id, c.nombre_campo]) ?? [])
  const contratoMap = new Map(contratos?.map(c => [c.contrato_id, c.nombre_contrato]) ?? [])

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
                  <TableHead>Well Name</TableHead>
                  <TableHead>UWI</TableHead>
                  <TableHead>Cuenca</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Clasificación</TableHead>
                  <TableHead>TVD (ft)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pozoData?.data.map(p => (
                  <TableRow key={p.pozo_id}>
                    <TableCell className="font-medium">{p.well_name}</TableCell>
                    <TableCell>{p.uwi ?? '-'}</TableCell>
                    <TableCell>{cuencaMap.get(p.cuenca_id ?? '') ?? '-'}</TableCell>
                    <TableCell>{p.departamento ?? '-'}</TableCell>
                    <TableCell>{campoMap.get(p.campo_id ?? '') ?? '-'}</TableCell>
                    <TableCell>{p.estado_pozo ?? '-'}</TableCell>
                    <TableCell>{p.tipo_pozo ?? '-'}</TableCell>
                    <TableCell>{p.clasificacion ?? '-'}</TableCell>
                    <TableCell>{p.tvd?.toLocaleString() ?? '-'}</TableCell>
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
