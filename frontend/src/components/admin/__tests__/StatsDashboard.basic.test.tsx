import '@/test-utils/setupDashboardTests'
import React from 'react'
import { renderWithProviders as render, screen, waitFor } from '@/test-utils/renderWithProviders'
import { mockUseSubscriptions } from '@/test-utils/setupDashboardTests'
import StatsDashboard from '../StatsDashboard'

jest.mock('recharts', () => ({
  PieChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: { children?: React.ReactNode }) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}))

describe('StatsDashboard - Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSubscriptions.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    })
  })

  it('should render without crashing', () => {
    render(<StatsDashboard />)
    expect(screen.getByText('Chargement des statistiques...')).toBeInTheDocument()
  })

  it('should handle API error gracefully', async () => {
    mockUseSubscriptions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('API Error'),
      refetch: jest.fn(),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Erreur: API Error')).toBeInTheDocument()
    })
  })

  it('should render loading state', () => {
    render(<StatsDashboard />)
    expect(screen.getByText('Chargement des statistiques...')).toBeInTheDocument()
  })
})
