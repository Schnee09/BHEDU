/// Activity Log Model for audit_log table
library;

import 'package:equatable/equatable.dart';

/// Represents an activity/audit log entry
class ActivityModel extends Equatable {
  final String id;
  final String action;        // create, update, delete
  final String resourceType;  // student, class, grade, attendance
  final String? resourceId;
  final String? userEmail;
  final Map<String, dynamic>? newData;
  final DateTime createdAt;

  const ActivityModel({
    required this.id,
    required this.action,
    required this.resourceType,
    this.resourceId,
    this.userEmail,
    this.newData,
    required this.createdAt,
  });

  /// Create from Supabase JSON
  factory ActivityModel.fromJson(Map<String, dynamic> json) {
    return ActivityModel(
      id: json['id'] as String,
      action: json['action'] as String? ?? 'unknown',
      resourceType: json['resource_type'] as String? ?? 'unknown',
      resourceId: json['resource_id'] as String?,
      userEmail: json['user_email'] as String?,
      newData: json['new_data'] as Map<String, dynamic>?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  /// Get display label for action
  String get actionLabel {
    switch (action) {
      case 'create':
        return 'đã tạo';
      case 'update':
        return 'đã cập nhật';
      case 'delete':
        return 'đã xóa';
      case 'import':
        return 'đã nhập';
      default:
        return action;
    }
  }

  /// Get display label for resource type
  String get resourceLabel {
    switch (resourceType) {
      case 'student':
        return 'học sinh';
      case 'class':
        return 'lớp học';
      case 'grade':
        return 'điểm số';
      case 'attendance':
        return 'điểm danh';
      case 'user':
        return 'người dùng';
      default:
        return resourceType;
    }
  }

  @override
  List<Object?> get props => [id, action, resourceType, resourceId, userEmail, createdAt];
}
