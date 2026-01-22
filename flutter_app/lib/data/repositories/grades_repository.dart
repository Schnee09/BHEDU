/// Grades Repository - handles Supabase grade operations
library;

import '../../config/supabase_config.dart';
import '../models/grade_model.dart';

class GradesRepository {
  GradesRepository();

  /// Get grades for a student
  Future<List<GradeModel>> getStudentGrades({
    required String studentId,
  }) async {
    final response = await supabase
        .from('grades')
        .select('*, profiles(full_name), subjects(name), classes(name)')
        .eq('student_id', studentId)
        .order('created_at', ascending: false)
        .limit(100);

    return (response as List).map((json) => GradeModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  /// Get grades grouped by subject for display
  Future<Map<String, List<GradeModel>>> getGradesGroupedBySubject({
    required String studentId,
  }) async {
    final grades = await getStudentGrades(studentId: studentId);

    final grouped = <String, List<GradeModel>>{};
    for (final grade in grades) {
      final subjectName = grade.subjectName ?? 'Unknown';
      grouped.putIfAbsent(subjectName, () => []);
      grouped[subjectName]!.add(grade);
    }

    return grouped;
  }

  /// Calculate average grade for a student
  Future<double> calculateAverage({
    required String studentId,
  }) async {
    final grades = await getStudentGrades(studentId: studentId);

    if (grades.isEmpty) return 0;

    double totalWeighted = 0;
    int totalWeight = 0;

    for (final grade in grades) {
      totalWeighted += grade.score * grade.category.weight;
      totalWeight += grade.category.weight;
    }

    return totalWeight > 0 ? totalWeighted / totalWeight : 0;
  }

  /// Enter a grade (for teachers)
  Future<GradeModel> enterGrade({
    required String studentId,
    required String classId,
    required String subjectId,
    required String category,
    required double score,
    String? notes,
    String? gradedBy,
    String? semester,
    String? academicYear,
  }) async {
    final response = await supabase
        .from('grades')
        .insert({
          'student_id': studentId,
          'class_id': classId,
          'subject_id': subjectId,
          'category': category,
          'score': score,
          'max_score': 10.0,
          'notes': notes,
          'graded_by': gradedBy,
          'graded_at': DateTime.now().toIso8601String(),
          'semester': semester,
          'academic_year': academicYear,
        })
        .select('*, profiles(full_name), subjects(name)')
        .single();

    return GradeModel.fromJson(response);
  }
}
