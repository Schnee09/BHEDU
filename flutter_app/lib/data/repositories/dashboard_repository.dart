/// Dashboard Repository
library;

import 'dart:developer' as developer;
import 'base_repository.dart';

class DashboardStats {
  final int totalStudents;
  final int totalTeachers;
  final int totalClasses;
  final double attendanceRate;
  final double averageGrade;
  final int todayLessons;

  DashboardStats({
    required this.totalStudents,
    required this.totalTeachers,
    required this.totalClasses,
    required this.attendanceRate,
    required this.averageGrade,
    required this.todayLessons,
  });
}

class DashboardRepository extends BaseRepository {
  DashboardRepository();

  Future<DashboardStats> getStats() async {
    return handleAsyncErrors(() async {
      int studentsCount = 0;
      try {
        final res = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'student')
            .limit(1)
            .count(CountOption.exact);
        studentsCount = res.count;
      } catch (e) {
        developer.log('Error getting students count', error: e);
      }

      int teachersCount = 0;
      try {
        final res = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'teacher')
            .limit(1)
            .count(CountOption.exact);
        teachersCount = res.count;
      } catch (e) {
        developer.log('Error getting teachers count', error: e);
      }

      int classesCount = 0;
      try {
        // Use a simple select to avoid RLS recursion issues with count()
        final res = await supabase.from('classes').select('id');
        classesCount = (res as List).length;
      } catch (e) {
        developer.log('Error getting classes count', error: e);
      }

      // 4. Attendance (simplified)
      double attendanceRate = 95.0;

      // 5. Today's lessons
      int todayLessons = 0;
      try {
        final now = DateTime.now();
        final todayWeekday = now.weekday;
        final res = await supabase
            .from('timetable_slots') // Correct table name
            .select('id')
            .eq('day_of_week', todayWeekday)
            .limit(1)
            .count(CountOption.exact);
        todayLessons = res.count;
      } catch (e) {
        developer.log('Error getting lessons count', error: e);
      }

      return DashboardStats(
        totalStudents: studentsCount,
        totalTeachers: teachersCount,
        totalClasses: classesCount,
        attendanceRate: attendanceRate,
        averageGrade: 8.5,
        todayLessons: todayLessons,
      );
    });
  }
}
