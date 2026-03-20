/// Notification Model - handles user notifications
library;

import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';

enum NotificationType {
  info,
  success,
  warning,
  error;

  String get value => name;

  static NotificationType fromString(String? value) {
    return NotificationType.values.firstWhere(
      (e) => e.name == value,
      orElse: () => NotificationType.info,
    );
  }
}

class NotificationModel extends Equatable {
  final String id;
  final String userId;
  final String title;
  final String? message;
  final NotificationType type;
  final DateTime createdAt;
  final bool isRead;
  final String category;
  final String? link;

  const NotificationModel({
    required this.id,
    required this.userId,
    required this.title,
    this.message,
    required this.type,
    required this.createdAt,
    required this.isRead,
    required this.category,
    this.link,
  });

  IconData get icon {
    switch (category) {
      case 'attendance':
        return Icons.calendar_today;
      case 'grade':
        return Icons.grade;
      case 'finance':
        return Icons.account_balance_wallet;
      case 'system':
        return Icons.settings_suggest;
      default:
        return Icons.notifications;
    }
  }

  Color get color {
    switch (type) {
      case NotificationType.success:
        return Colors.green;
      case NotificationType.warning:
        return Colors.amber;
      case NotificationType.error:
        return Colors.red;
      case NotificationType.info:
        return Colors.blue;
    }
  }

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      title: json['title'] as String,
      message: json['message'] as String?,
      type: NotificationType.fromString(json['type'] as String?),
      createdAt: DateTime.parse(json['created_at'] as String),
      isRead: json['is_read'] as bool? ?? false,
      category: json['category'] as String? ?? 'general',
      link: json['link'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'title': title,
      'message': message,
      'type': type.value,
      'created_at': createdAt.toIso8601String(),
      'is_read': isRead,
      'category': category,
      'link': link,
    };
  }

  NotificationModel copyWith({
    String? id,
    String? userId,
    String? title,
    String? message,
    NotificationType? type,
    DateTime? createdAt,
    bool? isRead,
    String? category,
    String? link,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      message: message ?? this.message,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      isRead: isRead ?? this.isRead,
      category: category ?? this.category,
      link: link ?? this.link,
    );
  }

  @override
  List<Object?> get props => [
    id,
    userId,
    title,
    message,
    type,
    createdAt,
    isRead,
    category,
    link,
  ];
}
