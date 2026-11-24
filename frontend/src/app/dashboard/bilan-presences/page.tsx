'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { api } from '@/lib/api/api'
import { useSubscriptions, type Subscription } from '@/lib/hooks/useSubscriptions'
import { getStudentCategory, type StudentCategory } from '@/lib/utils/studentCategory'
import { coursesStructure } from '@/lib/utils/courseGroups'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const mois = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
]

const groupes: {
  id: StudentCategory | 'inconnu'
  titre: string
  onglet: string
  panneau: string
}[] = [
  {
    id: 'enfants',
    titre: 'Enfants (0-11 ans)',
    onglet: 'border-blue-200 bg-blue-50 data-[state=active]:border-blue-500 data-[state=active]:bg-blue-100',
    panneau: 'border-blue-200 bg-blue-50',
  },
  {
    id: 'adolescents',
    titre: 'Adolescents (12-17 ans)',
    onglet: 'border-green-200 bg-green-50 data-[state=active]:border-green-500 data-[state=active]:bg-green-100',
    panneau: 'border-green-200 bg-green-50',
  },
  {
    id: 'adultes',
    titre: 'Adultes (18+ ans)',
    onglet: 'border-purple-200 bg-purple-50 data-[state=active]:border-purple-500 data-[state=active]:bg-purple-100',
    panneau: 'border-purple-200 bg-purple-50',
  },
  {
    id: 'inconnu',
    titre: 'Élèves à l’unité',
    onglet: 'border-gray-200 bg-gray-50 data-[state=active]:border-gray-500 data-[state=active]:bg-gray-100',
    panneau: 'border-gray-200 bg-gray-50',
  },
]

const COULEURS_BILAN = { presents: '#22c55e', absents: '#f87171' }

function labelPourcentage({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  value = 0,
}: {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number
  outerRadius?: number
  value?: number
}) {
  const rayon = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + rayon * Math.cos(-midAngle * (Math.PI / 180))
  const y = cy + rayon * Math.sin(-midAngle * (Math.PI / 180))
  return (
    <text
      x={x}
      y={y}
      fill="#111"
      fontSize={16}
      fontWeight={700}
      textAnchor="middle"
      dominantBaseline="central"
      stroke="#fff"
      strokeWidth={4}
      paintOrder="stroke"
    >
      {`${value} %`}
    </text>
  )
}

type Tri = 'prenom' | 'taux-asc' | 'taux-desc'

type Ligne = { prenom: string; nom: string; present: boolean; cours: string; enPlus?: boolean }

type Presence = { iso: string; libelle: string; enPlus: boolean }

type Bilan = {
  feuilles: number
  presents: number
  eleves: Ligne[]
}

type BilanEleve = {
  prenom: string
  nom: string
  presents: number
  total: number
  photoUrl?: string
  sexe?: Subscription['sexe']
  categorie: StudentCategory | 'inconnu'
  presences: Presence[]
  dateInscription?: string
  vuEnPlus: boolean
  vuOfficiel: boolean
}

function heureAffichee(heure: string) {
  return heure.replace(/h00$/i, 'H').replace('h', 'H')
}

function seanceDepuis(label: string): Presence {
  const sansExtension = label.replace(/\.pdf$/i, '')
  const match = sansExtension.match(/^(.*)-(\d{4}-\d{2}-\d{2})$/)
  const courseId = match?.[1] ?? sansExtension
  const iso = match?.[2] ?? ''
  const cours = coursesStructure.find((course) => course.id === courseId)
  const date = iso
    ? new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''
  const heure = heureAffichee(cours?.heure ?? courseId.split('-').slice(1).join('-'))
  return {
    iso,
    libelle: date ? `Cours de ${heure} du ${date}` : sansExtension,
    enPlus: false,
  }
}

function jourInscription(valeur?: string) {
  if (!valeur) return ''
  const date = new Date(valeur)
  if (Number.isNaN(date.getTime())) return valeur.slice(0, 10)
  return date.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
}

function dateCourte(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function listerDates(dates: string[]) {
  const lisibles = dates.map(dateCourte)
  if (lisibles.length <= 1) return `le ${lisibles[0] ?? ''}`
  return `le ${lisibles.slice(0, -1).join(', le ')} et le ${lisibles.at(-1)}`
}

function phrasePassage(eleve: BilanEleve) {
  if (!eleve.vuEnPlus || !eleve.vuOfficiel) return null
  const seuil = jourInscription(eleve.dateInscription)
  if (!seuil) return null
  const unite = eleve.presences.filter((presence) => presence.iso < seuil).map((presence) => presence.iso)
  const inscrit = eleve.presences.filter((presence) => presence.iso >= seuil).map((presence) => presence.iso)
  if (unite.length === 0 || inscrit.length === 0) return null
  const total = unite.length + inscrit.length
  const present = eleve.sexe === 'fille' ? 'présente' : 'présent'
  const inscritMot = eleve.sexe === 'fille' ? 'elle s’est inscrite' : 'il s’est inscrit'
  return `${eleve.prenom} ${eleve.nom} était ${present} à ${total} cours ce mois-ci, dont ${unite.length} ${listerDates(unite)} à l'unité et ${inscrit.length} ${listerDates(inscrit)}, car ${inscritMot} le ${dateCourte(seuil)}.`
}

function fold(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim()
}

function thumb(url: string, size = 96) {
  if (!url.includes('/upload/')) return url
  return url.replace('/upload/', `/upload/w_${size},h_${size},c_fill,g_face,f_auto,q_auto/`)
}

function phrase(eleve: BilanEleve) {
  const absents = eleve.total - eleve.presents
  const fois = `${eleve.presents} fois`
  const manque =
    absents === 0
      ? "n'a manqué aucun cours"
      : absents === 1
        ? 'a manqué 1 cours'
        : `a manqué ${absents} cours`
  const nomComplet = `${eleve.prenom} ${eleve.nom}`
  if (eleve.sexe === 'fille') {
    return `${nomComplet} est venue ${fois} ce mois-ci, elle ${manque}.`
  }
  if (eleve.sexe === 'garçon') {
    return `${nomComplet} est venu ${fois} ce mois-ci, il ${manque}.`
  }
  return `${nomComplet} : ${fois} ce mois-ci, ${manque}.`
}

function nomsProches(court: string, long: string) {
  if (court === long) return true
  const [petit, grand] = court.length <= long.length ? [court, long] : [long, court]
  return grand.startsWith(`${petit} `)
}

function ficheDe(prenom: string, nom: string, inscriptions: Subscription[]) {
  const prenomPli = fold(prenom)
  const nomPli = fold(nom)
  const exactes = inscriptions.filter(
    (inscription) => fold(inscription.prenom) === prenomPli && fold(inscription.nom) === nomPli,
  )
  if (exactes.length > 0) return exactes.find((inscription) => inscription.photoUrl) ?? exactes[0]
  const proches = inscriptions.filter(
    (inscription) => fold(inscription.prenom) === prenomPli && nomsProches(nomPli, fold(inscription.nom)),
  )
  return proches.length === 1 ? proches[0] : undefined
}

function elevesDuBilan(bilan: Bilan, inscriptions: Subscription[]): BilanEleve[] {
  const parNom = new Map<string, {
    prenom: string
    nom: string
    presents: number
    total: number
    presences: Presence[]
    vuEnPlus: boolean
    vuOfficiel: boolean
    fiche?: Subscription
  }>()
  for (const eleve of bilan.eleves) {
    const fiche = ficheDe(eleve.prenom, eleve.nom, inscriptions)
    const cle = fiche?._id ?? fold(`${eleve.prenom} ${eleve.nom}`)
    const deja = parNom.get(cle) ?? {
      prenom: fiche?.prenom || eleve.prenom,
      nom: fiche?.nom || eleve.nom,
      presents: 0,
      total: 0,
      presences: [],
      vuEnPlus: false,
      vuOfficiel: false,
      fiche,
    }
    deja.total += 1
    if (eleve.enPlus) deja.vuEnPlus = true
    else deja.vuOfficiel = true
    if (eleve.present) {
      deja.presents += 1
      const seance = { ...seanceDepuis(eleve.cours), enPlus: Boolean(eleve.enPlus) }
      const dejaNotee = deja.presences.some(
        (presence) => presence.iso === seance.iso && presence.libelle === seance.libelle,
      )
      if (!dejaNotee) deja.presences.push(seance)
    }
    parNom.set(cle, deja)
  }

  return [...parNom.values()].map((compte): BilanEleve => {
    const fiche = compte.fiche
    return {
      prenom: fiche?.prenom || compte.prenom,
      nom: fiche?.nom || compte.nom,
      presents: compte.presents,
      total: compte.total,
      photoUrl: fiche?.photoUrl,
      sexe: fiche?.sexe,
      categorie: fiche
        ? getStudentCategory(fiche.tarif, fiche.dateDeNaissance)
        : 'inconnu',
      dateInscription: fiche?.dateInscription,
      vuEnPlus: compte.vuEnPlus,
      vuOfficiel: compte.vuOfficiel,
      presences: compte.presences.sort(
        (a, b) => a.iso.localeCompare(b.iso) || a.libelle.localeCompare(b.libelle, 'fr'),
      ),
    }
  })
}

function taux(eleve: BilanEleve) {
  return eleve.total === 0 ? 0 : eleve.presents / eleve.total
}

function detailTaux(eleve: BilanEleve) {
  const venus = eleve.presents
  const cours = eleve.total
  if (venus === cours) {
    const present = eleve.sexe === 'fille' ? 'présente' : 'présent'
    return `${venus} cours sur ${cours} · ${present} à chaque fois`
  }
  return `${venus} cours sur ${cours} · ${Math.round(taux(eleve) * 100)} % de présence`
}

function trier(lignes: BilanEleve[], tri: Tri) {
  return [...lignes].sort((a, b) => {
    if (tri === 'taux-desc') {
      return taux(b) - taux(a) || a.prenom.localeCompare(b.prenom, 'fr')
    }
    if (tri === 'taux-asc') {
      return taux(a) - taux(b) || a.prenom.localeCompare(b.prenom, 'fr')
    }
    return a.prenom.localeCompare(b.prenom, 'fr') || a.nom.localeCompare(b.nom, 'fr')
  })
}

export default function BilanPresencesPage() {
  const { userRole } = useAuth()
  const { data: inscriptions } = useSubscriptions()
  const [year, setYear] = useState('2026')
  const [month, setMonth] = useState('octobre')
  const [recherche, setRecherche] = useState('')
  const [tri, setTri] = useState<Tri>('prenom')
  const [onglet, setOnglet] = useState<string>('enfants')
  const [bilan, setBilan] = useState<Bilan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eleveOuvert, setEleveOuvert] = useState<BilanEleve | null>(null)

  const charger = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<Bilan>(
        `/subscriptions/attendance-pdf/bilan?year=${year}&month=${month}`,
      )
      setBilan(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilan impossible')
    } finally {
      setLoading(false)
    }
  }

  const eleves = useMemo(
    () => (bilan ? elevesDuBilan(bilan, inscriptions ?? []) : []),
    [bilan, inscriptions],
  )
  const parts = bilan
    ? (() => {
        const absents = bilan.eleves.length - bilan.presents
        const total = bilan.presents + absents
        if (total <= 0) return []
        const presents = Math.round((bilan.presents / total) * 100)
        return [
          { name: 'Présents', value: presents, fill: COULEURS_BILAN.presents },
          { name: 'Absents', value: 100 - presents, fill: COULEURS_BILAN.absents },
        ].filter((part) => part.value > 0)
      })()
    : []

  const terme = fold(recherche)
  const visibles = terme.length === 0
    ? eleves
    : eleves.filter((eleve) => fold(`${eleve.prenom} ${eleve.nom}`).includes(terme))
  const ongletsVisibles = groupes.filter((groupe) =>
    visibles.some((eleve) => eleve.categorie === groupe.id),
  )
  const ongletActif = ongletsVisibles.some((groupe) => groupe.id === onglet)
    ? onglet
    : (ongletsVisibles[0]?.id ?? 'enfants')

  if (userRole && userRole !== 'admin') {
    return <p className="p-4">Accès réservé aux administrateurs.</p>
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Bilan des présences</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={year}
          onChange={(event) => setYear(event.target.value)}
          className="w-24 rounded border px-2 py-1"
        />
        <select
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className="rounded border px-2 py-1"
        >
          {mois.map((nom) => (
            <option key={nom} value={nom}>{nom}</option>
          ))}
        </select>
        {loading ? (
          <Button type="button" disabled className="gap-2">
            <Spinner />
            Lecture des PDF…
          </Button>
        ) : (
          <button
            type="button"
            onClick={charger}
            className="rounded bg-blue-600 px-3 py-1 text-white"
          >
            Calculer
          </button>
        )}
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {bilan && parts.length > 0 && (
        <div className="mb-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={parts}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                isAnimationActive={false}
                labelLine={false}
                label={labelPourcentage}
              >
                {parts.map((part) => (
                  <Cell key={part.name} fill={part.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} %`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      {bilan && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Rechercher un élève"
            className="w-full rounded px-3 py-2 text-sm"
            style={{ border: '1px solid #6b7280' }}
          />
          <select
            value={tri}
            onChange={(event) => setTri(event.target.value as Tri)}
            className="rounded border px-2 py-2 text-sm"
            aria-label="Classer les élèves"
          >
            <option value="prenom">Classer par prénom</option>
            <option value="taux-asc">Pourcentage, du plus bas</option>
            <option value="taux-desc">Pourcentage, du plus haut</option>
          </select>
        </div>
      )}
      {bilan && terme.length > 0 && visibles.length === 0 && (
        <p className="text-sm text-gray-700">Aucun élève ne correspond à « {recherche.trim()} ».</p>
      )}
      {bilan && ongletsVisibles.length > 0 && (
        <Tabs value={ongletActif} onValueChange={setOnglet}>
          <TabsList className="mb-3 grid h-auto w-full grid-cols-3 items-stretch gap-2 bg-transparent p-0">
            {ongletsVisibles.map((groupe) => {
              const nombre = visibles.filter((eleve) => eleve.categorie === groupe.id).length
              return (
                <TabsTrigger
                  key={groupe.id}
                  value={groupe.id}
                  className={`${groupe.onglet} h-full w-full whitespace-normal border-2 px-2 py-3 text-center text-xs leading-tight sm:text-sm`}
                >
                  {groupe.titre} ({nombre})
                </TabsTrigger>
              )
            })}
          </TabsList>
          {ongletsVisibles.map((groupe) => {
            const lignes = trier(
              visibles.filter((eleve) => eleve.categorie === groupe.id),
              tri,
            )
            return (
              <TabsContent key={groupe.id} value={groupe.id}>
                <div className={`space-y-3 rounded-lg border-2 p-3 ${groupe.panneau}`}>
                  {lignes.map((eleve) => (
                    <button
                      type="button"
                      key={`${groupe.id}-${eleve.prenom}-${eleve.nom}`}
                      onClick={() => setEleveOuvert(eleve)}
                      className="w-full rounded-xl border border-white/80 bg-white p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        {eleve.photoUrl ? (
                          <img
                            src={thumb(eleve.photoUrl)}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                            {(eleve.prenom[0] ?? '?').toUpperCase()}
                          </span>
                        )}
                        <p className="min-w-0 flex-1 font-medium">{eleve.prenom} {eleve.nom}</p>
                      </div>
                      <p className="mt-3 text-sm font-medium text-gray-900">{detailTaux(eleve)}</p>
                      {eleve.categorie === 'inconnu' && (
                        <p className="mt-3 text-sm font-medium text-gray-800">Élève à l’unité</p>
                      )}
                      <p className="mt-3 text-sm leading-relaxed text-gray-700">{phrasePassage(eleve) ?? phrase(eleve)}</p>
                      <p className="mt-2 text-xs font-medium text-blue-600">Voir les dates</p>
                    </button>
                  ))}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      )}
      <Dialog open={eleveOuvert !== null} onOpenChange={(ouvert) => { if (!ouvert) setEleveOuvert(null) }}>
        <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto rounded-xl p-0 sm:max-w-md [&>button]:rounded-full [&>button]:bg-white/90">
          {eleveOuvert && (
            <Card className="gap-4 border-0 py-0 shadow-none">
              <DialogTitle className="sr-only">{eleveOuvert.prenom} {eleveOuvert.nom}</DialogTitle>
              <CardContent className="px-0">
                {eleveOuvert.photoUrl ? (
                  <img
                    src={thumb(eleveOuvert.photoUrl, 800)}
                    alt=""
                    className="aspect-video h-52 w-full rounded-t-xl object-cover"
                  />
                ) : (
                  <div className="flex aspect-video h-52 w-full items-center justify-center rounded-t-xl bg-gray-200 text-4xl font-medium text-gray-600">
                    {(eleveOuvert.prenom[0] ?? '?').toUpperCase()}
                  </div>
                )}
              </CardContent>
              <CardHeader>
                <CardTitle>{eleveOuvert.prenom} {eleveOuvert.nom}</CardTitle>
                <CardDescription>
                  {eleveOuvert.categorie === 'inconnu' ? 'Élève à l’unité. ' : ''}
                  {phrasePassage(eleveOuvert) ?? phrase(eleveOuvert)}
                </CardDescription>
              </CardHeader>
              <div className="space-y-3 px-6 pb-6">
                {phrasePassage(eleveOuvert) && (
                  <p className="text-sm leading-relaxed">{phrasePassage(eleveOuvert)}</p>
                )}
                {eleveOuvert.presences.length === 0 ? (
                  <p className="text-sm text-gray-700">Aucune présence ce mois-ci.</p>
                ) : (
                  <ul className="space-y-2">
                    {eleveOuvert.presences.map((presence) => (
                      <li key={`${presence.iso}-${presence.libelle}`} className="border-b pb-2 text-sm">
                        {presence.libelle}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
