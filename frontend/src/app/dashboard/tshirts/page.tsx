'use client'

import {  useEffect,useRef,useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth/AuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api/api'
import { useSubscriptions, type Subscription } from '@/lib/hooks/useSubscriptions'
import { coursesStructure, filterStudentsForCourse } from '@/lib/utils/courseGroups'

const cloudinaryThumb = (url: string, size = 96) =>
  url.replace(
    '/upload/',
    `/upload/w_${size},h_${size},c_fill,g_face,f_auto,q_auto/`,
  )

export default function TshirtsPage() {
  const queryClient = useQueryClient()
  const { userRole } = useAuth()
const { data: stock } = useQuery({
  queryKey: ['tshirt-stock'],
  queryFn: () =>
    api.get<{ taille: string; quantiteRecue: number }[]>('/tshirts/stock'),
})

const enregistrerStock = async (taille: string, quantiteRecue: number) => {
  setSaveError(null)
  try {
    await api.put('/tshirts/stock', { taille, quantiteRecue })
    await queryClient.invalidateQueries({ queryKey: ['tshirt-stock'] })
  } catch (err) {
    setSaveError(err instanceof Error ? err.message : 'Stock non enregistré')
  }
}
  const { data: subscriptions, isLoading, error } = useSubscriptions()
  const [selectedDay, setSelectedDay] = useState('Samedi')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [titreColle, setTitreColle] = useState(false)
  const [loupeId, setLoupeId] = useState<string | null>(null)
const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

const startHold = (id: string, photoUrl?: string) => {
  if (!photoUrl) return
  holdTimer.current = setTimeout(() => setLoupeId(id), 400)
}

const endHold = () => {
  if (holdTimer.current) {
    clearTimeout(holdTimer.current)
    holdTimer.current = null
  }
  setLoupeId(null)
}


useEffect(() => {
  const onScroll = () => setTitreColle(window.scrollY > 8)
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  return () => window.removeEventListener('scroll', onScroll)
}, [])

  const handleToggle = async (id: string, recu: boolean) => {
    setSavingId(id)
    setSaveError(null)
    const previous = queryClient.getQueryData<Subscription[]>(['subscriptions'])
    queryClient.setQueryData<Subscription[]>(['subscriptions'], (current) =>
      current?.map((eleve) =>
        eleve._id === id ? { ...eleve, tshirtDistribue: recu } : eleve,
      ),
    )

    try {
      const updated = await api.patch<Subscription>(`/subscriptions/${id}/tshirt`, {
        tshirtDistribue: recu,
      })
      if (updated.tshirtDistribue !== recu) {
        queryClient.setQueryData(['subscriptions'], previous)
        setSaveError('Le serveur n’a pas enregistré le coche. Relance le backend.')
      }
    } catch (err) {
      queryClient.setQueryData(['subscriptions'], previous)
      setSaveError(err instanceof Error ? err.message : 'Enregistrement impossible')
    } finally {
      setSavingId(null)
    }
  }

  const handleTaille = async (id: string, tailleTshirt: string) => {
    setSavingId(id)
    setSaveError(null)
    const previous = queryClient.getQueryData<Subscription[]>(['subscriptions'])
    queryClient.setQueryData<Subscription[]>(['subscriptions'], (current) =>
      current?.map((eleve) =>
        eleve._id === id ? { ...eleve, tailleTshirt } : eleve,
      ),
    )
  
    try {
      await api.patch(`/subscriptions/${id}/tshirt`, { tailleTshirt })
    } catch (err) {
      queryClient.setQueryData(['subscriptions'], previous)
      setSaveError(err instanceof Error ? err.message : 'Enregistrement impossible')
    } finally {
      setSavingId(null)
    }
  }

  if (isLoading) return <div className="p-4">Chargement...</div>
  if (error) return <div className="p-4">Erreur: {error.message}</div>

  const liste = subscriptions ?? []
  const parId = new Map(liste.map((eleve) => [eleve._id, eleve]))
  const donnes = liste.filter((e) => e.tshirtDistribue).length

  const tailles = Array.from(
    new Set(liste.map((e) => e.tailleTshirt).filter((t): t is string => Boolean(t))),
  ).sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }))

  const cours = coursesStructure.map((course) => ({
    ...course,
    eleves: filterStudentsForCourse(course, liste).map((eleve) => {
      const fiche = parId.get(eleve.id)
      return {
        ...eleve,
        tailleTshirt: fiche?.tailleTshirt,
        tshirtDistribue: fiche?.tshirtDistribue ?? false,
      }
    }),
  }))

  const parJour = cours.reduce<Record<string, typeof cours>>((acc, course) => {
    acc[course.jour] = acc[course.jour] ?? []
    acc[course.jour].push(course)
    return acc
  }, {})

  return (
    <div className="container mx-auto px-2 py-4">
      <div className={`sticky top-0 z-30 -mx-2 mb-4 bg-white px-3 py-3 ${titreColle ? 'border-b border-emerald-200 bg-emerald-50' : ''}`}>
  <h1 className={`text-2xl font-bold md:text-3xl ${titreColle ? 'text-emerald-900' : ''}`}>
    Distribution des tee-shirts
  </h1>
</div>
      <p className="mb-6 text-gray-600">
        {donnes} donné{donnes > 1 ? 's' : ''} sur {liste.length}
      </p>
      {saveError && <p className="mb-4 text-sm text-red-600">{saveError}</p>}

      <table className="mb-8 w-full max-w-lg text-sm">
  <thead>
    <tr className="text-left text-gray-500">
      <th className="py-1">Taille</th>
      <th>Reçus</th>
      <th>Distribués</th>
      <th>Restants</th>
    </tr>
  </thead>
  <tbody>
    {tailles.map((taille) => {
      const recus =
        stock?.find((ligne) => ligne.taille === taille)?.quantiteRecue ?? 0
      const distribues = liste.filter(
        (eleve) => eleve.tshirtDistribue && eleve.tailleTshirt === taille,
      ).length
      return (
        <tr key={taille} className="border-t">
          <td className="py-2">{taille}</td>
          <td>
            {userRole === 'admin' ? (
              <input
              type="number"
              min={0}
              defaultValue={recus}
              key={`${taille}-${recus}`}
              className="w-20 rounded px-2 py-1"
              style={{
                border: '2px solid #059669',
                backgroundColor: '#ecfdf5',
              }}
              onBlur={(event) =>
                enregistrerStock(taille, Number(event.target.value))
              }
            />
            ) : (
              recus
            )}
          </td>
          <td>{distribues}</td>
          <td>{recus - distribues}</td>
        </tr>
      )
    })}
  </tbody>
</table>

      <Tabs value={selectedDay} onValueChange={setSelectedDay}>
        <TabsList className="grid h-auto w-full grid-cols-5 gap-1">
          {Object.keys(parJour).map((jour) => (
            <TabsTrigger key={jour} value={jour} className="px-1 text-[11px] sm:text-sm">
              {jour}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(parJour).map(([jour, coursDuJour]) => {
  const coursOuvert = coursDuJour.some((course) => course.id === selectedCourseId)
    ? selectedCourseId
    : coursDuJour[0]?.id ?? ''

  const listeDuCours = (course: (typeof coursDuJour)[number]) => (
    <section key={course.id}>
      <h2 className="mb-2 font-semibold">
        {course.nom} — {course.lieu}
        <span className="ml-2 text-sm font-normal text-gray-500">
          {course.eleves.filter((e) => e.tshirtDistribue).length}/{course.eleves.length}
        </span>
      </h2>
      <ul className="space-y-2">
        {course.eleves.map((eleve) => (
          <li
            key={eleve.id}
            className={`flex items-center gap-3 rounded-lg border p-3 ${
              eleve.tshirtDistribue ? 'border-emerald-300 bg-emerald-50' : 'bg-white'
            }`}
          >

{eleve.photoUrl ? (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={cloudinaryThumb(eleve.photoUrl)}
    alt=""
    loading="lazy"
    onPointerDown={() => startHold(eleve.id, eleve.photoUrl)}
    onPointerUp={endHold}
    onPointerCancel={endHold}
    onPointerLeave={endHold}
    onContextMenu={(event) => event.preventDefault()}
    className="h-14 w-14 shrink-0 rounded-full object-cover border bg-gray-100 select-none touch-none"
  />
) : (
  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border bg-gray-100 text-xs font-medium text-gray-500">
    {eleve.prenom.charAt(0).toUpperCase()}
  </div>
)}
{loupeId === eleve.id && eleve.photoUrl && (
  <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={cloudinaryThumb(eleve.photoUrl, 400)}
      alt={eleve.prenom}
      className="h-48 w-48 rounded-full border-4 border-white object-cover shadow-xl"
    />
  </div>
)}
            <input
              type="checkbox"
              checked={Boolean(eleve.tshirtDistribue)}
              disabled={savingId === eleve.id}
              onChange={(event) =>
                handleToggle(eleve.id, event.target.checked)
              }
              aria-label={`Tee-shirt de ${eleve.prenom} ${eleve.nom}`}
              style={{
                width: 22,
                height: 22,
                flexShrink: 0,
                accentColor: '#059669',
              }}
            />
            <button
              type="button"
              disabled={savingId === eleve.id}
              onClick={() =>
                handleToggle(eleve.id, !eleve.tshirtDistribue)
              }
              className="min-w-0 flex-1 text-left"
            >
              {eleve.prenom} {eleve.nom}
            </button>
            <select
              value={eleve.tailleTshirt || ''}
              disabled={savingId === eleve.id}
              onChange={(e) => handleTaille(eleve.id, e.target.value)}
              className="rounded bg-white px-2 py-1 text-sm"
              style={{ border: '1px solid #6b7280' }}
            >
              {!eleve.tailleTshirt && <option value="">—</option>}
              {tailles.map((taille) => (
                <option key={taille} value={taille}>
                  {taille}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </section>
  )

  return (
    <TabsContent key={jour} value={jour} className="space-y-6">
      {coursDuJour.length > 1 ? (
        <Tabs value={coursOuvert} onValueChange={setSelectedCourseId}>
          <TabsList className="mb-4 flex h-auto w-full flex-wrap gap-1">
            {coursDuJour.map((course) => (
              <TabsTrigger key={course.id} value={course.id} className="text-xs sm:text-sm">
                {course.heure} — {course.lieu}
              </TabsTrigger>
            ))}
          </TabsList>
          {coursDuJour.map((course) => (
            <TabsContent key={course.id} value={course.id}>
              {listeDuCours(course)}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        coursDuJour.map((course) => listeDuCours(course))
      )}
    </TabsContent>
  )
})}
      </Tabs>
    </div>
  )
}