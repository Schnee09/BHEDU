"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";

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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Icons.Settings className="w-8 h-8 text-blue-600" />
            API Diagnostics
          </h1>
          <p className="text-gray-500 mt-1">Test all admin API endpoints</p>
        </div>
        <button
          onClick={testEndpoints}
          disabled={testing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {testing ? (
            <>
              <Icons.Progress className="w-5 h-5 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Icons.View className="w-5 h-5" />
              Run Diagnostic Test
            </>
          )}
        </button>
      </div>

      {Object.keys(results).length > 0 ? (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(results).map(([endpoint, result]: [string, any]) => (
                    <tr key={endpoint} className={result.ok ? 'bg-green-50/30' : 'bg-red-50/30'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">{endpoint}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          result.status === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {result.success ? (
                          <Icons.Success className="w-5 h-5 text-green-600" />
                        ) : (
                          <Icons.Error className="w-5 h-5 text-red-600" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{result.dataLength}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{result.error || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="text-center py-12 text-gray-500">
            <Icons.Settings className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Click "Run Diagnostic Test" to check API health.</p>
          </CardBody>
        </Card>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Icons.Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Diagnostic Information</p>
          <p>This tool tests the connectivity and response of key admin API endpoints. Use this to verify that the backend services are running correctly and returning expected data structures.</p>
        </div>
      </div>
    </div>
  );
}
