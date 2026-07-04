import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { CourseCard } from '../CourseCard'

const mockCourse = {
  id: 'test-course',
  nom: 'Test Course',
  jour: 'Lundi',
  heure: '19h30',
  lieu: 'Test Location',
  coach: 'Test Coach',
  eleves: [
    {
      id: 'student-1',
      nom: 'Dupont',
      prenom: 'Jean',
      present: false,
      isTemporary: false,
    },
    {
      id: 'student-2',
      nom: 'Martin',
      prenom: 'Marie',
      present: true,
      isTemporary: true,
    },
  ],
}

const mockProps = {
  course: mockCourse,
  onPresenceChange: jest.fn(),
  onRemoveTemporaryStudent: jest.fn(),
  onAddTemporaryStudent: jest.fn(),
}

describe('CourseCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render course information', () => {
    render(<CourseCard {...mockProps} />)
    expect(screen.getByText('Test Course')).toBeInTheDocument()
    expect(screen.getByText('Test Location')).toBeInTheDocument()
    expect(screen.getByText('Test Coach')).toBeInTheDocument()
    expect(screen.getByText('2 élèves')).toBeInTheDocument()
  })

  it('should render students list', () => {
    render(<CourseCard {...mockProps} />)
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    expect(screen.getByText('Marie Martin')).toBeInTheDocument()
  })

  it('should show presence count', () => {
    render(<CourseCard {...mockProps} />)
    expect(screen.getByText('1 / 2 présents')).toBeInTheDocument()
  })

  it('should handle presence change', () => {
    render(<CourseCard {...mockProps} />)
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    expect(mockProps.onPresenceChange).toHaveBeenCalledWith('test-course', 'student-1', true)
  })

  it('should handle temporary student removal', () => {
    render(<CourseCard {...mockProps} />)
    const removeButtons = screen.getAllByRole('button')
    const removeButton = removeButtons.find((button) => button.className.includes('text-red-600'))
    fireEvent.click(removeButton!)
    expect(mockProps.onRemoveTemporaryStudent).toHaveBeenCalledWith('test-course', 'student-2')
  })

  it('should handle adding temporary student', () => {
    render(<CourseCard {...mockProps} />)
    fireEvent.click(screen.getByText('Ajouter un élève'))
    expect(screen.getByText('Ajouter un élève temporaire')).toBeInTheDocument()
  })

  it('should render PDF action buttons', () => {
    render(<CourseCard {...mockProps} />)
    expect(screen.getByText('Visualiser')).toBeInTheDocument()
    expect(screen.getByText('Télécharger')).toBeInTheDocument()
  })

  it('should handle empty students list', () => {
    const props = { ...mockProps, course: { ...mockCourse, eleves: [] } }
    render(<CourseCard {...props} />)
    expect(screen.getByText('0 élèves')).toBeInTheDocument()
    expect(screen.getByText('0 / 0 présents')).toBeInTheDocument()
  })

  it('should show temporary student styling', () => {
    render(<CourseCard {...mockProps} />)
    expect(screen.getByText('(élève en +)')).toBeInTheDocument()
  })
})
