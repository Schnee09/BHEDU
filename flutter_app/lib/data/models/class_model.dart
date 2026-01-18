/// Class model matching classes table
library;

import 'package:equatable/equatable.dart';

class ClassModel extends Equatable {
  final String id;
  final String name;
  final String? description;
  final String? teacherId;
  final String? subjectId;
  final String? roomId;
  final String? academicYear;
  final String? semester;
  final int? capacity;
  final int? enrolledCount;
  final bool isActive;
  final DateTime? createdAt;

  // Joined data
  final String? teacherName;
  final String? subjectName;
  final String? roomName;
  final String? schedule;

  const ClassModel({
    required this.id,
    required this.name,
    this.description,
    this.teacherId,
    this.subjectId,
    this.roomId,
    this.academicYear,
    this.semester,
    this.capacity,
    this.enrolledCount,
    this.isActive = true,
    this.createdAt,
    this.teacherName,
    this.subjectName,
    this.roomName,
    this.schedule,
  });

  /// Create from Supabase JSON
  factory ClassModel.fromJson(Map<String, dynamic> json) {
    return ClassModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      teacherId: json['teacher_id'] as String?,
      subjectId: json['subject_id'] as String?,
      roomId: json['room_id'] as String?,
      academicYear: json['academic_year'] as String?,
      semester: json['semester'] as String?,
      capacity: json['capacity'] as int?,
      enrolledCount: json['enrolled_count'] as int?,
      isActive: json['is_active'] as bool? ?? true,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'] as String) 
          : null,
      // Joined data
      teacherName: json['teachers']?['full_name'] as String? ?? 
                   json['teacher']?['full_name'] as String?,
      subjectName: json['subjects']?['name'] as String?,
      roomName: json['rooms']?['name'] as String?,
      schedule: json['schedule'] as String?,
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      'teacher_id': teacherId,
      'subject_id': subjectId,
      'room_id': roomId,
      'academic_year': academicYear,
      'semester': semester,
      'capacity': capacity,
      'is_active': isActive,
    };
  }

  @override
  List<Object?> get props => [
    id, name, description, teacherId, subjectId, roomId, academicYear,
    semester, capacity, enrolledCount, isActive, createdAt,
    teacherName, subjectName, roomName,
  ];
}
