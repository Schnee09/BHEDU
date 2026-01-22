/// Attendance model matching attendance table
library;

import 'package:equatable/equatable.dart';
import '../../core/constants/app_constants.dart';

class AttendanceModel extends Equatable {
  final String id;
  final String studentId;
  final String? classId;
  final String date;
  final AttendanceStatus status;
  final String? checkInTime;
  final String? checkOutTime;
  final String? notes;
  final String? markedBy;
  final bool isQrCheckIn;
  final DateTime? createdAt;

  // Joined data
  final String? studentName;
  final String? className;

  const AttendanceModel({
    required this.id,
    required this.studentId,
    this.classId,
    required this.date,
    required this.status,
    this.checkInTime,
    this.checkOutTime,
    this.notes,
    this.markedBy,
    this.isQrCheckIn = false,
    this.createdAt,
    this.studentName,
    this.className,
  });

  /// Create from Supabase JSON
  factory AttendanceModel.fromJson(Map<String, dynamic> json) {
    return AttendanceModel(
      id: json['id'] as String,
      studentId: json['student_id'] as String,
      classId: json['class_id'] as String?,
      date: json['date'] as String,
      status: AttendanceStatus.fromString(json['status'] as String? ?? 'absent'),
      checkInTime: json['check_in_time'] as String?,
      checkOutTime: json['check_out_time'] as String?,
      notes: json['notes'] as String?,
      markedBy: json['marked_by'] as String?,
      isQrCheckIn: json['is_qr_check_in'] as bool? ?? false,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'] as String) 
          : null,
      // Joined data
      studentName: json['profiles']?['full_name'] as String?,
      className: json['classes']?['name'] as String?,
    );
  }

  /// Convert to JSON for insert/update
  Map<String, dynamic> toJson() {
    return {
      'student_id': studentId,
      'class_id': classId,
      'date': date,
      'status': status.value,
      'check_in_time': checkInTime,
      'check_out_time': checkOutTime,
      'notes': notes,
      'marked_by': markedBy,
      'is_qr_check_in': isQrCheckIn,
    };
  }

  @override
  List<Object?> get props => [
    id, studentId, classId, date, status, checkInTime, checkOutTime,
    notes, markedBy, isQrCheckIn, createdAt, studentName, className,
  ];
}
