class IrrigationReminder {
  final String date;
  final String stage;
  final String action;
  final String notes;

  IrrigationReminder({
    required this.date,
    required this.stage,
    required this.action,
    required this.notes,
  });

  factory IrrigationReminder.fromJson(Map<String, dynamic> json) {
    return IrrigationReminder(
      date: json['date'] as String? ?? '',
      stage: json['stage'] as String? ?? '',
      action: json['action'] as String? ?? '',
      notes: json['notes'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'date': date,
        'stage': stage,
        'action': action,
        'notes': notes,
      };
}

class SavedIrrigationStep {
  final int id;
  final String date;
  final String stage;
  final String action;
  final String notes;
  final DateTime? completedAt;

  SavedIrrigationStep({
    required this.id,
    required this.date,
    required this.stage,
    required this.action,
    required this.notes,
    this.completedAt,
  });

  factory SavedIrrigationStep.fromJson(Map<String, dynamic> json) {
    DateTime? completed;
    if (json['completed_at'] != null) {
      completed = DateTime.tryParse(json['completed_at'].toString());
    }
    return SavedIrrigationStep(
      id: json['id'] as int,
      date: json['date'] as String? ?? '',
      stage: json['stage'] as String? ?? '',
      action: json['action'] as String? ?? '',
      notes: json['notes'] as String? ?? '',
      completedAt: completed,
    );
  }
}

class SavedIrrigationSchedule {
  final int id;
  final String cropName;
  final String region;
  final String plantingDate;
  final DateTime createdAt;
  final List<SavedIrrigationStep> steps;

  SavedIrrigationSchedule({
    required this.id,
    required this.cropName,
    required this.region,
    required this.plantingDate,
    required this.createdAt,
    required this.steps,
  });

  factory SavedIrrigationSchedule.fromJson(Map<String, dynamic> json) {
    List<SavedIrrigationStep> stepList = [];
    if (json['steps'] != null) {
      for (var s in json['steps'] as List) {
        stepList.add(SavedIrrigationStep.fromJson(s as Map<String, dynamic>));
      }
    }
    return SavedIrrigationSchedule(
      id: json['id'] as int,
      cropName: json['crop_name'] as String? ?? '',
      region: json['region'] as String? ?? '',
      plantingDate: json['planting_date'] as String? ?? '',
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      steps: stepList,
    );
  }
}
