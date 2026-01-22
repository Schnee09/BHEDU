/// Attendance Reports Screen - View attendance summaries and statistics
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../config/theme.dart';
import '../../core/constants/app_constants.dart';
import '../../data/models/attendance_model.dart';
import '../../data/repositories/attendance_repository.dart';



class AttendanceReportsScreen extends ConsumerWidget {
  const AttendanceReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Báo cáo điểm danh'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Overall Stats
            const _OverallStatsSection()
                .animate()
                .fadeIn(duration: 400.ms)
                .slideY(begin: 0.1, end: 0),
            const SizedBox(height: 24),

            // Weekly Chart
            const _WeeklyChartSection()
                .animate(delay: 200.ms)
                .fadeIn()
                .slideY(begin: 0.1, end: 0),
            const SizedBox(height: 24),

            // Status Breakdown
            const _StatusBreakdownSection()
                .animate(delay: 300.ms)
                .fadeIn()
                .slideY(begin: 0.1, end: 0),
          ],
        ),
      ),
    );
  }
}

/// Overall Stats Cards
class _OverallStatsSection extends StatelessWidget {
  const _OverallStatsSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Tổng quan tháng này',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _StatCard(
                icon: Icons.check_circle,
                label: 'Có mặt',
                value: '95%',
                color: AppColors.success,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _StatCard(
                icon: Icons.cancel,
                label: 'Vắng',
                value: '3%',
                color: AppColors.error,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _StatCard(
                icon: Icons.schedule,
                label: 'Đi muộn',
                value: '2%',
                color: AppColors.warning,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _StatCard(
                icon: Icons.event_note,
                label: 'Tổng buổi',
                value: '45',
                color: AppColors.info,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// Stat Card Widget
class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withAlpha(40)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withAlpha(30),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: color.withAlpha(180),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Weekly Chart Section
class _WeeklyChartSection extends StatelessWidget {
  const _WeeklyChartSection();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withAlpha(20),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.bar_chart, size: 18, color: AppColors.primary),
              ),
              const SizedBox(width: 12),
              const Text(
                'Điểm danh theo tuần',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 200,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: 100,
                barTouchData: BarTouchData(enabled: false),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
                        if (value.toInt() < days.length) {
                          return Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              days[value.toInt()],
                              style: const TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 12,
                              ),
                            ),
                          );
                        }
                        return const Text('');
                      },
                      reservedSize: 30,
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 35,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          '${value.toInt()}%',
                          style: const TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 10,
                          ),
                        );
                      },
                    ),
                  ),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(show: false),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) => FlLine(
                    color: AppColors.borderSubtle,
                    strokeWidth: 1,
                  ),
                ),
                barGroups: [
                  _makeBarGroup(0, 95),
                  _makeBarGroup(1, 92),
                  _makeBarGroup(2, 98),
                  _makeBarGroup(3, 88),
                  _makeBarGroup(4, 96),
                  _makeBarGroup(5, 0),
                  _makeBarGroup(6, 0),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  BarChartGroupData _makeBarGroup(int x, double y) {
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(
          toY: y,
          color: y >= 90 ? AppColors.success : (y >= 80 ? AppColors.warning : AppColors.error),
          width: 20,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
        ),
      ],
    );
  }
}

/// Status Breakdown Section
class _StatusBreakdownSection extends StatelessWidget {
  const _StatusBreakdownSection();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.info.withAlpha(20),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.pie_chart, size: 18, color: AppColors.info),
              ),
              const SizedBox(width: 12),
              const Text(
                'Phân bố trạng thái',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _StatusRow(
            label: 'Có mặt',
            count: 428,
            percentage: 95,
            color: AppColors.success,
          ),
          const SizedBox(height: 12),
          _StatusRow(
            label: 'Vắng không phép',
            count: 12,
            percentage: 3,
            color: AppColors.error,
          ),
          const SizedBox(height: 12),
          _StatusRow(
            label: 'Đi muộn',
            count: 8,
            percentage: 2,
            color: AppColors.warning,
          ),
          const SizedBox(height: 12),
          _StatusRow(
            label: 'Vắng có phép',
            count: 2,
            percentage: 0,
            color: AppColors.info,
          ),
        ],
      ),
    );
  }
}

/// Status Row Widget
class _StatusRow extends StatelessWidget {
  final String label;
  final int count;
  final int percentage;
  final Color color;

  const _StatusRow({
    required this.label,
    required this.count,
    required this.percentage,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(3),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(color: AppColors.textSecondary),
          ),
        ),
        Text(
          '$count',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        const SizedBox(width: 12),
        Container(
          width: 60,
          height: 6,
          decoration: BoxDecoration(
            color: AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(3),
          ),
          child: FractionallySizedBox(
            alignment: Alignment.centerLeft,
            widthFactor: percentage / 100,
            child: Container(
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 40,
          child: Text(
            '$percentage%',
            textAlign: TextAlign.right,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }
}
