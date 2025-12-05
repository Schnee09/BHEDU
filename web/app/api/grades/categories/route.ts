/**
 * Assignment Categories API
 * GET/POST /api/grades/categories
 * 
 * Manage assignment categories for classes
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

  const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    // Allow admins to fetch all categories when classId is not provided.
    if (!classId && authResult.userRole !== 'admin') {
      return NextResponse.json(
        { error: 'classId is required' },
        { status: 400 }
      )
    }

    // If classId is provided, verify teacher has access to this class
    if (classId) {
      const { data: classData } = await supabase
        .from('classes')
        .select('teacher_id')
        .eq('id', classId)
        .single()

      if (!classData || (classData.teacher_id !== authResult.userId && authResult.userRole !== 'admin')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Get categories
    const { data: categories, error } = await supabase
      .from('assignment_categories')
      .select('*')
      .order('name')
      .then((res) => res)

    // If a classId was provided, filter client-side to avoid constructing
    // multiple queries; otherwise admins will receive all categories.
    // (Note: this returns all categories for admins when classId is omitted.)
    if (classId && categories) {
      // filter for classId
      const filtered = categories.filter((c: any) => String(c.class_id) === String(classId))
      if (!filtered) {
        // fallthrough, filtered could be empty array
      }
      return NextResponse.json({ success: true, categories: filtered || [] })
    }

    if (error) {
      logger.error('Failed to fetch categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories', details: error.message, code: error.code },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      categories: categories || []
    })
  } catch (error) {
    logger.error('Categories API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { class_id, name, description, weight, drop_lowest } = body

    // Validation
    if (!class_id || !name) {
      return NextResponse.json(
        { error: 'class_id and name are required' },
        { status: 400 }
      )
    }

    if (weight !== undefined && (weight < 0 || weight > 100)) {
      return NextResponse.json(
        { error: 'weight must be between 0 and 100' },
        { status: 400 }
      )
    }

  const supabase = createServiceClient()

    // Verify teacher has access to this class
    const { data: classData } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', class_id)
      .single()

    if (!classData || (classData.teacher_id !== authResult.userId && authResult.userRole !== 'admin')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Create category
    const { data: category, error } = await supabase
      .from('assignment_categories')
      .insert({
        class_id,
        name,
        description: description || null,
        weight: weight || 0,
        drop_lowest: drop_lowest || 0
      })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create category:', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Category name already exists for this class' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      category
    }, { status: 201 })
  } catch (error) {
    logger.error('Create category error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
