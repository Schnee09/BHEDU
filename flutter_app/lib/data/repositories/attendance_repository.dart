/// Attendance Repository - handles Supabase attendance operations
library;

import '../../config/supabase_config.dart';
import '../models/attendance_model.dart';

class AttendanceRepository {
  AttendanceRepository();

  /// Get attendance records for a student
  Future<List<AttendanceModel>> getStudentAttendance({
    required String studentId,
  }) async {
    final response = await supabase
        .from('attendance')
        .select('*, students(full_name), classes(name)')
        .eq('student_id', studentId)
        .order('date', ascending: false)
        .limit(100);

    return (response as List).map((json) => AttendanceModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  /// Get attendance records for a class on a specific date
  Future<List<AttendanceModel>> getClassAttendance({
    required String classId,
    required String date,
  }) async {
    final response = await supabase
        .from('attendance')
        .select('*, students(full_name)')
        .eq('class_id', classId)
        .eq('date', date)
        .order('created_at');

    return (response as List).map((json) => AttendanceModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  /// Mark attendance for a student
  Future<AttendanceModel> markAttendance({
    required String studentId,
    required String classId,
    required String date,
    required String status,
    String? notes,
    String? markedBy,
    bool isQrCheckIn = false,
  }) async {
    final response = await supabase
        .from('attendance')
        .upsert({
          'student_id': studentId,
          'class_id': classId,
          'date': date,
          'status': status,
          'notes': notes,
          'marked_by': markedBy,
          'is_qr_check_in': isQrCheckIn,
          'check_in_time': DateTime.now().toIso8601String(),
        }, onConflict: 'student_id,class_id,date')
        .select('*, students(full_name), classes(name)')
        .single();

    return AttendanceModel.fromJson(response);
  }

  /// Get attendance summary for a student
  Future<Map<String, int>> getAttendanceSummary({
    required String studentId,
  }) async {
    final response = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', studentId);
    
    final summary = <String, int>{
      'present': 0,
      'absent': 0,
      'late': 0,
      'excused': 0,
    };

    for (final record in response) {
      final status = record['status'] as String?;
      if (status != null && summary.containsKey(status)) {
        summary[status] = (summary[status] ?? 0) + 1;
      }
    }

    return summary;
  }
}
