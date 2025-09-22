import React from 'react'
import { render, screen } from '@testing-library/react'
import StatsDashboard from '../StatsDashboard'

// Mock fetch
global.fetch = jest.fn()

describe('StatsDashboard - Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should render without crashing', () => {
    render(<StatsDashboard />)
    
    // Should show loading state initially
    expect(screen.getByText('🔄 Chargement des statistiques...')).toBeInTheDocument()
  })

  it('should handle API error gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    render(<StatsDashboard />)

    // Should show error state
    expect(screen.getByText('Erreur: API Error')).toBeInTheDocument()
  })

  it('should render loading state', () => {
    render(<StatsDashboard />)
    
    expect(screen.getByText('🔄 Chargement des statistiques...')).toBeInTheDocument()
  })
})
