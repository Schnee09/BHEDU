import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  schoolAddress: {
    fontSize: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  studentInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    width: 120,
    fontWeight: 'bold',
  },
  infoValue: {
    flex: 1,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 5,
    fontWeight: 'bold',
    borderBottom: 1,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottom: 0.5,
    borderColor: '#ccc',
  },
  subjectCol: {
    width: '25%',
  },
  gradeCol: {
    width: '15%',
    textAlign: 'center',
  },
  letterCol: {
    width: '15%',
    textAlign: 'center',
  },
  descriptionCol: {
    width: '20%',
    textAlign: 'center',
  },
  summary: {
    marginTop: 20,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  summaryLabel: {
    width: 150,
    fontWeight: 'bold',
  },
  summaryValue: {
    flex: 1,
  },
  signatures: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signature: {
    width: '30%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTop: 1,
    marginTop: 40,
    paddingTop: 5,
  },
});

interface ReportCardData {
  school_name: string;
  school_address: string;
  student_name: string;
  student_code: string;
  date_of_birth: string;
  gender: string;
  class_name: string;
  grade_level: string;
  academic_year: string;
  semester: string;
  subjects: Array<{
    subject_name: string;
    subject_code: string;
    final_grade: number;
    grade_letter: string;
    grade_description: string;
    component_grades: {
      oral: number | null;
      fifteen_min: number | null;
      one_period: number | null;
      midterm: number | null;
      final: number | null;
    };
  }>;
  gpa: number;
  conduct: string;
  academic_classification: {
    classification: string;
    classification_vi: string;
    description: string;
  };
  teacher_comment: string | null;
  homeroom_teacher: string | null;
  principal_name: string;
  report_date: string;
}

interface ReportCardPDFProps {
  data: ReportCardData;
}

const ReportCardPDF: React.FC<ReportCardPDFProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.schoolName}>{data.school_name}</Text>
        <Text style={styles.schoolAddress}>{data.school_address}</Text>
        <Text style={styles.title}>BẢNG ĐIỂM HỌC KỲ</Text>
        <Text style={styles.title}>{data.semester} - {data.academic_year}</Text>
      </View>

      {/* Student Information */}
      <View style={styles.studentInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Họ và tên:</Text>
          <Text style={styles.infoValue}>{data.student_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mã học sinh:</Text>
          <Text style={styles.infoValue}>{data.student_code}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ngày sinh:</Text>
          <Text style={styles.infoValue}>{data.date_of_birth}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Giới tính:</Text>
          <Text style={styles.infoValue}>{data.gender}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Lớp:</Text>
          <Text style={styles.infoValue}>{data.class_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Khối:</Text>
          <Text style={styles.infoValue}>{data.grade_level}</Text>
        </View>
      </View>

      {/* Grades Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.subjectCol}>Môn học</Text>
          <Text style={styles.gradeCol}>Điểm số</Text>
          <Text style={styles.letterCol}>Điểm chữ</Text>
          <Text style={styles.descriptionCol}>Xếp loại</Text>
        </View>

        {data.subjects.map((subject, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.subjectCol}>{subject.subject_name}</Text>
            <Text style={styles.gradeCol}>{subject.final_grade.toFixed(1)}</Text>
            <Text style={styles.letterCol}>{subject.grade_letter}</Text>
            <Text style={styles.descriptionCol}>{subject.grade_description}</Text>
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Điểm trung bình:</Text>
          <Text style={styles.summaryValue}>{data.gpa.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Hạnh kiểm:</Text>
          <Text style={styles.summaryValue}>{data.conduct}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Học lực:</Text>
          <Text style={styles.summaryValue}>{data.academic_classification.classification_vi}</Text>
        </View>
        {data.teacher_comment && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Nhận xét giáo viên:</Text>
            <Text style={styles.summaryValue}>{data.teacher_comment}</Text>
          </View>
        )}
      </View>

      {/* Signatures */}
      <View style={styles.signatures}>
        <View style={styles.signature}>
          <Text>Giáo viên chủ nhiệm</Text>
          <View style={styles.signatureLine}>
            <Text>{data.homeroom_teacher}</Text>
          </View>
        </View>
        <View style={styles.signature}>
          <Text>Phụ huynh học sinh</Text>
          <View style={styles.signatureLine}>
            <Text></Text>
          </View>
        </View>
        <View style={styles.signature}>
          <Text>Hiệu trưởng</Text>
          <View style={styles.signatureLine}>
            <Text>{data.principal_name}</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={{ marginTop: 20, textAlign: 'center', fontSize: 10 }}>
        <Text>Ngày cấp: {data.report_date}</Text>
      </View>
    </Page>
  </Document>
);

export default ReportCardPDF;