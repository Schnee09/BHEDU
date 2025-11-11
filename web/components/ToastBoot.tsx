"use client"
import { useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useToast } from './ToastProvider'

const messages: Record<string, string> = {
  created_course: 'Course created',
  updated_course: 'Course updated',
  deleted_course: 'Course deleted',
  created_lesson: 'Lesson created',
  updated_lesson: 'Lesson updated',
  deleted_lesson: 'Lesson deleted',
}

export default function ToastBoot() {
  const router = useRouter()
  const search = useSearchParams()
  const pathname = usePathname()
  const { show } = useToast()

  useEffect(() => {
    const key = search.get('toast')
    if (!key) return
    const msg = messages[key] || key
    show(msg, key.includes('deleted') ? 'success' : 'success')
    const clean = new URLSearchParams(search.toString())
    clean.delete('toast')
    router.replace(`${pathname}${clean.toString() ? `?${clean}` : ''}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
