'use client'
import { useState, useEffect, Suspense } from 'react'
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
  cours: string[]
  telephone?: string
  telephoneUrgence?: string
  adresse?: string
  dateInscription: string
  statutPaiement: 'paye' | 'impaye' | 'partiel'
  montantPaye: number
  montantTotal: number
  dateNaissance?: string
  email?: string
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

function AttendancePageContent() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDay, setSelectedDay] = useState<string>('')
  const searchParams = useSearchParams()

  // Structure des cours avec leurs élèves
  const coursesStructure: Course[] = [
    {
      id: 'karate-enfants',
      nom: 'Karaté Enfants',
      jour: 'Lundi',
      heure: '17h00',
      lieu: 'Dojo Principal',
      coach: 'Sensei Martin',
      eleves: []
    },
    {
      id: 'karate-adultes',
      nom: 'Karaté Adultes',
      jour: 'Lundi',
      heure: '19h00',
      lieu: 'Dojo Principal',
      coach: 'Sensei Martin',
      eleves: []
    },
    {
      id: 'karate-enfants-mardi',
      nom: 'Karaté Enfants',
      jour: 'Mardi',
      heure: '17h00',
      lieu: 'Dojo Principal',
      coach: 'Sensei Dubois',
      eleves: []
    },
    {
      id: 'karate-adultes-mardi',
      nom: 'Karaté Adultes',
      jour: 'Mardi',
      heure: '19h00',
      lieu: 'Dojo Principal',
      coach: 'Sensei Dubois',
      eleves: []
    },
    {
      id: 'karate-enfants-mercredi',
      nom: 'Karaté Enfants',
      jour: 'Mercredi',
      heure: '17h00',
      lieu: 'Dojo Principal',
      coach: 'Sensei Martin',
      eleves: []
    },
    {
      id: 'karate-adultes-mercredi',
      nom: 'Karaté Adultes',
      jour: 'Mercredi',
      heure: '19h00',
      lieu: 'Dojo Principal',
      coach: 'Sensei Martin',
      eleves: []
    },
    {
      id: 'karate-enfants-jeudi',
      nom: 'Karaté Enfants',
      jour: 'Jeudi',
      heure: '17h00',
      lieu: 'Dojo Principal',
      coach: 'Sensei Dubois',
      eleves: []
    },
    {
      id: 'karate-adultes-jeudi',
      nom: 'Karaté Adultes',
      jour: 'Jeudi',
      heure: '19h00',
      lieu: 'Dojo Principal',
      coach: 'Sensei Dubois',
      eleves: []
    },
    {
      id: 'karate-enfants-vendredi',
      nom: 'Karaté Enfants',
      jour: 'Vendredi',
      heure: '17h00',
      lieu: 'Dojo Principal',
      coach: 'Sensei Martin',
      eleves: []
    },
    {
      id: 'karate-adultes-vendredi',
      nom: 'Karaté Adultes',
      jour: 'Vendredi',
      heure: '19h00',
      lieu: 'Dojo Principal',
      coach: 'Sensei Martin',
      eleves: []
    }
  ]

  // Fonction pour filtrer les élèves selon le cours
  const filterStudentsForCourse = (course: Course, subscriptions: Subscription[]): Student[] => {
    return subscriptions
      .filter(sub => sub.cours.includes(course.nom))
      .map(sub => ({
        id: sub._id,
        nom: sub.nom,
        prenom: sub.prenom,
        present: false,
        isTemporary: false
      }))
  }

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
      } catch (error) {
        console.error('Erreur lors du chargement des cours:', error)
        setCourses(coursesStructure.map(course => ({ ...course, eleves: [] })))
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  const handlePresenceChange = (courseId: string, studentId: string, present: boolean) => {
    setCourses(prevCourses => {
      const updatedCourses = prevCourses.map(course => 
        course.id === courseId 
          ? {
              ...course,
              eleves: course.eleves.map(eleve => 
                eleve.id === studentId 
                  ? { ...eleve, present }
                  : eleve
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

  const handleRemoveTemporaryStudent = (courseId: string, studentId: string) => {
    setCourses(prevCourses => 
      prevCourses.map(course => 
        course.id === courseId 
          ? {
              ...course,
              eleves: course.eleves.filter(eleve => eleve.id !== studentId)
            }
          : course
      )
    )
  }

  const handleAddTemporaryStudent = (courseId: string, nom: string, prenom: string) => {
    const newStudent: Student = {
      id: `temp-${Date.now()}`,
      nom,
      prenom,
      present: false,
      isTemporary: true
    }

    setCourses(prevCourses => 
      prevCourses.map(course => 
        course.id === courseId 
          ? {
              ...course,
              eleves: [...course.eleves, newStudent]
            }
          : course
      )
    )
  }

  // Filtrer les cours selon la recherche et le jour
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.coach.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDay = selectedDay === '' || course.jour === selectedDay
    return matchesSearch && matchesDay
  })

  // Grouper les cours par jour
  const coursesByDay = filteredCourses.reduce((acc, course) => {
    if (!acc[course.jour]) {
      acc[course.jour] = []
    }
    acc[course.jour].push(course)
    return acc
  }, {} as Record<string, Course[]>)

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feuilles d'appel</h1>
        <p className="text-gray-600">Gérez la présence des élèves pour chaque cours</p>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Rechercher un cours ou un coach..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Tous les jours</option>
          {days.map(day => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Cours</p>
              <p className="text-2xl font-bold text-gray-900">{filteredCourses.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total élèves</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredCourses.reduce((total, course) => total + course.eleves.length, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Présents</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredCourses.reduce((total, course) => 
                  total + course.eleves.filter(eleve => eleve.present).length, 0
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Absents</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredCourses.reduce((total, course) => 
                  total + course.eleves.filter(eleve => !eleve.present).length, 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cours par jour */}
      {Object.keys(coursesByDay).length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">Aucun cours trouvé pour les critères sélectionnés</p>
        </div>
      ) : (
        <div className="space-y-6">
          {days.filter(day => coursesByDay[day]).map(day => (
            <div key={day}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {day}
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {coursesByDay[day].map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onPresenceChange={handlePresenceChange}
                    onRemoveTemporaryStudent={handleRemoveTemporaryStudent}
                    onAddTemporaryStudent={handleAddTemporaryStudent}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AttendancePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <AttendancePageContent />
    </Suspense>
  )
}