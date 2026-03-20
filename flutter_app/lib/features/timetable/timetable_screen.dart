/// Timetable Screen - Weekly schedule view
/// Cross-platform synchronized with web Pro Max design
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../core/providers/customization_provider.dart';
import '../../shared/widgets/glass_container.dart';
import '../classes/class_detail_screen.dart';

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
    final palette = ref.watch(accentColorProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thời khóa biểu'),
        actions: [
          IconButton(
            icon: Icon(Icons.today, color: palette.primary),
            tooltip: 'Hôm nay',
            onPressed: () {
              ref.read(weekOffsetProvider.notifier).state = 0;
            },
          ),
        ],
      ),
      body: GestureDetector(
        onHorizontalDragEnd: (details) {
          // Swipe right = previous week, swipe left = next week
          if (details.primaryVelocity != null) {
            if (details.primaryVelocity! > 300) {
              ref.read(weekOffsetProvider.notifier).state--;
            } else if (details.primaryVelocity! < -300) {
              ref.read(weekOffsetProvider.notifier).state++;
            }
          }
        },
        child: Column(
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
                  style: TextStyle(color: AppColors.primary, fontSize: 12),
                ),
            ],
          ),
          IconButton(icon: const Icon(Icons.chevron_right), onPressed: onNext),
        ],
      ),
    );
  }
}

class _DayTabs extends StatefulWidget {
  final List<DateTime> weekDates;
  final int todayIndex;

  const _DayTabs({required this.weekDates, required this.todayIndex});

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

  const _ScheduleContent({required this.weekDates, required this.todayIndex});

  @override
  Widget build(BuildContext context) {
    // Sample schedule data - in production, fetch from API
    final sampleClasses = [
      _ScheduleItem(
        id: '1',
        time: '08:00 - 09:30',
        subject: 'Toán',
        room: 'A101',
        teacher: 'Nguyễn Văn A',
      ),
      _ScheduleItem(
        id: '2',
        time: '09:45 - 11:15',
        subject: 'Văn',
        room: 'A102',
        teacher: 'Trần Thị B',
      ),
      _ScheduleItem(
        id: '3',
        time: '13:00 - 14:30',
        subject: 'Anh',
        room: 'A103',
        teacher: 'Lê Văn C',
      ),
      _ScheduleItem(
        id: '4',
        time: '14:45 - 16:15',
        subject: 'Vật lý',
        room: 'Lab 1',
        teacher: 'Phạm Thị D',
      ),
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
  final String id;
  final String time;
  final String subject;
  final String room;
  final String teacher;

  _ScheduleItem({
    required this.id,
    required this.time,
    required this.subject,
    required this.room,
    required this.teacher,
  });
}

class _ScheduleCard extends ConsumerWidget {
  final _ScheduleItem item;
  final int index;

  const _ScheduleCard({required this.item, required this.index});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final palette = ref.watch(accentColorProvider);
    final colors = [
      AppColors.info,
      AppColors.success,
      palette.primary, // Use dynamic accent color
      AppColors.warning,
    ];
    final color = colors[index % colors.length];

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassContainer(
        padding: const EdgeInsets.all(16),
        showGlow: false,
        child: InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ClassDetailScreen(classId: item.id),
              ),
            );
          },
          borderRadius: BorderRadius.circular(12),
          child: Row(
            children: [
              // Time column
              SizedBox(
                width: 60,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.time.split(' - ')[0],
                      style: TextStyle(
                        color: palette.primary,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item.time.split(' - ').length > 1
                          ? item.time.split(' - ')[1]
                          : '',
                      style: TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 11,
                      ),
                    ),
                  ],
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
                  boxShadow: [
                    BoxShadow(
                      color: color.withAlpha(100),
                      blurRadius: 8,
                      spreadRadius: 0,
                    ),
                  ],
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
                    const SizedBox(height: 6),
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
                        Icon(
                          Icons.person,
                          size: 14,
                          color: AppColors.textMuted,
                        ),
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
              // Arrow indicator
              Icon(Icons.chevron_right, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}
