'use client'

import { useState, useEffect } from 'react'
import { AssignmentCategory, Assignment } from '@/lib/gradeService'

interface ClassOption {
  id: string
  title: string
}

export default function AssignmentManagementPage() {
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [categories, setCategories] = useState<AssignmentCategory[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'assignments' | 'categories'>('assignments')

  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    weight: 0,
    drop_lowest: 0
  })

  // Assignment form
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    category_id: '',
    total_points: 100,
    due_date: '',
    published: true
  })

  useEffect(() => {
    loadClasses()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      loadCategories()
      loadAssignments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass])

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/classes/my-classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
        if (data.classes && data.classes.length > 0) {
          setSelectedClass(data.classes[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    if (!selectedClass) return

    try {
      const response = await fetch(`/api/grades/categories?classId=${selectedClass}`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const loadAssignments = async () => {
    if (!selectedClass) return

    try {
      const response = await fetch(`/api/grades/assignments?classId=${selectedClass}`)
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error('Failed to load assignments:', error)
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClass) {
      alert('Please select a class')
      return
    }

    try {
      const response = await fetch('/api/grades/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClass,
          ...categoryForm
        })
      })

      if (response.ok) {
        alert('Category created successfully!')
        setShowCategoryForm(false)
        setCategoryForm({ name: '', description: '', weight: 0, drop_lowest: 0 })
        loadCategories()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create category')
      }
    } catch (error) {
      console.error('Failed to create category:', error)
      alert('Failed to create category')
    }
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClass) {
      alert('Please select a class')
      return
    }

    try {
      const response = await fetch('/api/grades/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClass,
          ...assignmentForm,
          category_id: assignmentForm.category_id || null,
          due_date: assignmentForm.due_date || null
        })
      })

      if (response.ok) {
        alert('Assignment created successfully!')
        setShowAssignmentForm(false)
        setAssignmentForm({
          title: '',
          description: '',
          category_id: '',
          total_points: 100,
          due_date: '',
          published: true
        })
        loadAssignments()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create assignment')
      }
    } catch (error) {
      console.error('Failed to create assignment:', error)
      alert('Failed to create assignment')
    }
  }

  const getTotalWeight = () => {
    return categories.reduce((sum, cat) => sum + cat.weight, 0)
  }

  const getWeightColor = () => {
    const total = getTotalWeight()
    if (total === 100) return 'text-green-600'
    if (total < 100) return 'text-orange-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assignment Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create and manage assignments, categories, and grading policies
          </p>
        </div>

        {/* Class Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select a class --</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.title}
              </option>
            ))}
          </select>
        </div>

        {selectedClass && (
          <>
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('assignments')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 ${
                      activeTab === 'assignments'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    📝 Assignments ({assignments.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 ${
                      activeTab === 'categories'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    📂 Categories ({categories.length})
                  </button>
                </nav>
              </div>

              {/* Assignments Tab */}
              {activeTab === 'assignments' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Assignments</h2>
                    <button
                      onClick={() => setShowAssignmentForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      ➕ Create Assignment
                    </button>
                  </div>

                  {assignments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg mb-2">📝 No assignments yet</p>
                      <p className="text-sm">Create your first assignment to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {assignment.title}
                                </h3>
                                {!assignment.published && (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                    Draft
                                  </span>
                                )}
                              </div>
                              {assignment.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {assignment.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                                <span>📊 {assignment.total_points} points</span>
                                {assignment.category && (
                                  <span>📂 {assignment.category.name}</span>
                                )}
                                {assignment.due_date && (
                                  <span>
                                    📅 Due: {new Date(assignment.due_date).toLocaleDateString()}
                                  </span>
                                )}
                                <span>
                                  📅 Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                                onClick={() => {
                                  window.location.href = `/admin/grades/entry?assignmentId=${assignment.id}`
                                }}
                              >
                                Enter Grades
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Categories Tab */}
              {activeTab === 'categories' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Grade Categories</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Total Weight: <span className={`font-semibold ${getWeightColor()}`}>
                          {getTotalWeight()}%
                        </span>
                        {getTotalWeight() !== 100 && (
                          <span className="ml-2 text-orange-600">
                            (Should equal 100%)
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCategoryForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      ➕ Create Category
                    </button>
                  </div>

                  {categories.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg mb-2">📂 No categories yet</p>
                      <p className="text-sm">Create categories to organize your assignments</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {category.name}
                              </h3>
                              {category.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {category.description}
                                </p>
                              )}
                              <div className="flex gap-4 mt-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">Weight:</span>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded">
                                    {category.weight}%
                                  </span>
                                </div>
                                {category.drop_lowest > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Drop Lowest:</span>
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded">
                                      {category.drop_lowest}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Create Category Modal */}
        {showCategoryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create Category</h2>
              <form onSubmit={handleCreateCategory}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={categoryForm.weight}
                      onChange={(e) => setCategoryForm({ ...categoryForm, weight: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Drop Lowest
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={categoryForm.drop_lowest}
                      onChange={(e) => setCategoryForm({ ...categoryForm, drop_lowest: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of lowest grades to drop from this category
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCategoryForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Assignment Modal */}
        {showAssignmentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create Assignment</h2>
              <form onSubmit={handleCreateAssignment}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={assignmentForm.title}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={assignmentForm.description}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={assignmentForm.category_id}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- No category --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.weight}%)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Points *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={assignmentForm.total_points}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, total_points: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="datetime-local"
                      value={assignmentForm.due_date}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="published"
                      checked={assignmentForm.published}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, published: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
                      Publish immediately (students can see it)
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAssignmentForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
