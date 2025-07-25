// frontend/src/components/Dashboard.tsx
'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { AnimatedContainer } from '@/components/ui/animated-container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CsvUploader } from '@/components/CsvUploader';

type UserRole = 'admin' | 'coach'

export function Dashboard() {
  const { user } = useAuth()
  const [userRole, setUserRole] = useState<UserRole>('admin')
  
  
  useEffect(() => {
    if (user) {
     
      const role: UserRole = user.email?.includes('admin') ? 'admin' : 'coach'
      setUserRole(role)
    }
  }, [user])
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
      </div>
      
      <div className="mb-4">
        <p>Bonjour {user?.email || 'Utilisateur'}</p>
        <p>Rôle: {userRole}</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Common elements for admin and coach */}
        <AnimatedContainer delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle>Statistiques personnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Informations visibles par tous les utilisateurs</p>
            </CardContent>
          </Card>
        </AnimatedContainer>
        
        {/* Éléments administrateurs - maintenant visibles pour tous */}
        <AnimatedContainer delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle>Gestion des utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Section réservée aux administrateurs</p>
            </CardContent>
          </Card>
        </AnimatedContainer>
        
        <AnimatedContainer delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle>Rapports financiers</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Section réservée aux administrateurs</p>
            </CardContent>
          </Card>
        </AnimatedContainer>
      </div>
      <div className="mt-6">
        <CsvUploader />
      </div>
    </div>
  )
}