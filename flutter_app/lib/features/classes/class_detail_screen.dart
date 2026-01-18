/// Class Detail Screen - View class info, students, and attendance
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../data/models/class_model.dart';
import '../../data/models/student_model.dart';
import '../../data/repositories/classes_repository.dart';
import '../../data/repositories/students_repository.dart';

/// Selected class provider
final selectedClassProvider = FutureProvider.family<ClassModel?, String>((ref, classId) async {
  final repo = ref.watch(Provider((ref) => ClassesRepository()));
  return repo.getClass(classId);
});

/// Class students provider
final classStudentsProvider = FutureProvider.family<List<StudentModel>, String>((ref, classId) async {
  final repo = ref.watch(Provider((ref) => StudentsRepository()));
  return repo.getStudentsInClass(classId);
});

class ClassDetailScreen extends ConsumerWidget {
  final String classId;

  const ClassDetailScreen({super.key, required this.classId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final classAsync = ref.watch(selectedClassProvider(classId));
    final studentsAsync = ref.watch(classStudentsProvider(classId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Class Details'),
        actions: [
          // QR Scanner
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: () {
              context.push('/qr-scanner?classId=$classId');
            },
          ),
          // More options
          PopupMenuButton<String>(
            onSelected: (value) {
              final className = classAsync.value?.name ?? 'Class';
              if (value == 'grades') {
                context.push('/grade-entry?classId=$classId&className=${Uri.encodeComponent(className)}');
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'grades', child: Text('Enter Grades')),
            ],
          ),
        ],
      ),
      body: classAsync.when(
        data: (classModel) => classModel == null
            ? const Center(child: Text('Class not found'))
            : _ClassDetailView(
                classModel: classModel,
                studentsAsync: studentsAsync,
              ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
      floatingActionButton: classAsync.when(
        data: (classModel) => FloatingActionButton.extended(
          onPressed: () {
            final className = classModel?.name ?? 'Class';
            context.push('/attendance-marking?classId=$classId&className=${Uri.encodeComponent(className)}');
          },
          icon: const Icon(Icons.how_to_reg),
          label: const Text('Mark Attendance'),
        ),
        loading: () => null,
        error: (_, __) => null,
      ),
    );
  }
}

class _ClassDetailView extends StatelessWidget {
  final ClassModel classModel;
  final AsyncValue<List<StudentModel>> studentsAsync;

  const _ClassDetailView({
    required this.classModel,
    required this.studentsAsync,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Class Header
          _ClassHeader(classModel: classModel),
          const SizedBox(height: 16),

          // Quick Actions
          Row(
            children: [
              Expanded(
                child: _QuickActionCard(
                  icon: Icons.how_to_reg,
                  label: 'Attendance',
                  color: AppColors.success,
                  onTap: () {
                    context.push('/attendance-marking?classId=${classModel.id}&className=${Uri.encodeComponent(classModel.name)}');
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _QuickActionCard(
                  icon: Icons.grade,
                  label: 'Enter Grades',
                  color: AppColors.primary,
                  onTap: () {
                    context.push('/grade-entry?classId=${classModel.id}&className=${Uri.encodeComponent(classModel.name)}');
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Class Info
          _InfoSection(classModel: classModel),
          const SizedBox(height: 24),

          // Students List
          Text(
            'Students (${studentsAsync.value?.length ?? 0})',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          studentsAsync.when(
            data: (students) => students.isEmpty
                ? const _EmptyState()
                : Column(
                    children: students.map((s) => _StudentTile(student: s)).toList(),
                  ),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Text('Error: $e'),
          ),
          const SizedBox(height: 80), // FAB spacing
        ],
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
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
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Icon(icon, size: 32, color: color),
              const SizedBox(height: 8),
              Text(label, style: TextStyle(fontWeight: FontWeight.w500, color: color)),
            ],
          ),
        ),
      ),
    );
  }
}

class _ClassHeader extends StatelessWidget {
  final ClassModel classModel;

  const _ClassHeader({required this.classModel});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.info, AppColors.info.withAlpha(180)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(50),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.class_, color: Colors.white, size: 32),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      classModel.name,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    if (classModel.subjectName != null)
                      Text(
                        classModel.subjectName!,
                        style: TextStyle(color: Colors.white.withAlpha(200)),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _HeaderChip(
                icon: Icons.people,
                label: '${classModel.enrolledCount ?? 0} students',
              ),
              const SizedBox(width: 12),
              if (classModel.roomName != null)
                _HeaderChip(
                  icon: Icons.room,
                  label: classModel.roomName!,
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeaderChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _HeaderChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(40),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.white),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _InfoSection extends StatelessWidget {
  final ClassModel classModel;

  const _InfoSection({required this.classModel});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _InfoRow(
              icon: Icons.person,
              label: 'Teacher',
              value: classModel.teacherName ?? 'Not assigned',
            ),
            _InfoRow(
              icon: Icons.book,
              label: 'Subject',
              value: classModel.subjectName ?? '-',
            ),
            _InfoRow(
              icon: Icons.schedule,
              label: 'Schedule',
              value: classModel.schedule ?? 'Not set',
            ),
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
          Text(label, style: TextStyle(color: AppColors.textSecondary)),
          const Spacer(),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _StudentTile extends StatelessWidget {
  final StudentModel student;

  const _StudentTile({required this.student});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppColors.student.withAlpha(30),
          child: Text(
            student.initial,
            style: const TextStyle(
              color: AppColors.student,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(student.fullName),
        subtitle: Text(student.studentCode ?? ''),
        trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
        onTap: () {
          context.push('/students/${student.id}');
        },
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      child: Center(
        child: Column(
          children: [
            Icon(Icons.people_outline, size: 48, color: AppColors.textMuted),
            const SizedBox(height: 12),
            Text(
              'No students enrolled',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}
