'use server'
import crypto from 'crypto'
import { revalidatePath } from 'next/cache'

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY
const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXT_PUBLIC_BASE_URL || ''

function sign(payload: string) {
  if (!INTERNAL_API_KEY) throw new Error('INTERNAL_API_KEY not set on server')
  return crypto.createHmac('sha256', INTERNAL_API_KEY).update(payload).digest('hex')
}

async function internalFetch(path: string, method: 'GET'|'POST', body?: any, signPayloadOverride?: string) {
  if (!BASE_URL) throw new Error('BASE_URL not resolved (set VERCEL_URL or NEXT_PUBLIC_BASE_URL)')
  const url = `${BASE_URL}${path}`
  const raw = body ? JSON.stringify(body) : ''
  const toSign = signPayloadOverride ?? raw
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-signature': sign(toSign),
    },
    body: method === 'POST' ? raw : undefined,
    cache: 'no-store'
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Internal request failed ${res.status}: ${text}`)
  }
  return res.json()
}

export async function createCourse(formData: FormData) {
  const title = String(formData.get('title')||'').trim()
  const description = String(formData.get('description')||'').trim()
  if (!title) throw new Error('Title required')
  await internalFetch('/api/courses','POST',{ title, description, is_published: true })
  revalidatePath('/admin/courses')
}

export async function createLesson(formData: FormData) {
  const courseId = String(formData.get('course_id')||'').trim()
  const title = String(formData.get('lesson_title')||'').trim()
  const content = String(formData.get('content')||'').trim()
  if (!courseId) throw new Error('course_id required')
  if (!title) throw new Error('lesson title required')
  await internalFetch('/api/lessons','POST',{ course_id: courseId, title, content, order_index: 1, is_published: true })
  revalidatePath('/admin/courses')
}

export async function getCoursesAndLessons() {
  // Fetch courses first (empty GET payload signature)
  const coursesResp = await internalFetch('/api/courses','GET')
  const courses = (coursesResp.data||[]) as Array<{id:string,title:string,description:string}>
  const lessonsByCourse: Record<string, any[]> = {}
  for (const c of courses) {
    try {
      // Attempt modern empty signature first
      const lessonsResp = await internalFetch(`/api/lessons?course_id=${c.id}`,'GET',undefined, `course_id=${c.id}`)
      lessonsByCourse[c.id] = lessonsResp.data || []
    } catch (err) {
      lessonsByCourse[c.id] = []
    }
  }
  return { courses, lessonsByCourse }
}
