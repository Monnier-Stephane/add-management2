'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { StudentCategory } from '@/lib/utils/studentCategory'
import { EleveFicheDialog } from '@/components/eleve/EleveFicheDialog'

const cloudinaryThumb = (url: string, size = 96) =>
  url.replace(
    '/upload/',
    `/upload/w_${size},h_${size},c_fill,g_face,f_auto,q_auto/`,
  )

interface Student {
  id: string
  nom: string
  prenom: string
  present: boolean
  isTemporary?: boolean
  photoUrl?: string
  categorie?: StudentCategory
}

interface Course {
  id: string
  nom: string
  jour: string
  heure: string
  lieu: string
  coach: string
  eleves: Student[]
}

interface StudentItemProps {
  eleve: Student
  course: Course
  onPresenceChange: (courseId: string, studentId: string, present: boolean) => void
  onRemoveTemporaryStudent: (courseId: string, studentId: string) => void
  tousLesCours?: { id: string; nom: string; eleves: { id: string }[] }[]
}

export const StudentItem = ({
  eleve,
  course,
  onPresenceChange,
  onRemoveTemporaryStudent,
  tousLesCours = [],
}: StudentItemProps) => {
  const [ficheOuverte, setFicheOuverte] = useState(false)
  const coursAttribues = tousLesCours
    .filter((autre) => autre.eleves.some((item) => item.id === eleve.id))
    .map((autre) => autre.nom)
  const coursAffiches = coursAttribues.length > 0 ? coursAttribues : [course.nom]

  return (
    <>
      <div
  className={`student-row relative flex items-center justify-between rounded-lg border p-3 ${
    eleve.isTemporary
      ? 'border-orange-200 bg-orange-50'
      : eleve.categorie === 'adolescents'
        ? eleve.present
          ? 'border-l-4 border-l-sky-600 border-sky-300 bg-sky-100'
          : 'border-l-4 border-l-sky-600 border-sky-200 bg-sky-100'
        : eleve.categorie === 'adultes'
          ? eleve.present
            ? 'border-l-4 border-l-purple-700 border-purple-300 bg-purple-100'
            : 'border-l-4 border-l-purple-700 border-purple-200 bg-purple-100'
          : eleve.present
            ? 'border-emerald-200 bg-emerald-50'
            : ''
  }`}
>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={() => setFicheOuverte(true)}
            className="shrink-0 rounded-full"
            aria-label={`Voir la fiche de ${eleve.prenom} ${eleve.nom}`}
          >
            {eleve.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cloudinaryThumb(eleve.photoUrl)}
                alt=""
                loading="lazy"
                className="h-14 w-14 rounded-full border bg-gray-100 object-cover"
              />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full border bg-gray-100 text-xs font-medium text-gray-500">
                {eleve.prenom.charAt(0).toUpperCase()}
              </span>
            )}
          </button>
          <label
            htmlFor={`${course.id}-${eleve.id}`}
            className="min-w-0 flex-1 cursor-pointer text-xs font-medium leading-tight sm:text-base"
          >
            <span className="block truncate sm:whitespace-normal">{eleve.prenom}</span>
            <span className="block break-words">{eleve.nom}</span>
            {eleve.isTemporary && (
              <span className="text-xs font-normal text-orange-600">
                (élève en +)
              </span>
            )}
          </label>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Checkbox
            id={`${course.id}-${eleve.id}`}
            checked={eleve.present}
            onCheckedChange={(checked) =>
              onPresenceChange(course.id, eleve.id, checked as boolean)
            }
            style={{ border: '1px solid #111' }}
          />
          {eleve.isTemporary && (
            <Button
              variant="ghost"
              size="sm"
              aria-label="Retirer l'élève"
              onClick={() => onRemoveTemporaryStudent(course.id, eleve.id)}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <EleveFicheDialog
        eleve={ficheOuverte ? {
          prenom: eleve.prenom,
          nom: eleve.nom,
          photoUrl: eleve.photoUrl,
          categorie: eleve.categorie,
          cours: coursAffiches,
        } : null}
        onClose={() => setFicheOuverte(false)}
      />
    </>
  )
}
