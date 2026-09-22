'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth/firebase';
import { api } from '@/lib/api/api';

const COURS_ADULTES = [
  'LUNDI 19h30 Bercy ADULTES',
  'JEUDI 19h30 Paris Châtelet ADULTES',
  'SAMEDI 10h00 Paris Châtelet ADULTES',
  'SAMEDI 16h30 Choisy le Roi ADULTES',
  'SAMEDI 17h45 Choisy le Roi ADULTES',
  'DIMANCHE 10h00 Choisy le Roi ADULTES',
  'DIMANCHE 11h30 Choisy le Roi ADULTES',
];

const COURS_JEUNES_ADULTES_CHOISY = [
  'SAMEDI 16h30 Choisy le Roi ADULTES',
  'SAMEDI 17h45 Choisy le Roi ADULTES',
  'DIMANCHE 10h00 Choisy le Roi ADULTES',
  'DIMANCHE 11h30 Choisy le Roi ADULTES',
];

interface AdulteSansDeuxCours {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
}

interface ProcessingResult {
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  deletedRecords: number;
  errors: string[];
  summary: string;
  newStudents: Array<{ nom: string; prenom: string; email: string }>;
  adultesSansDeuxCours?: AdulteSansDeuxCours[];
  jeunesAdultesSansCours?: AdulteSansDeuxCours[];
}

export function CsvUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [choixCours, setChoixCours] = useState<
    Record<string, { a: string; b: string }>
  >({});
  const [choixJa, setChoixJa] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

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
      setChoixCours({});
      setChoixJa({});
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
    setChoixCours({});

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
      const response = await fetch(`${cleanApiUrl}/subscriptions/upload-excel`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsProcessing(false);
    }
  };

  const enregistrerDeuxCours = async (studentId: string) => {
    const choix = choixCours[studentId];
    if (!choix?.a || !choix?.b || choix.a === choix.b) {
      setError('Choisissez deux cours adultes différents.');
      return;
    }
    setError(null);
    setSavingId(studentId);
    try {
      await api.patch(`/subscriptions/${studentId}`, {
        tarif: [choix.a, choix.b],
      });
      setResult((prev) =>
        prev
          ? {
              ...prev,
              adultesSansDeuxCours: (prev.adultesSansDeuxCours || []).filter(
                (s) => s._id !== studentId,
              ),
            }
          : prev,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible d’enregistrer les 2 cours',
      );
    } finally {
      setSavingId(null);
    }
  };

  const enregistrerCoursJeuneAdulte = async (studentId: string) => {
    const cours = choixJa[studentId];
    if (!cours) {
      setError('Choisissez un cours (samedi après-midi ou dimanche matin Choisy).');
      return;
    }
    setError(null);
    setSavingId(studentId);
    try {
      await api.patch(`/subscriptions/${studentId}`, { tarif: [cours] });
      setResult((prev) =>
        prev
          ? {
              ...prev,
              jeunesAdultesSansCours: (prev.jeunesAdultesSansCours || []).filter(
                (s) => s._id !== studentId,
              ),
            }
          : prev,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Impossible d’enregistrer le cours',
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Import de données (CSV ou Excel)</CardTitle>
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

        <Button
          onClick={handleUpload}
          disabled={!file || isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Traitement en cours...' : 'Traiter le fichier'}
        </Button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold text-green-800 mb-2">
  Import terminé
</h3>
<div className="space-y-1 text-sm text-green-700">
  <p>
    {result.newRecords} nouvelle{result.newRecords > 1 ? 's' : ''}{' '}
    inscription{result.newRecords > 1 ? 's' : ''},{' '}
    {result.updatedRecords} fiche{result.updatedRecords > 1 ? 's' : ''}{' '}
    déjà en base mise{result.updatedRecords > 1 ? 's' : ''} à jour.
  </p>

  {(result.adultesSansDeuxCours?.length ?? 0) > 0 && (
  <p>
    {result.adultesSansDeuxCours!.length} adulte
    {result.adultesSansDeuxCours!.length > 1 ? 's' : ''}{' '}
    n&apos;ont pas indiqué leurs 2 cours : à choisir plus bas.
  </p>
)}
              {(result.jeunesAdultesSansCours?.length ?? 0) > 0 && (
                <p>
                  {result.jeunesAdultesSansCours!.length} jeune
                  {result.jeunesAdultesSansCours!.length > 1 ? 's' : ''}{' '}
                  adulte
                  {result.jeunesAdultesSansCours!.length > 1 ? 's' : ''}{' '}
                  Choisy sans cours choisi : à préciser plus bas.
                </p>
              )}
              {result.newStudents.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-green-800 mb-2">
  Nouvelles inscriptions ({result.newStudents.length})
</p>
                  <div className="bg-white border border-green-300 rounded-md p-3 max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-1">
                      {result.newStudents.map((student, index) => (
                        <div key={index} className="py-1 px-2 bg-green-50 rounded">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm sm:text-base">
                              {student.prenom} {student.nom}
                            </span>
                            <span className="text-xs text-gray-600">
                              {student.email}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {result.adultesSansDeuxCours &&
                result.adultesSansDeuxCours.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded-md">
                    <p className="font-semibold text-amber-900 mb-2">
                      Adultes 2 cours / semaine sans créneaux précisés (
                      {result.adultesSansDeuxCours.length})
                    </p>
                    <p className="text-sm text-amber-800 mb-3">
                      Cet élève n&apos;a pas précisé les 2 cours lors de son
                      inscription. Veuillez choisir les 2 cours, sinon par défaut
                      il sera sur tous les cours adultes.
                    </p>
                    <div className="space-y-4">
                      {result.adultesSansDeuxCours.map((student) => (
                        <div
                          key={student._id}
                          className="bg-white border border-amber-200 rounded-md p-3 space-y-2"
                        >
                          <p className="font-medium text-amber-950">
                            {student.prenom} {student.nom}{' '}
                            <span className="text-xs text-gray-600">
                              ({student.email})
                            </span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                              className="w-full rounded border border-gray-300 p-2 text-sm text-gray-800"
                              value={choixCours[student._id]?.a || ''}
                              onChange={(e) =>
                                setChoixCours((prev) => ({
                                  ...prev,
                                  [student._id]: {
                                    a: e.target.value,
                                    b: prev[student._id]?.b || '',
                                  },
                                }))
                              }
                            >
                              <option value="">1er cours</option>
                              {COURS_ADULTES.map((cours) => (
                                <option key={`a-${cours}`} value={cours}>
                                  {cours}
                                </option>
                              ))}
                            </select>
                            <select
                              className="w-full rounded border border-gray-300 p-2 text-sm text-gray-800"
                              value={choixCours[student._id]?.b || ''}
                              onChange={(e) =>
                                setChoixCours((prev) => ({
                                  ...prev,
                                  [student._id]: {
                                    a: prev[student._id]?.a || '',
                                    b: e.target.value,
                                  },
                                }))
                              }
                            >
                              <option value="">2e cours</option>
                              {COURS_ADULTES.map((cours) => (
                                <option key={`b-${cours}`} value={cours}>
                                  {cours}
                                </option>
                              ))}
                            </select>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            disabled={savingId === student._id}
                            onClick={() => enregistrerDeuxCours(student._id)}
                          >
                            {savingId === student._id
                              ? 'Enregistrement...'
                              : 'Enregistrer les 2 cours'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

{result.jeunesAdultesSansCours &&
  result.jeunesAdultesSansCours.length > 0 && (
    <div className="mt-4 p-3 bg-sky-50 border border-sky-300 rounded-md">
      <p className="font-semibold text-sky-900 mb-2">
        Jeunes adultes Choisy — samedi après-midi ou dimanche matin
        ({result.jeunesAdultesSansCours.length})
      </p>
      <p className="text-sm text-sky-800 mb-3">
        Indiquez le cours choisi (Sam 16h30, Sam 17h45, Dim 10h ou
        Dim 11h30).
      </p>
      <div className="space-y-4">
        {result.jeunesAdultesSansCours.map((student) => (
          <div
            key={student._id}
            className="bg-white border border-sky-200 rounded-md p-3 space-y-2"
          >
            <p className="font-medium text-sky-950">
              {student.prenom} {student.nom}{' '}
              <span className="text-xs text-gray-600">
                ({student.email})
              </span>
            </p>
            <select
              className="w-full rounded border border-gray-300 p-2 text-sm text-gray-800"
              value={choixJa[student._id] || ''}
              onChange={(e) =>
                setChoixJa((prev) => ({
                  ...prev,
                  [student._id]: e.target.value,
                }))
              }
            >
              <option value="">Choisir un cours</option>
              {COURS_JEUNES_ADULTES_CHOISY.map((cours) => (
                <option key={cours} value={cours}>
                  {cours}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              disabled={savingId === student._id}
              onClick={() =>
                enregistrerCoursJeuneAdulte(student._id)
              }
            >
              {savingId === student._id
                ? 'Enregistrement...'
                : 'Enregistrer le cours'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )}

              {result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold text-red-800">
  Lignes non prises en compte ({result.errors.length})
</p>
                  <ul className="list-disc list-inside">
                    {result.errors.map((errorItem, index) => (
                      <li key={index}>{errorItem}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
