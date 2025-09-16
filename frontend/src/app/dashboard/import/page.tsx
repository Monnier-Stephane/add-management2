import { CsvUploader } from '@/components/CsvUploader';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ImportPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </Button>
        </Link>
      </div>
      <div className="max-w-xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-center">Import de données</h1>
      </div>
      <CsvUploader />
    </div>
  );
}
