'use server'
import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/adminAuth'
import { logger } from '@/lib/logger'
import { logAuditAction } from '@/lib/auditLog'
import { validateTitle, validateDescription, validateContent, ValidationError } from '@/lib/validation'

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY
const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXT_PUBLIC_BASE_URL || ''

function sign(payload: string) {
  if (!INTERNAL_API_KEY) throw new Error('INTERNAL_API_KEY not set on server')
  return crypto.createHmac('sha256', INTERNAL_API_KEY).update(payload).digest('hex')
}

async function internalFetch(path: string, method: 'GET'|'POST'|'PUT'|'DELETE', body?: Record<string, unknown>, signPayloadOverride?: string) {
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
    body: method === 'POST' || method === 'PUT' ? raw : undefined,
    cache: 'no-store'
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Internal request failed ${res.status}: ${text}`)
  }
  return res.json()
}

export async function createCourse(formData: FormData) {
  try {
    const user = await requireAdmin()
    
    // Validate input
    const title = validateTitle(formData.get('title'))
    const description = validateDescription(formData.get('description') || '')
    
    const result = await internalFetch('/api/courses','POST',{ 
      title, 
      description,
      teacher_id: user.id // Use teacher_id instead of author_id
    })
    
    await logAuditAction({
      actor_id: user.id,
      action: 'create',
      resource_type: 'course',
      resource_id: result.data?.id || 'unknown',
      details: { title }
    })
    
    revalidatePath('/dashboard/courses')
    redirect('/dashboard/courses?toast=created_course')
  } catch (err) {
    logger.error('Failed to create course', { error: err })
    if (err instanceof ValidationError) {
      redirect(`/dashboard/courses?toast=error:${encodeURIComponent(err.message)}`)
    }
    redirect('/dashboard/courses?toast=error:Failed_to_create_course')
  }
}

export async function createLesson(formData: FormData) {
  try {
    const user = await requireAdmin()
    
    const courseId = String(formData.get('course_id')||'').trim()
    if (!courseId) throw new ValidationError('course_id required')
    
    const title = validateTitle(formData.get('lesson_title'))
    const content = validateContent(formData.get('content') || '')
    
    const result = await internalFetch('/api/lessons','POST',{ 
      course_id: courseId, 
      title, 
      content, 
      lesson_order: 1
    })
    
    await logAuditAction({
      actor_id: user.id,
      action: 'create',
      resource_type: 'lesson',
      resource_id: result.data?.id || 'unknown',
      details: { title, courseId }
    })
    
    revalidatePath('/dashboard/courses')
    redirect('/dashboard/courses?toast=created_lesson')
  } catch (err) {
    logger.error('Failed to create lesson', { error: err })
    if (err instanceof ValidationError) {
      redirect(`/dashboard/courses?toast=error:${encodeURIComponent(err.message)}`)
    }
    redirect('/dashboard/courses?toast=error:Failed_to_create_lesson')
  }
}

export async function getCoursesAndLessons() {
  try {
    // Fetch courses first (empty GET payload signature)
    const coursesResp = await internalFetch('/api/courses','GET')
    const courses = (coursesResp.data||[]) as Array<{id:string,title:string,description:string}>
    const lessonsByCourse: Record<string, Array<Record<string, unknown>>> = {}
    for (const c of courses) {
      try {
        // Attempt modern empty signature first
        const lessonsResp = await internalFetch(`/api/lessons?course_id=${c.id}`,'GET',undefined, `course_id=${c.id}`)
        lessonsByCourse[c.id] = lessonsResp.data || []
      } catch (err) {
        logger.warn('Failed to fetch lessons for course', { courseId: c.id, error: err })
        lessonsByCourse[c.id] = []
      }
    }
    return { courses, lessonsByCourse }
  } catch (err) {
    logger.error('Failed to fetch courses and lessons', { error: err })
    return { courses: [], lessonsByCourse: {} }
  }
}

export async function editCourse(formData: FormData) {
  try {
    const user = await requireAdmin()
    
    const id = String(formData.get('course_id')||'').trim()
    if (!id) throw new ValidationError('course_id required')
    
    const payload: Record<string, unknown> = {}
    const titleRaw = formData.get('title')
    const descriptionRaw = formData.get('description')
    
    if (titleRaw !== null) payload.title = validateTitle(titleRaw)
    if (descriptionRaw !== null) payload.description = validateDescription(descriptionRaw)
    
    await internalFetch(`/api/courses/${id}`, 'PUT', payload)
    
    await logAuditAction({
      actor_id: user.id,
      action: 'update',
      resource_type: 'course',
      resource_id: id,
      details: payload
    })
    
    revalidatePath('/dashboard/courses')
    redirect('/dashboard/courses?toast=updated_course')
  } catch (err) {
    logger.error('Failed to edit course', { error: err })
    if (err instanceof ValidationError) {
      redirect(`/dashboard/courses?toast=error:${encodeURIComponent(err.message)}`)
    }
    redirect('/dashboard/courses?toast=error:Failed_to_update_course')
  }
}

export async function deleteCourse(formData: FormData) {
  try {
    const user = await requireAdmin()
    
    const id = String(formData.get('course_id')||'').trim()
    if (!id) throw new ValidationError('course_id required')
    
    await internalFetch(`/api/courses/${id}`, 'DELETE')
    
    await logAuditAction({
      actor_id: user.id,
      action: 'delete',
      resource_type: 'course',
      resource_id: id,
      details: {}
    })
    
    revalidatePath('/dashboard/courses')
    redirect('/dashboard/courses?toast=deleted_course')
  } catch (err) {
    logger.error('Failed to delete course', { error: err })
    redirect('/dashboard/courses?toast=error:Failed_to_delete_course')
  }
}

export async function editLesson(formData: FormData) {
  try {
    const user = await requireAdmin()
    
    const id = String(formData.get('lesson_id')||'').trim()
    if (!id) throw new ValidationError('lesson_id required')
    
    const payload: Record<string, unknown> = {}
    const titleRaw = formData.get('lesson_title')
    const contentRaw = formData.get('content')
    const order_index_raw = formData.get('order_index')
    const is_published_raw = formData.get('is_published')
    
    if (titleRaw !== null) payload.title = validateTitle(titleRaw)
    if (contentRaw !== null) payload.content = validateContent(contentRaw)
    if (order_index_raw !== null && String(order_index_raw).length) payload.order_index = Number(order_index_raw)
    if (is_published_raw !== null) payload.is_published = String(is_published_raw) === 'on' || String(is_published_raw) === 'true'
    
    await internalFetch(`/api/lessons/${id}`, 'PUT', payload)
    
    await logAuditAction({
      actor_id: user.id,
      action: 'update',
      resource_type: 'lesson',
      resource_id: id,
      details: payload
    })
    
    revalidatePath('/dashboard/courses')
    redirect('/dashboard/courses?toast=updated_lesson')
  } catch (err) {
    logger.error('Failed to edit lesson', { error: err })
    if (err instanceof ValidationError) {
      redirect(`/dashboard/courses?toast=error:${encodeURIComponent(err.message)}`)
    }
    redirect('/dashboard/courses?toast=error:Failed_to_update_lesson')
  }
}

export async function deleteLesson(formData: FormData) {
  try {
    const user = await requireAdmin()
    
    const id = String(formData.get('lesson_id')||'').trim()
    if (!id) throw new ValidationError('lesson_id required')
    
    await internalFetch(`/api/lessons/${id}`, 'DELETE')
    
    await logAuditAction({
      actor_id: user.id,
      action: 'delete',
      resource_type: 'lesson',
      resource_id: id,
      details: {}
    })
    
    revalidatePath('/dashboard/courses')
    redirect('/dashboard/courses?toast=deleted_lesson')
  } catch (err) {
    logger.error('Failed to delete lesson', { error: err })
    redirect('/dashboard/courses?toast=error:Failed_to_delete_lesson')
  }
}
