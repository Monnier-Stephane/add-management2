'use client'
import { useState } from 'react'
import Link from 'next/link'
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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from '@/lib/auth/firebase'

function SignUpPage() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs.')
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Veuillez entrer une adresse e-mail valide.')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    // API call or sign-up logic here
    setError('')
    console.log('Inscription avec :', { email, password })
  }

  return (
    <div className="grid w-full grow items-center px-4 sm:justify-center mt-[100px]">
      <AnimatedContainer>
        <Card className="w-full sm:w-96">
          <CardHeader>
            <CardTitle>Créer un compte ADD Management</CardTitle>
            <CardDescription>Inscrivez-vous pour accéder à la plateforme</CardDescription>
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

              <AnimatedFadeIn delay={0.3}>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setConfirmPassword(e.target.value)
                    }
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
                <AnimatedFadeIn delay={0.4}>
                  <Button type="submit">S&apos;inscrire</Button>
                </AnimatedFadeIn>
                <AnimatedFadeIn delay={0.5}>
                  <Button variant="link" size="sm" asChild>
                    <Link href="/login">
                      Vous avez déjà un compte ? Connectez-vous
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

export { SignUpPage }
