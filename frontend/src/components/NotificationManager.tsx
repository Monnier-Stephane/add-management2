'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export function NotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Ce navigateur ne supporte pas les notifications')
      return
    }

    const permission = await Notification.requestPermission()
    setPermission(permission)

    if (permission === 'granted') {
      await subscribeToNotifications()
    }
  }

  const subscribeToNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      })
      
      setSubscription(subscription)
      
      // Envoyer la subscription au serveur
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      })
      
      
    } catch (error) {
      console.error('❌ Erreur abonnement:', error)
    }
  }

  const sendTestNotification = async () => {
    if (permission === 'granted') {
      new Notification('Test ADD Management', {
        body: 'Ceci est une notification de test',
        icon: '/icon-192.png'
      })
    }
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Les notifications ne sont pas supportées sur ce navigateur</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-semibold text-blue-900 mb-2">Notifications</h3>
      
      {permission === 'default' && (
        <div className="space-y-2">
          <p className="text-blue-800 text-sm">Activez les notifications pour recevoir des rappels de cours</p>
          <Button onClick={requestPermission} size="sm">
            Activer les notifications
          </Button>
        </div>
      )}

      {permission === 'granted' && (
        <div className="space-y-2">
          <p className="text-green-800 text-sm">✅ Notifications activées</p>
          <div className="flex gap-2">
            <Button onClick={sendTestNotification} size="sm" variant="outline">
              Test notification
            </Button>
            {subscription && (
              <Button onClick={() => setSubscription(null)} size="sm" variant="outline">
                Désabonner
              </Button>
            )}
          </div>
        </div>
      )}

      {permission === 'denied' && (
        <div className="space-y-2">
          <p className="text-red-800 text-sm">❌ Notifications bloquées</p>
          <p className="text-red-600 text-xs">
            Activez les notifications dans les paramètres du navigateur
          </p>
        </div>
      )}
    </div>
  )
}