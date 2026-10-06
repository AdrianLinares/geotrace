import { apiRequest, ApiError } from './api'

export type ImportTable =
  | 'coleccion' | 'pozo' | 'placa' | 'muestra'
  | 'dic_uni_lito_reportada' | 'dic_uni_lito_normalizada' | 'dic_uni_lito_actualizada'
  | 'dic_biozona_reportada' | 'dic_biozona_normalizada' | 'dic_biozona_actualizada'
  | 'dic_edad_reportada' | 'dic_edad_normalizada' | 'dic_edad_actualizada'
export type ImportRow = Record<string, unknown>
export type ImportBatch = { table: ImportTable; rows: ImportRow[] }

export async function importBatches(batches: ImportBatch[]) {
  try {
    return await apiRequest<{ imported: number }>('/api/admin/import', {
      method: 'POST',
      body: JSON.stringify({ batches }),
    })
  } catch (error) {
    if (error instanceof ApiError) {
      const message = error.status === 401
        ? 'La sesión es necesaria para importar datos.'
        : error.status === 403
          ? 'Solo un Administrador puede importar datos.'
          : error.status === 409
            ? 'La importación entra en conflicto con un registro o referencia existente.'
            : error.status === 400
              ? 'El archivo contiene datos no válidos para la importación.'
              : 'No fue posible importar los datos.'
      throw new Error(message)
    }
    throw new Error('No fue posible importar los datos.')
  }
}

export const importRows = (table: ImportTable, rows: ImportRow[]) => importBatches([{ table, rows }])
