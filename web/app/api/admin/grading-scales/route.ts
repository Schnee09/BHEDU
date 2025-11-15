/**
 * Grading Scales API
 * GET /api/admin/grading-scales - Get all grading scales
 * POST /api/admin/grading-scales - Create grading scale
 * PUT /api/admin/grading-scales/[id] - Update grading scale
 * DELETE /api/admin/grading-scales/[id] - Delete grading scale
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'

export async function GET(request: Request) {
  try {
    const authResult = await adminAuth()
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    const { data: scales, error } = await supabase
      .from('grading_scales')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching grading scales:', error)
      return NextResponse.json(
        { error: 'Failed to fetch grading scales' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: scales
    })

  } catch (error) {
    console.error('Error in GET /api/admin/grading-scales:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await adminAuth()
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, scale, is_default } = body

    if (!name || !scale) {
      return NextResponse.json(
        { error: 'Missing required fields: name, scale' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // If this is set as default, unset other defaults
    if (is_default) {
      await supabase
        .from('grading_scales')
        .update({ is_default: false })
        .eq('is_default', true)
    }

    const { data: gradingScale, error } = await supabase
      .from('grading_scales')
      .insert({
        name,
        description,
        scale,
        is_default: is_default || false,
        created_by: authResult.userId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating grading scale:', error)
      return NextResponse.json(
        { error: 'Failed to create grading scale' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: gradingScale,
      message: 'Grading scale created successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/admin/grading-scales:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
