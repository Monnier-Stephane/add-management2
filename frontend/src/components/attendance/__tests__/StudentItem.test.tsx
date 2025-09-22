import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { StudentItem } from '../StudentItem'

const mockCourse = {
  id: 'test-course',
  nom: 'Test Course',
  jour: 'Lundi',
  heure: '19h30',
  lieu: 'Test Location',
  coach: 'Test Coach',
  eleves: []
}

const mockStudent = {
  id: 'test-student',
  nom: 'Dupont',
  prenom: 'Jean',
  present: false,
  isTemporary: false
}

const mockProps = {
  eleve: mockStudent,
  course: mockCourse,
  onPresenceChange: jest.fn(),
  onRemoveTemporaryStudent: jest.fn()
}

describe('StudentItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render student information', () => {
    render(<StudentItem {...mockProps} />)
    
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    expect(screen.getByText('Absent')).toBeInTheDocument()
  })

  it('should handle presence change', () => {
    render(<StudentItem {...mockProps} />)
    
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    
    expect(mockProps.onPresenceChange).toHaveBeenCalledWith('test-course', 'test-student', true)
  })

  it('should show temporary student styling', () => {
    const temporaryStudent = { ...mockStudent, isTemporary: true }
    const props = { ...mockProps, eleve: temporaryStudent }
    
    render(<StudentItem {...props} />)
    
    expect(screen.getByText('(élève en +)')).toBeInTheDocument()
  })

  it('should show remove button for temporary students', () => {
    const temporaryStudent = { ...mockStudent, isTemporary: true }
    const props = { ...mockProps, eleve: temporaryStudent }
    
    render(<StudentItem {...props} />)
    
    const removeButton = screen.getByRole('button')
    expect(removeButton).toBeInTheDocument()
    
    fireEvent.click(removeButton)
    expect(mockProps.onRemoveTemporaryStudent).toHaveBeenCalledWith('test-course', 'test-student')
  })

  it('should show present status correctly', () => {
    const presentStudent = { ...mockStudent, present: true }
    const props = { ...mockProps, eleve: presentStudent }
    
    render(<StudentItem {...props} />)
    
    expect(screen.getByText('Présent')).toBeInTheDocument()
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('should have correct accessibility attributes', () => {
    render(<StudentItem {...mockProps} />)
    
    const checkbox = screen.getByRole('checkbox')
    const label = screen.getByText('Jean Dupont')
    
    expect(checkbox).toHaveAttribute('id', 'test-course-test-student')
    expect(label).toHaveAttribute('for', 'test-course-test-student')
  })
})
