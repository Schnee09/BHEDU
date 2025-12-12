"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import Badge from "@/components/ui/badge";
import { SimpleTable } from "@/components/ui/table";

interface Grade {
  id: string;
  score: number;
  graded_at: string;
  feedback: string | null;
  assignment: {
    id: string;
    title: string;
    max_points: number;
    due_date: string | null;
    class: {
      id: string;
      name: string;
    };
    category: {
      id: string;
      name: string;
      weight: number;
    };
  };
}

interface GradesByClass {
  [className: string]: Grade[];
}

export default function StudentGradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        const res = await apiFetch("/api/student/grades");
        if (!res.ok) throw new Error("Failed to fetch grades");
        const response = await res.json();
        // Extract grades array from response object
        const gradesData = Array.isArray(response) ? response : (response.grades || []);
        setGrades(gradesData);
      } catch (err) {
        console.error("Failed to fetch grades:", err);
        setError("Failed to load grades. Please try again later.");
        setGrades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-stone-200 rounded animate-pulse mb-6"></div>
        <div className="grid gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-stone-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  // Group grades by class
  const gradesByClass = grades.reduce<GradesByClass>((acc, grade) => {
    const className = grade.assignment.class.name;
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(grade);
    return acc;
  }, {});

  const calculateAverage = (classGrades: Grade[]) => {
    if (classGrades.length === 0) return 0;
    const total = classGrades.reduce((sum, grade) => sum + grade.score, 0);
    const maxTotal = classGrades.reduce((sum, grade) => sum + grade.assignment.max_points, 0);
    return maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-heading">My Grades</h1>
          <p className="text-stone-500 mt-1">View your academic performance across all classes</p>
        </div>
      </div>

      {Object.keys(gradesByClass).length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.Chart className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-medium text-stone-900">No grades available</h3>
          <p className="text-stone-500 mt-2">You haven't received any grades yet.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(gradesByClass).map(([className, classGrades]) => {
            const average = calculateAverage(classGrades);
            
            return (
              <Card key={className} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between bg-stone-50 border-b border-stone-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border border-stone-200 rounded-lg">
                      <Icons.Classes className="w-5 h-5 text-stone-600" />
                    </div>
                    <h2 className="text-lg font-bold text-stone-900">{className}</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Current Average</p>
                      <p className={`text-xl font-bold ${
                        average >= 90 ? 'text-green-600' :
                        average >= 80 ? 'text-stone-900' :
                        average >= 70 ? 'text-stone-700' :
                        'text-orange-600'
                      }`}>
                        {average.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="p-0">
                  <SimpleTable
                    headers={["Assignment", "Category", "Date", "Score", "Status"]}
                    rows={classGrades.map((grade) => [
                      <div key={`${grade.id}-title`} className="font-medium text-stone-900">
                        {grade.assignment.title}
                        {grade.feedback && (
                          <p className="text-xs text-stone-500 mt-0.5 font-normal truncate max-w-xs">
                            Feedback: {grade.feedback}
                          </p>
                        )}
                      </div>,
                      <Badge key={`${grade.id}-cat`} variant="default" className="bg-stone-100 text-stone-700 border-stone-200">
                        {grade.assignment.category.name}
                      </Badge>,
                      <span key={`${grade.id}-date`} className="text-stone-600">
                        {new Date(grade.graded_at).toLocaleDateString()}
                      </span>,
                      <div key={`${grade.id}-score`} className="font-mono font-medium">
                        <span className={
                          grade.score / grade.assignment.max_points >= 0.9 ? 'text-green-700' :
                          grade.score / grade.assignment.max_points < 0.6 ? 'text-red-700' :
                          'text-stone-900'
                        }>
                          {grade.score}
                        </span>
                        <span className="text-stone-400 text-xs ml-1">/ {grade.assignment.max_points}</span>
                      </div>,
                      <Badge 
                        key={`${grade.id}-status`}
                        variant={grade.score / grade.assignment.max_points >= 0.6 ? 'success' : 'warning'}
                      >
                        {grade.score / grade.assignment.max_points >= 0.6 ? 'Pass' : 'Needs Improvement'}
                      </Badge>
                    ])}
                  />
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
