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
    telephoneUrgence: '0987654321',
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
    data: ['ENFANTS 5 à 8 ans', 'ADOS 10 à 17 ans'],
    isLoading: false,
    error: null,
  })
}

describe('StudentsPage - Comprehensive Tests', () => {
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

  it('should render students list', async () => {
    mockLoadedStudents()
    render(<StudentsPage />)
    await waitFor(() => {
      expect(screen.getByText('DUPONT')).toBeInTheDocument()
      expect(screen.getByText('jean')).toBeInTheDocument()
      expect(screen.getByText(/Adolescents \(12-17 ans\) \(1\)/)).toBeInTheDocument()
    })
  })

  it('should switch between tabs', async () => {
    mockLoadedStudents()
    render(<StudentsPage />)
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Enfants \(0-11 ans\)/))
      expect(screen.getByText(/Enfants \(0-11 ans\)/)).toBeInTheDocument()
    })
  })

  it('should handle HTTP error response', async () => {
    mockUseSubscriptions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('HTTP 500'),
      refetch: jest.fn(),
    })
    render(<StudentsPage />)
    await waitFor(() => {
      expect(screen.getByText(/Erreur lors du chargement des élèves/)).toBeInTheDocument()
    })
  })

  it('should handle students with missing optional data', async () => {
    mockLoadedStudents([
      {
        _id: '1',
        nom: 'Test',
        prenom: 'Student',
        email: '',
        telephone: '',
        dateDeNaissance: '2010-01-01',
        adresse: '',
        ville: '',
        codePostal: '',
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

  it('should handle unknown error type', async () => {
    mockUseSubscriptions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Erreur inconnue'),
      refetch: jest.fn(),
    })
    render(<StudentsPage />)
    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des élèves : Erreur inconnue')).toBeInTheDocument()
    })
  })
})
