class CropType {
  final int id;
  final String name;

  CropType({
    required this.id,
    required this.name,
  });

  factory CropType.fromJson(Map<String, dynamic> json) {
    return CropType(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
    );
  }
}
