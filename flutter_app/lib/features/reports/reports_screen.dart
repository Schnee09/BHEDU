/// Reports Screen - Analytics and reports with charts
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../config/theme.dart';

/// Report type enum
enum ReportType { attendance, grades }

/// Selected report type provider
final selectedReportTypeProvider = StateProvider<ReportType>(
  (ref) => ReportType.attendance,
);

class ReportsScreen extends ConsumerWidget {
  const ReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reportType = ref.watch(selectedReportTypeProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Báo cáo')),
      body: Column(
        children: [
          // Report type selector
          Container(
            padding: const EdgeInsets.all(16),
            child: SegmentedButton<ReportType>(
              segments: const [
                ButtonSegment(
                  value: ReportType.attendance,
                  icon: Icon(Icons.calendar_today),
                  label: Text('Điểm danh'),
                ),
                ButtonSegment(
                  value: ReportType.grades,
                  icon: Icon(Icons.grade),
                  label: Text('Điểm số'),
                ),
              ],
              selected: {reportType},
              onSelectionChanged: (selected) {
                ref.read(selectedReportTypeProvider.notifier).state =
                    selected.first;
              },
            ),
          ),

          // Report content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: reportType == ReportType.attendance
                  ? const _AttendanceReport()
                  : const _GradesReport(),
            ),
          ),
        ],
      ),
    );
  }
}

class _AttendanceReport extends StatelessWidget {
  const _AttendanceReport();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Summary cards
        Row(
          children: [
            Expanded(
              child: _SummaryCard(
                title: 'Tỷ lệ chuyên cần',
                value: '95%',
                color: AppColors.success,
                icon: Icons.check_circle,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _SummaryCard(
                title: 'Ngày có mặt',
                value: '42',
                color: AppColors.info,
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
                title: 'Ngày vắng',
                value: '2',
                color: AppColors.error,
                icon: Icons.cancel,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _SummaryCard(
                title: 'Đi trễ',
                value: '3',
                color: AppColors.warning,
                icon: Icons.schedule,
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
        SizedBox(height: 200, child: _AttendancePieChart()),
        const SizedBox(height: 24),

        // Weekly trend
        const Text(
          'Xu hướng theo tuần',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        const SizedBox(height: 16),
        SizedBox(height: 200, child: _WeeklyBarChart()),
      ],
    );
  }
}

class _GradesReport extends StatelessWidget {
  const _GradesReport();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Summary cards
        Row(
          children: [
            Expanded(
              child: _SummaryCard(
                title: 'Điểm TB',
                value: '7.8',
                color: AppColors.primary,
                icon: Icons.grade,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _SummaryCard(
                title: 'Xếp hạng',
                value: '5/45',
                color: AppColors.info,
                icon: Icons.leaderboard,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // Grades by subject
        const Text(
          'Điểm theo môn học',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        const SizedBox(height: 16),
        SizedBox(height: 250, child: _SubjectBarChart()),
        const SizedBox(height: 24),

        // Grade distribution
        const Text(
          'Phân bố điểm',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        const SizedBox(height: 16),
        SizedBox(height: 200, child: _GradeDistributionChart()),
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
  @override
  Widget build(BuildContext context) {
    return PieChart(
      PieChartData(
        sectionsSpace: 2,
        centerSpaceRadius: 40,
        sections: [
          PieChartSectionData(
            value: 42,
            title: '89%',
            color: AppColors.present,
            radius: 50,
            titleStyle: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          PieChartSectionData(
            value: 2,
            title: '4%',
            color: AppColors.absent,
            radius: 50,
            titleStyle: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          PieChartSectionData(
            value: 3,
            title: '7%',
            color: AppColors.late,
            radius: 50,
            titleStyle: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class _WeeklyBarChart extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        maxY: 5,
        barTouchData: BarTouchData(enabled: false),
        titlesData: FlTitlesData(
          show: true,
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                const days = ['T2', 'T3', 'T4', 'T5', 'T6'];
                return Text(
                  days[value.toInt()],
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
        barGroups: [
          _makeBarGroup(0, 5, 0),
          _makeBarGroup(1, 4, 1),
          _makeBarGroup(2, 5, 0),
          _makeBarGroup(3, 5, 0),
          _makeBarGroup(4, 3, 2),
        ],
      ),
    );
  }

  BarChartGroupData _makeBarGroup(int x, double present, double absent) {
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(
          toY: present + absent,
          rodStackItems: [
            BarChartRodStackItem(0, present, AppColors.present),
            BarChartRodStackItem(present, present + absent, AppColors.absent),
          ],
          width: 20,
          borderRadius: BorderRadius.circular(4),
        ),
      ],
    );
  }
}

class _SubjectBarChart extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        maxY: 10,
        barTouchData: BarTouchData(enabled: true),
        titlesData: FlTitlesData(
          show: true,
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                const subjects = ['Toán', 'Văn', 'Anh', 'Lý', 'Hóa', 'Sinh'];
                if (value.toInt() >= subjects.length) return const Text('');
                return Text(
                  subjects[value.toInt()],
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
        barGroups: [
          _makeSubjectBar(0, 8.5),
          _makeSubjectBar(1, 7.2),
          _makeSubjectBar(2, 8.0),
          _makeSubjectBar(3, 7.8),
          _makeSubjectBar(4, 6.5),
          _makeSubjectBar(5, 7.0),
        ],
      ),
    );
  }

  BarChartGroupData _makeSubjectBar(int x, double y) {
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(
          toY: y,
          color: AppColors.primary,
          width: 24,
          borderRadius: BorderRadius.circular(4),
        ),
      ],
    );
  }
}

class _GradeDistributionChart extends StatelessWidget {
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
                const months = ['T8', 'T9', 'T10', 'T11', 'T12'];
                if (value.toInt() >= months.length) return const Text('');
                return Text(
                  months[value.toInt()],
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
        minY: 5,
        maxY: 10,
        lineBarsData: [
          LineChartBarData(
            spots: const [
              FlSpot(0, 7.2),
              FlSpot(1, 7.5),
              FlSpot(2, 7.8),
              FlSpot(3, 7.6),
              FlSpot(4, 8.0),
            ],
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
