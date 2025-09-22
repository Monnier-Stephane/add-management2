'use client'
import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'
import Link from 'next/link'
import { CourseCard } from '@/components/attendance/CourseCard'

interface Student {
  id: string
  nom: string
  prenom: string
  present: boolean
  isTemporary?: boolean
}

interface Subscription {
  _id: string
  nom: string
  prenom: string
  tarif: string
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

// Structure des cours basée sur les données MongoDB
const coursesStructure = [
  {
    id: "lundi-bercy",
    nom: "Cours Lundi 19h30",
    jour: "Lundi",
    heure: "19h30",
    lieu: "Paris Bercy",
    coach: "Coach Bercy"
  },
  {
    id: "mercredi-12h15",
    nom: "Cours Mercredi 12h15",
    jour: "Mercredi", 
    heure: "12h15",
    lieu: "Paris Châtelet",
    coach: "Coach Châtelet"
  },
  {
    id: "mercredi-16h15",
    nom: "Cours Mercredi 16h15",
    jour: "Mercredi",
    heure: "16h15", 
    lieu: "Paris Châtelet",
    coach: "Coach Châtelet"
  },
  {
    id: "jeudi-18h",
    nom: "Cours Jeudi 18h",
    jour: "Jeudi",
    heure: "18h00",
    lieu: "Paris Châtelet", 
    coach: "Coach Châtelet"
  },
  {
    id: "jeudi-19h30",
    nom: "Cours Jeudi 19h30",
    jour: "Jeudi",
    heure: "19h30",
    lieu: "Paris Châtelet",
    coach: "Coach Châtelet"
  },
  {
    id: "samedi-10h",
    nom: "Cours Samedi 10h",
    jour: "Samedi",
    heure: "10h00",
    lieu: "Paris Châtelet",
    coach: "Coach Châtelet"
  },
  {
    id: "samedi-11h15",
    nom: "Cours Samedi 11h15", 
    jour: "Samedi",
    heure: "11h15",
    lieu: "Paris Châtelet",
    coach: "Coach Châtelet"
  },
  {
    id: "samedi-12h15",
    nom: "Cours Samedi 12h15",
    jour: "Samedi", 
    heure: "12h15",
    lieu: "Paris Châtelet",
    coach: "Coach Châtelet"
  },
  {
    id: "samedi-16h30",
    nom: "Cours Samedi 16h30",
    jour: "Samedi",
    heure: "16h30",
    lieu: "Choisy le Roi",
    coach: "Coach Choisy"
  },
  {
    id: "samedi-17h45",
    nom: "Cours Samedi 17h45",
    jour: "Samedi",
    heure: "17h45", 
    lieu: "Choisy le Roi",
    coach: "Coach Choisy"
  },
  {
    id: "dimanche-10h",
    nom: "Cours Dimanche 10h",
    jour: "Dimanche",
    heure: "10h00",
    lieu: "Choisy le Roi",
    coach: "Coach Choisy"
  },
  {
    id: "dimanche-11h30",
    nom: "Cours Dimanche 11h30",
    jour: "Dimanche",
    heure: "11h30",
    lieu: "Choisy le Roi", 
    coach: "Coach Choisy"
  }
]

// Interface pour le cours
interface CourseData {
  jour: string
  heure: string
  lieu: string
}

// Fonctions utilitaires pour réduire l'imbrication
const hasAdultsInCourse = (course: CourseData, subscriptions: Subscription[]): boolean => {
  return subscriptions.some((sub: Subscription) => {
    const tarif = sub.tarif || ''
    return (tarif.includes('ADULTES') || tarif.includes('JEUNES ADULTES'))
  })
}

const checkTimeMatch = (heure: string, tarif: string): boolean => {
  const timeChecks: Record<string, () => boolean> = {
    '12h15': () => tarif.includes('12h15') || tarif.includes('12H15'),
    '16h15': () => tarif.includes('16h15'),
    '18h00': () => tarif.includes('18h'),
    '19h30': () => tarif.includes('19h30'),
    '10h00': () => tarif.includes('10h') || tarif.includes('Paris châtelet 10h') || tarif.includes('Paris Châtelet 1Oh'),
    '11h15': () => tarif.includes('11h15'),
    '16h30': () => tarif.includes('16h30') && tarif.includes('Choisy'),
    '17h45': () => tarif.includes('17h45'),
    '11h30': () => tarif.includes('11h30')
  }
  
  return timeChecks[heure]?.() || false
}

const checkCourseDayAndTime = (course: CourseData, tarif: string): boolean => {
  const { jour, heure } = course
  
  const dayChecks: Record<string, () => boolean> = {
    'Lundi': () => tarif.includes('LUNDI') && tarif.includes('Bercy'),
    'Mercredi': () => tarif.includes('MERCREDI') && checkTimeMatch(heure, tarif),
    'Jeudi': () => tarif.includes('JEUDI') && checkTimeMatch(heure, tarif),
    'Samedi': () => tarif.includes('SAMEDI') && checkTimeMatch(heure, tarif),
    'Dimanche': () => tarif.includes('DIMANCHE') && checkTimeMatch(heure, tarif)
  }
  
  return dayChecks[jour]?.() || false
}

const isUnlimitedOr2Courses = (tarif: string): boolean => {
  return tarif.includes('ADULTES COURS ILLIMITE/SEMAINE') || tarif.includes('ADULTES 2 COURS/SEMAINE')
}

const filterStudentsForCourse = (course: CourseData, subscriptions: Subscription[]): Student[] => {
  const courseHasAdults = hasAdultsInCourse(course, subscriptions)
  
  const students = subscriptions.filter((sub: Subscription) => {
    const tarif = sub.tarif || ''
    const isUnlimited = isUnlimitedOr2Courses(tarif)
    
    // Pour les élèves illimité, ils peuvent aller à tous les cours adultes
    if (isUnlimited && courseHasAdults) {
      return true
    }
    
    // Pour les autres élèves, vérifier la correspondance jour/heure
    return checkCourseDayAndTime(course, tarif)
  })
  
  return students.map((sub: Subscription, index: number) => ({
    id: sub._id || `student-${index}`,
    nom: sub.nom || '',
    prenom: sub.prenom || '',
    present: false
  })).sort((a: Student, b: Student) => 
    a.prenom.localeCompare(b.prenom, 'fr', { sensitivity: 'base' })
  )
}

export default function AttendancePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les données depuis MongoDB
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        const response = await fetch('http://localhost:3001/subscriptions')
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des données')
        }
        const subscriptions = await response.json()
        
        // Transformer les données MongoDB en cours avec élèves
        const coursesWithStudents = coursesStructure.map(course => ({
          ...course,
          eleves: filterStudentsForCourse(course, subscriptions)
        }))

        setCourses(coursesWithStudents)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  // Grouper les cours par jour
  const coursesByDay = courses.reduce((acc, course) => {
    if (!acc[course.jour]) {
      acc[course.jour] = []
    }
    acc[course.jour].push(course)
    return acc
  }, {} as Record<string, Course[]>)

  // Trier les cours par heure dans chaque jour
  Object.keys(coursesByDay).forEach(day => {
    coursesByDay[day].sort((a, b) => a.heure.localeCompare(b.heure))
  })

  const handlePresenceChange = (courseId: string, eleveId: string, present: boolean) => {
    setCourses(prev => prev.map(course => 
      course.id === courseId 
        ? {
            ...course,
            eleves: course.eleves.map(eleve => 
              eleve.id === eleveId ? { ...eleve, present } : eleve
            )
          }
        : course
    ))
  }

  const handleSaveAttendance = (courseId: string) => {
    const course = courses.find(c => c.id === courseId)
    if (course) {
      console.log('Sauvegarde des présences:', course)
      alert(`Présences sauvegardées pour ${course.nom} !`)
    }
  }

  const handleAddTemporaryStudent = (courseId: string, nom: string, prenom: string) => {
    const newStudent: Student = {
      id: `temp-${Date.now()}`,
      nom: nom.trim(),
      prenom: prenom.trim(),
      present: false,
      isTemporary: true
    }

    setCourses(prev => prev.map(course => 
      course.id === courseId 
        ? {
            ...course,
            eleves: [...course.eleves, newStudent]
          }
        : course
    ))
  }

  const removeStudentFromCourse = (course: Course, studentId: string): Course => ({
    ...course,
    eleves: course.eleves.filter(eleve => eleve.id !== studentId)
  })

  const handleRemoveTemporaryStudent = (courseId: string, studentId: string) => {
    setCourses(prev => prev.map(course => 
      course.id === courseId ? removeStudentFromCourse(course, studentId) : course
    ))
  }


  if (loading) return <div className="container mx-auto p-4">Chargement...</div>
  if (error) return <div className="container mx-auto p-4">Erreur: {error}</div>

  return (
    <div className="container mx-auto p-4 lg:max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Feuilles d&apos;appel
          </h1>
        <p className="text-gray-600">Gérez les présences des élèves par cours</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="flex items-center gap-2 w-full md:w-auto">
            <Home className="h-4 w-4" />
            Retour au Dashboard
          </Button>
        </Link>
      </div>

      <Tabs defaultValue={Object.keys(coursesByDay)[0]} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {Object.keys(coursesByDay).map(day => (
            <TabsTrigger key={day} value={day}>
              {day}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(coursesByDay).map(([day, dayCourses]) => (
          <TabsContent key={day} value={day} className="space-y-4">
            {dayCourses.map(course => (
              <CourseCard 
                key={course.id} 
                course={course}
                onPresenceChange={handlePresenceChange}
                onRemoveTemporaryStudent={handleRemoveTemporaryStudent}
                onAddTemporaryStudent={handleAddTemporaryStudent}
                onSaveAttendance={handleSaveAttendance}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
