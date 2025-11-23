"use client";

import { useState } from "react";

export default function DiagnosticPage() {
  const [results, setResults] = useState<any>({});
  const [testing, setTesting] = useState(false);

  const testEndpoints = async () => {
    setTesting(true);
    const endpoints = [
      '/api/admin/students',
      '/api/admin/teachers',
      '/api/admin/classes',
      '/api/admin/assignments',
      '/api/admin/grades',
      '/api/admin/attendance',
      '/api/admin/enrollments',
      '/api/admin/academic-years',
      '/api/admin/grading-scales',
      '/api/admin/fee-types',
    ];

    const testResults: any = {};

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        const data = await response.json();
        
        testResults[endpoint] = {
          status: response.status,
          ok: response.ok,
          success: data.success,
          dataLength: Array.isArray(data.data) ? data.data.length : 'N/A',
          error: data.error || null,
        };
      } catch (error: any) {
        testResults[endpoint] = {
          status: 'ERROR',
          error: error.message,
        };
      }
    }

    setResults(testResults);
    setTesting(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">API Diagnostics</h1>
        <p className="text-sm text-gray-600">Test all admin API endpoints</p>
      </div>

      <button
        onClick={testEndpoints}
        disabled={testing}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {testing ? 'Testing...' : 'Run Diagnostic Test'}
      </button>

      {Object.keys(results).length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Endpoint</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Success</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data Count</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(results).map(([endpoint, result]: [string, any]) => (
                <tr key={endpoint} className={result.ok ? 'bg-green-50' : 'bg-red-50'}>
                  <td className="px-4 py-2 text-sm font-mono">{endpoint}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded ${
                      result.status === 200 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {result.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {result.success ? '✅' : '❌'}
                  </td>
                  <td className="px-4 py-2 text-sm">{result.dataLength}</td>
                  <td className="px-4 py-2 text-sm text-red-600">{result.error || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Click "Run Diagnostic Test" button</li>
          <li>2. Wait for all endpoints to be tested</li>
          <li>3. Check which endpoints are failing (red rows)</li>
          <li>4. Share the results with the developer</li>
        </ol>
      </div>
    </div>
  );
}
