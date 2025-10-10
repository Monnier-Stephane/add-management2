import { NextResponse } from 'next/server'

interface Course {
  id: string
  name: string
  time: string
  students: number
  location: string
  coachId: string
  coachName: string
  coachEmail: string
  date: string
}

// Simulation d'une base de données avec des coaches
const mockCoaches = [
  { id: '1', name: 'Jean Dupont', email: 'jean@add.com' },
  { id: '2', name: 'Marie Martin', email: 'marie@add.com' },
  { id: '3', name: 'Pierre Durand', email: 'pierre@add.com' }
]

const mockCourses = [
  {
    id: '1',
    name: 'Parkour Niveau 1',
    time: '16h00',
    students: 6,
    location: 'Salle A',
    coachId: '1',
    coachName: 'Jean Dupont'
  },
  {
    id: '2', 
    name: 'Parkour Niveau 2',
    time: '18h00',
    students: 8,
    location: 'Salle B',
    coachId: '2',
    coachName: 'Marie Martin'
  },
  {
    id: '3',
    name: 'Freerunning Avancé',
    time: '19h30',
    students: 4,
    location: 'Salle C',
    coachId: '3',
    coachName: 'Pierre Durand'
  }
]

export async function GET(request: Request) {
        try {
    
    // Récupérer les paramètres depuis les query parameters
    // Vérifier que request.url existe avant de construire l'URL
    if (!request.url) {
      throw new Error('Request URL is not available')
    }
    
    let searchParams: URLSearchParams
    try {
      const url = new URL(request.url)
      searchParams = url.searchParams
    } catch (error) {
      console.error('Erreur lors de la construction de l\'URL:', error)
      throw new Error('Invalid request URL format')
    }
    const coachEmail = searchParams.get('coachEmail')
    const date = searchParams.get('date')
    
            // URL du backend (ajustez selon votre configuration)
            const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
            
            // Construire l'URL avec les paramètres
            let backendUrlWithParams = `${backendUrl}/planning/today-courses`
            const params = new URLSearchParams()
            
            if (coachEmail) {
              params.append('coachEmail', coachEmail)
            }
            if (date) {
              params.append('date', date)
            }
            
            if (params.toString()) {
              backendUrlWithParams += `?${params.toString()}`
            }
    
    // Appeler l'API du backend
    const response = await fetch(backendUrlWithParams, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }
    
            const courses = await response.json()
            
            // Ajouter les informations des coaches
            const coursesWithCoaches = courses.map((course: Course) => ({
              ...course,
              coach: {
                id: course.coachId,
                name: course.coachName,
                email: mockCoaches.find(c => c.id === course.coachId)?.email
              }
            }))
    
    return NextResponse.json(coursesWithCoaches)
  } catch (error) {
    console.error('Erreur lors de la récupération des cours:', error)
    
    // En cas d'erreur, retourner les données mockées comme fallback
    
    const coursesWithCoaches = mockCourses.map(course => ({
      ...course,
      coach: {
        id: course.coachId,
        name: course.coachName,
        email: mockCoaches.find(c => c.id === course.coachId)?.email
      }
    }))
    
    return NextResponse.json(coursesWithCoaches)
  }
}