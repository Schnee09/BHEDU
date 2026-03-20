/// Reports Screen - Analytics and reports with charts
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../config/theme.dart';
import '../../core/constants/app_constants.dart';
import '../../shared/providers/auth_provider.dart';
import 'reports_provider.dart';

/// Report type enum
enum ReportType { attendance, grades, personalQR }

/// Selected report type provider
final selectedReportTypeProvider = StateProvider<ReportType>(
  (ref) => ReportType.attendance,
);

class ReportsScreen extends ConsumerWidget {
  const ReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reportType = ref.watch(selectedReportTypeProvider);
    final profile = ref.watch(authNotifierProvider).value;
    final isStudent = profile?.role == UserRole.student;

    return Scaffold(
      appBar: AppBar(title: const Text('Báo cáo & Tiện ích')),
      body: Column(
        children: [
          // Report type selector
          Container(
            padding: const EdgeInsets.all(16),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: SegmentedButton<ReportType>(
                segments: [
                  const ButtonSegment(
                    value: ReportType.attendance,
                    icon: Icon(Icons.calendar_today),
                    label: Text('Điểm danh'),
                  ),
                  const ButtonSegment(
                    value: ReportType.grades,
                    icon: Icon(Icons.grade),
                    label: Text('Điểm số'),
                  ),
                  if (isStudent)
                    const ButtonSegment(
                      value: ReportType.personalQR,
                      icon: Icon(Icons.qr_code),
                      label: Text('Mã QR'),
                    ),
                ],
                selected: {reportType},
                onSelectionChanged: (selected) {
                  ref.read(selectedReportTypeProvider.notifier).state =
                      selected.first;
                },
              ),
            ),
          ),

          // Report content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: _buildContent(reportType, profile?.id ?? ''),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(ReportType type, String userId) {
    switch (type) {
      case ReportType.attendance:
        return _AttendanceReport(studentId: userId);
      case ReportType.grades:
        return _GradesReport(studentId: userId);
      case ReportType.personalQR:
        return _PersonalQRView(studentId: userId);
    }
  }
}

class _AttendanceReport extends ConsumerWidget {
  final String studentId;
  const _AttendanceReport({required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(studentAttendanceSummaryProvider(studentId));
    final trendAsync = ref.watch(studentWeeklyTrendProvider(studentId));

    return summaryAsync.when(
      data: (summary) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Summary cards
          Row(
            children: [
              Expanded(
                child: _SummaryCard(
                  title: 'Ngày có mặt',
                  value: summary['present'].toString(),
                  color: AppColors.success,
                  icon: Icons.check_circle,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _SummaryCard(
                  title: 'Ngày vắng',
                  value: summary['absent'].toString(),
                  color: AppColors.error,
                  icon: Icons.calendar_today,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _SummaryCard(
                  title: 'Đi trễ',
                  value: summary['late'].toString(),
                  color: AppColors.warning,
                  icon: Icons.schedule,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _SummaryCard(
                  title: 'Có phép',
                  value: summary['excused'].toString(),
                  color: AppColors.info,
                  icon: Icons.verified_user,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Attendance pie chart
          const Text(
            'Phân bố trạng thái',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 200, 
            child: _AttendancePieChart(summary: summary),
          ),
          const SizedBox(height: 24),

          // Weekly trend
          const Text(
            'Chuyên cần tuần này',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 16),
          trendAsync.when(
            data: (trend) => SizedBox(height: 200, child: _WeeklyBarChart(trend: trend)),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Text('Error loading trend: $e'),
          ),
        ],
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Text('Error: $e'),
    );
  }
}

class _GradesReport extends ConsumerWidget {
  final String studentId;
  const _GradesReport({required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final distributionAsync = ref.watch(studentGradeDistributionProvider(studentId));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Summary info (Average from another provider if needed)
        const Text(
          'Phân bố điểm số (Gần đây)',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        const SizedBox(height: 16),
        distributionAsync.when(
          data: (scores) => scores.isEmpty 
            ? const Center(child: Text('Chưa có dữ liệu điểm số'))
            : SizedBox(height: 250, child: _GradeDistributionChart(scores: scores)),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Text('Error: $e'),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}

class _PersonalQRView extends StatelessWidget {
  final String studentId;
  const _PersonalQRView({required this.studentId});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 20),
        const Text(
          'Mã QR của tôi',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          'Sử dụng mã này để điểm danh nhanh',
          style: TextStyle(color: AppColors.textSecondary),
        ),
        const SizedBox(height: 40),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(20),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: QrImageView(
            data: studentId,
            version: QrVersions.auto,
            size: 250.0,
            gapless: false,
          ),
        ),
        const SizedBox(height: 40),
        Text(
          'ID: $studentId',
          style: TextStyle(
            color: AppColors.textMuted,
            fontSize: 12,
            fontFamily: 'monospace',
          ),
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String title;
  final String value;
  final Color color;
  final IconData icon;

  const _SummaryCard({
    required this.title,
    required this.value,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 20),
                const Spacer(),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              title,
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}

class _AttendancePieChart extends StatelessWidget {
  final Map<String, int> summary;
  const _AttendancePieChart({required this.summary});

  @override
  Widget build(BuildContext context) {
    final int present = summary['present'] ?? 0;
    final int absent = summary['absent'] ?? 0;
    final int late = summary['late'] ?? 0;
    final int excused = summary['excused'] ?? 0;
    final int total = present + absent + late + excused;

    if (total == 0) return const Center(child: Text('Chưa có dữ liệu'));

    return PieChart(
      PieChartData(
        sectionsSpace: 2,
        centerSpaceRadius: 40,
        sections: [
          if (present > 0)
            PieChartSectionData(
              value: present.toDouble(),
              title: '${((present / total) * 100).toStringAsFixed(0)}%',
              color: AppColors.present,
              radius: 50,
              titleStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          if (absent > 0)
            PieChartSectionData(
              value: absent.toDouble(),
              title: '${((absent / total) * 100).toStringAsFixed(0)}%',
              color: AppColors.absent,
              radius: 50,
              titleStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          if (late > 0)
            PieChartSectionData(
              value: late.toDouble(),
              title: '${((late / total) * 100).toStringAsFixed(0)}%',
              color: AppColors.late,
              radius: 50,
              titleStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          if (excused > 0)
            PieChartSectionData(
              value: excused.toDouble(),
              title: '${((excused / total) * 100).toStringAsFixed(0)}%',
              color: AppColors.info,
              radius: 50,
              titleStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
        ],
      ),
    );
  }
}

class _WeeklyBarChart extends StatelessWidget {
  final List<int> trend;
  const _WeeklyBarChart({required this.trend});

  @override
  Widget build(BuildContext context) {
    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        maxY: trend.isEmpty ? 5 : trend.reduce((a, b) => a > b ? a : b).toDouble() + 1,
        barTouchData: BarTouchData(enabled: false),
        titlesData: FlTitlesData(
          show: true,
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                const days = ['T2', 'T3', 'T4', 'T5', 'T6'];
                int index = value.toInt();
                if (index < 0 || index >= days.length) return const SizedBox.shrink();
                return Text(
                  days[index],
                  style: const TextStyle(fontSize: 10),
                );
              },
            ),
          ),
          leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        barGroups: List.generate(trend.length, (i) => BarChartGroupData(
          x: i,
          barRods: [
            BarChartRodData(
              toY: trend[i].toDouble(),
              color: AppColors.primary,
              width: 20,
              borderRadius: BorderRadius.circular(4),
            ),
          ],
        )),
      ),
    );
  }
}

class _GradeDistributionChart extends StatelessWidget {
  final List<double> scores;
  const _GradeDistributionChart({required this.scores});

  @override
  Widget build(BuildContext context) {
    return LineChart(
      LineChartData(
        gridData: FlGridData(show: true, drawVerticalLine: false),
        titlesData: FlTitlesData(
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                int index = value.toInt();
                if (index < 0 || index >= scores.length) return const SizedBox.shrink();
                return Text(
                  '#${index + 1}',
                  style: const TextStyle(fontSize: 10),
                );
              },
            ),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 30,
              getTitlesWidget: (value, meta) {
                return Text(
                  '${value.toInt()}',
                  style: const TextStyle(fontSize: 10),
                );
              },
            ),
          ),
          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        minY: 0,
        maxY: 10,
        lineBarsData: [
          LineChartBarData(
            spots: List.generate(scores.length, (i) => FlSpot(i.toDouble(), scores[i])),
            isCurved: true,
            color: AppColors.primary,
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: FlDotData(show: true),
            belowBarData: BarAreaData(
              show: true,
              color: AppColors.primary.withAlpha(30),
            ),
          ),
        ],
      ),
    );
  }
}
