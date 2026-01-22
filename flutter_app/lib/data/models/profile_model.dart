/// Profile Model
/// Central entity for all users (Admin, Staff, Teacher, Student)
/// Maps to 'profiles' table in Supabase
library;

import '../../core/constants/app_constants.dart';

class ProfileModel {
  final String id;
  final String? userId;
  final String firstName;
  final String lastName;
  final String fullName;
  final String email;
  final String? phone;
  final DateTime? dateOfBirth;
  final String? gender;
  final String? address;
  final String? avatarUrl;
  final UserRole role;
  final StudentStatus status;
  final String? gradeLevel; // "10", "11", "12"
  final String? studentCode;
  final String? bio;
  final String? parentName;
  final String? parentPhone;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Helpers
  String get initial => fullName.isNotEmpty ? fullName[0].toUpperCase() : '?';
  bool get isStudent => role == UserRole.student;
  bool get isTeacher => role == UserRole.teacher;
  bool get isAdmin => role == UserRole.admin;
  bool get isStaff => role == UserRole.staff;

  ProfileModel({
    required this.id,
    this.userId,
    required this.firstName,
    required this.lastName,
    required this.fullName,
    required this.email,
    this.phone,
    this.dateOfBirth,
    this.gender,
    this.address,
    this.avatarUrl,
    required this.role,
    required this.status,
    this.gradeLevel,
    this.studentCode,
    this.bio,
    this.parentName,
    this.parentPhone,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ProfileModel.fromJson(Map<String, dynamic> json) {
    return ProfileModel(
      id: json['id'] as String,
      userId: json['user_id'] as String?,
      firstName: json['first_name'] as String? ?? '',
      lastName: json['last_name'] as String? ?? '',
      fullName: json['full_name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phone: json['phone'] as String?,
      dateOfBirth: json['date_of_birth'] != null 
          ? DateTime.tryParse(json['date_of_birth'] as String) 
          : null,
      gender: json['gender'] as String?,
      address: json['address'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      role: UserRole.fromString(json['role'] as String? ?? 'student'),
      status: StudentStatus.fromString(json['status'] as String? ?? 'active'),
      gradeLevel: json['grade_level'] as String?,
      studentCode: json['student_code'] as String?,
      bio: json['bio'] as String?,
      parentName: json['parent_name'] as String?,
      parentPhone: json['parent_phone'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse(json['created_at'] as String) ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updated_at'] as String) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'first_name': firstName,
      'last_name': lastName,
      'full_name': fullName,
      'email': email,
      'phone': phone,
      'date_of_birth': dateOfBirth?.toIso8601String(),
      'gender': gender,
      'address': address,
      'avatar_url': avatarUrl,
      'role': role.value,
      'status': status.value,
      'grade_level': gradeLevel,
      'student_code': studentCode,
      'bio': bio,
      'parent_name': parentName,
      'parent_phone': parentPhone,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}
