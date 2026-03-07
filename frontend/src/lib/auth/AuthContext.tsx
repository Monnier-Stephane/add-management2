'use client'

import { createContext, useEffect, useState, useContext, useRef } from 'react'
import { User, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/api'

const SESSION_DURATION_MS = 60 * 60 * 1000 
const SESSION_STORAGE_KEY = 'sessionStartTime'

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<{ statut: string; nom: string; prenom: string; email: string } | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const router = useRouter()
  const logoutRef = useRef<() => Promise<void>>(() => Promise.resolve())

  useEffect(() => {
    let isMounted = true
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return
      
      setUser(firebaseUser)
      
      if (firebaseUser) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(SESSION_STORAGE_KEY, String(Date.now()))
          setSessionExpired(false)
          setTimeRemaining(SESSION_DURATION_MS)
        }
        setLoading(true)
        try {
          const emailToSearch = firebaseUser.email!
          
          try {
            // Essayer d'abord l'endpoint spécifique
            const coach = await api.get<any>(`/coaches/by-email/${encodeURIComponent(emailToSearch)}`)
            
            if (coach && typeof coach === 'object' && !Array.isArray(coach)) {
              if (isMounted) {
                setUserProfile(coach)
                setUserRole(coach?.statut === 'admin' ? 'admin' : 'coach')
                setLoading(false)
              }
              return
            }
          } catch {
            // Si l'endpoint spécifique échoue, essayer la liste complète
          }
          
          // Fallback : récupérer la liste des coaches pour comparer
          try {
            const allCoaches = await api.get<any[]>('/coaches')
            interface Coach {
              _id?: string;
              email?: string;
              prenom?: string;
              nom?: string;
              statut?: string;
              telephone?: string;
            }
            const matchingCoach = allCoaches.find((c: Coach) => 
              c.email?.toLowerCase() === emailToSearch.toLowerCase()
            )
            
            if (matchingCoach) {
              if (isMounted) {
                setUserProfile({
                  email: matchingCoach.email || '',
                  prenom: matchingCoach.prenom || '',
                  nom: matchingCoach.nom || '',
                  statut: matchingCoach.statut || 'coach'
                })
                setUserRole(matchingCoach.statut === 'admin' ? 'admin' : 'coach')
                setLoading(false)
              }
              return
            }
          } catch {
            // Erreur silencieuse lors de la récupération de la liste
          }
          
          // Par défaut, assigner le rôle coach
          if (isMounted) {
            setUserRole('coach')
            setLoading(false)
          }
        } catch {
          if (isMounted) {
            setUserRole('coach')
            setLoading(false)
          }
        }
      } else {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(SESSION_STORAGE_KEY)
        }
        if (isMounted) {
          setSessionExpired(false)
          setTimeRemaining(0)
          setUserProfile(null)
          setUserRole(null)
          setLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  // Timer : chaque seconde, on recalcule le temps restant et on déconnecte si la session est expirée
  useEffect(() => {
    if (!user) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
      }
      setSessionExpired(false)
      setTimeRemaining(0)
      return
    }

    let intervalId: ReturnType<typeof setInterval> | null = null

    const tick = () => {
      if (typeof window === 'undefined') return
      const start = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (!start) return
      const elapsed = Date.now() - Number(start)
      const remaining = SESSION_DURATION_MS - elapsed
      if (remaining <= 0) {
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
        setSessionExpired(true)
        setTimeRemaining(0)
        logoutRef.current()
      } else {
        setSessionExpired(false)
        setTimeRemaining(remaining)
      }
    }

    tick()
    intervalId = setInterval(tick, 1000)
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [user])

  const extendSession = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, String(Date.now()))
    }
    setSessionExpired(false)
    setTimeRemaining(SESSION_DURATION_MS)
  }

  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
      }
      await signOut(auth)
      setUserProfile(null)
      setUserRole(null)
      router.push('/login')
    } catch {
      // Erreur silencieuse lors de la déconnexion
    }
  }

  logoutRef.current = logout

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      userRole, 
      loading, 
      sessionExpired,
      timeRemaining,
      extendSession, 
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}