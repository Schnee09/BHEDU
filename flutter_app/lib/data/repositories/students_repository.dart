/// Students Repository - handles student data operations
/// Maps to Web App's StudentRepository logic
library;

import 'dart:developer' as developer;
import '../models/profile_model.dart';
import 'base_repository.dart';

class StudentsRepository extends BaseRepository {
  static const String tableName = 'profiles';

  StudentsRepository();

  /// Get all students (for admin/staff)
  Future<List<ProfileModel>> getStudents({
    int page = 1,
    int limit = 50,
    String? search,
    String? status,
    String? gradeLevel,
  }) async {
    return handleAsyncErrors(() async {
      developer.log('[StudentsRepository] Fetching students page $page');

      var query = supabase.from(tableName).select().eq('role', 'student');

      if (search != null && search.isNotEmpty) {
        query = query.or('full_name.ilike.%$search%,email.ilike.%$search%');
      }

      if (status != null) {
        query = query.eq('status', status);
      }

      if (gradeLevel != null) {
        query = query.eq('grade_level', gradeLevel);
      }

      // Add order and pagination
      final response = await query
          .order('full_name') // or full_name -> first_name
          .range((page - 1) * limit, page * limit - 1);

      return (response as List)
          .map((json) => ProfileModel.fromJson(json as Map<String, dynamic>))
          .toList();
    });
  }

  /// Get a single student by ID
  Future<ProfileModel?> getStudent(String id) async {
    return handleAsyncErrors(() async {
      final response = await supabase
          .from(tableName)
          .select()
          .eq('id', id)
          .maybeSingle();

      if (response == null) return null;
      return ProfileModel.fromJson(response);
    });
  }

  /// Get students in a class (via enrollments)
  Future<List<ProfileModel>> getStudentsInClass(String classId) async {
    return handleAsyncErrors(() async {
      // 1. Get student IDs from enrollments
      final enrollments = await supabase
          .from('enrollments')
          .select('student_id')
          .eq('class_id', classId)
          .eq('status', 'active');

      final studentIds = (enrollments as List)
          .map((e) => e['student_id'] as String)
          .toList();

      if (studentIds.isEmpty) return [];

      // 2. Get profiles for those IDs
      final response = await supabase
          .from(tableName)
          .select()
          .filter('id', 'in', studentIds)
          .eq('role', 'student')
          .order('full_name');

      return (response as List)
          .map((json) => ProfileModel.fromJson(json as Map<String, dynamic>))
          .toList();
    });
  }

  /// Search students
  Future<List<ProfileModel>> searchStudents(String query) async {
    return getStudents(search: query, limit: 20);
  }

  /// Create a new student with auth account (Admin only)
  /// Uses security-definer RPC for privileged operations
  Future<String> createStudent({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    DateTime? dateOfBirth,
    String? address,
    String? phone,
  }) async {
    return handleAsyncErrors(() async {
      developer.log('[StudentsRepository] Creating student: $email');
      
      final response = await supabase.rpc('create_student_with_auth', params: {
        'p_email': email,
        'p_password': password,
        'p_first_name': firstName,
        'p_last_name': lastName,
        'p_date_of_birth': dateOfBirth?.toIso8601String().split('T')[0],
        'p_address': address,
        'p_phone': phone,
      });

      return response as String; // Returns profile ID
    });
  }

  /// Update student profile
  Future<void> updateStudent(String id, Map<String, dynamic> data) async {
    return handleAsyncErrors(() async {
      developer.log('[StudentsRepository] Updating student: $id');
      
      await supabase
          .from(tableName)
          .update(data)
          .eq('id', id);
    });
  }

  /// Delete student and auth account (Admin only)
  /// Uses security-definer RPC
  Future<void> deleteStudent(String profileId) async {
    return handleAsyncErrors(() async {
      developer.log('[StudentsRepository] Deleting student: $profileId');
      
      await supabase.rpc('delete_student_with_auth', params: {
        'p_profile_id': profileId,
      });
    });
  }
}
