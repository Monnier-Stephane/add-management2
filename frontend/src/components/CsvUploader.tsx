'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth/firebase';

interface ImportPerson {
  nom: string
  prenom: string
  email: string
  telephone?: string
  telephoneUrgence?: string
  dateDeNaissance?: string | null
  adresse?: string
  ville?: string
  codePostal?: string
  statutPaiement?: string
  remarques?: string
  courses?: string[]
  warnings?: string[]
}

interface NeedsChoicePerson extends ImportPerson {
  choiceMessage?: string
  courseOptions?: string[]
}

interface ExcelPreviewResult {
  totalRows: number;
  totalPeople: number;
  readyToImport: ImportPerson[];
  needsChoice: NeedsChoicePerson[];
}

type CourseChoice = {
  mode: 'all' | 'one'
  selected: string[]
}

function extractPreview(payload: unknown): ExcelPreviewResult | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const root = payload as Record<string, unknown>;
  const nested = root.data;
  const source =
    nested && typeof nested === 'object' ? (nested as Record<string, unknown>) : root;

  const readyToImport = Array.isArray(source.readyToImport) ? source.readyToImport : null;
  const needsChoice = Array.isArray(source.needsChoice) ? source.needsChoice : null;

  if (!readyToImport || !needsChoice) {
    return null;
  }

  return {
    totalRows: Number(source.totalRows) || 0,
    totalPeople: Number(source.totalPeople) || 0,
    readyToImport: readyToImport as ExcelPreviewResult['readyToImport'],
    needsChoice: needsChoice as NeedsChoicePerson[],
  };
}

export function CsvUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExcelPreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [choices, setChoices] = useState<Record<string, CourseChoice>>({})

  const personKey = (p: { nom: string; prenom: string }) => `${p.nom}|${p.prenom}`

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (
      selectedFile &&
      (selectedFile.type === 'text/csv' ||
        selectedFile.name.endsWith('.xlsx') ||
        selectedFile.name.endsWith('.xls'))
    ) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    } else {
      setError('Veuillez sélectionner un fichier CSV ou Excel valide');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
      }
      const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('You must be logged in to upload a file');
      }

      const response = await fetch(`${cleanApiUrl}/subscriptions/preview-excel`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const payload: unknown = await response.json();
      const preview = extractPreview(payload);
      if (!preview) {
        throw new Error('Réponse preview inattendue');
      }
      const initial: Record<string, CourseChoice> = {}
for (const p of preview.needsChoice) {
  initial[`${p.nom}|${p.prenom}`] = {
    mode: 'all',
    selected: p.courseOptions ?? [],
  }
}
setChoices(initial)
setResult(preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommit = async () => {
    if (!result) return

    const people = [
      ...readyToImport.map((p) => ({
        ...p,
        courses: p.courses ?? [],
      })),
      ...needsChoice.map((p) => ({
        ...p,
        courses: choices[`${p.nom}|${p.prenom}`]?.selected ?? [],
      })),
    ]

    setIsProcessing(true)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) throw new Error('NEXT_PUBLIC_API_URL manquant')
      const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('You must be logged in to upload a file')

      const response = await fetch(`${cleanApiUrl}/subscriptions/commit-excel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ people }),
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      alert(
        `Import : ${data.data?.newRecords ?? 0} nouveaux, ${data.data?.updatedRecords ?? 0} mis à jour`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsProcessing(false)
    }
  }

  const readyToImport = result?.readyToImport ?? [];
  const needsChoice = result?.needsChoice ?? [];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Analyse du fichier (preview — pas d’enregistrement)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
            Sélectionner un fichier CSV ou Excel
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {file && (
          <div className="text-sm text-gray-600">
            Fichier sélectionné: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </div>
        )}

        <Button onClick={handleUpload} disabled={!file || isProcessing} className="w-full">
          {isProcessing ? 'Traitement en cours...' : 'Traiter le fichier'}
        </Button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md text-sm space-y-3">
            <p>
              Lignes : {result.totalRows} — Personnes : {result.totalPeople}
            </p>
            <p>Importables sans choix : {readyToImport.length}</p>
            <p>À choisir (plusieurs cours) : {needsChoice.length}</p>

            {needsChoice.map((person, index) => {
  const key = person.nom ? `${person.nom}|${person.prenom}` : String(index)
  const choice = choices[key]
  const options = person.courseOptions ?? []

  return (
    <div key={key} className="p-2 bg-white rounded border space-y-2">
      <p className="font-medium">
        {person.choiceMessage ??
          `${person.prenom} ${person.nom} — plusieurs cours`}
      </p>

      <label className="flex items-center gap-2">
        <input
          type="radio"
          name={`mode-${key}`}
          checked={choice?.mode === 'all'}
          onChange={() =>
            setChoices((prev) => ({
              ...prev,
              [key]: { mode: 'all', selected: options },
            }))
          }
        />
        Tous les cours ({options.length})
      </label>

      <label className="flex items-center gap-2">
        <input
          type="radio"
          name={`mode-${key}`}
          checked={choice?.mode === 'one'}
          onChange={() =>
            setChoices((prev) => ({
              ...prev,
              [key]: { mode: 'one', selected: options[0] ? [options[0]] : [] },
            }))
          }
        />
        Un seul cours
      </label>

      {choice?.mode === 'one' && (
        <select
          className="w-full border rounded p-2"
          value={choice.selected[0] ?? ''}
          onChange={(e) =>
            setChoices((prev) => ({
              ...prev,
              [key]: { mode: 'one', selected: [e.target.value] },
            }))
          }
        >
          {options.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>
      )}
      
    </div>
  )
})}
<Button
  className="w-full"
  disabled={
    isProcessing ||
    needsChoice.some((p) => {
      const c = choices[`${p.nom}|${p.prenom}`]
      return !c || c.selected.length === 0
    })
  }
  onClick={handleCommit}
>
  Confirmer l’import
</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
