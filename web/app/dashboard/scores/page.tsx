"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { api } from "@/lib/api-client";
import LoadingScreen from "@/components/LoadingScreen";

type Grade = {
  id: string;
  assignment_id: string;
  student_id: string;
  score: number;
  feedback: string | null;
  graded_at: string | null;
  student?: { id: string; full_name: string; email: string } | null;
  assignment?: { id: string; title: string; max_points: number; class_id: string } | null;
};

export default function ScoresPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState<string>("");

  useEffect(() => {
    if (profileLoading || !profile) return;

    const fetchGrades = async () => {
      console.log('[Scores] Fetching grades for profile:', profile.role, profile.id);
      setLoading(true);
      
      try {
        let result: any[] = [];

        if (profile.role === "student") {
          // Students see only their own grades
          result = await api.grades.list({ student_id: profile.id });
        } else if (profile.role === "teacher") {
          // Teachers see grades from all students (could filter by their classes)
          result = await api.grades.list();
        } else {
          // Admins see all grades
          result = await api.grades.list();
        }

        console.log('[Scores] Fetched', result.length, 'grades');
        setGrades(result as Grade[]);
      } catch (error) {
        console.error("[Scores] Error fetching grades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [profile, profileLoading]);

  // Helper to get letter grade from percentage
  const getLetterGrade = (score: number, maxPoints: number): string => {
    if (!maxPoints || maxPoints === 0) return "N/A";
    const percentage = (score / maxPoints) * 100;
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  // Helper to get grade color
  const getGradeColor = (letter: string): string => {
    if (letter === "A") return "text-green-600 bg-green-100";
    if (letter === "B") return "text-blue-600 bg-blue-100";
    if (letter === "C") return "text-yellow-600 bg-yellow-100";
    if (letter === "D") return "text-orange-600 bg-orange-100";
    if (letter === "F") return "text-red-600 bg-red-100";
    return "text-gray-600 bg-gray-100";
  };

  if (profileLoading || loading) return <LoadingScreen />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {profile?.role === "student" ? "My Grades" : "Grades Overview"}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {profile?.role === "student" 
              ? "View your academic performance"
              : "View all student grades"}
          </p>
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {grades.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Grades Yet</h3>
            <p className="text-gray-600">
              {profile?.role === "student" 
                ? "You don't have any grades recorded yet"
                : "No grades have been recorded in the system"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {profile?.role !== "student" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Graded At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {grades.map((grade) => {
                  const maxPoints = grade.assignment?.max_points || 0;
                  const percentage = maxPoints > 0 ? ((grade.score / maxPoints) * 100).toFixed(1) : "0.0";
                  const letter = getLetterGrade(grade.score, maxPoints);
                  const gradeColor = getGradeColor(letter);

                  return (
                    <tr key={grade.id} className="hover:bg-gray-50">
                      {profile?.role !== "student" && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {grade.student?.full_name || "Unknown Student"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {grade.student?.email}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {grade.assignment?.title || "Unknown Assignment"}
                        </div>
                        {grade.feedback && (
                          <div className="text-sm text-gray-500 mt-1">
                            {grade.feedback}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {grade.score} / {maxPoints}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${gradeColor}`}>
                          {letter}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{percentage}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {grade.graded_at 
                          ? new Date(grade.graded_at).toLocaleDateString()
                          : "Not graded"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats for Students */}
      {profile?.role === "student" && grades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Total Grades</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{grades.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Average Score</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {(
                grades.reduce((sum, g) => {
                  const max = g.assignment?.max_points || 0;
                  return sum + (max > 0 ? (g.score / max) * 100 : 0);
                }, 0) / grades.length
              ).toFixed(1)}%
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <p className="text-sm font-medium text-gray-600">A Grades</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {grades.filter(g => {
                const max = g.assignment?.max_points || 0;
                return max > 0 && ((g.score / max) * 100) >= 90;
              }).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Assignments Graded</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {grades.filter(g => g.graded_at !== null).length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
