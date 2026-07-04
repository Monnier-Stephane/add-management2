import '@/test-utils/setupDashboardTests'
import React from 'react'
import { renderWithProviders as render, screen, waitFor, fireEvent } from '@/test-utils/renderWithProviders'
import { mockUseSubscriptions } from '@/test-utils/setupDashboardTests'
import AttendancePage from '../page'

jest.mock('@/components/attendance/CourseCard', () => ({
  CourseCard: ({
    course,
    onPresenceChange,
  }: {
    course: { id: string; nom: string }
    onPresenceChange: (courseId: string, studentId: string, present: boolean) => void
  }) => (
    <div data-testid={`course-${course.id}`}>
      <div>{course.nom}</div>
      <button onClick={() => onPresenceChange(course.id, 'student-1', true)}>Toggle Presence</button>
    </div>
  ),
}))

const mockSubscriptions = [
  { _id: '1', nom: 'Dupont', prenom: 'Jean', tarif: 'LUNDI 19h30 Bercy ADULTES' },
  { _id: '2', nom: 'Martin', prenom: 'Marie', tarif: 'MERCREDI 12h15 Paris Châtelet ENFANTS' },
]

function mockLoadedAttendance(data = mockSubscriptions) {
  mockUseSubscriptions.mockReturnValue({
    data,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })
}

describe('AttendancePage - Comprehensive Tests', () => {
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

  it('should render courses after successful API call', async () => {
    mockLoadedAttendance()
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getByText("Feuilles d'appel")).toBeInTheDocument()
      expect(screen.getByText('Lundi')).toBeInTheDocument()
    })
  })

  it('should handle API error', async () => {
    mockUseSubscriptions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('API Error'),
      refetch: jest.fn(),
    })
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getByText('Erreur: API Error')).toBeInTheDocument()
    })
  })

  it('should handle presence change', async () => {
    mockLoadedAttendance()
    render(<AttendancePage />)
    await waitFor(() => {
      fireEvent.click(screen.getByText('Toggle Presence'))
    })
  })

  it('should handle empty subscriptions', async () => {
    mockLoadedAttendance([])
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getByText("Feuilles d'appel")).toBeInTheDocument()
    })
  })
})
