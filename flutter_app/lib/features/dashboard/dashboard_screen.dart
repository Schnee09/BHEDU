/// Dashboard Screen for BH-EDU
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../core/constants/app_constants.dart';
import '../../core/ui/ui_components.dart';
import '../../data/models/user_model.dart';
import '../../shared/providers/auth_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final profile = authState.value;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        elevation: 0,
        backgroundColor: Colors.transparent,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => context.push('/search'),
          ),
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.push('/notifications'),
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      extendBodyBehindAppBar: true,
      body: authState.isLoading
          ? const _DashboardSkeleton()
          : RefreshIndicator(
              onRefresh: () async {
                // Refresh data logic
                await Future.delayed(const Duration(seconds: 1));
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.only(
                  top: MediaQuery.of(context).padding.top + 60,
                  left: 16,
                  right: 16,
                  bottom: 24,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Welcome Card
                    _WelcomeCard(profile: profile)
                        .animate()
                        .fadeIn(duration: 400.ms)
                        .slideY(begin: 0.2, end: 0, curve: Curves.easeOutBack),
                    const SizedBox(height: 32),

                    // Quick Actions
                    SectionHeader(
                      title: 'Thao tác nhanh',
                    ).animate().fadeIn(delay: 100.ms),
                    _QuickActionsGrid(role: profile?.role ?? UserRole.student),
                    
                    const SizedBox(height: 24),

                    // Summary Section
                    SectionHeader(
                      title: 'Tổng quan',
                    ).animate().fadeIn(delay: 200.ms),
                    _SummaryCards(role: profile?.role ?? UserRole.student),
                  ],
                ),
              ),
            ),
    );
  }
}

/// Loading Skeleton
class _DashboardSkeleton extends StatelessWidget {
  const _DashboardSkeleton();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 60,
        left: 16,
        right: 16,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const AppShimmer(height: 140, radius: 20),
          const SizedBox(height: 32),
          const AppShimmer(height: 20, width: 150),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 4,
            shrinkWrap: true,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            children: List.generate(4, (_) => const AppShimmer(height: 80, radius: 16)),
          ),
        ],
      ),
    );
  }
}

/// Welcome card with user info
class _WelcomeCard extends StatelessWidget {
  final UserModel? profile;
  
  const _WelcomeCard({this.profile});

  @override
  Widget build(BuildContext context) {
    return GradientContainer(
      colors: const [AppColors.primary, AppColors.primaryDark],
      height: 150,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withAlpha(50), width: 2),
            ),
            child: CircleAvatar(
              radius: 32,
              backgroundColor: Colors.white24,
              child: Text(
                profile?.initial ?? '?',
                style: const TextStyle(
                  fontSize: 28,
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Chào buổi sáng,',
                  style: TextStyle(
                    color: Colors.white.withAlpha(200),
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  profile?.displayName ?? 'Người dùng',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black.withAlpha(40),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(_getRoleIcon(profile?.role), size: 14, color: Colors.white),
                      const SizedBox(width: 6),
                      Text(
                        _getRoleLabel(profile?.role),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getRoleLabel(UserRole? role) {
    switch (role) {
      case UserRole.admin: return 'Quản trị viên';
      case UserRole.staff: return 'Nhân viên';
      case UserRole.teacher: return 'Giáo viên';
      case UserRole.student: return 'Học sinh';
      default: return 'Khách';
    }
  }

  IconData _getRoleIcon(UserRole? role) {
    switch (role) {
      case UserRole.admin: return Icons.admin_panel_settings;
      case UserRole.staff: return Icons.work;
      case UserRole.teacher: return Icons.school;
      case UserRole.student: return Icons.person;
      default: return Icons.person_outline;
    }
  }
}

/// Quick actions grid
class _QuickActionsGrid extends StatelessWidget {
  final UserRole role;
  
  const _QuickActionsGrid({required this.role});

  @override
  Widget build(BuildContext context) {
    final actions = _getActionsForRole(context, role);

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 1.4,
      ),
      itemCount: actions.length,
      itemBuilder: (context, index) {
        final action = actions[index];
        return AppCard(
          onTap: action.onTap,
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: action.color.withAlpha(30),
                  shape: BoxShape.circle,
                ),
                child: Icon(action.icon, size: 28, color: action.color),
              ),
              const SizedBox(height: 12),
              Text(
                action.label,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ).animate(delay: (100 + index * 50).ms).fadeIn().slideY(begin: 0.2, end: 0);
      },
    );
  }

  List<_QuickAction> _getActionsForRole(BuildContext context, UserRole role) {
    // Helper to push route
    void nav(String path) => context.push(path);

    switch (role) {
      case UserRole.admin:
      case UserRole.staff:
        return [
          _QuickAction(Icons.person_add, 'Thêm học sinh', AppColors.success, () {}),
          _QuickAction(Icons.how_to_reg, 'Điểm danh', AppColors.info, () => nav('/attendance')),
          _QuickAction(Icons.assessment, 'Báo cáo', AppColors.primary, () => nav('/reports')),
          _QuickAction(Icons.calendar_month, 'Lịch', AppColors.warning, () => nav('/calendar')),
        ];
      case UserRole.teacher:
        return [
          _QuickAction(Icons.how_to_reg, 'Điểm danh', AppColors.info, () => nav('/attendance')),
          _QuickAction(Icons.grade, 'Nhập điểm', AppColors.primary, () => nav('/classes')),
          _QuickAction(Icons.calendar_month, 'Lịch dạy', AppColors.success, () => nav('/calendar')),
          _QuickAction(Icons.qr_code_scanner, 'Quét QR', AppColors.warning, () => nav('/qr-scanner')),
        ];
      case UserRole.student:
        return [
          _QuickAction(Icons.grade, 'Xem điểm', AppColors.primary, () => nav('/grades')),
          _QuickAction(Icons.calendar_today, 'Lịch học', AppColors.info, () => nav('/timetable')),
          _QuickAction(Icons.person, 'Hồ sơ', AppColors.success, () => nav('/profile')),
          _QuickAction(Icons.payment, 'Tài chính', AppColors.warning, () => nav('/finance')), 
        ];
    }
  }
}

class _QuickAction {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  _QuickAction(this.icon, this.label, this.color, this.onTap);
}

/// Summary cards based on role
class _SummaryCards extends StatelessWidget {
  final UserRole role;
  
  const _SummaryCards({required this.role});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _StatCard(
                title: 'Hôm nay',
                value: '5',
                subtitle: 'Tiết học',
                icon: Icons.school,
                color: AppColors.info,
                delay: 200,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _StatCard(
                title: 'Chuyên cần',
                value: '98%',
                subtitle: 'Tháng này',
                icon: Icons.check_circle,
                color: AppColors.success,
                delay: 300,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _StatCard(
                title: 'Điểm TB',
                value: '8.5',
                subtitle: 'Học kỳ 1',
                icon: Icons.grade,
                color: AppColors.primary,
                delay: 400,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _StatCard(
                title: 'Thông báo',
                value: '2',
                subtitle: 'Mới',
                icon: Icons.notifications_active,
                color: AppColors.warning,
                delay: 500,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color color;
  final int delay;

  const _StatCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.delay,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Icon(icon, size: 20, color: color),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 12,
            ),
          ),
        ],
      ),
    ).animate(delay: delay.ms).fadeIn().slideX(begin: 0.1, end: 0);
  }
}
