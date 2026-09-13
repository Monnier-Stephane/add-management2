'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { api } from '@/lib/api/api'
import { Button } from '@/components/ui/button'
import { Loader2, FileText, Eye, Download } from 'lucide-react'

type PdfItem = {
  publicId: string
  url: string
  createdAt: string
  year: string
  month: string
  week: string
  label: string
}

export default function ArchivesAppelPage() {
  const { userRole } = useAuth()
  const [items, setItems] = useState<PdfItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userRole !== 'admin') {
      setLoading(false)
      return
    }
    api
      .get<PdfItem[]>('/subscriptions/attendance-pdf')
      .then(setItems)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Erreur de chargement'),
      )
      .finally(() => setLoading(false))
  }, [userRole])

  const grouped = useMemo(() => {
    const tree: Record<string, Record<string, Record<string, PdfItem[]>>> = {}
    for (const item of items) {
      const year = item.year || 'Année inconnue'
      const month = item.month || 'Mois inconnu'
      const week = item.week?.startsWith('semaine')
        ? item.week
        : 'Autres'
      if (!tree[year]) tree[year] = {}
      if (!tree[year][month]) tree[year][month] = {}
      if (!tree[year][month][week]) tree[year][month][week] = []
      tree[year][month][week].push(item)
    }
    return tree
  }, [items])

  if (userRole && userRole !== 'admin') {
    return <p className="p-4">Accès réservé aux administrateurs.</p>
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <div>Chargement des archives...</div>
      </div>
    )
  }

  if (error) return <p className="p-4 text-red-600">{error}</p>

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Archives des feuilles d&apos;appel</h1>
      <p className="text-gray-600 mb-8">
        Classées par année, mois et semaine.
      </p>

      {items.length === 0 && (
        <p className="text-gray-500">Aucun PDF archivé pour le moment.</p>
      )}

      {Object.entries(grouped).map(([year, months]) => (
        <section key={year} className="mb-8">
          <h2 className="text-xl font-semibold mb-3">{year}</h2>
          {Object.entries(months).map(([month, weeks]) => (
            <div key={month} className="mb-5 ml-2">
              <h3 className="text-lg font-medium capitalize mb-2">{month}</h3>
              {Object.entries(weeks).map(([week, pdfs]) => (
                <div key={week} className="mb-4 ml-3">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">
                    {week.replace('semaine-', 'Semaine ')}
                  </h4>
                  <ul className="space-y-2">
                    {pdfs.map((pdf) => (
                      <li
                        key={pdf.publicId}
                        className="flex items-center justify-between gap-2 rounded-lg border p-3"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-gray-500" />
                          <span className="truncate text-sm">{pdf.label}</span>
                        </span>
                        <span className="flex shrink-0 gap-2">
  <a
    href={pdf.url}
    target="_blank"
    rel="noreferrer"
    className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-gray-50"
  >
    <Eye className="h-4 w-4" />
  </a>
  <a
    href={pdf.url}
    download
    className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90"
  >
    <Download className="h-4 w-4" />
  </a>
</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}