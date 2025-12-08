import { adminAuth } from '@/lib/auth/adminAuth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  const auth = await adminAuth()
  if (!auth.authorized) {
    redirect('/unauthorized')
  }
  return <>{children}</>
}
