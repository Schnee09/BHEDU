/// Students Screen - List and manage students
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/theme.dart';
import '../../core/constants/app_constants.dart';
import '../../data/models/student_model.dart';
import '../../data/repositories/students_repository.dart';

/// Students repository provider
final studentsRepositoryProvider = Provider<StudentsRepository>((ref) {
  return StudentsRepository();
});

/// Students list provider
final studentsListProvider = FutureProvider<List<StudentModel>>((ref) async {
  final repo = ref.watch(studentsRepositoryProvider);
  return repo.getStudents();
});

/// Search query provider
final searchQueryProvider = StateProvider<String>((ref) => '');

/// Filtered students provider
final filteredStudentsProvider = FutureProvider<List<StudentModel>>((ref) async {
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

  @override
  Widget build(BuildContext context) {
    final studentsAsync = ref.watch(filteredStudentsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Students'),
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
                hintText: 'Search students...',
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
                error: (e, _) => Center(child: Text('Error: $e')),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // TODO: Add student
        },
        icon: const Icon(Icons.person_add),
        label: const Text('Add Student'),
      ),
    );
  }
}

class _StudentCard extends StatelessWidget {
  final StudentModel student;

  const _StudentCard({required this.student});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppColors.primary.withAlpha(30),
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
          style: const TextStyle(fontWeight: FontWeight.w500),
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
          // TODO: Navigate to student detail
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
            'No students found',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}
