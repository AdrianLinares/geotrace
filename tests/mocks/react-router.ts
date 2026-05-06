import React from 'react'
import type { NavigateProps } from 'react-router-dom'
import { vi } from 'vitest'

let lastNavigateProps: NavigateProps | null = null
const navigateCalls: NavigateProps[] = []
const navigateSpy = vi.fn()

export const MockNavigate: React.FC<NavigateProps> = (props) => {
  lastNavigateProps = props
  navigateCalls.push(props)
  return null
}

export const useNavigateMock = () => navigateSpy

export const getNavigateCalls = () => navigateCalls

export const getLastNavigateProps = () => lastNavigateProps

export const resetReactRouterMocks = () => {
  lastNavigateProps = null
  navigateCalls.length = 0
  navigateSpy.mockReset()
}
