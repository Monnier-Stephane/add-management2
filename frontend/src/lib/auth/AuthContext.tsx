'use client'

import { createContext, useEffect, useState, useContext } from 'react'
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        try {
          // Récupérer le profil depuis l'API
          const apiUrl = process.env.NEXT_PUBLIC_API_URL
          if (!apiUrl) {
            console.error('NEXT_PUBLIC_API_URL not configured')
            setUserRole('coach')
            return
          }

          const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
          const response = await fetch(`${cleanApiUrl}/coaches/by-email/${encodeURIComponent(firebaseUser.email!)}`)
          
          if (response.ok) {
            const coach = await response.json()
            setUserProfile(coach)
            setUserRole(coach?.statut === 'admin' ? 'admin' : 'coach')
          } else {
            setUserRole('coach')
          }
        } catch (error) {
          console.error('Error fetching profile:', error)
          setUserRole('coach')
        }
      } else {
        setUserProfile(null)
        setUserRole(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const logout = async () => {
    try {
      await signOut(auth)
      setUserProfile(null)
      setUserRole(null)
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
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}