"use client";

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Card } from '@/components/ui';

interface TableData {
  tableName: string;
  count: number;
  data: any[];
  error?: string;
  loading: boolean;
}

export default function DataViewerPage() {
  const [tables, setTables] = useState<string[]>([]);
  const [tableData, setTableData] = useState<Record<string, TableData>>({});
  const [selectedTable, setSelectedTable] = useState<string>('');

  // Fetch allowed tables list
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await apiFetch('/api/admin/data/tables');
        const result = await response.json();
        const tableList = result.data || [];
        setTables(tableList);
        if (tableList.length > 0 && !selectedTable) {
          setSelectedTable(tableList[0]);
        }
      } catch (error) {
        console.error('Failed to fetch tables:', error);
      }
    };
    fetchTables();
  }, [selectedTable]);

  const fetchTableData = useCallback(async (tableName: string) => {
    setTableData(prev => ({
      ...prev,
      [tableName]: { tableName, count: 0, data: [], loading: true }
    }));

    try {
      // Use the admin API to fetch table data
      const response = await apiFetch(`/api/admin/data/${tableName}?limit=100`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }

      const result = await response.json();

      setTableData(prev => ({
        ...prev,
        [tableName]: {
          tableName,
          count: result.pagination?.total || 0,
          data: result.data || [],
          loading: false
        }
      }));
    } catch (error: any) {
      setTableData(prev => ({
        ...prev,
        [tableName]: {
          tableName,
          count: 0,
          data: [],
          error: error.message,
          loading: false
        }
      }));
    }
  }, []);

  useEffect(() => {
    // Fetch all table counts on mount
    tables.forEach(table => fetchTableData(table));
  }, [tables, fetchTableData]);

  const selectedData = tableData[selectedTable];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Database Data Viewer
          </h1>
          <p className="text-gray-600">
            View all data from your Supabase tables
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Table List */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Tables</h2>
              <div className="space-y-2">
                {tables.map(table => {
                  const data = tableData[table];
                  const isSelected = selectedTable === table;
                  
                  return (
                    <button
                      key={table}
                      onClick={() => setSelectedTable(table)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{table}</span>
                        {data?.loading ? (
                          <span className="text-xs">...</span>
                        ) : data?.error ? (
                          <span className="text-xs text-red-500">❌</span>
                        ) : (
                          <span className={`text-xs font-semibold ${
                            isSelected ? 'text-white' : 'text-blue-600'
                          }`}>
                            {data?.count ?? 0}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Data Display */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedTable}
                  </h2>
                  {selectedData && !selectedData.loading && !selectedData.error && (
                    <p className="text-sm text-gray-600 mt-1">
                      Showing {selectedData.data.length} of {selectedData.count} rows
                    </p>
                  )}
                </div>
                <button
                  onClick={() => fetchTableData(selectedTable)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  🔄 Refresh
                </button>
              </div>

              {/* Loading State */}
              {selectedData?.loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Loading...</span>
                </div>
              )}

              {/* Error State */}
              {selectedData?.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-medium">❌ Error loading data</p>
                  <p className="text-red-600 text-sm mt-1">{selectedData.error}</p>
                </div>
              )}

              {/* Empty State */}
              {selectedData && !selectedData.loading && !selectedData.error && selectedData.data.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">No data in this table</p>
                </div>
              )}

              {/* Data Display */}
              {selectedData && !selectedData.loading && !selectedData.error && selectedData.data.length > 0 && (
                <div className="overflow-x-auto">
                  <div className="space-y-4">
                    {selectedData.data.map((row, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(row).map(([key, value]) => (
                            <div key={key} className="flex flex-col">
                              <span className="text-xs font-semibold text-gray-600 uppercase mb-1">
                                {key}
                              </span>
                              <span className="text-sm text-gray-900 font-mono break-all">
                                {value === null ? (
                                  <span className="text-gray-600 italic">null</span>
                                ) : typeof value === 'object' ? (
                                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(value, null, 2)}
                                  </pre>
                                ) : typeof value === 'boolean' ? (
                                  <span className={value ? 'text-green-600' : 'text-red-600'}>
                                    {value ? '✓ true' : '✗ false'}
                                  </span>
                                ) : (
                                  String(value)
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Summary Stats */}
        <Card className="mt-6 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">📈 Database Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map(table => {
              const data = tableData[table];
              return (
                <div key={table} className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {data?.loading ? '...' : data?.error ? '❌' : data?.count ?? 0}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{table}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Export Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              const summary = tables.map(table => {
                const data = tableData[table];
                return {
                  table,
                  count: data?.count ?? 0,
                  hasError: !!data?.error,
                  error: data?.error
                };
              });
              
              console.log('=== DATABASE SUMMARY ===');
              console.table(summary);
              console.log('=== FULL DATA ===');
              console.log(JSON.stringify(tableData, null, 2));
              
              alert('Data exported to browser console! Check DevTools → Console');
            }}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            📥 Export All Data to Console
          </button>
        </div>
      </div>
    </div>
  );
}
