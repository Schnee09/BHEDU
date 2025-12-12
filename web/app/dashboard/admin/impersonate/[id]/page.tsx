import Link from 'next/link'
import { getDataClient } from '@/lib/auth/dataClient'
import StudentDetail from '@/app/dashboard/students/[id]/page'
import { Card } from '@/components/ui'

export const dynamic = 'force-dynamic'

export default async function ImpersonateStudentPage({ params }: { params: { id: string } }) {
  const { id } = params

  // admin/layout ensures caller is an admin; we still fetch data with a service client
  const { supabase } = await getDataClient()

  // Lightweight check: ensure student exists before rendering the full student page
  const { data: profile } = await supabase.from('profiles').select('id, full_name').eq('id', id).maybeSingle()
  if (!profile) {
    return (
      <div className="p-6">
        <Card padding="lg">Student not found.</Card>
        <Link href="/dashboard/admin/students" className="inline-block mt-4 text-blue-600">← Back</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Impersonating: {profile.full_name}</h1>
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/admin/students/${id}`} className="px-3 py-2 bg-gray-100 rounded">Return to Admin View</Link>
            <Link href="/dashboard/admin/students" className="px-3 py-2 bg-white rounded">Stop Impersonating</Link>
          </div>
        </div>

        {/* Render the student-facing server page inside admin impersonation wrapper. */}
        {/* Pass params as a promise to match the StudentDetail signature. */}
        {/* Note: this does not create a real student session — it's a preview mode. */}
        {/* If you want full session impersonation (auth cookie), we need to create a server session which
            requires calling Supabase Admin APIs and caution with security. */}
        <StudentDetail params={Promise.resolve({ id })} />
      </div>
    </div>
  )
}
