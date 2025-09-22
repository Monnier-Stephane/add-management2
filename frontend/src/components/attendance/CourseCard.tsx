import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, MapPin, Users } from 'lucide-react'
import { StudentItem } from './StudentItem'
import { AddStudentDialog } from './AddStudentDialog'

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

interface CourseCardProps {
  course: Course
  onPresenceChange: (courseId: string, studentId: string, present: boolean) => void
  onRemoveTemporaryStudent: (courseId: string, studentId: string) => void
  onAddTemporaryStudent: (courseId: string, nom: string, prenom: string) => void
  onSaveAttendance: (courseId: string) => void
}

export const CourseCard = ({ 
  course, 
  onPresenceChange, 
  onRemoveTemporaryStudent, 
  onAddTemporaryStudent,
  onSaveAttendance 
}: CourseCardProps) => (
  <Card key={course.id} className="mb-4">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {course.nom}
          </CardTitle>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {course.lieu}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {course.coach}
            </div>
          </div>
        </div>
        <Badge variant="outline">
          {course.eleves.length} élèves
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {course.eleves.map(eleve => (
          <StudentItem 
            key={eleve.id} 
            eleve={eleve} 
            course={course}
            onPresenceChange={onPresenceChange}
            onRemoveTemporaryStudent={onRemoveTemporaryStudent}
          />
        ))}
      </div>
      
      {/* Bouton pour ajouter un élève temporaire */}
      <div className="mt-4 pt-4 border-t">
        <AddStudentDialog 
          course={course} 
          onAddStudent={onAddTemporaryStudent}
        />
      </div>
      
      <div className="flex justify-between items-center mt-4 pt-4 border-t">
        <div className="text-sm text-gray-600">
          {course.eleves.filter(e => e.present).length} / {course.eleves.length} présents
        </div>
        <Button onClick={() => onSaveAttendance(course.id)} size="sm">
          Sauvegarder
        </Button>
      </div>
    </CardContent>
  </Card>
)