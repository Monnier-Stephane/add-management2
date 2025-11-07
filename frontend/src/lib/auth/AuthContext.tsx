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

// Durée du cache : 1 heure (3600000 ms)
const CACHE_DURATION = 60 * 60 * 1000

// Fonction pour vérifier si le cache est valide
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
  const router = useRouter()

  // Fonction helper pour récupérer le profil depuis l'API
  // Déplacée AVANT le useEffect pour éviter les problèmes de scope
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
      
      // 💾 Sauvegarder dans le cache
      localStorage.setItem(cacheKey, JSON.stringify(coach))
      localStorage.setItem(timestampKey, Date.now().toString())
      console.log('✅ Profil sauvegardé dans le cache')
    } else {
      setUserRole('coach')
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        // 🚀 Définir loading à false IMMÉDIATEMENT pour afficher l'interface
        // Le profil se chargera en arrière-plan
        setLoading(false)
        
        try {
          const userEmail = firebaseUser.email!
          
          // 🚀 ÉTAPE 1 : Vérifier le cache localStorage
          const cacheKey = `userProfile_${userEmail}`
          const timestampKey = `userProfile_timestamp_${userEmail}`
          
          const cachedProfile = localStorage.getItem(cacheKey)
          const cachedTimestamp = localStorage.getItem(timestampKey)
          
          // Si le cache existe et est valide, l'utiliser immédiatement
          if (cachedProfile && cachedTimestamp) {
            const timestamp = parseInt(cachedTimestamp, 10)
            if (isCacheValid(timestamp)) {
              console.log('✅ Profil chargé depuis le cache')
              const coach = JSON.parse(cachedProfile)
              setUserProfile(coach)
              setUserRole(coach?.statut === 'admin' ? 'admin' : 'coach')
              
              // �� Charger en arrière-plan pour mettre à jour le cache
              fetchProfileFromAPI(userEmail, cacheKey, timestampKey).catch(error => {
                console.warn('⚠️ Échec de la mise à jour du profil en arrière-plan:', error)
              })
              return
            } else {
              // Cache expiré, le supprimer
              localStorage.removeItem(cacheKey)
              localStorage.removeItem(timestampKey)
            }
          }
          
          // 🚀 ÉTAPE 2 : Pas de cache valide, récupérer depuis l'API
          // (en arrière-plan, sans bloquer l'interface)
          console.log('�� Chargement du profil depuis l\'API...')
          fetchProfileFromAPI(userEmail, cacheKey, timestampKey).catch(error => {
            console.error('Error fetching profile:', error)
            setUserRole('coach')
          })
          
        } catch (error) {
          console.error('Error fetching profile:', error)
          setUserRole('coach')
        }
      } else {
        // Utilisateur déconnecté, nettoyer le cache
        setUserProfile(null)
        setUserRole(null)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const logout = async () => {
    try {
      await signOut(auth)
      
      // 🧹 Nettoyer le cache lors de la déconnexion
      if (user?.email) {
        const cacheKey = `userProfile_${user.email}`
        const timestampKey = `userProfile_timestamp_${user.email}`
        localStorage.removeItem(cacheKey)
        localStorage.removeItem(timestampKey)
      }
      
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