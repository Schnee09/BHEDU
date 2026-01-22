/// Student Detail Screen - View student profile and data with tabs
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../config/theme.dart';
import '../../core/constants/app_constants.dart';
import '../../data/models/profile_model.dart';
import '../../data/models/attendance_model.dart';
import '../../data/models/grade_model.dart';
import '../../data/repositories/students_repository.dart';
import '../../data/repositories/attendance_repository.dart';
import '../../data/repositories/grades_repository.dart';

/// Repositories providers
final studentsRepoProvider = Provider((ref) => StudentsRepository());
final attendanceRepoProvider = Provider((ref) => AttendanceRepository());
final gradesRepoProvider = Provider((ref) => GradesRepository());

/// Selected student provider
final selectedStudentProvider = FutureProvider.family<ProfileModel?, String>((ref, studentId) async {
  final repo = ref.watch(studentsRepoProvider);
  return repo.getStudent(studentId);
});

/// Student grades provider
final studentGradesProvider = FutureProvider.family<List<GradeModel>, String>((ref, studentId) async {
  final repo = ref.watch(gradesRepoProvider);
  return repo.getStudentGrades(studentId: studentId);
});

/// Student attendance provider
final studentAttendanceProvider = FutureProvider.family<List<AttendanceModel>, String>((ref, studentId) async {
  final repo = ref.watch(attendanceRepoProvider);
  return repo.getStudentAttendance(studentId: studentId);
});

class StudentDetailScreen extends ConsumerStatefulWidget {
  final String studentId;

  const StudentDetailScreen({super.key, required this.studentId});

  @override
  ConsumerState<StudentDetailScreen> createState() => _StudentDetailScreenState();
}

class _StudentDetailScreenState extends ConsumerState<StudentDetailScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final studentAsync = ref.watch(selectedStudentProvider(widget.studentId));

    return Scaffold(
      body: studentAsync.when(
        data: (student) => student == null
            ? const Center(child: Text('Không tìm thấy học sinh'))
            : _buildContent(student),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Lỗi: $e')),
      ),
    );
  }

  Widget _buildContent(ProfileModel student) {
    return NestedScrollView(
      headerSliverBuilder: (context, innerBoxIsScrolled) => [
        SliverAppBar(
          expandedHeight: 200,
          pinned: true,
          backgroundColor: AppColors.surface,
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [AppColors.primary, AppColors.primaryDark],
                ),
              ),
              child: SafeArea(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 30),
                    // Avatar
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(40),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withAlpha(50), width: 3),
                      ),
                      child: Center(
                        child: Text(
                          student.initial,
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      student.fullName,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withAlpha(30),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            student.studentCode ?? 'N/A',
                            style: const TextStyle(color: Colors.white, fontSize: 12),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _getStatusColor(student.status).withAlpha(40),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            student.status.labelVi,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.edit, color: Colors.white),
              onPressed: () {
                // TODO: Edit student
              },
            ),
            IconButton(
              icon: const Icon(Icons.more_vert, color: Colors.white),
              onPressed: () {
                // TODO: More options
              },
            ),
          ],
        ),
        SliverPersistentHeader(
          pinned: true,
          delegate: _TabBarDelegate(
            TabBar(
              controller: _tabController,
              labelColor: AppColors.primary,
              unselectedLabelColor: AppColors.textSecondary,
              indicatorColor: AppColors.primary,
              indicatorWeight: 3,
              tabs: const [
                Tab(text: 'Tổng quan'),
                Tab(text: 'Điểm số'),
                Tab(text: 'Điểm danh'),
              ],
            ),
          ),
        ),
      ],
      body: TabBarView(
        controller: _tabController,
        children: [
          _OverviewTab(student: student),
          _GradesTab(studentId: widget.studentId),
          _AttendanceTab(studentId: widget.studentId),
        ],
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
      default:
        return AppColors.textMuted;
    }
  }
}

/// Tab Bar Delegate
class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;

  _TabBarDelegate(this.tabBar);

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: AppColors.surface,
      child: tabBar,
    );
  }

  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  double get minExtent => tabBar.preferredSize.height;

  @override
  bool shouldRebuild(covariant SliverPersistentHeaderDelegate oldDelegate) => false;
}

/// Overview Tab Content
class _OverviewTab extends StatelessWidget {
  final ProfileModel student;

  const _OverviewTab({required this.student});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Quick Stats Row
          Row(
            children: [
              Expanded(
                child: _QuickStatCard(
                  icon: Icons.school,
                  label: 'Khối lớp',
                  value: student.gradeLevel ?? '-',
                  color: AppColors.info,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _QuickStatCard(
                  icon: Icons.check_circle,
                  label: 'Chuyên cần',
                  value: '-%',
                  color: AppColors.success,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _QuickStatCard(
                  icon: Icons.grade,
                  label: 'Điểm TB',
                  value: '-',
                  color: AppColors.primary,
                ),
              ),
            ],
          ).animate().fadeIn(delay: 100.ms),
          const SizedBox(height: 20),

          // Personal Info Card
          _SectionCard(
            title: 'Thông tin cá nhân',
            icon: Icons.person,
            children: [
              _DetailRow(label: 'Mã học sinh', value: student.studentCode ?? '-'),
              _DetailRow(label: 'Ngày sinh', value: student.dateOfBirth?.toIso8601String().split('T')[0] ?? '-'),
              _DetailRow(label: 'Giới tính', value: student.gender ?? '-'),
              _DetailRow(label: 'Địa chỉ', value: student.address ?? '-'),
            ],
          ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),
          const SizedBox(height: 16),

          // Contact Info Card
          _SectionCard(
            title: 'Liên hệ',
            icon: Icons.contact_phone,
            children: [
              _DetailRow(label: 'Điện thoại', value: student.phone ?? '-'),
              _DetailRow(label: 'Email', value: student.email ?? '-'),
              _DetailRow(label: 'Phụ huynh', value: student.parentName ?? '-'),
              _DetailRow(label: 'SĐT Phụ huynh', value: student.parentPhone ?? '-'),
            ],
          ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1, end: 0),
          const SizedBox(height: 16),

          // Notes Card
          if (student.notes != null && student.notes!.isNotEmpty)
            _SectionCard(
              title: 'Ghi chú',
              icon: Icons.notes,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    student.notes!,
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                ),
              ],
            ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1, end: 0),
        ],
      ),
    );
  }
}

/// Grades Tab Content
class _GradesTab extends ConsumerWidget {
  final String studentId;

  const _GradesTab({required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gradesAsync = ref.watch(studentGradesProvider(studentId));

    return gradesAsync.when(
      data: (grades) {
        if (grades.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.grade_outlined, size: 48, color: AppColors.textMuted),
                SizedBox(height: 12),
                Text('Chưa có điểm nào', style: TextStyle(color: AppColors.textSecondary)),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: grades.length,
          itemBuilder: (context, index) {
            final grade = grades[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                leading: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: _getGradeColor(grade.score).withAlpha(30),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      grade.score.toStringAsFixed(1),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: _getGradeColor(grade.score),
                      ),
                    ),
                  ),
                ),
                title: Text(grade.subjectName ?? 'Subject'),
                subtitle: Text(grade.category.labelVi),
                trailing: Icon(Icons.chevron_right, color: AppColors.textMuted),
              ),
            ).animate(delay: (index * 50).ms).fadeIn().slideX(begin: 0.05, end: 0);
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Lỗi: $e')),
    );
  }

  Color _getGradeColor(double grade) {
    if (grade >= 8) return AppColors.success;
    if (grade >= 6.5) return AppColors.info;
    if (grade >= 5) return AppColors.warning;
    return AppColors.error;
  }
}

/// Attendance Tab Content
class _AttendanceTab extends ConsumerWidget {
  final String studentId;

  const _AttendanceTab({required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final attendanceAsync = ref.watch(studentAttendanceProvider(studentId));

    return attendanceAsync.when(
      data: (records) {
        if (records.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.calendar_today_outlined, size: 48, color: AppColors.textMuted),
                SizedBox(height: 12),
                Text('Chưa có dữ liệu điểm danh', style: TextStyle(color: AppColors.textSecondary)),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: records.length,
          itemBuilder: (context, index) {
            final record = records[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                leading: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: _getStatusColor(record.status).withAlpha(30),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _getStatusIcon(record.status),
                    color: _getStatusColor(record.status),
                  ),
                ),
                title: Text(record.date ?? 'Unknown date'),
                subtitle: Text(record.status.labelVi),
                trailing: record.notes != null
                    ? Icon(Icons.notes, size: 18, color: AppColors.textMuted)
                    : null,
              ),
            ).animate(delay: (index * 50).ms).fadeIn().slideX(begin: 0.05, end: 0);
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Lỗi: $e')),
    );
  }

  Color _getStatusColor(AttendanceStatus status) {
    switch (status) {
      case AttendanceStatus.present:
        return AppColors.success;
      case AttendanceStatus.absent:
        return AppColors.error;
      case AttendanceStatus.late:
        return AppColors.warning;
      case AttendanceStatus.excused:
        return AppColors.info;
    }
  }

  IconData _getStatusIcon(AttendanceStatus status) {
    switch (status) {
      case AttendanceStatus.present:
        return Icons.check_circle;
      case AttendanceStatus.absent:
        return Icons.cancel;
      case AttendanceStatus.late:
        return Icons.schedule;
      case AttendanceStatus.excused:
        return Icons.info;
    }
  }
}

/// Quick Stat Card Widget
class _QuickStatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _QuickStatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withAlpha(40)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: color.withAlpha(200),
            ),
          ),
        ],
      ),
    );
  }
}

/// Section Card Widget
class _SectionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<Widget> children;

  const _SectionCard({
    required this.title,
    required this.icon,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withAlpha(20),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, size: 18, color: AppColors.primary),
                ),
                const SizedBox(width: 12),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppColors.borderSubtle),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: children,
            ),
          ),
        ],
      ),
    );
  }
}

/// Detail Row Widget
class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
          ),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
          ),
        ],
      ),
    );
  }
}
