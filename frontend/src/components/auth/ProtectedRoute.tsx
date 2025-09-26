'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

type ProtectedRouteProps = {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, profileLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user|| profileLoading) {
      router.push('/login')
    }
  }, [user, loading, router, profileLoading])

  if (loading || !user|| profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 