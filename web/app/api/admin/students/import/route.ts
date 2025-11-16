/**
 * Bulk Student Import API
 * POST /api/admin/students/import
 * 
 * Handles bulk student creation with validation and error tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'
import type { StudentImportRow } from '@/lib/importService'

export async function POST(req: NextRequest) {
  try {
    // Admin authentication
  const authResult = await adminAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

   const supabase = createClientFromRequest(req as any)
    const body = await req.json()
    const { students } = body as { students: StudentImportRow[] }

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: students array is required' },
        { status: 400 }
      )
    }

    logger.info(`Starting bulk import of ${students.length} students`, {
      userId: authResult.userId,
      count: students.length
    })

    // Create import log
    const { data: importLog, error: logError } = await supabase
      .from('import_logs')
      .insert({
        imported_by: authResult.userId,
        import_type: 'students',
        total_rows: students.length,
        status: 'processing'
      })
      .select()
      .single()

    if (logError || !importLog) {
      logger.error('Failed to create import log', logError)
      return NextResponse.json(
        { error: 'Failed to create import log' },
        { status: 500 }
      )
    }

    const results = {
      importLogId: importLog.id,
      success: [] as string[],
      errors: [] as { row: number; email: string; error: string }[],
      successCount: 0,
      errorCount: 0
    }

    // Process students in batches to avoid overwhelming the database
    const BATCH_SIZE = 50
    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE)
      
      for (const [batchIndex, student] of batch.entries()) {
        const rowNumber = i + batchIndex + 2 // +2 for header row and 0-index
        
        try {
          // Check if user with email already exists
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', student.email.toLowerCase())
            .single()

          if (existingUser) {
            results.errors.push({
              row: rowNumber,
              email: student.email,
              error: 'User with this email already exists'
            })
            results.errorCount++
            
            // Log error to import_errors table
            await supabase.from('import_errors').insert({
              import_log_id: importLog.id,
              row_number: rowNumber,
              field_name: 'email',
              error_type: 'duplicate',
              error_message: 'User with this email already exists',
              row_data: student,
              severity: 'error'
            })
            
            continue
          }

          // Check if student_id already exists (if provided)
          if (student.studentId) {
            const { data: existingStudentId } = await supabase
              .from('profiles')
              .select('id, student_id')
              .eq('student_id', student.studentId)
              .single()

            if (existingStudentId) {
              results.errors.push({
                row: rowNumber,
                email: student.email,
                error: `Student ID ${student.studentId} already exists`
              })
              results.errorCount++
              
              await supabase.from('import_errors').insert({
                import_log_id: importLog.id,
                row_number: rowNumber,
                field_name: 'studentId',
                error_type: 'duplicate',
                error_message: `Student ID ${student.studentId} already exists`,
                row_data: student,
                severity: 'error'
              })
              
              continue
            }
          }

          // Create auth user with a temporary password
          const tempPassword = generateTemporaryPassword()
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: student.email.toLowerCase(),
            password: tempPassword,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
              full_name: `${student.firstName} ${student.lastName}`.trim()
            }
          })

          if (authError || !authData.user) {
            logger.error(`Failed to create auth user for ${student.email}`, authError)
            results.errors.push({
              row: rowNumber,
              email: student.email,
              error: authError?.message || 'Failed to create user account'
            })
            results.errorCount++
            
            await supabase.from('import_errors').insert({
              import_log_id: importLog.id,
              row_number: rowNumber,
              field_name: 'email',
              error_type: 'auth_error',
              error_message: authError?.message || 'Failed to create user account',
              row_data: student,
              severity: 'error'
            })
            
            continue
          }

          // Create profile with extended student information
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: student.email.toLowerCase(),
              full_name: `${student.firstName} ${student.lastName}`.trim(),
              role: 'student',
              phone: student.phone || null,
              address: student.address || null,
              date_of_birth: student.dateOfBirth || null,
              gender: student.gender || null,
              student_id: student.studentId || null,
              enrollment_date: student.enrollmentDate || new Date().toISOString().split('T')[0],
              grade_level: student.gradeLevel || null,
              status: student.status || 'active'
            })

          if (profileError) {
            logger.error(`Failed to create profile for ${student.email}`, profileError)
            
            // Rollback: delete auth user
            await supabase.auth.admin.deleteUser(authData.user.id)
            
            results.errors.push({
              row: rowNumber,
              email: student.email,
              error: profileError.message || 'Failed to create profile'
            })
            results.errorCount++
            
            await supabase.from('import_errors').insert({
              import_log_id: importLog.id,
              row_number: rowNumber,
              field_name: 'profile',
              error_type: 'database_error',
              error_message: profileError.message || 'Failed to create profile',
              row_data: student,
              severity: 'error'
            })
            
            continue
          }

          // Create guardian record if guardian information provided
          if (student.guardianName) {
            const { error: guardianError } = await supabase
              .from('guardians')
              .insert({
                student_id: authData.user.id,
                name: student.guardianName,
                relationship: student.guardianRelationship || null,
                phone: student.guardianPhone || null,
                email: student.guardianEmail || null,
                address: student.guardianAddress || null,
                is_primary_contact: student.isPrimaryContact || false,
                is_emergency_contact: student.isEmergencyContact || false
              })

            if (guardianError) {
              logger.warn(`Failed to create guardian for ${student.email}`, { 
                error: guardianError.message,
                code: guardianError.code 
              })
              // Don't fail the whole import, just log a warning
              await supabase.from('import_errors').insert({
                import_log_id: importLog.id,
                row_number: rowNumber,
                field_name: 'guardian',
                error_type: 'database_error',
                error_message: guardianError.message || 'Failed to create guardian',
                row_data: { guardianName: student.guardianName },
                severity: 'warning'
              })
            }
          }

          results.success.push(authData.user.id)
          results.successCount++

          logger.info(`Successfully imported student: ${student.email}`)

        } catch (error) {
          logger.error(`Unexpected error importing student at row ${rowNumber}`, error)
          results.errors.push({
            row: rowNumber,
            email: student.email,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          results.errorCount++
          
          await supabase.from('import_errors').insert({
            import_log_id: importLog.id,
            row_number: rowNumber,
            field_name: 'unknown',
            error_type: 'unexpected_error',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            row_data: student,
            severity: 'error'
          })
        }
      }
    }

    // Update import log with final results
    await supabase
      .from('import_logs')
      .update({
        processed_rows: students.length,
        success_count: results.successCount,
        error_count: results.errorCount,
        status: results.errorCount === 0 ? 'completed' : (results.successCount > 0 ? 'completed' : 'failed'),
        error_summary: results.errors.length > 0 ? JSON.stringify(results.errors.slice(0, 10)) : null
      })
      .eq('id', importLog.id)

    // Log audit
    await supabase.from('audit_logs').insert({
      actor_id: authResult.userId,
      action: 'bulk_import_students',
      resource_type: 'student',
      details: {
        import_log_id: importLog.id,
        total: students.length,
        success: results.successCount,
        errors: results.errorCount
      }
    })

    logger.info(`Bulk import completed`, {
      importLogId: importLog.id,
      total: students.length,
      success: results.successCount,
      errors: results.errorCount
    })

    return NextResponse.json({
      success: true,
      importLogId: importLog.id,
      results: {
        total: students.length,
        successCount: results.successCount,
        errorCount: results.errorCount,
        errors: results.errors
      }
    })

  } catch (error) {
    logger.error('Bulk import error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate a temporary password for new students
 * Students should change this on first login
 */
function generateTemporaryPassword(): string {
  // Generate a random 12-character password with letters and numbers
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
