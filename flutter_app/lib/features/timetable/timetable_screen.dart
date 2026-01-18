/// Timetable Screen - Weekly schedule view
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../core/constants/app_constants.dart';
import '../../shared/providers/auth_provider.dart';

/// Current week offset provider
final weekOffsetProvider = StateProvider<int>((ref) => 0);

class TimetableScreen extends ConsumerWidget {
  const TimetableScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final weekOffset = ref.watch(weekOffsetProvider);
    final weekDates = _getWeekDates(weekOffset);
    final today = DateTime.now();
    final todayIndex = today.weekday - 1; // 0 = Monday

    return Scaffold(
      appBar: AppBar(
        title: const Text('Timetable'),
        actions: [
          IconButton(
            icon: const Icon(Icons.today),
            onPressed: () {
              ref.read(weekOffsetProvider.notifier).state = 0;
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Week navigation
          _WeekNavigator(
            weekDates: weekDates,
            weekOffset: weekOffset,
            onPrevious: () => ref.read(weekOffsetProvider.notifier).state--,
            onNext: () => ref.read(weekOffsetProvider.notifier).state++,
          ),

          // Day tabs
          _DayTabs(
            weekDates: weekDates,
            todayIndex: weekOffset == 0 ? todayIndex : -1,
          ),

          // Schedule content
          Expanded(
            child: _ScheduleContent(
              weekDates: weekDates,
              todayIndex: weekOffset == 0 ? todayIndex : -1,
            ),
          ),
        ],
      ),
    );
  }

  List<DateTime> _getWeekDates(int weekOffset) {
    final now = DateTime.now();
    final monday = now.subtract(Duration(days: now.weekday - 1));
    final offsetMonday = monday.add(Duration(days: weekOffset * 7));
    
    return List.generate(7, (i) => offsetMonday.add(Duration(days: i)));
  }
}

class _WeekNavigator extends StatelessWidget {
  final List<DateTime> weekDates;
  final int weekOffset;
  final VoidCallback onPrevious;
  final VoidCallback onNext;

  const _WeekNavigator({
    required this.weekDates,
    required this.weekOffset,
    required this.onPrevious,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    final startDate = DateFormat('MMM d').format(weekDates.first);
    final endDate = DateFormat('MMM d, y').format(weekDates.last);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      color: AppColors.surface,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: onPrevious,
          ),
          Column(
            children: [
              Text(
                '$startDate - $endDate',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              if (weekOffset == 0)
                Text(
                  'This Week',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontSize: 12,
                  ),
                ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: onNext,
          ),
        ],
      ),
    );
  }
}

class _DayTabs extends StatefulWidget {
  final List<DateTime> weekDates;
  final int todayIndex;

  const _DayTabs({
    required this.weekDates,
    required this.todayIndex,
  });

  @override
  State<_DayTabs> createState() => _DayTabsState();
}

class _DayTabsState extends State<_DayTabs> {
  late int _selectedIndex;

  @override
  void initState() {
    super.initState();
    _selectedIndex = widget.todayIndex >= 0 && widget.todayIndex < 5 
        ? widget.todayIndex 
        : 0;
  }

  @override
  Widget build(BuildContext context) {
    final dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return Container(
      height: 70,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Row(
        children: List.generate(7, (index) {
          final date = widget.weekDates[index];
          final isToday = index == widget.todayIndex;
          final isSelected = index == _selectedIndex;

          return Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _selectedIndex = index),
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 2, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected 
                      ? AppColors.primary 
                      : isToday 
                          ? AppColors.primary.withAlpha(30)
                          : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                  border: isToday && !isSelected
                      ? Border.all(color: AppColors.primary, width: 2)
                      : null,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      dayNames[index],
                      style: TextStyle(
                        fontSize: 11,
                        color: isSelected 
                            ? Colors.white 
                            : AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${date.day}',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isSelected 
                            ? Colors.white 
                            : isToday 
                                ? AppColors.primary 
                                : AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _ScheduleContent extends StatelessWidget {
  final List<DateTime> weekDates;
  final int todayIndex;

  const _ScheduleContent({
    required this.weekDates,
    required this.todayIndex,
  });

  @override
  Widget build(BuildContext context) {
    // Sample schedule data - in production, fetch from API
    final sampleClasses = [
      _ScheduleItem(time: '08:00 - 09:30', subject: 'Toán', room: 'A101', teacher: 'Nguyễn Văn A'),
      _ScheduleItem(time: '09:45 - 11:15', subject: 'Văn', room: 'A102', teacher: 'Trần Thị B'),
      _ScheduleItem(time: '13:00 - 14:30', subject: 'Anh', room: 'A103', teacher: 'Lê Văn C'),
      _ScheduleItem(time: '14:45 - 16:15', subject: 'Vật lý', room: 'Lab 1', teacher: 'Phạm Thị D'),
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: sampleClasses.length,
      itemBuilder: (context, index) {
        final item = sampleClasses[index];
        return _ScheduleCard(item: item, index: index);
      },
    );
  }
}

class _ScheduleItem {
  final String time;
  final String subject;
  final String room;
  final String teacher;

  _ScheduleItem({
    required this.time,
    required this.subject,
    required this.room,
    required this.teacher,
  });
}

class _ScheduleCard extends StatelessWidget {
  final _ScheduleItem item;
  final int index;

  const _ScheduleCard({required this.item, required this.index});

  @override
  Widget build(BuildContext context) {
    final colors = [
      AppColors.info,
      AppColors.success,
      AppColors.primary,
      AppColors.warning,
    ];
    final color = colors[index % colors.length];

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          // TODO: Navigate to class detail
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Time column
              SizedBox(
                width: 70,
                child: Text(
                  item.time.split(' - ')[0],
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                  ),
                ),
              ),
              // Color indicator
              Container(
                width: 4,
                height: 60,
                margin: const EdgeInsets.only(right: 12),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.subject,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.room, size: 14, color: AppColors.textMuted),
                        const SizedBox(width: 4),
                        Text(
                          item.room,
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Icon(Icons.person, size: 14, color: AppColors.textMuted),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            item.teacher,
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 12,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
