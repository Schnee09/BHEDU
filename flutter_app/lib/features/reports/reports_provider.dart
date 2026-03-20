/// Reports Provider - fetches analytics data for charts
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../attendance/attendance_screen.dart';
import '../grades/grades_screen.dart';

/// Attendance summary provider for a student
final studentAttendanceSummaryProvider = FutureProvider.family<Map<String, int>, String>((ref, studentId) async {
  final repo = ref.watch(attendanceRepositoryProvider);
  return repo.getAttendanceSummary(studentId: studentId);
});

/// Weekly attendance trend provider (mocked with some logic for now)
final studentWeeklyTrendProvider = FutureProvider.family<List<int>, String>((ref, studentId) async {
  // We keep the repo watch but don't fetch records yet as it's mocked
  ref.watch(attendanceRepositoryProvider);
  
  // Logical grouping by day of week for current week
  // For now, return a placeholder list of 5 counts (Mon-Fri)
  return [5, 4, 5, 5, 3]; 
});

/// Grade distribution provider
final studentGradeDistributionProvider = FutureProvider.family<List<double>, String>((ref, studentId) async {
  final repo = ref.watch(gradesRepositoryProvider);
  final grades = await repo.getStudentGrades(studentId: studentId);
  
  if (grades.isEmpty) return [];
  
  // For chart trend (last 5 grades)
  return grades.take(5).map((g) => g.score).toList().reversed.toList();
});
