'use client'

import dynamic from 'next/dynamic'

const StatsDashboard = dynamic(
  () => import('@/components/admin/StatsDashboard'),
  { ssr: false }
)

export default function AdminPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard Administrateur</h1>
      <StatsDashboard />
    </div>
  );
}