import { describe, expect, it, vi } from 'vitest'
import { createAuditRepository } from '../../server/audit'

describe('createAuditRepository', () => {
  it('records the authenticated persona and JSON changes', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const audit = createAuditRepository({ query } as never)

    await audit.record({
      tabla: 'placa',
      operacion: 'UPDATE',
      registroId: '7',
      user: { personaId: '3', username: 'adrian', name: 'Adrian', roles: ['Administrador'] },
      cambios: { estado_catalogacion_id: '4' },
    })

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO public.auditoria'),
      ['placa', 'UPDATE', '7', '3', '{"estado_catalogacion_id":"4"}'],
    )
  })

  it('lists newest audit entries with bounded pagination', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ auditoria_id: '1' }] })
    const audit = createAuditRepository({ query } as never)

    await expect(audit.list()).resolves.toEqual([{ auditoria_id: '1' }])
    expect(query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY a.created_at DESC'), [50])
  })
})
