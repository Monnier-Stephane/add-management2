'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Navbar() {
  const { user, logout, sessionExpired, timeRemaining } = useAuth()
  
  // Calculer le temps restant total de la session
  const getSessionTimeRemaining = () => {
    if (typeof window === 'undefined') return 0
    const sessionStartTime = sessionStorage.getItem('sessionStartTime')
    if (!sessionStartTime) return 0
    
    const elapsed = Date.now() - parseInt(sessionStartTime)
    const totalSessionTime = 60 * 60 * 1000 // 1 heure
    const remaining = totalSessionTime - elapsed
    return Math.max(0, remaining)
  }
  
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0)
  
  useEffect(() => {
    if (user && !sessionExpired) {
      const updateTimer = () => {
        setSessionTimeRemaining(getSessionTimeRemaining())
      }
      
      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      
      return () => clearInterval(interval)
    }
  }, [user, sessionExpired])
  
  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Erreur lors de la déconnexion', error)
    }
  }

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className='md:ml-[200px]'>
    
        <Link href="/" className="text-xl font-bold">
          <Image src="/logo_add.png" alt="Logo" width={100} height={100} priority />
        </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Indicateur de session discret */}
              {sessionTimeRemaining > 0 && !sessionExpired && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {Math.floor(sessionTimeRemaining / 60000)}:{(Math.floor((sessionTimeRemaining % 60000) / 1000)).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
              
              {/* Alerte de session expirée */}
              {sessionExpired && timeRemaining > 0 && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-3 py-1 text-orange-700 text-sm">
                  <div className="relative">
                    <Clock className="h-4 w-4" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  </div>
                  <span className="font-medium">
                    {Math.floor(timeRemaining / 60000)}:{(Math.floor((timeRemaining % 60000) / 1000)).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
              
              <Button variant="outline" onClick={handleLogout}>
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Connexion</Button>
              </Link>
              <Link href="/signup">
                <Button>Créer un compte</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
