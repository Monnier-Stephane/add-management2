'use client'

import type { StudentCategory } from '@/lib/utils/studentCategory'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const categorieLabel: Record<StudentCategory, string> = {
  enfants: 'Enfant',
  adolescents: 'Adolescent',
  adultes: 'Adulte',
}

const cloudinaryThumb = (url: string, size = 96) =>
  url.replace(
    '/upload/',
    `/upload/w_${size},h_${size},c_fill,g_face,f_auto,q_auto/`,
  )

export type EleveFiche = {
  prenom: string
  nom: string
  photoUrl?: string
  categorie?: StudentCategory
  cours: string[]
}

export function EleveFicheDialog({
  eleve,
  onClose,
}: {
  eleve: EleveFiche | null
  onClose: () => void
}) {
  return (
    <Dialog open={eleve !== null} onOpenChange={(ouvert) => { if (!ouvert) onClose() }}>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto rounded-xl p-0 sm:max-w-md [&>button]:rounded-full [&>button]:bg-white/90">
        {eleve && (
          <Card className="gap-4 border-0 py-0 shadow-none">
            <DialogTitle className="sr-only">{eleve.prenom} {eleve.nom}</DialogTitle>
            <CardContent className="px-0">
              {eleve.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cloudinaryThumb(eleve.photoUrl, 800)}
                  alt=""
                  className="aspect-video h-52 w-full rounded-t-xl object-cover"
                />
              ) : (
                <div className="flex aspect-video h-52 w-full items-center justify-center rounded-t-xl bg-gray-200 text-4xl font-medium text-gray-600">
                  {(eleve.prenom[0] ?? '?').toUpperCase()}
                </div>
              )}
            </CardContent>
            <CardHeader>
              <CardTitle>{eleve.prenom} {eleve.nom}</CardTitle>
              <CardDescription className="underline">
                Catégorie : {categorieLabel[eleve.categorie ?? 'enfants']}
              </CardDescription>
              <p className="text-sm text-muted-foreground">
                {eleve.cours.length > 1 ? 'Cours attribués' : 'Cours attribué'}
              </p>
            </CardHeader>
            <ul className="space-y-2 px-6 pb-6">
              {eleve.cours.map((nom) => (
                <li key={nom} className="border-b pb-2 text-sm">{nom}</li>
              ))}
            </ul>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}
