import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, MapPin, Users, Download, Eye } from 'lucide-react'
import { StudentItem } from './StudentItem'
import { AddStudentDialog } from './AddStudentDialog'
import { buildAttendancePdf } from './generateAttendancePdf'
import { useState } from 'react'


interface Student {
  id: string
  nom: string
  prenom: string
  present: boolean
  isTemporary?: boolean
  photoUrl?: string
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
  isHighlighted?: boolean
}

export const CourseCard = ({ 
  course, 
  onPresenceChange, 
  onRemoveTemporaryStudent, 
  onAddTemporaryStudent,
  isHighlighted = false 
}: CourseCardProps) => {
  
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  
  const generatePDF = async (action: 'preview' | 'download' = 'download') => {
    if (isGeneratingPDF) return // Éviter les clics multiples
    
    setIsGeneratingPDF(true)
    
    try {
      const doc = await buildAttendancePdf(course)
      const filename = `feuille-appel-${course.nom.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
      
      if (action === 'preview') {
        // Pour la visualisation, utiliser bloburl au lieu de dataurlnewwindow
        const pdfBlob = doc.output('blob')
        const pdfUrl = URL.createObjectURL(pdfBlob)
        
        // Ouvrir dans un nouvel onglet
        const newWindow = window.open(pdfUrl, '_blank')
        if (!newWindow) {
          alert('Veuillez autoriser les popups pour visualiser le PDF')
        }
        
        // Nettoyer l'URL après un délai
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl)
        }, 1000)
      } else {
        // Télécharger directement avec compression
        doc.save(filename)
      }
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }


  return (
    <Card className={`w-full ${isHighlighted ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
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
        <Badge variant="outline" className="shrink-0 whitespace-nowrap">
  {course.eleves.length} élèves
</Badge>
      </div>
    </CardHeader>
    <CardContent className="px-3 sm:px-6">
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
      
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 pt-4 border-t gap-3">
        <div className="text-sm text-gray-600">
          {course.eleves.filter(e => e.present).length} / {course.eleves.length} présents
        </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => generatePDF('preview')} 
              size="sm" 
              variant="outline"
              disabled={isGeneratingPDF}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Eye className="h-4 w-4" />
              {isGeneratingPDF ? 'Génération...' : 'Visualiser'}
            </Button>
            <Button 
              onClick={() => generatePDF('download')} 
              size="sm" 
              disabled={isGeneratingPDF}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Download className="h-4 w-4" />
              {isGeneratingPDF ? 'Génération...' : 'Télécharger'}
            </Button>
          </div>
      </div>
    </CardContent>

  </Card>
)
}