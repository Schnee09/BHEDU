/// User/Profile model matching profiles table
library;

import 'package:equatable/equatable.dart';
import '../../core/constants/app_constants.dart';

class UserModel extends Equatable {
  final String id;
  final String? userId;
  final String email;
  final UserRole role;
  final String? fullName;
  final String? firstName;
  final String? lastName;
  final String? phone;
  final String? avatarUrl;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const UserModel({
    required this.id,
    this.userId,
    required this.email,
    required this.role,
    this.fullName,
    this.firstName,
    this.lastName,
    this.phone,
    this.avatarUrl,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  /// Display name (full name or email fallback)
  String get displayName => fullName ?? email.split('@').first;

  /// First name initial for avatar
  String get initial => displayName.isNotEmpty ? displayName[0].toUpperCase() : '?';

  /// Create from Supabase JSON
  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      userId: json['user_id'] as String?,
      email: json['email'] as String,
      role: UserRole.fromString(json['role'] as String? ?? 'student'),
      fullName: json['full_name'] as String?,
      firstName: json['first_name'] as String?,
      lastName: json['last_name'] as String?,
      phone: json['phone'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      isActive: json['is_active'] as bool? ?? true,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'] as String) 
          : null,
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at'] as String) 
          : null,
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'email': email,
      'role': role.value,
      'full_name': fullName,
      'first_name': firstName,
      'last_name': lastName,
      'phone': phone,
      'avatar_url': avatarUrl,
      'is_active': isActive,
    };
  }

  /// Copy with
  UserModel copyWith({
    String? id,
    String? userId,
    String? email,
    UserRole? role,
    String? fullName,
    String? firstName,
    String? lastName,
    String? phone,
    String? avatarUrl,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      email: email ?? this.email,
      role: role ?? this.role,
      fullName: fullName ?? this.fullName,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      phone: phone ?? this.phone,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
    id, userId, email, role, fullName, firstName, lastName, 
    phone, avatarUrl, isActive, createdAt, updatedAt,
  ];
}
