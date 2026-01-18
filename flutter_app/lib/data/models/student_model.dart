/// Student model matching students table
library;

import 'package:equatable/equatable.dart';
import '../../core/constants/app_constants.dart';

class StudentModel extends Equatable {
  final String id;
  final String? profileId;
  final String fullName;
  final String? studentCode;
  final String? email;
  final String? phone;
  final String? dateOfBirth;
  final String? gender;
  final String? address;
  final String? gradeLevel;
  final String? photoUrl;
  final String? notes;
  final String? enrollmentDate;
  final String? parentName;
  final String? parentPhone;
  final StudentStatus status;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const StudentModel({
    required this.id,
    this.profileId,
    required this.fullName,
    this.studentCode,
    this.email,
    this.phone,
    this.dateOfBirth,
    this.gender,
    this.address,
    this.gradeLevel,
    this.photoUrl,
    this.notes,
    this.enrollmentDate,
    this.parentName,
    this.parentPhone,
    this.status = StudentStatus.active,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  /// Display name
  String get displayName => fullName;

  /// Avatar initial
  String get initial => fullName.isNotEmpty ? fullName[0].toUpperCase() : '?';

  /// Create from Supabase JSON
  factory StudentModel.fromJson(Map<String, dynamic> json) {
    return StudentModel(
      id: json['id'] as String,
      profileId: json['profile_id'] as String?,
      fullName: json['full_name'] as String? ?? '',
      studentCode: json['student_code'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      dateOfBirth: json['date_of_birth'] as String?,
      gender: json['gender'] as String?,
      address: json['address'] as String?,
      gradeLevel: json['grade_level'] as String?,
      photoUrl: json['photo_url'] as String?,
      notes: json['notes'] as String?,
      enrollmentDate: json['enrollment_date'] as String?,
      parentName: json['parent_name'] as String?,
      parentPhone: json['parent_phone'] as String?,
      status: StudentStatus.fromString(json['status'] as String? ?? 'active'),
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
      'profile_id': profileId,
      'full_name': fullName,
      'student_code': studentCode,
      'email': email,
      'phone': phone,
      'date_of_birth': dateOfBirth,
      'gender': gender,
      'address': address,
      'grade_level': gradeLevel,
      'photo_url': photoUrl,
      'notes': notes,
      'enrollment_date': enrollmentDate,
      'status': status.value,
      'is_active': isActive,
    };
  }

  @override
  List<Object?> get props => [
    id, profileId, fullName, studentCode, email, phone, dateOfBirth,
    gender, address, gradeLevel, photoUrl, notes, enrollmentDate,
    status, isActive, createdAt, updatedAt,
  ];
}
