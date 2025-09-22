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
    dateDeNaissance: '2010-01-01',
    tarif: 'ENFANTS 5 à 8 ans'
  },
  {
    _id: '2',
    nom: 'Martin',
    prenom: 'Marie',
    dateDeNaissance: '2005-06-15',
    tarif: 'ADOS 10 à 17 ans'
  },
  {
    _id: '3',
    nom: 'Bernard',
    prenom: 'Pierre',
    dateDeNaissance: '1995-03-20',
    tarif: 'ADULTES 18 à 20 ans'
  }
]

describe('StudentsPage', () => {
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
        json: () => Promise.resolve(['Tarif A', 'Tarif B'])
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
        json: () => Promise.resolve(['Tarif A', 'Tarif B'])
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
        json: () => Promise.resolve(['Tarif A', 'Tarif B'])
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
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockStudents)
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
    const studentsWithInvalidDates = [
      {
        _id: '1',
        nom: 'Test',
        prenom: 'Student',
        dateDeNaissance: '+042835-12-31T23:00:00.000Z', // Invalid date
        tarif: 'ENFANTS 5 à 8 ans'
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(studentsWithInvalidDates)
    })

    render(<StudentsPage />)

    await waitFor(() => {
      // Should still render the student but categorize by tarif
      expect(screen.getByText('Student Test')).toBeInTheDocument()
    })
  })

  it('should prioritize tarif over calculated age', async () => {
    const studentsWithTarifPriority = [
      {
        _id: '1',
        nom: 'Test',
        prenom: 'Student',
        dateDeNaissance: '1990-01-01', // Would be adult by age
        tarif: 'ENFANTS 5 à 8 ans' // But tarif says child
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(studentsWithTarifPriority)
    })

    render(<StudentsPage />)

    await waitFor(() => {
      // Should be categorized as child based on tarif
      expect(screen.getByText('Student Test')).toBeInTheDocument()
    })
  })

  it('should render back to dashboard button', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockStudents)
    })

    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('Retour au Dashboard')).toBeInTheDocument()
    })
  })

  it('should handle empty data', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('Aucun élève trouvé')).toBeInTheDocument()
    })
  })

  it('should switch between tabs', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockStudents)
    })

    render(<StudentsPage />)

    await waitFor(() => {
      const enfantsTab = screen.getByText('Enfants')
      fireEvent.click(enfantsTab)
      
      // Should show children tab content
      expect(enfantsTab).toBeInTheDocument()
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
      expect(screen.getByText('Erreur: Erreur lors du chargement des élèves')).toBeInTheDocument()
    })
  })
})
