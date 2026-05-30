/// Classes Screen - List and manage classes
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/theme.dart';
import '../../core/constants/app_constants.dart';
import '../../data/models/class_model.dart';
import '../../data/repositories/classes_repository.dart';
import '../../shared/providers/auth_provider.dart';
import 'class_detail_screen.dart';

/// Classes repository provider
final classesRepositoryProvider = Provider<ClassesRepository>((ref) {
  return ClassesRepository();
});

/// Classes list provider (for admin/staff)
final classesListProvider = FutureProvider<List<ClassModel>>((ref) async {
  final repo = ref.watch(classesRepositoryProvider);
  return repo.getClasses();
});

/// Teacher's classes provider
final teacherClassesProvider = FutureProvider.family<List<ClassModel>, String>((ref, teacherId) async {
  final repo = ref.watch(classesRepositoryProvider);
  return repo.getTeacherClasses(teacherId);
});

class ClassesScreen extends ConsumerWidget {
  const ClassesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final profile = authState.value;
    final isTeacher = profile?.role == UserRole.teacher;

    // For teachers, show only their classes
    final classesAsync = isTeacher && profile?.id != null
        ? ref.watch(teacherClassesProvider(profile!.id))
        : ref.watch(classesListProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(isTeacher ? 'My Classes' : 'Classes'),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          if (isTeacher && profile?.id != null) {
            ref.invalidate(teacherClassesProvider(profile!.id));
          } else {
            ref.invalidate(classesListProvider);
          }
        },
        child: classesAsync.when(
          data: (classes) => classes.isEmpty
              ? const _EmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: classes.length,
                  itemBuilder: (context, index) {
                    return _ClassCard(classModel: classes[index]);
                  },
                ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Error: $e')),
        ),
      ),
      floatingActionButton: isTeacher
          ? null
          : FloatingActionButton.extended(
              onPressed: () async {
                final result = await showDialog<bool>(
                  context: context,
                  builder: (context) => const _AddClassDialog(),
                );
                if (result == true) {
                  ref.invalidate(classesListProvider);
                }
              },
              icon: const Icon(Icons.add),
              label: const Text('Add Class'),
            ),
    );
  }
}

class _ClassCard extends StatelessWidget {
  final ClassModel classModel;

  const _ClassCard({required this.classModel});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ClassDetailScreen(classId: classModel.id),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.info.withAlpha(30),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.class_, color: AppColors.info),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          classModel.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        if (classModel.subjectName != null)
                          Text(
                            classModel.subjectName!,
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 13,
                            ),
                          ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right, color: AppColors.textMuted),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 12),
              Row(
                children: [
                  _InfoChip(
                    icon: Icons.person,
                    label: classModel.teacherName ?? 'No teacher',
                  ),
                  const SizedBox(width: 16),
                  _InfoChip(
                    icon: Icons.room,
                    label: classModel.roomName ?? 'No room',
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.success.withAlpha(30),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.people, size: 14, color: AppColors.success),
                        const SizedBox(width: 4),
                        Text(
                          '${classModel.enrolledCount ?? 0}',
                          style: const TextStyle(
                            color: AppColors.success,
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.textMuted),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            color: AppColors.textSecondary,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.class_outlined, size: 64, color: AppColors.textMuted),
          const SizedBox(height: 16),
          Text(
            'No classes found',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _AddClassDialog extends ConsumerStatefulWidget {
  const _AddClassDialog();

  @override
  ConsumerState<_AddClassDialog> createState() => _AddClassDialogState();
}

class _AddClassDialogState extends ConsumerState<_AddClassDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _capacityController = TextEditingController();
  bool _isSaving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _capacityController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    
    try {
      final repo = ref.read(classesRepositoryProvider);
      await repo.createClass(
        name: _nameController.text.trim(),
        capacity: int.tryParse(_capacityController.text.trim()),
      );

      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã tạo lớp học thành công'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Thêm lớp học mới'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Tên lớp học'),
                validator: (v) => v?.isEmpty == true ? 'Bắt buộc' : null,
                textCapitalization: TextCapitalization.words,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _capacityController,
                decoration: const InputDecoration(labelText: 'Sĩ số tối đa'),
                keyboardType: TextInputType.number,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isSaving ? null : () => Navigator.pop(context),
          child: const Text('Hủy'),
        ),
        ElevatedButton(
          onPressed: _isSaving ? null : _submit,
          child: _isSaving
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Tạo mới'),
        ),
      ],
    );
  }
}
