'use client'

import { useRef, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

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
}

export const StudentItem = ({
  eleve,
  course,
  onPresenceChange,
  onRemoveTemporaryStudent,
}: StudentItemProps) => {
  const [loupe, setLoupe] = useState(false)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startHold = () => {
    if (!eleve.photoUrl) return
    holdTimer.current = setTimeout(() => setLoupe(true), 400)
  }

  const endHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
    setLoupe(false)
  }

  return (
    <>
      <div
        className={`flex items-center justify-between p-3 border rounded-lg ${
          eleve.isTemporary ? 'bg-orange-50 border-orange-200' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          {eleve.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cloudinaryThumb(eleve.photoUrl)}
              alt=""
              loading="lazy"
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerCancel={endHold}
              onPointerLeave={endHold}
              onContextMenu={(e) => e.preventDefault()}
              className="h-16 w-16 shrink-0 rounded-full object-cover border bg-gray-100 select-none touch-none"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border bg-gray-100 text-xs font-medium text-gray-500">
              {eleve.prenom.charAt(0).toUpperCase()}
            </div>
          )}
          <Checkbox
            id={`${course.id}-${eleve.id}`}
            checked={eleve.present}
            onCheckedChange={(checked) =>
              onPresenceChange(course.id, eleve.id, checked as boolean)
            }
          />
          <label
            htmlFor={`${course.id}-${eleve.id}`}
            className="font-medium cursor-pointer"
          >
            {eleve.prenom} {eleve.nom}
            {eleve.isTemporary && (
              <span className="ml-2 text-xs text-orange-600 font-normal">
                (élève en +)
              </span>
            )}
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={eleve.present ? 'default' : 'secondary'}>
            {eleve.present ? 'Présent' : 'Absent'}
          </Badge>
          {eleve.isTemporary && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveTemporaryStudent(course.id, eleve.id)}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {loupe && eleve.photoUrl && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cloudinaryThumb(eleve.photoUrl, 400)}
            alt={eleve.prenom}
            className="h-48 w-48 rounded-full border-4 border-white object-cover shadow-xl"
          />
        </div>
      )}
    </>
  )
}
