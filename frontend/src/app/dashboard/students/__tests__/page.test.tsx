import '@/test-utils/setupDashboardTests'
import React from 'react'
import { renderWithProviders as render, screen, waitFor, fireEvent } from '@/test-utils/renderWithProviders'
import { mockUseSubscriptions, mockUseUniqueTarifs } from '@/test-utils/setupDashboardTests'
import StudentsPage from '../page'

const mockStudents = [
  {
    _id: '1',
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean@example.com',
    telephone: '0123456789',
    dateDeNaissance: '2010-01-01',
    adresse: '1 rue Test',
    ville: 'Paris',
    codePostal: '75001',
    tarif: 'ENFANTS 5 à 8 ans',
    dateInscription: '2024-01-01',
    statutPaiement: 'payé' as const,
    jour: 'Samedi',
    lieu: 'Châtelet',
    heure: '10h',
  },
  {
    _id: '2',
    nom: 'Martin',
    prenom: 'Marie',
    email: 'marie@example.com',
    telephone: '0123456789',
    dateDeNaissance: '2005-06-15',
    adresse: '2 rue Test',
    ville: 'Paris',
    codePostal: '75002',
    tarif: 'ADOS 10 à 17 ans',
    dateInscription: '2024-01-01',
    statutPaiement: 'en attente' as const,
    jour: 'Samedi',
    lieu: 'Châtelet',
    heure: '10h',
  },
  {
    _id: '3',
    nom: 'Bernard',
    prenom: 'Pierre',
    email: 'pierre@example.com',
    telephone: '0123456789',
    dateDeNaissance: '1995-03-20',
    adresse: '3 rue Test',
    ville: 'Paris',
    codePostal: '75003',
    tarif: 'ADULTES 18 à 20 ans',
    dateInscription: '2024-01-01',
    statutPaiement: 'payé' as const,
    jour: 'Samedi',
    lieu: 'Châtelet',
    heure: '10h',
  },
]

function mockLoadedStudents(students = mockStudents) {
  mockUseSubscriptions.mockReturnValue({
    data: students,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })
  mockUseUniqueTarifs.mockReturnValue({
    data: ['Tarif A', 'Tarif B'],
    isLoading: false,
    error: null,
  })
}

describe('StudentsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSubscriptions.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    })
    mockUseUniqueTarifs.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })
  })

  it('should render loading state initially', () => {
    render(<StudentsPage />)
    expect(screen.getByText('Chargement des élèves...')).toBeInTheDocument()
  })

  it('should render back to dashboard button', async () => {
    mockLoadedStudents()
    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('Retour au Dashboard')).toBeInTheDocument()
    })
  })

  it('should handle search functionality', async () => {
    mockLoadedStudents()
    render(<StudentsPage />)

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Rechercher un élève...')
      fireEvent.change(searchInput, { target: { value: 'Jean' } })
      expect(searchInput).toHaveValue('Jean')
    })
  })

  it('should render students after successful API call', async () => {
    mockLoadedStudents()
    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('Liste des élèves par cours')).toBeInTheDocument()
      expect(screen.getByText(/Enfants \(0-11 ans\)/)).toBeInTheDocument()
      expect(screen.getByText(/Adolescents \(12-17 ans\)/)).toBeInTheDocument()
      expect(screen.getByText(/Adultes \(18\+ ans\)/)).toBeInTheDocument()
    })
  })

  it('should handle API error', async () => {
    mockUseSubscriptions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('API Error'),
      refetch: jest.fn(),
    })

    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des élèves : API Error')).toBeInTheDocument()
    })
  })

  it('should categorize students by age correctly', async () => {
    mockLoadedStudents()
    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('DUPONT')).toBeInTheDocument()
      expect(screen.getByText('jean')).toBeInTheDocument()
      expect(screen.getByText(/Enfants \(0-11 ans\) \(1\)/)).toBeInTheDocument()
      expect(screen.getByText(/Adolescents \(12-17 ans\) \(1\)/)).toBeInTheDocument()
      expect(screen.getByText(/Adultes \(18\+ ans\) \(1\)/)).toBeInTheDocument()
    })
  })

  it('should handle invalid date of birth', async () => {
    mockLoadedStudents([
      {
        _id: '1',
        nom: 'Test',
        prenom: 'Student',
        email: 'test@example.com',
        telephone: '0123456789',
        dateDeNaissance: '+042835-12-31T23:00:00.000Z',
        adresse: '1 rue Test',
        ville: 'Paris',
        codePostal: '75001',
        tarif: 'ENFANTS 5 à 8 ans',
        dateInscription: '2024-01-01',
        statutPaiement: 'payé' as const,
        jour: 'Samedi',
        lieu: 'Châtelet',
        heure: '10h',
      },
    ])

    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('TEST')).toBeInTheDocument()
      expect(screen.getByText('student')).toBeInTheDocument()
    })
  })

  it('should prioritize tarif over calculated age', async () => {
    mockLoadedStudents([
      {
        _id: '1',
        nom: 'Test',
        prenom: 'Student',
        email: 'test@example.com',
        telephone: '0123456789',
        dateDeNaissance: '1990-01-01',
        adresse: '1 rue Test',
        ville: 'Paris',
        codePostal: '75001',
        tarif: 'ENFANTS 5 à 8 ans',
        dateInscription: '2024-01-01',
        statutPaiement: 'payé' as const,
        jour: 'Samedi',
        lieu: 'Châtelet',
        heure: '10h',
      },
    ])

    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('TEST')).toBeInTheDocument()
      expect(screen.getByText('student')).toBeInTheDocument()
    })
  })

  it('should handle empty data', async () => {
    mockLoadedStudents([])
    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('Aucun élève trouvé')).toBeInTheDocument()
    })
  })

  it('should switch between tabs', async () => {
    mockLoadedStudents()
    render(<StudentsPage />)

    await waitFor(() => {
      const enfantsTab = screen.getByText(/Enfants \(0-11 ans\)/)
      fireEvent.click(enfantsTab)
      expect(enfantsTab).toBeInTheDocument()
    })
  })

  it('should handle HTTP error response', async () => {
    mockUseSubscriptions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('HTTP 500: Internal Server Error'),
      refetch: jest.fn(),
    })

    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Erreur lors du chargement des élèves/)).toBeInTheDocument()
    })
  })
})
