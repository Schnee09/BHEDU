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
        .select('*, teachers:profiles!teacher_id(full_name), subjects(name), rooms(name)')
        .order('name');

    return (response as List).map((json) => ClassModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  /// Get classes for a teacher
  Future<List<ClassModel>> getTeacherClasses(String teacherId) async {
    final response = await supabase
        .from('classes')
        .select('*, subjects(name), rooms(name)')
        .eq('teacher_id', teacherId)
        .order('name');

    return (response as List).map((json) => ClassModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  /// Get a single class with details
  Future<ClassModel?> getClass(String classId) async {
    final response = await supabase
        .from('classes')
        .select('*, teachers:profiles!teacher_id(full_name), subjects(name), rooms(name)')
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
        .eq('class_id', classId);

    return (response as List).length;
  }
  /// Create a new class
  Future<ClassModel> createClass({
    required String name,
    String? subjectId,
    String? roomId,
    String? teacherId,
    int? capacity,
  }) async {
    final response = await supabase
        .from('classes')
        .insert({
          'name': name,
          if (subjectId != null) 'subject_id': subjectId,
          if (roomId != null) 'room_id': roomId,
          if (teacherId != null) 'teacher_id': teacherId,
          if (capacity != null) 'capacity': capacity,
        })
        .select()
        .single();

    return ClassModel.fromJson(response);
  }
}
