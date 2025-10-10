'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

export const SessionExpiredModal = () => {
  const { sessionExpired, timeRemaining, extendSession, logout } = useAuth()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (sessionExpired && timeRemaining <= 0) {
      setShowModal(true)
    }
  }, [sessionExpired, timeRemaining])

  const handleExtendSession = () => {
    extendSession()
    setShowModal(false)
  }

  const handleLogout = () => {
    logout()
    setShowModal(false)
  }

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Session expirée
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            Votre session a expiré pour des raisons de sécurité. 
            Vous devez vous reconnecter pour continuer à utiliser l&apos;application.
          </p>
          
          <p className="text-sm text-gray-500">
            Note : Vos données de présence sont sauvegardées et seront disponibles 
            lors de votre prochaine connexion.
          </p>
          
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleExtendSession}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Se reconnecter
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex-1"
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
