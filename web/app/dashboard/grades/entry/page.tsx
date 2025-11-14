'use client'

import { useState, useEffect } from 'react'
import { Assignment, Grade, validateGradePoints } from '@/lib/gradeService'

interface Student {
  id: string
  email: string
  full_name: string
  student_id: string
}

interface GradeEntry extends Grade {
  student: Student
}

interface Class {
  id: string
  name: string
  code: string
}

export default function GradeEntryPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<string>('')
  const [grades, setGrades] = useState<GradeEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [editingFeedback, setEditingFeedback] = useState<string | null>(null)

  // Load classes on mount
  useEffect(() => {
    loadClasses()
  }, [])

  // Load assignments when class changes
  useEffect(() => {
    if (selectedClass) {
      loadAssignments()
    } else {
      setAssignments([])
      setSelectedAssignment('')
      setGrades([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass])

  // Load grades when assignment changes
  useEffect(() => {
    if (selectedAssignment) {
      loadGrades()
    } else {
      setGrades([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssignment])

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

  const loadAssignments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/grades/assignments?classId=${selectedClass}&published=true`)
      if (response.ok) {
        const data = await response.json()
        setAssignments(data)
      }
    } catch (error) {
      console.error('Failed to load assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGrades = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/grades?assignmentId=${selectedAssignment}`)
      if (response.ok) {
        const data = await response.json()
        setGrades(data)
        setHasChanges(false)
      }
    } catch (error) {
      console.error('Failed to load grades:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePointsChange = (gradeId: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value)
    
    setGrades(prev => prev.map(g => {
      if (g.id === gradeId) {
        const updated = { ...g, points_earned: numValue }
        
        // Auto-clear missing flag when points are entered
        if (numValue !== undefined) {
          updated.missing = false
        }
        
        return updated
      }
      return g
    }))
    setHasChanges(true)
  }

  const handleFlagToggle = (gradeId: string, flag: 'late' | 'excused' | 'missing') => {
    setGrades(prev => prev.map(g => {
      if (g.id === gradeId) {
        const updated = { ...g, [flag]: !g[flag] }
        
        // Auto-clear points when marked as excused or missing
        if (flag === 'excused' && updated.excused) {
          updated.points_earned = undefined
          updated.missing = false
        } else if (flag === 'missing' && updated.missing) {
          updated.points_earned = undefined
          updated.excused = false
        }
        
        return updated
      }
      return g
    }))
    setHasChanges(true)
  }

  const handleFeedbackChange = (gradeId: string, value: string) => {
    setGrades(prev => prev.map(g => 
      g.id === gradeId ? { ...g, feedback: value || undefined } : g
    ))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Validate all grades
      const assignment = assignments.find(a => a.id === selectedAssignment)
      if (!assignment) return

      for (const grade of grades) {
        if (grade.points_earned !== undefined) {
          const validation = validateGradePoints(grade.points_earned, assignment.total_points)
          if (!validation.valid) {
            alert(`Error for ${grade.student.full_name}: ${validation.error}`)
            return
          }
        }
      }

      // Save grades
      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grades: grades.map(g => ({
            id: g.id,
            assignment_id: g.assignment_id,
            student_id: g.student_id,
            points_earned: g.points_earned,
            late: g.late,
            excused: g.excused,
            missing: g.missing,
            feedback: g.feedback
          }))
        })
      })

      if (response.ok) {
        setHasChanges(false)
        alert('Grades saved successfully!')
        loadGrades() // Reload to get updated timestamps
      } else {
        const error = await response.json()
        alert(`Failed to save grades: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to save grades:', error)
      alert('Failed to save grades. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleQuickAction = (action: 'all-present' | 'all-missing' | 'clear-all') => {
    const assignment = assignments.find(a => a.id === selectedAssignment)
    if (!assignment) return

    setGrades(prev => prev.map(g => {
      switch (action) {
        case 'all-present':
          return { ...g, points_earned: assignment.total_points, late: false, excused: false, missing: false }
        case 'all-missing':
          return { ...g, points_earned: undefined, late: false, excused: false, missing: true }
        case 'clear-all':
          return { ...g, points_earned: undefined, late: false, excused: false, missing: false, feedback: undefined }
        default:
          return g
      }
    }))
    setHasChanges(true)
  }

  const getGradePercentage = (grade: GradeEntry): string => {
    const assignment = assignments.find(a => a.id === selectedAssignment)
    if (!assignment) return '-'

    if (grade.excused) return 'EXC'
    if (grade.missing) return 'MISS'
    if (grade.points_earned === undefined) return '-'

    const percentage = (grade.points_earned / assignment.total_points) * 100
    return `${percentage.toFixed(1)}%`
  }

  const getGradeColor = (grade: GradeEntry): string => {
    if (grade.excused) return 'text-blue-600'
    if (grade.missing) return 'text-red-600'
    if (grade.points_earned === undefined) return 'text-gray-400'

    const assignment = assignments.find(a => a.id === selectedAssignment)
    if (!assignment) return 'text-gray-600'

    const percentage = (grade.points_earned / assignment.total_points) * 100
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 80) return 'text-green-500'
    if (percentage >= 70) return 'text-yellow-600'
    if (percentage >= 60) return 'text-orange-500'
    return 'text-red-600'
  }

  const selectedAssignmentData = assignments.find(a => a.id === selectedAssignment)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Grade Entry</h1>
        <p className="text-gray-600">Enter and manage student grades</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Class Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a class...</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.code})
                </option>
              ))}
            </select>
          </div>

          {/* Assignment Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment
            </label>
            <select
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              disabled={!selectedClass || loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select an assignment...</option>
              {assignments.map(assignment => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.title} ({assignment.total_points} pts)
                  {assignment.category && ` - ${assignment.category.name}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {selectedAssignment && grades.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickAction('all-present')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                ✓ All Full Credit
              </button>
              <button
                onClick={() => handleQuickAction('all-missing')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                ✗ All Missing
              </button>
              <button
                onClick={() => handleQuickAction('clear-all')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
              >
                Clear All
              </button>
            </div>

            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grades Table */}
      {selectedAssignment && selectedAssignmentData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Assignment Info */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedAssignmentData.title}
                </h3>
                {selectedAssignmentData.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedAssignmentData.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Points</div>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedAssignmentData.total_points}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading grades...
            </div>
          ) : grades.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No students enrolled in this class
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feedback
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {grades.map((grade) => (
                    <tr key={grade.id} className="hover:bg-gray-50">
                      {/* Student Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {grade.student.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {grade.student.email}
                        </div>
                      </td>

                      {/* Student ID */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {grade.student.student_id}
                      </td>

                      {/* Points Input */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="number"
                          min="0"
                          max={selectedAssignmentData.total_points}
                          step="0.5"
                          value={grade.points_earned ?? ''}
                          onChange={(e) => handlePointsChange(grade.id, e.target.value)}
                          disabled={grade.excused || grade.missing}
                          className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          placeholder="-"
                        />
                        <span className="text-sm text-gray-500 ml-1">
                          / {selectedAssignmentData.total_points}
                        </span>
                      </td>

                      {/* Grade Percentage */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-sm font-semibold ${getGradeColor(grade)}`}>
                          {getGradePercentage(grade)}
                        </span>
                      </td>

                      {/* Status Flags */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleFlagToggle(grade.id, 'late')}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              grade.late
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                : 'bg-gray-100 text-gray-600 border border-gray-300'
                            }`}
                            title="Late submission"
                          >
                            Late
                          </button>
                          <button
                            onClick={() => handleFlagToggle(grade.id, 'excused')}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              grade.excused
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : 'bg-gray-100 text-gray-600 border border-gray-300'
                            }`}
                            title="Excused"
                          >
                            Exc
                          </button>
                          <button
                            onClick={() => handleFlagToggle(grade.id, 'missing')}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              grade.missing
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : 'bg-gray-100 text-gray-600 border border-gray-300'
                            }`}
                            title="Missing"
                          >
                            Miss
                          </button>
                        </div>
                      </td>

                      {/* Feedback */}
                      <td className="px-6 py-4">
                        {editingFeedback === grade.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={grade.feedback || ''}
                              onChange={(e) => handleFeedbackChange(grade.id, e.target.value)}
                              onBlur={() => setEditingFeedback(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') setEditingFeedback(null)
                                if (e.key === 'Escape') {
                                  setEditingFeedback(null)
                                  loadGrades()
                                }
                              }}
                              autoFocus
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="Add feedback..."
                            />
                          </div>
                        ) : (
                          <div
                            onClick={() => setEditingFeedback(grade.id)}
                            className="text-sm text-gray-600 cursor-pointer hover:text-gray-900 min-h-[24px]"
                          >
                            {grade.feedback || (
                              <span className="text-gray-400 italic">Click to add feedback</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer with stats */}
          {grades.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-gray-600">Total Students:</span>{' '}
                  <span className="font-semibold text-gray-900">{grades.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Graded:</span>{' '}
                  <span className="font-semibold text-gray-900">
                    {grades.filter(g => g.points_earned !== undefined && !g.excused && !g.missing).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Missing:</span>{' '}
                  <span className="font-semibold text-red-600">
                    {grades.filter(g => g.missing).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Excused:</span>{' '}
                  <span className="font-semibold text-blue-600">
                    {grades.filter(g => g.excused).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Late:</span>{' '}
                  <span className="font-semibold text-yellow-600">
                    {grades.filter(g => g.late).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!selectedClass && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Select a Class
          </h3>
          <p className="text-gray-600">
            Choose a class from the dropdown above to start entering grades
          </p>
        </div>
      )}

      {selectedClass && !selectedAssignment && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Select an Assignment
          </h3>
          <p className="text-gray-600">
            Choose an assignment to view and enter grades for your students
          </p>
        </div>
      )}

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 bg-yellow-50 border border-yellow-300 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600 text-xl">⚠️</div>
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">
                Unsaved Changes
              </h4>
              <p className="text-sm text-yellow-800 mb-3">
                You have unsaved changes. Don&apos;t forget to save before leaving!
              </p>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium text-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
