'use client'
import { useAuth } from '@/lib/auth/AuthContext'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import StatsDashboard from '@/components/admin/StatsDashboard'
import CoachesList from '@/components/CoachesList'
import { DailyCourseReminder } from '@/components/DailyCourseReminder'

import { Loader2 } from 'lucide-react'

export function Dashboard() {
  const { userProfile, profileLoading, user, userRole, loading } = useAuth()
  
  
  // Afficher le loader seulement si on charge encore l'utilisateur ou le profil
  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    )
  }
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="text-sm text-gray-500">
            Bonjour {userProfile?.prenom || userProfile?.nom || user?.email || 'Utilisateur'}
            {userRole && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{userRole}</span>}
          </div>
        </header>
        
        <main className="p-4">
         
          
          {/* Composant de rappel des cours */}
          <DailyCourseReminder />
          
         
          
          {/* Contenu conditionnel */}
          {user ? (
            <>
              {/* Statistiques pour tous */}
              <StatsDashboard />
              
              {/* Liste des coaches pour tous */}
              <CoachesList />
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-gray-600">Chargement de vos données...</p>
              </div>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}