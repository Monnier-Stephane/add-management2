'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export function Navbar() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Erreur lors de la déconnexion', error)
    }
  }

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          <Image src="/logo_add.png" alt="Logo" width={100} height={100} />
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Button variant="outline" onClick={handleLogout}>
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Connexion</Button>
              </Link>
              <Link href="/signup">
                <Button>Créer un compte</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
