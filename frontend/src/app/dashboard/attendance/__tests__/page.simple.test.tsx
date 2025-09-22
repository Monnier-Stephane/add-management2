import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import AttendancePage from '../page'

// Mock fetch
global.fetch = jest.fn()

const mockSubscriptions = [
  {
    _id: '1',
    nom: 'Dupont',
    prenom: 'Jean',
    tarif: 'LUNDI 19h30 Bercy ADULTES'
  },
  {
    _id: '2',
    nom: 'Martin',
    prenom: 'Marie',
    tarif: 'MERCREDI 12h15 Paris Châtelet ENFANTS'
  }
]

describe('AttendancePage - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should render loading state initially', () => {
    render(<AttendancePage />)
    
    expect(screen.getByText('Chargement...')).toBeInTheDocument()
  })

  it('should render back to dashboard button', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubscriptions)
    })

    render(<AttendancePage />)

    await waitFor(() => {
      expect(screen.getByText('Retour au Dashboard')).toBeInTheDocument()
    })
  })

  it('should handle empty data', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    render(<AttendancePage />)

    await waitFor(() => {
      expect(screen.getByText('Feuilles d\'appel')).toBeInTheDocument()
    })
  })

  it('should render courses after successful API call', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubscriptions)
    })

    render(<AttendancePage />)

    await waitFor(() => {
      expect(screen.getByText('Feuilles d\'appel')).toBeInTheDocument()
    })

    // Check if tabs are rendered
    expect(screen.getByText('Lundi')).toBeInTheDocument()
    expect(screen.getByText('Mercredi')).toBeInTheDocument()
  })

  it('should handle API error', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    render(<AttendancePage />)

    await waitFor(() => {
      expect(screen.getByText('Erreur: API Error')).toBeInTheDocument()
    })
  })

  it('should handle HTTP error response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    })

    render(<AttendancePage />)

    await waitFor(() => {
      expect(screen.getByText('Erreur: Erreur lors du chargement des données')).toBeInTheDocument()
    })
  })

  it('should handle error with unknown error type', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce('Unknown error')

    render(<AttendancePage />)

    await waitFor(() => {
      expect(screen.getByText('Erreur: Erreur inconnue')).toBeInTheDocument()
    })
  })

  it('should handle different subscription types', async () => {
    const complexSubscriptions = [
      {
        _id: '1',
        nom: 'Dupont',
        prenom: 'Jean',
        tarif: 'LUNDI 19h30 Bercy ADULTES'
      },
      {
        _id: '2',
        nom: 'Martin',
        prenom: 'Marie',
        tarif: 'MERCREDI 12h15 Paris Châtelet ENFANTS'
      },
      {
        _id: '3',
        nom: 'Bernard',
        prenom: 'Pierre',
        tarif: 'ADULTES COURS ILLIMITE/SEMAINE'
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(complexSubscriptions)
    })

    render(<AttendancePage />)

    await waitFor(() => {
      expect(screen.getByText('Feuilles d\'appel')).toBeInTheDocument()
    })
  })

  it('should handle subscriptions with missing data', async () => {
    const incompleteSubscriptions = [
      {
        _id: '1',
        nom: 'Dupont',
        prenom: 'Jean',
        tarif: 'LUNDI 19h30 Bercy ADULTES'
      },
      {
        _id: '2',
        nom: '',
        prenom: '',
        tarif: ''
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(incompleteSubscriptions)
    })

    render(<AttendancePage />)

    await waitFor(() => {
      expect(screen.getByText('Feuilles d\'appel')).toBeInTheDocument()
    })
  })
})