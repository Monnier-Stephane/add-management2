import '@/test-utils/setupDashboardTests'
import React from 'react'
import { renderWithProviders as render, screen, waitFor, fireEvent } from '@/test-utils/renderWithProviders'
import { mockUseSubscriptions, mockUseUniqueTarifs } from '@/test-utils/setupDashboardTests'
import AttendancePage from '../page'

interface MockCourseCardProps {
  course: { id: string; nom: string }
  onPresenceChange: (courseId: string, studentId: string, present: boolean) => void
  onRemoveTemporaryStudent: (courseId: string, studentId: string) => void
  onAddTemporaryStudent: (courseId: string, nom: string, prenom: string) => void
}

jest.mock('@/components/attendance/CourseCard', () => ({
  CourseCard: ({
    course,
    onPresenceChange,
    onRemoveTemporaryStudent,
    onAddTemporaryStudent,
  }: MockCourseCardProps) => (
    <div data-testid={`course-${course.id}`}>
      <div>{course.nom}</div>
      <button onClick={() => onPresenceChange(course.id, 'student-1', true)}>Toggle Presence</button>
      <button onClick={() => onRemoveTemporaryStudent(course.id, 'student-1')}>Remove Student</button>
      <button onClick={() => onAddTemporaryStudent(course.id, 'Dupont', 'Jean')}>Add Student</button>
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

describe('AttendancePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
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

  it('should render courses after successful API call', async () => {
    mockLoadedAttendance()
    render(<AttendancePage />)

    await waitFor(() => {
      expect(screen.getByText("Feuilles d'appel")).toBeInTheDocument()
      expect(screen.getByText('Lundi')).toBeInTheDocument()
      expect(screen.getByText('Mercredi')).toBeInTheDocument()
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

  it('should group courses by day', async () => {
    mockLoadedAttendance()
    render(<AttendancePage />)

    await waitFor(() => {
      expect(screen.getByText('Lundi')).toBeInTheDocument()
      expect(screen.getByText('Mercredi')).toBeInTheDocument()
    })
  })

  it('should handle presence change', async () => {
    mockLoadedAttendance()
    render(<AttendancePage />)

    await waitFor(() => {
      fireEvent.click(screen.getByText('Toggle Presence'))
    })
  })

  it('should handle adding temporary student', async () => {
    mockLoadedAttendance()
    render(<AttendancePage />)

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Student'))
    })
  })

  it('should handle removing temporary student', async () => {
    mockLoadedAttendance()
    render(<AttendancePage />)

    await waitFor(() => {
      fireEvent.click(screen.getByText('Remove Student'))
    })
  })
})
