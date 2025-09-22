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
    dateDeNaissance: '2010-01-01',
    adresse: '123 Rue Test',
    ville: 'Paris',
    codePostal: '75001',
    tarif: 'ENFANTS 5 à 8 ans',
    dateInscription: '2024-01-01',
    statutPaiement: 'payé' as const,
    jour: 'Samedi',
    lieu: 'Châtelet',
    heure: '10h'
  }
]

const mockUniqueTarifs = ['ENFANTS 5 à 8 ans', 'ADOS 10 à 17 ans', 'ADULTES 18 à 20 ans']

describe('StudentsPage - Simple Tests', () => {
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
  })

  it('should handle API error', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des élèves : API Error')).toBeInTheDocument()
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

  it('should handle error with unknown error type', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce('Unknown error')

    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des élèves : An error occurred')).toBeInTheDocument()
    })
  })

  it('should handle different subscription types', async () => {
    const complexStudents = [
      {
        ...mockStudents[0],
        tarif: 'ENFANTS 5 à 8 ans'
      }
    ]

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(complexStudents)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUniqueTarifs)
      })

    render(<StudentsPage />)

    await waitFor(() => {
      expect(screen.getByText('Liste des élèves par cours')).toBeInTheDocument()
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
      expect(screen.getByText('Liste des élèves par cours')).toBeInTheDocument()
    })
  })
})