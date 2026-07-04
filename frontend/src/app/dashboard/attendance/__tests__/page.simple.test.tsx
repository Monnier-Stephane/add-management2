import '@/test-utils/setupDashboardTests'
import React from 'react'
import { renderWithProviders as render, screen, waitFor } from '@/test-utils/renderWithProviders'
import { mockUseSubscriptions } from '@/test-utils/setupDashboardTests'
import AttendancePage from '../page'

jest.mock('@/components/attendance/CourseCard', () => ({
  CourseCard: ({ course }: { course: { id: string; nom: string } }) => (
    <div data-testid={`course-${course.id}`}>{course.nom}</div>
  ),
}))

const mockSubscriptions = [
  { _id: '1', nom: 'Dupont', prenom: 'Jean', tarif: 'LUNDI 19h30 Bercy ADULTES' },
]

function mockLoadedAttendance(data = mockSubscriptions) {
  mockUseSubscriptions.mockReturnValue({
    data,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })
}

describe('AttendancePage - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockUseSubscriptions.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    })
  })

  it('should render loading state initially', () => {
    render(<AttendancePage />)
    expect(screen.getByText('Chargement...')).toBeInTheDocument()
  })

  it('should render back to dashboard button', async () => {
    mockLoadedAttendance()
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getByText('Retour au Dashboard')).toBeInTheDocument()
    })
  })

  it('should handle empty data', async () => {
    mockLoadedAttendance([])
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getByText("Feuilles d'appel")).toBeInTheDocument()
    })
  })
})
