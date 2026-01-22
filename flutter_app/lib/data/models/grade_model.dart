/// Grade model matching grades table with Vietnamese categories
library;

import 'package:equatable/equatable.dart';
import '../../core/constants/app_constants.dart';

class GradeModel extends Equatable {
  final String id;
  final String studentId;
  final String? classId;
  final String? subjectId;
  final GradeCategory category;
  final double score;
  final double? maxScore;
  final String? notes;
  final String? gradedBy;
  final String? gradedAt;
  final String? semester;
  final String? academicYear;
  final DateTime? createdAt;

  // Joined data
  final String? studentName;
  final String? subjectName;
  final String? className;

  const GradeModel({
    required this.id,
    required this.studentId,
    this.classId,
    this.subjectId,
    required this.category,
    required this.score,
    this.maxScore = 10.0,
    this.notes,
    this.gradedBy,
    this.gradedAt,
    this.semester,
    this.academicYear,
    this.createdAt,
    this.studentName,
    this.subjectName,
    this.className,
  });

  /// Score percentage
  double get percentage => maxScore != null && maxScore! > 0 
      ? (score / maxScore!) * 100 
      : 0;

  /// Vietnamese grade label
  String get gradeLabel {
    if (score >= 9) return 'Giỏi';
    if (score >= 7) return 'Khá';
    if (score >= 5) return 'Trung bình';
    return 'Yếu';
  }

  /// Create from Supabase JSON
  factory GradeModel.fromJson(Map<String, dynamic> json) {
    return GradeModel(
      id: json['id'] as String,
      studentId: json['student_id'] as String,
      classId: json['class_id'] as String?,
      subjectId: json['subject_id'] as String?,
      category: GradeCategory.fromString(json['category'] as String? ?? 'oral'),
      score: (json['score'] as num?)?.toDouble() ?? 0,
      maxScore: (json['max_score'] as num?)?.toDouble() ?? 10.0,
      notes: json['notes'] as String?,
      gradedBy: json['graded_by'] as String?,
      gradedAt: json['graded_at'] as String?,
      semester: json['semester'] as String?,
      academicYear: json['academic_year'] as String?,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'] as String) 
          : null,
      // Joined data
      studentName: json['profiles']?['full_name'] as String?,
      subjectName: json['subjects']?['name'] as String?,
      className: json['classes']?['name'] as String?,
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'student_id': studentId,
      'class_id': classId,
      'subject_id': subjectId,
      'category': category.value,
      'score': score,
      'max_score': maxScore,
      'notes': notes,
      'graded_by': gradedBy,
      'graded_at': gradedAt,
      'semester': semester,
      'academic_year': academicYear,
    };
  }

  @override
  List<Object?> get props => [
    id, studentId, classId, subjectId, category, score, maxScore,
    notes, gradedBy, gradedAt, semester, academicYear, createdAt,
    studentName, subjectName, className,
  ];
}
