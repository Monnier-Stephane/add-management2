'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'
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

function SignUpPage() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const router = useRouter()

  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    console.log('🔍 [DEBUG] handleSubmit appelé avec:', { email, password: '***' })
  
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
  
    try {
      setLoading(true)
      setError('')
      
      // 1. VÉRIFICATION FIRESTORE : Chercher l'email dans la collection allowedEmails
      try {
        const db = getFirestore();
        
        // Chercher dans la collection allowedEmails où le champ email = l'email saisi
        const allowedEmailsRef = collection(db, 'allowedEmails');
        const q = query(allowedEmailsRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError('Cette adresse e-mail n\'est pas autorisée à créer un compte. Contactez un administrateur.')
          return;
        }
        
      } catch (firestoreError) {
        console.error('Erreur lors de la vérification de l\'email:', firestoreError);
        setError('Erreur lors de la vérification de l\'email. Veuillez réessayer.')
        return;
      }
      
      // 2. CRÉATION DU COMPTE FIREBASE (seulement si autorisé)
      await createUserWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
      
    } catch (error: unknown) {
      console.error('Erreur lors de la création du compte:', error)
      
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/email-already-in-use') {
          setError('Cette adresse e-mail est déjà utilisée.')
        } else if (error.code === 'auth/weak-password') {
          setError('Le mot de passe est trop faible.')
        } else if (error.code === 'auth/invalid-email') {
          setError('Adresse e-mail invalide.')
        } else if (error.code === 'auth/operation-not-allowed') {
          setError('Cette adresse e-mail n\'est pas autorisée à créer un compte. Contactez un administrateur.')
        } else if (error.code === 'auth/domain-not-allowed') {
          setError('Ce domaine d\'email n\'est pas autorisé.')
        } else {
          setError('Une erreur est survenue lors de la création du compte.')
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
    return null 
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
                <Button type="submit" disabled={loading}>
  {loading ? 'Création du compte...' : "S'inscrire"}
</Button>
                </AnimatedFadeIn>
                <AnimatedFadeIn delay={0.5}>
                  <Button variant="link" size="sm">
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