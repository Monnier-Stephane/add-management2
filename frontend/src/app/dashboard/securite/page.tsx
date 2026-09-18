'use client'

import { useState } from 'react'
import {
  multiFactor,
  TotpMultiFactorGenerator,
  sendEmailVerification,
  type TotpSecret,
} from 'firebase/auth'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SecuritePage() {
  const { user } = useAuth()
  const [qrUrl, setQrUrl] = useState('')
  const [otpUri, setOtpUri] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [secret, setSecret] = useState<TotpSecret | undefined>()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const dejaActive = user && multiFactor(user).enrolledFactors.length > 0

  const demarrerQr = async () => {
    if (!user) return
    setLoading(true)
    setMessage('')
    try {
      const session = await multiFactor(user).getSession()
      const totpSecret = await TotpMultiFactorGenerator.generateSecret(session)
      const uri = totpSecret.generateQrCodeUrl(user.email || '', 'ADD Management')
      setSecret(totpSecret)
      setOtpUri(uri)
      setSecretKey(totpSecret.secretKey)
      setQrUrl(
        `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(uri)}`,
      )
    } catch (e) {
      console.error(e)
      setMessage('Impossible de générer le QR. Es-tu bien connecté ?')
    } finally {
      setLoading(false)
    }
  }

  const confirmer = async () => {
    if (!user || !secret || !code.trim()) return
    setLoading(true)
    setMessage('')
    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(
        secret,
        code.trim(),
      )
      await multiFactor(user).enroll(assertion, 'Authenticator')
      setMessage('Double authentification activée.')
      setQrUrl('')
      setOtpUri('')
      setSecretKey('')
      setCode('')
    } catch (e) {
      console.error(e)
      setMessage('Code invalide. Réessaie avec le code actuel de l’app.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Double authentification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {dejaActive ? (
            <p>Authenticator est déjà lié à ce compte.</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Sur ordinateur : scanne le QR avec le téléphone. Sur smartphone :
                ouvre Authenticator via le lien, ou saisis la clé à la main. Puis
                entre le code à 6 chiffres.
              </p>

              {user && !user.emailVerified && (
  <div className="space-y-2 rounded-md border p-3 text-sm">
    <p>
      Confirme d’abord ton e-mail ({user.email}) pour pouvoir activer
      Authenticator.
    </p>
    <Button
      type="button"
      variant="outline"
      disabled={loading}
      onClick={async () => {
        if (!user) return
        setLoading(true)
        setMessage('')
        try {
          await sendEmailVerification(user)
          setMessage('E-mail envoyé. Ouvre le lien, puis recharge cette page.')
        } catch (e) {
          console.error(e)
          setMessage("Impossible d’envoyer l’e-mail. Réessaie dans quelques minutes.")
        } finally {
          setLoading(false)
        }
      }}
    >
      Envoyer l’e-mail de confirmation
    </Button>
  </div>
)}
              <Button onClick={demarrerQr} disabled={loading}>
                Afficher le QR code
              </Button>
              {qrUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrUrl} alt="QR Authenticator" width={220} height={220} />
              )}
              {otpUri && (
                <a href={otpUri} className="block text-sm text-blue-600 underline">
                  Ouvrir dans Authenticator (smartphone)
                </a>
              )}
              {secretKey && (
                <p className="text-sm break-all">
                  Ou saisis cette clé dans l’app : <strong>{secretKey}</strong>
                </p>
              )}
              {qrUrl && (
                <>
                  <div>
                    <Label htmlFor="code">Code à 6 chiffres</Label>
                    <Input
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      inputMode="numeric"
                      maxLength={6}
                    />
                  </div>
                  <Button onClick={confirmer} disabled={loading || code.length < 6}>
                    Activer
                  </Button>
                </>
              )}
            </>
          )}
          {message && <p className="text-sm">{message}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
