"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';

export default function DataDumpPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      const tables = [
        'profiles', 'classes', 'enrollments', 'attendance',
        'assignments', 'assignment_categories', 'grades', 'guardians',
        'courses', 'lessons', 'academic_years', 'grading_scales',
        'fee_types', 'payment_methods', 'audit_logs', 'import_logs',
        'import_errors', 'school_settings', 'student_accounts',
        'invoices', 'invoice_items', 'payments', 'payment_allocations',
        'fee_assignments', 'payment_schedules', 'payment_schedule_installments'
      ];

      const results: any = {};

      for (const table of tables) {
        try {
          const response = await fetch(`/api/admin/data/${table}?limit=1000`);
          if (response.ok) {
            const json = await response.json();
            results[table] = {
              count: json.pagination?.total || 0,
              data: json.data || [],
              success: true
            };
          } else {
            results[table] = {
              count: 0,
              data: [],
              error: await response.text(),
              success: false
            };
          }
        } catch (error: any) {
          results[table] = {
            count: 0,
            data: [],
            error: error.message,
            success: false
          };
        }
      }

      setData(results);
      setLoading(false);

      // Log to console
      console.log('='.repeat(80));
      console.log('DATABASE DATA DUMP - ' + new Date().toLocaleString());
      console.log('='.repeat(80));
      
      // Summary table
      const summary = Object.entries(results).map(([table, info]: [string, any]) => ({
        Table: table,
        Count: info.count,
        Status: info.success ? '✅' : '❌',
        Error: info.error || '-'
      }));
      console.table(summary);

      // Full data
      console.log('\n' + '='.repeat(80));
      console.log('FULL DATA BY TABLE');
      console.log('='.repeat(80));
      Object.entries(results).forEach(([table, info]: [string, any]) => {
        console.log(`\n📊 ${table.toUpperCase()} (${info.count} records)`);
        if (info.data.length > 0) {
          console.table(info.data);
        } else {
          console.log('  (empty)');
        }
      });

      console.log('\n' + '='.repeat(80));
      console.log('JSON DATA');
      console.log('='.repeat(80));
      console.log(JSON.stringify(results, null, 2));
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Fetching All Database Data...</h2>
          <p className="text-gray-600 mt-2">This may take a moment</p>
        </Card>
      </div>
    );
  }

  const summary = data ? Object.entries(data).map(([table, info]: [string, any]) => ({
    table,
    count: info.count,
    success: info.success,
    error: info.error
  })) : [];

  const totalRecords = summary.reduce((sum, item) => sum + item.count, 0);
  const successTables = summary.filter(item => item.success).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📥 Database Data Dump Complete
          </h1>
          <p className="text-gray-600 mb-6">
            All data has been exported to your browser console
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{summary.length}</p>
              <p className="text-sm text-gray-600">Tables Checked</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{successTables}</p>
              <p className="text-sm text-gray-600">Successful</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{totalRecords}</p>
              <p className="text-sm text-gray-600">Total Records</p>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">💡</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 font-medium">
                  Open your browser DevTools to see the data:
                </p>
                <ol className="mt-2 text-sm text-yellow-700 list-decimal list-inside space-y-1">
                  <li>Press <kbd className="px-2 py-1 bg-white rounded border">F12</kbd> or right-click → Inspect</li>
                  <li>Click on the "Console" tab</li>
                  <li>Scroll up to see the formatted tables and JSON data</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg mb-3">Table Summary:</h3>
            {summary.map(item => (
              <div
                key={item.table}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  item.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.success ? '✅' : '❌'}</span>
                  <span className="font-medium text-gray-900">{item.table}</span>
                </div>
                <div className="text-right">
                  {item.success ? (
                    <span className="text-green-600 font-semibold">{item.count} records</span>
                  ) : (
                    <span className="text-red-600 text-sm">{item.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              🔄 Refresh Data
            </button>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `database-dump-${Date.now()}.json`;
                a.click();
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              💾 Download JSON
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
