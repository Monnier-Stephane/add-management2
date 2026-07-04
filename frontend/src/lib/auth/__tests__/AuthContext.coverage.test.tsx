jest.mock('@/lib/api/api', () => ({
  api: {
    get: jest.fn(),
  },
}))

import React from 'react'
import { render, screen, waitFor, act, fireEvent, renderHook } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import {
  mockCoachByEmailSuccess,
  mockCoachLookupFallback,
  mockCoachLookupFailure,
} from './authTestHelpers.helper'

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signOut: jest.fn(),
  User: jest.fn(),
  getAuth: jest.fn(),
}))

jest.mock('../firebase', () => ({
  auth: {
    currentUser: null,
  },
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

global.fetch = jest.fn()

const TestComponent = () => {
  const { user, userProfile, userRole, loading, logout } = useAuth()

  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No user'}</div>
      <div data-testid="userProfile">{userProfile ? userProfile.nom : 'No profile'}</div>
      <div data-testid="userRole">{userRole || 'No role'}</div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not loading'}</div>
      <button data-testid="logout-btn" onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext - Coverage Tests', () => {
  let authCallback: (user: { uid: string; email: string } | null) => void

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()

    const { onAuthStateChanged } = require('firebase/auth')
    onAuthStateChanged.mockImplementation(
      (_auth: unknown, callback: (user: { uid: string; email: string } | null) => void) => {
        authCallback = callback
        return jest.fn()
      },
    )
  })

  it('should provide initial state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    expect(screen.getByTestId('user')).toHaveTextContent('No user')
    expect(screen.getByTestId('userProfile')).toHaveTextContent('No profile')
    expect(screen.getByTestId('userRole')).toHaveTextContent('No role')
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
  })

  it('should handle user login with successful API response', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' }

    mockCoachByEmailSuccess({
      statut: 'coach',
      nom: 'Test',
      prenom: 'Coach',
      email: 'test@example.com',
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    await act(async () => {
      authCallback(mockUser)
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('userProfile')).toHaveTextContent('Test')
      expect(screen.getByTestId('userRole')).toHaveTextContent('coach')
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
    })
  })

  it('should handle user login with admin role', async () => {
    const mockUser = { uid: 'test-uid', email: 'admin@example.com' }

    mockCoachByEmailSuccess({
      statut: 'admin',
      nom: 'Admin',
      prenom: 'User',
      email: 'admin@example.com',
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    await act(async () => {
      authCallback(mockUser)
    })

    await waitFor(() => {
      expect(screen.getByTestId('userRole')).toHaveTextContent('admin')
    })
  })

  it('should handle empty API response', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' }

    mockCoachLookupFallback([])

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    await act(async () => {
      authCallback(mockUser)
    })

    await waitFor(() => {
      expect(screen.getByTestId('userProfile')).toHaveTextContent('No profile')
      expect(screen.getByTestId('userRole')).toHaveTextContent('coach')
    })
  })

  it('should handle API error', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' }

    mockCoachLookupFailure()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    await act(async () => {
      authCallback(mockUser)
    })

    await waitFor(() => {
      expect(screen.getByTestId('userRole')).toHaveTextContent('coach')
    })
  })

  it('should handle non-ok API response', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' }

    mockCoachLookupFallback([])

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    await act(async () => {
      authCallback(mockUser)
    })

    await waitFor(() => {
      expect(screen.getByTestId('userRole')).toHaveTextContent('coach')
    })
  })

  it('should handle user logout', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    await act(async () => {
      authCallback(mockUser)
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    })

    await act(async () => {
      authCallback(null)
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user')
      expect(screen.getByTestId('userProfile')).toHaveTextContent('No profile')
      expect(screen.getByTestId('userRole')).toHaveTextContent('No role')
    })
  })

  it('should handle logout function', async () => {
    const { signOut } = require('firebase/auth')
    ;(signOut as jest.Mock).mockResolvedValueOnce(undefined)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    const logoutButton = screen.getByTestId('logout-btn')
    fireEvent.click(logoutButton)

    expect(signOut).toHaveBeenCalled()
  })

  it('should throw error when useAuth is used outside AuthProvider', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <>{children}</>,
    })

    expect(result.current).toMatchObject({
      user: null,
      userProfile: null,
      userRole: null,
    })
  })
})
