/**
 * School Settings API
 * GET /api/admin/settings - Get all settings or by category
 * PUT /api/admin/settings - Update settings
 */

import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'

export async function GET(request: Request) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

  const supabase = createClientFromRequest(request as any)
    const { searchParams: _searchParams } = new URL(request.url)

    // Try to query settings - handle different schema versions gracefully
    const { data: settings, error } = await supabase
      .from('school_settings')
      .select('*')

    if (error) {
      console.error('Error fetching settings:', error)
      
      // If table or columns don't exist, return empty with helpful message
      if (error.code === '42703' || error.code === '42P01' || error.code === 'PGRST204') {
        return NextResponse.json({
          success: true,
          data: [],
          note: 'School settings table exists but schema may need updating. Please run: supabase db pull && supabase db push',
          schemaError: error.message
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch settings', details: error.message, code: error.code, hint: error.hint },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: settings
    })

  } catch (error) {
    console.error('Error in GET /api/admin/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { settings } = body // Array of {setting_key, setting_value}

    if (!Array.isArray(settings) || settings.length === 0) {
      return NextResponse.json(
        { error: 'Settings must be an array with at least one item' },
        { status: 400 }
      )
    }

  const supabase = createClientFromRequest(request as any)
    const results = []

    // Update each setting
    for (const setting of settings) {
      const { setting_key, setting_value } = setting

      const { error } = await supabase
        .from('school_settings')
        .update({
          setting_value,
          updated_by: authResult.userId,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', setting_key)

      if (error) {
        console.error(`Error updating setting ${setting_key}:`, error)
        results.push({ setting_key, success: false, error: error.message })
      } else {
        results.push({ setting_key, success: true })
      }
    }

    // Log activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: authResult.userId!,
        action: 'settings_updated',
        description: `Updated ${settings.length} settings`,
        metadata: { updated_settings: settings.map(s => s.setting_key) }
      })

    const successCount = results.filter(r => r.success).length
    const failedCount = results.length - successCount

    return NextResponse.json({
      success: failedCount === 0,
      message: `Updated ${successCount} settings${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      results
    })

  } catch (error) {
    console.error('Error in PUT /api/admin/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
