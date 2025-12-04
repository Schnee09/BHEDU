/**
 * Bulk Student Import Page
 * Admin-only page for importing students via CSV
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api/client'
import { 
  parseCSV, 
  validateImportData, 
  generateCSVTemplate,
  type ImportPreview
} from '@/lib/importService'
import { Button, Card, CardHeader, Badge } from '@/components/ui'

export default function BulkImportPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [importing, setImporting] = useState(false)
  const [importComplete, setImportComplete] = useState(false)
  const [importResults, setImportResults] = useState<{
    total: number
    successCount: number
    errorCount: number
    errors: Array<{ row: number; email: string; error: string }>
  } | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Handle file selection
  const handleFileChange = async (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null)
      setPreview(null)
      return
    }

    setFile(selectedFile)

    try {
      // Parse and validate CSV
      const rows = await parseCSV(selectedFile)
      const validation = await validateImportData(rows)
      setPreview(validation)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to parse CSV file')
      setFile(null)
      setPreview(null)
    }
  }

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  // Download CSV template
  const downloadTemplate = () => {
    const csv = generateCSVTemplate()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Handle import
  const handleImport = async () => {
    if (!preview || preview.valid.length === 0) {
      alert('No valid students to import')
      return
    }

    if (preview.errorRows > 0) {
      const confirmed = confirm(
        `There are ${preview.errorRows} rows with errors. Do you want to import only the ${preview.validRows} valid students?`
      )
      if (!confirmed) return
    }

    setImporting(true)

    try {
      const response = await apiFetch('/api/admin/students/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          students: preview.valid
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setImportResults(data.results)
      setImportComplete(true)

    } catch (error) {
      alert(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  // Reset form
  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setImportComplete(false)
    setImportResults(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/students">
            <Button variant="ghost" className="mb-4">
              ← Back to Students
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Bulk Student Import</h1>
          <p className="text-lg text-slate-600">
            Import multiple students at once using a CSV file
          </p>
        </div>

        {!importComplete ? (
          <div>
            {/* Download Template */}
            <Card className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader
                title="📥 Step 1: Download Template"
                subtitle="Download our CSV template with sample data to see the required format"
              />
              <Button
                onClick={downloadTemplate}
                variant="primary"
              >
                ⬇️ Download CSV Template
              </Button>
            </Card>

            {/* File Upload */}
            <Card className="mb-6">
              <CardHeader title="📤 Step 2: Upload Your CSV File" />
              
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div className="text-7xl mb-4">📄</div>
                  <span className="text-xl font-semibold text-slate-900 mb-2">
                    {file ? file.name : 'Drop CSV file here or click to browse'}
                  </span>
                  <span className="text-sm text-slate-500">
                    CSV files only, max 10 MB
                  </span>
                </label>
              </div>

              {file && (
                <div className="mt-4 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-semibold text-slate-900">{file.name}</p>
                      <p className="text-sm text-slate-600">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleFileChange(null)}
                    variant="outline"
                  >
                    🗑️ Remove
                  </Button>
                </div>
              )}
            </Card>
            
            {/* Preview and Validation Results */}
            {preview && (
              <Card className="mb-6">
                <CardHeader title="📋 Step 3: Review and Import" />

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-700">{preview.totalRows}</p>
                      <p className="text-sm text-blue-600 mt-1 font-medium">Total Rows</p>
                    </div>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-700">{preview.validRows}</p>
                      <p className="text-sm text-green-600 mt-1 font-medium">Valid Students</p>
                    </div>
                  </Card>
                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-red-700">{preview.errorRows}</p>
                      <p className="text-sm text-red-600 mt-1 font-medium">Errors</p>
                    </div>
                  </Card>
                </div>

                {/* Errors */}
                {preview.errors.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                      <span className="text-2xl">❌</span>
                      Errors (must fix):
                    </h3>
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                      {preview.errors.map((error, idx) => (
                        <div key={idx} className="text-sm mb-2 p-2 bg-white rounded">
                          <Badge variant="danger" className="mr-2">Row {error.row}</Badge>
                          <span className="font-medium text-slate-700">{error.field}</span> -{' '}
                          {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {preview.warnings.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
                      <span className="text-2xl">⚠️</span>
                      Warnings (optional fixes):
                    </h3>
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                      {preview.warnings.map((warning, idx) => (
                        <div key={idx} className="text-sm mb-2 p-2 bg-white rounded">
                          <Badge variant="warning" className="mr-2">Row {warning.row}</Badge>
                          <span className="font-medium text-slate-700">{warning.field}</span> -{' '}
                          {warning.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Valid Students Preview */}
                {preview.valid.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                      <span className="text-2xl">✅</span>
                      Valid Students (first 10):
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-gradient-to-r from-slate-50 to-blue-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Student ID</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Grade</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Guardian</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {preview.valid.slice(0, 10).map((student, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                                {student.firstName} {student.lastName}
                              </td>
                              <td className="px-4 py-3 text-slate-600">{student.email}</td>
                              <td className="px-4 py-3 text-slate-600">{student.studentId || '—'}</td>
                              <td className="px-4 py-3 text-slate-600">{student.gradeLevel || '—'}</td>
                              <td className="px-4 py-3 text-slate-600">{student.guardianName || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {preview.valid.length > 10 && (
                        <div className="bg-slate-50 px-4 py-3 text-center">
                          <p className="text-sm text-slate-600">
                            ... and <strong>{preview.valid.length - 10} more students</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={handleReset}
                    disabled={importing}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={importing || preview.valid.length === 0}
                    isLoading={importing}
                    variant="success"
                  >
                    📤 Import {preview.validRows} Students
                  </Button>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-green-700 flex items-center gap-3">
                <span className="text-4xl">🎉</span>
                Import Complete!
              </h2>
            </div>

            {importResults && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                    <div className="text-3xl font-bold text-blue-700">{importResults.total}</div>
                    <div className="text-sm font-medium text-blue-600">Total Processed</div>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
                    <div className="text-3xl font-bold text-green-700">
                      {importResults.successCount}
                    </div>
                    <div className="text-sm font-medium text-green-600">Successfully Imported</div>
                  </Card>
                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200">
                    <div className="text-3xl font-bold text-red-700">
                      {importResults.errorCount}
                    </div>
                    <div className="text-sm font-medium text-red-600">Failed</div>
                  </Card>
                </div>

                {importResults.errors.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                      <span className="text-2xl">❌</span>
                      Failed Imports:
                    </h3>
                    <Card className="bg-red-50 border-2 border-red-200 max-h-64 overflow-y-auto">
                      {importResults.errors.map((error, idx) => (
                        <div key={idx} className="text-sm mb-2 p-2 bg-white rounded">
                          <Badge variant="danger" className="mr-2">Row {error.row}</Badge>
                          <span className="font-medium text-slate-700">{error.email}</span>
                          <span className="text-slate-500"> — {error.error}</span>
                        </div>
                      ))}
                    </Card>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={() => router.push('/dashboard/students')}
                    variant="outline"
                  >
                    👁️ View Students
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="primary"
                  >
                    📥 Import More Students
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
