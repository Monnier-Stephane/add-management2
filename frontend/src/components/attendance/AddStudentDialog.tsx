import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'

interface Course {
  id: string
  nom: string
  jour: string
  heure: string
  lieu: string
  coach: string
}

interface AddStudentDialogProps {
  course: Course
  onAddStudent: (courseId: string, nom: string, prenom: string) => void
}

export const AddStudentDialog = ({ course, onAddStudent }: AddStudentDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [tempStudent, setTempStudent] = useState({ nom: '', prenom: '' })

  const handleAddStudent = () => {
    if (!tempStudent.nom.trim() || !tempStudent.prenom.trim()) {
      alert('Veuillez remplir le nom et le prénom')
      return
    }

    onAddStudent(course.id, tempStudent.nom.trim(), tempStudent.prenom.trim())
    setTempStudent({ nom: '', prenom: '' })
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un élève
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un élève temporaire</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="temp-nom" className="text-sm font-medium">Nom</label>
            <Input
              id="temp-nom"
              value={tempStudent.nom}
              onChange={(e) => setTempStudent(prev => ({ ...prev, nom: e.target.value }))}
              placeholder="Nom de famille"
            />
          </div>
          <div>
            <label htmlFor="temp-prenom" className="text-sm font-medium">Prénom</label>
            <Input
              id="temp-prenom"
              value={tempStudent.prenom}
              onChange={(e) => setTempStudent(prev => ({ ...prev, prenom: e.target.value }))}
              placeholder="Prénom"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleAddStudent}>
              Ajouter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
