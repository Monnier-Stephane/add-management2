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
    adresse: '123 Rue Test',
    ville: 'Paris',
    codePostal: '75001',
    tarif: 'ENFANTS 5 à 8 ans',
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
    data: ['ENFANTS 5 à 8 ans'],
    isLoading: false,
    error: null,
  })
}

describe('StudentsPage - Simple Tests', () => {
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
      expect(screen.getByText('DUPONT')).toBeInTheDocument()
      expect(screen.getByText('jean')).toBeInTheDocument()
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
})
