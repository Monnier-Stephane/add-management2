import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddStudentDialog } from '../AddStudentDialog'

const mockCourse = {
  id: 'test-course',
  nom: 'Test Course',
  jour: 'Lundi',
  heure: '19h30',
  lieu: 'Test Location',
  coach: 'Test Coach',
}

const mockProps = {
  course: mockCourse,
  onAddStudent: jest.fn(),
}

describe('AddStudentDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render dialog trigger button', () => {
    render(<AddStudentDialog {...mockProps} />)
    expect(screen.getByText('Ajouter un élève')).toBeInTheDocument()
  })

  it('should open dialog when trigger is clicked', async () => {
    render(<AddStudentDialog {...mockProps} />)
    fireEvent.click(screen.getByText('Ajouter un élève'))
    expect(screen.getByText('Ajouter un élève temporaire')).toBeInTheDocument()
  })

  it('should handle form input', () => {
    render(<AddStudentDialog {...mockProps} />)
    fireEvent.click(screen.getByText('Ajouter un élève'))

    const nomInput = screen.getByLabelText('Nom')
    const prenomInput = screen.getByLabelText('Prénom')

    fireEvent.change(nomInput, { target: { value: 'Dupont' } })
    fireEvent.change(prenomInput, { target: { value: 'Jean' } })

    expect(nomInput).toHaveValue('Dupont')
    expect(prenomInput).toHaveValue('Jean')
  })

  it('should call onAddStudent when form is submitted with valid data', () => {
    render(<AddStudentDialog {...mockProps} />)
    fireEvent.click(screen.getByText('Ajouter un élève'))

    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Dupont' } })
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Jean' } })
    fireEvent.click(screen.getByText('Ajouter'))

    expect(mockProps.onAddStudent).toHaveBeenCalledWith('test-course', 'Dupont', 'Jean')
  })

  it('should show alert when form is submitted with empty fields', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    render(<AddStudentDialog {...mockProps} />)
    fireEvent.click(screen.getByText('Ajouter un élève'))
    fireEvent.click(screen.getByText('Ajouter'))
    expect(alertSpy).toHaveBeenCalledWith('Veuillez remplir le nom et le prénom')
    alertSpy.mockRestore()
  })

  it('should close dialog when cancel is clicked', () => {
    render(<AddStudentDialog {...mockProps} />)
    fireEvent.click(screen.getByText('Ajouter un élève'))
    fireEvent.click(screen.getByText('Annuler'))
    expect(screen.queryByText('Ajouter un élève temporaire')).not.toBeInTheDocument()
  })

  it('should reset form after successful submission', () => {
    render(<AddStudentDialog {...mockProps} />)
    fireEvent.click(screen.getByText('Ajouter un élève'))
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Dupont' } })
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Jean' } })
    fireEvent.click(screen.getByText('Ajouter'))

    fireEvent.click(screen.getByText('Ajouter un élève'))
    expect(screen.getByLabelText('Nom')).toHaveValue('')
    expect(screen.getByLabelText('Prénom')).toHaveValue('')
  })
})
