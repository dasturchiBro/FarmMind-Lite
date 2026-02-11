import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:table_calendar/table_calendar.dart';

import '../models/calendar_event.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  List<CalendarEvent> _events = [];
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _selectedDay = _focusedDay;
    _loadEvents();
  }

  Future<void> _loadEvents() async {
    final user = context.read<AuthProvider>().user;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await ApiService.getCalendarEvents(
        userId: user?.id,
        year: _focusedDay.year,
        month: _focusedDay.month,
      );
      if (mounted) setState(() => _events = list);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<CalendarEvent> _eventsForDay(DateTime day) {
    final d = day.toIso8601String().split('T')[0];
    return _events.where((e) => e.date == d).toList();
  }

  @override
  Widget build(BuildContext context) {
    final dayEvents =
        _selectedDay != null ? _eventsForDay(_selectedDay!) : <CalendarEvent>[];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Seasonal Calendar'),
      ),
      body: Column(
        children: [
          TableCalendar<CalendarEvent>(
            firstDay: DateTime(2020),
            lastDay: DateTime(2030),
            focusedDay: _focusedDay,
            selectedDayPredicate: (d) =>
                _selectedDay != null && isSameDay(_selectedDay, d),
            eventLoader: _eventsForDay,
            calendarFormat: CalendarFormat.month,
            onDaySelected: (sel, focused) {
              setState(() {
                _selectedDay = sel;
                _focusedDay = focused;
              });
            },
            onPageChanged: (focused) {
              setState(() => _focusedDay = focused);
              _loadEvents();
            },
            calendarStyle: CalendarStyle(
              selectedDecoration: const BoxDecoration(
                color: AppTheme.primaryGreen,
                shape: BoxShape.circle,
              ),
              todayDecoration: BoxDecoration(
                color: AppTheme.primaryGreen.withValues(alpha: 0.5),
                shape: BoxShape.circle,
              ),
              markerDecoration: const BoxDecoration(
                color: AppTheme.accentGold,
                shape: BoxShape.circle,
              ),
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.all(8),
              child: Text(_error!, style: const TextStyle(color: Colors.red)),
            ),
          const Divider(),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : dayEvents.isEmpty
                    ? const Center(child: Text('No events for this day'))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: dayEvents.length,
                        itemBuilder: (_, i) {
                          final e = dayEvents[i];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: Icon(
                                _iconForType(e.type),
                                color: AppTheme.primaryGreen,
                              ),
                              title: Text(e.title),
                              subtitle: Text(e.type),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  IconData _iconForType(String type) {
    switch (type.toLowerCase()) {
      case 'irrigation':
        return Icons.water_drop;
      case 'harvest':
        return Icons.agriculture;
      case 'marketplace':
        return Icons.store;
      default:
        return Icons.event;
    }
  }
}
