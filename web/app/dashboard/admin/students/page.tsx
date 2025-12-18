import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/**
 * Admin Students index
 *
 * This repo currently implements only the admin student *detail* route:
 *   /dashboard/admin/students/[id]
 *
 * Many users expect an index route at:
 *   /dashboard/admin/students
 *
 * Until we add a real list UI for admins, redirect to the main students dashboard.
 */
export default function AdminStudentsIndexPage() {
  redirect('/dashboard/students')
}
