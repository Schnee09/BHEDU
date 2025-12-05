import { createClientFromRequest } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClientFromRequest(req as any)
    
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      },
      tests: {}
    }

    // Test 1: Auth check
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      diagnostics.tests.auth = {
        success: !authError && !!user,
        userId: user?.id || null,
        email: user?.email || null,
        error: authError?.message || null
      }
    } catch (error: any) {
      diagnostics.tests.auth = {
        success: false,
        error: error.message
      }
    }

    // Test 2: Database connection
    try {
      const { data: _data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      diagnostics.tests.database = {
        success: !error,
        error: error?.message || null
      }
    } catch (error: any) {
      diagnostics.tests.database = {
        success: false,
        error: error.message
      }
    }

    // Test 3: Check if new columns exist
    try {
      const { data: _data, error } = await supabase
        .from('grades')
        .select('component_type, semester, academic_year_id')
        .limit(1)
      
      diagnostics.tests.vietnameseColumns = {
        success: !error,
        columnsExist: !error,
        error: error?.message || null,
        hint: error ? 'Migration may not be applied' : 'Columns exist'
      }
    } catch (error: any) {
      diagnostics.tests.vietnameseColumns = {
        success: false,
        error: error.message
      }
    }

    // Test 4: Check profiles table
    try {
      const { data: _data, error } = await supabase
        .from('profiles')
        .select('student_code, grade_level')
        .limit(1)
      
      diagnostics.tests.profilesColumns = {
        success: !error,
        columnsExist: !error,
        error: error?.message || null
      }
    } catch (error: any) {
      diagnostics.tests.profilesColumns = {
        success: false,
        error: error.message
      }
    }

    // Test 5: Check if grade_component_configs exists
    try {
      const { data: _data, error } = await supabase
        .from('grade_component_configs')
        .select('count')
        .limit(1)
      
      diagnostics.tests.gradeComponentConfigs = {
        success: !error,
        tableExists: !error,
        error: error?.message || null
      }
    } catch (error: any) {
      diagnostics.tests.gradeComponentConfigs = {
        success: false,
        error: error.message
      }
    }

    // Test 6: Check if conduct_grades exists
    try {
      const { data: _data, error } = await supabase
        .from('conduct_grades')
        .select('count')
        .limit(1)
      
      diagnostics.tests.conductGrades = {
        success: !error,
        tableExists: !error,
        error: error?.message || null
      }
    } catch (error: any) {
      diagnostics.tests.conductGrades = {
        success: false,
        error: error.message
      }
    }

    // Test 7: Check academic_years
    try {
      const { data: _data, error } = await supabase
        .from('academic_years')
        // schema uses `name` for the academic year label (e.g. '2024-2025')
        .select('id, name')
        .limit(1)
        .maybeSingle()
      
      diagnostics.tests.academicYears = {
        success: !error,
        hasData: !!data,
        error: error?.message || null
      }
    } catch (error: any) {
      diagnostics.tests.academicYears = {
        success: false,
        error: error.message
      }
    }

    // Test 8: Check classes
    try {
      const { data: _data, error } = await supabase
        .from('classes')
        // classes table uses `name` for the class label
        .select('id, name')
        .limit(1)
        .maybeSingle()
      
      diagnostics.tests.classes = {
        success: !error,
        hasData: !!data,
        error: error?.message || null
      }
    } catch (error: any) {
      diagnostics.tests.classes = {
        success: false,
        error: error.message
      }
    }

    // Summary
    const allTests = Object.values(diagnostics.tests)
    const passedTests = allTests.filter((t: any) => t.success).length
    const totalTests = allTests.length

    diagnostics.summary = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      healthScore: `${Math.round((passedTests / totalTests) * 100)}%`
    }

    return NextResponse.json(diagnostics, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
