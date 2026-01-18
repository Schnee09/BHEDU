/// Profile Screen - View and edit user profile
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/theme.dart';
import '../../core/constants/app_constants.dart';
import '../../data/models/user_model.dart';
import '../../shared/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final profile = authState.value;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              // TODO: Settings
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Profile Header
            _ProfileHeader(profile: profile),
            const SizedBox(height: 24),

            // Profile Info Cards
            _ProfileInfoCard(
              title: 'Account Information',
              items: [
                _InfoItem(icon: Icons.email, label: 'Email', value: profile?.email ?? '-'),
                _InfoItem(icon: Icons.phone, label: 'Phone', value: profile?.phone ?? 'Not set'),
                _InfoItem(icon: Icons.badge, label: 'Role', value: _getRoleLabel(profile?.role)),
              ],
            ),
            const SizedBox(height: 16),

            // Quick Actions
            _ProfileActionsCard(ref: ref),
          ],
        ),
      ),
    );
  }

  String _getRoleLabel(UserRole? role) {
    switch (role) {
      case UserRole.admin:
        return 'Administrator';
      case UserRole.staff:
        return 'Staff';
      case UserRole.teacher:
        return 'Teacher';
      case UserRole.student:
        return 'Student';
      case null:
        return '-';
    }
  }
}

class _ProfileHeader extends StatelessWidget {
  final UserModel? profile;

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
          profile?.displayName ?? 'User',
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
        return '👑 Administrator';
      case UserRole.staff:
        return '👔 Staff';
      case UserRole.teacher:
        return '👨‍🏫 Teacher';
      case UserRole.student:
        return '👨‍🎓 Student';
      case null:
        return 'User';
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

class _ProfileActionsCard extends StatelessWidget {
  final WidgetRef ref;

  const _ProfileActionsCard({required this.ref});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          _ActionTile(
            icon: Icons.person_outline,
            title: 'Edit Profile',
            onTap: () {
              // TODO: Edit profile
            },
          ),
          const Divider(height: 1),
          _ActionTile(
            icon: Icons.lock_outline,
            title: 'Change Password',
            onTap: () {
              // TODO: Change password
            },
          ),
          const Divider(height: 1),
          _ActionTile(
            icon: Icons.notifications_outlined,
            title: 'Notifications',
            onTap: () {
              // TODO: Notification settings
            },
          ),
          const Divider(height: 1),
          _ActionTile(
            icon: Icons.help_outline,
            title: 'Help & Support',
            onTap: () {
              // TODO: Help
            },
          ),
          const Divider(height: 1),
          _ActionTile(
            icon: Icons.logout,
            title: 'Logout',
            isDestructive: true,
            onTap: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Logout'),
                  content: const Text('Are you sure you want to logout?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      style: TextButton.styleFrom(foregroundColor: AppColors.error),
                      child: const Text('Logout'),
                    ),
                  ],
                ),
              );
              if (confirmed == true) {
                await ref.read(authNotifierProvider.notifier).signOut();
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
      trailing: Icon(Icons.chevron_right, color: AppColors.textMuted),
      onTap: onTap,
    );
  }
}
