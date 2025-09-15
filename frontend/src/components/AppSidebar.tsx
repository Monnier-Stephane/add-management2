'use client'
import { useAuth } from '@/lib/auth/AuthContext'
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Users,
  Calendar,
  ClipboardList,
  BarChart,
  Shield,
  Upload,
  TrendingUp,
  Home,
  LogOut
} from 'lucide-react'

export function AppSidebar() {
  const { user, userRole, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Erreur lors de la déconnexion', error)
    }
  }

  const menuItems = [
    {
      title: "Accueil",
      url: "/dashboard",
      icon: Home
    },
    {
      title: "Liste des adhérents",
      url: "/dashboard/students",
      icon: Users
    },
    {
      title: "Planning des cours",
      url: "/dashboard/planning",
      icon: Calendar
    },
    {
      title: "Feuilles d'appel",
      url: "/dashboard/attendance",
      icon: ClipboardList
    },
    {
      title: userRole === 'admin' ? 'Statistiques globales' : 'Mes statistiques',
      url: "/dashboard/my-stats",
      icon: BarChart
    }
  ]

  const adminItems = userRole === 'admin' ? [
    {
      title: "Gestion des coaches",
      url: "/dashboard/coaches",
      icon: Shield
    },
    {
      title: "Import CSV",
      url: "/dashboard/import",
      icon: Upload
    },
    {
      title: "Administration",
      url: "/dashboard/admin",
      icon: TrendingUp
    }
  ] : []

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">ADD</span>
          </div>
          <div>
            <h2 className="font-semibold text-sm">Académie</h2>
            <p className="text-xs text-gray-500">
              {userRole === 'admin' ? 'Administrateur' : 'Coach'}
            </p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item, index) => (
              <SidebarMenuItem key={index}>
                <SidebarMenuButton asChild>
                  <Link href={item.url} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarMenu>
              {adminItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>   
    </Sidebar>
  )
}
