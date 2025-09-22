import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AddStudentDialog } from '../AddStudentDialog'

const mockCourse = {
  id: 'test-course',
  nom: 'Test Course',
  jour: 'Lundi',
  heure: '19h30',
  lieu: 'Test Location',
  coach: 'Test Coach'
}

const mockProps = {
  course: mockCourse,
  onAddStudent: jest.fn()
}

describe('AddStudentDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render dialog trigger button', () => {
    render(<AddStudentDialog {...mockProps} />)
    
    expect(screen.getByText('Ajouter un élève (élève en +)')).toBeInTheDocument()
  })

  it('should open dialog when trigger is clicked', async () => {
    render(<AddStudentDialog {...mockProps} />)
    
    const triggerButton = screen.getByText('Ajouter un élève (élève en +)')
    fireEvent.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByText('Ajouter un élève temporaire')).toBeInTheDocument()
    })
  })

  it('should handle form input', async () => {
    render(<AddStudentDialog {...mockProps} />)
    
    const triggerButton = screen.getByText('Ajouter un élève (élève en +)')
    fireEvent.click(triggerButton)
    
    await waitFor(() => {
      const nomInput = screen.getByLabelText('Nom')
      const prenomInput = screen.getByLabelText('Prénom')
      
      fireEvent.change(nomInput, { target: { value: 'Dupont' } })
      fireEvent.change(prenomInput, { target: { value: 'Jean' } })
      
      expect(nomInput).toHaveValue('Dupont')
      expect(prenomInput).toHaveValue('Jean')
    })
  })

  it('should call onAddStudent when form is submitted with valid data', async () => {
    render(<AddStudentDialog {...mockProps} />)
    
    const triggerButton = screen.getByText('Ajouter un élève (élève en +)')
    fireEvent.click(triggerButton)
    
    await waitFor(() => {
      const nomInput = screen.getByLabelText('Nom')
      const prenomInput = screen.getByLabelText('Prénom')
      const addButton = screen.getByText('Ajouter')
      
      fireEvent.change(nomInput, { target: { value: 'Dupont' } })
      fireEvent.change(prenomInput, { target: { value: 'Jean' } })
      fireEvent.click(addButton)
      
      expect(mockProps.onAddStudent).toHaveBeenCalledWith('test-course', 'Dupont', 'Jean')
    })
  })

  it('should show alert when form is submitted with empty fields', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    
    render(<AddStudentDialog {...mockProps} />)
    
    const triggerButton = screen.getByText('Ajouter un élève (élève en +)')
    fireEvent.click(triggerButton)
    
    await waitFor(() => {
      const addButton = screen.getByText('Ajouter')
      fireEvent.click(addButton)
      
      expect(alertSpy).toHaveBeenCalledWith('Veuillez remplir le nom et le prénom')
    })
    
    alertSpy.mockRestore()
  })

  it('should close dialog when cancel is clicked', async () => {
    render(<AddStudentDialog {...mockProps} />)
    
    const triggerButton = screen.getByText('Ajouter un élève (élève en +)')
    fireEvent.click(triggerButton)
    
    await waitFor(() => {
      const cancelButton = screen.getByText('Annuler')
      fireEvent.click(cancelButton)
    })
    
    await waitFor(() => {
      expect(screen.queryByText('Ajouter un élève temporaire')).not.toBeInTheDocument()
    })
  })

  it('should reset form after successful submission', async () => {
    render(<AddStudentDialog {...mockProps} />)
    
    const triggerButton = screen.getByText('Ajouter un élève (élève en +)')
    fireEvent.click(triggerButton)
    
    await waitFor(() => {
      const nomInput = screen.getByLabelText('Nom')
      const prenomInput = screen.getByLabelText('Prénom')
      const addButton = screen.getByText('Ajouter')
      
      fireEvent.change(nomInput, { target: { value: 'Dupont' } })
      fireEvent.change(prenomInput, { target: { value: 'Jean' } })
      fireEvent.click(addButton)
    })
    
    // Reopen dialog to check if form is reset
    fireEvent.click(triggerButton)
    
    await waitFor(() => {
      const nomInput = screen.getByLabelText('Nom')
      const prenomInput = screen.getByLabelText('Prénom')
      
      expect(nomInput).toHaveValue('')
      expect(prenomInput).toHaveValue('')
    })
  })
})
