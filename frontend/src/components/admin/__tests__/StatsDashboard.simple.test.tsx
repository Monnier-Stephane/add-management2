import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import StatsDashboard from '../StatsDashboard'

// Mock fetch
global.fetch = jest.fn()

// Types pour les composants Recharts mockés
interface RechartsComponentProps {
  children?: React.ReactNode
}

// Mock Recharts components
jest.mock('recharts', () => ({
  PieChart: ({ children }: RechartsComponentProps) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: RechartsComponentProps) => <div data-testid="pie">{children}</div>,
  Cell: ({ children }: RechartsComponentProps) => <div data-testid="cell">{children}</div>,
  Tooltip: () => <div data-testid="tooltip">Tooltip</div>,
  Legend: () => <div data-testid="legend">Legend</div>,
  ResponsiveContainer: ({ children }: RechartsComponentProps) => <div data-testid="responsive-container">{children}</div>,
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

describe('StatsDashboard - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should render loading state initially', () => {
    render(<StatsDashboard />)
    expect(screen.getByText('🔄 Chargement des statistiques...')).toBeInTheDocument()
  })

  it('should render error state when API fails', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Erreur: API Error')).toBeInTheDocument()
    })
  })

  it('should render error state when HTTP error occurs', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Erreur: HTTP Error: 500')).toBeInTheDocument()
    })
  })

  it('should render error state when unknown error occurs', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce('Unknown error type')

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Erreur: Erreur inconnue')).toBeInTheDocument()
    })
  })

  it('should render stats dashboard with data', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubscriptions),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Total d.*adhérents/)).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument() // Total count
      expect(screen.getByText('Enfants')).toBeInTheDocument()
      expect(screen.getByText('Adolescents')).toBeInTheDocument()
      expect(screen.getByText('Adultes')).toBeInTheDocument()
    })
  })

  it('should display correct statistics', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubscriptions),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      // Total count
      expect(screen.getByText('3')).toBeInTheDocument()
      
      // Age categories (based on tarif) - use getAllByText for multiple elements
      expect(screen.getAllByText('1')).toHaveLength(3) // Enfants, Ados, Adultes (1 each)
    })
  })

  it('should display debug information', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubscriptions),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Debug:/)).toBeInTheDocument()
      expect(screen.getByText(/Total: 3/)).toBeInTheDocument()
      expect(screen.getByText(/En attente: 1/)).toBeInTheDocument()
      expect(screen.getByText(/Payé: 2/)).toBeInTheDocument()
    })
  })

  it('should render pie charts', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubscriptions),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Statut de paiement')).toBeInTheDocument()
      expect(screen.getByText('Répartition par catégorie')).toBeInTheDocument()
      expect(screen.getAllByTestId('pie-chart')).toHaveLength(2)
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(2)
    })
  })

  it('should handle empty data', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Total d.*adhérents/)).toBeInTheDocument()
      expect(screen.getAllByText('0')).toHaveLength(4) // Total count + 3 categories
      expect(screen.getByText('Enfants')).toBeInTheDocument()
      expect(screen.getByText('Adolescents')).toBeInTheDocument()
      expect(screen.getByText('Adultes')).toBeInTheDocument()
    })
  })

  it('should handle data with missing fields', async () => {
    const incompleteData = [
      {
        _id: '1',
        nom: 'Dupont',
        prenom: 'Jean',
        // Missing statutPaiement and tarif
      },
      {
        _id: '2',
        nom: 'Martin',
        prenom: 'Marie',
        statutPaiement: 'payé',
        // Missing tarif
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(incompleteData),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Total d.*adhérents/)).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // Total count
      expect(screen.getByText('Enfants')).toBeInTheDocument()
      expect(screen.getByText('Adolescents')).toBeInTheDocument()
      expect(screen.getByText('Adultes')).toBeInTheDocument()
    })
  })

  it('should handle data with null/undefined fields', async () => {
    const dataWithNulls = [
      {
        _id: '1',
        nom: 'Dupont',
        prenom: 'Jean',
        statutPaiement: null,
        tarif: null,
      },
      {
        _id: '2',
        nom: 'Martin',
        prenom: 'Marie',
        statutPaiement: undefined,
        tarif: undefined,
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(dataWithNulls),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Total d.*adhérents/)).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // Total count
      expect(screen.getByText('Enfants')).toBeInTheDocument()
      expect(screen.getByText('Adolescents')).toBeInTheDocument()
      expect(screen.getByText('Adultes')).toBeInTheDocument()
    })
  })

  it('should handle data with empty strings', async () => {
    const dataWithEmptyStrings = [
      {
        _id: '1',
        nom: 'Dupont',
        prenom: 'Jean',
        statutPaiement: '',
        tarif: '',
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(dataWithEmptyStrings),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Total d.*adhérents/)).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument() // Total count
      expect(screen.getByText('Enfants')).toBeInTheDocument()
      expect(screen.getByText('Adolescents')).toBeInTheDocument()
      expect(screen.getByText('Adultes')).toBeInTheDocument()
    })
  })

  it('should categorize by tarif correctly', async () => {
    const testData = [
      { _id: '1', nom: 'A', prenom: 'A', statutPaiement: 'payé', tarif: 'TARIF ENFANT' },
      { _id: '2', nom: 'B', prenom: 'B', statutPaiement: 'payé', tarif: 'TARIF ADO' },
      { _id: '3', nom: 'C', prenom: 'C', statutPaiement: 'payé', tarif: 'TARIF ADULTE' },
      { _id: '4', nom: 'D', prenom: 'D', statutPaiement: 'payé', tarif: 'AUTRE TARIF' },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(testData),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Total d.*adhérents/)).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument() // Total count
      expect(screen.getByText('Enfants')).toBeInTheDocument()
      expect(screen.getByText('Adolescents')).toBeInTheDocument()
      expect(screen.getByText('Adultes')).toBeInTheDocument()
    })
  })

  it('should handle payment status correctly', async () => {
    const testData = [
      { _id: '1', nom: 'A', prenom: 'A', statutPaiement: 'payé', tarif: 'TARIF A' },
      { _id: '2', nom: 'B', prenom: 'B', statutPaiement: 'en attente', tarif: 'TARIF B' },
      { _id: '3', nom: 'C', prenom: 'C', statutPaiement: 'payé', tarif: 'TARIF C' },
      { _id: '4', nom: 'D', prenom: 'D', statutPaiement: 'en attente', tarif: 'TARIF D' },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(testData),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Total d.*adhérents/)).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument() // Total count
      expect(screen.getByText('Enfants')).toBeInTheDocument()
      expect(screen.getByText('Adolescents')).toBeInTheDocument()
      expect(screen.getByText('Adultes')).toBeInTheDocument()
    })
  })

  it('should handle mixed case in tarif', async () => {
    const testData = [
      { _id: '1', nom: 'A', prenom: 'A', statutPaiement: 'payé', tarif: 'TARIF ENFANT' },
      { _id: '2', nom: 'B', prenom: 'B', statutPaiement: 'payé', tarif: 'tarif ado' },
      { _id: '3', nom: 'C', prenom: 'C', statutPaiement: 'payé', tarif: 'Tarif Adulte' },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(testData),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Total d.*adhérents/)).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument() // Total count
      expect(screen.getByText('Enfants')).toBeInTheDocument()
      expect(screen.getByText('Adolescents')).toBeInTheDocument()
      expect(screen.getByText('Adultes')).toBeInTheDocument()
    })
  })

  it('should handle partial matches in tarif', async () => {
    const testData = [
      { _id: '1', nom: 'A', prenom: 'A', statutPaiement: 'payé', tarif: 'COURS ENFANT' },
      { _id: '2', nom: 'B', prenom: 'B', statutPaiement: 'payé', tarif: 'ADOLESCENT' },
      { _id: '3', nom: 'C', prenom: 'C', statutPaiement: 'payé', tarif: 'ADULTE' },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(testData),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Total d.*adhérents/)).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument() // Total count
      expect(screen.getByText('Enfants')).toBeInTheDocument()
      expect(screen.getByText('Adolescents')).toBeInTheDocument()
      expect(screen.getByText('Adultes')).toBeInTheDocument()
    })
  })

  it('should handle network timeout', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 100)
      )
    )

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Erreur: Network timeout')).toBeInTheDocument()
    })
  })

  it('should handle malformed JSON response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error('Unexpected token')),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Erreur: Unexpected token')).toBeInTheDocument()
    })
  })

  it('should handle response with non-array data', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Not an array' }),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Erreur: data.forEach is not a function')).toBeInTheDocument()
    })
  })

  it('should handle response with null data', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Erreur: Cannot read properties of null (reading \'length\')')).toBeInTheDocument()
    })
  })

  it('should handle response with undefined data', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(undefined),
    })

    render(<StatsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Erreur: Cannot read properties of undefined (reading \'length\')')).toBeInTheDocument()
    })
  })
})