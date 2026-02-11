class CalendarEvent {
  final int id;
  final String date;
  final String title;
  final String type;
  final double? value;

  CalendarEvent({
    required this.id,
    required this.date,
    required this.title,
    required this.type,
    this.value,
  });

  factory CalendarEvent.fromJson(Map<String, dynamic> json) {
    return CalendarEvent(
      id: json['id'] as int,
      date: json['date'] as String? ?? '',
      title: json['title'] as String? ?? '',
      type: json['type'] as String? ?? 'other',
      value: (json['value'] as num?)?.toDouble(),
    );
  }
}
