/// Grades Screen - View grades with Vietnamese categories
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/theme.dart';
import '../../core/constants/app_constants.dart';
import '../../data/models/grade_model.dart';
import '../../data/repositories/grades_repository.dart';
import '../../data/models/profile_model.dart';
import '../../shared/providers/auth_provider.dart';
import '../attendance/attendance_screen.dart';
import 'grade_entry_screen.dart';

/// Grades repository provider
final gradesRepositoryProvider = Provider<GradesRepository>((ref) {
  return GradesRepository();
});

/// Current semester filter
final semesterFilterProvider = StateProvider<String?>((ref) => 'Học kỳ 1');

/// Student grades provider
final studentGradesProvider = FutureProvider.family<Map<String, List<GradeModel>>, String>((ref, studentId) async {
  final repo = ref.watch(gradesRepositoryProvider);
  final semester = ref.watch(semesterFilterProvider);
  return repo.getGradesGroupedBySubject(studentId: studentId, semester: semester);
});

/// Average grade provider
final averageGradeProvider = FutureProvider.family<double, String>((ref, studentId) async {
  final repo = ref.watch(gradesRepositoryProvider);
  final semester = ref.watch(semesterFilterProvider);
  return repo.calculateAverage(studentId: studentId, semester: semester);
});

class GradesScreen extends ConsumerWidget {
  const GradesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final profile = authState.value;
    final isStudent = profile?.role == UserRole.student;

    return Scaffold(
      appBar: AppBar(
        title: Text(isStudent ? 'My Grades' : 'Grades'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () => _showFilterOptions(context, ref),
          ),
        ],
      ),
      body: isStudent
          ? _StudentGradesView(studentId: profile?.id ?? '')
          : _TeacherGradesView(profile: profile),
      floatingActionButton: isStudent
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _showClassSelection(context, ref, profile?.id ?? ''),
              icon: const Icon(Icons.add),
              label: const Text('Nhập điểm'),
            ),
    );
  }

  void _showFilterOptions(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.background,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Chọn học kỳ',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              children: ['Học kỳ 1', 'Học kỳ 2', 'Cả năm'].map((s) {
                final isSelected = ref.watch(semesterFilterProvider) == s;
                return ChoiceChip(
                  label: Text(s),
                  selected: isSelected,
                  onSelected: (selected) {
                    if (selected) {
                      ref.read(semesterFilterProvider.notifier).state = s;
                      Navigator.pop(context);
                    }
                  },
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  void _showClassSelection(BuildContext context, WidgetRef ref, String teacherId) {
    AttendanceScreen.showClassSelection(context, ref, teacherId, 
      onClassSelected: (cls) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => GradeEntryScreen(
              classId: cls.id,
              className: cls.name,
              subjectId: cls.subjectId,
            ),
          ),
        );
      }
    );
  }
}

/// Student grades view
class _StudentGradesView extends ConsumerWidget {
  final String studentId;

  const _StudentGradesView({required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gradesAsync = ref.watch(studentGradesProvider(studentId));
    final averageAsync = ref.watch(averageGradeProvider(studentId));

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(studentGradesProvider(studentId));
        ref.invalidate(averageGradeProvider(studentId));
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Overall average card
            averageAsync.when(
              data: (average) => _AverageCard(average: average),
              loading: () => const SizedBox(
                height: 100,
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) => Text('Error: $e'),
            ),
            const SizedBox(height: 24),

            // Grades by subject
            Text(
              'Grades by Subject',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            gradesAsync.when(
              data: (grouped) => grouped.isEmpty
                  ? const _EmptyState(message: 'No grades recorded yet')
                  : Column(
                      children: grouped.entries.map((entry) =>
                        _SubjectGradesCard(
                          subjectName: entry.key,
                          grades: entry.value,
                        )
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

/// Teacher grades view
class _TeacherGradesView extends ConsumerWidget {
  final ProfileModel? profile;

  const _TeacherGradesView({required this.profile});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Quản lý điểm số',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          _TeacherActionCard(
            title: 'Nhập điểm theo lớp',
            icon: Icons.add_chart,
            description: 'Chọn lớp để nhập điểm cho tất cả học sinh',
            onTap: () {
              AttendanceScreen.showClassSelection(context, ref, profile?.id ?? '', 
                onClassSelected: (cls) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => GradeEntryScreen(
                        classId: cls.id,
                        className: cls.name,
                        subjectId: cls.subjectId,
                      ),
                    ),
                  );
                }
              );
            },
          ),
        ],
      ),
    );
  }
}

class _TeacherActionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final String description;
  final VoidCallback onTap;

  const _TeacherActionCard({
    required this.title,
    required this.icon,
    required this.description,
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
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withAlpha(20),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: AppColors.primary),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text(description, style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}

class _AverageCard extends StatelessWidget {
  final double average;

  const _AverageCard({required this.average});

  @override
  Widget build(BuildContext context) {
    final gradeColor = _getGradeColor(average);
    final gradeLabel = _getGradeLabel(average);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [gradeColor, gradeColor.withAlpha(180)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  average.toStringAsFixed(1),
                  style: const TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const Text(
                  'Overall Average',
                  style: TextStyle(color: Colors.white70, fontSize: 16),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(50),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              gradeLabel,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getGradeColor(double score) {
    if (score >= 8.0) return AppColors.success;
    if (score >= 6.5) return AppColors.info;
    if (score >= 5.0) return AppColors.warning;
    return AppColors.error;
  }

  String _getGradeLabel(double score) {
    if (score >= 9.0) return 'Giỏi';
    if (score >= 7.0) return 'Khá';
    if (score >= 5.0) return 'TB';
    return 'Yếu';
  }
}

class _SubjectGradesCard extends StatelessWidget {
  final String subjectName;
  final List<GradeModel> grades;

  const _SubjectGradesCard({
    required this.subjectName,
    required this.grades,
  });

  @override
  Widget build(BuildContext context) {
    // Calculate subject average
    double totalWeighted = 0;
    int totalWeight = 0;
    for (final grade in grades) {
      totalWeighted += grade.score * grade.category.weight;
      totalWeight += grade.category.weight;
    }
    final average = totalWeight > 0 ? totalWeighted / totalWeight : 0.0;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ExpansionTile(
        title: Text(
          subjectName,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          'Average: ${average.toStringAsFixed(1)} • ${grades.length} grades',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: _getGradeColor(average).withAlpha(30),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            average.toStringAsFixed(1),
            style: TextStyle(
              color: _getGradeColor(average),
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        children: [
          // Grade categories
          ...GradeCategory.values.map((category) {
            final categoryGrades = grades.where((g) => g.category == category).toList();
            if (categoryGrades.isEmpty) return const SizedBox.shrink();
            
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      category.labelVi,
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  ),
                  Text(
                    '×${category.weight}',
                    style: TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(width: 16),
                  ...categoryGrades.map((g) => Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getGradeColor(g.score).withAlpha(30),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        g.score.toStringAsFixed(1),
                        style: TextStyle(
                          color: _getGradeColor(g.score),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  )),
                ],
              ),
            );
          }),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Color _getGradeColor(double score) {
    if (score >= 8.0) return AppColors.success;
    if (score >= 6.5) return AppColors.info;
    if (score >= 5.0) return AppColors.warning;
    return AppColors.error;
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
            Icon(Icons.grade, size: 64, color: AppColors.textMuted),
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
