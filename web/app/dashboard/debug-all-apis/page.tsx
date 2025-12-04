"use client";

import { useEffect, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { Card } from '@/components/ui';

interface ApiTest {
  name: string;
  endpoint: string;
  method?: string;
  description: string;
  category: string;
  expectedStatus?: number; // For tests that expect non-200 responses
}

interface TestResult {
  name: string;
  endpoint: string;
  status: number | string;
  ok: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

const API_TESTS: ApiTest[] = [
  // Classes APIs
  {
    name: 'My Classes',
    endpoint: '/api/classes/my-classes',
    description: 'Get classes for current teacher/admin',
    category: 'Classes'
  },
  {
    name: 'All Classes',
    endpoint: '/api/classes',
    description: 'Get all classes',
    category: 'Classes'
  },

  // Grades APIs
  {
    name: 'Grades (All)',
    endpoint: '/api/grades',
    description: 'Get all grades',
    category: 'Grades'
  },
  {
    name: 'Grade Assignments',
    endpoint: '/api/grades/assignments',
    description: 'Get assignments for grading',
    category: 'Grades'
  },
  {
    name: 'Grade Categories',
    endpoint: '/api/grades/categories',
    description: 'Get grade categories/weights',
    category: 'Grades'
  },

  // Students APIs
  {
    name: 'Students List',
    endpoint: '/api/admin/students?page=1&limit=10',
    description: 'Get paginated student list',
    category: 'Students'
  },
  {
    name: 'Student Stats',
    endpoint: '/api/admin/students/stats',
    description: 'Get student statistics',
    category: 'Students'
  },

  // Users APIs
  {
    name: 'Users List',
    endpoint: '/api/admin/users?page=1&limit=10',
    description: 'Get all users',
    category: 'Users'
  },
  {
    name: 'User Stats',
    endpoint: '/api/admin/users/stats',
    description: 'Get user statistics',
    category: 'Users'
  },

  // Settings APIs
  {
    name: 'Settings',
    endpoint: '/api/admin/settings',
    description: 'Get system settings',
    category: 'Settings'
  },
  {
    name: 'Academic Years',
    endpoint: '/api/admin/academic-years',
    description: 'Get academic years',
    category: 'Settings'
  },

  // Attendance APIs
  {
    name: 'Attendance',
    endpoint: '/api/attendance',
    description: 'Get attendance records',
    category: 'Attendance'
  },

  // Finance APIs
  {
    name: 'Student Accounts',
    endpoint: '/api/admin/finance/student-accounts',
    description: 'Get student financial accounts',
    category: 'Finance'
  },

  // Courses/Lessons APIs
  {
    name: 'Courses',
    endpoint: '/api/courses',
    description: 'Get all courses (requires HMAC signature)',
    category: 'Courses',
    expectedStatus: 401 // Expected to fail without signature
  },
  {
    name: 'Admin Courses',
    endpoint: '/api/admin/courses',
    description: 'Get all courses (admin/teacher access)',
    category: 'Courses'
  },

  // Dashboard Stats
  {
    name: 'Dashboard Stats',
    endpoint: '/api/dashboard/stats',
    description: 'Get dashboard statistics',
    category: 'Dashboard'
  },
];

export default function DebugAllApisPage() {
  const [authState, setAuthState] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const supabase = getBrowserSupabase();
    
    // Check session
    const { data: sessionData } = await supabase.auth.getSession();
    setAuthState({
      hasSession: !!sessionData.session,
      user: sessionData.session?.user,
      accessToken: sessionData.session?.access_token ? 'Present' : 'Missing',
    });

    // Check profile
    if (sessionData.session?.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single();
      
      setProfile(profileData);
    }

    setLoading(false);
  }

  async function runAllTests() {
    setTesting(true);
    const results: TestResult[] = [];
    
    const supabase = getBrowserSupabase();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    for (const test of API_TESTS) {
      const startTime = Date.now();
      
      try {
        const res = await fetch(test.endpoint, {
          method: test.method || 'GET',
          credentials: 'same-origin',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const duration = Date.now() - startTime;
        let data;
        
        try {
          data = await res.json();
        } catch {
          data = { message: 'Non-JSON response' };
        }

        results.push({
          name: test.name,
          endpoint: test.endpoint,
          status: res.status,
          ok: test.expectedStatus ? res.status === test.expectedStatus : res.ok,
          data: data,
          duration
        });
      } catch (error: any) {
        results.push({
          name: test.name,
          endpoint: test.endpoint,
          status: 'error',
          ok: false,
          error: error.message,
          duration: Date.now() - startTime
        });
      }
    }

    setTestResults(results);
    setTesting(false);
  }

  function copyAllErrors() {
    const errorReport: string[] = [];
    
    errorReport.push('='.repeat(80));
    errorReport.push('API DEBUGGING REPORT - ALL ENDPOINTS');
    errorReport.push('Generated: ' + new Date().toLocaleString());
    errorReport.push('='.repeat(80));
    errorReport.push('');
    
    // Session info
    errorReport.push('SESSION STATUS:');
    errorReport.push(`  Has Session: ${authState?.hasSession ? 'Yes' : 'No'}`);
    errorReport.push(`  Access Token: ${authState?.accessToken}`);
    if (authState?.user) {
      errorReport.push(`  User ID: ${authState.user.id}`);
      errorReport.push(`  Email: ${authState.user.email}`);
    }
    if (profile) {
      errorReport.push(`  Role: ${profile.role}`);
      errorReport.push(`  Name: ${profile.full_name}`);
    }
    errorReport.push('');
    
    // Summary
    const passedTests = testResults.filter(r => r.ok).length;
    const failedTests = testResults.filter(r => !r.ok).length;
    
    errorReport.push('TEST SUMMARY:');
    errorReport.push(`  Total Tests: ${testResults.length}`);
    errorReport.push(`  Passed: ${passedTests} ✅`);
    errorReport.push(`  Failed: ${failedTests} ❌`);
    errorReport.push(`  Success Rate: ${testResults.length > 0 ? Math.round((passedTests / testResults.length) * 100) : 0}%`);
    errorReport.push('');
    
    // Group by category
    const byCategory = testResults.reduce((acc, result) => {
      const test = API_TESTS.find(t => t.name === result.name);
      const category = test?.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push({ result, test });
      return acc;
    }, {} as Record<string, Array<{ result: TestResult; test?: ApiTest }>>);
    
    errorReport.push('API TEST RESULTS (BY CATEGORY):');
    errorReport.push('');
    
    Object.entries(byCategory).forEach(([category, tests]) => {
      errorReport.push(`${'='.repeat(80)}`);
      errorReport.push(`CATEGORY: ${category.toUpperCase()}`);
      errorReport.push(`${'='.repeat(80)}`);
      errorReport.push('');
      
      tests.forEach(({ result, test }, idx) => {
        errorReport.push(`${idx + 1}. ${result.name} ${result.ok ? '✅' : '❌'}`);
        errorReport.push(`   Endpoint: ${result.endpoint}`);
        if (test?.description) {
          errorReport.push(`   Description: ${test.description}`);
        }
        errorReport.push(`   Status: ${result.status}`);
        if (result.duration) {
          errorReport.push(`   Duration: ${result.duration}ms`);
        }
        
        // Only show response details for failed tests or errors
        if (!result.ok || result.error) {
          errorReport.push('   Response:');
          const response = JSON.stringify(result.data || result.error, null, 2);
          response.split('\n').forEach(line => {
            errorReport.push('      ' + line);
          });
        }
        errorReport.push('');
      });
    });
    
    // Failed tests summary
    const failedResults = testResults.filter(r => !r.ok);
    if (failedResults.length > 0) {
      errorReport.push('='.repeat(80));
      errorReport.push('FAILED TESTS SUMMARY');
      errorReport.push('='.repeat(80));
      errorReport.push('');
      
      failedResults.forEach((result, idx) => {
        errorReport.push(`${idx + 1}. ${result.name} - Status ${result.status}`);
        errorReport.push(`   ${result.endpoint}`);
        
        // Try to extract meaningful error info
        if (result.data) {
          if (result.data.message) errorReport.push(`   Message: ${result.data.message}`);
          if (result.data.code) errorReport.push(`   Code: ${result.data.code}`);
          if (result.data.hint) errorReport.push(`   Hint: ${result.data.hint}`);
          if (result.data.details) errorReport.push(`   Details: ${result.data.details}`);
        }
        if (result.error) {
          errorReport.push(`   Error: ${result.error}`);
        }
        errorReport.push('');
      });
    }
    
    errorReport.push('='.repeat(80));
    errorReport.push('END OF REPORT');
    errorReport.push('='.repeat(80));
    
    const reportText = errorReport.join('\n');
    
    // Copy to clipboard
    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((err) => {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard. Please check browser permissions.');
    });
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">API Debugger - All Endpoints</h1>
        <p>Loading...</p>
      </div>
    );
  }

  const categories = ['all', ...new Set(API_TESTS.map(t => t.category))];
  const filteredResults = filter === 'all' 
    ? testResults 
    : testResults.filter(r => {
        const test = API_TESTS.find(t => t.name === r.name);
        return test?.category === filter;
      });

  const passedTests = testResults.filter(r => r.ok).length;
  const failedTests = testResults.filter(r => !r.ok).length;
  const totalTests = testResults.length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API Debugger - All Endpoints</h1>
        <div className="flex gap-3">
          {testResults.length > 0 && (
            <button
              onClick={copyAllErrors}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <span>✓</span>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Copy All Results</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={runAllTests}
            disabled={testing || !authState?.hasSession}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {testing ? 'Testing...' : 'Run All Tests'}
          </button>
        </div>
      </div>

      {/* Session Info */}
      <Card>
        <h2 className="text-xl font-semibold mb-2">Session Status</h2>
        <div className="space-y-2">
          <p><strong>Has Session:</strong> {authState?.hasSession ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Access Token:</strong> {authState?.accessToken}</p>
          {authState?.user && (
            <>
              <p><strong>User ID:</strong> {authState.user.id}</p>
              <p><strong>Email:</strong> {authState.user.email}</p>
              <p><strong>Role:</strong> {profile?.role || 'Unknown'}</p>
            </>
          )}
        </div>
      </Card>

      {/* Test Summary */}
      {testResults.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold mb-2">Test Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-700">{totalTests}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{passedTests}</div>
              <div className="text-sm text-gray-600">Passed ✅</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{failedTests}</div>
              <div className="text-sm text-gray-600">Failed ❌</div>
            </div>
          </div>
        </Card>
      )}

      {/* API Tests */}
      {testResults.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">API Test Results</h2>
            <div className="flex gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1 text-sm rounded ${
                    filter === cat 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredResults.map((test, idx) => {
              const apiTest = API_TESTS.find(t => t.name === test.name);
              return (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {test.name}
                        <span className={`text-xs px-2 py-1 rounded ${
                          test.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {test.status} {test.ok ? '✅' : '❌'}
                        </span>
                        {test.duration && (
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                            {test.duration}ms
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {apiTest?.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        {test.endpoint}
                      </p>
                    </div>
                  </div>

                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                      Show response
                    </summary>
                    <pre className="bg-gray-100 p-3 rounded mt-2 overflow-auto text-xs max-h-96">
                      {JSON.stringify(test.data || test.error, null, 2)}
                    </pre>
                  </details>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Instructions */}
      {testResults.length === 0 && (
        <Card>
          <h2 className="text-xl font-semibold mb-2">Instructions</h2>
          <div className="space-y-2 text-sm">
            <p>This page tests all API endpoints used in the application.</p>
            <p className="font-semibold">Click "Run All Tests" to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Test {API_TESTS.length} API endpoints</li>
              <li>Check authentication and authorization</li>
              <li>Identify schema mismatches</li>
              <li>Verify RLS policies</li>
              <li>Measure response times</li>
            </ul>
            {!authState?.hasSession && (
              <p className="text-red-600 font-semibold mt-4">
                ⚠️ You must be logged in to run tests.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* API List Reference */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">API Endpoints Reference</h2>
        <div className="space-y-4">
          {Object.entries(
            API_TESTS.reduce((acc, test) => {
              if (!acc[test.category]) acc[test.category] = [];
              acc[test.category].push(test);
              return acc;
            }, {} as Record<string, ApiTest[]>)
          ).map(([category, tests]) => (
            <div key={category}>
              <h3 className="font-semibold text-lg mb-2">{category}</h3>
              <div className="space-y-2">
                {tests.map((test, idx) => (
                  <div key={idx} className="text-sm border-l-4 border-blue-400 pl-3 py-1">
                    <div className="font-medium">{test.name}</div>
                    <div className="text-gray-600 font-mono text-xs">{test.endpoint}</div>
                    <div className="text-gray-500 text-xs">{test.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Troubleshooting */}
      {testResults.length > 0 && failedTests > 0 && (
        <Card>
          <h2 className="text-xl font-semibold mb-2 text-red-600">Troubleshooting Failed Tests</h2>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Common Issues:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>401 Unauthorized:</strong> Authentication failed - check if logged in</li>
              <li><strong>403 Forbidden:</strong> User doesn't have required role/permissions</li>
              <li><strong>404 Not Found:</strong> API endpoint doesn't exist</li>
              <li><strong>500 Internal Error:</strong> Check response details for:
                <ul className="list-circle list-inside ml-6 mt-1">
                  <li><code>column does not exist</code> - Schema mismatch</li>
                  <li><code>table does not exist</code> - Missing table or RLS blocking access</li>
                  <li><code>relationship was found</code> - Ambiguous foreign key</li>
                </ul>
              </li>
            </ul>
            
            <p className="font-semibold mt-4">Next Steps:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Expand failed test responses to see error details</li>
              <li>Check error <code>code</code> and <code>hint</code> fields</li>
              <li>Verify database schema matches API queries</li>
              <li>Check RLS policies allow access for your role</li>
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}
