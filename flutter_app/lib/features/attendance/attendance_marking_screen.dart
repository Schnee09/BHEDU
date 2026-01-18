/// Attendance Marking Screen - Teachers mark attendance for a class
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/theme.dart';
import '../../core/constants/app_constants.dart';
import '../../data/models/student_model.dart';
import '../../data/repositories/students_repository.dart';
import '../../data/repositories/attendance_repository.dart';

/// Attendance state for each student
class AttendanceEntry {
  final StudentModel student;
  AttendanceStatus status;

  AttendanceEntry({required this.student, this.status = AttendanceStatus.present});
}

/// Class attendance state provider
final classAttendanceProvider = StateNotifierProvider.family<ClassAttendanceNotifier, List<AttendanceEntry>, String>(
  (ref, classId) => ClassAttendanceNotifier(classId),
);

class ClassAttendanceNotifier extends StateNotifier<List<AttendanceEntry>> {
  final String classId;

  ClassAttendanceNotifier(this.classId) : super([]);

  Future<void> loadStudents() async {
    final repo = StudentsRepository();
    final students = await repo.getStudentsInClass(classId);
    state = students.map((s) => AttendanceEntry(student: s)).toList();
  }

  void updateStatus(String studentId, AttendanceStatus status) {
    state = [
      for (final entry in state)
        if (entry.student.id == studentId)
          AttendanceEntry(student: entry.student, status: status)
        else
          entry,
    ];
  }

  void markAllPresent() {
    state = state.map((e) => AttendanceEntry(student: e.student, status: AttendanceStatus.present)).toList();
  }

  void markAllAbsent() {
    state = state.map((e) => AttendanceEntry(student: e.student, status: AttendanceStatus.absent)).toList();
  }
}

class AttendanceMarkingScreen extends ConsumerStatefulWidget {
  final String classId;
  final String className;

  const AttendanceMarkingScreen({
    super.key,
    required this.classId,
    required this.className,
  });

  @override
  ConsumerState<AttendanceMarkingScreen> createState() => _AttendanceMarkingScreenState();
}

class _AttendanceMarkingScreenState extends ConsumerState<AttendanceMarkingScreen> {
  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadStudents();
  }

  Future<void> _loadStudents() async {
    await ref.read(classAttendanceProvider(widget.classId).notifier).loadStudents();
    setState(() => _isLoading = false);
  }

  Future<void> _saveAttendance() async {
    setState(() => _isSaving = true);
    
    try {
      final entries = ref.read(classAttendanceProvider(widget.classId));
      final repo = AttendanceRepository();
      final today = DateTime.now().toIso8601String().split('T')[0];

      for (final entry in entries) {
        await repo.markAttendance(
          studentId: entry.student.id,
          classId: widget.classId,
          date: today,
          status: entry.status.value,
        );
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Attendance saved successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final entries = ref.watch(classAttendanceProvider(widget.classId));

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.className),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              final notifier = ref.read(classAttendanceProvider(widget.classId).notifier);
              if (value == 'all_present') {
                notifier.markAllPresent();
              } else if (value == 'all_absent') {
                notifier.markAllAbsent();
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'all_present', child: Text('Mark All Present')),
              const PopupMenuItem(value: 'all_absent', child: Text('Mark All Absent')),
            ],
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : entries.isEmpty
              ? const Center(child: Text('No students in this class'))
              : ListView.builder(
                  padding: const EdgeInsets.all(8),
                  itemCount: entries.length,
                  itemBuilder: (context, index) {
                    final entry = entries[index];
                    return _StudentAttendanceCard(
                      entry: entry,
                      onStatusChanged: (status) {
                        ref.read(classAttendanceProvider(widget.classId).notifier)
                            .updateStatus(entry.student.id, status);
                      },
                    );
                  },
                ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.surfaceVariant)),
        ),
        child: SafeArea(
          child: Row(
            children: [
              // Stats
              Expanded(
                child: _AttendanceStats(entries: entries),
              ),
              const SizedBox(width: 16),
              // Save button
              ElevatedButton.icon(
                onPressed: _isSaving ? null : _saveAttendance,
                icon: _isSaving 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.save),
                label: const Text('Save'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StudentAttendanceCard extends StatelessWidget {
  final AttendanceEntry entry;
  final ValueChanged<AttendanceStatus> onStatusChanged;

  const _StudentAttendanceCard({
    required this.entry,
    required this.onStatusChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Avatar
            CircleAvatar(
              backgroundColor: AppColors.student.withAlpha(30),
              child: Text(
                entry.student.initial,
                style: const TextStyle(
                  color: AppColors.student,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Name
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entry.student.fullName,
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                  if (entry.student.studentCode != null)
                    Text(
                      entry.student.studentCode!,
                      style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                ],
              ),
            ),
            // Status buttons
            _StatusToggle(
              currentStatus: entry.status,
              onChanged: onStatusChanged,
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusToggle extends StatelessWidget {
  final AttendanceStatus currentStatus;
  final ValueChanged<AttendanceStatus> onChanged;

  const _StatusToggle({
    required this.currentStatus,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SegmentedButton<AttendanceStatus>(
      segments: [
        ButtonSegment(
          value: AttendanceStatus.present,
          icon: Icon(Icons.check, color: _getColor(AttendanceStatus.present)),
        ),
        ButtonSegment(
          value: AttendanceStatus.absent,
          icon: Icon(Icons.close, color: _getColor(AttendanceStatus.absent)),
        ),
        ButtonSegment(
          value: AttendanceStatus.late,
          icon: Icon(Icons.schedule, color: _getColor(AttendanceStatus.late)),
        ),
      ],
      selected: {currentStatus},
      onSelectionChanged: (selected) => onChanged(selected.first),
      showSelectedIcon: false,
      style: ButtonStyle(
        visualDensity: VisualDensity.compact,
      ),
    );
  }

  Color _getColor(AttendanceStatus status) {
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
}

class _AttendanceStats extends StatelessWidget {
  final List<AttendanceEntry> entries;

  const _AttendanceStats({required this.entries});

  @override
  Widget build(BuildContext context) {
    final present = entries.where((e) => e.status == AttendanceStatus.present).length;
    final absent = entries.where((e) => e.status == AttendanceStatus.absent).length;
    final late = entries.where((e) => e.status == AttendanceStatus.late).length;

    return Row(
      children: [
        _StatBadge(label: 'P', count: present, color: AppColors.present),
        const SizedBox(width: 8),
        _StatBadge(label: 'A', count: absent, color: AppColors.absent),
        const SizedBox(width: 8),
        _StatBadge(label: 'L', count: late, color: AppColors.late),
      ],
    );
  }
}

class _StatBadge extends StatelessWidget {
  final String label;
  final int count;
  final Color color;

  const _StatBadge({required this.label, required this.count, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(30),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        '$label: $count',
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }
}
