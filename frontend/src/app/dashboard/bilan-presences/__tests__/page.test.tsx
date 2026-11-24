import '@/test-utils/setupDashboardTests'
import React from 'react'
import { renderWithProviders as render, screen } from '@/test-utils/renderWithProviders'
import userEvent from '@testing-library/user-event'
import { mockUseSubscriptions } from '@/test-utils/setupDashboardTests'
import { useAuth } from '@/lib/auth/AuthContext'
import { api } from '@/lib/api/api'
import BilanPresencesPage from '../page'

jest.mock('@/lib/api/api', () => ({
  api: { get: jest.fn() },
}))

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({
    data,
    label,
  }: {
    data: { name: string; value: number }[]
    label?: (part: {
      cx: number
      cy: number
      midAngle: number
      innerRadius: number
      outerRadius: number
      value: number
    }) => React.ReactNode
  }) => (
    <div>
      {typeof label === 'function'
        ? data.map((part) => (
            <span key={part.name}>
              {label({ cx: 40, cy: 40, midAngle: 20, innerRadius: 0, outerRadius: 80, value: part.value })}
            </span>
          ))
        : null}
    </div>
  ),
  Cell: () => null,
  Tooltip: () => null,
  Legend: () => null,
}))

const fiches = [
  {
    _id: 'lucie-sans-photo',
    prenom: 'Lucie',
    nom: 'Johann',
    email: 'lucie@example.com',
    tarif: 'enfant',
    sexe: 'fille' as const,
    dateInscription: '2026-09-01',
  },
  {
    _id: 'lucie',
    prenom: 'Lucie',
    nom: 'Johann',
    email: 'lucie@example.com',
    tarif: 'enfant',
    sexe: 'fille' as const,
    dateInscription: '2026-09-01',
    photoUrl: 'https://res.cloudinary.com/demo/image/upload/lucie.jpg',
  },
  {
    _id: 'matteo',
    prenom: 'Matteo',
    nom: "Le Boucher d'Hérouville",
    email: 'matteo@example.com',
    tarif: 'enfant',
    sexe: 'garçon' as const,
    dateInscription: '2026-11-14T10:00:00.000Z',
    photoUrl: 'https://example.com/matteo.jpg',
  },
  {
    _id: 'lea',
    prenom: 'Léa',
    nom: 'Martin',
    email: 'lea@example.com',
    tarif: 'enfant',
    sexe: 'fille' as const,
    dateInscription: '2026-11-14T10:00:00.000Z',
  },
  {
    _id: 'adam',
    prenom: 'Adam',
    nom: 'Ado',
    email: 'adam@example.com',
    tarif: 'enfant',
    sexe: 'garçon' as const,
  },
]

const bilan = {
  feuilles: 4,
  presents: 8,
  eleves: [
    { prenom: 'Lucie', nom: 'Johann', present: true, cours: 'jeudi-18h-2026-11-12.pdf' },
    { prenom: 'Lucie', nom: 'Johann', present: true, cours: 'jeudi-18h-2026-11-12.pdf' },
    { prenom: 'Matteo', nom: 'Le Boucher', present: true, cours: 'jeudi-18h-2026-11-05.pdf', enPlus: true },
    { prenom: 'Matteo', nom: 'Le Boucher', present: true, cours: 'samedi-17h45-2026-11-12.pdf', enPlus: true },
    { prenom: 'Matteo', nom: "Le Boucher d'Hérouville", present: true, cours: 'jeudi-18h-2026-11-19.pdf' },
    { prenom: 'Léa', nom: 'Martin', present: true, cours: 'jeudi-18h-2026-11-12.pdf', enPlus: true },
    { prenom: 'Léa', nom: 'Martin', present: true, cours: 'jeudi-18h-2026-11-19.pdf' },
    { prenom: 'Adam', nom: 'Ado', present: true, cours: 'jeudi-18h-2026-11-12.pdf' },
    { prenom: 'Adam', nom: 'Ado', present: false, cours: 'jeudi-18h-2026-11-19.pdf' },
    { prenom: 'Paul', nom: 'Inconnu', present: true, cours: 'feuille-inconnue.pdf' },
    { prenom: 'Paul', nom: 'Inconnu', present: false, cours: 'feuille-inconnue.pdf' },
    { prenom: 'Paul', nom: 'Inconnu', present: false, cours: 'autre-feuille.pdf' },
  ],
}

describe('Bilan des présences', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({ userRole: 'admin' })
    mockUseSubscriptions.mockReturnValue({
      data: fiches,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })
  })

  it('affiche le camembert et les phrases après le calcul', async () => {
    ;(api.get as jest.Mock).mockResolvedValue(bilan)
    const user = userEvent.setup()
    render(<BilanPresencesPage />)

    await user.click(screen.getByRole('button', { name: 'Calculer' }))

    expect(await screen.findByText('67 %')).toBeInTheDocument()
    expect(screen.getByText('33 %')).toBeInTheDocument()
    expect(screen.getByText("Lucie Johann est venue 2 fois ce mois-ci, elle n'a manqué aucun cours.")).toBeInTheDocument()
    expect(screen.getByText(/Matteo Le Boucher d'Hérouville était présent à 3 cours/)).toBeInTheDocument()
    expect(screen.getByText(/Léa Martin était présente à 2 cours/)).toBeInTheDocument()
    expect(screen.getByText('1 cours sur 2 · 50 % de présence')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Classer les élèves'), 'taux-asc')
    await user.selectOptions(screen.getByLabelText('Classer les élèves'), 'taux-desc')

    await user.click(screen.getByRole('tab', { name: /Élèves à l’unité/ }))
    expect(screen.getByText('Paul Inconnu : 1 fois ce mois-ci, a manqué 2 cours.')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Rechercher un élève'), 'zzzz')
    expect(screen.getByText(/Aucun élève ne correspond/)).toBeInTheDocument()
    await user.clear(screen.getByPlaceholderText('Rechercher un élève'))

    await user.click(screen.getByRole('tab', { name: /Élèves à l’unité/ }))
    await user.click(screen.getByRole('button', { name: /Paul Inconnu/ }))
    expect(screen.getByText('feuille-inconnue')).toBeInTheDocument()
  })

  it('affiche le spinner pendant la lecture des PDF', async () => {
    let finir: (bilan: unknown) => void = () => {}
    ;(api.get as jest.Mock).mockReturnValue(new Promise((resolve) => {
      finir = resolve
    }))
    const user = userEvent.setup()
    render(<BilanPresencesPage />)

    await user.click(screen.getByRole('button', { name: 'Calculer' }))

    expect(screen.getByRole('button', { name: /Lecture des PDF/ })).toBeDisabled()
    expect(screen.getByRole('status', { name: 'Chargement' })).toBeInTheDocument()
    finir(bilan)
  })

  it('affiche l’erreur quand le calcul échoue', async () => {
    ;(api.get as jest.Mock).mockRejectedValue(new Error('PDF illisible'))
    const user = userEvent.setup()
    render(<BilanPresencesPage />)

    await user.click(screen.getByRole('button', { name: 'Calculer' }))

    expect(await screen.findByText('PDF illisible')).toBeInTheDocument()
  })

  it('affiche un message générique si l’erreur n’est pas une Error', async () => {
    ;(api.get as jest.Mock).mockRejectedValue('panne')
    const user = userEvent.setup()
    render(<BilanPresencesPage />)

    await user.click(screen.getByRole('button', { name: 'Calculer' }))

    expect(await screen.findByText('Bilan impossible')).toBeInTheDocument()
  })

  it('refuse l’accès aux non administrateurs', () => {
    ;(useAuth as jest.Mock).mockReturnValue({ userRole: 'coach' })
    render(<BilanPresencesPage />)
    expect(screen.getByText('Accès réservé aux administrateurs.')).toBeInTheDocument()
  })
})
