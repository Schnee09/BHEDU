/// Grades Screen - View grades with Vietnamese categories
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/theme.dart';
import '../../core/constants/app_constants.dart';
import '../../data/models/grade_model.dart';
import '../../data/repositories/grades_repository.dart';
import '../../shared/providers/auth_provider.dart';

/// Grades repository provider
final gradesRepositoryProvider = Provider<GradesRepository>((ref) {
  return GradesRepository();
});

/// Student grades provider
final studentGradesProvider = FutureProvider.family<Map<String, List<GradeModel>>, String>((ref, studentId) async {
  final repo = ref.watch(gradesRepositoryProvider);
  return repo.getGradesGroupedBySubject(studentId: studentId);
});

/// Average grade provider
final averageGradeProvider = FutureProvider.family<double, String>((ref, studentId) async {
  final repo = ref.watch(gradesRepositoryProvider);
  return repo.calculateAverage(studentId: studentId);
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
            onPressed: () {
              // TODO: Filter by semester/subject
            },
          ),
        ],
      ),
      body: isStudent
          ? _StudentGradesView(studentId: profile?.id ?? '')
          : const _TeacherGradesView(),
      floatingActionButton: isStudent
          ? null
          : FloatingActionButton.extended(
              onPressed: () {
                // TODO: Enter grade
              },
              icon: const Icon(Icons.add),
              label: const Text('Enter Grade'),
            ),
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
class _TeacherGradesView extends StatelessWidget {
  const _TeacherGradesView();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Grade Entry',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          const _EmptyState(message: 'Select a class to enter grades'),
        ],
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
