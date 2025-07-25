import StatsDashboard from '@/components/admin/StatsDashboard';


export default function AdminPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard Administrateur</h1>
      <StatsDashboard />
    </div>
  );
}