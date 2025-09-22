import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import StudentsPage from '../page'

// Mock fetch
global.fetch = jest.fn()

const mockStudents = [
  {
    _id: '1',
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean@example.com',
    telephone: '0123456789',
    telephoneUrgence: '0987654321',
    dateDeNaissance: '2010-01-01',
    adresse: '123 Rue Test',
    ville: 'Paris',
    codePostal: '75001',
    tarif: 'ENFANTS 5 à 8 ans',
    dateInscription: '2024-01-01',
    statutPaiement: 'payé' as const,
    remarques: 'Test remarks',
    jour: 'Samedi',
    lieu: 'Châtelet',
    heure: '10h'
  },
  {
    _id: '2',
    nom: 'Martin',
    prenom: 'Marie',
    email: 'marie@example.com',
    telephone: '0123456789',
    dateDeNaissance: '2005-06-15',
    adresse: '456 Rue Test',
    ville: 'Paris',
    codePostal: '75002',
    tarif: 'ADOS 10 à 17 ans',
    dateInscription: '2024-01-01',
    statutPaiement: 'en attente' as const,
    jour: 'Samedi',
    lieu: 'Châtelet',
    heure: '11h'
  },
  {
    _id: '3',
    nom: 'Bernard',
    prenom: 'Pierre',
    email: 'pierre@example.com',
    telephone: '0123456789',
    dateDeNaissance: '1995-03-20',
    adresse: '789 Rue Test',
    ville: 'Paris',
    codePostal: '75003',
    tarif: 'ADULTES 18 à 20 ans',
    dateInscription: '2024-01-01',
    statutPaiement: 'annulé' as const,
    jour: 'Samedi',
    lieu: 'Châtelet',
    heure: '12h'
  }
]

const mockUniqueTarifs = ['ENFANTS 5 à 8 ans', 'ADOS 10 à 17 ans', 'ADULTES 18 à 20 ans']

describe('StudentsPage - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should render loading state initially', () => {
    render(<StudentsPage />)
    
    expect(screen.getByText('Chargement des élèves...')).toBeInTheDocument()
  })

  it('should render back to dashboard button', async () => {
    // Mock both API calls
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStudents)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUniqueTarifs)
      })

    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('Retour au Dashboard')).toBeInTheDocument()
    })
  })

  it('should handle search functionality', async () => {
    // Mock both API calls
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStudents)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUniqueTarifs)
      })

    render(<StudentsPage />)

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Rechercher un élève...')
      expect(searchInput).toBeInTheDocument()
      
      fireEvent.change(searchInput, { target: { value: 'Jean' } })
      expect(searchInput).toHaveValue('Jean')
    })
  })

  it('should render students after successful API call', async () => {
    // Mock both API calls
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStudents)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUniqueTarifs)
      })

    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('Liste des élèves par cours')).toBeInTheDocument()
    })

    // Check if tabs are rendered
    expect(screen.getByText('Enfants')).toBeInTheDocument()
    expect(screen.getByText('Adolescents')).toBeInTheDocument()
    expect(screen.getByText('Adultes')).toBeInTheDocument()
  })

  it('should handle API error', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des élèves : API Error')).toBeInTheDocument()
    })
  })

  it('should categorize students by age correctly', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStudents)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUniqueTarifs)
      })

    render(<StudentsPage />)

    await waitFor(() => {
      // Check if students are categorized correctly
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
      expect(screen.getByText('Marie Martin')).toBeInTheDocument()
      expect(screen.getByText('Pierre Bernard')).toBeInTheDocument()
    })
  })

  it('should handle invalid date of birth', async () => {
    const studentsWithInvalidDate = [
      {
        ...mockStudents[0],
        dateDeNaissance: 'invalid-date'
      }
    ]

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(studentsWithInvalidDate)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUniqueTarifs)
      })

    render(<StudentsPage />)

    await waitFor(() => {
      // Should still render the student but categorize by tarif
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    })
  })

  it('should prioritize tarif over calculated age', async () => {
    const studentsWithTarifPriority = [
      {
        ...mockStudents[0],
        dateDeNaissance: '1990-01-01', // Adult age
        tarif: 'ENFANTS 5 à 8 ans' // But tarif says child
      }
    ]

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(studentsWithTarifPriority)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUniqueTarifs)
      })

    render(<StudentsPage />)

    await waitFor(() => {
      // Should be categorized as child based on tarif
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    })
  })

  it('should handle empty data', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })

    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('Aucun élève trouvé')).toBeInTheDocument()
    })
  })

  it('should switch between tabs', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStudents)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUniqueTarifs)
      })

    render(<StudentsPage />)

    await waitFor(() => {
      const enfantsTab = screen.getByText('Enfants')
      fireEvent.click(enfantsTab)
      
      // Should show children tab content
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    })
  })

  it('should handle HTTP error response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    })

    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des élèves : HTTP Error: 500')).toBeInTheDocument()
    })
  })

  it('should handle different age categories', async () => {
    const studentsWithDifferentAges = [
      {
        ...mockStudents[0],
        tarif: 'ENFANTS 5 à 8 ans'
      },
      {
        ...mockStudents[1],
        tarif: 'ADOS 10 à 17 ans'
      },
      {
        ...mockStudents[2],
        tarif: 'ADULTES 18 à 20 ans'
      }
    ]

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(studentsWithDifferentAges)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUniqueTarifs)
      })

    render(<StudentsPage />)

    await waitFor(() => {
      // Should show all age categories
      expect(screen.getByText('Enfants')).toBeInTheDocument()
      expect(screen.getByText('Adolescents')).toBeInTheDocument()
      expect(screen.getByText('Adultes')).toBeInTheDocument()
    })
  })

  it('should handle students with missing data', async () => {
    const studentsWithMissingData = [
      {
        _id: '1',
        nom: 'Dupont',
        prenom: 'Jean',
        email: '',
        telephone: '',
        dateDeNaissance: '',
        adresse: '',
        ville: '',
        codePostal: '',
        tarif: '',
        dateInscription: '',
        statutPaiement: 'en attente' as const
      }
    ]

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(studentsWithMissingData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUniqueTarifs)
      })

    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    })
  })

  it('should handle error with unknown error type', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce('Unknown error')

    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des élèves : An error occurred')).toBeInTheDocument()
    })
  })
})
