/// Students Repository - handles Supabase student operations
library;

import '../../config/supabase_config.dart';
import '../models/student_model.dart';

class StudentsRepository {
  StudentsRepository();

  /// Get all students (for admin/staff)
  Future<List<StudentModel>> getStudents() async {
    final response = await supabase
        .from('students')
        .select()
        .order('full_name')
        .limit(50);

    return (response as List).map((json) => StudentModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  /// Get a single student by ID
  Future<StudentModel?> getStudent(String studentId) async {
    final response = await supabase
        .from('students')
        .select()
        .eq('id', studentId)
        .maybeSingle();

    if (response == null) return null;
    return StudentModel.fromJson(response);
  }

  /// Get students in a class
  Future<List<StudentModel>> getStudentsInClass(String classId) async {
    final response = await supabase
        .from('enrollments')
        .select('students(*)')
        .eq('class_id', classId)
        .eq('status', 'active');

    final students = <StudentModel>[];
    for (final enrollment in response) {
      final studentData = enrollment['students'];
      if (studentData != null) {
        students.add(StudentModel.fromJson(studentData as Map<String, dynamic>));
      }
    }
    return students;
  }

  /// Search students by name or code
  Future<List<StudentModel>> searchStudents(String query) async {
    final response = await supabase
        .from('students')
        .select()
        .or('full_name.ilike.%$query%,student_code.ilike.%$query%')
        .limit(20);

    return (response as List).map((json) => StudentModel.fromJson(json as Map<String, dynamic>)).toList();
  }
}
