/**
 * Vietnamese Học bạ (Student Transcript) PDF Template
 * Uses @react-pdf/renderer for better Vietnamese font support
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register fonts for Vietnamese support
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
      fontWeight: 300,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 700,
    },
  ],
});

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 10,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: 400,
    fontStyle: 'italic',
  },
  studentInfo: {
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#000',
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: '40%',
    fontWeight: 500,
  },
  infoValue: {
    width: '60%',
    fontWeight: 400,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginTop: 15,
    marginBottom: 10,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 5,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#000',
    fontWeight: 700,
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#000',
  },
  tableCell: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000',
    textAlign: 'center',
    fontSize: 9,
  },
  tableCellLeft: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000',
    textAlign: 'left',
    fontSize: 9,
  },
  col1: { width: '5%' },
  col2: { width: '25%' },
  col3: { width: '10%' },
  col4: { width: '10%' },
  col5: { width: '10%' },
  col6: { width: '10%' },
  col7: { width: '15%' },
  col8: { width: '15%' },
  summaryBox: {
    marginTop: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#000',
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  summaryLabel: {
    width: '50%',
    fontWeight: 500,
  },
  summaryValue: {
    width: '50%',
    fontWeight: 700,
    textAlign: 'right',
  },
  footer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    textAlign: 'center',
  },
  signatureTitle: {
    fontWeight: 700,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  signatureDate: {
    fontStyle: 'italic',
    marginBottom: 40,
    fontSize: 9,
  },
  signatureName: {
    fontWeight: 500,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 20,
    right: 30,
    textAlign: 'right',
    color: 'grey',
  },
});

// Type definitions
export interface SubjectGrade {
  subject_name: string;
  subject_code: string;
  semester_1_grade: number | null;
  semester_2_grade: number | null;
  final_grade: number;
  credits: number;
  component_grades?: {
    oral?: number;
    fifteen_min?: number;
    one_period?: number;
    midterm?: number;
    final?: number;
  };
}

export interface TranscriptData {
  school_name: string;
  school_address?: string;
  student_name: string;
  student_code: string;
  date_of_birth: string;
  gender: string;
  class_name: string;
  grade_level: string;
  academic_year: string;
  semester: string;
  subjects: SubjectGrade[];
  gpa: number;
  conduct: string;
  attendance_rate: number;
  rank_in_class?: number;
  total_students?: number;
  teacher_comment?: string;
  principal_name?: string;
  homeroom_teacher?: string;
}

const getGradeClassification = (gpa: number): string => {
  if (gpa >= 9.0) return 'Xuất sắc';
  if (gpa >= 8.0) return 'Giỏi';
  if (gpa >= 6.5) return 'Khá';
  if (gpa >= 5.0) return 'Trung bình';
  return 'Yếu';
};

// PDF Document Component
export const HocBaDocument: React.FC<{ data: TranscriptData }> = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>
            {data.school_name || 'TRUNG TÂM GIÁO DỤC BÙI HOÀNG'}
          </Text>
          {data.school_address && (
            <Text style={{ fontSize: 9, marginBottom: 5 }}>{data.school_address}</Text>
          )}
          <Text style={styles.title}>HỌC BẠ HỌC SINH</Text>
          <Text style={styles.subtitle}>
            Năm học {data.academic_year} - {data.semester}
          </Text>
        </View>

        {/* Student Information */}
        <View style={styles.studentInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Họ và tên học sinh:</Text>
            <Text style={styles.infoValue}>{data.student_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mã số học sinh:</Text>
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
            <Text style={styles.infoValue}>
              {data.class_name} ({data.grade_level})
            </Text>
          </View>
        </View>

        {/* Grades Table */}
        <Text style={styles.sectionTitle}>KẾT QUẢ HỌC TẬP</Text>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.col1]}>STT</Text>
            <Text style={[styles.tableCellLeft, styles.col2]}>Môn học</Text>
            <Text style={[styles.tableCell, styles.col3]}>Miệng</Text>
            <Text style={[styles.tableCell, styles.col4]}>15 phút</Text>
            <Text style={[styles.tableCell, styles.col5]}>1 tiết</Text>
            <Text style={[styles.tableCell, styles.col6]}>Giữa kỳ</Text>
            <Text style={[styles.tableCell, styles.col7]}>Cuối kỳ</Text>
            <Text style={[styles.tableCell, styles.col8, { borderRightWidth: 0 }]}>
              TB môn
            </Text>
          </View>

          {/* Table Rows */}
          {data.subjects.map((subject, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>{index + 1}</Text>
              <Text style={[styles.tableCellLeft, styles.col2]}>{subject.subject_name}</Text>
              <Text style={[styles.tableCell, styles.col3]}>
                {subject.component_grades?.oral?.toFixed(1) || '-'}
              </Text>
              <Text style={[styles.tableCell, styles.col4]}>
                {subject.component_grades?.fifteen_min?.toFixed(1) || '-'}
              </Text>
              <Text style={[styles.tableCell, styles.col5]}>
                {subject.component_grades?.one_period?.toFixed(1) || '-'}
              </Text>
              <Text style={[styles.tableCell, styles.col6]}>
                {subject.component_grades?.midterm?.toFixed(1) || '-'}
              </Text>
              <Text style={[styles.tableCell, styles.col7]}>
                {subject.component_grades?.final?.toFixed(1) || '-'}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  styles.col8,
                  { borderRightWidth: 0, fontWeight: 700 },
                ]}
              >
                {subject.final_grade.toFixed(1)}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Điểm trung bình chung:</Text>
            <Text style={styles.summaryValue}>{data.gpa.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Xếp loại học lực:</Text>
            <Text style={styles.summaryValue}>{getGradeClassification(data.gpa)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Hạnh kiểm:</Text>
            <Text style={styles.summaryValue}>{data.conduct}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Chuyên cần:</Text>
            <Text style={styles.summaryValue}>{data.attendance_rate.toFixed(1)}%</Text>
          </View>
          {data.rank_in_class && data.total_students && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Xếp hạng lớp:</Text>
              <Text style={styles.summaryValue}>
                {data.rank_in_class}/{data.total_students}
              </Text>
            </View>
          )}
        </View>

        {/* Teacher Comment */}
        {data.teacher_comment && (
          <View style={{ marginTop: 15, padding: 10, borderWidth: 1, borderColor: '#ccc' }}>
            <Text style={{ fontWeight: 700, marginBottom: 5 }}>Nhận xét của giáo viên:</Text>
            <Text style={{ fontSize: 9, lineHeight: 1.5 }}>{data.teacher_comment}</Text>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Giáo viên chủ nhiệm</Text>
            <Text style={styles.signatureDate}>
              Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm{' '}
              {new Date().getFullYear()}
            </Text>
            <Text style={styles.signatureName}>{data.homeroom_teacher || '___________'}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Hiệu trưởng</Text>
            <Text style={styles.signatureDate}>
              Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm{' '}
              {new Date().getFullYear()}
            </Text>
            <Text style={styles.signatureName}>{data.principal_name || '___________'}</Text>
          </View>
        </View>

        {/* Page Number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Trang ${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};

export default HocBaDocument;
