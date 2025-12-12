/**
 * Data Sync Diagnostic Script
 * Checks which API endpoints work and why data might not be syncing
 * 
 * Run with: npx ts-node scripts/diagnose-data-sync.ts
 * Or in browser console: fetch('/api/debug/diagnose').then(r => r.json()).then(console.log)
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface DiagnosticResult {
  endpoint: string;
  status: number | string;
  success: boolean;
  dataCount: number;
  responseFormat: string;
  error?: string;
  details?: any;
}

const endpoints = [
  // Core data endpoints
  {
    name: 'Students',
    url: '/api/admin/students?limit=5',
    dataPath: ['students', 'data'],
    countPath: 'total'
  },
  {
    name: 'Classes',
    url: '/api/admin/classes?limit=5',
    dataPath: ['classes', 'data'],
    countPath: 'total'
  },
  {
    name: 'Attendance',
    url: '/api/attendance?limit=5',
    dataPath: ['data', 'attendance'],
    countPath: null
  },
  {
    name: 'Grades',
    url: '/api/grades/conduct-entry?limit=5',
    dataPath: ['data', 'grades', 'students'],
    countPath: null
  },
  {
    name: 'Courses',
    url: '/api/admin/courses?limit=5',
    dataPath: ['courses', 'data'],
    countPath: 'total'
  },
  {
    name: 'Academic Years',
    url: '/api/admin/academic-years?limit=5',
    dataPath: ['data', 'academic_years'],
    countPath: 'total'
  },
  {
    name: 'Fee Types',
    url: '/api/admin/fee-types?limit=5',
    dataPath: ['data', 'fee_types'],
    countPath: 'total'
  },
  {
    name: 'Users',
    url: '/api/admin/users?role=student&limit=5',
    dataPath: ['data', 'users'],
    countPath: 'total'
  },
  {
    name: 'Invoices',
    url: '/api/admin/finance/invoices?limit=5',
    dataPath: ['data', 'invoices'],
    countPath: 'total'
  },
  {
    name: 'Lessons',
    url: '/api/admin/lessons?limit=5',
    dataPath: ['data', 'lessons'],
    countPath: 'total'
  }
];

function getValueByPath(obj: any, paths: string[]): any {
  for (const path of paths) {
    if (typeof obj === 'object' && obj !== null && path in obj) {
      return obj[path];
    }
  }
  return null;
}

export async function diagnoseDataSync(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  console.log('🔍 DIAGNOSING DATA SYNC ISSUES...\n');
  console.log('━'.repeat(80));

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📊 Testing: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);

      const response = await fetch(`${BASE_URL}${endpoint.url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const status = response.status;
      const data = await response.json();

      // Try to extract data from possible locations
      let dataArray = getValueByPath(data, endpoint.dataPath) || [];
      if (!Array.isArray(dataArray)) {
        dataArray = [];
      }

      // Get count if available
      let count = dataArray.length;
      if (endpoint.countPath && data[endpoint.countPath]) {
        count = data[endpoint.countPath];
      }

      const success = response.ok && dataArray.length > 0;

      const result: DiagnosticResult = {
        endpoint: endpoint.name,
        status,
        success,
        dataCount: count,
        responseFormat: JSON.stringify(data).substring(0, 100),
        details: {
          hasSuccess: 'success' in data,
          hasData: 'data' in data,
          hasStudents: 'students' in data,
          hasClasses: 'classes' in data,
          responseKeys: Object.keys(data),
        },
      };

      if (!response.ok) {
        result.error = data.error || `HTTP ${status}`;
      } else if (dataArray.length === 0) {
        result.error = 'No data returned';
      }

      results.push(result);

      const icon = success ? '✅' : '❌';
      console.log(`   ${icon} Status: ${status}, Data count: ${count}`);

      if (!success) {
        console.log(`   ⚠️  Error: ${result.error}`);
        console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);

      results.push({
        endpoint: endpoint.name,
        status: 'ERROR',
        success: false,
        dataCount: 0,
        responseFormat: 'error',
        error: error.message,
      });
    }
  }

  console.log('\n' + '━'.repeat(80));
  console.log('\n📈 SUMMARY:\n');

  const working = results.filter((r) => r.success).length;
  const total = results.length;

  console.log(`Working endpoints: ${working}/${total}`);
  console.log(`Failed endpoints: ${total - working}/${total}\n`);

  if (working === 0) {
    console.log('⚠️  CRITICAL: No endpoints are working!');
    console.log('   Possible causes:');
    console.log('   1. Service role key is missing or invalid');
    console.log('   2. RLS policies are blocking all access');
    console.log('   3. Database connection is down\n');
  }

  if (working < total) {
    console.log('❌ Failed endpoints:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${r.endpoint}: ${r.error}`);
      });
    console.log();
  }

  console.log('📋 RECOMMENDATIONS:\n');

  const hasRLSIssues = results.some(
    (r) => r.error && (r.error.includes('RLS') || r.error.includes('policy'))
  );

  const hasMissingData = results.some((r) => r.error && r.error.includes('No data'));

  const hasAuthIssues = results.some(
    (r) => r.error && (r.error.includes('Unauthorized') || r.error.includes('401'))
  );

  if (hasAuthIssues) {
    console.log('🔑 AUTH ISSUE DETECTED:');
    console.log('   - Service role key might be missing');
    console.log('   - Check: SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.log('   - Regenerate in Supabase dashboard if needed\n');
  }

  if (hasRLSIssues) {
    console.log('🔒 RLS POLICY ISSUE DETECTED:');
    console.log('   - Row Level Security is blocking access');
    console.log('   - Check: Supabase dashboard → Database → Policies');
    console.log('   - Verify: Service role has access to all tables\n');
  }

  if (hasMissingData) {
    console.log('📭 NO DATA ISSUE:');
    console.log('   - Database tables might be empty');
    console.log('   - Or: Filters are too restrictive');
    console.log('   - Check: Supabase dashboard → SQL Editor\n');
  }

  return results;
}

// Export for use in API route
export default diagnoseDataSync;
