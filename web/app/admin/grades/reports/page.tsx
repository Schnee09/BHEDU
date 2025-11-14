'use client'

import { useState, useEffect } from 'react'
import { getLetterGradeColor } from '@/lib/gradeService'

interface Class {
  id: string
  name: string
  code: string
}

interface Student {
  id: string
  email: string
  full_name: string
  student_id: string
}

interface CategoryGrade {
  category_id: string
  category_name: string
  percentage: number
  letter_grade: string
  points_earned: number
  total_points: number
}

interface StudentGrade {
  student_id: string
  student_name: string
  student_number: string
  overall_percentage: number
  letter_grade: string
  category_grades: CategoryGrade[]
}

export default function ReportCardsPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [students, setStudents] = useState<Student[]>([])
  const [grades, setGrades] = useState<StudentGrade[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [generatingPdf, setGeneratingPdf] = useState(false)

  useEffect(() => {
    loadClasses()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      loadStudents()
      loadGrades()
    } else {
      setStudents([])
      setGrades([])
      setSelectedStudent('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass])

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/classes/my-classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data)
      }
    } catch (error) {
      console.error('Failed to load classes:', error)
    }
  }

  const loadStudents = async () => {
    try {
      const response = await fetch(`/api/classes/${selectedClass}/students`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Failed to load students:', error)
    }
  }

  const loadGrades = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/grades/student-overview?classId=${selectedClass}`)
      if (response.ok) {
        const data = await response.json()
        setGrades(data)
      }
    } catch (error) {
      console.error('Failed to load grades:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePDF = async (studentId: string) => {
    try {
      setGeneratingPdf(true)
      const student = students.find(s => s.id === studentId)
      const studentGrade = grades.find(g => g.student_id === studentId)
      
      if (!student || !studentGrade) {
        alert('Student data not found')
        return
      }

      // Generate PDF content
      await generatePDF(student, studentGrade)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate report card. Please try again.')
    } finally {
      setGeneratingPdf(false)
    }
  }

  const generatePDF = async (student: Student, grade: StudentGrade) => {
    const classData = classes.find(c => c.id === selectedClass)
    if (!classData) return

    // Create a printable HTML document
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to generate report cards')
      return
    }

    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Report Card - ${student.full_name}</title>
  <style>
    @media print {
      @page {
        margin: 0.5in;
      }
    }
    body {
      font-family: Arial, sans-serif;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #1e40af;
      font-size: 28px;
    }
    .header p {
      margin: 5px 0;
      color: #64748b;
    }
    .student-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 30px;
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 16px;
      color: #1e293b;
      font-weight: 500;
    }
    .overall-grade {
      text-align: center;
      padding: 30px;
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      border-radius: 12px;
      margin-bottom: 30px;
      color: white;
    }
    .overall-grade .label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .overall-grade .grade {
      font-size: 48px;
      font-weight: bold;
      margin: 10px 0;
    }
    .overall-grade .percentage {
      font-size: 24px;
      opacity: 0.9;
    }
    .categories-section {
      margin-bottom: 30px;
    }
    .categories-section h2 {
      font-size: 20px;
      color: #1e40af;
      margin-bottom: 20px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 10px;
    }
    .category-grid {
      display: grid;
      gap: 15px;
    }
    .category-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 20px;
      align-items: center;
    }
    .category-info {
      flex: 1;
    }
    .category-name {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .category-points {
      font-size: 14px;
      color: #64748b;
    }
    .category-grade {
      text-align: center;
      min-width: 100px;
    }
    .category-percentage {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .category-letter {
      font-size: 18px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 4px;
      display: inline-block;
    }
    .grade-a { color: #16a34a; background: #dcfce7; }
    .grade-b { color: #65a30d; background: #ecfccb; }
    .grade-c { color: #ca8a04; background: #fef9c3; }
    .grade-d { color: #ea580c; background: #fed7aa; }
    .grade-f { color: #dc2626; background: #fecaca; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    .signature-section {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    .signature-line {
      border-top: 2px solid #1e293b;
      padding-top: 8px;
      text-align: center;
    }
    .signature-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
    }
    .no-grades {
      text-align: center;
      padding: 40px;
      color: #64748b;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>ACADEMIC REPORT CARD</h1>
    <p>Bethel Heights Educational Development</p>
    <p>Academic Year 2025-2026</p>
  </div>

  <div class="student-info">
    <div class="info-item">
      <div class="info-label">Student Name</div>
      <div class="info-value">${student.full_name}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Student ID</div>
      <div class="info-value">${student.student_id}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Class</div>
      <div class="info-value">${classData.name} (${classData.code})</div>
    </div>
    <div class="info-item">
      <div class="info-label">Date Generated</div>
      <div class="info-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
  </div>

  ${grade.category_grades.length > 0 ? `
    <div class="overall-grade">
      <div class="label">Overall Grade</div>
      <div class="grade">${grade.letter_grade}</div>
      <div class="percentage">${grade.overall_percentage.toFixed(1)}%</div>
    </div>

    <div class="categories-section">
      <h2>Category Breakdown</h2>
      <div class="category-grid">
        ${grade.category_grades.map(cat => `
          <div class="category-card">
            <div class="category-info">
              <div class="category-name">${cat.category_name}</div>
              <div class="category-points">
                ${cat.points_earned.toFixed(1)} / ${cat.total_points.toFixed(1)} points
              </div>
            </div>
            <div class="category-grade">
              <div class="category-percentage" style="color: ${getGradeColorForPrint(cat.percentage)}">
                ${cat.percentage.toFixed(1)}%
              </div>
              <div class="category-letter grade-${cat.letter_grade.toLowerCase().charAt(0)}">
                ${cat.letter_grade}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : `
    <div class="no-grades">
      No grades have been posted yet for this class.
    </div>
  `}

  <div class="signature-section">
    <div>
      <div class="signature-line">
        <div class="signature-label">Teacher Signature</div>
      </div>
    </div>
    <div>
      <div class="signature-line">
        <div class="signature-label">Parent/Guardian Signature</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>This report card was generated on ${new Date().toLocaleString('en-US')}</p>
    <p>For questions or concerns, please contact your teacher or school administration.</p>
  </div>
</body>
</html>
    `

    printWindow.document.write(reportHTML)
    printWindow.document.close()
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  const getGradeColorForPrint = (percentage: number): string => {
    if (percentage >= 90) return '#16a34a'
    if (percentage >= 80) return '#65a30d'
    if (percentage >= 70) return '#ca8a04'
    if (percentage >= 60) return '#ea580c'
    return '#dc2626'
  }

  const selectedClassData = classes.find(c => c.id === selectedClass)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Report Cards</h1>
        <p className="text-gray-600">Generate and view student report cards</p>
      </div>

      {/* Class Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Class
        </label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose a class...</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.name} ({cls.code})
            </option>
          ))}
        </select>
      </div>

      {/* Student List with Report Cards */}
      {selectedClass && selectedClassData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedClassData.name} - Report Cards
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading students and grades...
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No students enrolled in this class
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {students.map(student => {
                const studentGrade = grades.find(g => g.student_id === student.id)
                const hasGrades = studentGrade && studentGrade.category_grades.length > 0

                return (
                  <div key={student.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      {/* Student Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {student.full_name}
                        </h3>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>ID: {student.student_id}</span>
                          <span>•</span>
                          <span>{student.email}</span>
                        </div>

                        {/* Grade Summary */}
                        {hasGrades && studentGrade ? (
                          <div className="mt-4 flex items-center gap-6">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm text-gray-600">Overall:</span>
                              <span className={`text-2xl font-bold ${getLetterGradeColor(studentGrade.letter_grade)}`}>
                                {studentGrade.letter_grade}
                              </span>
                              <span className="text-lg text-gray-600">
                                ({studentGrade.overall_percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="flex gap-3">
                              {studentGrade.category_grades.map(cat => (
                                <div key={cat.category_id} className="text-sm">
                                  <span className="text-gray-600">{cat.category_name}:</span>{' '}
                                  <span className={`font-semibold ${getLetterGradeColor(cat.letter_grade)}`}>
                                    {cat.letter_grade}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 text-sm text-gray-500 italic">
                            No grades posted yet
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedStudent(selectedStudent === student.id ? '' : student.id)}
                          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                        >
                          {selectedStudent === student.id ? 'Hide Preview' : 'Preview'}
                        </button>
                        <button
                          onClick={() => handleGeneratePDF(student.id)}
                          disabled={generatingPdf}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                          {generatingPdf ? '...' : '📄 Generate PDF'}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Preview */}
                    {selectedStudent === student.id && studentGrade && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4">Report Card Preview</h4>
                        <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 max-w-4xl">
                          {/* Preview Header */}
                          <div className="text-center mb-6 pb-4 border-b-2 border-blue-600">
                            <h5 className="text-xl font-bold text-blue-900 mb-2">ACADEMIC REPORT CARD</h5>
                            <p className="text-sm text-gray-600">Bethel Heights Educational Development</p>
                          </div>

                          {/* Overall Grade */}
                          {hasGrades && (
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 text-center mb-6">
                              <div className="text-sm opacity-90 mb-2">OVERALL GRADE</div>
                              <div className="text-5xl font-bold mb-2">{studentGrade.letter_grade}</div>
                              <div className="text-2xl opacity-90">{studentGrade.overall_percentage.toFixed(1)}%</div>
                            </div>
                          )}

                          {/* Category Breakdown */}
                          {hasGrades ? (
                            <div className="space-y-3">
                              <h6 className="font-semibold text-gray-900 mb-3">Category Breakdown</h6>
                              {studentGrade.category_grades.map(cat => (
                                <div key={cat.category_id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                  <div>
                                    <div className="font-semibold text-gray-900">{cat.category_name}</div>
                                    <div className="text-sm text-gray-600">
                                      {cat.points_earned.toFixed(1)} / {cat.total_points.toFixed(1)} points
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`text-2xl font-bold ${getLetterGradeColor(cat.letter_grade)}`}>
                                      {cat.percentage.toFixed(1)}%
                                    </div>
                                    <div className={`text-lg font-semibold ${getLetterGradeColor(cat.letter_grade)}`}>
                                      {cat.letter_grade}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-gray-500 italic py-8">
                              No grades have been posted yet for this class.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!selectedClass && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Select a Class
          </h3>
          <p className="text-gray-600">
            Choose a class from the dropdown above to view and generate report cards
          </p>
        </div>
      )}
    </div>
  )
}
