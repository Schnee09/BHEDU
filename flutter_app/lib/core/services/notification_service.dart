/// Notification Service for push/real-time notifications
library;

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/supabase_config.dart';

/// Notification model matching database schema
class AppNotification {
  final String id;
  final String title;
  final String? body;
  final String type; // info, success, warning, error
  final String category; // grade, attendance, system
  final String? link;
  final DateTime createdAt;
  final bool isRead;
  final Map<String, dynamic>? data;

  AppNotification({
    required this.id,
    required this.title,
    this.body,
    required this.type,
    required this.category,
    this.link,
    required this.createdAt,
    this.isRead = false,
    this.data,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['message'] as String?, // Mapped from 'message' in DB
      type: json['type'] as String? ?? 'info',
      category: json['category'] as String? ?? 'general',
      link: json['link'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      isRead: json['is_read'] as bool? ?? false,
      data: json['data'] as Map<String, dynamic>?,
    );
  }

  IconData get icon {
    switch (category) {
      case 'attendance':
        return Icons.calendar_today;
      case 'grade':
        return Icons.grade;
      case 'system':
        return Icons.settings_suggest;
      default:
        return Icons.notifications;
    }
  }

  Color get color {
    switch (type) {
      case 'success':
        return Colors.green;
      case 'warning':
        return Colors.amber;
      case 'error':
        return Colors.red;
      case 'info':
      default:
        return Colors.blue;
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
  StreamSubscription? _subscription;

  NotificationsNotifier() : super(const NotificationsState()) {
    _initRealtime();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  void _initRealtime() {
    final user = currentUser;
    if (user == null) return;

    // Listen to real-time changes
    _subscription = supabase
        .from('notifications')
        .stream(primaryKey: ['id'])
        .eq('user_id', user.id)
        .order('created_at', ascending: false)
        .listen(
          (List<Map<String, dynamic>> data) {
            final notifications = data
                .map((json) => AppNotification.fromJson(json))
                .toList();
            state = state.copyWith(
              notifications: notifications,
              isLoading: false,
            );
          },
          onError: (error) {
            state = state.copyWith(error: error.toString(), isLoading: false);
          },
        );
  }

  Future<void> loadNotifications() async {
    final user = currentUser;
    if (user == null) return;

    state = state.copyWith(isLoading: true);

    try {
      final response = await supabase
          .from('notifications')
          .select()
          .eq('user_id', user.id)
          .order('created_at', ascending: false)
          .limit(20);

      final notifications = (response as List)
          .map((json) => AppNotification.fromJson(json))
          .toList();

      state = state.copyWith(notifications: notifications, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await supabase
          .from('notifications')
          .update({'is_read': true})
          .eq('id', id);
      // State updates automatically via stream subscription
    } catch (e) {
      debugPrint('Error marking notification as read: $e');
    }
  }

  Future<void> markAllAsRead() async {
    final user = currentUser;
    if (user == null) return;

    try {
      await supabase
          .from('notifications')
          .update({'is_read': true})
          .eq('user_id', user.id)
          .eq('is_read', false);
      // State updates automatically via stream subscription
    } catch (e) {
      debugPrint('Error marking all notifications as read: $e');
    }
  }
}

/// Notifications provider
final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
      return NotificationsNotifier();
    });
