/// Calendar Screen - View attendance calendar and events
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../core/constants/app_constants.dart';
import '../../shared/providers/auth_provider.dart';
import '../attendance/attendance_screen.dart';
import '../classes/class_detail_screen.dart';

/// Selected day provider
final selectedDayProvider = StateProvider<DateTime>((ref) => DateTime.now());

/// Calendar events provider (attendance records)
final calendarEventsProvider = FutureProvider<Map<DateTime, List<CalendarEvent>>>((ref) async {
  final authState = ref.watch(authNotifierProvider);
  final studentId = authState.value?.id;
  
  if (studentId == null) return {};

  final repo = ref.watch(attendanceRepositoryProvider);
  final records = await repo.getStudentAttendance(studentId: studentId);
  
  final Map<DateTime, List<CalendarEvent>> events = {};
  
  for (final record in records) {
    try {
      final date = DateTime.parse(record.date);
      final normalizedDate = DateTime(date.year, date.month, date.day);
      
      final event = CalendarEvent(
        type: _mapStatusToEventType(record.status),
        label: record.status.labelVi,
        description: record.className ?? 'Điểm danh',
        classId: record.classId,
      );
      
      if (events.containsKey(normalizedDate)) {
        events[normalizedDate]!.add(event);
      } else {
        events[normalizedDate] = [event];
      }
    } catch (_) {
      // Ignore invalid dates
    }
  }
  
  return events;
});

EventType _mapStatusToEventType(AttendanceStatus status) {
  switch (status) {
    case AttendanceStatus.present:
      return EventType.present;
    case AttendanceStatus.absent:
      return EventType.absent;
    case AttendanceStatus.late:
      return EventType.late;
    case AttendanceStatus.excused:
      return EventType.excused;
  }
}

enum EventType { present, absent, late, excused, holiday, exam }

class CalendarEvent {
  final EventType type;
  final String label;
  final String? description;
  final String? classId;

  CalendarEvent({
    required this.type,
    required this.label,
    this.description,
    this.classId,
  });

  Color get color {
    switch (type) {
      case EventType.present:
        return AppColors.present;
      case EventType.absent:
        return AppColors.absent;
      case EventType.late:
        return AppColors.late;
      case EventType.excused:
        return AppColors.excused;
      case EventType.holiday:
        return Colors.purple;
      case EventType.exam:
        return Colors.red;
    }
  }

  IconData get icon {
    switch (type) {
      case EventType.present:
        return Icons.check_circle;
      case EventType.absent:
        return Icons.cancel;
      case EventType.late:
        return Icons.schedule;
      case EventType.excused:
        return Icons.info;
      case EventType.holiday:
        return Icons.celebration;
      case EventType.exam:
        return Icons.quiz;
    }
  }
}

class CalendarScreen extends ConsumerWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedDay = ref.watch(selectedDayProvider);
    final eventsAsync = ref.watch(calendarEventsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Lịch'),
        actions: [
          IconButton(
            icon: const Icon(Icons.today),
            onPressed: () {
              ref.read(selectedDayProvider.notifier).state = DateTime.now();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Calendar
          eventsAsync.when(
            data: (events) => _CalendarWidget(
              selectedDay: selectedDay,
              events: events,
              onDaySelected: (day) {
                ref.read(selectedDayProvider.notifier).state = day;
              },
            ),
            loading: () => const SizedBox(
              height: 350,
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (e, _) => Center(child: Text('Error: $e')),
          ),

          const Divider(height: 1),

          // Selected day events
          Expanded(
            child: _DayEventsPanel(
              selectedDay: selectedDay,
              eventsAsync: eventsAsync,
            ),
          ),
        ],
      ),
    );
  }
}

class _CalendarWidget extends StatelessWidget {
  final DateTime selectedDay;
  final Map<DateTime, List<CalendarEvent>> events;
  final ValueChanged<DateTime> onDaySelected;

  const _CalendarWidget({
    required this.selectedDay,
    required this.events,
    required this.onDaySelected,
  });

  @override
  Widget build(BuildContext context) {
    return TableCalendar(
      firstDay: DateTime.now().subtract(const Duration(days: 365)),
      lastDay: DateTime.now().add(const Duration(days: 365)),
      focusedDay: selectedDay,
      selectedDayPredicate: (day) => isSameDay(day, selectedDay),
      onDaySelected: (selected, focused) => onDaySelected(selected),
      calendarFormat: CalendarFormat.month,
      startingDayOfWeek: StartingDayOfWeek.monday,
      headerStyle: HeaderStyle(
        formatButtonVisible: false,
        titleCentered: true,
        titleTextStyle: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 16,
        ),
      ),
      calendarStyle: CalendarStyle(
        todayDecoration: BoxDecoration(
          color: AppColors.primary.withAlpha(50),
          shape: BoxShape.circle,
        ),
        selectedDecoration: BoxDecoration(
          color: AppColors.primary,
          shape: BoxShape.circle,
        ),
        markerDecoration: BoxDecoration(
          color: AppColors.success,
          shape: BoxShape.circle,
        ),
      ),
      eventLoader: (day) {
        final normalizedDay = DateTime(day.year, day.month, day.day);
        return events[normalizedDay] ?? [];
      },
      calendarBuilders: CalendarBuilders(
        markerBuilder: (context, date, eventsList) {
          if (eventsList.isEmpty) return null;
          final event = eventsList.first as CalendarEvent;
          return Positioned(
            bottom: 1,
            child: Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(
                color: event.color,
                shape: BoxShape.circle,
              ),
            ),
          );
        },
      ),
    );
  }
}

class _DayEventsPanel extends StatelessWidget {
  final DateTime selectedDay;
  final AsyncValue<Map<DateTime, List<CalendarEvent>>> eventsAsync;

  const _DayEventsPanel({
    required this.selectedDay,
    required this.eventsAsync,
  });

  @override
  Widget build(BuildContext context) {
    final normalizedDay = DateTime(selectedDay.year, selectedDay.month, selectedDay.day);
    final dayEvents = eventsAsync.value?[normalizedDay] ?? [];

    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            DateFormat('EEEE, d MMMM y', 'vi').format(selectedDay),
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 16),
          if (dayEvents.isEmpty)
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.event_available, size: 48, color: AppColors.textMuted),
                    const SizedBox(height: 8),
                    Text(
                      'Không có sự kiện',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            )
          else
            Expanded(
              child: ListView.builder(
                itemCount: dayEvents.length,
                itemBuilder: (context, index) {
                  final event = dayEvents[index];
                  return Card(
                    child: ListTile(
                      leading: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: event.color.withAlpha(30),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(event.icon, color: event.color),
                      ),
                      title: Text(event.label),
                      subtitle: event.description != null ? Text(event.description!) : null,
                      trailing: event.classId != null ? const Icon(Icons.chevron_right, size: 20) : null,
                      onTap: event.classId != null
                          ? () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => ClassDetailScreen(classId: event.classId!),
                                ),
                              )
                          : null,
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
