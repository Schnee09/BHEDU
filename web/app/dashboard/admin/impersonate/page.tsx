import { redirect } from 'next/navigation'

// Impersonation feature temporarily removed. Redirect to admin students list.
export default function ImpersonateIndexPageServer() {
  redirect('/dashboard/admin/students')
}
