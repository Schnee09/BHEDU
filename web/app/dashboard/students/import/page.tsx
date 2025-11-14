/**
 * Bulk Student Import Page
 * Admin-only page for importing students via CSV
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  parseCSV, 
  validateImportData, 
  generateCSVTemplate,
  type ImportPreview
} from '@/lib/importService'

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
      const response = await fetch('/api/admin/students/import', {
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bulk Student Import</h1>
        <p className="text-gray-600">
          Import multiple students at once using a CSV file
        </p>
      </div>

      {!importComplete ? (
        <>
          {/* Download Template */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold mb-2">📥 Step 1: Download Template</h2>
            <p className="text-sm text-gray-700 mb-3">
              Download our CSV template with sample data to see the required format
            </p>
            <button
              onClick={downloadTemplate}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Download Template
            </button>
          </div>

          {/* File Upload */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
            <h2 className="font-semibold mb-4">📤 Step 2: Upload Your CSV File</h2>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
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
                <svg
                  className="w-12 h-12 text-gray-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-lg font-medium text-gray-700 mb-1">
                  {file ? file.name : 'Drop CSV file here or click to browse'}
                </span>
                <span className="text-sm text-gray-500">
                  CSV files only, max 10 MB
                </span>
              </label>
            </div>

            {file && (
              <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded">
                <span className="text-sm font-medium">{file.name}</span>
                <button
                  onClick={() => handleFileChange(null)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Preview and Validation Results */}
          {preview && (
            <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
              <h2 className="font-semibold mb-4">✅ Step 3: Review and Import</h2>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{preview.totalRows}</div>
                  <div className="text-sm text-gray-600">Total Rows</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{preview.validRows}</div>
                  <div className="text-sm text-gray-600">Valid Students</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{preview.errorRows}</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
              </div>

              {/* Errors */}
              {preview.errors.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-red-600 mb-2">❌ Errors (must fix):</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {preview.errors.map((error, idx) => (
                      <div key={idx} className="text-sm mb-2">
                        <span className="font-medium">Row {error.row}:</span>{' '}
                        <span className="text-gray-700">{error.field}</span> -{' '}
                        {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {preview.warnings.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-yellow-600 mb-2">⚠️ Warnings (optional fixes):</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {preview.warnings.map((warning, idx) => (
                      <div key={idx} className="text-sm mb-2">
                        <span className="font-medium">Row {warning.row}:</span>{' '}
                        <span className="text-gray-700">{warning.field}</span> -{' '}
                        {warning.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Valid Students Preview */}
              {preview.valid.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-green-600 mb-2">
                    ✅ Valid Students (first 10):
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Email</th>
                          <th className="px-3 py-2 text-left">Student ID</th>
                          <th className="px-3 py-2 text-left">Grade</th>
                          <th className="px-3 py-2 text-left">Guardian</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {preview.valid.slice(0, 10).map((student, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {student.firstName} {student.lastName}
                            </td>
                            <td className="px-3 py-2">{student.email}</td>
                            <td className="px-3 py-2">{student.studentId || '-'}</td>
                            <td className="px-3 py-2">{student.gradeLevel || '-'}</td>
                            <td className="px-3 py-2">{student.guardianName || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.valid.length > 10 && (
                      <p className="text-sm text-gray-500 mt-2">
                        ... and {preview.valid.length - 10} more students
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleImport}
                  disabled={importing || preview.valid.length === 0}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition"
                >
                  {importing ? 'Importing...' : `Import ${preview.validRows} Students`}
                </button>
                <button
                  onClick={handleReset}
                  disabled={importing}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 disabled:cursor-not-allowed font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Import Results */
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-green-600">🎉 Import Complete!</h2>

          {importResults && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{importResults.total}</div>
                  <div className="text-sm text-gray-600">Total Processed</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {importResults.successCount}
                  </div>
                  <div className="text-sm text-gray-600">Successfully Imported</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {importResults.errorCount}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-red-600 mb-2">Failed Imports:</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {importResults.errors.map((error, idx) => (
                      <div key={idx} className="text-sm mb-2">
                        <span className="font-medium">Row {error.row}:</span>{' '}
                        <span className="text-gray-700">{error.email}</span> - {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleReset}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition"
                >
                  Import More Students
                </button>
                <button
                  onClick={() => router.push('/admin/students')}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium transition"
                >
                  View Students
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
