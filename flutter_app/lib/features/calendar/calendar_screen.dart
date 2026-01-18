/// Calendar Screen - View attendance calendar and events
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';

/// Selected day provider
final selectedDayProvider = StateProvider<DateTime>((ref) => DateTime.now());

/// Calendar events provider (attendance records)
final calendarEventsProvider = FutureProvider<Map<DateTime, List<CalendarEvent>>>((ref) async {
  // TODO: Fetch from Supabase
  await Future.delayed(const Duration(milliseconds: 300));
  
  // Sample data
  final now = DateTime.now();
  return {
    DateTime(now.year, now.month, now.day - 2): [
      CalendarEvent(type: EventType.present, label: 'Có mặt'),
    ],
    DateTime(now.year, now.month, now.day - 1): [
      CalendarEvent(type: EventType.present, label: 'Có mặt'),
    ],
    DateTime(now.year, now.month, now.day): [
      CalendarEvent(type: EventType.present, label: 'Có mặt'),
    ],
    DateTime(now.year, now.month, now.day - 5): [
      CalendarEvent(type: EventType.absent, label: 'Vắng'),
    ],
    DateTime(now.year, now.month, now.day - 7): [
      CalendarEvent(type: EventType.late, label: 'Trễ'),
    ],
  };
});

enum EventType { present, absent, late, excused, holiday, exam }

class CalendarEvent {
  final EventType type;
  final String label;
  final String? description;

  CalendarEvent({required this.type, required this.label, this.description});

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
                      subtitle: event.description != null
                          ? Text(event.description!)
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
