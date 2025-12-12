/**
 * Bulk User Import API
 * POST /api/admin/users/import - Import users from CSV
 */

import { NextResponse } from 'next/server'
import { getDataClient } from '@/lib/auth/dataClient'
import { adminAuth } from '@/lib/auth/adminAuth'
import type { UserRole } from '@/lib/database.types'

interface UserImportRow {
  email: string
  password?: string
  full_name: string
  role: UserRole
  phone?: string
  department?: string // for teachers
  student_id?: string // for students
  grade_level?: string // for students
  notes?: string
  is_active?: boolean
}

export async function POST(request: Request) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { users } = body

    if (!users || !Array.isArray(users)) {
      return NextResponse.json(
        { error: 'Users array is required' },
        { status: 400 }
      )
    }

  const { supabase } = await getDataClient(request)
    const results = {
      total: users.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; email: string; error: string }>
    }

    // Process each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i] as UserImportRow
      const rowNumber = i + 1

      try {
        // Validate required fields
        if (!user.email || !user.full_name || !user.role) {
          results.failed++
          results.errors.push({
            row: rowNumber,
            email: user.email || 'N/A',
            error: 'Missing required fields (email, full_name, role)'
          })
          continue
        }

        // Validate role
        if (!['admin', 'teacher', 'student'].includes(user.role)) {
          results.failed++
          results.errors.push({
            row: rowNumber,
            email: user.email,
            error: 'Invalid role. Must be: admin, teacher, or student'
          })
          continue
        }

        // Generate password if not provided
        const password = user.password || Math.random().toString(36).slice(-8) + 'A1!'

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email.toLowerCase().trim(),
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name,
            role: user.role
          }
        })

        if (authError) {
          results.failed++
          results.errors.push({
            row: rowNumber,
            email: user.email,
            error: authError.message
          })
          continue
        }

        // Update profile with additional fields
        const profileData: Record<string, string | boolean> = {
          full_name: user.full_name,
          role: user.role,
          is_active: user.is_active !== undefined ? user.is_active : true
        }

        if (authResult.userId) profileData.created_by = authResult.userId

        if (user.phone) profileData.phone = user.phone
        if (user.notes) profileData.notes = user.notes

        // Role-specific fields
        if (user.role === 'teacher' && user.department) {
          profileData.department = user.department
        }
        if (user.role === 'student') {
          if (user.student_id) profileData.student_id = user.student_id
          if (user.grade_level) profileData.grade_level = user.grade_level
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', authData.user.id)

        if (profileError) {
          // Try to clean up auth user if profile update fails
          await supabase.auth.admin.deleteUser(authData.user.id)
          results.failed++
          results.errors.push({
            row: rowNumber,
            email: user.email,
            error: `Profile update failed: ${profileError.message}`
          })
          continue
        }

        // Log activity
        await supabase.from('user_activity_logs').insert({
          user_id: authData.user.id,
          action: 'user_created_bulk',
          description: `User created via bulk import by ${authResult.userId}`,
          metadata: {
            created_by: authResult.userId,
            import_type: 'csv',
            generated_password: !user.password
          }
        })

        results.successful++
      } catch (error) {
        results.failed++
        results.errors.push({
          row: rowNumber,
          email: user.email || 'N/A',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Import completed. ${results.successful} successful, ${results.failed} failed`
    })

  } catch (error) {
    console.error('Error importing users:', error)
    return NextResponse.json(
      { error: 'Failed to import users' },
      { status: 500 }
    )
  }
}
