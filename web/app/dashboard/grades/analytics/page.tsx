'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { percentageToLetterGrade, getLetterGradeColor } from '@/lib/gradeService'

interface Class {
  id: string
  name: string
  code: string
}

interface CategoryGrade {
  category_id: string
  category_name: string
  percentage: number
  letter_grade: string
}

interface StudentGrade {
  student_id: string
  student_name: string
  student_number: string
  overall_percentage: number
  letter_grade: string
  category_grades: CategoryGrade[]
}

interface GradeDistribution {
  grade: string
  count: number
  percentage: number
}

interface CategoryStats {
  category_name: string
  average: number
  highest: number
  lowest: number
  median: number
}

export default function GradeAnalyticsPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [grades, setGrades] = useState<StudentGrade[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadClasses()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      loadGrades()
    } else {
      setGrades([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass])

  const loadClasses = async () => {
    try {
      const response = await apiFetch('/api/classes/my-classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data.data || data.classes || data)
      }
    } catch (error) {
      console.error('Failed to load classes:', error)
    }
  }

  const loadGrades = async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/grades/student-overview?classId=${selectedClass}`)
      if (response.ok) {
        const data = await response.json()
        setGrades(data.data || data.grades || data)
      }
    } catch (error) {
      console.error('Failed to load grades:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate class statistics
  const getClassStats = () => {
    if (grades.length === 0) return null

    const percentages = grades.map(g => g.overall_percentage).filter(p => !isNaN(p))
    if (percentages.length === 0) return null

    const average = percentages.reduce((a, b) => a + b, 0) / percentages.length
    const highest = Math.max(...percentages)
    const lowest = Math.min(...percentages)
    const sorted = [...percentages].sort((a, b) => a - b)
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)]

    return { average, highest, lowest, median, total: percentages.length }
  }

  // Calculate grade distribution
  const getGradeDistribution = (): GradeDistribution[] => {
    if (grades.length === 0) return []

    const distribution: Record<string, number> = {
      'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0,
      'C+': 0, 'C': 0, 'C-': 0, 'D+': 0, 'D': 0, 'D-': 0, 'F': 0
    }

    grades.forEach(g => {
      if (g.letter_grade && distribution.hasOwnProperty(g.letter_grade)) {
        distribution[g.letter_grade]++
      }
    })

    return Object.entries(distribution).map(([grade, count]) => ({
      grade,
      count,
      percentage: grades.length > 0 ? (count / grades.length) * 100 : 0
    }))
  }

  // Calculate category statistics
  const getCategoryStats = (): CategoryStats[] => {
    if (grades.length === 0) return []

    const categoryData: Record<string, number[]> = {}

    grades.forEach(student => {
      student.category_grades.forEach(cat => {
        if (!categoryData[cat.category_name]) {
          categoryData[cat.category_name] = []
        }
        if (!isNaN(cat.percentage)) {
          categoryData[cat.category_name].push(cat.percentage)
        }
      })
    })

    return Object.entries(categoryData).map(([category_name, percentages]) => {
      if (percentages.length === 0) {
        return { category_name, average: 0, highest: 0, lowest: 0, median: 0 }
      }

      const average = percentages.reduce((a, b) => a + b, 0) / percentages.length
      const highest = Math.max(...percentages)
      const lowest = Math.min(...percentages)
      const sorted = [...percentages].sort((a, b) => a - b)
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)]

      return { category_name, average, highest, lowest, median }
    })
  }

  // Identify struggling students
  const getStrugglingStudents = () => {
    return grades
      .filter(g => g.overall_percentage < 70)
      .sort((a, b) => a.overall_percentage - b.overall_percentage)
  }

  // Identify top performers
  const getTopPerformers = () => {
    return grades
      .filter(g => g.overall_percentage >= 90)
      .sort((a, b) => b.overall_percentage - a.overall_percentage)
  }

  const classStats = getClassStats()
  const gradeDistribution = getGradeDistribution()
  const categoryStats = getCategoryStats()
  const strugglingStudents = getStrugglingStudents()
  const topPerformers = getTopPerformers()
  const selectedClassData = classes.find(c => c.id === selectedClass)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Grade Analytics</h1>
        <p className="text-gray-600">View class performance insights and trends</p>
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

      {/* Analytics Content */}
      {selectedClass && selectedClassData && (
        <>
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              Loading analytics...
            </div>
          ) : grades.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              No grades available for this class yet
            </div>
          ) : (
            <>
              {/* Class Statistics Cards */}
              {classStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-sm text-gray-600 mb-2">Class Average</div>
                    <div className={`text-3xl font-bold ${getLetterGradeColor(percentageToLetterGrade(classStats.average))}`}>
                      {classStats.average.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {percentageToLetterGrade(classStats.average)}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-sm text-gray-600 mb-2">Highest Grade</div>
                    <div className="text-3xl font-bold text-green-600">
                      {classStats.highest.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {percentageToLetterGrade(classStats.highest)}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-sm text-gray-600 mb-2">Lowest Grade</div>
                    <div className="text-3xl font-bold text-red-600">
                      {classStats.lowest.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {percentageToLetterGrade(classStats.lowest)}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-sm text-gray-600 mb-2">Median Grade</div>
                    <div className={`text-3xl font-bold ${getLetterGradeColor(percentageToLetterGrade(classStats.median))}`}>
                      {classStats.median.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {percentageToLetterGrade(classStats.median)}
                    </div>
                  </div>
                </div>
              )}

              {/* Grade Distribution Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h2>
                <div className="space-y-3">
                  {gradeDistribution.filter(d => d.count > 0).map(dist => (
                    <div key={dist.grade}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className={`font-semibold ${getLetterGradeColor(dist.grade)}`}>
                          {dist.grade}
                        </span>
                        <span className="text-gray-600">
                          {dist.count} student{dist.count !== 1 ? 's' : ''} ({dist.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            dist.grade.startsWith('A') ? 'bg-green-500' :
                            dist.grade.startsWith('B') ? 'bg-green-400' :
                            dist.grade.startsWith('C') ? 'bg-yellow-500' :
                            dist.grade.startsWith('D') ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${dist.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Performance */}
              {categoryStats.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Category
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Average
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Median
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Highest
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Lowest
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {categoryStats.map((cat, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {cat.category_name}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-semibold ${getLetterGradeColor(percentageToLetterGrade(cat.average))}`}>
                                {cat.average.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">
                              {cat.median.toFixed(1)}%
                            </td>
                            <td className="px-4 py-3 text-center text-green-600 font-semibold">
                              {cat.highest.toFixed(1)}%
                            </td>
                            <td className="px-4 py-3 text-center text-red-600 font-semibold">
                              {cat.lowest.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Students Needing Attention */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Struggling Students */}
                {strugglingStudents.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">⚠️</span>
                      <h2 className="text-lg font-semibold text-red-900">
                        Students Needing Support
                      </h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Students with grades below 70%
                    </p>
                    <div className="space-y-3">
                      {strugglingStudents.slice(0, 10).map(student => (
                        <div key={student.student_id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                          <div>
                            <div className="font-medium text-gray-900">
                              {student.student_name}
                            </div>
                            <div className="text-sm text-gray-600">
                              ID: {student.student_number}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xl font-bold ${getLetterGradeColor(student.letter_grade)}`}>
                              {student.letter_grade}
                            </div>
                            <div className="text-sm text-gray-600">
                              {student.overall_percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {strugglingStudents.length > 10 && (
                      <div className="mt-3 text-sm text-gray-500 text-center">
                        +{strugglingStudents.length - 10} more students
                      </div>
                    )}
                  </div>
                )}

                {/* Top Performers */}
                {topPerformers.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">🌟</span>
                      <h2 className="text-lg font-semibold text-green-900">
                        Top Performers
                      </h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Students with grades 90% and above
                    </p>
                    <div className="space-y-3">
                      {topPerformers.slice(0, 10).map(student => (
                        <div key={student.student_id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                          <div>
                            <div className="font-medium text-gray-900">
                              {student.student_name}
                            </div>
                            <div className="text-sm text-gray-600">
                              ID: {student.student_number}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xl font-bold ${getLetterGradeColor(student.letter_grade)}`}>
                              {student.letter_grade}
                            </div>
                            <div className="text-sm text-gray-600">
                              {student.overall_percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {topPerformers.length > 10 && (
                      <div className="mt-3 text-sm text-gray-500 text-center">
                        +{topPerformers.length - 10} more students
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Empty State */}
      {!selectedClass && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📈</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Select a Class
          </h3>
          <p className="text-gray-600">
            Choose a class from the dropdown above to view grade analytics and insights
          </p>
        </div>
      )}
    </div>
  )
}
