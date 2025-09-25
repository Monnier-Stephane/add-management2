'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Clock, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

export const SessionWarning = () => {
  const { sessionExpired, timeRemaining, extendSession } = useAuth()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (sessionExpired && timeRemaining > 0) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [sessionExpired, timeRemaining])

  if (!isVisible) return null

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Clock className="h-5 w-5 text-orange-600" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <p className="font-semibold text-orange-800 text-sm">
                Session expire dans {formatTime(timeRemaining)}
              </p>
              <p className="text-xs text-orange-600">
                Cliquez sur &quot;Étendre&quot; pour continuer
              </p>
            </div>
          </div>
          <Button
            onClick={extendSession}
            size="sm"
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Étendre
          </Button>
        </div>
      </div>
    </div>
  )
}
