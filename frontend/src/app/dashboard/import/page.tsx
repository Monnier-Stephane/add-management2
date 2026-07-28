import { CsvUploader } from '@/components/CsvUploader';


export default function ImportPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-4 mb-6">
        
      </div>
      <div className="max-w-xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-center">Import de données</h1>
      </div>
      <CsvUploader />
    </div>
  );
}
