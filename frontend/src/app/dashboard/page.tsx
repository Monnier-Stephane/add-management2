// frontend/src/app/dashboard/page.tsx
'use client'

import { Dashboard } from "@/components/Dashboard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";


export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}