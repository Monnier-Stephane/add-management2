import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface Student {
  id: string
  nom: string
  prenom: string
  present: boolean
  isTemporary?: boolean
}

interface Course {
  id: string
  nom: string
  jour: string
  heure: string
  lieu: string
  coach: string
  eleves: Student[]
}

interface StudentItemProps {
  eleve: Student
  course: Course
  onPresenceChange: (courseId: string, studentId: string, present: boolean) => void
  onRemoveTemporaryStudent: (courseId: string, studentId: string) => void
}

export const StudentItem = ({ 
  eleve, 
  course, 
  onPresenceChange, 
  onRemoveTemporaryStudent 
}: StudentItemProps) => (
  <div 
    key={eleve.id} 
    className={`flex items-center justify-between p-3 border rounded-lg ${
      eleve.isTemporary ? 'bg-orange-50 border-orange-200' : ''
    }`}
  >
    <div className="flex items-center gap-3">
      <Checkbox
        id={`${course.id}-${eleve.id}`}
        checked={eleve.present}
        onCheckedChange={(checked) => 
          onPresenceChange(course.id, eleve.id, checked as boolean)
        }
      />
      <label 
        htmlFor={`${course.id}-${eleve.id}`}
        className="font-medium cursor-pointer"
      >
        {eleve.prenom} {eleve.nom}
        {eleve.isTemporary && (
          <span className="ml-2 text-xs text-orange-600 font-normal">
            (élève en +)
          </span>
        )}
      </label>
    </div>
    <div className="flex items-center gap-2">
      <Badge variant={eleve.present ? "default" : "secondary"}>
        {eleve.present ? "Présent" : "Absent"}
      </Badge>
      {eleve.isTemporary && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemoveTemporaryStudent(course.id, eleve.id)}
          className="text-red-600 hover:text-red-700"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  </div>
)
