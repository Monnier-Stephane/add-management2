'use client'
import { useAuth } from '@/lib/auth/AuthContext'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import StatsDashboard from '@/components/admin/StatsDashboard'
import CoachesList from '@/components/CoachesList'

export function Dashboard() {
  const { userRole } = useAuth()
  

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="text-sm text-gray-500">
            {userRole === 'admin' ? 'Administrateur' : 'Coach'}
          </div>
        </header>
        
        <main className="p-4">
          {userRole === 'admin' ? (
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