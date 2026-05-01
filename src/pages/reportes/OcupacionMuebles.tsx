import React from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { useOcupacionMuebles } from '../../hooks/useDashboard'

export default function OcupacionMuebles() {
  const { data: ocupacion, isLoading } = useOcupacionMuebles()

  return (
    <AppLayout>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Ocupación de Muebles</h3>
        <p className="text-sm text-muted-foreground">Porcentaje de ocupación por mueble</p>
      </div>

      {isLoading ? <p>Cargando...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ocupacion?.map(m => (
            <div key={m.name} className="border rounded p-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium">{m.name}</span>
                <span className="text-sm text-muted-foreground">{m.ocupacion}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-primary h-4 rounded-full"
                  style={{ width: `${m.ocupacion}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {m.ocupadas} / {m.total} ubicaciones ocupadas
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
