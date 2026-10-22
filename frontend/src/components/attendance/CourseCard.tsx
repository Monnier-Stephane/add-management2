import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, MapPin, Users, Download } from 'lucide-react'
import { StudentItem } from './StudentItem'
import { AddStudentDialog } from './AddStudentDialog'
import { buildAttendancePdf } from './generateAttendancePdf'
import { useState, useEffect } from 'react'
import { auth } from '@/lib/auth/firebase'
import type { StudentCategory } from '@/lib/utils/studentCategory'


interface Student {
  id: string
  nom: string
  prenom: string
  present: boolean
  isTemporary?: boolean
  photoUrl?: string
  categorie?: StudentCategory
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
  tousLesCours?: { id: string; nom: string; eleves: { id: string; nom: string; prenom: string }[] }[]
}

export const CourseCard = ({ 
  course, 
  onPresenceChange, 
  onRemoveTemporaryStudent, 
  onAddTemporaryStudent,
  isHighlighted = false,
  tousLesCours = [],
}: CourseCardProps) => {
  
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [recherche, setRecherche] = useState('')

  const [readyPdf, setReadyPdf] = useState<{ blob: Blob; filename: string } | null>(null)

useEffect(() => {
  let cancelled = false
  setReadyPdf(null)

  buildAttendancePdf(course)
    .then((doc) => {
      if (cancelled) return
      const filename = `feuille-appel-${course.nom.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
      setReadyPdf({ blob: doc.output('blob'), filename })
    })
    .catch((error) => {
      console.error('Erreur lors de la préparation du PDF:', error)
    })

  return () => {
    cancelled = true
  }
}, [course])
  
const generatePDF = async () => {
  if (!readyPdf || isGeneratingPDF) return

  const { blob, filename } = readyPdf
  const file = new File([blob], filename, { type: 'application/pdf' })
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent)

  try {
    if (
      isIos &&
      typeof navigator.share === 'function' &&
      navigator.canShare?.({ files: [file] })
    ) {
      await navigator.share({ files: [file], title: course.nom })
    } else {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return
    console.error('Erreur lors de la remise du PDF:', error)
    alert('Erreur lors de la génération du PDF. Veuillez réessayer.')
    return
  }

  setIsGeneratingPDF(true)
  try {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ??
      'http://localhost:3001'
    const token = await auth.currentUser?.getIdToken()
    if (!token) {
      throw new Error('Vous devez être connecté pour archiver le PDF')
    }

    const courseDate = new Date().toISOString().slice(0, 10)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('courseId', course.id)
    formData.append('courseDate', courseDate)

    const response = await fetch(`${apiBase}/subscriptions/attendance-pdf`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || 'Archive Cloudinary impossible')
    }
  } catch (archiveError) {
    console.error('Archive du PDF impossible:', archiveError)
    alert('PDF téléchargé, mais l’archive n’a pas pu être enregistrée.')
  } finally {
    setIsGeneratingPDF(false)
  }
}

  const fold = (value: string) =>
    value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const terme = fold(recherche.trim())
  const correspond = (eleve: { nom: string; prenom: string }) =>
    fold(eleve.prenom).includes(terme) || fold(eleve.nom).includes(terme)

  const elevesVisibles = terme.length < 2 ? course.eleves : course.eleves.filter(correspond)

  const ailleursParEleve = new Map<string, { id: string; prenom: string; nom: string; cours: string[] }>()
  if (terme.length >= 2 && elevesVisibles.length === 0) {
    for (const autre of tousLesCours) {
      if (autre.id === course.id) continue
      for (const eleve of autre.eleves) {
        if (!correspond(eleve)) continue
        const deja = ailleursParEleve.get(eleve.id)
        if (deja) {
          if (!deja.cours.includes(autre.nom)) deja.cours.push(autre.nom)
        } else {
          ailleursParEleve.set(eleve.id, {
            id: eleve.id,
            prenom: eleve.prenom,
            nom: eleve.nom,
            cours: [autre.nom],
          })
        }
      }
    }
  }
  const ailleurs = Array.from(ailleursParEleve.values())

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
      <div className="sticky top-14 z-20 -mx-3 mb-4 bg-white px-3 py-2 sm:-mx-6 sm:px-6">
        <input
          type="search"
          value={recherche}
          onChange={(event) => setRecherche(event.target.value)}
          placeholder="Rechercher un élève"
          className="w-full rounded px-3 py-2 text-sm"
          style={{ border: '1px solid #6b7280' }}
        />

        {terme.length >= 2 && elevesVisibles.length === 0 && (
          <div className="mt-2 space-y-2 text-sm text-gray-700">
            {ailleurs.length === 0 ? (
              <p>Aucun élève ne correspond à « {recherche.trim()} ».</p>
            ) : (
              ailleurs.map((eleve) => (
                <p key={eleve.id}>
                  {eleve.prenom} {eleve.nom} n&apos;est pas dans ce cours. Inscrit à : {eleve.cours.join(', ')}.
                </p>
              ))
            )}
          </div>
        )}
      </div>

    <div className="space-y-3">
  {elevesVisibles.map((eleve, index) => {
    const sectionKey = eleve.isTemporary
      ? 'extra'
      : (eleve.categorie ?? 'enfants')
    const previous = elevesVisibles[index - 1]
    const previousKey = previous
      ? previous.isTemporary
        ? 'extra'
        : (previous.categorie ?? 'enfants')
      : null
    const showHeader = sectionKey !== previousKey

    const sectionLabel =
      sectionKey === 'adolescents'
        ? 'Adolescents'
        : sectionKey === 'adultes'
          ? 'Adultes'
          : sectionKey === 'extra'
            ? 'Élèves en +'
            : 'Enfants'

    const sectionClass =
      sectionKey === 'adolescents'
        ? 'text-sky-700'
        : sectionKey === 'adultes'
          ? 'text-purple-700'
          : sectionKey === 'extra'
            ? 'text-orange-700'
            : 'text-gray-500'

    return (
      <div key={eleve.id}>
        {showHeader && (
          <p className={`mb-1.5 text-xs font-semibold uppercase tracking-wide ${sectionClass}`}>
            {sectionLabel}
          </p>
        )}
        <StudentItem
          eleve={eleve}
          course={course}
          onPresenceChange={onPresenceChange}
          onRemoveTemporaryStudent={onRemoveTemporaryStudent}
        />
      </div>
    )
  })}
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
              onClick={() => generatePDF()} 
              size="sm" 
              disabled={!readyPdf ||isGeneratingPDF}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Download className="h-4 w-4" />
              {!readyPdf ? 'Préparation...' : 'Télécharger'}
            </Button>
          </div>
      </div>
    </CardContent>

  </Card>
)
}