import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/**
 * Backward-compat redirect.
 *
 * Some parts of the UI (or old bookmarks) may hit:
 *   /dashboard/admin/student
 * but the admin student routes live under:
 *   /dashboard/admin/students
 */
export default function AdminStudentLegacyPage() {
  redirect('/dashboard/admin/students')
}
