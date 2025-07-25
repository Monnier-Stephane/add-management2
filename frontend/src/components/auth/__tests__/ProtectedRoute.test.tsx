import '@testing-library/jest-dom';
import React from 'react'
import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from '../ProtectedRoute'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}))

describe('ProtectedRoute', () => {
  const mockPush = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock router
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it('should show loading state when auth is loading', () => {
    // Configure auth mock for loading state
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    })

    render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('should redirect unauthenticated users to login', () => {
    // Configure auth mock for unauthenticated user
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    })

    render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    )

    // Check redirection
    expect(mockPush).toHaveBeenCalledWith('/login')
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('should render children for authenticated users', () => {
    // Configure auth mock for authenticated user
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { uid: '123', email: 'test@example.com' },
      loading: false,
    })

    render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })
}) 