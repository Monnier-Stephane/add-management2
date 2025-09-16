'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProcessingResult {
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  errors: string[];
  summary: string;
  newStudents: Array<{ nom: string; prenom: string; email: string }>;
}

export function CsvUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || 
        selectedFile.name.endsWith('.xlsx') || 
        selectedFile.name.endsWith('.xls'))) {
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

      // Utiliser le nouvel endpoint qui accepte Excel
      const response = await fetch('http://localhost:3001/subscriptions/upload-excel', {
        method: 'POST',
        body: formData,
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
            <h3 className="font-semibold text-green-800 mb-2">Résultat du traitement</h3>
            <div className="space-y-1 text-sm text-green-700">
              <p>📊 {result.summary}</p>
              <p>✅ Nouveaux enregistrements: {result.newRecords}</p>
              <p>🔄 Enregistrements mis à jour: {result.updatedRecords}</p>
              
              {result.newStudents.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-green-800 mb-2">🎉 Nouveaux élèves ajoutés ({result.newStudents.length}):</p>
                  <div className="bg-white border border-green-300 rounded-md p-3 max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-1">
                      {result.newStudents.map((student, index) => (
                        <div key={index} className="flex justify-between items-center py-1 px-2 bg-green-50 rounded">
                          <span className="font-medium">{student.prenom} {student.nom}</span>
                          <span className="text-xs text-gray-600">{student.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">⚠️ Erreurs ({result.errors.length}):</p>
                  <ul className="list-disc list-inside">
                    {result.errors.map((error, index) => (
                      <li key={index}>{error}</li>
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