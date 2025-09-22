import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import { User, onAuthStateChanged } from 'firebase/auth'

// Firebase is already mocked globally in jest.setup.js

// Mock fetch
global.fetch = jest.fn()

const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
} as User

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

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
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

  it('should handle user authentication', async () => {
    let authCallback: (user: User | null) => void

    jest.mocked(onAuthStateChanged).mockImplementation((auth, nextOrObserver) => {
      authCallback = nextOrObserver as (user: User | null) => void
      return jest.fn() // unsubscribe function
    })

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({
        statut: 'admin',
        nom: 'Test',
        prenom: 'User',
        email: 'test@example.com'
      }))
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
    })

    await waitFor(() => {
      expect(screen.getByTestId('userProfile')).toHaveTextContent('Test')
    })

    await waitFor(() => {
      expect(screen.getByTestId('userRole')).toHaveTextContent('admin')
    })
  })

  it('should handle user logout', async () => {
    let authCallback: (user: User | null) => void

    jest.mocked(onAuthStateChanged).mockImplementation((auth, nextOrObserver) => {
      authCallback = nextOrObserver as (user: User | null) => void
      return jest.fn()
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Simulate user login first
    await act(async () => {
      authCallback(mockUser)
    })

    // Then simulate logout
    await act(async () => {
      authCallback(null)
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user')
    })
  })

  it('should handle API error when fetching coach profile', async () => {
    let authCallback: (user: User | null) => void

    jest.mocked(onAuthStateChanged).mockImplementation((auth, nextOrObserver) => {
      authCallback = nextOrObserver as (user: User | null) => void
      return jest.fn()
    })

    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

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
    })
  })

  it('should handle empty API response', async () => {
    let authCallback: (user: User | null) => void

    jest.mocked(onAuthStateChanged).mockImplementation((auth, nextOrObserver) => {
      authCallback = nextOrObserver as (user: User | null) => void
      return jest.fn()
    })

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('')
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
      expect(screen.getByTestId('userProfile')).toHaveTextContent('No profile')
    })
  })

  it('should throw error when useAuth is used outside AuthProvider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')
    
    consoleSpy.mockRestore()
  })
})
