'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
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
  const [forgotPassword, setForgotPassword] = useState(false)
const [resetEmail, setResetEmail] = useState('')
const [resetMessage, setResetMessage] = useState('')
  const router = useRouter()


  const { user, loading: authLoading, profileLoading } = useAuth()

  useEffect(() => {
    if (user && !authLoading && !profileLoading) {
      // Attendre que le profil soit chargé avant de rediriger
      const timer = setTimeout(() => {
        router.push('/dashboard')
      }, 100) // Petit délai pour éviter les conflits
      
      return () => clearTimeout(timer)
    }
  }, [user, authLoading, profileLoading, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  
    if (forgotPassword) {
      await handleForgotPassword(e)
      return
    }
  
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
      console.log('🔐 [SIGN-IN] Début de la connexion Firebase pour:', email)
      await signInWithEmailAndPassword(auth, email, password)
      console.log('✅ [SIGN-IN] Connexion Firebase réussie, redirection vers dashboard')
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

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!resetEmail) {
      setError('Veuillez entrer votre adresse e-mail.')
      return
    }
  
    if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      setError('Veuillez entrer une adresse e-mail valide.')
      return
    }
  
    try {
      setLoading(true)
      setError('')
      await sendPasswordResetEmail(auth, resetEmail)
      setResetMessage('Un e-mail de réinitialisation a été envoyé. Vérifiez votre boîte de réception.')
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/user-not-found') {
          setError('Aucun compte trouvé avec cette adresse e-mail.')
        } else {
          setError('Une erreur est survenue lors de l\'envoi de l\'e-mail.')
        }
      } else {
        setError('Une erreur inattendue est survenue.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="grid w-full grow items-center px-4 sm:justify-center mt-[100px]">
        <AnimatedContainer>
          <Card className="w-full sm:w-96">
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Vérification de l&apos;authentification...</p>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      </div>
    )
  }
  
  if (user) {
    return null // L'utilisateur sera redirigé par useEffect
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

  {!forgotPassword ? (
    // Formulaire de connexion existant
    <>
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
    </>
  ) : (
    // Formulaire de réinitialisation
    <>
      <AnimatedFadeIn delay={0.1}>
        <div className="space-y-2">
          <Label htmlFor="resetEmail">Adresse e-mail</Label>
          <Input
            id="resetEmail"
            type="email"
            value={resetEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResetEmail(e.target.value)}
            placeholder="Entrez votre adresse e-mail"
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

      {resetMessage && (
        <AnimatedFadeIn>
          <p className="text-sm text-green-600 font-medium">
            {resetMessage}
          </p>
        </AnimatedFadeIn>
      )}
    </>
  )}
</CardContent>

<CardFooter>
  <div className="grid w-full gap-y-4 mt-4">
    <AnimatedFadeIn delay={0.3}>
      <Button type="submit" disabled={loading}>
        {loading ? 'Envoi...' : forgotPassword ? 'Envoyer l\'e-mail' : 'Se connecter'}
      </Button>
    </AnimatedFadeIn>
    
    <AnimatedFadeIn delay={0.4}>
      {!forgotPassword ? (
        <div className="space-y-2">
          <Button 
            variant="link" 
            size="sm" 
            type="button"
            onClick={() => setForgotPassword(true)}
          >
            Mot de passe oublié ?
          </Button>
          <Button variant="link" size="sm">
            <Link href="/signup">
              Vous n&apos;avez pas de compte ? Inscrivez-vous
            </Link>
          </Button>
        </div>
      ) : (
        <Button 
          variant="link" 
          size="sm" 
          type="button"
          onClick={() => {
            setForgotPassword(false)
            setResetEmail('')
            setResetMessage('')
            setError('')
          }}
        >
          ← Retour à la connexion
        </Button>
      )}
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
