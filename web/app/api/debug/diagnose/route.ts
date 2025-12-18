/**
 * API Diagnostic Endpoint
 * GET /api/debug/diagnose
 * 
 * Helps identify data sync issues by testing all major API endpoints
 * and checking Supabase connectivity
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface EndpointTest {
  name: string;
  table: string;
  rowCount: number;
  error?: string;
  hasRLS?: boolean;
}

export async function GET(_request: Request) {
  try {
    const supabase = createServiceClient();

    // Test 1: Check service role key works
    const serviceKeyValid = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Test 2: Test basic connectivity
    const { error: versionError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (versionError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed',
          details: versionError.message,
          serviceKeyValid,
        },
        { status: 500 }
      );
    }

    // Test 3: Check each major table
    const tables = [
      'profiles',
      'classes',
      'enrollments',
      'attendance',
      'grades',
      'courses',
      'lessons',
      'assignments',
      'academic_years',
      'fee_types',
      'invoices',
      'payments',
    ];

    const tableTests: EndpointTest[] = [];

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('id', { count: 'exact', head: true });

        if (error) {
          tableTests.push({
            name: table,
            table,
            rowCount: 0,
            error: error.message,
            hasRLS: error.message.includes('RLS') || error.message.includes('policy'),
          });
        } else {
          tableTests.push({
            name: table,
            table,
            rowCount: count || 0,
          });
        }
      } catch (err: any) {
        tableTests.push({
          name: table,
          table,
          rowCount: 0,
          error: err.message,
        });
      }
    }

    // Test 4: Check sample data from profiles
    const { data: sampleProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(3);

    const { count: studentCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student');

    const { count: teacherCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'teacher');

    const { count: adminCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');

    // Compile results
    const workingTables = tableTests.filter((t) => !t.error).length;
    const totalTables = tableTests.length;
    const rlsBlockedTables = tableTests.filter((t) => t.hasRLS).length;

    return NextResponse.json({
      success: true,
      serviceKeyValid,
      databaseConnection: 'OK',
      tableTests: {
        total: totalTables,
        working: workingTables,
        rlsBlocked: rlsBlockedTables,
        details: tableTests,
      },
      dataQuality: {
        profilesAccessible: !profileError,
        studentCount: studentCount || 0,
        teacherCount: teacherCount || 0,
        adminCount: adminCount || 0,
        sampleData: sampleProfiles || [],
      },
      recommendations: generateRecommendations(tableTests, serviceKeyValid),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Diagnostic check failed',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(
  tableTests: EndpointTest[],
  serviceKeyValid: boolean
): string[] {
  const recommendations: string[] = [];

  if (!serviceKeyValid) {
    recommendations.push('❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set in environment');
    recommendations.push('   → Add SUPABASE_SERVICE_ROLE_KEY to .env.local');
    recommendations.push('   → Get key from Supabase dashboard');
  }

  const rlsBlocked = tableTests.filter((t) => t.hasRLS);
  if (rlsBlocked.length > 0) {
    recommendations.push(`⚠️  RLS POLICIES blocking ${rlsBlocked.length} table(s):`);
    rlsBlocked.forEach((t) => {
      recommendations.push(`   - ${t.table}: ${t.error}`);
    });
    recommendations.push('   → Check RLS policies in Supabase dashboard');
    recommendations.push('   → Ensure service role has SELECT/INSERT/UPDATE/DELETE permissions');
  }

  const emptyTables = tableTests.filter((t) => !t.error && t.rowCount === 0);
  if (emptyTables.length > 0) {
    recommendations.push(`📭 Empty table(s) with no data:`);
    emptyTables.forEach((t) => {
      recommendations.push(`   - ${t.table}: 0 records`);
    });
    recommendations.push('   → Seed data or import from backup');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All systems operational!');
  }

  return recommendations;
}
