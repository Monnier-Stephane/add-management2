import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'

interface TodayCourse {
  id: string
  title: string
  start: Date
  end: Date
  coaches: string[]
  location?: string
}

export function useTodayCourses() {
  const [todayCourses, setTodayCourses] = useState<TodayCourse[]>([])
  const [loading, setLoading] = useState(true)
  const { userProfile, userRole } = useAuth()

  useEffect(() => {
    const fetchTodayCourses = async () => {
      try {
        setLoading(true)
        
        // Utiliser l'API existante qui fonctionne
        const today = new Date()
        const todayDate = today.toISOString().split('T')[0] // Format YYYY-MM-DD
        
        
        // Construire l'URL selon le rôle de l'utilisateur
        let apiUrl: string
        if (userRole === 'admin') {
          apiUrl = `/api/coaches/today-courses?date=${todayDate}`
        } else if (userProfile?.email) {
          const encodedEmail = encodeURIComponent(userProfile.email)
          apiUrl = `/api/coaches/today-courses?coachEmail=${encodedEmail}&date=${todayDate}`
        } else {
          apiUrl = `/api/coaches/today-courses?date=${todayDate}`
        }
        
                const response = await fetch(apiUrl)
                if (!response.ok) {
                  throw new Error(`Erreur API: ${response.status}`)
                }
                
                const courses = await response.json()
        
        // Convertir les cours en format compatible
        const todayCourses = courses.map((course: any) => {
          // Créer une date valide
          const courseDateTime = new Date(`${course.date}T${course.time}`)
          
          return {
            id: course.id,
            title: course.name,
            start: courseDateTime,
            end: courseDateTime, // Simplification
            coaches: course.assignedCoaches || [course.coachName],
            location: course.location
          }
        })
        
        setTodayCourses(todayCourses)
      } catch (error) {
        console.error('Erreur lors du chargement des cours d\'aujourd\'hui:', error)
        setTodayCourses([])
      } finally {
        setLoading(false)
      }
    }

    fetchTodayCourses()
  }, [userProfile, userRole])

  return { todayCourses, loading }
}
