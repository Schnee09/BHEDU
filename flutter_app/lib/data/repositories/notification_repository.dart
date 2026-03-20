/// Notification Repository - handles Supabase notification operations
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/supabase_config.dart';
import '../models/notification_model.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository();
});

class NotificationRepository {
  NotificationRepository();

  /// Get notifications for the current user
  Future<List<NotificationModel>> getNotifications({
    required String userId,
    int limit = 50,
  }) async {
    final response = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', ascending: false)
        .limit(limit);

    return (response as List)
        .map((json) => NotificationModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// Mark a notification as read
  Future<void> markAsRead(String id) async {
    await supabase
        .from('notifications')
        .update({'is_read': true})
        .eq('id', id);
  }

  /// Mark all notifications as read for a user
  Future<void> markAllAsRead(String userId) async {
    await supabase
        .from('notifications')
        .update({'is_read': true})
        .eq('user_id', userId)
        .eq('is_read', false);
  }

  /// Delete a notification
  Future<void> deleteNotification(String id) async {
    await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
  }

  /// Stream of notification changes for realtime updates
  Stream<List<NotificationModel>> watchNotifications(String userId) {
    return supabase
        .from('notifications')
        .stream(primaryKey: ['id'])
        .eq('user_id', userId)
        .order('created_at', ascending: false)
        .map((records) => records
            .map((json) => NotificationModel.fromJson(json))
            .toList());
  }
}
