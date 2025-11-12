'use client'

import { createContext, useEffect, useState, useContext, useRef, useCallback } from 'react'
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

const CACHE_DURATION = 60 * 60 * 1000
const SESSION_DURATION = 60 * 60 * 1000
const INACTIVITY_TIMEOUT = 60 * 60 * 1000

const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<{ statut: string; nom: string; prenom: string; email: string } | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const router = useRouter()
  
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const fetchProfileFromAPI = async (
    userEmail: string,
    cacheKey: string,
    timestampKey: string
  ) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) {
      console.error('NEXT_PUBLIC_API_URL not configured')
      setUserRole('coach')
      return
    }

    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
    const response = await fetch(`${cleanApiUrl}/coaches/by-email/${encodeURIComponent(userEmail)}`)
    
    if (response.ok) {
      const coach = await response.json()
      setUserProfile(coach)
      setUserRole(coach?.statut === 'admin' ? 'admin' : 'coach')
      
      localStorage.setItem(cacheKey, JSON.stringify(coach))
      localStorage.setItem(timestampKey, Date.now().toString())
      console.log('✅ Profil sauvegardé dans le cache')
    } else {
      setUserRole('coach')
    }
  }

  const resetInactivityTimer = useCallback(() => {
    if (!user) return

    lastActivityRef.current = Date.now()
    setSessionExpired(false)

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }

    inactivityTimerRef.current = setTimeout(() => {
      setSessionExpired(true)
      const finalCountdown = 5 * 60 * 1000
      setTimeRemaining(finalCountdown)
      
      const countdownInterval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1000
          if (newTime <= 0) {
            clearInterval(countdownInterval)
            logout()
            return 0
          }
          return newTime
        })
      }, 1000)
    }, INACTIVITY_TIMEOUT)
  }, [user])

  const extendSession = useCallback(() => {
    if (!user) return
    
    resetInactivityTimer()
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sessionStartTime', Date.now().toString())
    }
    
    console.log('✅ Session étendue')
  }, [user, resetInactivityTimer])

  const initializeSession = useCallback(() => {
    if (!user) return

    if (typeof window !== 'undefined') {
      const existingStartTime = sessionStorage.getItem('sessionStartTime')
      if (!existingStartTime) {
        sessionStorage.setItem('sessionStartTime', Date.now().toString())
      }
      lastActivityRef.current = Date.now()
    }

    resetInactivityTimer()

    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current)
    }

    sessionTimerRef.current = setInterval(() => {
      if (typeof window !== 'undefined') {
        const sessionStartTime = sessionStorage.getItem('sessionStartTime')
        if (sessionStartTime) {
          const elapsed = Date.now() - parseInt(sessionStartTime, 10)
          const remaining = SESSION_DURATION - elapsed
          
          if (remaining <= 0) {
            setSessionExpired(true)
            setTimeRemaining(0)
            logout()
          } else if (!sessionExpired) {
            const inactivityElapsed = Date.now() - lastActivityRef.current
            if (inactivityElapsed < INACTIVITY_TIMEOUT) {
              setTimeRemaining(remaining)
            }
          }
        }
      }
    }, 1000)
  }, [user, sessionExpired, resetInactivityTimer])

  useEffect(() => {
    if (!user) return

    const handleActivity = () => {
      resetInactivityTimer()
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [user, resetInactivityTimer])

  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        setLoading(false)
        
        initializeSession()
        
        try {
          const userEmail = firebaseUser.email!
          
          const cacheKey = `userProfile_${userEmail}`
          const timestampKey = `userProfile_timestamp_${userEmail}`
          
          const cachedProfile = localStorage.getItem(cacheKey)
          const cachedTimestamp = localStorage.getItem(timestampKey)
          
          if (cachedProfile && cachedTimestamp) {
            const timestamp = parseInt(cachedTimestamp, 10)
            if (isCacheValid(timestamp)) {
              console.log('✅ Profil chargé depuis le cache')
              const coach = JSON.parse(cachedProfile)
              setUserProfile(coach)
              setUserRole(coach?.statut === 'admin' ? 'admin' : 'coach')
              
              fetchProfileFromAPI(userEmail, cacheKey, timestampKey).catch(error => {
                console.warn('⚠️ Échec de la mise à jour du profil en arrière-plan:', error)
              })
              return
            } else {
              localStorage.removeItem(cacheKey)
              localStorage.removeItem(timestampKey)
            }
          }
          
          console.log('💾 Chargement du profil depuis l\'API...')
          fetchProfileFromAPI(userEmail, cacheKey, timestampKey).catch(error => {
            console.error('Error fetching profile:', error)
            setUserRole('coach')
          })
          
        } catch (error) {
          console.error('Error fetching profile:', error)
          setUserRole('coach')
        }
      } else {
        setUserProfile(null)
        setUserRole(null)
        setLoading(false)
        setSessionExpired(false)
        setTimeRemaining(0)
        
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current)
        }
        if (sessionTimerRef.current) {
          clearInterval(sessionTimerRef.current)
        }
        
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('sessionStartTime')
        }
      }
    })

    return () => unsubscribe()
  }, [initializeSession])

  const logout = async () => {
    try {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
      }
      
      await signOut(auth)
      
      if (user?.email) {
        const cacheKey = `userProfile_${user.email}`
        const timestampKey = `userProfile_timestamp_${user.email}`
        localStorage.removeItem(cacheKey)
        localStorage.removeItem(timestampKey)
      }
      
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('sessionStartTime')
      }
      
      setUserProfile(null)
      setUserRole(null)
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