/**
 * Vietnamese Localization Utilities
 * Provides formatting and localization functions for Vietnamese education system
 */

export const VIETNAMESE_LOCALE = {
  // Date formatting
  formatDate: (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  formatDateShort: (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    });
  },

  // Academic year formatting
  formatAcademicYear: (year: string): string => {
    return `Năm học ${year}`;
  },

  // Semester formatting
  formatSemester: (semester: string): string => {
    switch (semester) {
      case 'HK1':
        return 'Học kỳ I';
      case 'HK2':
        return 'Học kỳ II';
      case 'CN':
        return 'Cả năm';
      default:
        return semester;
    }
  },

  // Grade level formatting
  formatGradeLevel: (level: string | number): string => {
    const numLevel = typeof level === 'string' ? parseInt(level) : level;
    if (numLevel >= 10 && numLevel <= 12) {
      return `Lớp ${numLevel}`;
    }
    return `Khối ${level}`;
  },

  // Subject type formatting
  formatSubjectType: (type: string): string => {
    switch (type) {
      case 'core':
        return 'Môn học cơ bản';
      case 'elective':
        return 'Môn học tự chọn';
      case 'specialized':
        return 'Môn học chuyên sâu';
      default:
        return type;
    }
  },

  // Conduct grade descriptions
  getConductDescription: (grade: string): string => {
    const descriptions: Record<string, string> = {
      'excellent': 'Xuất sắc - Tham gia đầy đủ các hoạt động, có ý thức kỷ luật cao',
      'good': 'Tốt - Tích cực tham gia hoạt động, có ý thức kỷ luật tốt',
      'fair': 'Khá - Tham gia các hoạt động, có ý thức kỷ luật',
      'average': 'Trung bình - Tham gia một số hoạt động, ý thức kỷ luật cơ bản',
      'weak': 'Yếu - Tham gia ít hoạt động, thường vi phạm kỷ luật'
    };
    return descriptions[grade] || grade;
  },

  // Academic classification descriptions
  getClassificationDescription: (classification: string): string => {
    const descriptions: Record<string, string> = {
      'Xuất sắc': 'Thành tích học tập xuất sắc, hạnh kiểm tốt',
      'Giỏi': 'Thành tích học tập tốt, có khả năng phát triển',
      'Khá': 'Thành tích học tập khá, cần cố gắng hơn',
      'Trung bình': 'Thành tích học tập trung bình, cần cải thiện',
      'Yếu': 'Thành tích học tập yếu, cần hỗ trợ đặc biệt'
    };
    return descriptions[classification] || classification;
  },

  // Number formatting
  formatNumber: (num: number, decimals: number = 1): string => {
    return num.toFixed(decimals);
  },

  // GPA formatting
  formatGPA: (gpa: number): string => {
    return gpa.toFixed(2);
  },

  // Percentage formatting
  formatPercentage: (value: number): string => {
    return `${Math.round(value * 10) / 10}%`;
  },

  // Vietnamese number words (for reports)
  numberToWords: (num: number): string => {
    // Simple implementation for common numbers
    const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const teens = ['mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín'];
    const tens = ['', '', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];

    if (num === 0) return 'không';
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const unit = num % 10;
      return tens[ten] + (unit > 0 ? ' ' + units[unit] : '');
    }
    return num.toString(); // Fallback for larger numbers
  },

  // Vietnamese currency formatting
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  },

  // Vietnamese time formatting
  formatTime: (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Vietnamese datetime formatting
  formatDateTime: (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Vietnamese month names
  getMonthName: (month: number): string => {
    const months = [
      'Tháng Một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu',
      'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'
    ];
    return months[month - 1] || '';
  },

  // Vietnamese day names
  getDayName: (day: number): string => {
    const days = [
      'Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'
    ];
    return days[day] || '';
  }
};

export default VIETNAMESE_LOCALE;