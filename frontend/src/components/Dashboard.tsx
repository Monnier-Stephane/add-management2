'use client'
import { useAuth } from '@/lib/auth/AuthContext'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import StatsDashboard from '@/components/admin/StatsDashboard'
import CoachesList from '@/components/CoachesList'
import { Loader2 } from 'lucide-react'

export function Dashboard() {
  const { userProfile, profileLoading } = useAuth()
  
  if (profileLoading) {
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
            Bonjour {userProfile?.prenom || 'Utilisateur'}
          </div>
        </header>
        
        <main className="p-4">
          {userProfile?.prenom ? (
            <>
            <StatsDashboard />
            <CoachesList />
            </>
          ) : (
            <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">Bienvenue sur votre tableau de bord</h2>
            <p className="text-gray-600">
              Utilisez la barre latérale pour naviguer dans les différentes sections.
            </p>
          </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}