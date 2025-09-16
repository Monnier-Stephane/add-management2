'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Users, Clock, MapPin } from 'lucide-react'

interface Student {
  id: string
  nom: string
  prenom: string
  present: boolean
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
        const coursesWithStudents = coursesStructure.map(course => {
          // Vérifier si ce cours contient déjà des adultes dans les tarifs
          const courseHasAdults = subscriptions.some((sub: Subscription) => {
            const tarif = sub.tarif || ''
            return (
              (course.jour === 'Lundi' && tarif.includes('LUNDI') && tarif.includes('Bercy') && (tarif.includes('ADULTES') || tarif.includes('JEUNES ADULTES'))) ||
              (course.jour === 'Mercredi' && tarif.includes('MERCREDI') && 
               ((course.heure === '12h15' && tarif.includes('12h15') && (tarif.includes('ADULTES') || tarif.includes('JEUNES ADULTES'))) ||
                (course.heure === '16h15' && tarif.includes('16h15') && (tarif.includes('ADULTES') || tarif.includes('JEUNES ADULTES'))))) ||
              (course.jour === 'Jeudi' && tarif.includes('JEUDI') && 
               ((course.heure === '18h00' && tarif.includes('18h') && (tarif.includes('ADULTES') || tarif.includes('JEUNES ADULTES'))) ||
                (course.heure === '19h30' && tarif.includes('19h30') && (tarif.includes('ADULTES') || tarif.includes('JEUNES ADULTES'))))) ||
              (course.jour === 'Samedi' && tarif.includes('SAMEDI') && 
               ((course.heure === '10h00' && tarif.includes('10h') && (tarif.includes('ADULTES') || tarif.includes('JEUNES ADULTES'))) ||
                (course.heure === '11h15' && tarif.includes('11h15') && (tarif.includes('ADULTES') || tarif.includes('JEUNES ADULTES'))) ||
                (course.heure === '12h15' && tarif.includes('12H15') && (tarif.includes('ADULTES') || tarif.includes('JEUNES ADULTES'))) ||
                (course.heure === '16h30' && tarif.includes('16h30') && tarif.includes('Choisy') && (tarif.includes('ADULTES') || tarif.includes('JEUNES ADULTES'))) ||
                (course.heure === '17h45' && tarif.includes('17h45') && (tarif.includes('ADULTES') || tarif.includes('JEUNES ADULTES'))))) ||
              (course.jour === 'Dimanche' && tarif.includes('DIMANCHE') && 
               ((course.heure === '10h00' && tarif.includes('10h') && (tarif.includes('ADULTES') || tarif.includes('JEUNES ADULTES'))) ||
                (course.heure === '11h30' && tarif.includes('11h30') && (tarif.includes('ADULTES') || tarif.includes('JEUNES ADULTES')))))
            )
          })

          // Filtrer les élèves selon le jour, heure et lieu
          const students = subscriptions.filter((sub: Subscription) => {
            const tarif = sub.tarif || ''
            const isUnlimitedOr2Courses = tarif.includes('ADULTES COURS ILLIMITE/SEMAINE') || tarif.includes('ADULTES 2 COURS/SEMAINE')

            return (
              (course.jour === 'Lundi' && (
                (tarif.includes('LUNDI') && tarif.includes('Bercy')) ||
                (isUnlimitedOr2Courses && courseHasAdults)
              )) ||
              (course.jour === 'Mercredi' && (
                (tarif.includes('MERCREDI') && 
                 ((course.heure === '12h15' && tarif.includes('12h15')) ||
                  (course.heure === '16h15' && tarif.includes('16h15')))) ||
                (isUnlimitedOr2Courses && courseHasAdults)
              )) ||
              (course.jour === 'Jeudi' && (
                (tarif.includes('JEUDI') && 
                 ((course.heure === '18h00' && tarif.includes('18h')) ||
                  (course.heure === '19h30' && tarif.includes('19h30')))) ||
                (isUnlimitedOr2Courses && courseHasAdults)
              )) ||
              (course.jour === 'Samedi' && (
                (tarif.includes('SAMEDI') && 
                 ((course.heure === '10h00' && (tarif.includes('10h') || tarif.includes('Paris châtelet 10h') || tarif.includes('Paris Châtelet 1Oh'))) ||
                  (course.heure === '11h15' && tarif.includes('11h15')) ||
                  (course.heure === '12h15' && tarif.includes('12H15')) ||
                  (course.heure === '16h30' && tarif.includes('16h30') && tarif.includes('Choisy')) ||
                  (course.heure === '17h45' && tarif.includes('17h45')))) ||
                (isUnlimitedOr2Courses && courseHasAdults) ||
                (course.heure === '17h45' && isUnlimitedOr2Courses)
              )) ||
              (course.jour === 'Dimanche' && (
                (tarif.includes('DIMANCHE') && 
                 ((course.heure === '10h00' && tarif.includes('10h')) ||
                  (course.heure === '11h30' && tarif.includes('11h30')))) ||
                (isUnlimitedOr2Courses && courseHasAdults)
              ))
            )
          }).map((sub: Subscription, index: number) => ({
            id: sub._id || `student-${index}`,
            nom: sub.nom || '',
            prenom: sub.prenom || '',
            present: false
          }))

          // Trier les élèves par prénom (ordre alphabétique)
          const sortedStudents = students.sort((a: Student, b: Student) => 
            a.prenom.localeCompare(b.prenom, 'fr', { sensitivity: 'base' })
          )

          return {
            ...course,
            eleves: sortedStudents
          }
        })

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

  if (loading) return <div className="container mx-auto p-4">Chargement...</div>
  if (error) return <div className="container mx-auto p-4">Erreur: {error}</div>

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Feuilles d&apos;appel</h1>
        <p className="text-gray-600">Gérez les présences des élèves par cours</p>
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
                      <div key={eleve.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`${course.id}-${eleve.id}`}
                            checked={eleve.present}
                            onCheckedChange={(checked) => 
                              handlePresenceChange(course.id, eleve.id, checked as boolean)
                            }
                          />
                          <label 
                            htmlFor={`${course.id}-${eleve.id}`}
                            className="font-medium cursor-pointer"
                          >
                            {eleve.prenom} {eleve.nom}
                          </label>
                        </div>
                        <Badge variant={eleve.present ? "default" : "secondary"}>
                          {eleve.present ? "Présent" : "Absent"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      {course.eleves.filter(e => e.present).length} / {course.eleves.length} présents
                    </div>
                    <Button onClick={() => handleSaveAttendance(course.id)} size="sm">
                      Sauvegarder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
