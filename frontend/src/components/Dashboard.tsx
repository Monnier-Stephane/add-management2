'use client'

import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/auth/AuthContext'
import CoachesList from '@/components/CoachesList'

const StatsDashboard = dynamic(
  () => import('@/components/admin/StatsDashboard'),
  { ssr: false }
)
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { checkAndUpdateCache } from '@/lib/cache/clearCache'

export function Dashboard() {
  const { userProfile, user, userRole, loading } = useAuth()
  const [isMounted, setIsMounted] = useState(false)
  
  // Log pour déboguer
  useEffect(() => {
  }, [loading, userProfile, userRole])
  
  useEffect(() => {
    setIsMounted(true)
    
    // Vérifier et mettre à jour le cache au chargement
    checkAndUpdateCache()
  }, [])
  
  // Éviter les erreurs d'hydratation en attendant que le composant soit monté
  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {userProfile?.prenom ? (
        <>
          <StatsDashboard />
          <CoachesList />
        </>
      ) : (
        <div className="flex items-center justify-center py-12">
          …
        </div>
      )}
    </>
  )
}