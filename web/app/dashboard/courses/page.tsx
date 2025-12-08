/**
 * Courses & Lessons Admin Page
 * TODO: Re-implement with proper API routes
 * Note: This page needs actions.ts file with Server Actions for CRUD operations
 */

import { adminAuth } from '@/lib/auth/adminAuth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminCoursesPage() {
  const auth = await adminAuth()
  if (!auth.authorized) {
    redirect('/unauthorized')
  }

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">Admin • Courses & Lessons</h1>
      
      <div className="p-6 border-2 border-yellow-400 rounded-lg bg-yellow-50">
        <h2 className="text-xl font-semibold text-yellow-800 mb-2">⚠️ Page Under Development</h2>
        <p className="text-yellow-700 mb-4">
          This page requires Server Actions that haven't been implemented yet.
        </p>
        <div className="text-sm text-yellow-600">
          <p className="font-semibold mb-2">Missing files:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><code className="bg-yellow-100 px-2 py-0.5 rounded">./actions.ts</code> - Server Actions for course/lesson CRUD</li>
            <li>API routes for courses and lessons management</li>
          </ul>
          <p className="mt-4">
            <strong>Alternative:</strong> Use the <a href="/dashboard/admin/data" className="underline text-blue-600">Data Viewer</a> to manage courses directly.
          </p>
        </div>
      </div>
    </main>
  )
}

