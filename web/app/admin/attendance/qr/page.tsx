/**
 * QR Code Generation Page
 * Teachers can generate QR codes for their students
 */

'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface Class {
  id: string
  title: string
}

interface Student {
  id: string
  email: string
  first_name: string
  last_name: string
}

interface GeneratedQR {
  studentId: string
  studentName: string
  code: string
  expiresAt: string
}

export default function QRGenerationPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [expiryHours, setExpiryHours] = useState(24)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedQRs, setGeneratedQRs] = useState<GeneratedQR[]>([])

  useEffect(() => {
    loadClasses()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      loadStudents()
    }
  }, [selectedClass])

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/classes/my-classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
        if (data.classes.length > 0) {
          setSelectedClass(data.classes[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load classes', error)
    }
  }

  const loadStudents = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/classes/${selectedClass}/students`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Failed to load students', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const selectAll = () => {
    setSelectedStudents(new Set(students.map(s => s.id)))
  }

  const deselectAll = () => {
    setSelectedStudents(new Set())
  }

  const generateQRCodes = async () => {
    if (selectedStudents.size === 0) {
      alert('Please select at least one student')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/attendance/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudents),
          classId: selectedClass,
          validDate: date,
          expiryHours: expiryHours
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Map successful QR codes with student names
        const qrs = data.results
          .filter((r: { success: boolean }) => r.success)
          .map((r: { studentId: string; code: string; expiresAt: string }) => {
            const student = students.find(s => s.id === r.studentId)
            return {
              studentId: r.studentId,
              studentName: student ? `${student.first_name} ${student.last_name}` : 'Unknown',
              code: r.code,
              expiresAt: r.expiresAt
            }
          })

        setGeneratedQRs(qrs)

        if (data.summary.errorCount > 0) {
          alert(`Generated ${data.summary.successCount} QR codes. ${data.summary.errorCount} failed.`)
        }
      } else {
        alert(data.error || 'Failed to generate QR codes')
      }
    } catch (error) {
      alert('Failed to generate QR codes')
    } finally {
      setGenerating(false)
    }
  }

  const printQRCodes = () => {
    window.print()
  }

  const getCheckinURL = () => {
    return `${window.location.origin}/checkin`
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Generate QR Codes</h1>
        <p className="text-gray-600">
          Create QR codes for students to check in
        </p>
      </div>

      {generatedQRs.length === 0 ? (
        /* Generation Form */
        <>
          <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-lg mb-4">Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Valid Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Expires In (hours)
                </label>
                <input
                  type="number"
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(parseInt(e.target.value) || 24)}
                  min="1"
                  max="168"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">ℹ️ How it works:</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Select students from your class</li>
                <li>Generate unique QR codes for each student</li>
                <li>Students scan/enter the code to check in</li>
                <li>Codes expire after the specified time</li>
                <li>Each code can only be used once</li>
              </ul>
            </div>
          </div>

          {/* Student Selection */}
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Loading students...</div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">No students found in this class</div>
            </div>
          ) : (
            <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">
                  Select Students ({selectedStudents.size} of {students.length})
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={deselectAll}
                    className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {students.map((student) => (
                  <label
                    key={student.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                      selectedStudents.has(student.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Generate Button */}
          {students.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={generateQRCodes}
                disabled={generating || selectedStudents.size === 0}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
              >
                {generating
                  ? 'Generating...'
                  : `Generate QR Codes (${selectedStudents.size})`}
              </button>
            </div>
          )}
        </>
      ) : (
        /* Generated QR Codes Display */
        <div>
          <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6 print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg mb-1">
                  ✅ Generated {generatedQRs.length} QR Codes
                </h2>
                <p className="text-sm text-gray-600">
                  Valid for {date} • Expires in {expiryHours} hours
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={printQRCodes}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  🖨️ Print
                </button>
                <button
                  onClick={() => setGeneratedQRs([])}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Generate More
                </button>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 print:hidden">
            <h3 className="font-semibold text-yellow-900 mb-2">📋 Instructions for Students:</h3>
            <p className="text-sm text-yellow-800 mb-2">
              Students should visit: <strong>{getCheckinURL()}</strong>
            </p>
            <p className="text-sm text-yellow-800">
              Enter the code shown below their name to check in.
            </p>
          </div>

          {/* QR Codes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedQRs.map((qr) => (
              <div
                key={qr.studentId}
                className="bg-white border-2 border-gray-300 rounded-lg p-6 text-center print:break-inside-avoid"
              >
                <h3 className="font-bold text-lg mb-4">{qr.studentName}</h3>
                
                <div className="bg-white p-4 rounded-lg mb-4 inline-block">
                  <QRCodeSVG
                    value={qr.code}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-2">
                  <div className="text-xs text-gray-500 mb-1">QR Code:</div>
                  <div className="font-mono text-sm break-all">{qr.code}</div>
                </div>

                <div className="text-xs text-gray-500">
                  Expires: {new Date(qr.expiresAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
