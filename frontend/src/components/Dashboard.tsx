'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import StatsDashboard from '@/components/admin/StatsDashboard'
import CoachesList from '@/components/CoachesList'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { checkAndUpdateCache } from '@/lib/cache/clearCache'

export function Dashboard() {
  const { userProfile, user, userRole, loading } = useAuth()
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
    
    // 🚀 Exécuter en arrière-plan sans bloquer le rendu
    checkAndUpdateCache().catch(error => {
      console.warn('⚠️ Erreur lors de la vérification du cache:', error)
    })
  }, [])
  
  // ⚠️ Ne bloquer QUE si le composant n'est pas monté (éviter erreurs d'hydratation)
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  // 🚀 AFFICHER IMMÉDIATEMENT même si le profil n'est pas encore chargé
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="text-sm text-gray-500">
            {/* Afficher l'email immédiatement, puis le prénom quand disponible */}
            Bonjour {userProfile?.prenom || user?.email || 'Utilisateur'}
            {userRole && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {userRole}
              </span>
            )}
            {loading && !userProfile && (
              <span className="ml-2 text-xs text-gray-400">(chargement...)</span>
            )}
          </div>
        </header>
        
        <main className="p-4">
          {/* 🚀 Afficher le contenu immédiatement, même sans le profil complet */}
          {/* Les composants gèrent leur propre état de chargement */}
          <StatsDashboard />
          <CoachesList />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}