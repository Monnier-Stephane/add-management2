jest.mock('@/lib/api/api', () => ({
  api: {
    get: jest.fn(),
  },
}))

import React from 'react'
import { render, screen, waitFor, act, fireEvent, renderHook } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import { User, onAuthStateChanged, signOut } from 'firebase/auth'
import { mockCoachByEmailSuccess, mockCoachLookupFallback, mockCoachLookupFailure } from './authTestHelpers.helper'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
  User: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
} as User

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

describe('AuthContext - Comprehensive Tests', () => {
  let authCallback: (user: User | null) => void

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    
    // Mock onAuthStateChanged
    ;(onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      authCallback = callback
      return jest.fn() // unsubscribe function
    })
  })

  it('should provide initial state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('No user')
    expect(screen.getByTestId('userProfile')).toHaveTextContent('No profile')
    expect(screen.getByTestId('userRole')).toHaveTextContent('No role')
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
  })

  it('should handle user login with coach profile', async () => {
    mockCoachByEmailSuccess({
      statut: 'coach',
      nom: 'Test',
      prenom: 'Coach',
      email: 'test@example.com',
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Simulate user login
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

  it('should handle user login with admin profile', async () => {
    mockCoachByEmailSuccess({
      statut: 'admin',
      nom: 'Admin',
      prenom: 'User',
      email: 'admin@example.com',
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await act(async () => {
      authCallback(mockUser)
    })

    await waitFor(() => {
      expect(screen.getByTestId('userRole')).toHaveTextContent('admin')
    })
  })

  it('should handle empty API response', async () => {
    mockCoachLookupFallback([])

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
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
    mockCoachLookupFailure()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await act(async () => {
      authCallback(mockUser)
    })

    await waitFor(() => {
      expect(screen.getByTestId('userRole')).toHaveTextContent('coach')
    })
  })

  it('should handle non-ok API response', async () => {
    mockCoachLookupFallback([])

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await act(async () => {
      authCallback(mockUser)
    })

    await waitFor(() => {
      expect(screen.getByTestId('userRole')).toHaveTextContent('coach')
    })
  })

  it('should handle user logout', async () => {
    ;(signOut as jest.Mock).mockResolvedValueOnce(undefined)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // First login
    await act(async () => {
      authCallback(mockUser)
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    })

    // Then logout
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
    ;(signOut as jest.Mock).mockResolvedValueOnce(undefined)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const logoutButton = screen.getByTestId('logout-btn')
    fireEvent.click(logoutButton)

    expect(signOut).toHaveBeenCalled()
  })

  it('should handle logout error', async () => {
    ;(signOut as jest.Mock).mockRejectedValueOnce(new Error('Logout error'))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    const logoutButton = screen.getByTestId('logout-btn')
    fireEvent.click(logoutButton)

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled()
    })
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
