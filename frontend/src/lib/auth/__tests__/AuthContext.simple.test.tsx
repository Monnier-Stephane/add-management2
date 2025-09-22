import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'

// Mock Firebase
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signOut: jest.fn(),
  User: jest.fn(),
}))

// Mock fetch
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
      </AuthProvider>
    )
    
    expect(screen.getByText('Test Component')).toBeInTheDocument()
  })

  it('should provide initial loading state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
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

    // Mock onAuthStateChanged to call the callback with mockUser
    const { onAuthStateChanged } = require('firebase/auth')
    onAuthStateChanged.mockImplementation((auth, callback) => {
      // Simulate auth state change
      setTimeout(() => callback(mockUser), 0)
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
    onAuthStateChanged.mockImplementation((auth, callback) => {
      setTimeout(() => callback(mockUser), 0)
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

    await waitFor(() => {
      expect(screen.getByTestId('userProfile')).toHaveTextContent('No profile')
    })
  })

  it('should handle API errors', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
    }

    const { onAuthStateChanged } = require('firebase/auth')
    onAuthStateChanged.mockImplementation((auth, callback) => {
      setTimeout(() => callback(mockUser), 0)
      return jest.fn()
    })

    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('userProfile')).toHaveTextContent('No profile')
    })
  })
})
