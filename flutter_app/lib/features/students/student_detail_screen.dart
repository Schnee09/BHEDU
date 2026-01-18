/// Student Detail Screen - View student profile and data
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/theme.dart';
import '../../core/constants/app_constants.dart';
import '../../data/models/student_model.dart';
import '../../data/models/attendance_model.dart';
import '../../data/models/grade_model.dart';
import '../../data/repositories/students_repository.dart';
import '../../data/repositories/attendance_repository.dart';
import '../../data/repositories/grades_repository.dart';

/// Selected student provider
final selectedStudentProvider = FutureProvider.family<StudentModel?, String>((ref, studentId) async {
  final repo = ref.watch(Provider((ref) => StudentsRepository()));
  return repo.getStudent(studentId);
});

class StudentDetailScreen extends ConsumerWidget {
  final String studentId;

  const StudentDetailScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final studentAsync = ref.watch(selectedStudentProvider(studentId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Student Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              // TODO: Edit student
            },
          ),
        ],
      ),
      body: studentAsync.when(
        data: (student) => student == null
            ? const Center(child: Text('Student not found'))
            : _StudentDetailView(student: student),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}

class _StudentDetailView extends StatelessWidget {
  final StudentModel student;

  const _StudentDetailView({required this.student});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Profile Header
          _ProfileHeader(student: student),
          const SizedBox(height: 24),

          // Info Cards
          _InfoCard(
            title: 'Personal Information',
            items: [
              _InfoRow(icon: Icons.badge, label: 'Student ID', value: student.studentCode ?? '-'),
              _InfoRow(icon: Icons.cake, label: 'Date of Birth', value: student.dateOfBirth ?? '-'),
              _InfoRow(icon: Icons.wc, label: 'Gender', value: student.gender ?? '-'),
              _InfoRow(icon: Icons.location_on, label: 'Address', value: student.address ?? '-'),
            ],
          ),
          const SizedBox(height: 16),

          _InfoCard(
            title: 'Contact',
            items: [
              _InfoRow(icon: Icons.phone, label: 'Phone', value: student.phone ?? '-'),
              _InfoRow(icon: Icons.email, label: 'Email', value: student.email ?? '-'),
              _InfoRow(icon: Icons.family_restroom, label: 'Parent', value: student.parentName ?? '-'),
              _InfoRow(icon: Icons.phone_android, label: 'Parent Phone', value: student.parentPhone ?? '-'),
            ],
          ),
          const SizedBox(height: 16),

          // Quick Stats
          _QuickStats(student: student),
          const SizedBox(height: 24),

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    // TODO: View grades
                  },
                  icon: const Icon(Icons.grade),
                  label: const Text('Grades'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    // TODO: View attendance
                  },
                  icon: const Icon(Icons.calendar_today),
                  label: const Text('Attendance'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  final StudentModel student;

  const _ProfileHeader({required this.student});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.student, Color(0xFF16A34A)],
            ),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              student.initial,
              style: const TextStyle(
                fontSize: 40,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          student.fullName,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: _getStatusColor(student.status).withAlpha(30),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            student.status.labelVi,
            style: TextStyle(
              color: _getStatusColor(student.status),
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(StudentStatus status) {
    switch (status) {
      case StudentStatus.active:
        return AppColors.success;
      case StudentStatus.inactive:
        return AppColors.warning;
      case StudentStatus.graduated:
        return AppColors.info;
      case StudentStatus.suspended:
        return AppColors.error;
    }
  }
}

class _InfoCard extends StatelessWidget {
  final String title;
  final List<_InfoRow> items;

  const _InfoCard({required this.title, required this.items});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 12),
            ...items,
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.textMuted),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                ),
                Text(
                  value,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickStats extends StatelessWidget {
  final StudentModel student;

  const _QuickStats({required this.student});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            label: 'Classes',
            value: '-',
            icon: Icons.class_,
            color: AppColors.info,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            label: 'Avg Grade',
            value: '-',
            icon: Icons.grade,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            label: 'Attendance',
            value: '-',
            icon: Icons.check_circle,
            color: AppColors.success,
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(50)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
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
    );
  }
}
