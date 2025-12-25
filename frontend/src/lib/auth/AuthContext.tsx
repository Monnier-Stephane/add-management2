'use client'

import { createContext, useEffect, useState, useContext } from 'react'
import { User, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/api'

type UserRole = 'coach' | 'admin'

type AuthContextType = {
  user: User | null
  userProfile: { statut: string; nom: string; prenom: string; email: string } | null
  userRole: UserRole | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  userRole: null,
  loading: true,
  logout: async () => {},
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
  const router = useRouter()

  useEffect(() => {
    let isMounted = true
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return
      
      setUser(firebaseUser)
      
      if (firebaseUser) {
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
        if (isMounted) {
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

  const logout = async () => {
    try {
      await signOut(auth)
      setUserProfile(null)
      setUserRole(null)
      router.push('/login')
    } catch {
      // Erreur silencieuse lors de la déconnexion
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      userRole, 
      loading, 
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}