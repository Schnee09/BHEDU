/**
 * School Settings API
 * GET /api/admin/settings - Get all settings or by category
 * PUT /api/admin/settings - Update settings
 */

import { NextResponse } from 'next/server'
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server'
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
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabase
      .from('school_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('setting_key', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: settings, error } = await query

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    // Group by category
     type SettingGroup = Record<string, typeof settings>
     const grouped = settings?.reduce((acc: SettingGroup, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = []
      }
      acc[setting.category].push(setting)
      return acc
     }, {} as SettingGroup)

    return NextResponse.json({
      success: true,
      data: settings,
      grouped: grouped || {}
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
