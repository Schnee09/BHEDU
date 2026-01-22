/// Activity Feed Widget - displays recent activities
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../../config/theme.dart';
import '../../../data/models/activity_model.dart';
import '../../../data/repositories/activity_repository.dart';

/// Provider for activity repository
final activityRepositoryProvider = Provider((ref) => ActivityRepository());

/// Provider for recent activities
final recentActivitiesProvider = FutureProvider.autoDispose<List<ActivityModel>>((ref) async {
  final repository = ref.watch(activityRepositoryProvider);
  return repository.getRecentActivities(limit: 10);
});

/// Activity Feed Widget
class ActivityFeed extends ConsumerWidget {
  const ActivityFeed({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activitiesAsync = ref.watch(recentActivitiesProvider);

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withAlpha(30),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.trending_up,
                        size: 20,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Hoạt động gần đây',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  onPressed: () => ref.refresh(recentActivitiesProvider),
                  icon: const Icon(
                    Icons.refresh,
                    size: 20,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: AppColors.borderSubtle),

          // Content
          activitiesAsync.when(
            data: (activities) {
              if (activities.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(
                          Icons.access_time,
                          size: 32,
                          color: AppColors.textMuted,
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Chưa có hoạt động nào',
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                );
              }

              return ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: activities.length,
                separatorBuilder: (_, __) => const Divider(
                  height: 1,
                  color: AppColors.borderSubtle,
                ),
                itemBuilder: (context, index) {
                  final activity = activities[index];
                  return _ActivityItem(activity: activity)
                      .animate(delay: (index * 50).ms)
                      .fadeIn()
                      .slideX(begin: 0.05, end: 0);
                },
              );
            },
            loading: () => const _LoadingState(),
            error: (_, __) => const Padding(
              padding: EdgeInsets.all(24),
              child: Center(
                child: Text(
                  'Không thể tải hoạt động',
                  style: TextStyle(color: AppColors.error),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Single activity item
class _ActivityItem extends StatelessWidget {
  final ActivityModel activity;

  const _ActivityItem({required this.activity});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Icon
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: _getActionColor(activity.action),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              _getResourceIcon(activity.resourceType),
              size: 16,
              color: _getActionIconColor(activity.action),
            ),
          ),
          const SizedBox(width: 12),

          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: TextSpan(
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.textPrimary,
                    ),
                    children: [
                      TextSpan(
                        text: activity.userEmail ?? 'Hệ thống',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      TextSpan(
                        text: ' ${activity.actionLabel} ',
                        style: const TextStyle(color: AppColors.textSecondary),
                      ),
                      TextSpan(
                        text: activity.resourceLabel,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(
                      Icons.access_time,
                      size: 12,
                      color: AppColors.textMuted,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      timeago.format(activity.createdAt, locale: 'vi'),
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getActionColor(String action) {
    switch (action) {
      case 'create':
        return AppColors.success.withAlpha(30);
      case 'update':
        return AppColors.info.withAlpha(30);
      case 'delete':
        return AppColors.error.withAlpha(30);
      default:
        return AppColors.textMuted.withAlpha(30);
    }
  }

  Color _getActionIconColor(String action) {
    switch (action) {
      case 'create':
        return AppColors.success;
      case 'update':
        return AppColors.info;
      case 'delete':
        return AppColors.error;
      default:
        return AppColors.textMuted;
    }
  }

  IconData _getResourceIcon(String resourceType) {
    switch (resourceType) {
      case 'student':
        return Icons.person_add;
      case 'class':
        return Icons.school;
      case 'grade':
        return Icons.grade;
      case 'attendance':
        return Icons.calendar_today;
      case 'user':
        return Icons.person;
      default:
        return Icons.edit;
    }
  }
}

/// Loading state skeleton
class _LoadingState extends StatelessWidget {
  const _LoadingState();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: List.generate(
          5,
          (index) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        height: 14,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        height: 10,
                        width: 80,
                        decoration: BoxDecoration(
                          color: AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
