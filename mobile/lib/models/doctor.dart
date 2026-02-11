class DoctorAnalysis {
  final String disease;
  final String confidence;
  final String severity;
  final List<String> treatment;

  DoctorAnalysis({
    required this.disease,
    required this.confidence,
    required this.severity,
    required this.treatment,
  });

  factory DoctorAnalysis.fromJson(Map<String, dynamic> json) {
    List<String> treatments = [];
    if (json['treatment'] != null) {
      for (var t in json['treatment'] as List) {
        treatments.add(t.toString());
      }
    }
    return DoctorAnalysis(
      disease: json['disease'] as String? ?? 'Unknown',
      confidence: json['confidence'] as String? ?? 'N/A',
      severity: json['severity'] as String? ?? 'N/A',
      treatment: treatments,
    );
  }
}
