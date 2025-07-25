'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { auth } from '@/lib/auth/firebase'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AnimatedContainer, AnimatedFadeIn } from '@/components/ui/animated-container'

function SignInPage() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Veuillez remplir tous les champs.')
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Veuillez entrer une adresse e-mail valide.')
      return
    }

    try {
      setLoading(true)
      setError('')
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (error: unknown) {
      console.error(error)
      
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/invalid-credential') {
          setError('Email ou mot de passe incorrect.')
        } else if (error.code === 'auth/too-many-requests') {
          setError('Trop de tentatives. Veuillez réessayer plus tard.')
        } else {
          setError('Une erreur est survenue lors de la connexion.')
        }
      } else {
        setError('Une erreur inattendue est survenue.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid w-full grow items-center px-4 sm:justify-center mt-[100px]">
      <AnimatedContainer>
        <Card className="w-full sm:w-96">
          <CardHeader>
            <CardTitle>Se connecter à ADD Management</CardTitle>
            <CardDescription>Veuillez vous connecter pour continuer</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-y-4">
              <div className="h-px w-full bg-border" />

              <AnimatedFadeIn delay={0.1}>
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </AnimatedFadeIn>

              <AnimatedFadeIn delay={0.2}>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </AnimatedFadeIn>

              {error && (
                <AnimatedFadeIn>
                  <p className="text-sm text-red-600 font-medium">
                    {error}
                  </p>
                </AnimatedFadeIn>
              )}
            </CardContent>

            <CardFooter>
              <div className="grid w-full gap-y-4 mt-4">
                <AnimatedFadeIn delay={0.3}>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </Button>
                </AnimatedFadeIn>
                <AnimatedFadeIn delay={0.4}>
                  <Button variant="link" size="sm" asChild>
                    <Link href="/signup">
                      Vous n&apos;avez pas de compte ? Inscrivez-vous
                    </Link>
                  </Button>
                </AnimatedFadeIn>
              </div>
            </CardFooter>
          </form>
        </Card>
      </AnimatedContainer>
    </div>
  )
}

export { SignInPage }
