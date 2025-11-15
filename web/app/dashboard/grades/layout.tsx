import { teacherAuth } from '@/lib/auth/adminAuth'
import { redirect } from 'next/navigation'

export default async function GradesSectionLayout({ children }: { children: React.ReactNode }) {
  const auth = await teacherAuth()
  if (!auth.authorized) {
    redirect('/unauthorized')
  }
  return <>{children}</>
}
