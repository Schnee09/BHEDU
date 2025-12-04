/**
 * Grade Entry Page - Refactored with Modern Hooks and Audit Logging
 * 
 * Features:
 * - Uses custom hooks (useFetch, useMutation, useToast)
 * - Audit logging for all grade changes
 * - Modal for bulk operations
 * - Table component for grade display
 * - Better validation and error handling
 * - Auto-save warning
 */

"use client";

import { useState, useEffect } from "react";
import { useFetch, useMutation, useToast } from "@/hooks";
import { 
  Button, 
  Card, 
  Badge,
  Table,
  Modal,
  LoadingState,
  EmptyState
} from "@/components/ui";
import { ToastContainer } from "@/components/ui/Toast";
import { logger } from "@/lib/logger";
import { createAuditLog, AuditActions } from "@/lib/audit";

interface Student {
  id: string;
  email: string;
  full_name: string;
  student_id?: string;
}

interface GradeCategory {
  id: string;
  name: string;
  weight: number;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  total_points: number;
  category?: GradeCategory;
  due_date?: string;
  published: boolean;
}

interface Grade {
  id: string;
  assignment_id: string;
  student_id: string;
  points_earned?: number;
  late: boolean;
  excused: boolean;
  missing: boolean;
  feedback?: string;
  student: Student;
  graded_at?: string;
}

interface Class {
  id: string;
  name: string;
  code: string;
}

type QuickActionType = 'all-full' | 'all-missing' | 'clear-all';

export default function GradeEntryPageModern() {
  const toast = useToast();
  
  // Selection state
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  
  // Grades state
  const [grades, setGrades] = useState<Grade[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<QuickActionType | null>(null);
  
  // Fetch classes
  const { data: classesData, loading: classesLoading, error: classesError } = useFetch<{ classes: Class[] }>(
    '/api/classes/my-classes'
  );
  
  // Handle classes error
  useEffect(() => {
    if (classesError) {
      toast.error('Failed to load classes', classesError);
      logger.error('Classes fetch error', new Error(classesError));
    }
  }, [classesError]);
  
  // Fetch assignments for selected class
  const { 
    data: assignmentsData, 
    loading: assignmentsLoading,
    error: assignmentsError,
    refetch: refetchAssignments 
  } = useFetch<{ assignments: Assignment[] }>(
    selectedClass ? `/api/grades/assignments?classId=${selectedClass}&published=true` : ''
  );
  
  // Handle assignments error
  useEffect(() => {
    if (assignmentsError) {
      toast.error('Failed to load assignments', assignmentsError);
      logger.error('Assignments fetch error', new Error(assignmentsError));
    }
  }, [assignmentsError]);
  
  // Fetch grades for selected assignment
  const { 
    data: gradesData, 
    loading: gradesLoading,
    error: gradesError,
    refetch: refetchGrades 
  } = useFetch<{ grades: Grade[] }>(
    selectedAssignment ? `/api/grades?assignmentId=${selectedAssignment}` : ''
  );
  
  // Handle grades success
  useEffect(() => {
    if (gradesData) {
      setGrades(gradesData.grades || []);
      setHasChanges(false);
      logger.info('Grades loaded', { count: gradesData.grades?.length || 0 });
    }
  }, [gradesData]);
  
  // Handle grades error
  useEffect(() => {
    if (gradesError) {
      toast.error('Failed to load grades', gradesError);
      logger.error('Grades fetch error', new Error(gradesError));
    }
  }, [gradesError]);
  
  // Save grades mutation
  const { mutate: saveGrades, loading: saving } = useMutation('/api/grades', 'POST');
  
  const classes = classesData?.classes || [];
  const assignments = assignmentsData?.assignments || [];
  const selectedAssignmentData = assignments.find(a => a.id === selectedAssignment);
  
  // Reset assignment when class changes
  useEffect(() => {
    if (selectedClass) {
      setSelectedAssignment("");
      setGrades([]);
      setHasChanges(false);
    }
  }, [selectedClass]);
  
  // Validation helper
  const validatePoints = (points: number | undefined, maxPoints: number): { valid: boolean; error?: string } => {
    if (points === undefined) return { valid: true };
    if (points < 0) return { valid: false, error: 'Points cannot be negative' };
    if (points > maxPoints) return { valid: false, error: `Points cannot exceed ${maxPoints}` };
    return { valid: true };
  };
  
  // Grade change handlers
  const handlePointsChange = (gradeId: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    
    if (numValue !== undefined && selectedAssignmentData) {
      const validation = validatePoints(numValue, selectedAssignmentData.total_points);
      if (!validation.valid) {
        toast.warning('Invalid points', validation.error!);
        return;
      }
    }
    
    setGrades(prev => prev.map(g => {
      if (g.id === gradeId) {
        const updated = { ...g, points_earned: numValue };
        
        // Auto-clear flags when points are entered
        if (numValue !== undefined) {
          updated.missing = false;
          updated.excused = false;
        }
        
        return updated;
      }
      return g;
    }));
    setHasChanges(true);
  };
  
  const handleFlagToggle = (gradeId: string, flag: 'late' | 'excused' | 'missing') => {
    setGrades(prev => prev.map(g => {
      if (g.id === gradeId) {
        const updated = { ...g, [flag]: !g[flag] };
        
        // Auto-clear points when marked as excused or missing
        if (flag === 'excused' && updated.excused) {
          updated.points_earned = undefined;
          updated.missing = false;
        } else if (flag === 'missing' && updated.missing) {
          updated.points_earned = undefined;
          updated.excused = false;
        }
        
        return updated;
      }
      return g;
    }));
    setHasChanges(true);
  };
  
  const handleFeedbackChange = (gradeId: string, value: string) => {
    setGrades(prev => prev.map(g => 
      g.id === gradeId ? { ...g, feedback: value || undefined } : g
    ));
    setHasChanges(true);
  };
  
  // Bulk action handlers
  const handleBulkActionConfirm = () => {
    if (!bulkAction || !selectedAssignmentData) return;
    
    setGrades(prev => prev.map(g => {
      switch (bulkAction) {
        case 'all-full':
          return { 
            ...g, 
            points_earned: selectedAssignmentData.total_points, 
            late: false, 
            excused: false, 
            missing: false 
          };
        case 'all-missing':
          return { 
            ...g, 
            points_earned: undefined, 
            late: false, 
            excused: false, 
            missing: true 
          };
        case 'clear-all':
          return { 
            ...g, 
            points_earned: undefined, 
            late: false, 
            excused: false, 
            missing: false, 
            feedback: undefined 
          };
        default:
          return g;
      }
    }));
    
    setHasChanges(true);
    setShowBulkModal(false);
    setBulkAction(null);
    
    toast.success('Bulk action applied', getBulkActionMessage(bulkAction));
  };
  
  const getBulkActionMessage = (action: QuickActionType): string => {
    switch (action) {
      case 'all-full': return 'All students set to full credit';
      case 'all-missing': return 'All students marked as missing';
      case 'clear-all': return 'All grades cleared';
      default: return '';
    }
  };
  
  // Save handler with audit logging
  const handleSave = async () => {
    if (!selectedAssignmentData) return;
    
    // Validate all grades
    for (const grade of grades) {
      if (grade.points_earned !== undefined) {
        const validation = validatePoints(grade.points_earned, selectedAssignmentData.total_points);
        if (!validation.valid) {
          toast.error(
            `Invalid grade for ${grade.student.full_name}`, 
            validation.error!
          );
          return;
        }
      }
    }
    
    const gradesToSave = grades.map(g => ({
      id: g.id,
      assignment_id: g.assignment_id,
      student_id: g.student_id,
      points_earned: g.points_earned,
      late: g.late,
      excused: g.excused,
      missing: g.missing,
      feedback: g.feedback,
    }));
    
    try {
      await saveGrades({ grades: gradesToSave });
      
      setHasChanges(false);
      toast.success('All grades have been saved successfully');
      
      // Audit log for grade changes
      const changedGrades = grades.filter(g => 
        g.points_earned !== undefined || g.late || g.excused || g.missing || g.feedback
      );
      
      await createAuditLog({
        userId: 'current-user-id', // TODO: Get from session
        userEmail: 'teacher@example.com', // TODO: Get from session
        userRole: 'teacher',
        action: AuditActions.GRADE_UPDATED,
        resourceType: 'grade',
        resourceId: selectedAssignment,
        metadata: {
          assignment: selectedAssignmentData.title,
          class_id: selectedClass,
          grades_changed: changedGrades.length,
          student_count: grades.length,
        },
      });
      
      logger.info('Grades saved with audit log', { 
        assignment: selectedAssignment,
        count: changedGrades.length 
      });
      
      // Refetch to get updated timestamps
      refetchGrades();
    } catch (err: any) {
      toast.error('Failed to save grades');
      logger.error('Grade save error', { error: err });
    }
  };
  
  // Calculate grade percentage
  const getGradePercentage = (grade: Grade): string => {
    if (!selectedAssignmentData) return '-';
    if (grade.excused) return 'EXC';
    if (grade.missing) return 'MISS';
    if (grade.points_earned === undefined) return '-';
    
    const percentage = (grade.points_earned / selectedAssignmentData.total_points) * 100;
    return `${percentage.toFixed(1)}%`;
  };
  
  const getGradeColor = (grade: Grade): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
    if (grade.excused) return 'info';
    if (grade.missing) return 'danger';
    if (grade.points_earned === undefined) return 'default';
    if (!selectedAssignmentData) return 'default';
    
    const percentage = (grade.points_earned / selectedAssignmentData.total_points) * 100;
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'danger';
  };
  
  // Statistics
  const stats = {
    total: grades.length,
    graded: grades.filter(g => g.points_earned !== undefined && !g.excused && !g.missing).length,
    missing: grades.filter(g => g.missing).length,
    excused: grades.filter(g => g.excused).length,
    late: grades.filter(g => g.late).length,
  };
  
  if (classesLoading) {
    return <LoadingState message="Loading classes..." />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Grade Entry</h1>
        <p className="text-gray-600">Enter and manage student grades for assignments</p>
      </div>
      
      {/* Class & Assignment Selectors */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a class...</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.code})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment
            </label>
            <select
              value={selectedAssignment}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedAssignment(e.target.value)}
              disabled={!selectedClass || assignmentsLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select an assignment...</option>
              {assignments.map(assignment => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.title} ({assignment.total_points} pts)
                  {assignment.category ? ` - ${assignment.category.name}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>
      
      {/* Assignment Info & Quick Actions */}
      {selectedAssignment && selectedAssignmentData && (
        <>
          <Card className="mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {selectedAssignmentData.title}
                </h2>
                {selectedAssignmentData.description && (
                  <p className="text-sm text-gray-600">
                    {selectedAssignmentData.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 mt-3">
                  <Badge variant="info">
                    {selectedAssignmentData.total_points} points
                  </Badge>
                  {selectedAssignmentData.category && (
                    <Badge variant="info">
                      {selectedAssignmentData.category.name} ({selectedAssignmentData.category.weight}%)
                    </Badge>
                  )}
                  {selectedAssignmentData.due_date && (
                    <Badge variant="default">
                      Due: {new Date(selectedAssignmentData.due_date).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
              
              {grades.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => {
                      setBulkAction('all-full');
                      setShowBulkModal(true);
                    }}
                  >
                    All Full Credit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setBulkAction('all-missing');
                      setShowBulkModal(true);
                    }}
                  >
                    All Missing
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBulkAction('clear-all');
                      setShowBulkModal(true);
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>
          </Card>
          
          {/* Statistics */}
          {grades.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card padding="md">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  <p className="text-xs text-gray-600 mt-1">Total</p>
                </div>
              </Card>
              <Card padding="md">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.graded}</p>
                  <p className="text-xs text-gray-600 mt-1">Graded</p>
                </div>
              </Card>
              <Card padding="md">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.missing}</p>
                  <p className="text-xs text-gray-600 mt-1">Missing</p>
                </div>
              </Card>
              <Card padding="md">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">{stats.excused}</p>
                  <p className="text-xs text-gray-600 mt-1">Excused</p>
                </div>
              </Card>
              <Card padding="md">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                  <p className="text-xs text-gray-600 mt-1">Late</p>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
      
      {/* Grades Table */}
      {gradesLoading ? (
        <LoadingState message="Loading grades..." />
      ) : grades.length === 0 && selectedAssignment ? (
        <EmptyState
          icon={<span className="text-6xl">📊</span>}
          title="No students enrolled"
          description="There are no students enrolled in this class yet"
        />
      ) : grades.length > 0 ? (
        <Card padding="none">
          <Table
            data={grades}
            keyExtractor={(grade) => grade.id}
            columns={[
              {
                key: 'student',
                label: 'Student',
                render: (grade) => (
                  <div>
                    <div className="font-medium text-gray-900">{grade.student.full_name}</div>
                    <div className="text-sm text-gray-600">{grade.student.email}</div>
                  </div>
                ),
              },
              {
                key: 'student_id',
                label: 'ID',
                render: (grade) => (
                  <span className="text-gray-600 font-mono text-sm">
                    {grade.student.student_id || '-'}
                  </span>
                ),
              },
              {
                key: 'points',
                label: 'Points',
                render: (grade) => (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={selectedAssignmentData?.total_points}
                      step="0.5"
                      value={grade.points_earned ?? ''}
                      onChange={(e) => handlePointsChange(grade.id, e.target.value)}
                      disabled={grade.excused || grade.missing}
                      className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="-"
                    />
                    <span className="text-sm text-gray-600">
                      / {selectedAssignmentData?.total_points}
                    </span>
                  </div>
                ),
              },
              {
                key: 'grade',
                label: 'Grade',
                render: (grade) => (
                  <Badge variant={getGradeColor(grade)}>
                    {getGradePercentage(grade)}
                  </Badge>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (grade) => (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleFlagToggle(grade.id, 'late')}
                      className={`px-2 py-1 rounded text-xs font-medium ${
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
                      className={`px-2 py-1 rounded text-xs font-medium ${
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
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        grade.missing
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                      }`}
                      title="Missing"
                    >
                      Miss
                    </button>
                  </div>
                ),
              },
              {
                key: 'feedback',
                label: 'Feedback',
                render: (grade) => (
                  editingFeedback === grade.id ? (
                    <input
                      type="text"
                      value={grade.feedback || ''}
                      onChange={(e) => handleFeedbackChange(grade.id, e.target.value)}
                      onBlur={() => setEditingFeedback(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingFeedback(null);
                        if (e.key === 'Escape') setEditingFeedback(null);
                      }}
                      autoFocus
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Add feedback..."
                    />
                  ) : (
                    <div
                      onClick={() => setEditingFeedback(grade.id)}
                      className="text-sm text-gray-600 cursor-pointer hover:text-gray-900 min-h-[24px]"
                    >
                      {grade.feedback || (
                        <span className="text-gray-600 italic">Click to add</span>
                      )}
                    </div>
                  )
                ),
              },
            ]}
          />
        </Card>
      ) : null}
      
      {/* Empty States */}
      {!selectedClass && (
        <EmptyState
          icon={<span className="text-6xl">📚</span>}
          title="Select a Class"
          description="Choose a class from the dropdown above to start entering grades"
        />
      )}
      
      {selectedClass && !selectedAssignment && (
        <EmptyState
          icon={<span className="text-6xl">📝</span>}
          title="Select an Assignment"
          description="Choose an assignment to view and enter grades for your students"
        />
      )}
      
      {/* Bulk Action Confirmation Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => {
          setShowBulkModal(false);
          setBulkAction(null);
        }}
        title="Confirm Bulk Action"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to apply this action to all {grades.length} students?
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Action:</strong> {bulkAction && getBulkActionMessage(bulkAction)}
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkModal(false);
                setBulkAction(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleBulkActionConfirm}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Save Changes Button */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 bg-white border border-gray-300 rounded-lg shadow-2xl p-4 max-w-sm">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600 text-2xl">⚠️</div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                Unsaved Changes
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                You have unsaved changes. Don't forget to save!
              </p>
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={saving}
                fullWidth
              >
                {saving ? 'Saving...' : 'Save All Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
