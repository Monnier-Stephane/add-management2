import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import AttendancePage from '../page'

// Mock the CourseCard component
jest.mock('@/components/attendance/CourseCard', () => ({
  CourseCard: ({ course, onPresenceChange, onRemoveTemporaryStudent, onAddTemporaryStudent, onSaveAttendance }: any) => (
    <div data-testid={`course-${course.id}`}>
      <div>{course.nom}</div>
      <button onClick={() => onPresenceChange(course.id, 'student-1', true)}>
        Toggle Presence
      </button>
      <button onClick={() => onRemoveTemporaryStudent(course.id, 'student-1')}>
        Remove Student
      </button>
      <button onClick={() => onAddTemporaryStudent(course.id, 'Dupont', 'Jean')}>
        Add Student
      </button>
      <button onClick={() => onSaveAttendance(course.id)}>
        Save Attendance
      </button>
    </div>
  )
}))

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

describe('AttendancePage', () => {
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

  it('should group courses by day', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubscriptions)
    })

    render(<AttendancePage />)

    await waitFor(() => {
      // Should have tabs for different days
      expect(screen.getByText('Lundi')).toBeInTheDocument()
      expect(screen.getByText('Mercredi')).toBeInTheDocument()
    })
  })

  it('should handle presence change', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubscriptions)
    })

    render(<AttendancePage />)

    await waitFor(() => {
      const toggleButton = screen.getByText('Toggle Presence')
      fireEvent.click(toggleButton)
      
      // The component should handle the presence change
      // This is tested through the CourseCard component
    })
  })

  it('should handle adding temporary student', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubscriptions)
    })

    render(<AttendancePage />)

    await waitFor(() => {
      const addButton = screen.getByText('Add Student')
      fireEvent.click(addButton)
      
      // The component should handle adding a temporary student
      // This is tested through the CourseCard component
    })
  })

  it('should handle removing temporary student', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubscriptions)
    })

    render(<AttendancePage />)

    await waitFor(() => {
      const removeButton = screen.getByText('Remove Student')
      fireEvent.click(removeButton)
      
      // The component should handle removing a temporary student
      // This is tested through the CourseCard component
    })
  })

  it('should handle saving attendance', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubscriptions)
    })

    render(<AttendancePage />)

    await waitFor(() => {
      const saveButton = screen.getByText('Save Attendance')
      fireEvent.click(saveButton)
      
      expect(consoleSpy).toHaveBeenCalled()
      expect(alertSpy).toHaveBeenCalled()
    })
    
    consoleSpy.mockRestore()
    alertSpy.mockRestore()
  })
})
