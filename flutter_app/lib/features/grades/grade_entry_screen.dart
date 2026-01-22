/// Grade Entry Screen - Teachers enter grades for students
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/theme.dart';
import '../../core/constants/app_constants.dart';
import '../../data/models/profile_model.dart';
import '../../data/repositories/students_repository.dart';
import '../../data/repositories/grades_repository.dart';

class GradeEntryScreen extends ConsumerStatefulWidget {
  final String classId;
  final String className;
  final String? subjectId;

  const GradeEntryScreen({
    super.key,
    required this.classId,
    required this.className,
    this.subjectId,
  });

  @override
  ConsumerState<GradeEntryScreen> createState() => _GradeEntryScreenState();
}

class _GradeEntryScreenState extends ConsumerState<GradeEntryScreen> {
  List<ProfileModel> _students = [];
  bool _isLoading = true;
  GradeCategory _selectedCategory = GradeCategory.oral;
  final Map<String, TextEditingController> _scoreControllers = {};

  @override
  void initState() {
    super.initState();
    _loadStudents();
  }

  @override
  void dispose() {
    for (final controller in _scoreControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _loadStudents() async {
    final repo = StudentsRepository();
    final students = await repo.getStudentsInClass(widget.classId);
    setState(() {
      _students = students;
      _isLoading = false;
      for (final student in students) {
        _scoreControllers[student.id] = TextEditingController();
      }
    });
  }

  Future<void> _saveGrades() async {
    final repo = GradesRepository();
    int savedCount = 0;
    int errorCount = 0;

    for (final student in _students) {
      final controller = _scoreControllers[student.id];
      if (controller == null || controller.text.isEmpty) continue;

      final score = double.tryParse(controller.text);
      if (score == null || score < 0 || score > 10) {
        errorCount++;
        continue;
      }

      try {
        await repo.enterGrade(
          studentId: student.id,
          classId: widget.classId,
          subjectId: widget.subjectId ?? '',
          category: _selectedCategory.value,
          score: score,
        );
        savedCount++;
      } catch (e) {
        errorCount++;
      }
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Saved $savedCount grades${errorCount > 0 ? ', $errorCount errors' : ''}'),
          backgroundColor: errorCount > 0 ? AppColors.warning : AppColors.success,
        ),
      );
      if (errorCount == 0) {
        Navigator.pop(context);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.className),
      ),
      body: Column(
        children: [
          // Category selector
          Container(
            padding: const EdgeInsets.all(16),
            color: AppColors.surface,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Grade Category',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: GradeCategory.values.map((category) {
                      final isSelected = category == _selectedCategory;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text('${category.labelVi} (×${category.weight})'),
                          selected: isSelected,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() => _selectedCategory = category);
                            }
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          // Students list
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _students.isEmpty
                    ? const Center(child: Text('No students in this class'))
                    : ListView.builder(
                        padding: const EdgeInsets.all(8),
                        itemCount: _students.length,
                        itemBuilder: (context, index) {
                          final student = _students[index];
                          return _StudentGradeCard(
                            student: student,
                            controller: _scoreControllers[student.id]!,
                          );
                        },
                      ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.surfaceVariant)),
        ),
        child: SafeArea(
          child: ElevatedButton.icon(
            onPressed: _saveGrades,
            icon: const Icon(Icons.save),
            label: const Text('Save Grades'),
            style: ElevatedButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
            ),
          ),
        ),
      ),
    );
  }
}

class _StudentGradeCard extends StatelessWidget {
  final ProfileModel student;
  final TextEditingController controller;

  const _StudentGradeCard({
    required this.student,
    required this.controller,
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
                student.initial,
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
                    student.fullName,
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                  if (student.studentCode != null)
                    Text(
                      student.studentCode!,
                      style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                ],
              ),
            ),
            // Score input
            SizedBox(
              width: 80,
              child: TextField(
                controller: controller,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                textAlign: TextAlign.center,
                decoration: InputDecoration(
                  hintText: '0-10',
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
