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
  logout: () => Promise<void> // 👈 Ajout de la fonction logout
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

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  
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
          const response = await fetch(`http://localhost:3001/coaches/by-email/${encodeURIComponent(firebaseUser.email!)}`);
          
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
      } else {
        setUserProfile(null);
        setUserRole(null);
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])


  const logout = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, userRole, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
} 