import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WithAdmin } from '@/components/shared/roleGuards'
import { useAppStore } from '@/stores/appStore'
import { resetAppStore } from '../../mocks/useAppStore'
import { getLastNavigateProps, resetReactRouterMocks, useNavigateMock } from '../../mocks/react-router'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  const mocks = await import('../../mocks/react-router')

  return {
    ...actual,
    Navigate: mocks.MockNavigate,
    useNavigate: mocks.useNavigateMock,
  }
})

describe('roleGuards', () => {
  beforeEach(() => {
    resetAppStore()
    resetReactRouterMocks()
  })

  it('renders children when user has required role', () => {
    useAppStore.setState({
      user: { persona_id: 'p-1', nombre: 'Ana', rol: 'Administrador' },
      authLoading: false,
    })

    render(
      <WithAdmin>
        <div>contenido protegido</div>
      </WithAdmin>
    )

    expect(screen.getByText('contenido protegido')).toBeInTheDocument()
    expect(getLastNavigateProps()).toBeNull()
  })

  it('redirects when user lacks required role', () => {
    useAppStore.setState({
      user: { persona_id: 'p-2', nombre: 'Beto', rol: 'Curador' },
      authLoading: false,
    })

    render(
      <WithAdmin>
        <div>contenido protegido</div>
      </WithAdmin>
    )

    expect(screen.queryByText('contenido protegido')).not.toBeInTheDocument()
    expect(getLastNavigateProps()).toMatchObject({ to: '/', replace: true })
  })

  it('redirects unauthenticated users to login', () => {
    useAppStore.setState({ user: null, authLoading: false })

    render(
      <WithAdmin>
        <div>contenido protegido</div>
      </WithAdmin>
    )

    expect(screen.queryByText('contenido protegido')).not.toBeInTheDocument()
    expect(getLastNavigateProps()).toMatchObject({ to: '/login', replace: true })
  })

  it('exposes useNavigate mock for future guard tests', () => {
    const navigate = useNavigateMock()
    navigate('/destino')

    expect(navigate).toHaveBeenCalledWith('/destino')
  })
})
