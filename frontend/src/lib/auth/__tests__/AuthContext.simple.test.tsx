jest.mock('@/lib/api/api', () => ({
  api: {
    get: jest.fn(),
  },
}))

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import { mockCoachByEmailSuccess, mockCoachLookupFallback, mockCoachLookupFailure } from './authTestHelpers.helper'

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signOut: jest.fn(),
  User: jest.fn(),
}))

global.fetch = jest.fn()

const TestComponent = () => {
  const { user, userProfile, userRole, loading } = useAuth()

  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No user'}</div>
      <div data-testid="userProfile">{userProfile ? userProfile.nom : 'No profile'}</div>
      <div data-testid="userRole">{userRole || 'No role'}</div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not loading'}</div>
    </div>
  )
}

describe('AuthContext - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should render AuthProvider without crashing', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    expect(screen.getByTestId('user')).toBeInTheDocument()
  })

  it('should provide initial loading state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
    expect(screen.getByTestId('user')).toHaveTextContent('No user')
    expect(screen.getByTestId('userProfile')).toHaveTextContent('No profile')
    expect(screen.getByTestId('userRole')).toHaveTextContent('No role')
  })

  it('should handle Firebase auth state changes', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
    }

    const { onAuthStateChanged } = require('firebase/auth')
    onAuthStateChanged.mockImplementation(
      (_auth: unknown, callback: (user: typeof mockUser) => void) => {
        setTimeout(() => callback(mockUser), 0)
        return jest.fn()
      },
    )

    mockCoachByEmailSuccess({
      statut: 'admin',
      nom: 'Test',
      prenom: 'User',
      email: 'test@example.com',
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    })
  })

  it('should handle empty API response', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
    }

    const { onAuthStateChanged } = require('firebase/auth')
    onAuthStateChanged.mockImplementation(
      (_auth: unknown, callback: (user: typeof mockUser) => void) => {
        setTimeout(() => callback(mockUser), 0)
        return jest.fn()
      },
    )

    mockCoachLookupFallback([])

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('userProfile')).toHaveTextContent('No profile')
      expect(screen.getByTestId('userRole')).toHaveTextContent('coach')
    })
  })

  it('should handle API errors', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
    }

    const { onAuthStateChanged } = require('firebase/auth')
    onAuthStateChanged.mockImplementation(
      (_auth: unknown, callback: (user: typeof mockUser) => void) => {
        setTimeout(() => callback(mockUser), 0)
        return jest.fn()
      },
    )

    mockCoachLookupFailure()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('userProfile')).toHaveTextContent('No profile')
      expect(screen.getByTestId('userRole')).toHaveTextContent('coach')
    })
  })
})
