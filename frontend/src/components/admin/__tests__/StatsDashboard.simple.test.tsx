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

const mockSubscriptions = [
  {
    _id: '1',
    nom: 'Dupont',
    prenom: 'Jean',
    statutPaiement: 'payé',
    tarif: 'LUNDI 19h30 Bercy ADULTES',
  },
  {
    _id: '2',
    nom: 'Martin',
    prenom: 'Marie',
    statutPaiement: 'en attente',
    tarif: 'MERCREDI 12h15 Paris Châtelet ENFANTS',
  },
  {
    _id: '3',
    nom: 'Durand',
    prenom: 'Paul',
    statutPaiement: 'payé',
    tarif: 'SAMEDI 10h00 Choisy ADOS',
  },
]

function mockLoadedStats(data = mockSubscriptions) {
  mockUseSubscriptions.mockReturnValue({
    data,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })
}

describe('StatsDashboard - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSubscriptions.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    })
  })

  it('should render loading state initially', () => {
    render(<StatsDashboard />)
    expect(screen.getByText('Chargement des statistiques...')).toBeInTheDocument()
  })

  it('should render error state when API fails', async () => {
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

  it('should render error state when HTTP error occurs', async () => {
    mockUseSubscriptions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('HTTP 500: Internal Server Error'),
      refetch: jest.fn(),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Erreur:/)).toBeInTheDocument()
    })
  })

  it('should render stats dashboard with data', async () => {
    mockLoadedStats()
    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText("Total d'adhérents")).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  it('should show pending payment details', async () => {
    mockLoadedStats()
    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Paiements en attente (1)')).toBeInTheDocument()
    })
  })

  it('should handle empty subscriptions array', async () => {
    mockLoadedStats([])
    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText("Total d'adhérents")).toBeInTheDocument()
      expect(screen.getAllByText('0').length).toBeGreaterThan(0)
    })
  })

  it('should handle null data as error state', async () => {
    mockUseSubscriptions.mockReturnValue({
      data: null as unknown as [],
      isLoading: false,
      error: new Error('["subscriptions"] data is null'),
      refetch: jest.fn(),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Erreur:/)).toBeInTheDocument()
    })
  })

  it('should handle undefined data as error state', async () => {
    mockUseSubscriptions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('["subscriptions"] data is undefined'),
      refetch: jest.fn(),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Erreur: ["subscriptions"] data is undefined')).toBeInTheDocument()
    })
  })
})
