'use client'

import { AppSidebar } from '@/components/AppSidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SidebarInset } from '@/components/ui/sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth } from '@/lib/auth/AuthContext'
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, userRole } = useAuth()

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4">
  <SidebarTrigger className="-ml-1" />
  <div className="text-sm text-gray-500">
    Bonjour {userProfile?.prenom || user?.email || 'Utilisateur'}
    {userRole && (
      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
        {userRole}
      </span>
    )}
  </div>
</header>
          <main className="p-4">
            {children}   {/* ← pas StatsDashboard ici */}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}