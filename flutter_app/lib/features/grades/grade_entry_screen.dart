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
  final TextEditingController _bulkController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    for (final controller in _scoreControllers.values) {
      controller.dispose();
    }
    _bulkController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    // 1. Load students
    final studentsRepo = StudentsRepository();
    final students = await studentsRepo.getStudentsInClass(widget.classId);
    
    // 2. Load existing grades for this category
    final gradesRepo = GradesRepository();
    final existingGrades = await gradesRepo.getClassGradesByCategory(
      classId: widget.classId,
      category: _selectedCategory.value,
      subjectId: widget.subjectId,
    );

    setState(() {
      _students = students;
      for (final student in students) {
        final existing = existingGrades.where((g) => g.studentId == student.id).firstOrNull;
        _scoreControllers[student.id] = TextEditingController(
          text: existing != null ? existing.score.toStringAsFixed(1) : '',
        );
      }
      _isLoading = false;
    });
  }

  void _bulkSet() {
    final score = _bulkController.text;
    if (score.isEmpty) return;
    
    setState(() {
      for (final controller in _scoreControllers.values) {
        controller.text = score;
      }
    });
  }

  void _clearAll() {
    setState(() {
      for (final controller in _scoreControllers.values) {
        controller.clear();
      }
    });
  }

  Future<void> _saveGrades() async {
    final repo = GradesRepository();
    int savedCount = 0;
    int errorCount = 0;

    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

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
          semester: 'Học kỳ 1', // Default or from state
        );
        savedCount++;
      } catch (e) {
        errorCount++;
      }
    }

    if (mounted) {
      Navigator.pop(context); // Close loading dialog
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Đã lưu $savedCount điểm${errorCount > 0 ? ', $errorCount lỗi' : ''}'),
          backgroundColor: errorCount > 0 ? AppColors.warning : AppColors.success,
        ),
      );
      if (errorCount == 0 && savedCount > 0) {
        Navigator.pop(context);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.className),
        actions: [
          TextButton(
            onPressed: _clearAll,
            child: const Text('Xóa hết', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
      body: Column(
        children: [
          // Category selector
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(10),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Loại điểm',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Text(
                      'Thang điểm 10',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                    ),
                  ],
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
                            if (selected && !isSelected) {
                              setState(() {
                                _selectedCategory = category;
                              });
                              _loadData();
                            }
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const Divider(height: 24),
                // Bulk set UI
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _bulkController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: InputDecoration(
                          hintText: 'Nhập điểm chung...',
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: _bulkSet,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                      ),
                      child: const Text('Áp dụng tất cả'),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Students list
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _students.isEmpty
                    ? const Center(child: Text('Không có học sinh trong lớp này'))
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
            onPressed: _students.isEmpty ? null : _saveGrades,
            icon: const Icon(Icons.save),
            label: const Text('Lưu điểm số'),
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
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: AppColors.surfaceVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Avatar
            CircleAvatar(
              backgroundColor: AppColors.primary.withAlpha(20),
              child: Text(
                student.initial,
                style: const TextStyle(
                  color: AppColors.primary,
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
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  if (student.studentCode != null)
                    Text(
                      student.studentCode!,
                      style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                    ),
                ],
              ),
            ),
            // Score input
            SizedBox(
              width: 70,
              child: TextField(
                controller: controller,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                textAlign: TextAlign.center,
                decoration: InputDecoration(
                  hintText: '-',
                  contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppColors.primary, width: 2),
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
