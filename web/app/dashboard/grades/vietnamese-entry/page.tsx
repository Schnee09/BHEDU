"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { showToast } from "@/components/ToastProvider";
import { Icons } from "@/components/ui/Icons";

interface Student {
  id: string;
  student_code: string;
  full_name: string;
  grades: {
    [componentType: string]: number | null;
  };
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

const GRADE_COMPONENTS = [
  { type: 'oral', name_vi: 'Điểm miệng', name_en: 'Oral', weight: 1, color: 'bg-blue-50' },
  { type: 'fifteen_min', name_vi: 'Điểm 15 phút', name_en: '15-min Test', weight: 1, color: 'bg-green-50' },
  { type: 'one_period', name_vi: 'Điểm 1 tiết', name_en: '45-min Test', weight: 2, color: 'bg-yellow-50' },
  { type: 'midterm', name_vi: 'Điểm giữa kỳ', name_en: 'Midterm', weight: 2, color: 'bg-orange-50' },
  { type: 'final', name_vi: 'Điểm cuối kỳ', name_en: 'Final', weight: 3, color: 'bg-red-50' },
];

export default function VietnameseGradeEntryPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("HK1");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

   
  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchStudentGrades();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSubject, selectedSemester]);

  const fetchClasses = async () => {
    try {
      const res = await apiFetch("/api/classes/my-classes");
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await apiFetch("/api/subjects");
      const data = await res.json();
      if (data.success) {
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    }
  };

  const fetchStudentGrades = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/grades/vietnamese-entry?class_id=${selectedClass}&subject_code=${selectedSubject}&semester=${selectedSemester}`
      );
      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error("Failed to fetch student grades:", error);
      showToast.error("Không thể tải dữ liệu điểm");
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (studentId: string, componentType: string, value: string) => {
    setStudents(prev => 
      prev.map(student => {
        if (student.id === studentId) {
          const numValue = value === "" ? null : parseFloat(value);
          // Validate 0-10 scale
          if (numValue !== null && (numValue < 0 || numValue > 10)) {
            showToast.error("Điểm phải từ 0 đến 10");
            return student;
          }
          return {
            ...student,
            grades: {
              ...student.grades,
              [componentType]: numValue
            }
          };
        }
        return student;
      })
    );
  };

  const calculateWeightedAverage = (grades: { [key: string]: number | null }) => {
    let totalWeighted = 0;
    let totalWeight = 0;

    GRADE_COMPONENTS.forEach(component => {
      const grade = grades[component.type];
      if (grade !== null && grade !== undefined) {
        totalWeighted += grade * component.weight;
        totalWeight += component.weight;
      }
    });

    return totalWeight > 0 ? (totalWeighted / totalWeight).toFixed(2) : "-";
  };

  const getGradeClassification = (avg: string) => {
    const num = parseFloat(avg);
    if (isNaN(num)) return { label: "-", color: "text-gray-600" };
    if (num >= 8) return { label: "Giỏi", color: "text-green-600 font-bold" };
    if (num >= 6.5) return { label: "Khá", color: "text-blue-600 font-semibold" };
    if (num >= 5) return { label: "TB", color: "text-yellow-600" };
    return { label: "Yếu", color: "text-red-600" };
  };

  const handleSaveAll = async () => {
    if (!selectedClass || !selectedSubject || !selectedSemester) {
      showToast.error("Vui lòng chọn lớp, môn học và học kỳ");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/api/grades/vietnamese-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: selectedClass,
          subject_code: selectedSubject,
          semester: selectedSemester,
          students: students.map(s => ({
            student_id: s.id,
            grades: s.grades
          }))
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast.success("Đã lưu điểm thành công!");
      } else {
        showToast.error(data.error || "Lỗi khi lưu điểm");
      }
    } catch (error) {
      console.error("Failed to save grades:", error);
      showToast.error("Không thể lưu điểm");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Nhập điểm theo hệ thống Việt Nam</h1>
        <p className="text-gray-600">Hệ thống điểm 10, có trọng số (Điểm miệng, 15 phút, 1 tiết, Giữa kỳ, Cuối kỳ)</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Lớp học</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Chọn lớp --</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Môn học</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Chọn môn --</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.code}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Học kỳ</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="HK1">Học kỳ 1</option>
              <option value="HK2">Học kỳ 2</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveAll}
            disabled={saving || students.length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors flex items-center gap-2"
          >
            <Icons.Save className="w-4 h-4" />
            {saving ? "Đang lưu..." : "Lưu tất cả"}
          </button>
        </div>
      </div>

      {/* Grade Entry Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      ) : students.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-blue-600 z-10">STT</th>
                  <th className="px-4 py-3 text-left font-semibold sticky left-12 bg-blue-600 z-10">Mã HS</th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[200px]">Họ và tên</th>
                  {GRADE_COMPONENTS.map((component) => (
                    <th key={component.type} className={`px-4 py-3 text-center font-semibold min-w-[120px]`}>
                      <div>{component.name_vi}</div>
                      <div className="text-xs font-normal opacity-90">Hệ số: {component.weight}</div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold min-w-[100px] bg-blue-700">Điểm TB</th>
                  <th className="px-4 py-3 text-center font-semibold min-w-[100px] bg-blue-700">Xếp loại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student, index) => {
                  const average = calculateWeightedAverage(student.grades);
                  const classification = getGradeClassification(average);
                  
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-center font-medium sticky left-0 bg-white">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 sticky left-12 bg-white">{student.student_code}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{student.full_name}</td>
                      {GRADE_COMPONENTS.map((component) => (
                        <td key={component.type} className={`px-2 py-2 ${component.color}`}>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="10"
                            value={student.grades[component.type] ?? ""}
                            onChange={(e) => handleGradeChange(student.id, component.type, e.target.value)}
                            className="w-full px-3 py-2 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="-"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center text-lg font-bold text-blue-600 bg-blue-50">
                        {average}
                      </td>
                      <td className={`px-4 py-3 text-center ${classification.color} bg-blue-50`}>
                        {classification.label}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 text-lg">
            {selectedClass && selectedSubject
              ? "Không có học sinh trong lớp này"
              : "Vui lòng chọn lớp học và môn học để bắt đầu"}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Hệ thống xếp loại</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-sm"><strong>Giỏi:</strong> 8.0 - 10.0</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-sm"><strong>Khá:</strong> 6.5 - 7.9</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-sm"><strong>Trung bình:</strong> 5.0 - 6.4</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-sm"><strong>Yếu:</strong> &lt; 5.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
