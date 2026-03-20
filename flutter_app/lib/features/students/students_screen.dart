/// Students Screen - List and manage students
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../core/constants/app_constants.dart';
import '../../data/models/profile_model.dart';
import '../../data/repositories/students_repository.dart';

/// Students repository provider
final studentsRepositoryProvider = Provider<StudentsRepository>((ref) {
  return StudentsRepository();
});

/// Students list provider
final studentsListProvider = FutureProvider<List<ProfileModel>>((ref) async {
  final repo = ref.watch(studentsRepositoryProvider);
  return repo.getStudents();
});

/// Search query provider
final searchQueryProvider = StateProvider<String>((ref) => '');

/// Filtered students provider
final filteredStudentsProvider = FutureProvider<List<ProfileModel>>((
  ref,
) async {
  final query = ref.watch(searchQueryProvider);
  final repo = ref.watch(studentsRepositoryProvider);

  if (query.isEmpty) {
    return repo.getStudents();
  }
  return repo.searchStudents(query);
});

class StudentsScreen extends ConsumerStatefulWidget {
  const StudentsScreen({super.key});

  @override
  ConsumerState<StudentsScreen> createState() => _StudentsScreenState();
}

class _StudentsScreenState extends ConsumerState<StudentsScreen> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _showAddStudentDialog() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => const _AddStudentDialog(),
    );

    if (result == true) {
      ref.invalidate(filteredStudentsProvider);
    }
  }

  @override
  Widget build(BuildContext context) {
    final studentsAsync = ref.watch(filteredStudentsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Học sinh'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {
              // TODO: Filter dialog
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Tìm kiếm học sinh...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          ref.read(searchQueryProvider.notifier).state = '';
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16),
              ),
              onChanged: (value) {
                ref.read(searchQueryProvider.notifier).state = value;
              },
            ),
          ),

          // Students list
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(filteredStudentsProvider);
                await ref.read(filteredStudentsProvider.future);
              },
              child: studentsAsync.when(
                data: (students) => students.isEmpty
                    ? const _EmptyState()
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: students.length,
                        itemBuilder: (context, index) {
                          return _StudentCard(student: students[index]);
                        },
                      ),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                      const SizedBox(height: 16),
                      Text('Lỗi: $e'),
                      TextButton(
                        onPressed: () => ref.invalidate(filteredStudentsProvider),
                        child: const Text('Thử lại'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddStudentDialog,
        icon: const Icon(Icons.person_add),
        label: const Text('Thêm học sinh'),
      ),
    );
  }
}

class _AddStudentDialog extends ConsumerStatefulWidget {
  const _AddStudentDialog();

  @override
  ConsumerState<_AddStudentDialog> createState() => _AddStudentDialogState();
}

class _AddStudentDialogState extends ConsumerState<_AddStudentDialog> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();
  DateTime? _dateOfBirth;
  bool _isSaving = false;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().subtract(const Duration(days: 365 * 18)),
      firstDate: DateTime(1960),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() => _dateOfBirth = picked);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    
    try {
      final repo = ref.read(studentsRepositoryProvider);
      await repo.createStudent(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        dateOfBirth: _dateOfBirth,
        phone: _phoneController.text.trim(),
      );

      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã tạo học sinh thành công'),
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
      title: const Text('Thêm học sinh mới'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _lastNameController,
                      decoration: const InputDecoration(labelText: 'Họ & Tên đệm'),
                      validator: (v) => v?.isEmpty == true ? 'Bắt buộc' : null,
                      textCapitalization: TextCapitalization.words,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextFormField(
                      controller: _firstNameController,
                      decoration: const InputDecoration(labelText: 'Tên'),
                      validator: (v) => v?.isEmpty == true ? 'Bắt buộc' : null,
                      textCapitalization: TextCapitalization.words,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  hintText: 'Để trống nếu muốn tự động tạo',
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passwordController,
                decoration: const InputDecoration(
                  labelText: 'Mật khẩu',
                  hintText: 'Để trống nếu muốn tự động tạo',
                ),
                obscureText: true,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(labelText: 'Số điện thoại'),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              InkWell(
                onTap: _selectDate,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Ngày sinh',
                    suffixIcon: Icon(Icons.calendar_today),
                  ),
                  child: Text(
                    _dateOfBirth == null
                        ? 'Chọn ngày sinh'
                        : _dateOfBirth!.toIso8601String().split('T')[0],
                  ),
                ),
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

class _StudentCard extends StatelessWidget {
  final ProfileModel student;

  const _StudentCard({required this.student});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: AppColors.surfaceVariant),
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppColors.primary.withAlpha(20),
          child: Text(
            student.initial,
            style: const TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(
          student.fullName,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Row(
          children: [
            if (student.studentCode != null) ...[
              Text(
                student.studentCode!,
                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
              const SizedBox(width: 8),
            ],
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: _getStatusColor(student.status).withAlpha(30),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                student.status.labelVi,
                style: TextStyle(
                  color: _getStatusColor(student.status),
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
        onTap: () {
          context.goNamed('student-detail', pathParameters: {'id': student.id});
        },
      ),
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
      case StudentStatus.transferred:
        return AppColors.textMuted;
    }
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
          Icon(Icons.people_outline, size: 64, color: AppColors.textMuted),
          const SizedBox(height: 16),
          Text(
            'Không tìm thấy học sinh nào',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}
