import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../src/lib/api'
import { importBatches, importRows } from '../../src/lib/importApi'

describe('local import client', () => {
  it('posts the table and rows to the local endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ imported: 1 }), { status: 200 })))
    await expect(importRows('coleccion', [{ codigo_coleccion: 'COL-1' }])).resolves.toEqual({ imported: 1 })
    expect(fetch).toHaveBeenCalledWith('/api/admin/import', expect.objectContaining({ method: 'POST', credentials: 'include' }))
  })

  it('posts all table batches in one request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ imported: 2 }), { status: 200 })))
    await expect(importBatches([
      { table: 'coleccion', rows: [{ codigo_coleccion: 'COL-1' }] },
      { table: 'pozo', rows: [{ codigo_pozo: 'POZ-1' }] },
    ])).resolves.toEqual({ imported: 2 })
    expect(fetch).toHaveBeenCalledWith('/api/admin/import', expect.objectContaining({ body: JSON.stringify({ batches: [
      { table: 'coleccion', rows: [{ codigo_coleccion: 'COL-1' }] },
      { table: 'pozo', rows: [{ codigo_pozo: 'POZ-1' }] },
    ] }) }))
  })

  it.each([[401, 'La sesión es necesaria para importar datos.'], [403, 'Solo un Administrador puede importar datos.'], [409, 'La importación entra en conflicto con un registro o referencia existente.'], [400, 'El archivo contiene datos no válidos para la importación.']])('maps HTTP %s to a safe message', async (status, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })))
    await expect(importRows('pozo', [{}])).rejects.toThrow(message)
  })

  it('does not expose server error details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new ApiError(500, 'SQL secret detail')))
    await expect(importRows('muestra', [{}])).rejects.toThrow('No fue posible importar los datos.')
    await expect(importRows('muestra', [{}])).rejects.not.toThrow('SQL secret detail')
  })
})
