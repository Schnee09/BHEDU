"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { showToast } from "@/components/ToastProvider";
import { Card } from "@/components/ui";

interface Student {
  id: string;
  student_code: string;
  full_name: string;
  conduct_grade: string | null;
  teacher_comment: string | null;
}

interface ClassOption {
  id: string;
  name: string;
  grade_level: string;
}

const CONDUCT_GRADES = [
  {
    value: "excellent",
    label: "Xuất sắc",
    label_en: "Excellent",
    color: "text-emerald-600 bg-emerald-50",
    criteria: [
      "Tham gia đầy đủ các hoạt động của lớp và nhà trường",
      "Có ý thức kỷ luật cao, chấp hành nội quy",
      "Tích cực tham gia các hoạt động tập thể",
      "Có tinh thần đoàn kết, giúp đỡ bạn bè",
      "Có thái độ học tập nghiêm túc, chủ động"
    ]
  },
  {
    value: "good",
    label: "Tốt",
    label_en: "Good",
    color: "text-blue-600 bg-blue-50",
    criteria: [
      "Tham gia đầy đủ các hoạt động của lớp",
      "Có ý thức kỷ luật tốt, chấp hành nội quy",
      "Tích cực tham gia các hoạt động tập thể",
      "Có tinh thần đoàn kết với bạn bè",
      "Có thái độ học tập nghiêm túc"
    ]
  },
  {
    value: "fair",
    label: "Khá",
    label_en: "Fair",
    color: "text-yellow-600 bg-yellow-50",
    criteria: [
      "Tham gia các hoạt động của lớp",
      "Có ý thức kỷ luật, chấp hành nội quy",
      "Tham gia các hoạt động tập thể",
      "Có tinh thần đoàn kết với bạn bè",
      "Có thái độ học tập nghiêm túc"
    ]
  },
  {
    value: "average",
    label: "Trung bình",
    label_en: "Average",
    color: "text-orange-600 bg-orange-50",
    criteria: [
      "Tham gia một số hoạt động của lớp",
      "Có ý thức kỷ luật cơ bản",
      "Thỉnh thoảng vi phạm kỷ luật nhỏ",
      "Có tinh thần đoàn kết nhưng chưa tích cực",
      "Thái độ học tập chưa nghiêm túc"
    ]
  },
  {
    value: "weak",
    label: "Yếu",
    label_en: "Weak",
    color: "text-red-600 bg-red-50",
    criteria: [
      "Tham gia ít hoạt động của lớp",
      "Thường xuyên vi phạm kỷ luật",
      "Không tích cực trong hoạt động tập thể",
      "Thiếu tinh thần đoàn kết",
      "Thái độ học tập kém, lười biếng"
    ]
  },
];

export default function ConductGradeEntryPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("HK1");
  const [academicYearId, setAcademicYearId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCurrentAcademicYear();
    fetchClasses();
  }, []);

   
  useEffect(() => {
    if (selectedClass && academicYearId) {
      fetchStudentConductGrades();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSemester, academicYearId]);

  const fetchCurrentAcademicYear = async () => {
    try {
      const res = await apiFetch("/api/academic-years/current");
      const data = await res.json();
      if (data.success && data.academicYear) {
        setAcademicYearId(data.academicYear.id);
      }
    } catch (error) {
      console.error("Failed to fetch academic year:", error);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await apiFetch("/api/classes/my-classes");
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
      showToast.error("Không thể tải danh sách lớp");
    }
  };

  const fetchStudentConductGrades = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/grades/conduct-entry?class_id=${selectedClass}&semester=${selectedSemester}&academic_year_id=${academicYearId}`
      );
      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error("Failed to fetch conduct grades:", error);
      showToast.error("Không thể tải dữ liệu hạnh kiểm");
    } finally {
      setLoading(false);
    }
  };

  const handleConductChange = (studentId: string, value: string) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, conduct_grade: value }
          : student
      )
    );
  };

  const handleCommentChange = (studentId: string, value: string) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, teacher_comment: value }
          : student
      )
    );
  };

  const handleSaveAll = async () => {
    if (!selectedClass || !academicYearId) {
      showToast.error("Vui lòng chọn lớp học");
      return;
    }

    setSaving(true);
    try {
      const conductData = students.map((student) => ({
        student_id: student.id,
        class_id: selectedClass,
        semester: selectedSemester,
        academic_year_id: academicYearId,
        conduct_grade: student.conduct_grade,
        teacher_comment: student.teacher_comment,
      }));

      const res = await apiFetch("/api/grades/conduct-entry", {
        method: "POST",
        body: JSON.stringify({ conductGrades: conductData }),
      });

      const data = await res.json();
      if (data.success) {
        showToast.success("Đã lưu hạnh kiểm thành công!");
      } else {
        showToast.error(data.error || "Lưu thất bại");
      }
    } catch (error) {
      console.error("Failed to save conduct grades:", error);
      showToast.error("Không thể lưu dữ liệu hạnh kiểm");
    } finally {
      setSaving(false);
    }
  };

  const getConductColor = (value: string | null) => {
    const conduct = CONDUCT_GRADES.find((c) => c.value === value);
    return conduct?.color || "text-gray-600 bg-gray-50";
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhập Hạnh Kiểm</h1>
          <p className="mt-1 text-sm text-gray-600">
            Đánh giá hạnh kiểm học sinh theo học kỳ
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Class Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lớp học
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Chọn lớp</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.grade_level ? `(${cls.grade_level})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Học kỳ
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="HK1">Học kỳ 1</option>
                <option value="HK2">Học kỳ 2</option>
              </select>
            </div>

            {/* Save Button */}
            <div className="flex items-end">
              <button
                onClick={handleSaveAll}
                disabled={!selectedClass || saving || students.length === 0}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {saving ? "Đang lưu..." : "Lưu tất cả"}
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Tiêu chí đánh giá hạnh kiểm:</p>
            <div className="space-y-3">
              {CONDUCT_GRADES.map((conduct) => (
                <div key={conduct.value} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${conduct.color}`}>
                      {conduct.label}
                    </span>
                    <span className="text-sm text-gray-600">({conduct.label_en})</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    {conduct.criteria.map((criterion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <span>{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Students Table */}
      {loading ? (
        <Card>
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <div className="p-12 text-center text-gray-500">
            {selectedClass
              ? "Không có học sinh trong lớp này"
              : "Vui lòng chọn lớp để bắt đầu"}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Mã HS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Họ và tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Hạnh kiểm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Nhận xét giáo viên
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* STT */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>

                    {/* Student Code */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                      {student.student_code || "-"}
                    </td>

                    {/* Full Name */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.full_name}
                    </td>

                    {/* Conduct Grade Dropdown */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={student.conduct_grade || ""}
                        onChange={(e) =>
                          handleConductChange(student.id, e.target.value)
                        }
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium ${getConductColor(
                          student.conduct_grade
                        )}`}
                      >
                        <option value="">Chọn hạnh kiểm</option>
                        {CONDUCT_GRADES.map((conduct) => (
                          <option key={conduct.value} value={conduct.value}>
                            {conduct.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Teacher Comment */}
                    <td className="px-6 py-4">
                      <textarea
                        value={student.teacher_comment || ""}
                        onChange={(e) =>
                          handleCommentChange(student.id, e.target.value)
                        }
                        placeholder="Nhận xét về hạnh kiểm của học sinh..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Summary Footer */}
      {students.length > 0 && (
        <Card>
          <div className="p-4 bg-gray-50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Tổng số học sinh: <span className="font-semibold text-gray-900">{students.length}</span>
              </span>
              <span className="text-gray-600">
                Đã đánh giá:{" "}
                <span className="font-semibold text-gray-900">
                  {students.filter((s) => s.conduct_grade).length}
                </span>
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
