/// Attendance Screen - View attendance history
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/theme.dart';
import '../../core/constants/app_constants.dart';
import '../../data/models/attendance_model.dart';
import '../../data/models/class_model.dart';
import '../../data/models/profile_model.dart';
import '../../data/repositories/attendance_repository.dart';
import '../../data/repositories/classes_repository.dart';
import '../../shared/providers/auth_provider.dart';
import 'attendance_marking_screen.dart';
import 'qr_scanner_screen.dart'; // QR integration is now complete

/// Attendance repository provider
final attendanceRepositoryProvider = Provider<AttendanceRepository>((ref) {
  return AttendanceRepository();
});

/// Selected date range provider
final attendanceDateRangeProvider = StateProvider<DateTimeRange?>((ref) => null);

/// Attendance list provider - now with optional date range
final attendanceListProvider = FutureProvider.family<List<AttendanceModel>, String>((ref, studentId) async {
  final repo = ref.watch(attendanceRepositoryProvider);
  final dateRange = ref.watch(attendanceDateRangeProvider);
  
  // NOTE: Repository needs updating to handle date range, or we filter client-side for now
  // For now, client-side filtering since repo getStudentAttendance is simple
  final records = await repo.getStudentAttendance(studentId: studentId);
  
  if (dateRange == null) return records;
  
  return records.where((r) {
    try {
      final recordDate = DateTime.parse(r.date);
      // Normalized dates to avoid time comparison issues
      final start = DateTime(dateRange.start.year, dateRange.start.month, dateRange.start.day);
      final end = DateTime(dateRange.end.year, dateRange.end.month, dateRange.end.day).add(const Duration(days: 1));
      return recordDate.isAfter(start.subtract(const Duration(seconds: 1))) && 
             recordDate.isBefore(end);
    } catch (_) {
      return true;
    }
  }).toList();
});

/// Attendance summary provider
final attendanceSummaryProvider = FutureProvider.family<Map<String, int>, String>((ref, studentId) async {
  final repo = ref.watch(attendanceRepositoryProvider);
  // Summary is usually for all time or a specific period
  return repo.getAttendanceSummary(studentId: studentId);
});

/// Classes provider for teacher
final teacherClassesProvider = FutureProvider.family<List<ClassModel>, String>((ref, teacherId) async {
  final repo = ClassesRepository();
  return repo.getTeacherClasses(teacherId);
});

class AttendanceScreen extends ConsumerWidget {
  const AttendanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final profile = authState.value;
    final isStudent = profile?.role == UserRole.student;

    return Scaffold(
      appBar: AppBar(
        title: Text(isStudent ? 'My Attendance' : 'Attendance'),
        actions: [
          IconButton(
            icon: Icon(
              ref.watch(attendanceDateRangeProvider) != null 
                  ? Icons.filter_alt_off 
                  : Icons.calendar_month,
            ),
            onPressed: () async {
              if (ref.read(attendanceDateRangeProvider) != null) {
                ref.read(attendanceDateRangeProvider.notifier).state = null;
                return;
              }
              
              final picked = await showDateRangePicker(
                context: context,
                firstDate: DateTime.now().subtract(const Duration(days: 365)),
                lastDate: DateTime.now(),
                builder: (context, child) {
                  return Theme(
                    data: Theme.of(context).copyWith(
                      colorScheme: ColorScheme.fromSeed(
                        seedColor: AppColors.primary,
                        primary: AppColors.primary,
                      ),
                    ),
                    child: child!,
                  );
                },
              );
              
              if (picked != null) {
                ref.read(attendanceDateRangeProvider.notifier).state = picked;
              }
            },
          ),
        ],
      ),
      body: isStudent
          ? _StudentAttendanceView(studentId: profile?.id ?? '')
          : _TeacherAttendanceView(profile: profile, ref: ref),
    );
  }

  static void showClassSelection(BuildContext context, WidgetRef ref, String teacherId, {required void Function(ClassModel) onClassSelected}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Consumer(
        builder: (context, ref, _) {
          final classesAsync = ref.watch(teacherClassesProvider(teacherId));

          return Container(
            height: MediaQuery.of(context).size.height * 0.7,
            decoration: const BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.borderDefault,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Chọn lớp học',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                Expanded(
                  child: classesAsync.when(
                    data: (classes) => classes.isEmpty
                        ? const Center(child: Text('Bạn không có lớp nào'))
                        : ListView.builder(
                            itemCount: classes.length,
                            itemBuilder: (context, index) {
                              final cls = classes[index];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                child: ListTile(
                                  title: Text(cls.name),
                                  subtitle: Text(cls.subjectName ?? 'Môn học'),
                                  trailing: const Icon(Icons.chevron_right),
                                  onTap: () {
                                    Navigator.pop(context);
                                    onClassSelected(cls);
                                  },
                                ),
                              );
                            },
                          ),
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (e, _) => Center(child: Text('Error: $e')),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// Student's attendance view
class _StudentAttendanceView extends ConsumerWidget {
  final String studentId;

  const _StudentAttendanceView({required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(attendanceSummaryProvider(studentId));
    final attendanceAsync = ref.watch(attendanceListProvider(studentId));

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(attendanceSummaryProvider(studentId));
        ref.invalidate(attendanceListProvider(studentId));
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Summary Cards
            summaryAsync.when(
              data: (summary) => _AttendanceSummaryCards(summary: summary),
              loading: () => const SizedBox(
                height: 100,
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) => Text('Error: $e'),
            ),
            const SizedBox(height: 24),

            // Recent Attendance
            Text(
              'Recent Attendance',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            attendanceAsync.when(
              data: (records) => records.isEmpty
                  ? const _EmptyState(message: 'No attendance records found')
                  : Column(
                      children: records.take(20).map((record) => 
                        _AttendanceRecordCard(record: record)
                      ).toList(),
                    ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Text('Error: $e'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Teacher's attendance view - Mark attendance
class _TeacherAttendanceView extends StatelessWidget {
  final ProfileModel? profile;
  final WidgetRef ref;

  const _TeacherAttendanceView({required this.profile, required this.ref});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Quick actions
          Text(
            'Mark Attendance',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _QuickActionButton(
                  icon: Icons.qr_code_scanner,
                  label: 'QR Scan',
                  color: AppColors.primary,
                  onTap: () {
                    AttendanceScreen.showClassSelection(context, ref, profile?.id ?? '', 
                      onClassSelected: (cls) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => QRScannerScreen(
                              classId: cls.id,
                            ),
                          ),
                        );
                      }
                    );
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _QuickActionButton(
                  icon: Icons.list_alt,
                  label: 'Manual Entry',
                  color: AppColors.info,
                  onTap: () {
                    AttendanceScreen.showClassSelection(context, ref, profile?.id ?? '', 
                      onClassSelected: (cls) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => AttendanceMarkingScreen(
                              classId: cls.id,
                              className: cls.name,
                            ),
                          ),
                        );
                      }
                    );
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          
          // Today's classes placeholder
          Text(
            "Today's Classes",
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          const _EmptyState(message: 'Select a class to mark attendance'),
        ],
      ),
    );
  }
}

class _AttendanceSummaryCards extends StatelessWidget {
  final Map<String, int> summary;

  const _AttendanceSummaryCards({required this.summary});

  @override
  Widget build(BuildContext context) {
    final total = summary.values.fold(0, (a, b) => a + b);
    final presentPercent = total > 0 
        ? ((summary['present'] ?? 0) / total * 100).toStringAsFixed(1)
        : '0';

    return Column(
      children: [
        // Main percentage card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [AppColors.success, AppColors.success.withAlpha(180)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              Text(
                '$presentPercent%',
                style: const TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const Text(
                'Attendance Rate',
                style: TextStyle(color: Colors.white70, fontSize: 16),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        // Status breakdown
        Row(
          children: [
            _StatusChip(
              label: 'Present',
              count: summary['present'] ?? 0,
              color: AppColors.present,
            ),
            _StatusChip(
              label: 'Absent',
              count: summary['absent'] ?? 0,
              color: AppColors.absent,
            ),
            _StatusChip(
              label: 'Late',
              count: summary['late'] ?? 0,
              color: AppColors.late,
            ),
            _StatusChip(
              label: 'Excused',
              count: summary['excused'] ?? 0,
              color: AppColors.excused,
            ),
          ],
        ),
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final int count;
  final Color color;

  const _StatusChip({
    required this.label,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withAlpha(30),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withAlpha(100)),
        ),
        child: Column(
          children: [
            Text(
              '$count',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AttendanceRecordCard extends StatelessWidget {
  final AttendanceModel record;

  const _AttendanceRecordCard({required this.record});

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(record.status);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: statusColor.withAlpha(30),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            _getStatusIcon(record.status),
            color: statusColor,
          ),
        ),
        title: Text(record.className ?? record.date),
        subtitle: Text(record.date),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: statusColor.withAlpha(30),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            record.status.labelVi,
            style: TextStyle(
              color: statusColor,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(AttendanceStatus status) {
    switch (status) {
      case AttendanceStatus.present:
        return AppColors.present;
      case AttendanceStatus.absent:
        return AppColors.absent;
      case AttendanceStatus.late:
        return AppColors.late;
      case AttendanceStatus.excused:
        return AppColors.excused;
    }
  }

  IconData _getStatusIcon(AttendanceStatus status) {
    switch (status) {
      case AttendanceStatus.present:
        return Icons.check_circle;
      case AttendanceStatus.absent:
        return Icons.cancel;
      case AttendanceStatus.late:
        return Icons.schedule;
      case AttendanceStatus.excused:
        return Icons.info;
    }
  }
}

class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Icon(icon, size: 40, color: color),
              const SizedBox(height: 8),
              Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String message;

  const _EmptyState({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox, size: 64, color: AppColors.textMuted),
            const SizedBox(height: 16),
            Text(
              message,
              style: TextStyle(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
