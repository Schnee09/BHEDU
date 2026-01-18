/// Application-wide constants
library;

/// User role enum matching web application
enum UserRole {
  admin('admin'),
  staff('staff'),
  teacher('teacher'),
  student('student');
  
  const UserRole(this.value);
  final String value;
  
  static UserRole fromString(String role) {
    return UserRole.values.firstWhere(
      (r) => r.value == role.toLowerCase(),
      orElse: () => UserRole.student,
    );
  }
}

/// Attendance status enum
enum AttendanceStatus {
  present('present', 'Có mặt'),
  absent('absent', 'Vắng mặt'),
  late('late', 'Đi trễ'),
  excused('excused', 'Có phép');
  
  const AttendanceStatus(this.value, this.labelVi);
  final String value;
  final String labelVi;
  
  static AttendanceStatus fromString(String status) {
    return AttendanceStatus.values.firstWhere(
      (s) => s.value == status.toLowerCase(),
      orElse: () => AttendanceStatus.absent,
    );
  }
}

/// Vietnamese grade categories
enum GradeCategory {
  oral('oral', 'Miệng', 1),
  quiz15('15min', '15 phút', 1),
  oneperiod('1period', '1 tiết', 2),
  midterm('midterm', 'Giữa kỳ', 2),
  final_('final', 'Cuối kỳ', 3);
  
  const GradeCategory(this.value, this.labelVi, this.weight);
  final String value;
  final String labelVi;
  final int weight;
  
  static GradeCategory fromString(String category) {
    return GradeCategory.values.firstWhere(
      (c) => c.value == category.toLowerCase(),
      orElse: () => GradeCategory.oral,
    );
  }
}

/// Student status
enum StudentStatus {
  active('active', 'Đang học'),
  inactive('inactive', 'Nghỉ học'),
  graduated('graduated', 'Đã tốt nghiệp'),
  suspended('suspended', 'Đình chỉ');
  
  const StudentStatus(this.value, this.labelVi);
  final String value;
  final String labelVi;
  
  static StudentStatus fromString(String status) {
    return StudentStatus.values.firstWhere(
      (s) => s.value == status.toLowerCase(),
      orElse: () => StudentStatus.active,
    );
  }
}

/// API constants
class ApiConstants {
  ApiConstants._();
  
  static const int pageSize = 25;
  static const int maxRetries = 3;
  static const Duration timeout = Duration(seconds: 30);
}

/// Storage keys
class StorageKeys {
  StorageKeys._();
  
  static const String authToken = 'auth_token';
  static const String refreshToken = 'refresh_token';
  static const String userProfile = 'user_profile';
  static const String themeMode = 'theme_mode';
  static const String locale = 'locale';
}
