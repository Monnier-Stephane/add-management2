import React from 'react'
import { render, screen } from '@testing-library/react'
import { CourseCard } from '../CourseCard'

const mockCourse = {
  id: 'test-course',
  nom: 'Test Course',
  jour: 'Lundi',
  heure: '19h30',
  lieu: 'Test Location',
  coach: 'Test Coach',
  eleves: []
}

const mockProps = {
  course: mockCourse,
  onPresenceChange: jest.fn(),
  onRemoveTemporaryStudent: jest.fn(),
  onAddTemporaryStudent: jest.fn(),
  onSaveAttendance: jest.fn()
}

describe('CourseCard - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render course information', () => {
    render(<CourseCard {...mockProps} />)
    
    expect(screen.getByText('Test Course')).toBeInTheDocument()
    expect(screen.getByText('Test Location')).toBeInTheDocument()
    expect(screen.getByText('Test Coach')).toBeInTheDocument()
    expect(screen.getByText('0 élèves')).toBeInTheDocument()
  })

  it('should render without crashing', () => {
    render(<CourseCard {...mockProps} />)
    
    expect(screen.getByText('Test Course')).toBeInTheDocument()
  })

  it('should show presence count', () => {
    render(<CourseCard {...mockProps} />)
    
    expect(screen.getByText('0 / 0 présents')).toBeInTheDocument()
  })
})
