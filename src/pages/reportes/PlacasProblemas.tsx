import React from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { usePlacasProblemas } from '../../hooks/useDashboard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'

export default function PlacasProblemas() {
  const { data: problemas, isLoading } = usePlacasProblemas()

  return (
    <AppLayout>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Placas con Problemas de Conservación</h3>
        <p className="text-sm text-muted-foreground">Lista de placas con alertas críticas o de atención</p>
      </div>

      {isLoading ? <p>Cargando...</p> : (
        <div className="bg-white border rounded p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Vidrio</TableHead>
                <TableHead>Hongos</TableHead>
                <TableHead>Riesgo Contam.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {problemas?.map((p, idx) => (
                <TableRow key={idx}>
                  <TableCell>{p.placa_id}</TableCell>
                  <TableCell>
                    <Badge variant={p.nivel === 'CRÍTICA' ? 'destructive' : p.nivel === 'ATENCIÓN' ? 'secondary' : 'default'}>
                      {p.nivel}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.vidrio_estado}</TableCell>
                  <TableCell>{p.presencia_hongos ? 'Sí' : 'No'}</TableCell>
                  <TableCell>{p.riesgo_contaminacion ? 'Sí' : 'No'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AppLayout>
  )
}
