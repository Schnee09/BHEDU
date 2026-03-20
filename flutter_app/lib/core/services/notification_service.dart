/// Notification Service for push/real-time notifications
library;

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/notification_model.dart';
import '../../data/repositories/notification_repository.dart';
import '../../shared/providers/auth_provider.dart';

/// Notifications state
class NotificationsState {
  final List<NotificationModel> notifications;
  final bool isLoading;
  final String? error;

  const NotificationsState({
    this.notifications = const [],
    this.isLoading = false,
    this.error,
  });

  int get unreadCount => notifications.where((n) => !n.isRead).length;

  NotificationsState copyWith({
    List<NotificationModel>? notifications,
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
  final NotificationRepository _repository;
  final Ref _ref;
  StreamSubscription? _subscription;

  NotificationsNotifier(this._repository, this._ref) : super(const NotificationsState()) {
    _init();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  void _init() {
    final authState = _ref.watch(authNotifierProvider);
    final user = authState.value;
    
    if (user != null) {
      _initRealtime(user.id);
      loadNotifications();
    }
  }

  void _initRealtime(String userId) {
    _subscription?.cancel();
    _subscription = _repository.watchNotifications(userId).listen(
      (notifications) {
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
    final user = _ref.read(authNotifierProvider).value;
    if (user == null) return;

    state = state.copyWith(isLoading: true);

    try {
      final notifications = await _repository.getNotifications(userId: user.id);
      state = state.copyWith(notifications: notifications, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await _repository.markAsRead(id);
      // State updates automatically via stream subscription
    } catch (e) {
      debugPrint('Error marking notification as read: $e');
    }
  }

  Future<void> markAllAsRead() async {
    final user = _ref.read(authNotifierProvider).value;
    if (user == null) return;

    try {
      await _repository.markAllAsRead(user.id);
      // State updates automatically via stream subscription
    } catch (e) {
      debugPrint('Error marking all notifications as read: $e');
    }
  }
}

/// Notifications provider
final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
      final repository = ref.watch(notificationRepositoryProvider);
      return NotificationsNotifier(repository, ref);
    });
