"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ImportResult {
  total: number
  successful: number
  failed: number
  errors: Array<{ row: number; email: string; error: string }>
}

export default function BulkUserImportPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [preview, setPreview] = useState<string[][]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      // Read and preview first 5 rows
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        const rows = text.split('\n').slice(0, 6).map(row => row.split(','))
        setPreview(rows)
      }
      reader.readAsText(selectedFile)
    }
  }

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    const users = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const user: Record<string, string | boolean> = {}
      
      headers.forEach((header, index) => {
        if (values[index]) {
          if (header === 'is_active') {
            user[header] = values[index].toLowerCase() === 'true' || values[index] === '1'
          } else {
            user[header] = values[index]
          }
        }
      })
      
      users.push(user)
    }
    
    return users
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setResult(null)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        const users = parseCSV(text)

        const response = await fetch('/api/admin/users/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users })
        })

        const data = await response.json()

        if (data.success) {
          setResult(data.data)
        } else {
          alert('Import failed: ' + data.error)
        }
      }
      reader.readAsText(file)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    const template = `email,password,first_name,last_name,role,phone,department,student_id,grade_level,notes,is_active
john.teacher@example.com,SecurePass123!,John,Smith,teacher,555-1234,Mathematics,,,,true
jane.student@example.com,,Jane,Doe,student,555-5678,,STU2024001,9,,true
admin.user@example.com,Admin@2024,Admin,User,admin,555-9999,,,,,true`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'user_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/dashboard/users"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bulk User Import</h1>
            <p className="text-sm text-gray-600">Import multiple users from CSV file</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Upload CSV File</h2>

            {/* File Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
              />
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows)</h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <tbody className="divide-y divide-gray-200">
                      {preview.map((row, rowIdx) => (
                        <tr key={rowIdx} className={rowIdx === 0 ? 'bg-gray-50 font-medium' : ''}>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-3 py-2 whitespace-nowrap">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 text-white py-3 rounded-lg font-medium hover:from-amber-700 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {uploading ? 'Importing...' : 'Import Users'}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <h2 className="text-lg font-semibold mb-4">Import Results</h2>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{result.total}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{result.successful}</p>
                  <p className="text-sm text-gray-600">Successful</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{result.failed}</p>
                  <p className="text-sm text-gray-600">Failed</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div>
                  <h3 className="font-medium text-red-600 mb-3">Errors ({result.errors.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {result.errors.map((error, idx) => (
                      <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                        <p className="font-medium">Row {error.row}: {error.email}</p>
                        <p className="text-red-600">{error.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => router.push('/dashboard/users')}
                  className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition"
                >
                  View All Users
                </button>
                <button
                  onClick={() => {
                    setFile(null)
                    setResult(null)
                    setPreview([])
                  }}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Import Another File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Instructions</h2>

            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">1. Download Template</h3>
                <p className="text-gray-600 mb-2">Get the CSV template with correct headers</p>
                <button
                  onClick={downloadTemplate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-amber-600 text-amber-600 rounded-lg hover:bg-amber-50 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Template
                </button>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">2. Fill in User Data</h3>
                <p className="text-gray-600">Required fields:</p>
                <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                  <li>email</li>
                  <li>first_name</li>
                  <li>last_name</li>
                  <li>role (admin/teacher/student)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">3. Optional Fields</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>password (auto-generated if blank)</li>
                  <li>phone</li>
                  <li>department (for teachers)</li>
                  <li>student_id (for students)</li>
                  <li>grade_level (for students)</li>
                  <li>notes</li>
                  <li>is_active (default: true)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">4. Upload & Import</h3>
                <p className="text-gray-600">
                  Upload your CSV file and click Import. Any errors will be shown for correction.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  💡 <strong>Tip:</strong> If no password is provided, a secure random password will be generated automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
