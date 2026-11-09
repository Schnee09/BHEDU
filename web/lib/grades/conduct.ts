export type ConductRating = 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';

export interface AcademicClassification {
  classification: 'Excellent' | 'Good' | 'Fair' | 'Average' | 'Weak';
  classification_vi: 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Trung bình' | 'Yếu';
  description: string;
}

export function normalizeConductRating(value: unknown): ConductRating | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLocaleLowerCase('vi-VN');
  if (['tốt', 'tot', 'xuất sắc'].includes(normalized)) return 'Tốt';
  if (['khá', 'kha'].includes(normalized)) return 'Khá';
  if (['đạt', 'dat', 'tb', 'trung bình'].includes(normalized)) return 'Đạt';
  if (['chưa đạt', 'chua dat', 'yếu', 'yeu'].includes(normalized)) return 'Chưa đạt';
  return null;
}

export function getVietnameseClassification(
  gpa: number,
  conduct: ConductRating | null
): AcademicClassification {
  if (gpa >= 9 && conduct === 'Tốt') {
    return {
      classification: 'Excellent',
      classification_vi: 'Xuất sắc',
      description: 'Kết quả học tập xuất sắc và hạnh kiểm tốt',
    };
  }
  if (gpa >= 8 && conduct !== 'Chưa đạt') {
    return {
      classification: 'Good',
      classification_vi: 'Giỏi',
      description: 'Kết quả học tập tốt',
    };
  }
  if (gpa >= 6.5 && conduct !== 'Chưa đạt') {
    return {
      classification: 'Fair',
      classification_vi: 'Khá',
      description: 'Kết quả học tập khá',
    };
  }
  if (gpa >= 5) {
    return {
      classification: 'Average',
      classification_vi: 'Trung bình',
      description: 'Kết quả học tập đạt mức trung bình',
    };
  }
  return {
    classification: 'Weak',
    classification_vi: 'Yếu',
    description: 'Kết quả học tập cần được cải thiện',
  };
}
