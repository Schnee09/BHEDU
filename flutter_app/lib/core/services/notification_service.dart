/// Notification Service for push notifications
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Notification model
class AppNotification {
  final String id;
  final String title;
  final String body;
  final String type; // attendance, grade, announcement
  final DateTime createdAt;
  final bool isRead;
  final Map<String, dynamic>? data;

  AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.createdAt,
    this.isRead = false,
    this.data,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      type: json['type'] as String? ?? 'general',
      createdAt: DateTime.parse(json['created_at'] as String),
      isRead: json['is_read'] as bool? ?? false,
      data: json['data'] as Map<String, dynamic>?,
    );
  }

  IconData get icon {
    switch (type) {
      case 'attendance':
        return Icons.calendar_today;
      case 'grade':
        return Icons.grade;
      case 'announcement':
        return Icons.campaign;
      default:
        return Icons.notifications;
    }
  }

  Color get color {
    switch (type) {
      case 'attendance':
        return Colors.blue;
      case 'grade':
        return Colors.amber;
      case 'announcement':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }
}

/// Notifications state
class NotificationsState {
  final List<AppNotification> notifications;
  final bool isLoading;
  final String? error;

  const NotificationsState({
    this.notifications = const [],
    this.isLoading = false,
    this.error,
  });

  int get unreadCount => notifications.where((n) => !n.isRead).length;

  NotificationsState copyWith({
    List<AppNotification>? notifications,
    bool? isLoading,
    String? error,
  }) {
    return NotificationsState(
      notifications: notifications ?? this.notifications,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Notifications notifier
class NotificationsNotifier extends StateNotifier<NotificationsState> {
  NotificationsNotifier() : super(const NotificationsState());

  Future<void> loadNotifications() async {
    state = state.copyWith(isLoading: true);
    
    try {
      // TODO: Fetch from Supabase notifications table
      // For now, use sample data
      await Future.delayed(const Duration(milliseconds: 500));
      
      final sampleNotifications = [
        AppNotification(
          id: '1',
          title: 'Điểm danh hôm nay',
          body: 'Bạn đã được đánh dấu có mặt trong lớp Toán 10A',
          type: 'attendance',
          createdAt: DateTime.now().subtract(const Duration(hours: 2)),
        ),
        AppNotification(
          id: '2',
          title: 'Điểm mới',
          body: 'Điểm kiểm tra 15 phút môn Văn: 8.5',
          type: 'grade',
          createdAt: DateTime.now().subtract(const Duration(days: 1)),
        ),
        AppNotification(
          id: '3',
          title: 'Thông báo từ nhà trường',
          body: 'Lịch thi học kỳ 1 đã được cập nhật',
          type: 'announcement',
          createdAt: DateTime.now().subtract(const Duration(days: 2)),
        ),
      ];

      state = state.copyWith(
        notifications: sampleNotifications,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  void markAsRead(String id) {
    final updated = state.notifications.map((n) {
      if (n.id == id) {
        return AppNotification(
          id: n.id,
          title: n.title,
          body: n.body,
          type: n.type,
          createdAt: n.createdAt,
          isRead: true,
          data: n.data,
        );
      }
      return n;
    }).toList();

    state = state.copyWith(notifications: updated);
  }

  void markAllAsRead() {
    final updated = state.notifications.map((n) {
      return AppNotification(
        id: n.id,
        title: n.title,
        body: n.body,
        type: n.type,
        createdAt: n.createdAt,
        isRead: true,
        data: n.data,
      );
    }).toList();

    state = state.copyWith(notifications: updated);
  }
}

/// Notifications provider
final notificationsProvider = StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
  return NotificationsNotifier();
});
