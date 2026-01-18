/// Classes Repository - handles Supabase class operations
library;

import '../../config/supabase_config.dart';
import '../models/class_model.dart';

class ClassesRepository {
  ClassesRepository();

  /// Get all classes
  Future<List<ClassModel>> getClasses() async {
    final response = await supabase
        .from('classes')
        .select('*, teachers:teacher_id(full_name), subjects(name), rooms(name)')
        .eq('is_active', true)
        .order('name');

    return (response as List).map((json) => ClassModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  /// Get classes for a teacher
  Future<List<ClassModel>> getTeacherClasses(String teacherId) async {
    final response = await supabase
        .from('classes')
        .select('*, subjects(name), rooms(name)')
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
        .order('name');

    return (response as List).map((json) => ClassModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  /// Get a single class with details
  Future<ClassModel?> getClass(String classId) async {
    final response = await supabase
        .from('classes')
        .select('*, teachers:teacher_id(full_name), subjects(name), rooms(name)')
        .eq('id', classId)
        .maybeSingle();

    if (response == null) return null;
    return ClassModel.fromJson(response);
  }

  /// Get class enrollment count
  Future<int> getEnrollmentCount(String classId) async {
    final response = await supabase
        .from('enrollments')
        .select('id')
        .eq('class_id', classId)
        .eq('status', 'active');

    return (response as List).length;
  }
}
