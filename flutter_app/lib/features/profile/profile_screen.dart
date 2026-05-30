/// Profile Screen - View and edit user profile
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../config/theme.dart';
import '../../core/constants/app_constants.dart';
import '../../data/models/profile_model.dart';
import '../../shared/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final profile = authState.value;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Hồ sơ cá nhân'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              context.pushNamed('settings');
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(authNotifierProvider.notifier).refreshProfile();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Profile Header
              _ProfileHeader(profile: profile),
              const SizedBox(height: 24),

              // Profile Info Cards
              _ProfileInfoCard(
                title: 'Thông tin tài khoản',
                items: [
                  _InfoItem(icon: Icons.email, label: 'Email', value: profile?.email ?? '-'),
                  _InfoItem(icon: Icons.phone, label: 'Số điện thoại', value: profile?.phone ?? 'Chưa thiết lập'),
                  _InfoItem(icon: Icons.badge, label: 'Vai trò', value: _getRoleLabel(profile?.role)),
                ],
              ),
              const SizedBox(height: 16),

              // Quick Actions
              _ProfileActionsCard(profile: profile),
            ],
          ),
        ),
      ),
    );
  }

  String _getRoleLabel(UserRole? role) {
    switch (role) {
      case UserRole.admin:
        return 'Quản trị viên';
      case UserRole.staff:
        return 'Nhân viên';
      case UserRole.teacher:
        return 'Giáo viên';
      case UserRole.student:
        return 'Học sinh';
      case null:
        return '-';
    }
  }
}

class _ProfileHeader extends StatelessWidget {
  final ProfileModel? profile;

  const _ProfileHeader({this.profile});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Avatar
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.primary, AppColors.primaryDark],
            ),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withAlpha(100),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Center(
            child: Text(
              profile?.initial ?? '?',
              style: const TextStyle(
                fontSize: 40,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        // Name
        Text(
          profile?.fullName ?? 'Người dùng',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        // Role badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          decoration: BoxDecoration(
            color: _getRoleColor(profile?.role).withAlpha(30),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            _getRoleEmoji(profile?.role),
            style: TextStyle(
              color: _getRoleColor(profile?.role),
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }

  Color _getRoleColor(UserRole? role) {
    switch (role) {
      case UserRole.admin:
        return AppColors.admin;
      case UserRole.staff:
        return AppColors.staff;
      case UserRole.teacher:
        return AppColors.teacher;
      case UserRole.student:
        return AppColors.student;
      case null:
        return AppColors.textMuted;
    }
  }

  String _getRoleEmoji(UserRole? role) {
    switch (role) {
      case UserRole.admin:
        return '👑 Quản trị viên';
      case UserRole.staff:
        return '👔 Nhân viên';
      case UserRole.teacher:
        return '👨‍🏫 Giáo viên';
      case UserRole.student:
        return '👨‍🎓 Học sinh';
      case null:
        return 'Người dùng';
    }
  }
}

class _ProfileInfoCard extends StatelessWidget {
  final String title;
  final List<_InfoItem> items;

  const _ProfileInfoCard({
    required this.title,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            ...items.map((item) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withAlpha(20),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(item.icon, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.label,
                          style: TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          item.value,
                          style: const TextStyle(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }
}

class _InfoItem {
  final IconData icon;
  final String label;
  final String value;

  _InfoItem({
    required this.icon,
    required this.label,
    required this.value,
  });
}

class _ProfileActionsCard extends ConsumerWidget {
  final ProfileModel? profile;

  const _ProfileActionsCard({this.profile});

  Future<void> _showChangePasswordDialog(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Đổi mật khẩu'),
        content: TextField(
          controller: controller,
          obscureText: true,
          decoration: const InputDecoration(
            labelText: 'Mật khẩu mới',
            hintText: 'Nhập ít nhất 6 ký tự',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Cập nhật'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final password = controller.text.trim();
      if (password.length < 6) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Mật khẩu phải có ít nhất 6 ký tự')),
          );
        }
        return;
      }

      try {
        await Supabase.instance.client.auth.updateUser(
          UserAttributes(password: password),
        );
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Đã đổi mật khẩu thành công'), backgroundColor: AppColors.success),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Lỗi: $e'), backgroundColor: AppColors.error),
          );
        }
      }
    }
  }

  Future<void> _showSupportDialog(BuildContext context) async {
    final controller = TextEditingController();
    final type = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hỗ trợ & Góp ý'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Vui lòng mô tả vấn đề hoặc góp ý của bạn:'),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: 'Nhập nội dung tại đây...',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: const Text('Gửi'),
          ),
        ],
      ),
    );

    if (type != null && type.trim().isNotEmpty) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Cảm ơn bạn đã đóng góp! Yêu cầu của bạn đã được gửi đến quản trị viên.'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    }
  }

  Future<void> _showEditProfileDialog(BuildContext context, WidgetRef ref) async {
    if (profile == null) return;
    
    final nameController = TextEditingController(text: profile!.fullName);
    final phoneController = TextEditingController(text: profile!.phone);

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Chỉnh sửa hồ sơ'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Họ và tên'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: phoneController,
              decoration: const InputDecoration(labelText: 'Số điện thoại'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Lưu'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await Supabase.instance.client.from('profiles').update({
          'full_name': nameController.text.trim(),
          'phone': phoneController.text.trim(),
        }).eq('id', profile!.id);
        
        await ref.read(authNotifierProvider.notifier).refreshProfile();
        
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Cập nhật hồ sơ thành công'), backgroundColor: AppColors.success),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Lỗi: $e'), backgroundColor: AppColors.error),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      child: Column(
        children: [
          _ActionTile(
            icon: Icons.person_outline,
            title: 'Chỉnh sửa hồ sơ',
            onTap: () => _showEditProfileDialog(context, ref),
          ),
          const Divider(height: 1),
          _ActionTile(
            icon: Icons.lock_outline,
            title: 'Đổi mật khẩu',
            onTap: () => _showChangePasswordDialog(context, ref),
          ),
          const Divider(height: 1),
          _ActionTile(
            icon: Icons.help_outline,
            title: 'Hỗ trợ & Phản hồi',
            onTap: () => _showSupportDialog(context),
          ),
          const Divider(height: 1),
          _ActionTile(
            icon: Icons.logout,
            title: 'Đăng xuất',
            isDestructive: true,
            onTap: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Đăng xuất'),
                  content: const Text('Bạn có chắc chắn muốn đăng xuất?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Hủy'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      style: TextButton.styleFrom(foregroundColor: AppColors.error),
                      child: const Text('Đăng xuất'),
                    ),
                  ],
                ),
              );
              if (confirmed == true) {
                await ref.read(authNotifierProvider.notifier).logout();
              }
            },
          ),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final bool isDestructive;

  const _ActionTile({
    required this.icon,
    required this.title,
    required this.onTap,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = isDestructive ? AppColors.error : AppColors.textPrimary;

    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(title, style: TextStyle(color: color)),
      trailing: isDestructive ? null : Icon(Icons.chevron_right, color: AppColors.textMuted),
      onTap: onTap,
    );
  }
}
