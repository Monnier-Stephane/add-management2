'use client'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/AuthContext'
import { useTodayCourses } from '@/lib/hooks/useTodayCourses'

export function DailyCourseReminder() {
  
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const { userRole } = useAuth()
  const { todayCourses, loading } = useTodayCourses()
  
  // Initialiser la date côté client seulement pour éviter les problèmes d'hydratation
  useEffect(() => {
    setCurrentDate(new Date())
  }, [])
  
  // Fonction pour vérifier si un cours correspond au jour actuel
  const isCourseForToday = (course: unknown) => {
    if (!currentDate) return false
    
    const courseObj = course as Record<string, unknown>
    
    // Vérifier si le cours a un horaire et si il correspond au jour actuel
    if (courseObj.start && courseObj.start instanceof Date) {
      const courseStart = courseObj.start as Date
      return courseStart.toDateString() === currentDate.toDateString()
    }
    
    return false
  }
  
  // Filtrer les cours pour ne garder que ceux d'aujourd'hui
  const todayCoursesFiltered = todayCourses.filter(isCourseForToday)
  
  
  const showCourseReminder = useCallback((courses: unknown[]) => {
    if (Notification.permission === 'granted') {
      
      
      // Fermer les notifications existantes avec le même tag
      if ('serviceWorker' in navigator && 'getRegistrations' in navigator.serviceWorker) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.getNotifications({ tag: 'daily-courses' }).then(notifications => {
              notifications.forEach(notification => notification.close())
            })
          })
        })
      }
      
      // Attendre un peu avant d'afficher la nouvelle notification
      setTimeout(() => {
        const notificationTitle = userRole === 'admin' 
          ? '📅 Cours du jour - Vue Admin' 
          : '📅 Vos cours du jour'
        
        const notificationBody = userRole === 'admin'
          ? `${courses.length} cours programmé(s) aujourd'hui (vue admin)`
          : `${courses.length} cours programmé(s) aujourd'hui`
        
        new Notification(notificationTitle, {
          body: notificationBody,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'daily-courses',
          requireInteraction: true
        })
      }, 100)
    }
  }, [userRole])

  // Afficher la notification si il y a des cours
  useEffect(() => {
    if (todayCoursesFiltered.length > 0 && currentDate) {
      showCourseReminder(todayCoursesFiltered)
      localStorage.setItem('lastReminderDate', currentDate.toDateString())
    }
  }, [todayCoursesFiltered, currentDate, showCourseReminder])

  

  const refreshDate = () => {
    const newDate = new Date()
    setCurrentDate(newDate)
    // Recharger la page pour actualiser les données
    window.location.reload()
  }


  return (
    <div className={`${userRole === 'admin' ? 'bg-purple-50 border-purple-300' : 'bg-blue-50 border-blue-300'} border-2 rounded-lg p-4 mb-4 shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`font-semibold ${userRole === 'admin' ? 'text-purple-900' : 'text-blue-900'}`}>
            Cours du jour
          </h3>
          <p className={`text-sm ${userRole === 'admin' ? 'text-purple-600' : 'text-blue-600'}`}>
            📅 {currentDate ? currentDate.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : 'Chargement...'}
          </p>
          
          {todayCoursesFiltered.length > 0 && (
  <p className={`text-sm ${userRole === 'admin' ? 'text-purple-700' : 'text-blue-700'}`}>
    {todayCoursesFiltered.length} cours programmé(s)
  </p>
)}
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={refreshDate}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            🔄 Actualiser
          </Button>
          
        </div>
      </div>
      
      {loading ? (
        <div className="mt-3 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-center">Chargement des cours...</p>
        </div>
      ) : todayCoursesFiltered.length > 0 ? (
        <div className="mt-3 space-y-2">
          {todayCoursesFiltered.map((course) => (
            <div key={course.id} className="bg-white p-3 rounded border">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{course.title}</p>
                  <p className="text-sm text-gray-600">
                    {course.start.toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} - {course.end.toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                  {course.coaches && course.coaches.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      👥 Coaches: {course.coaches.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-center">
            Pas de cours aujourd&apos;hui
          </p>
        </div>
      )}
    </div>
  )
}