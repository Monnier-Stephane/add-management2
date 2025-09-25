'use client'

import { createContext, useEffect, useState, useContext, useRef } from 'react'
import { User, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'
import { useRouter } from 'next/navigation'

type UserRole = 'coach' | 'admin'

type AuthContextType = {
  user: User | null
  userProfile: { statut: string; nom: string; prenom: string; email: string } | null
  userRole: UserRole | null
  loading: boolean
  logout: () => Promise<void>
  sessionExpired: boolean
  timeRemaining: number
  extendSession: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  userRole: null,
  loading: true,
  logout: async () => {},
  sessionExpired: false,
  timeRemaining: 0,
  extendSession: () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<{ statut: string; nom: string; prenom: string; email: string } | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const router = useRouter()
  
  // Références pour les timers
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Durée de session : 1 heure (3600000 ms)
  const SESSION_DURATION = 60 * 60 * 1000
  // Temps d'avertissement : 5 minutes avant expiration
  const WARNING_TIME = 5 * 60 * 1000

  // Fonction pour nettoyer les timers
  const clearTimers = () => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current)
      sessionTimerRef.current = null
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
      warningTimerRef.current = null
    }
  }

  // Fonction pour démarrer le timer de session
  const startSessionTimer = () => {
    clearTimers()
    
    // Sauvegarder le temps de début de session
    const sessionStartTime = Date.now()
    sessionStorage.setItem('sessionStartTime', sessionStartTime.toString())
    
    // Timer d'avertissement (5 minutes avant expiration)
    warningTimerRef.current = setTimeout(() => {
      setSessionExpired(true)
      setTimeRemaining(WARNING_TIME)
      
      // Timer de décompte
      const countdownInterval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1000) {
            clearInterval(countdownInterval)
            handleAutoLogout()
            return 0
          }
          return prev - 1000
        })
      }, 1000)
      
    }, SESSION_DURATION - WARNING_TIME)
    
    // Timer principal d'expiration
    sessionTimerRef.current = setTimeout(() => {
      handleAutoLogout()
    }, SESSION_DURATION)
  }



  // Fonction pour étendre la session
  const extendSession = () => {
    setSessionExpired(false)
    setTimeRemaining(0)
    startSessionTimer()
  }

  // Fonction de déconnexion automatique
  const handleAutoLogout = async () => {
    try {
      // Sauvegarder les données d'attendance avant la déconnexion
      const attendanceData = localStorage.getItem('attendanceData')
      
      // Nettoyer sessionStorage mais préserver attendanceData
      sessionStorage.clear()
      
      // Déconnexion Firebase
      await signOut(auth)
      
      // Remettre les données d'attendance si elles existent
      if (attendanceData) {
        localStorage.setItem('attendanceData', attendanceData)
      }
      
      // Nettoyer les cookies Firebase
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        if (name.includes('firebase')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        }
      })
      
      clearTimers()
      setSessionExpired(false)
      setTimeRemaining(0)
      router.push('/login')
    } catch (error) {
      console.error('Erreur lors de la déconnexion automatique:', error)
    }
  }

  useEffect(() => {
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
     
      setUser(firebaseUser)
      
      if (firebaseUser) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coaches/by-email/${encodeURIComponent(firebaseUser.email!)}`);
          
          if (response.ok) {
            const text = await response.text();
           
            if (text.trim()) {
              const coach = JSON.parse(text);
             
              setUserProfile(coach);
              setUserRole(coach?.statut || 'coach');
            } else {
              // Pas de coach trouvé, utiliser les valeurs par défaut
              setUserProfile(null);
              setUserRole('coach');
            }
          } else {
            setUserRole('coach');
          }
        } catch (error) {
          console.error('Error fetching coach profile:', error);
          setUserRole('coach');
        }
        
        // Vérifier la session après le chargement du profil
        const sessionStartTime = sessionStorage.getItem('sessionStartTime')
        if (sessionStartTime) {
          const elapsed = Date.now() - parseInt(sessionStartTime)
          if (elapsed >= SESSION_DURATION) {
            // Session expirée, déconnecter
            handleAutoLogout()
            return
          }
        }
        
        // Démarrer le timer de session avec un petit délai pour s'assurer que tout est chargé
        setTimeout(() => {
          startSessionTimer()
        }, 1000)
      } else {
        setUserProfile(null);
        setUserRole(null);
        clearTimers()
        setSessionExpired(false)
        setTimeRemaining(0)
      }
      
      setLoading(false)
    })

    return () => {
      unsubscribe()
      clearTimers()
    }
  }, [])


  const logout = async () => {
    try {
      // Sauvegarder les données d'attendance avant la déconnexion
      const attendanceData = localStorage.getItem('attendanceData')
      
      // Nettoyer sessionStorage mais préserver attendanceData
      sessionStorage.clear()
      
      // Déconnexion Firebase
      await signOut(auth)
      
      // Remettre les données d'attendance si elles existent
      if (attendanceData) {
        localStorage.setItem('attendanceData', attendanceData)
      }
      
      // Nettoyer les cookies Firebase
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        if (name.includes('firebase')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        }
      })
      
      clearTimers()
      setSessionExpired(false)
      setTimeRemaining(0)
      router.push('/login')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      userRole, 
      loading, 
      logout, 
      sessionExpired, 
      timeRemaining, 
      extendSession 
    }}>
      {children}
    </AuthContext.Provider>
  )
} 