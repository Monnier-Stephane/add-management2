'use client'
import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'
import Link from 'next/link'
import { CourseCard } from '@/components/attendance/CourseCard'
import { useSearchParams } from 'next/navigation'

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
    // Vérifier s'il y a des adultes qui correspondent exactement à ce cours
    return checkCourseDayAndTime(course, tarif) && 
           (tarif.includes('ADULTES') || tarif.includes('JEUNES ADULTES'))
  })
}

// Fonction pour vérifier si un cours est un cours adultes (basé sur la structure des cours)
const isAdultCourse = (course: CourseData): boolean => {
  // Définir quels cours sont pour les adultes
  const adultCourses = [
    'Lundi 19h30 - Paris Bercy',
    'Mercredi 16h15 - Paris Châtelet', 
    'Jeudi 18h00 - Paris Châtelet',
    'Jeudi 19h30 - Paris Châtelet',
    'Samedi 10h00 - Paris Châtelet',
    'Samedi 16h30 - Choisy le Roi',
    'Samedi 17h45 - Choisy le Roi',
    'Dimanche 10h00 - Choisy le Roi',
    'Dimanche 11h30 - Choisy le Roi'
  ]
  
  return adultCourses.some(adultCourse => {
    const [dayTime, location] = adultCourse.split(' - ')
    return course.jour === dayTime.split(' ')[0] && 
           course.heure === dayTime.split(' ')[1] && 
           course.lieu === location
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
  const isAdultCourseType = isAdultCourse(course)
  
  const students = subscriptions.filter((sub: Subscription) => {
    const tarif = sub.tarif || ''
    const isUnlimited = isUnlimitedOr2Courses(tarif)
    
    // Pour les élèves illimité, ils peuvent aller à tous les cours adultes
    if (isUnlimited && (courseHasAdults || isAdultCourseType)) {
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
  const [selectedDay, setSelectedDay] = useState<string>('')
  
  const searchParams = useSearchParams()
  const courseParam = searchParams.get('course')

  // Fonction pour mapper le titre du cours du planning vers l'ID de la page d'attendance
  const mapCourseTitleToId = (courseTitle: string): string => {
    const title = courseTitle.toLowerCase()
    
    if (title.includes('lundi') && title.includes('19h30') && title.includes('bercy')) return 'lundi-bercy'
    if (title.includes('mercredi') && title.includes('12h15')) return 'mercredi-12h15'
    if (title.includes('mercredi') && title.includes('16h15')) return 'mercredi-16h15'
    if (title.includes('jeudi') && title.includes('18h')) return 'jeudi-18h'
    if (title.includes('jeudi') && title.includes('19h30')) return 'jeudi-19h30'
    if (title.includes('samedi') && title.includes('10h') && title.includes('châtelet')) return 'samedi-10h'
    if (title.includes('samedi') && title.includes('11h15')) return 'samedi-11h15'
    if (title.includes('samedi') && title.includes('12h15')) return 'samedi-12h15'
    if (title.includes('samedi') && title.includes('16h30')) return 'samedi-16h30'
    if (title.includes('samedi') && title.includes('17h45')) return 'samedi-17h45'
    if (title.includes('dimanche') && title.includes('10h')) return 'dimanche-10h'
    if (title.includes('dimanche') && title.includes('11h30')) return 'dimanche-11h30'
    
    return ''
  }

  // Charger les données depuis MongoDB
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        
        // Récupérer les élèves et les tarifs uniques en parallèle
        const [subscriptionsResponse, tarifsResponse] = await Promise.all([
          fetch('http://localhost:3001/subscriptions'),
          fetch('http://localhost:3001/subscriptions/tarifs/unique')
        ])
        
        if (!subscriptionsResponse.ok || !tarifsResponse.ok) {
          throw new Error('Erreur lors du chargement des données')
        }
        
        const [subscriptions, uniqueTarifs] = await Promise.all([
          subscriptionsResponse.json(),
          tarifsResponse.json()
        ])
        
        // Afficher les tarifs uniques pour debug
        console.log('Tarifs uniques dans MongoDB:', uniqueTarifs)
        
        // Transformer les données MongoDB en cours avec élèves
        const coursesWithStudents = coursesStructure.map(course => ({
          ...course,
          eleves: filterStudentsForCourse(course, subscriptions)
        }))

        // Charger les présences depuis localStorage avec vérification d'expiration
        const savedAttendance = localStorage.getItem('attendanceData')
        if (savedAttendance) {
          try {
            const attendanceData = JSON.parse(savedAttendance)
            const now = Date.now()
            const expirationTime = 3 * 60 * 60 * 1000 // 3 heures en millisecondes
            
            // Vérifier si les données ne sont pas expirées
            if (attendanceData.timestamp && (now - attendanceData.timestamp) < expirationTime) {
              const coursesWithSavedAttendance = coursesWithStudents.map(course => {
                const savedCourse = attendanceData.data.find((saved: { courseId: string; students: { id: string; present: boolean }[] }) => saved.courseId === course.id)
                if (savedCourse) {
                  return {
                    ...course,
                    eleves: course.eleves.map(eleve => {
                      const savedStudent = savedCourse.students.find((s: { id: string; present: boolean }) => s.id === eleve.id)
                      return savedStudent ? { ...eleve, present: savedStudent.present } : eleve
                    })
                  }
                }
                return course
              })
              setCourses(coursesWithSavedAttendance)
            } else {
              // Données expirées, les supprimer
              localStorage.removeItem('attendanceData')
              setCourses(coursesWithStudents)
            }
          } catch (error) {
            console.error('Erreur lors du chargement des présences:', error)
            localStorage.removeItem('attendanceData')
            setCourses(coursesWithStudents)
          }
        } else {
          setCourses(coursesWithStudents)
        }
        // Debug
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

  // Déterminer le jour par défaut basé sur le paramètre course
  useEffect(() => {
    if (courseParam && courses.length > 0) {
      // Extraire le titre du cours depuis le paramètre (enlever le timestamp)
      const courseTitle = courseParam.split('-').slice(0, -1).join('-')
      const mappedId = mapCourseTitleToId(courseTitle)
      
      if (mappedId) {
        const course = courses.find(c => c.id === mappedId)
        if (course) {
          setSelectedDay(course.jour)
        }
      }
    } else if (courses.length > 0 && !selectedDay) {
      // Seulement définir le jour par défaut si aucun jour n'est sélectionné
      const coursesByDay = courses.reduce((acc, course) => {
        if (!acc[course.jour]) {
          acc[course.jour] = []
        }
        acc[course.jour].push(course)
        return acc
      }, {} as Record<string, Course[]>)
      
      setSelectedDay(Object.keys(coursesByDay)[0])
    }
  }, [courseParam, courses, selectedDay])

  // Supprimer les console.log de debug
  // console.log('Cours par jour:', coursesByDay)
  // console.log('Jour sélectionné:', selectedDay)

  const handlePresenceChange = (courseId: string, eleveId: string, present: boolean) => {
    setCourses(prev => {
      const updatedCourses = prev.map(course => 
        course.id === courseId 
          ? {
              ...course,
              eleves: course.eleves.map(eleve => 
                eleve.id === eleveId ? { ...eleve, present } : eleve
              )
            }
          : course
      )
      
      // Sauvegarder en localStorage avec timestamp
      const attendanceData = {
        timestamp: Date.now(),
        data: updatedCourses.map(course => ({
          courseId: course.id,
          students: course.eleves.map(eleve => ({
            id: eleve.id,
            present: eleve.present
          }))
        }))
      }
      
      localStorage.setItem('attendanceData', JSON.stringify(attendanceData))
      
      return updatedCourses
    })
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

      <Tabs value={selectedDay} onValueChange={setSelectedDay} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {Object.keys(coursesByDay).map(day => (
            <TabsTrigger key={day} value={day}>
              {day}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(coursesByDay).map(([day, dayCourses]) => (
          <TabsContent key={day} value={day} className="space-y-4">
            {dayCourses.map(course => {
              const courseTitle = courseParam ? courseParam.split('-').slice(0, -1).join('-') : ''
              const mappedId = courseParam ? mapCourseTitleToId(courseTitle) : ''
              const isHighlighted = Boolean(courseParam && course.id === mappedId)
              
              return (
                <CourseCard 
                  key={course.id} 
                  course={course}
                  onPresenceChange={handlePresenceChange}
                  onRemoveTemporaryStudent={handleRemoveTemporaryStudent}
                  onAddTemporaryStudent={handleAddTemporaryStudent}
                  isHighlighted={isHighlighted}
                />
              )
            })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
