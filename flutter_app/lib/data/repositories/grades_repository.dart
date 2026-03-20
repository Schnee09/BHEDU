/// Grades Repository - handles Supabase grade operations
library;

import '../../config/supabase_config.dart';
import '../models/grade_model.dart';

class GradesRepository {
  GradesRepository();

  /// Get grades for a student with optional filtering
  Future<List<GradeModel>> getStudentGrades({
    required String studentId,
    String? semester,
    String? academicYear,
  }) async {
    var query = supabase
        .from('grades')
        .select('*, profiles(full_name), subjects(name), classes(name)')
        .eq('student_id', studentId);

    if (semester != null) {
      query = query.eq('semester', semester);
    }
    if (academicYear != null) {
      query = query.eq('academic_year', academicYear);
    }

    final response = await query
        .order('created_at', ascending: false)
        .limit(100);

    return (response as List).map((json) => GradeModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  /// Get grades grouped by subject for display
  Future<Map<String, List<GradeModel>>> getGradesGroupedBySubject({
    required String studentId,
    String? semester,
    String? academicYear,
  }) async {
    final grades = await getStudentGrades(
      studentId: studentId,
      semester: semester,
      academicYear: academicYear,
    );

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
    String? semester,
    String? academicYear,
  }) async {
    final grades = await getStudentGrades(
      studentId: studentId,
      semester: semester,
      academicYear: academicYear,
    );

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
        .upsert({
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
        }, onConflict: 'student_id, class_id, subject_id, category')
        .select('*, profiles(full_name), subjects(name)')
        .single();

    return GradeModel.fromJson(response);
  }

  /// Get specific grades for a class and category (for teachers to edit)
  Future<List<GradeModel>> getClassGradesByCategory({
    required String classId,
    required String category,
    String? subjectId,
  }) async {
    var query = supabase
        .from('grades')
        .select('*')
        .eq('class_id', classId)
        .eq('category', category);
    
    if (subjectId != null && subjectId.isNotEmpty) {
      query = query.eq('subject_id', subjectId);
    }

    final response = await query;
    return (response as List).map((json) => GradeModel.fromJson(json as Map<String, dynamic>)).toList();
  }
}
